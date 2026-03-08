-- ============================================================================
-- 006_notifications_v2.sql
-- Upgrades the notifications system to support complex metadata and string reference IDs.
-- Refactors get_user_notifications to return metadata directly.
-- ============================================================================

-- 1. Expanding the ENUM using a DO block to catch if they already exist
DO $$
BEGIN
    ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'poll_vote';
    ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'livestream_invite';
    ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'challenge_invite';
    ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'challenge_submission';
    ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'challenge_approved';
    ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'challenge_rejected';
    ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'challenge_won';
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Altering table to add reference_id (TEXT wrapper for entity_id to support UUIDs) and metadata
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS reference_id TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- 3. Backfill reference_id from entity_id for older rows
UPDATE public.notifications SET reference_id = entity_id::TEXT WHERE entity_id IS NOT NULL AND reference_id IS NULL;

-- 4. Re-creating trigger function to capture partial context in metadata for immediate visual rendering 
--    (this avoids needing massive left joins on posts/comments etc later)
CREATE OR REPLACE FUNCTION public.handle_new_trigger_notification()
RETURNS TRIGGER AS $$
DECLARE
    actor_id     UUID;
    v_entity_id  BIGINT;
    notif_type   TEXT;
    recipient_id UUID;
    v_metadata   JSONB := '{}'::jsonb;
BEGIN
    actor_id  := NEW.user_id;
    v_entity_id := NEW.post_id;

    IF TG_TABLE_NAME = 'post_likes' THEN
        notif_type := 'new_like';
        SELECT user_id INTO recipient_id FROM public.posts WHERE id = NEW.post_id;
        
        -- Optionally grab snippet for better UX immediately
        SELECT jsonb_build_object(
            'post_content', SUBSTRING(content FROM 1 FOR 100),
            'post_media_type', CASE WHEN media_urls IS NOT NULL AND jsonb_array_length(media_urls) > 0 THEN media_urls->0->>'type' ELSE NULL END
        ) INTO v_metadata
        FROM public.posts WHERE id = NEW.post_id;

    ELSIF TG_TABLE_NAME = 'comments' THEN
        notif_type := 'new_comment';
        SELECT user_id INTO recipient_id FROM public.posts WHERE id = NEW.post_id;
        
        v_metadata := jsonb_build_object(
            'comment_content', SUBSTRING(NEW.content FROM 1 FOR 100)
        );

    ELSIF TG_TABLE_NAME = 'post_reposts' THEN
        notif_type := 'new_repost';
        SELECT user_id INTO recipient_id FROM public.posts WHERE id = NEW.post_id;
    END IF;

    IF recipient_id IS NOT NULL AND recipient_id != actor_id THEN
        INSERT INTO public.notifications (user_id, actor_id, type, entity_id, reference_id, entity_type, metadata)
        VALUES (recipient_id, actor_id, notif_type::public.notification_type, v_entity_id, v_entity_id::TEXT, 'post', v_metadata);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. Complete override of get_user_notifications to expose metadata and reference_id natively
DROP FUNCTION IF EXISTS public.get_user_notifications(INT, INT);
CREATE OR REPLACE FUNCTION public.get_user_notifications(p_limit INT DEFAULT 50, p_offset INT DEFAULT 0)
RETURNS TABLE (
    id BIGINT, user_id UUID, actor_id UUID, type TEXT, entity_id BIGINT, reference_id TEXT,
    is_read BOOLEAN, created_at TIMESTAMPTZ,
    actor_name TEXT, actor_username TEXT, actor_avatar_url TEXT, actor_verified TEXT,
    metadata JSONB,
    post_content TEXT, post_media_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        n.id, n.user_id, n.actor_id, n.type::TEXT, n.entity_id, 
        COALESCE(n.reference_id, n.entity_id::TEXT) AS reference_id,
        n.is_read, n.created_at,
        p.name, p.username, p.avatar_url, p.verified,
        CASE WHEN n.metadata IS NOT NULL AND n.metadata != '{}'::jsonb THEN
            n.metadata
        ELSE
            -- Dynamically construct metadata for older notifications
            jsonb_build_object(
                'post_content', CASE WHEN n.entity_id IS NOT NULL AND n.type::TEXT IN ('new_like', 'new_comment', 'new_repost', 'mention', 'collaboration_request') THEN SUBSTRING(posts.content FROM 1 FOR 100) ELSE NULL END,
                'comment_content', CASE WHEN n.type::TEXT = 'new_comment' THEN SUBSTRING(n.metadata->>'comment_content' FROM 1 FOR 100) ELSE NULL END, -- Note: Legacy didn't store comment content, handled best-effort
                'post_media_type', CASE WHEN posts.poll IS NOT NULL THEN 'poll' WHEN n.entity_id IS NOT NULL AND posts.media_urls IS NOT NULL AND jsonb_array_length(posts.media_urls) > 0 THEN posts.media_urls->0->>'type' ELSE (CASE WHEN posts.content IS NOT NULL AND posts.content != '' THEN 'text' ELSE NULL END) END,
                'post_media_url', CASE WHEN n.entity_id IS NOT NULL AND posts.media_urls IS NOT NULL AND jsonb_array_length(posts.media_urls) > 0 THEN posts.media_urls->0->>'url' ELSE NULL END
            )
        END AS metadata,
        
        -- Fallbacks for strict schema legacy UI references (can be ignored over time)
        CASE WHEN n.entity_id IS NOT NULL AND n.type::TEXT IN ('new_like', 'new_comment', 'new_repost', 'mention', 'collaboration_request')
             THEN SUBSTRING(posts.content FROM 1 FOR 100) ELSE NULL END,
        CASE WHEN n.entity_id IS NOT NULL AND posts.media_urls IS NOT NULL
                  AND jsonb_array_length(posts.media_urls) > 0 
             THEN posts.media_urls->0->>'type' ELSE NULL END
             
    FROM public.notifications n
    LEFT JOIN public.profiles p    ON n.actor_id  = p.id
    LEFT JOIN public.posts    posts ON n.entity_id = posts.id AND n.entity_type IN ('post', NULL)
    WHERE n.user_id = auth.uid()
    ORDER BY n.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- 6. Trigger a reload
NOTIFY pgrst, 'reload schema';
