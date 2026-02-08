-- Fix get_user_notifications RPC to use correct enum values
-- Prevents "invalid input value for enum notification_type: like" error

CREATE OR REPLACE FUNCTION public.get_user_notifications(p_limit INT DEFAULT 50, p_offset INT DEFAULT 0)
RETURNS TABLE (
    id BIGINT, user_id UUID, actor_id UUID, type TEXT, entity_id BIGINT, is_read BOOLEAN, created_at TIMESTAMPTZ,
    actor_name TEXT, actor_username TEXT, actor_avatar_url TEXT, actor_verified BOOLEAN,
    post_content TEXT, post_media_type TEXT, post_author_username TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id, n.user_id, n.actor_id, n.type::TEXT, n.entity_id, n.is_read, n.created_at,
        p.name, p.username, p.avatar_url, p.verified,
        -- Fix: Use correct enum values (new_like, new_comment, etc.)
        CASE 
            WHEN n.type IN ('new_like', 'new_comment', 'new_repost', 'collaboration_request', 'mention') AND n.entity_id IS NOT NULL 
            THEN SUBSTRING(posts.content FROM 1 FOR 100) 
            ELSE NULL 
        END,
        CASE 
            WHEN n.type IN ('new_like', 'new_comment', 'new_repost', 'collaboration_request', 'mention') AND n.entity_id IS NOT NULL AND jsonb_array_length(posts.media_urls) > 0 
            THEN posts.media_urls->0->>'type' 
            ELSE NULL 
        END,
        post_author.username -- Fetch post author username
    FROM public.notifications n
    LEFT JOIN public.profiles p ON n.actor_id = p.id
    LEFT JOIN public.posts posts ON n.entity_id = posts.id
    LEFT JOIN public.profiles post_author ON posts.user_id = post_author.id -- Join to get post author
    WHERE n.user_id = auth.uid()
    ORDER BY n.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
