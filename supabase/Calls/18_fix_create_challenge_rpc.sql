-- ============================================================
-- 18_fix_create_challenge_rpc.sql
-- Fixes for:
--   1. create_challenge RPC 404 (Not Found) error
--   2. Ensure correct function signature and permissions
-- ============================================================

-- Drop potential existing signatures to ensure clean slate
DROP FUNCTION IF EXISTS public.create_challenge(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, INTEGER, TIMESTAMPTZ, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.create_challenge(TEXT, TEXT); -- In case of older versions

-- Recreate the function ensuring parameter defaults match frontend usage
CREATE OR REPLACE FUNCTION public.create_challenge(
  p_title TEXT,
  p_description TEXT,
  p_rules TEXT DEFAULT NULL,
  p_prize_description TEXT DEFAULT NULL,
  p_cover_image TEXT DEFAULT NULL,
  p_category TEXT DEFAULT 'general',
  p_requires_proof BOOLEAN DEFAULT true,
  p_max_participants INTEGER DEFAULT NULL,
  p_start_date TIMESTAMPTZ DEFAULT now(),
  p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_verified TEXT;
  v_challenge_id BIGINT;
BEGIN
  -- verified check removed/commented out temporarily if blocking, 
  -- but keeping logic same as original requirement for now.
  -- Check if user is verified
  SELECT COALESCE(verified, 'none') INTO v_user_verified FROM public.profiles WHERE id = auth.uid();
  
  -- If you want to allow non-verified users for testing, comment out the next 3 lines
  IF v_user_verified = 'none' THEN
     RAISE EXCEPTION 'Only verified users can create challenges';
  END IF;

  INSERT INTO public.challenges (
    title, 
    description, 
    created_by, 
    start_date, 
    end_date, 
    is_active, 
    cover_image, 
    rules, 
    prize_description, 
    category, 
    requires_proof, 
    max_participants
  )
  VALUES (
    p_title, 
    p_description, 
    auth.uid(), 
    p_start_date, 
    p_end_date, 
    true, 
    p_cover_image, 
    p_rules, 
    p_prize_description, 
    p_category, 
    p_requires_proof, 
    p_max_participants
  )
  RETURNING id INTO v_challenge_id;

  RETURN v_challenge_id;
END;
$$;

-- Grant permissions explicitly
GRANT EXECUTE ON FUNCTION public.create_challenge(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, INTEGER, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_challenge(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, INTEGER, TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
