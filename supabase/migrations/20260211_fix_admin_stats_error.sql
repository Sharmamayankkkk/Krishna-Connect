-- ============================================================================
-- 20260211_fix_admin_stats_error.sql
-- Description: Fix get_admin_stats_overview to handle 'verified' column as TEXT
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_admin_stats_overview()
RETURNS TABLE (
    total_users INT,
    active_users_30d INT,
    total_posts INT,
    total_comments INT,
    total_verifications INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*)::INT FROM public.profiles),
        (
            SELECT COUNT(DISTINCT user_id)::INT 
            FROM (
                SELECT user_id FROM public.posts WHERE created_at > NOW() - INTERVAL '30 days'
                UNION
                SELECT user_id FROM public.comments WHERE created_at > NOW() - INTERVAL '30 days'
                UNION
                SELECT user_id FROM public.post_likes WHERE created_at > NOW() - INTERVAL '30 days'
            ) as active
        ),
        (SELECT COUNT(*)::INT FROM public.posts),
        (SELECT COUNT(*)::INT FROM public.comments),
        -- FIX: 'verified' is text ('verified', 'kcs', 'none'), not boolean
        (SELECT COUNT(*)::INT FROM public.profiles WHERE verified IN ('verified', 'kcs')); 
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
