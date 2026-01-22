-- ==========================================
-- FIX 1: Robust User Creation Trigger
-- ==========================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, username, avatar_url, gender, verified, is_private)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(md5(random()::text), 1, 8)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        COALESCE(NEW.raw_user_meta_data->>'gender', 'male'),
        FALSE,
        FALSE
    );
    RETURN NEW;
EXCEPTION WHEN unique_violation THEN
    -- Fallback for username collision
    INSERT INTO public.profiles (id, name, username, avatar_url, gender, verified, is_private)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
        (NEW.raw_user_meta_data->>'username') || '_' || substr(md5(random()::text), 1, 4),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        COALESCE(NEW.raw_user_meta_data->>'gender', 'male'),
        FALSE,
        FALSE
    );
    RETURN NEW;
WHEN OTHERS THEN
    RAISE WARNING 'Profile creation failed: %', SQLERRM;
    RETURN NEW; -- Don't block auth creation even if profile fails (though not ideal, prevents 500)
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ==========================================
-- FIX 2: Safe Auto-Follow Trigger
-- ==========================================
CREATE OR REPLACE FUNCTION public.auto_follow_vip()
RETURNS TRIGGER AS $$
DECLARE
    vip_id UUID := 'e0c05b79-0504-412c-9614-d3f1a6691fe2'; -- The hardcoded VIP ID
BEGIN
    -- Only attempt to follow if the VIP user actually exists
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = vip_id) THEN
        INSERT INTO public.relationships (user_one_id, user_two_id, status)
        VALUES (
            NEW.id, 
            vip_id, 
            'approved'::relationship_status
        )
        ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    -- Prevent auto-follow failure from blocking the entire signup
    RAISE WARNING 'Auto-follow failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-bind the Auto-Follow Trigger
DROP TRIGGER IF EXISTS on_profile_created_auto_follow ON public.profiles;
CREATE TRIGGER on_profile_created_auto_follow
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_follow_vip();
