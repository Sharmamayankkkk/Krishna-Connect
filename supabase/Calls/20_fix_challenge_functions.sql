-- ============================================================
-- 20_fix_challenge_functions.sql
-- Fixes missing challenge functions that failed to create
-- because the table was missing.
-- ============================================================

-- 1. get_all_challenges
CREATE OR REPLACE FUNCTION public.get_all_challenges(p_user_id UUID)
RETURNS TABLE (
  id BIGINT,
  title TEXT,
  description TEXT,
  cover_image TEXT,
  rules TEXT,
  prize_description TEXT,
  category TEXT,
  requires_proof BOOLEAN,
  is_active BOOLEAN,
  is_featured BOOLEAN,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_by UUID,
  creator_name TEXT,
  creator_username TEXT,
  creator_avatar TEXT,
  creator_verified TEXT,
  participant_count BIGINT,
  submission_count BIGINT,
  has_joined BOOLEAN,
  has_submitted BOOLEAN,
  user_submission_status TEXT,
  winner_id UUID,
  winner_name TEXT,
  winner_declared_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.title,
    c.description,
    c.cover_image,
    c.rules,
    c.prize_description,
    c.category,
    c.requires_proof,
    c.is_active,
    c.is_featured,
    c.start_date,
    c.end_date,
    c.created_by,
    COALESCE(p.name, p.username) AS creator_name,
    p.username AS creator_username,
    p.avatar_url AS creator_avatar,
    COALESCE(p.verified, 'none') AS creator_verified,
    (SELECT COUNT(*) FROM public.challenge_participants cp2 WHERE cp2.challenge_id = c.id) AS participant_count,
    (SELECT COUNT(*) FROM public.challenge_submissions cs WHERE cs.challenge_id = c.id) AS submission_count,
    EXISTS(SELECT 1 FROM public.challenge_participants cp3 WHERE cp3.challenge_id = c.id AND cp3.user_id = p_user_id) AS has_joined,
    EXISTS(SELECT 1 FROM public.challenge_submissions cs2 WHERE cs2.challenge_id = c.id AND cs2.user_id = p_user_id) AS has_submitted,
    (SELECT cs3.status FROM public.challenge_submissions cs3 WHERE cs3.challenge_id = c.id AND cs3.user_id = p_user_id LIMIT 1) AS user_submission_status,
    c.winner_id,
    (SELECT wp.name FROM public.profiles wp WHERE wp.id = c.winner_id) AS winner_name,
    c.winner_declared_at
  FROM public.challenges c
  JOIN public.profiles p ON p.id = c.created_by
  ORDER BY c.is_featured DESC, c.is_active DESC, c.start_date DESC;
END;
$$;

-- 2. submit_challenge_proof
CREATE OR REPLACE FUNCTION public.submit_challenge_proof(
  p_challenge_id BIGINT,
  p_proof_text TEXT DEFAULT NULL,
  p_proof_media_url TEXT DEFAULT NULL,
  p_proof_media_type TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_submission_id UUID;
BEGIN
  -- Check user has joined the challenge
  IF NOT EXISTS (SELECT 1 FROM public.challenge_participants WHERE challenge_id = p_challenge_id AND user_id = auth.uid()) THEN
    RAISE EXCEPTION 'You must join the challenge first';
  END IF;

  -- Upsert submission
  INSERT INTO public.challenge_submissions (challenge_id, user_id, proof_text, proof_media_url, proof_media_type, status)
  VALUES (p_challenge_id, auth.uid(), p_proof_text, p_proof_media_url, p_proof_media_type, 'pending')
  ON CONFLICT (challenge_id, user_id)
  DO UPDATE SET proof_text = p_proof_text, proof_media_url = p_proof_media_url, proof_media_type = p_proof_media_type, status = 'pending', updated_at = now()
  RETURNING id INTO v_submission_id;

  -- Update participant status
  UPDATE public.challenge_participants SET status = 'submitted', completed_at = now() WHERE challenge_id = p_challenge_id AND user_id = auth.uid();

  RETURN v_submission_id;
END;
$$;

-- 3. review_challenge_submission
CREATE OR REPLACE FUNCTION public.review_challenge_submission(
  p_submission_id UUID,
  p_status TEXT,
  p_score INTEGER DEFAULT 0,
  p_reviewer_notes TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_challenge_id BIGINT;
  v_user_id UUID;
BEGIN
  -- Get the submission details
  SELECT challenge_id, user_id INTO v_challenge_id, v_user_id FROM public.challenge_submissions WHERE id = p_submission_id;

  -- Verify the reviewer is the challenge author
  IF NOT EXISTS (SELECT 1 FROM public.challenges WHERE id = v_challenge_id AND created_by = auth.uid()) THEN
    RAISE EXCEPTION 'Only the challenge author can review submissions';
  END IF;

  -- Update submission
  UPDATE public.challenge_submissions
  SET status = p_status, reviewed_by = auth.uid(), reviewed_at = now(), reviewer_notes = p_reviewer_notes, updated_at = now()
  WHERE id = p_submission_id;

  -- Update participant status and score
  UPDATE public.challenge_participants
  SET status = CASE WHEN p_status = 'approved' THEN 'verified' ELSE 'rejected' END,
      score = p_score
  WHERE challenge_id = v_challenge_id AND user_id = v_user_id;
END;
$$;

-- 4. declare_challenge_winner
CREATE OR REPLACE FUNCTION public.declare_challenge_winner(
  p_challenge_id BIGINT,
  p_winner_id UUID
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify the caller is the challenge author
  IF NOT EXISTS (SELECT 1 FROM public.challenges WHERE id = p_challenge_id AND created_by = auth.uid()) THEN
    RAISE EXCEPTION 'Only the challenge author can declare a winner';
  END IF;

  -- Verify the winner has a verified submission
  IF NOT EXISTS (SELECT 1 FROM public.challenge_submissions WHERE challenge_id = p_challenge_id AND user_id = p_winner_id AND status = 'approved') THEN
    RAISE EXCEPTION 'Winner must have an approved submission';
  END IF;

  -- Update challenge
  UPDATE public.challenges SET winner_id = p_winner_id, winner_declared_at = now(), is_active = false WHERE id = p_challenge_id;

  -- Update winner participant status
  UPDATE public.challenge_participants SET status = 'winner', rank = 1 WHERE challenge_id = p_challenge_id AND user_id = p_winner_id;

  -- Rank other verified participants by score
  WITH ranked AS (
    SELECT user_id, ROW_NUMBER() OVER (ORDER BY score DESC, completed_at ASC) + 1 AS rnk
    FROM public.challenge_participants
    WHERE challenge_id = p_challenge_id AND status = 'verified' AND user_id != p_winner_id
  )
  UPDATE public.challenge_participants cp SET rank = r.rnk
  FROM ranked r WHERE cp.challenge_id = p_challenge_id AND cp.user_id = r.user_id;
END;
$$;

-- 5. get_challenge_leaderboard
CREATE OR REPLACE FUNCTION public.get_challenge_leaderboard(p_challenge_id BIGINT)
RETURNS TABLE (
  user_id UUID,
  name TEXT,
  username TEXT,
  avatar_url TEXT,
  verified TEXT,
  status TEXT,
  score INTEGER,
  rank INTEGER,
  submitted_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS user_id,
    COALESCE(p.name, p.username) AS name,
    p.username,
    p.avatar_url,
    COALESCE(p.verified, 'none') AS verified,
    cp.status,
    COALESCE(cp.score, 0) AS score,
    cp.rank,
    cp.completed_at AS submitted_at
  FROM public.challenge_participants cp
  JOIN public.profiles p ON p.id = cp.user_id
  WHERE cp.challenge_id = p_challenge_id
  ORDER BY cp.rank NULLS LAST, cp.score DESC, cp.completed_at ASC;
END;
$$;

-- 6. get_featured_challenges
CREATE OR REPLACE FUNCTION public.get_featured_challenges(p_limit INTEGER DEFAULT 5)
RETURNS TABLE (
  id BIGINT,
  title TEXT,
  description TEXT,
  cover_image TEXT,
  category TEXT,
  participant_count BIGINT,
  is_active BOOLEAN,
  creator_name TEXT,
  creator_avatar TEXT,
  end_date TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    c.id,
    c.title,
    c.description,
    c.cover_image,
    c.category,
    (SELECT COUNT(*) FROM public.challenge_participants cp WHERE cp.challenge_id = c.id) AS participant_count,
    c.is_active,
    COALESCE(p.name, p.username) AS creator_name,
    p.avatar_url AS creator_avatar,
    c.end_date
  FROM public.challenges c
  JOIN public.profiles p ON p.id = c.created_by
  WHERE c.is_featured = true AND c.is_active = true
  ORDER BY c.start_date DESC
  LIMIT p_limit;
END;
$$;

-- 7. get_challenge_submissions
CREATE OR REPLACE FUNCTION public.get_challenge_submissions(p_challenge_id BIGINT)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_name TEXT,
  user_username TEXT,
  user_avatar TEXT,
  proof_text TEXT,
  proof_media_url TEXT,
  proof_media_type TEXT,
  status TEXT,
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    cs.id,
    cs.user_id,
    COALESCE(p.name, p.username) AS user_name,
    p.username AS user_username,
    p.avatar_url AS user_avatar,
    cs.proof_text,
    cs.proof_media_url,
    cs.proof_media_type,
    cs.status,
    cs.reviewer_notes,
    cs.created_at
  FROM public.challenge_submissions cs
  JOIN public.profiles p ON p.id = cs.user_id
  WHERE cs.challenge_id = p_challenge_id
  ORDER BY cs.created_at DESC;
END;
$$;

-- Grants
GRANT EXECUTE ON FUNCTION public.get_all_challenges(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.submit_challenge_proof(BIGINT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_challenge_submission(UUID, TEXT, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.declare_challenge_winner(BIGINT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_challenge_leaderboard(BIGINT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_featured_challenges(INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_challenge_submissions(BIGINT) TO authenticated;

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
