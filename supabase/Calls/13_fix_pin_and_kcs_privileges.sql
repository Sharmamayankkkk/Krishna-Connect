-- ============================================================
-- 13_fix_pin_and_kcs_privileges.sql
-- Fixes:
--   1. toggle_pin_post: verified check was comparing to 'true'
--      but actual values are 'none', 'verified', 'kcs'
--   2. KCS/Verified users get unlimited pins
-- ============================================================

CREATE OR REPLACE FUNCTION public.toggle_pin_post(p_post_id BIGINT)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_verified_status TEXT;
  v_current_count INT;
  v_is_pinned BOOLEAN;
  v_post_owner UUID;
BEGIN
  -- Get post owner and current pin status
  SELECT user_id, (pinned_at IS NOT NULL)
  INTO v_post_owner, v_is_pinned
  FROM public.posts WHERE id = p_post_id;

  -- Check post exists and belongs to user
  IF v_post_owner IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Post not found');
  END IF;

  IF v_post_owner != v_user_id THEN
    RETURN json_build_object('success', false, 'message', 'Can only pin your own posts');
  END IF;

  -- Get verification status (values: 'none', 'verified', 'kcs')
  SELECT COALESCE(verified, 'none')
  INTO v_verified_status
  FROM public.profiles WHERE id = v_user_id;

  IF v_is_pinned THEN
    -- Unpin the post
    UPDATE public.posts SET pinned_at = NULL WHERE id = p_post_id;
    RETURN json_build_object('success', true, 'is_pinned', false, 'message', 'Post unpinned');
  ELSE
    -- Verified and KCS users get unlimited pins
    IF v_verified_status NOT IN ('verified', 'kcs') THEN
      SELECT COUNT(*) INTO v_current_count
      FROM public.posts WHERE user_id = v_user_id AND pinned_at IS NOT NULL;

      IF v_current_count >= 3 THEN
        RETURN json_build_object('success', false, 'message', 'Maximum 3 pinned posts. Get verified for unlimited pins!');
      END IF;
    END IF;

    -- Pin the post
    UPDATE public.posts SET pinned_at = now() WHERE id = p_post_id;
    RETURN json_build_object('success', true, 'is_pinned', true, 'message', 'Post pinned to your profile');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.toggle_pin_post(BIGINT) TO authenticated;

-- ============================================================
-- Reload PostgREST schema cache
-- ============================================================
NOTIFY pgrst, 'reload schema';
