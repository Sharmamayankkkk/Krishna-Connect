-- ============================================================
-- 22_create_challenge_submissions_table.sql
-- Creates the missing challenge_submissions table and sets up RLS policies.
-- This was missed in 19_create_challenges_table.sql
-- ============================================================

-- 1. Create challenge_submissions table
CREATE TABLE IF NOT EXISTS public.challenge_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id BIGINT NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  proof_text TEXT,
  proof_media_url TEXT,
  proof_media_type TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  
  -- Reviewer details
  reviewed_by UUID REFERENCES public.profiles(id),
  reviewed_at TIMESTAMPTZ,
  reviewer_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure one submission per user per challenge
  UNIQUE (challenge_id, user_id)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_challenge_submissions_challenge ON public.challenge_submissions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_submissions_user ON public.challenge_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_submissions_status ON public.challenge_submissions(status);

-- 3. RLS Policies
ALTER TABLE public.challenge_submissions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  -- Challenge creators can view all submissions for their challenge
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'challenge_creator_view_submissions' AND tablename = 'challenge_submissions') THEN
    CREATE POLICY challenge_creator_view_submissions ON public.challenge_submissions FOR SELECT USING (
      EXISTS (SELECT 1 FROM public.challenges c WHERE c.id = challenge_id AND c.created_by = auth.uid())
    );
  END IF;

  -- Users can view their own submissions
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_view_own_submission' AND tablename = 'challenge_submissions') THEN
    CREATE POLICY user_view_own_submission ON public.challenge_submissions FOR SELECT USING (user_id = auth.uid());
  END IF;

  -- Users can create/insert their own submission
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_create_submission' AND tablename = 'challenge_submissions') THEN
    CREATE POLICY user_create_submission ON public.challenge_submissions FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;

  -- Users can update their own pending submissions
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'user_update_own_submission' AND tablename = 'challenge_submissions') THEN
    CREATE POLICY user_update_own_submission ON public.challenge_submissions FOR UPDATE USING (user_id = auth.uid());
  END IF;

  -- Challenge creators can update submissions (to review them)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'creator_review_submission' AND tablename = 'challenge_submissions') THEN
    CREATE POLICY creator_review_submission ON public.challenge_submissions FOR UPDATE USING (
      EXISTS (SELECT 1 FROM public.challenges c WHERE c.id = challenge_id AND c.created_by = auth.uid())
    );
  END IF;
END $$;

-- 4. Force schema cache reload
NOTIFY pgrst, 'reload schema';
