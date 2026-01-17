-- ============================================================================
-- FUNCTION: get_posts_by_user_id
-- Purpose: Fetches all posts created by a specific user.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_posts_by_user_id(p_user_id UUID)
RETURNS TABLE (
    id BIGINT,
    content TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        posts.id,
        posts.content,
        posts.created_at
    FROM
        public.posts
    WHERE
        posts.user_id = p_user_id
    ORDER BY
        posts.created_at DESC;
END;
$$;

-- ============================================================================
-- FUNCTION: get_followers_by_user_id
-- Purpose: Fetches a list of users who are following a specific user.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_followers_by_user_id(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.username,
        p.full_name,
        p.avatar_url
    FROM
        public.followers f
    JOIN
        public.profiles p ON f.follower_id = p.id
    WHERE
        f.following_id = p_user_id
    ORDER BY
        f.created_at DESC;
END;
$$;

-- ============================================================================
-- FUNCTION: get_following_by_user_id
-- Purpose: Fetches a list of users that a specific user is following.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_following_by_user_id(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    username TEXT,
    full_name TEXT,
    avatar_url TEXT
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.username,
        p.full_name,
        p.avatar_url
    FROM
        public.followers f
    JOIN
        public.profiles p ON f.following_id = p.id
    WHERE
        f.follower_id = p_user_id
    ORDER BY
        f.created_at DESC;
END;
$$;
