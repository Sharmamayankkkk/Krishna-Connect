-- ============================================================================
-- Follow System Functions
-- ============================================================================
-- This file contains functions for handling follow relationships and counts.

-- ============================================================================
-- Function: get_profile_by_username
-- Returns a profile with follower/following counts from the relationships table
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_profile_by_username(
    p_username TEXT,
    p_requesting_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    name TEXT,
    username TEXT,
    avatar_url TEXT,
    bio TEXT,
    verified BOOLEAN,
    is_private BOOLEAN,
    follower_count BIGINT,
    following_count BIGINT,
    post_count BIGINT,
    is_following BOOLEAN,
    follow_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.username,
        p.avatar_url,
        p.bio,
        p.verified,
        p.is_private,
        -- Count followers (people who follow this profile)
        (SELECT COUNT(*) FROM public.relationships r 
         WHERE r.user_two_id = p.id AND r.status = 'approved')::BIGINT AS follower_count,
        -- Count following (people this profile follows)
        (SELECT COUNT(*) FROM public.relationships r 
         WHERE r.user_one_id = p.id AND r.status = 'approved')::BIGINT AS following_count,
        -- Count posts
        (SELECT COUNT(*) FROM public.posts WHERE user_id = p.id)::BIGINT AS post_count,
        -- Check if requesting user is following this profile
        CASE 
            WHEN p_requesting_user_id IS NULL THEN FALSE
            ELSE EXISTS(
                SELECT 1 FROM public.relationships r
                WHERE r.user_one_id = p_requesting_user_id 
                AND r.user_two_id = p.id 
                AND r.status = 'approved'
            )
        END AS is_following,
        -- Get the follow status (none, pending, approved)
        COALESCE(
            (SELECT r.status::TEXT FROM public.relationships r
             WHERE r.user_one_id = p_requesting_user_id 
             AND r.user_two_id = p.id
             AND r.status IN ('pending', 'approved')
             LIMIT 1),
            'none'
        ) AS follow_status
    FROM public.profiles p
    WHERE LOWER(p.username) = LOWER(p_username);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function: get_user_follower_counts
-- Simple function to get follower/following counts for a user
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_user_follower_counts(target_user_id UUID)
RETURNS TABLE (
    follower_count BIGINT,
    following_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM public.relationships 
         WHERE user_two_id = target_user_id AND status = 'approved')::BIGINT,
        (SELECT COUNT(*) FROM public.relationships 
         WHERE user_one_id = target_user_id AND status = 'approved')::BIGINT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function: get_followers_list
-- Returns list of users who follow a given user
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_followers_list(target_user_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    username TEXT,
    avatar_url TEXT,
    bio TEXT,
    verified BOOLEAN,
    followed_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.username,
        p.avatar_url,
        p.bio,
        p.verified,
        r.created_at AS followed_at
    FROM public.relationships r
    JOIN public.profiles p ON p.id = r.user_one_id
    WHERE r.user_two_id = target_user_id 
    AND r.status = 'approved'
    ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Function: get_following_list
-- Returns list of users that a given user follows
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_following_list(target_user_id UUID)
RETURNS TABLE (
    id UUID,
    name TEXT,
    username TEXT,
    avatar_url TEXT,
    bio TEXT,
    verified BOOLEAN,
    followed_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.name,
        p.username,
        p.avatar_url,
        p.bio,
        p.verified,
        r.created_at AS followed_at
    FROM public.relationships r
    JOIN public.profiles p ON p.id = r.user_two_id
    WHERE r.user_one_id = target_user_id 
    AND r.status = 'approved'
    ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
