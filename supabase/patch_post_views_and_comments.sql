-- ============================================================================
-- patch_post_views_and_comments.sql
-- Run this in your Supabase SQL editor.
--
-- Fixes:
--   1. get_post_comments — add is_liked column so the UI can correctly show
--      the current user's like state on each comment.
--   2. log_post_view — deduplicate per authenticated user so the same user
--      cannot inflate the view counter by visiting a post multiple times.
--   3. log_post_views_bulk — new bulk function called by the frontend feed
--      to batch-log post views every 5 seconds.
-- ============================================================================


-- ============================================================================
-- FIX 1: get_post_comments — add is_liked for current user
-- ============================================================================
-- The old version did not return whether the calling user had liked each
-- comment, so every comment always displayed as "not liked" in the UI.
-- ----------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_post_comments(BIGINT);
CREATE OR REPLACE FUNCTION public.get_post_comments(p_post_id BIGINT)
RETURNS TABLE (
    id                BIGINT,
    user_id           UUID,
    post_id           BIGINT,
    parent_comment_id BIGINT,
    content           TEXT,
    created_at        TIMESTAMPTZ,
    user_name         TEXT,
    user_username     TEXT,
    user_avatar_url   TEXT,
    user_verified     TEXT,
    like_count        BIGINT,
    is_pinned         BOOLEAN,
    is_hidden         BOOLEAN,
    is_liked          BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.user_id,
        c.post_id,
        c.parent_comment_id,
        c.content,
        c.created_at,
        p.name,
        p.username,
        p.avatar_url,
        p.verified,
        COALESCE(COUNT(cl.user_id), 0)::BIGINT,
        c.is_pinned,
        c.is_hidden,
        EXISTS(
            SELECT 1 FROM public.comment_likes cl2
            WHERE cl2.comment_id = c.id AND cl2.user_id = auth.uid()
        )
    FROM public.comments c
    LEFT JOIN public.profiles      p  ON c.user_id    = p.id
    LEFT JOIN public.comment_likes cl ON c.id         = cl.comment_id
    WHERE c.post_id = p_post_id
      AND (c.is_hidden = false OR c.user_id = auth.uid())
    GROUP BY c.id, p.id
    ORDER BY c.is_pinned DESC, c.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;


-- ============================================================================
-- FIX 2: log_post_view — deduplicate per authenticated user
-- ============================================================================
-- The old version inserted a row unconditionally, meaning visiting the same
-- post multiple times kept incrementing views_count via the trigger.
-- Now authenticated users only count once; anonymous views are still tracked.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_post_view(p_post_id BIGINT)
RETURNS VOID AS $$
BEGIN
    IF auth.uid() IS NOT NULL THEN
        -- Only record the first view for authenticated users
        IF NOT EXISTS (
            SELECT 1 FROM public.post_views
            WHERE post_id = p_post_id AND user_id = auth.uid()
        ) THEN
            INSERT INTO public.post_views (post_id, user_id)
            VALUES (p_post_id, auth.uid());
        END IF;
    ELSE
        -- Always record anonymous views (cannot deduplicate without identity)
        INSERT INTO public.post_views (post_id, user_id) VALUES (p_post_id, NULL);
    END IF;
EXCEPTION WHEN OTHERS THEN
    NULL; -- Silently ignore errors so the UI is never blocked
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- FIX 3: log_post_views_bulk — new function for batch view logging
-- ============================================================================
-- The frontend (feed-list.tsx) batches viewed post IDs every 5 seconds and
-- calls this RPC. The function did not exist before, so all feed view events
-- were silently lost.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.log_post_views_bulk(p_post_ids BIGINT[])
RETURNS VOID AS $$
DECLARE
    v_post_id BIGINT;
BEGIN
    FOREACH v_post_id IN ARRAY p_post_ids
    LOOP
        IF auth.uid() IS NOT NULL THEN
            IF NOT EXISTS (
                SELECT 1 FROM public.post_views
                WHERE post_id = v_post_id AND user_id = auth.uid()
            ) THEN
                INSERT INTO public.post_views (post_id, user_id)
                VALUES (v_post_id, auth.uid());
            END IF;
        ELSE
            INSERT INTO public.post_views (post_id, user_id) VALUES (v_post_id, NULL);
        END IF;
    END LOOP;
EXCEPTION WHEN OTHERS THEN
    NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Allow authenticated and anonymous callers to execute these functions
GRANT EXECUTE ON FUNCTION public.log_post_view(BIGINT)        TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.log_post_views_bulk(BIGINT[]) TO authenticated, anon;

-- Reload PostgREST schema cache so the new function signature is visible
NOTIFY pgrst, 'reload schema';
