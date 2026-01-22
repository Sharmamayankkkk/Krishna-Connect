-- ============================================================================
-- Profile Banner and Extended Fields
-- ============================================================================
-- Adds banner_url, location, and website columns to the profiles table.

-- Add banner_url column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS banner_url TEXT;

-- Add location column
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS location TEXT;

-- Add website column  
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS website TEXT;

-- Add created_at column if it doesn't exist (for "Joined" date)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================================
-- IMPORTANT: Drop existing function first (required to change return type)
-- ============================================================================
DROP FUNCTION IF EXISTS public.get_profile_by_username(TEXT, UUID);

-- ============================================================================
-- Updated get_profile_by_username function with new fields
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
    banner_url TEXT,
    bio TEXT,
    location TEXT,
    website TEXT,
    verified BOOLEAN,
    is_private BOOLEAN,
    created_at TIMESTAMPTZ,
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
        p.banner_url,
        p.bio,
        p.location,
        p.website,
        p.verified,
        p.is_private,
        p.created_at,
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
-- Function to update profile
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_profile(
    p_name TEXT DEFAULT NULL,
    p_bio TEXT DEFAULT NULL,
    p_location TEXT DEFAULT NULL,
    p_website TEXT DEFAULT NULL,
    p_avatar_url TEXT DEFAULT NULL,
    p_banner_url TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.profiles
    SET 
        name = COALESCE(p_name, name),
        bio = COALESCE(p_bio, bio),
        location = COALESCE(p_location, location),
        website = COALESCE(p_website, website),
        avatar_url = COALESCE(p_avatar_url, avatar_url),
        banner_url = COALESCE(p_banner_url, banner_url)
    WHERE id = auth.uid();
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
