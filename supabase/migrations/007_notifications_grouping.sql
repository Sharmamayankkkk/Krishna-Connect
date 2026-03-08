-- ============================================================================
-- 007_notifications_grouping.sql
-- Upgrades the notification triggers to handle:
-- 1. DELETE retractions (accidental likes/unlikes/unfollows)
-- 2. Notification Grouping (combining multiple likes on a post into one row)
-- ============================================================================

-- 1. Redefine triggers to fire on both INSERT and DELETE
DROP TRIGGER IF EXISTS on_new_like_create_notification ON public.post_likes;
DROP TRIGGER IF EXISTS on_new_comment_create_notification ON public.comments;
DROP TRIGGER IF EXISTS on_new_repost_create_notification ON public.post_reposts;

CREATE TRIGGER on_new_like_create_notification
    AFTER INSERT OR DELETE ON public.post_likes
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_trigger_notification();

CREATE TRIGGER on_new_comment_create_notification
    AFTER INSERT OR DELETE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_trigger_notification();

CREATE TRIGGER on_new_repost_create_notification
    AFTER INSERT OR DELETE ON public.post_reposts
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_trigger_notification();

-- 2. Modify the main trigger function to handle TG_OP (INSERT vs DELETE)
CREATE OR REPLACE FUNCTION public.handle_new_trigger_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_actor_id     UUID;
    v_entity_id    BIGINT;
    v_notif_type   TEXT;
    v_recipient_id UUID;
    v_metadata     JSONB := '{}'::jsonb;
    v_existing_id  BIGINT;
    v_group_count  INT;
