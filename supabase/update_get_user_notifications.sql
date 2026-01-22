-- ============================================================================
-- UPDATE GET_USER_NOTIFICATIONS
-- ============================================================================
-- This script updates the get_user_notifications function to include
-- post preview information (content snippet and media type).
-- ============================================================================

-- Drop the function first because we are changing the return type
DROP FUNCTION IF EXISTS public.get_user_notifications(INT, INT);

CREATE OR REPLACE FUNCTION public.get_user_notifications(p_limit INT DEFAULT 50, p_offset INT DEFAULT 0)
RETURNS TABLE (
    id BIGINT,
    user_id UUID,
    actor_id UUID,
    type TEXT,
    entity_id BIGINT,
    is_read BOOLEAN,
    created_at TIMESTAMPTZ,
    actor_name TEXT,
    actor_username TEXT,
    actor_avatar_url TEXT,
    actor_verified BOOLEAN,
    post_content TEXT,
    post_media_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.user_id,
        n.actor_id,
        n.type::TEXT,
        n.entity_id,
        n.is_read,
        n.created_at,
        p.name AS actor_name,
        p.username AS actor_username,
        p.avatar_url AS actor_avatar_url,
        p.verified AS actor_verified,
        CASE 
            WHEN n.type::text IN ('new_like', 'new_comment', 'new_repost', 'collaboration_request') AND n.entity_id IS NOT NULL THEN
                SUBSTRING(posts.content FROM 1 FOR 100)
            ELSE NULL
        END AS post_content,
        CASE
            WHEN n.type::text IN ('new_like', 'new_comment', 'new_repost', 'collaboration_request') AND n.entity_id IS NOT NULL AND jsonb_array_length(posts.media_urls) > 0 THEN
                posts.media_urls->0->>'type'
            ELSE NULL
        END AS post_media_type
    FROM public.notifications n
    LEFT JOIN public.profiles p ON n.actor_id = p.id
    LEFT JOIN public.posts posts ON n.entity_id = posts.id
    WHERE n.user_id = auth.uid()
    ORDER BY n.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

GRANT EXECUTE ON FUNCTION public.get_user_notifications(INT, INT) TO authenticated;
