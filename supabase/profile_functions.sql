-- ============================================================================
-- FUNCTION: get_profile_by_username
-- Purpose: Fetches a user's public profile details, follower/following counts,
--          and the follow status relative to the requesting user.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_profile_by_username(
    p_username TEXT,
    p_requesting_user_id UUID
)
RETURNS TABLE (
    id UUID,
    username TEXT,
    full_name TEXT,
    bio TEXT,
    avatar_url TEXT,
    is_verified BOOLEAN,
    follower_count BIGINT,
    following_count BIGINT,
    is_following BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.username,
        p.full_name,
        p.bio,
        p.avatar_url,
        p.verified AS is_verified,
        (SELECT COUNT(*) FROM public.followers WHERE following_id = p.id) AS follower_count,
        (SELECT COUNT(*) FROM public.followers WHERE follower_id = p.id) AS following_count,
        EXISTS (
            SELECT 1
            FROM public.followers f
            WHERE f.follower_id = p_requesting_user_id AND f.following_id = p.id
        ) AS is_following
    FROM
        public.profiles p
    WHERE
        p.username = p_username;
END;
$$;
