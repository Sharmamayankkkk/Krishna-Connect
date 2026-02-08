-- 1. Fix Promoted Posts RPC (Drop & Recreate)
DROP FUNCTION IF EXISTS public.get_active_promoted_posts(INT);

CREATE OR REPLACE FUNCTION public.get_active_promoted_posts(p_limit INT DEFAULT 3)
RETURNS SETOF posts
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.posts
    WHERE is_promoted = TRUE
      AND promoted_until > NOW()
    ORDER BY RANDOM()
    LIMIT p_limit;
END;
$$;

-- 2. Standardize Profile Posts RPC
-- This ensures profile posts use the same efficient fetching as the feed
DROP FUNCTION IF EXISTS public.get_posts_by_user_id(UUID);
DROP FUNCTION IF EXISTS public.get_posts_by_user_id(UUID, INT, INT);

CREATE OR REPLACE FUNCTION public.get_posts_by_user_id(
    p_user_id UUID,
    p_limit INT DEFAULT 10,
    p_offset INT DEFAULT 0
)
RETURNS SETOF posts
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT *
    FROM public.posts
    WHERE user_id = p_user_id
    ORDER BY created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 3. Get Post Likes RPC
-- Used for the "Liked By" dialog
CREATE OR REPLACE FUNCTION public.get_post_likes_users(p_post_id BIGINT)
RETURNS TABLE (
    user_id UUID,
    username TEXT,
    name TEXT,
    avatar_url TEXT,
    verified BOOLEAN,
    bio TEXT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.username,
        u.name,
        u.avatar_url,
        u.verified,
        u.bio
    FROM public.post_likes pl
    JOIN public.profiles u ON pl.user_id = u.id
    WHERE pl.post_id = p_post_id
    ORDER BY pl.created_at DESC;
END;
$$;
