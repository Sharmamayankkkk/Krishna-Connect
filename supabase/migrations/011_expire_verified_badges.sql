-- Migration: Automatically expire verified badge subscriptions
-- When a verification_request's expires_at timestamp has passed, this function
-- sets the request status to 'rejected' and resets the profile's verified
-- column back to 'none', effectively removing the badge.

-- 1. Function that checks and expires overdue verified badges
CREATE OR REPLACE FUNCTION public.expire_verified_badges()
RETURNS void AS $$
BEGIN
    -- Update profiles: set verified back to 'none' for users whose
    -- verification request has expired
    UPDATE public.profiles
    SET verified = 'none'
    WHERE id IN (
        SELECT vr.user_id
        FROM public.verification_requests vr
        JOIN public.profiles p ON p.id = vr.user_id
        WHERE vr.status = 'verified'
          AND vr.expires_at IS NOT NULL
          AND vr.expires_at < NOW()
          AND p.verified = 'verified'
    );

    -- Update the verification_requests status to 'rejected' (expired)
    UPDATE public.verification_requests
    SET status   = 'rejected',
        admin_notes = COALESCE(admin_notes, '') || ' [Auto-expired on ' || NOW()::date::text || ']',
        updated_at  = NOW()
    WHERE status = 'verified'
      AND expires_at IS NOT NULL
      AND expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Enable the pg_cron extension (required for scheduled jobs)
--    NOTE: On Supabase, pg_cron is available but may need to be enabled
--    via the Dashboard > Database > Extensions page.
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 3. Schedule the function to run every hour
--    This checks for expired badges hourly and removes them automatically.
SELECT cron.schedule(
    'expire-verified-badges',   -- job name
    '0 * * * *',                -- every hour at minute 0
    $$SELECT public.expire_verified_badges()$$
);
