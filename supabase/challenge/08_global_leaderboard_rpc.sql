-- ==========================================
-- GLOBAL CHALLENGE LEADERBOARD RPC
-- ==========================================

-- Function to get the top users by challenge points
CREATE OR REPLACE FUNCTION get_global_challenge_leaderboard(
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    user_id UUID,
    name TEXT,
    username TEXT,
    avatar_url TEXT,
    verified TEXT,
    total_points BIGINT,
    challenges_completed BIGINT,
    global_rank BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH UserStats AS (
        SELECT 
            cp.user_id,
            SUM(cp.points) as total_points,
            COUNT(cp.challenge_id) as challenges_completed
        FROM public.challenge_participants cp
        WHERE cp.points > 0
        GROUP BY cp.user_id
    )
    SELECT 
        us.user_id,
        p.name,
        p.username,
        p.avatar_url,
        COALESCE(p.verified, 'none') as verified,
        COALESCE(us.total_points, 0) as total_points,
        COALESCE(us.challenges_completed, 0) as challenges_completed,
        RANK() OVER (ORDER BY us.total_points DESC) as global_rank
    FROM UserStats us
    JOIN public.profiles p ON p.id = us.user_id
    ORDER BY us.total_points DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
