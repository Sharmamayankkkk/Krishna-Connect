-- Challenges 2.0 Database Upgrade Script
-- Apply this file to your Supabase instance

-- ==========================================
-- SECTION 1: ENUMS & TYPE DEFINITIONS
-- ==========================================
DO $$ BEGIN
    CREATE TYPE challenge_status AS ENUM ('draft', 'scheduled', 'active', 'submission_closed', 'completed', 'cancelled');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE challenge_type AS ENUM ('proof_based', 'speed_race', 'community_voted', 'scored', 'milestone');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE challenge_difficulty AS ENUM ('beginner', 'intermediate', 'pro');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE challenge_visibility AS ENUM ('public', 'followers_only', 'private');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE submission_mod_type AS ENUM ('manual', 'auto_approve');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE scoring_type AS ENUM ('binary', 'weighted');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE voting_method AS ENUM ('likes', 'stars', 'updown');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE reward_type AS ENUM ('badge', 'points', 'prize', 'certificate', 'none');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE submission_content_type AS ENUM ('image', 'video', 'text', 'file', 'link');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE sub_vis_type AS ENUM ('public', 'author_only');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;


-- ==========================================
-- SECTION 2: ALTER EXISTING TABLES
-- ==========================================

-- 2.1: challenges
ALTER TABLE public.challenges 
ADD COLUMN IF NOT EXISTS status challenge_status DEFAULT 'draft',
ADD COLUMN IF NOT EXISTS type challenge_type DEFAULT 'proof_based',
ADD COLUMN IF NOT EXISTS difficulty challenge_difficulty DEFAULT 'beginner',
ADD COLUMN IF NOT EXISTS visibility challenge_visibility DEFAULT 'public',
ADD COLUMN IF NOT EXISTS submission_types submission_content_type[] DEFAULT '{image,text}'::submission_content_type[],
ADD COLUMN IF NOT EXISTS submission_deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS extended_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS grace_period_hours INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS allow_multiple_submissions BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS max_submissions_per_user INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS daily_submission_limit INTEGER,
ADD COLUMN IF NOT EXISTS allow_resubmit_after_rejection BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS submission_cooldown_hours INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS allow_edit_before_deadline BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS moderation_type submission_mod_type DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS scoring_type scoring_type DEFAULT 'binary',
ADD COLUMN IF NOT EXISTS voting_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS voting_method voting_method DEFAULT 'likes',
ADD COLUMN IF NOT EXISTS hide_votes_until_deadline BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS weighted_voting_by_followers BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS submissions_visibility sub_vis_type DEFAULT 'public',
ADD COLUMN IF NOT EXISTS comments_enabled BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS max_participants INTEGER,
ADD COLUMN IF NOT EXISTS reward_type reward_type DEFAULT 'none',
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT,
ADD COLUMN IF NOT EXISTS results_announced_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS parent_challenge_id BIGINT REFERENCES public.challenges(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS series_id UUID, -- Will reference series table
ADD COLUMN IF NOT EXISTS recurrence_rule TEXT,
ADD COLUMN IF NOT EXISTS is_template BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS template_category TEXT,
ADD COLUMN IF NOT EXISTS judge_ids UUID[],
ADD COLUMN IF NOT EXISTS terms_required BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS min_account_age_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS auto_expire_after_days INTEGER DEFAULT 14,
ADD COLUMN IF NOT EXISTS creator_reputation_snapshot NUMERIC(4,2);

-- Migrate old is_active data to new status ENUM
UPDATE public.challenges SET status = 'active' WHERE is_active = true AND status = 'draft';
UPDATE public.challenges SET status = 'completed' WHERE is_active = false AND status = 'draft';
-- Optional: DROP COLUMN is_active (keeping it for now for backward compat if any old code runs)


-- 2.2: challenge_participants
ALTER TABLE public.challenge_participants
ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_rank INTEGER,
ADD COLUMN IF NOT EXISTS total_entries INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS streak_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS experience_rating INTEGER CHECK (experience_rating >= 1 AND experience_rating <= 5);


-- 2.3: challenge_submissions
ALTER TABLE public.challenge_submissions
-- Re-defining some columns if needed or adding new ones
ADD COLUMN IF NOT EXISTS submission_number INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS sub_type submission_content_type DEFAULT 'image',
ADD COLUMN IF NOT EXISTS proof_link_url TEXT,
ADD COLUMN IF NOT EXISTS is_late BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
ADD COLUMN IF NOT EXISTS score NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS vote_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS reaction_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_shortlisted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS reviewed_by UUID,
ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS flag_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_draft BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS perceptual_hash TEXT;


-- ==========================================
-- SECTION 3: NEW TABLES
-- ==========================================

-- Votes
CREATE TABLE IF NOT EXISTS public.challenge_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.challenge_submissions(id) ON DELETE CASCADE,
    voter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    vote_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(submission_id, voter_id)
);
ALTER TABLE public.challenge_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view votes" ON public.challenge_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated can vote" ON public.challenge_votes FOR INSERT WITH CHECK (auth.uid() = voter_id);
CREATE POLICY "Users can remove their votes" ON public.challenge_votes FOR DELETE USING (auth.uid() = voter_id);

