-- JSON-based fix for get_who_to_follow
-- Returns JSON array directly to avoid PostgREST return type strictness issues.
-- Handles empty results by returning explicit empty array []

DROP FUNCTION IF EXISTS public.get_who_to_follow(INT);
DROP FUNCTION IF EXISTS public.get_who_to_follow(INTEGER);

CREATE OR REPLACE FUNCTION public.get_who_to_follow(limit_count INT DEFAULT 5)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_agg(t) INTO result
    FROM (
        SELECT 
            p.id, 
            p.username, 
            COALESCE(p.name, p.username) as name, 
            COALESCE(p.avatar_url, '') as avatar_url, 
            p.verified::TEXT as verified, 
            COALESCE(p.bio, '') as bio,
            (SELECT COUNT(*) FROM public.relationships r WHERE r.user_two_id = p.id AND r.status = 'approved')::BIGINT as followers_count
        FROM profiles p
        WHERE p.id != auth.uid()
        AND p.id NOT IN (SELECT target_user_id FROM public.relationships WHERE user_one_id = auth.uid() AND status = 'approved')
        ORDER BY RANDOM()
        LIMIT limit_count
    ) t;

    -- Return empty JSON array if no results found
    RETURN COALESCE(result, '[]'::json);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
