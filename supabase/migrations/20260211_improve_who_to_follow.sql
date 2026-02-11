-- Update get_who_to_follow to return follower counts
DROP FUNCTION IF EXISTS public.get_who_to_follow(INT);

CREATE OR REPLACE FUNCTION public.get_who_to_follow(limit_count INT DEFAULT 5)
RETURNS TABLE (
    id UUID, 
    username TEXT, 
    name TEXT, 
    avatar_url TEXT, 
    verified TEXT, 
    bio TEXT,
    followers_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id, 
        p.username, 
        COALESCE(p.name, p.username), 
        COALESCE(p.avatar_url, ''), 
        p.verified::TEXT, -- Explicitly cast to prevent type mismatch if column is boolean
        COALESCE(p.bio, ''),
        (SELECT COUNT(*) FROM public.relationships r WHERE r.user_two_id = p.id AND r.status = 'approved')::BIGINT AS followers_count
    FROM profiles p
    WHERE p.id != auth.uid()
    AND p.id NOT IN (SELECT target_user_id FROM public.relationships WHERE user_one_id = auth.uid() AND status = 'approved')
    ORDER BY RANDOM()
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
