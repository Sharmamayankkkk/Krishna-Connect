-- ============================================================================
-- 20260208_promotion_plans.sql
-- Description: Promotional Plans and Credit System Schema
-- ============================================================================

-- 1. Updates to Promotion Requests Table
ALTER TABLE public.promotion_requests ADD COLUMN IF NOT EXISTS credits_used INT DEFAULT 0;
ALTER TABLE public.promotion_requests ADD COLUMN IF NOT EXISTS duration_hours INT DEFAULT 24;
ALTER TABLE public.promotion_requests ADD COLUMN IF NOT EXISTS amount DECIMAL(10, 2) DEFAULT 0.00;

-- 2. RPC: Get User Credits (Monthly Quota - Used)
CREATE OR REPLACE FUNCTION public.get_available_credits(p_user_id UUID)
RETURNS INT AS $$
DECLARE
    v_is_verified BOOLEAN;
    v_total_credits INT := 0;
    v_used_credits INT := 0;
BEGIN
    SELECT verified INTO v_is_verified FROM public.profiles WHERE id = p_user_id;

    IF v_is_verified THEN
        v_total_credits := 5; -- 5 Free credits for verified users
    ELSE
        v_total_credits := 0; -- 0 Free credits for others
    END IF;

    -- Calculate used credits this month
    SELECT COALESCE(SUM(credits_used), 0) INTO v_used_credits
    FROM public.promotion_requests
    WHERE user_id = p_user_id
        AND status = 'approved'
        AND created_at >= date_trunc('month', CURRENT_DATE);

    RETURN GREATEST(v_total_credits - v_used_credits, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. RPC: Request Promotion (Updated with Plan Logic & Pricing)
CREATE OR REPLACE FUNCTION public.request_promotion(p_post_id BIGINT, p_duration_hours INT)
RETURNS JSON AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_post_owner_id UUID;
    v_credits_cost INT;
    v_monetary_cost DECIMAL(10, 2);
    v_available_credits INT;
    v_plan_name TEXT;
BEGIN
    -- Check post ownership
    SELECT user_id INTO v_post_owner_id FROM public.posts WHERE id = p_post_id;
    IF v_post_owner_id != v_user_id THEN
        RETURN json_build_object('success', false, 'message', 'You can only promote your own posts');
    END IF;

    -- Calculate Cost (Pricing Model)
    IF p_duration_hours = 24 THEN 
        v_credits_cost := 1; 
        v_monetary_cost := 2.99;
        v_plan_name := 'Basic (24h)';
    ELSIF p_duration_hours = 72 THEN 
        v_credits_cost := 3; 
        v_monetary_cost := 7.99; -- Small discount
        v_plan_name := 'Pro (3 Days)';
    ELSIF p_duration_hours = 168 THEN 
        v_credits_cost := 5; 
        v_monetary_cost := 14.99; -- Bulk discount
        v_plan_name := 'Ultra (7 Days)';
    ELSE
        RETURN json_build_object('success', false, 'message', 'Invalid duration');
    END IF;

    -- Check Credits
    v_available_credits := public.get_available_credits(v_user_id);

    IF v_available_credits >= v_credits_cost THEN
        -- Auto-approve using credits
        INSERT INTO public.promotion_requests (user_id, post_id, status, admin_notes, credits_used, duration_hours, amount)
        VALUES (v_user_id, p_post_id, 'approved', 'Auto-approved: Used monthly credits', v_credits_cost, p_duration_hours, 0.00);

        -- Activate promotion on post
        UPDATE public.posts 
        SET is_promoted = TRUE, 
            promoted_until = NOW() + (p_duration_hours || ' hours')::INTERVAL 
        WHERE id = p_post_id;

        RETURN json_build_object('success', true, 'message', 'Promotion activated using ' || v_credits_cost || ' credits!');
    ELSE
        -- Payment flow (Pending request with monetary amount)
        INSERT INTO public.promotion_requests (user_id, post_id, status, credits_used, duration_hours, amount)
        VALUES (v_user_id, p_post_id, 'payment_pending', 0, p_duration_hours, v_monetary_cost);

        RETURN json_build_object('success', true, 'message', 'Insufficient credits. Payment request of $' || v_monetary_cost || ' submitted.');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
