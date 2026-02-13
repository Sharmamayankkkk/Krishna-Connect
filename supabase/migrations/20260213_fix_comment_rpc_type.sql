-- Fix get_post_comments RPC to return user_verified as TEXT (not BOOLEAN)
DROP FUNCTION IF EXISTS public.get_post_comments(bigint);

CREATE OR REPLACE FUNCTION public.get_post_comments(p_post_id BIGINT)
RETURNS TABLE (
    id BIGINT, 
    user_id UUID, 
    post_id BIGINT, 
    parent_comment_id BIGINT, 
    content TEXT, 
    created_at TIMESTAMPTZ, 
    updated_at TIMESTAMPTZ,
    is_pinned BOOLEAN,
    is_hidden BOOLEAN,
    user_name TEXT, 
    user_username TEXT, 
    user_avatar_url TEXT, 
    user_verified TEXT, -- Changed from BOOLEAN to TEXT
    like_count BIGINT,
    reply_count BIGINT,
    is_liked BOOLEAN
) AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    RETURN QUERY
    SELECT 
        c.id, 
        c.user_id, 
        c.post_id, 
        c.parent_comment_id, 
        c.content, 
        c.created_at, 
        c.updated_at,
        c.is_pinned,
        c.is_hidden,
        p.name, 
        p.username, 
        p.avatar_url, 
        p.verified, -- This is already TEXT
        COALESCE(COUNT(DISTINCT cl.user_id), 0)::BIGINT as like_count,
        COALESCE(COUNT(DISTINCT r.id), 0)::BIGINT as reply_count,
        EXISTS(SELECT 1 FROM public.comment_likes my_cl WHERE my_cl.comment_id = c.id AND my_cl.user_id = v_user_id) as is_liked
    FROM public.comments c
    LEFT JOIN public.profiles p ON c.user_id = p.id
    LEFT JOIN public.comment_likes cl ON c.id = cl.comment_id
    LEFT JOIN public.comments r ON r.parent_comment_id = c.id
    WHERE c.post_id = p_post_id
    GROUP BY c.id, p.id
    ORDER BY c.is_pinned DESC, c.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
