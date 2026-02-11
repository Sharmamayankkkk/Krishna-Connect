-- ============================================================================
-- 20260211_admin_stats.sql
-- Description: Functions for Admin Dashboard and Improved User Analytics
-- ============================================================================

-- 1. Get Admin Overview Stats
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
        (SELECT COUNT(*)::INT FROM public.profiles WHERE verified IS NOT FALSE); -- 'verified' or 'kcs'
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Get Admin Daily Content Trends (Last 30 Days)
CREATE OR REPLACE FUNCTION public.get_admin_daily_content_trends(p_days INT DEFAULT 30)
RETURNS TABLE (
    date TEXT,
    posts INT,
    comments INT
) AS $$
BEGIN
    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(
            CURRENT_DATE - (p_days - 1),
            CURRENT_DATE,
            '1 day'::interval
        )::DATE AS d
    )
    SELECT
        to_char(ds.d, 'Mon DD'),
        COUNT(DISTINCT p.id)::INT,
        COUNT(DISTINCT c.id)::INT
    FROM date_series ds
    LEFT JOIN public.posts p ON p.created_at::DATE = ds.d
    LEFT JOIN public.comments c ON c.created_at::DATE = ds.d
    GROUP BY ds.d
    ORDER BY ds.d;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Get Admin Hourly Activity (Peak Times System-wide)
CREATE OR REPLACE FUNCTION public.get_admin_hourly_activity()
RETURNS TABLE (
    hour INT,
    activity_count INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        EXTRACT(HOUR FROM created_at)::INT as hour_slot,
        COUNT(*)::INT
    FROM public.posts
    WHERE created_at > NOW() - INTERVAL '30 days'
    GROUP BY hour_slot
    ORDER BY hour_slot;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. IMPROVED: Get Best Posting Times (User Specific)
-- Fixed issue: Using a simpler grouping and ensuring types match
CREATE OR REPLACE FUNCTION public.get_best_posting_times_v2(p_user_id UUID)
RETURNS TABLE (
    time_slot TEXT,
    view_count INT
) AS $$
BEGIN
    RETURN QUERY
    WITH views_data AS (
        SELECT 
            pv.viewed_at
        FROM public.post_views pv
        JOIN public.posts p ON pv.post_id = p.id
        WHERE p.user_id = p_user_id
    )
    SELECT 
        CASE 
            WHEN EXTRACT(HOUR FROM viewed_at) BETWEEN 0 AND 5 THEN 'Night (12am-6am)'
            WHEN EXTRACT(HOUR FROM viewed_at) BETWEEN 6 AND 11 THEN 'Morning (6am-12pm)'
            WHEN EXTRACT(HOUR FROM viewed_at) BETWEEN 12 AND 17 THEN 'Afternoon (12pm-6pm)'
            WHEN EXTRACT(HOUR FROM viewed_at) BETWEEN 18 AND 23 THEN 'Evening (6pm-12am)'
            ELSE 'Unknown'
        END as slot,
        COUNT(*)::INT
    FROM views_data
    GROUP BY slot
    ORDER BY count(*) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Content Breakdown
CREATE OR REPLACE FUNCTION public.get_admin_content_breakdown()
RETURNS TABLE (
    type TEXT,
    count INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 'Posts' as type, COUNT(*)::INT FROM public.posts WHERE media_urls IS NULL AND poll IS NULL
    UNION ALL
    SELECT 'Media', COUNT(*)::INT FROM public.posts WHERE media_urls IS NOT NULL
    UNION ALL
    SELECT 'Polls', COUNT(*)::INT FROM public.posts WHERE poll IS NOT NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
