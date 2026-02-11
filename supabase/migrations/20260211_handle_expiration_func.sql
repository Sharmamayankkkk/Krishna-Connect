-- Function to check and expire verification requests
-- This function currently relies on manual invocation or an external scheduler (like pg_cron or Edge Function).
-- Usage: SELECT handle_verification_expirations();

CREATE OR REPLACE FUNCTION public.handle_verification_expirations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 1. Identify expired verified requests
  -- 2. Update their profile status to 'none'
  -- 3. Update request status to 'expired'
  
  -- We use a CTE to capture the IDs of expired requests to update related profiles
  WITH expired_requests AS (
    UPDATE public.verification_requests
    SET status = 'expired', updated_at = now()
    WHERE status = 'verified' 
      AND expires_at IS NOT NULL 
      AND expires_at < now()
    RETURNING user_id
  )
  UPDATE public.profiles
  SET verified = 'none'
  WHERE id IN (SELECT user_id FROM expired_requests);
  
END;
$$;
