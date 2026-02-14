-- ============================================================
-- 10_challenges_schema.sql
-- Enhanced Challenges feature: creation (verified only),
-- proof submission, verification, ranking, winner declaration
-- ============================================================

-- ============================================================
-- Extend the existing challenges table with additional columns
-- ============================================================
ALTER TABLE public.challenges
  ADD COLUMN IF NOT EXISTS cover_image TEXT,
  ADD COLUMN IF NOT EXISTS rules TEXT,
  ADD COLUMN IF NOT EXISTS prize_description TEXT,
  ADD COLUMN IF NOT EXISTS max_participants INTEGER,
  ADD COLUMN IF NOT EXISTS requires_proof BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS winner_id UUID REFERENCES public.profiles(id),
  ADD COLUMN IF NOT EXISTS winner_declared_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general',
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

-- Extend challenge_participants with status tracking
ALTER TABLE public.challenge_participants
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'joined' CHECK (status IN ('joined', 'submitted', 'verified', 'rejected', 'winner')),
  ADD COLUMN IF NOT EXISTS rank INTEGER,
  ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- ============================================================
-- Challenge submissions (proof of completion)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.challenge_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id BIGINT NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  proof_text TEXT,
  proof_media_url TEXT,
  proof_media_type TEXT CHECK (proof_media_type IN ('image', 'video', 'link')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_notes TEXT,
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(challenge_id, user_id)
);

-- ============================================================
-- Challenge reactions (likes on challenges)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.challenge_reactions (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id BIGINT NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, challenge_id)
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_challenge_submissions_challenge ON public.challenge_submissions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_submissions_user ON public.challenge_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_submissions_status ON public.challenge_submissions(status);
CREATE INDEX IF NOT EXISTS idx_challenges_featured ON public.challenges(is_featured, is_active);
CREATE INDEX IF NOT EXISTS idx_challenges_category ON public.challenges(category);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_status ON public.challenge_participants(status);

-- ============================================================
-- RLS Policies
-- ============================================================
ALTER TABLE public.challenge_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_reactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  -- Submissions: users can see all, insert own, update own pending
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'challenge_submissions_select' AND tablename = 'challenge_submissions') THEN
    CREATE POLICY challenge_submissions_select ON public.challenge_submissions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'challenge_submissions_insert' AND tablename = 'challenge_submissions') THEN
    CREATE POLICY challenge_submissions_insert ON public.challenge_submissions FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'challenge_submissions_update' AND tablename = 'challenge_submissions') THEN
    CREATE POLICY challenge_submissions_update ON public.challenge_submissions FOR UPDATE USING (
      user_id = auth.uid() OR
      EXISTS (SELECT 1 FROM public.challenges c WHERE c.id = challenge_id AND c.created_by = auth.uid())
    );
  END IF;

  -- Reactions
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'challenge_reactions_select' AND tablename = 'challenge_reactions') THEN
    CREATE POLICY challenge_reactions_select ON public.challenge_reactions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'challenge_reactions_insert' AND tablename = 'challenge_reactions') THEN
    CREATE POLICY challenge_reactions_insert ON public.challenge_reactions FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'challenge_reactions_delete' AND tablename = 'challenge_reactions') THEN
    CREATE POLICY challenge_reactions_delete ON public.challenge_reactions FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

-- ============================================================
-- Functions
-- ============================================================

-- Get all challenges with enhanced data
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

-- Create a challenge (verified users only)
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
  -- Check if user is verified
  SELECT COALESCE(verified, 'none') INTO v_user_verified FROM public.profiles WHERE id = auth.uid();
  IF v_user_verified = 'none' THEN
    RAISE EXCEPTION 'Only verified users can create challenges';
  END IF;

  INSERT INTO public.challenges (title, description, created_by, start_date, end_date, is_active, cover_image, rules, prize_description, category, requires_proof, max_participants)
  VALUES (p_title, p_description, auth.uid(), p_start_date, p_end_date, true, p_cover_image, p_rules, p_prize_description, p_category, p_requires_proof, p_max_participants)
  RETURNING id INTO v_challenge_id;

  RETURN v_challenge_id;
END;
$$;

-- Submit proof for a challenge
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

-- Review a submission (challenge author only)
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

-- Declare winner
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

-- Get challenge leaderboard
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

-- Get featured challenges for feed/explore
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

-- Get challenge submissions for review (challenge author)
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

-- ============================================================
-- Grants
-- ============================================================
GRANT EXECUTE ON FUNCTION public.get_all_challenges(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.create_challenge(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, INTEGER, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_challenge_proof(BIGINT, TEXT, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_challenge_submission(UUID, TEXT, INTEGER, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.declare_challenge_winner(BIGINT, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_challenge_leaderboard(BIGINT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_featured_challenges(INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_challenge_submissions(BIGINT) TO authenticated;

-- ============================================================
-- Realtime
-- ============================================================
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_submissions;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_reactions;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';
