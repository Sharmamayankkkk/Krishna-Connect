-- ============================================================================
-- 20260208_promotions_analytics.sql
-- Description: Schema changes for Promoted Posts and Analytics
-- ============================================================================

-- 1. Updates to Posts Table
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_promoted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS promoted_until TIMESTAMPTZ;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS views_count INT DEFAULT 0;

-- 2. Promotion Requests Table
CREATE TABLE IF NOT EXISTS public.promotion_requests (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    post_id BIGINT REFERENCES public.posts(id) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'payment_pending')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    admin_notes TEXT,
    CONSTRAINT unique_active_request_per_post UNIQUE (post_id, status) -- Prevent multiple pending requests for same post
);

-- Index for querying user's requests
CREATE INDEX IF NOT EXISTS idx_promotion_requests_user_id ON public.promotion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_promotion_requests_status ON public.promotion_requests(status);

-- 3. Post Views Table (for Analytics)
CREATE TABLE IF NOT EXISTS public.post_views (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    post_id BIGINT REFERENCES public.posts(id) NOT NULL,
    user_id UUID REFERENCES public.profiles(id), -- Nullable for anonymous views
    viewed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for analytics queries
CREATE INDEX IF NOT EXISTS idx_post_views_post_id ON public.post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_post_views_user_id ON public.post_views(user_id);
CREATE INDEX IF NOT EXISTS idx_post_views_created_at ON public.post_views(viewed_at);

-- 4. Function: Increment Views Count
CREATE OR REPLACE FUNCTION public.increment_post_views() 
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.posts 
    SET views_count = COALESCE(views_count, 0) + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger for View Count
DROP TRIGGER IF EXISTS on_post_view_created ON public.post_views;
CREATE TRIGGER on_post_view_created
    AFTER INSERT ON public.post_views
    FOR EACH ROW
    EXECUTE FUNCTION public.increment_post_views();

-- 5. RPC: Get User's Monthly Promotion Count (for limits)
CREATE OR REPLACE FUNCTION public.get_monthly_promotion_count(p_user_id UUID)
RETURNS INT AS $$
DECLARE
    v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM public.promotion_requests
    WHERE user_id = p_user_id
      AND status = 'approved'
      AND created_at >= date_trunc('month', CURRENT_DATE);
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RPC: Request Promotion
CREATE OR REPLACE FUNCTION public.request_promotion(p_post_id BIGINT)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_post_owner_id UUID;
    v_is_verified BOOLEAN;
    v_count INT;
BEGIN
    -- Check post ownership
    SELECT user_id INTO v_post_owner_id FROM public.posts WHERE id = p_post_id;
    IF v_post_owner_id != v_user_id THEN
        RETURN json_build_object('success', false, 'message', 'You can only promote your own posts');
    END IF;

    -- Check verification status
    SELECT verified INTO v_is_verified FROM public.profiles WHERE id = v_user_id;
    
    -- Check monthly limit
    v_count := public.get_monthly_promotion_count(v_user_id);

    IF v_is_verified AND v_count < 3 THEN
        -- Auto-approve for verified users under limit
        INSERT INTO public.promotion_requests (user_id, post_id, status, admin_notes)
        VALUES (v_user_id, p_post_id, 'approved', 'Auto-approved: Verified user monthly free limit');
        
        -- Activate promotion on post immediately (e.g., for 24 hours or standard duration)
        UPDATE public.posts 
        SET is_promoted = TRUE, 
            promoted_until = NOW() + INTERVAL '24 hours' 
        WHERE id = p_post_id;

        RETURN json_build_object('success', true, 'message', 'Promotion activated! (Free limit used)');
    ELSE
        -- Create pending request for payment
        INSERT INTO public.promotion_requests (user_id, post_id, status)
        VALUES (v_user_id, p_post_id, 'payment_pending');

        RETURN json_build_object('success', true, 'message', 'Promotion request submitted. Our team will contact you for payment.');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. RPC: Log View (Safe wrapper)
CREATE OR REPLACE FUNCTION public.log_post_view(p_post_id BIGINT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.post_views (post_id, user_id)
    VALUES (p_post_id, auth.uid());
EXCEPTION WHEN OTHERS THEN
    -- Ignore errors to prevent blocking UI
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. RPC: Get User Analytics
CREATE OR REPLACE FUNCTION public.get_user_analytics(p_user_id UUID, p_days INT DEFAULT 30)
RETURNS TABLE (
    date DATE,
    views INT,
    likes INT,
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
        ds.d,
        COALESCE(COUNT(DISTINCT pv.id), 0)::INT as views,
        COALESCE(COUNT(DISTINCT pl.created_at), 0)::INT as likes,
        COALESCE(COUNT(DISTINCT c.id), 0)::INT as comments
    FROM date_series ds
    LEFT JOIN public.posts p ON p.user_id = p_user_id
    LEFT JOIN public.post_views pv ON pv.post_id = p.id AND pv.viewed_at::DATE = ds.d
    LEFT JOIN public.post_likes pl ON pl.post_id = p.id AND pl.created_at::DATE = ds.d
    LEFT JOIN public.comments c ON c.post_id = p.id AND c.created_at::DATE = ds.d
    GROUP BY ds.d
    ORDER BY ds.d;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. RPC: Get Active Promoted Posts (for Feed Injection)
CREATE OR REPLACE FUNCTION public.get_active_promoted_posts(p_limit INT DEFAULT 3)
RETURNS TABLE (
    id BIGINT,
    content TEXT,
    created_at TIMESTAMPTZ,
    media JSONB,
    poll JSONB,
    quote_of_id BIGINT,
    user_id UUID,
    author_name TEXT,
    author_username TEXT,
    author_avatar TEXT,
    author_verified BOOLEAN,
    likes_count BIGINT,
    comments_count BIGINT,
    reposts_count BIGINT,
    is_liked BOOLEAN,
    is_reposted BOOLEAN,
    next_cursor BIGINT
) AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    RETURN QUERY
    SELECT 
        p.id, p.content, p.created_at, p.media, p.poll, p.quote_of_id, p.user_id,
        author.name, author.username, author.avatar_url, COALESCE(author.verified, FALSE),
        (SELECT COUNT(*) FROM public.post_likes pl WHERE pl.post_id = p.id)::BIGINT,
        (SELECT COUNT(*) FROM public.comments c WHERE c.post_id = p.id)::BIGINT,
        (SELECT COUNT(*) FROM public.post_reposts pr WHERE pr.post_id = p.id)::BIGINT,
        EXISTS(SELECT 1 FROM public.post_likes pl WHERE pl.post_id = p.id AND pl.user_id = v_user_id),
        EXISTS(SELECT 1 FROM public.post_reposts pr WHERE pr.post_id = p.id AND pr.user_id = v_user_id),
        NULL::BIGINT -- next_cursor (not needed for promoted posts)
    FROM public.posts p
    LEFT JOIN public.profiles author ON p.user_id = author.id
    WHERE p.is_promoted = TRUE
      AND p.promoted_until > NOW()
    ORDER BY RANDOM()
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. RPC: Get Analytics Summary (Current vs Previous Period)
CREATE OR REPLACE FUNCTION public.get_analytics_summary(p_user_id UUID, p_days INT DEFAULT 30)
RETURNS TABLE (
    total_views INT,
    views_change FLOAT,
    total_likes INT,
    likes_change FLOAT,
    total_comments INT,
    comments_change FLOAT,
    total_interactions INT,
    interactions_change FLOAT,
    new_followers INT,
    followers_change FLOAT
) AS $$
DECLARE
    v_prev_start DATE := CURRENT_DATE - (2 * p_days);
    v_curr_start DATE := CURRENT_DATE - p_days;
    
    v_curr_views INT; v_prev_views INT;
    v_curr_likes INT; v_prev_likes INT;
    v_curr_comments INT; v_prev_comments INT;
    v_curr_followers INT; v_prev_followers INT;
BEGIN
    -- Views
    SELECT COUNT(*) INTO v_curr_views FROM public.post_views pv JOIN public.posts p ON pv.post_id = p.id WHERE p.user_id = p_user_id AND pv.viewed_at >= v_curr_start;
    SELECT COUNT(*) INTO v_prev_views FROM public.post_views pv JOIN public.posts p ON pv.post_id = p.id WHERE p.user_id = p_user_id AND pv.viewed_at >= v_prev_start AND pv.viewed_at < v_curr_start;
    
    -- Likes
    SELECT COUNT(*) INTO v_curr_likes FROM public.post_likes pl JOIN public.posts p ON pl.post_id = p.id WHERE p.user_id = p_user_id AND pl.created_at >= v_curr_start;
    SELECT COUNT(*) INTO v_prev_likes FROM public.post_likes pl JOIN public.posts p ON pl.post_id = p.id WHERE p.user_id = p_user_id AND pl.created_at >= v_prev_start AND pl.created_at < v_curr_start;

    -- Comments
    SELECT COUNT(*) INTO v_curr_comments FROM public.comments c JOIN public.posts p ON c.post_id = p.id WHERE p.user_id = p_user_id AND c.created_at >= v_curr_start;
    SELECT COUNT(*) INTO v_prev_comments FROM public.comments c JOIN public.posts p ON c.post_id = p.id WHERE p.user_id = p_user_id AND c.created_at >= v_prev_start AND c.created_at < v_curr_start;

    -- Followers (Relationships where user_two is target)
    SELECT COUNT(*) INTO v_curr_followers FROM public.relationships WHERE user_two_id = p_user_id AND status = 'approved' AND created_at >= v_curr_start;
    SELECT COUNT(*) INTO v_prev_followers FROM public.relationships WHERE user_two_id = p_user_id AND status = 'approved' AND created_at >= v_prev_start AND created_at < v_curr_start;

    RETURN QUERY SELECT
        COALESCE(v_curr_views, 0),
        CASE WHEN v_prev_views > 0 THEN ((v_curr_views - v_prev_views)::FLOAT / v_prev_views) * 100 ELSE 0 END,
        COALESCE(v_curr_likes, 0),
        CASE WHEN v_prev_likes > 0 THEN ((v_curr_likes - v_prev_likes)::FLOAT / v_prev_likes) * 100 ELSE 0 END,
        COALESCE(v_curr_comments, 0),
        CASE WHEN v_prev_comments > 0 THEN ((v_curr_comments - v_prev_comments)::FLOAT / v_prev_comments) * 100 ELSE 0 END,
        COALESCE(v_curr_likes + v_curr_comments, 0),
        CASE WHEN (v_prev_likes + v_prev_comments) > 0 THEN (((v_curr_likes + v_curr_comments) - (v_prev_likes + v_prev_comments))::FLOAT / (v_prev_likes + v_prev_comments)) * 100 ELSE 0 END,
        COALESCE(v_curr_followers, 0),
        CASE WHEN v_prev_followers > 0 THEN ((v_curr_followers - v_prev_followers)::FLOAT / v_prev_followers) * 100 ELSE 0 END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. RPC: Get Top Performing Posts
CREATE OR REPLACE FUNCTION public.get_top_performing_posts(p_user_id UUID, p_limit INT DEFAULT 5)
RETURNS TABLE (
    id BIGINT,
    content TEXT,
    created_at TIMESTAMPTZ,
    views INT,
    likes INT,
    comments INT,
    engagement_rate FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        LEFT(p.content, 100) as content,
        p.created_at,
        COALESCE(p.views_count, 0) as views,
        COUNT(DISTINCT pl.user_id)::INT as likes,
        COUNT(DISTINCT c.id)::INT as comments,
        CASE 
            WHEN COALESCE(p.views_count, 0) > 0 THEN 
                ((COUNT(DISTINCT pl.user_id) + COUNT(DISTINCT c.id))::FLOAT / p.views_count) * 100 
            ELSE 0 
        END as engagement_rate
    FROM public.posts p
    LEFT JOIN public.post_likes pl ON p.id = pl.post_id
    LEFT JOIN public.comments c ON p.id = c.post_id
    WHERE p.user_id = p_user_id
    GROUP BY p.id, p.content, p.created_at, p.views_count
    ORDER BY engagement_rate DESC, views DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. RPC: Get Audience Demographics (Gender)
CREATE OR REPLACE FUNCTION public.get_audience_demographics(p_user_id UUID)
RETURNS TABLE (
    gender TEXT,
    percentage FLOAT
) AS $$
DECLARE
    v_total INT;
BEGIN
    -- Count unique viewers with known gender
    SELECT COUNT(DISTINCT pv.user_id) INTO v_total
    FROM public.post_views pv
    JOIN public.profiles viewer ON pv.user_id = viewer.id
    JOIN public.posts p ON pv.post_id = p.id
    WHERE p.user_id = p_user_id AND viewer.gender IS NOT NULL;

    RETURN QUERY
    SELECT 
        viewer.gender,
        (COUNT(DISTINCT pv.user_id)::FLOAT / NULLIF(v_total, 0)) * 100
    FROM public.post_views pv
    JOIN public.profiles viewer ON pv.user_id = viewer.id
    JOIN public.posts p ON pv.post_id = p.id
    WHERE p.user_id = p_user_id AND viewer.gender IS NOT NULL
    GROUP BY viewer.gender;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. RPC: Get Best Posting Times
CREATE OR REPLACE FUNCTION public.get_best_posting_times(p_user_id UUID)
RETURNS TABLE (
    hour_range TEXT,
    view_count INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        CASE 
            WHEN EXTRACT(HOUR FROM pv.viewed_at) BETWEEN 6 AND 8 THEN '6 AM - 9 AM'
            WHEN EXTRACT(HOUR FROM pv.viewed_at) BETWEEN 9 AND 11 THEN '9 AM - 12 PM'
            WHEN EXTRACT(HOUR FROM pv.viewed_at) BETWEEN 12 AND 14 THEN '12 PM - 3 PM'
            WHEN EXTRACT(HOUR FROM pv.viewed_at) BETWEEN 15 AND 17 THEN '3 PM - 6 PM'
            WHEN EXTRACT(HOUR FROM pv.viewed_at) BETWEEN 18 AND 20 THEN '6 PM - 9 PM'
            ELSE '9 PM - 12 AM' -- Simplified buckets for chart
        END as time_slot,
        COUNT(*)::INT
    FROM public.post_views pv
    JOIN public.posts p ON pv.post_id = p.id
    WHERE p.user_id = p_user_id
    GROUP BY time_slot
    ORDER BY count(*) DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