-- Reactions
CREATE TABLE IF NOT EXISTS public.challenge_reactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.challenge_submissions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reaction_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(submission_id, user_id, reaction_type)
);
ALTER TABLE public.challenge_reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view reactions" ON public.challenge_reactions FOR SELECT USING (true);
CREATE POLICY "Authenticated can react" ON public.challenge_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their blocks" ON public.challenge_reactions FOR DELETE USING (auth.uid() = user_id);

-- Rewards
CREATE TABLE IF NOT EXISTS public.challenge_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id BIGINT NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reward_type reward_type NOT NULL,
    badge_slug TEXT,
    points_issued INTEGER,
    certificate_url TEXT,
    issued_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Bookmarks
CREATE TABLE IF NOT EXISTS public.challenge_bookmarks (
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id BIGINT NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    PRIMARY KEY (user_id, challenge_id)
);
ALTER TABLE public.challenge_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own bookmarks" ON public.challenge_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bookmarks" ON public.challenge_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own bookmarks" ON public.challenge_bookmarks FOR DELETE USING (auth.uid() = user_id);

-- Invites
CREATE TABLE IF NOT EXISTS public.challenge_invites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id BIGINT NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    invited_by_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invited_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Notifications
CREATE TABLE IF NOT EXISTS public.challenge_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    challenge_id BIGINT REFERENCES public.challenges(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.challenge_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own notifications" ON public.challenge_notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.challenge_notifications FOR UPDATE USING (auth.uid() = user_id);

-- Comments
CREATE TABLE IF NOT EXISTS public.challenge_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id BIGINT NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES public.challenge_submissions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    body TEXT NOT NULL,
    parent_comment_id UUID REFERENCES public.challenge_comments(id) ON DELETE CASCADE,
    is_pinned BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.challenge_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view comments" ON public.challenge_comments FOR SELECT USING (is_deleted = false);
CREATE POLICY "Authenticated can insert comments" ON public.challenge_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users complete own comments" ON public.challenge_comments FOR UPDATE USING (auth.uid() = user_id);

-- Analytics
CREATE TABLE IF NOT EXISTS public.challenge_analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id BIGINT NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Templates
CREATE TABLE IF NOT EXISTS public.challenge_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    default_settings JSONB NOT NULL,
    category TEXT,
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_public BOOLEAN DEFAULT true,
    usage_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.challenge_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view public templates" ON public.challenge_templates FOR SELECT USING (is_public = true OR auth.uid() = created_by);

-- Series
CREATE TABLE IF NOT EXISTS public.challenge_series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT,
    recurrence_rule TEXT,
    created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
ALTER TABLE public.challenges ADD CONSTRAINT fk_challenges_series FOREIGN KEY (series_id) REFERENCES public.challenge_series(id) ON DELETE SET NULL;


-- Creator Reputation
CREATE TABLE IF NOT EXISTS public.creator_reputation (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    total_challenges_created INTEGER DEFAULT 0,
    completion_rate NUMERIC(5,2) DEFAULT 0.00,
    avg_review_time_hours NUMERIC(6,2),
    approval_ratio NUMERIC(5,2) DEFAULT 0.00,
    avg_participant_rating NUMERIC(3,2),
    reputation_score NUMERIC(5,2) DEFAULT 0.00,
    last_updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);


-- ==========================================
-- SECTION 4: RPCS (FUNCTIONS)
-- ==========================================

-- Function to handle voting and update cached vote count
CREATE OR REPLACE FUNCTION public.toggle_submission_vote(p_submission_id UUID, p_vote_type TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_voter_id UUID := auth.uid();
    v_exists BOOLEAN;
BEGIN
    SELECT EXISTS (SELECT 1 FROM public.challenge_votes WHERE submission_id = p_submission_id AND voter_id = v_voter_id) INTO v_exists;
    
    IF v_exists THEN
        DELETE FROM public.challenge_votes WHERE submission_id = p_submission_id AND voter_id = v_voter_id;
        UPDATE public.challenge_submissions SET vote_count = greatest(vote_count - 1, 0) WHERE id = p_submission_id;
        RETURN FALSE; -- Vote removed
    ELSE
        INSERT INTO public.challenge_votes (submission_id, voter_id, vote_type) VALUES (p_submission_id, v_voter_id, p_vote_type);
        UPDATE public.challenge_submissions SET vote_count = vote_count + 1 WHERE id = p_submission_id;
        RETURN TRUE; -- Vote added
    END IF;
END;
$$;

-- Refined create_challenge procedure
DROP FUNCTION IF EXISTS public.create_challenge(text,text,text,text,text,bigint);
CREATE OR REPLACE FUNCTION public.create_challenge(
    p_title TEXT,
    p_description TEXT DEFAULT NULL,
    p_rules TEXT DEFAULT NULL,
    p_prize_description TEXT DEFAULT NULL,
    p_cover_image TEXT DEFAULT NULL,
    p_status challenge_status DEFAULT 'draft',
    p_type challenge_type DEFAULT 'proof_based',
    p_difficulty challenge_difficulty DEFAULT 'beginner',
    p_category TEXT DEFAULT NULL,
    p_submission_deadline TIMESTAMP WITH TIME ZONE DEFAULT NULL,
    p_end_date TIMESTAMP WITH TIME ZONE DEFAULT NULL
    -- Intentionally keeping parameter list concise initially; more can be passed or updated directly via supabase client.
)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_verified TEXT;
    v_challenge_id BIGINT;
BEGIN
    SELECT is_verified INTO v_verified FROM public.profiles WHERE id = auth.uid();
    IF v_verified = 'none' THEN RAISE EXCEPTION 'Only verified users can create challenges'; END IF;

    INSERT INTO public.challenges (
        title, description, rules, prize_description, cover_image, 
        created_by, status, type, difficulty, category, 
        submission_deadline, end_date
    ) VALUES (
        p_title, p_description, p_rules, p_prize_description, p_cover_image, 
        auth.uid(), p_status, p_type, p_difficulty, p_category, 
        p_submission_deadline, p_end_date
    ) RETURNING id INTO v_challenge_id;

    RETURN v_challenge_id;
END;
$$;

-- Create get_user_challenge_entries specifically for Phase 1
CREATE OR REPLACE FUNCTION public.get_user_challenge_entries(p_challenge_id BIGINT)
RETURNS TABLE (
    id UUID,
    proof_text TEXT,
    proof_media_url TEXT,
    status TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT cs.id, cs.proof_text, cs.proof_media_url, cs.status, cs.rejection_reason, cs.created_at
    FROM public.challenge_submissions cs
    WHERE cs.challenge_id = p_challenge_id AND cs.user_id = auth.uid()
    ORDER BY cs.created_at DESC;
END;
$$;

-- Update to review_challenge_submission
DROP FUNCTION IF EXISTS public.review_challenge_submission(uuid,text,integer,text);
CREATE OR REPLACE FUNCTION public.review_challenge_submission(
    p_submission_id UUID,
    p_status TEXT,
    p_score NUMERIC(5,2) DEFAULT 0,
    p_rejection_reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_challenge_id BIGINT; v_user_id UUID;
BEGIN
    SELECT challenge_id, user_id INTO v_challenge_id, v_user_id FROM public.challenge_submissions WHERE id = p_submission_id;

    IF NOT EXISTS (SELECT 1 FROM public.challenges WHERE id = v_challenge_id AND created_by = auth.uid()) THEN
        RAISE EXCEPTION 'Only the challenge author can review submissions';
    END IF;

    UPDATE public.challenge_submissions
    SET status = p_status,
        score = p_score,
        rejection_reason = p_rejection_reason,
        reviewed_at = now(),
        reviewed_by = auth.uid()
    WHERE id = p_submission_id;

    -- Send notification (basic integration placeholder)
    INSERT INTO public.challenge_notifications (user_id, challenge_id, type, metadata)
    VALUES (
        v_user_id, 
        v_challenge_id, 
        CASE WHEN p_status = 'approved' THEN 'submission_approved' ELSE 'submission_rejected' END,
        jsonb_build_object('submission_id', p_submission_id, 'reason', p_rejection_reason)
    );
END;
$$;