BEGIN
    -- Handle DELETE Operations (Retractions)
    IF TG_OP = 'DELETE' THEN
        IF TG_TABLE_NAME = 'post_likes' THEN
            v_actor_id := OLD.user_id;
            v_entity_id := OLD.post_id;
            v_notif_type := 'new_like';
        ELSIF TG_TABLE_NAME = 'comments' THEN
            v_actor_id := OLD.user_id;
            v_entity_id := OLD.post_id;
            v_notif_type := 'new_comment';
        ELSIF TG_TABLE_NAME = 'post_reposts' THEN
            v_actor_id := OLD.user_id;
            v_entity_id := OLD.post_id;
            v_notif_type := 'new_repost';
        END IF;

        -- We assume it's a post event, meaning the notification is tied to entity_id and type
        -- Find if there is a grouped notification
        SELECT id INTO v_existing_id
        FROM public.notifications
        WHERE entity_id = v_entity_id 
          AND type::TEXT = v_notif_type;
              
            IF v_existing_id IS NOT NULL THEN
                -- If it's the exact same user who caused the latest update to the row, and there are NO others.. delete it
                DELETE FROM public.notifications
                WHERE id = v_existing_id AND actor_id = v_actor_id AND (metadata->>'grouped_count' IS NULL OR (metadata->>'grouped_count')::int <= 1);
                
                -- If grouped count > 1, decrement it (we don't change the actor_id because finding the "previous" actor_id requires another query. 
                -- Decrementing the count is sufficient for UX usually, or it just reads "User and 2 others liked" -> "User and 1 other liked")
            UPDATE public.notifications
            SET metadata = jsonb_set(metadata, '{grouped_count}', ((COALESCE((metadata->>'grouped_count')::int, 1) - 1)::text)::jsonb)
            WHERE id = v_existing_id AND actor_id != v_actor_id AND (metadata->>'grouped_count')::int > 1;
        END IF;
        
        RETURN OLD;
    END IF;

    -- Handle INSERT Operations
    IF TG_OP = 'INSERT' THEN
        v_actor_id  := NEW.user_id;
        v_entity_id := NEW.post_id;

        IF TG_TABLE_NAME = 'post_likes' THEN
            v_notif_type := 'new_like';
            SELECT user_id INTO v_recipient_id FROM public.posts WHERE id = NEW.post_id;
            
            SELECT jsonb_build_object(
                'post_content', SUBSTRING(content FROM 1 FOR 100),
                'post_media_type', CASE WHEN poll IS NOT NULL THEN 'poll' WHEN media_urls IS NOT NULL AND jsonb_array_length(media_urls) > 0 THEN media_urls->0->>'type' ELSE (CASE WHEN content IS NOT NULL AND content != '' THEN 'text' ELSE NULL END) END,
                'post_media_url', CASE WHEN media_urls IS NOT NULL AND jsonb_array_length(media_urls) > 0 THEN media_urls->0->>'url' ELSE NULL END
            ) INTO v_metadata
            FROM public.posts WHERE id = NEW.post_id;

        ELSIF TG_TABLE_NAME = 'comments' THEN
            v_notif_type := 'new_comment';
            SELECT user_id INTO v_recipient_id FROM public.posts WHERE id = NEW.post_id;
            
            SELECT jsonb_build_object(
                'comment_content', SUBSTRING(NEW.content FROM 1 FOR 100),
                'post_content', SUBSTRING(content FROM 1 FOR 100),
                'post_media_type', CASE WHEN poll IS NOT NULL THEN 'poll' WHEN media_urls IS NOT NULL AND jsonb_array_length(media_urls) > 0 THEN media_urls->0->>'type' ELSE (CASE WHEN content IS NOT NULL AND content != '' THEN 'text' ELSE NULL END) END,
                'post_media_url', CASE WHEN media_urls IS NOT NULL AND jsonb_array_length(media_urls) > 0 THEN media_urls->0->>'url' ELSE NULL END
            ) INTO v_metadata
            FROM public.posts WHERE id = NEW.post_id;

        ELSIF TG_TABLE_NAME = 'post_reposts' THEN
            v_notif_type := 'new_repost';
            SELECT user_id INTO v_recipient_id FROM public.posts WHERE id = NEW.post_id;
            
            SELECT jsonb_build_object(
                'post_media_type', CASE WHEN poll IS NOT NULL THEN 'poll' WHEN media_urls IS NOT NULL AND jsonb_array_length(media_urls) > 0 THEN media_urls->0->>'type' ELSE (CASE WHEN content IS NOT NULL AND content != '' THEN 'text' ELSE NULL END) END,
                'post_media_url', CASE WHEN media_urls IS NOT NULL AND jsonb_array_length(media_urls) > 0 THEN media_urls->0->>'url' ELSE NULL END
            ) INTO v_metadata
            FROM public.posts WHERE id = NEW.post_id;
            
        END IF;

        IF v_recipient_id IS NOT NULL AND v_recipient_id != v_actor_id THEN
            
            -- GROUPING LOGIC for Likes and Reposts (Events tied to a specific single entity instead of comments which are distinct)
            IF v_notif_type IN ('new_like', 'new_repost') THEN
                SELECT id, COALESCE((metadata->>'grouped_count')::int, 1) INTO v_existing_id, v_group_count
                FROM public.notifications
                WHERE entity_id = v_entity_id AND type::TEXT = v_notif_type AND user_id = v_recipient_id
                LIMIT 1;

                IF v_existing_id IS NOT NULL THEN
                    -- Upsert existing row
                    UPDATE public.notifications
                    SET actor_id = v_actor_id, -- Make the latest liker the primary actor
                        is_read = FALSE,
                        created_at = NOW(),
                        metadata = jsonb_set(metadata, '{grouped_count}', ((v_group_count + 1)::text)::jsonb)
                    WHERE id = v_existing_id;
                    
                    RETURN NEW;
                END IF;
            END IF;
            
            -- Normal Insert if no grouping happens
            INSERT INTO public.notifications (user_id, actor_id, type, entity_id, reference_id, entity_type, metadata)
            VALUES (v_recipient_id, v_actor_id, v_notif_type::public.notification_type, v_entity_id, v_entity_id::TEXT, 
                    'post', 
                    jsonb_set(v_metadata, '{grouped_count}', '1'::jsonb));
        END IF;
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger schema reload
NOTIFY pgrst, 'reload schema';
