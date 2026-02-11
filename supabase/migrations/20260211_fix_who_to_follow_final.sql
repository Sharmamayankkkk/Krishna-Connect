-- Final fix for get_who_to_follow
-- Drops potential conflicting signatures
DROP FUNCTION IF EXISTS public.get_who_to_follow(INT);
DROP FUNCTION IF EXISTS public.get_who_to_follow(INTEGER);

-- Create function with explicit return types matching the query
CREATE OR REPLACE FUNCTION public.get_who_to_follow(limit_count INT)
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
        COALESCE(p.name, p.username)::TEXT, 
        COALESCE(p.avatar_url, '')::TEXT, 
        p.verified::TEXT, 
        COALESCE(p.bio, '')::TEXT,
        (SELECT COUNT(*) FROM public.relationships r WHERE r.user_two_id = p.id AND r.status = 'approved')::BIGINT
    FROM profiles p
    WHERE p.id != auth.uid()
    AND p.id NOT IN (SELECT target_user_id FROM public.relationships WHERE user_one_id = auth.uid() AND status = 'approved')
    ORDER BY RANDOM()
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
