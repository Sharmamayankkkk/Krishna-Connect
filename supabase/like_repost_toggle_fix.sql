-- ============================================================================
-- LIKE AND REPOST TOGGLE FIX
-- ============================================================================
-- This file fixes the duplicate key constraint errors when liking/reposting
-- by creating RPC functions that handle the toggle logic atomically
-- ============================================================================

-- ============================================================================
-- SECTION 1: DROP EXISTING FUNCTIONS (if they exist)
-- ============================================================================

DROP FUNCTION IF EXISTS public.toggle_post_like(BIGINT);
DROP FUNCTION IF EXISTS public.toggle_post_repost(BIGINT);
DROP FUNCTION IF EXISTS public.toggle_comment_like(BIGINT);

-- ============================================================================
-- SECTION 2: LIKE TOGGLE FUNCTION
-- ============================================================================

-- Function to toggle like on a post
-- This prevents duplicate key errors by checking existence first
CREATE OR REPLACE FUNCTION public.toggle_post_like(p_post_id BIGINT)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_is_liked BOOLEAN;
BEGIN
    -- Check if already liked
    SELECT EXISTS(
        SELECT 1 FROM public.post_likes 
        WHERE post_id = p_post_id AND user_id = v_user_id
    ) INTO v_is_liked;

    IF v_is_liked THEN
        -- Unlike: Remove the like
        DELETE FROM public.post_likes
        WHERE post_id = p_post_id AND user_id = v_user_id;
        
        RETURN jsonb_build_object('action', 'unliked', 'is_liked', false);
    ELSE
        -- Like: Insert the like (with ON CONFLICT to prevent duplicates)
        INSERT INTO public.post_likes (post_id, user_id)
        VALUES (p_post_id, v_user_id)
        ON CONFLICT (user_id, post_id) DO NOTHING;
        
        RETURN jsonb_build_object('action', 'liked', 'is_liked', true);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- ============================================================================
-- SECTION 3: REPOST TOGGLE FUNCTION
-- ============================================================================

-- Function to toggle repost on a post
CREATE OR REPLACE FUNCTION public.toggle_post_repost(p_post_id BIGINT)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_is_reposted BOOLEAN;
BEGIN
    -- Check if already reposted
    SELECT EXISTS(
        SELECT 1 FROM public.post_reposts 
        WHERE post_id = p_post_id AND user_id = v_user_id
    ) INTO v_is_reposted;

    IF v_is_reposted THEN
        -- Unrepost: Remove the repost
        DELETE FROM public.post_reposts
        WHERE post_id = p_post_id AND user_id = v_user_id;
        
        RETURN jsonb_build_object('action', 'unreposted', 'is_reposted', false);
    ELSE
        -- Repost: Insert the repost (with ON CONFLICT to prevent duplicates)
        INSERT INTO public.post_reposts (post_id, user_id)
        VALUES (p_post_id, v_user_id)
        ON CONFLICT (user_id, post_id) DO NOTHING;
        
        RETURN jsonb_build_object('action', 'reposted', 'is_reposted', true);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- ============================================================================
-- SECTION 4: COMMENT LIKE TOGGLE FUNCTION
-- ============================================================================

-- Function to toggle like on a comment
CREATE OR REPLACE FUNCTION public.toggle_comment_like(p_comment_id BIGINT)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_is_liked BOOLEAN;
BEGIN
    -- Check if already liked
    SELECT EXISTS(
        SELECT 1 FROM public.comment_likes 
        WHERE comment_id = p_comment_id AND user_id = v_user_id
    ) INTO v_is_liked;

    IF v_is_liked THEN
        -- Unlike: Remove the like
        DELETE FROM public.comment_likes
        WHERE comment_id = p_comment_id AND user_id = v_user_id;
        
        RETURN jsonb_build_object('action', 'unliked', 'is_liked', false);
    ELSE
        -- Like: Insert the like (with ON CONFLICT to prevent duplicates)
        INSERT INTO public.comment_likes (comment_id, user_id)
        VALUES (p_comment_id, v_user_id)
        ON CONFLICT (user_id, comment_id) DO NOTHING;
        
        RETURN jsonb_build_object('action', 'liked', 'is_liked', true);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- ============================================================================
-- SECTION 5: GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.toggle_post_like(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_post_repost(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_comment_like(BIGINT) TO authenticated;

-- ============================================================================
-- END OF FILE
-- ============================================================================
