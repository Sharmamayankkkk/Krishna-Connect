-- ==============================================================================
-- VIP FEATURE ENABLEMENT SCRIPT
-- ==============================================================================
-- 1. RETROACTIVE: Make all existing users follow the VIP
-- 2. FUTURE: Auto-follow VIP on signup
-- 3. RESTRICTION: Prevent unfollowing the VIP
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. RETROACTIVE: Make all CURRENT users follow the target
-- ------------------------------------------------------------------------------
-- Note: 'e0c05b79-0504-412c-9614-d3f1a6691fe2' is the VIP ID provided.
-- We use ON CONFLICT DO NOTHING to avoid errors if they already follow.
INSERT INTO public.relationships (user_one_id, user_two_id, status)
SELECT 
    p.id, 
    'e0c05b79-0504-412c-9614-d3f1a6691fe2'::UUID, 
    'approved'::relationship_status
FROM public.profiles p
WHERE p.id != 'e0c05b79-0504-412c-9614-d3f1a6691fe2'::UUID
ON CONFLICT (user_one_id, user_two_id) DO NOTHING;


-- ------------------------------------------------------------------------------
-- 2. FUTURE: Trigger to auto-follow when a NEW profile is created
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.auto_follow_vip()
RETURNS TRIGGER AS $$
DECLARE
    vip_id UUID := 'e0c05b79-0504-412c-9614-d3f1a6691fe2';
BEGIN
    -- Only attempt to follow if the VIP user actually exists to avoid FK errors
    -- If VIP user is missing, we simply log a warning and proceed (don't break signup)
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = vip_id) THEN
        INSERT INTO public.relationships (user_one_id, user_two_id, status)
        VALUES (
            NEW.id, 
            vip_id, 
            'approved'::relationship_status
        )
        ON CONFLICT DO NOTHING;
    ELSE
        RAISE WARNING 'Auto-follow skipped: VIP user % not found', vip_id;
    END IF;
    
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Safety net: ensure signup never fails due to auto-follow issues
    RAISE WARNING 'Auto-follow failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-apply Trigger
DROP TRIGGER IF EXISTS on_profile_created_auto_follow ON public.profiles;
CREATE TRIGGER on_profile_created_auto_follow
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_follow_vip();


-- ------------------------------------------------------------------------------
-- 3. RESTRICTION: Trigger to PREVENT UNFOLLOWING
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.prevent_vip_unfollow()
RETURNS TRIGGER AS $$
DECLARE
    vip_id UUID := 'e0c05b79-0504-412c-9614-d3f1a6691fe2';
BEGIN
    -- If the relationship being deleted is targeting the VIP user, block it
    IF OLD.user_two_id = vip_id THEN
        RAISE EXCEPTION 'You cannot unfollow the Community Account.';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-apply Trigger
DROP TRIGGER IF EXISTS on_relationship_deleted_prevent_unfollow ON public.relationships;
CREATE TRIGGER on_relationship_deleted_prevent_unfollow
    BEFORE DELETE ON public.relationships
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_vip_unfollow();

COMMIT;
