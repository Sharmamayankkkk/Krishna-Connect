-- ==============================================================================
-- 🚀 CHALLENGES 2.0 RPC FUNCTIONS
-- Run this script in the Supabase SQL Editor AFTER running 05_challenges_v2.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Get All Challenges (Discovery Feed)
-- ------------------------------------------------------------------------------
-- Returns challenges with aggregated stats and current user's participation status
DROP FUNCTION IF EXISTS public.get_all_challenges(uuid);
CREATE OR REPLACE FUNCTION public.get_all_challenges(p_user_id uuid DEFAULT NULL)
RETURNS TABLE (
    id bigint,
    title text,
    description text,
    rules text,
    author_id uuid,
    author_name text,
    author_username text,
    author_avatar text,
    author_verified text,
    start_date timestamptz,
    end_date timestamptz,
    status challenge_status,
    difficulty challenge_difficulty,
    challenge_type challenge_type,
    cover_image text,
    participant_count bigint,
    submission_count bigint,
    is_bookmarked boolean,
    has_joined boolean,
    total_prize_pool text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.title,
        c.description,
        c.rules,
        c.created_by AS author_id,
        p.name AS author_name,
        p.username AS author_username,
        p.avatar_url AS author_avatar,
        COALESCE(p.verified, 'none') AS author_verified,
        c.start_date,
        c.end_date,
        c.status,
        c.difficulty,
        c.type AS challenge_type,
        c.cover_image,
        (SELECT COUNT(*) FROM challenge_participants cp WHERE cp.challenge_id = c.id) AS participant_count,
        (SELECT COUNT(*) FROM challenge_submissions cs WHERE cs.challenge_id = c.id) AS submission_count,
        EXISTS(SELECT 1 FROM challenge_bookmarks cb WHERE cb.challenge_id = c.id AND cb.user_id = p_user_id) AS is_bookmarked,
        EXISTS(SELECT 1 FROM challenge_participants cp2 WHERE cp2.challenge_id = c.id AND cp2.user_id = p_user_id) AS has_joined,
        NULL::text AS total_prize_pool
    FROM 
        challenges c
    JOIN 
        profiles p ON c.created_by = p.id
    WHERE 
        c.status IN ('active', 'scheduled', 'completed', 'submission_closed')
        AND (
            c.visibility = 'public' 
            OR c.created_by = p_user_id
            -- Add logic here if checking followers_only
        )
    ORDER BY 
        c.created_at DESC;
END;
$$;


-- ------------------------------------------------------------------------------
-- 2. Create Challenge (Vastly Expanded Signature)
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.create_challenge(
    text, text, timestamptz, timestamptz, timestamptz, challenge_status, challenge_difficulty, challenge_type, challenge_visibility, submission_mod_type, scoring_type, integer, boolean, text, text[], text, uuid
);

CREATE OR REPLACE FUNCTION public.create_challenge(
    p_title text,
    p_description text,
    p_start_date timestamptz,
    p_end_date timestamptz,
    p_submission_deadline timestamptz DEFAULT NULL,
    p_status challenge_status DEFAULT 'draft',
    p_difficulty challenge_difficulty DEFAULT 'beginner',
    p_challenge_type challenge_type DEFAULT 'proof_based',
    p_visibility challenge_visibility DEFAULT 'public',
    p_moderation_type submission_mod_type DEFAULT 'manual',
    p_scoring_type scoring_type DEFAULT 'binary',
    p_max_participants integer DEFAULT NULL,
    p_require_approval boolean DEFAULT false,
    p_cover_image text DEFAULT NULL,
    p_rules text[] DEFAULT NULL,
    p_prize_description text DEFAULT NULL,
    p_author_id uuid DEFAULT auth.uid()
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_new_challenge_id bigint;
BEGIN
    IF p_author_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Validate dates
    IF p_end_date <= p_start_date THEN
        RAISE EXCEPTION 'End date must be after start date';
    END IF;

    INSERT INTO challenges (
        title, description, created_by, start_date, end_date, submission_deadline,
        status, difficulty, type, visibility, moderation_type, scoring_type,
        max_participants, require_approval, cover_image, rules,
        created_at, updated_at
    ) VALUES (
        p_title, p_description, p_author_id, p_start_date, p_end_date, COALESCE(p_submission_deadline, p_end_date),
        p_status, p_difficulty, p_challenge_type, p_visibility, p_moderation_type, p_scoring_type,
        p_max_participants, p_require_approval, p_cover_image, p_rules,
        now(), now()
    ) RETURNING id INTO v_new_challenge_id;

    -- Skipping reward insertion here as challenge_rewards is for issued rewards to users, not challenge definitions

    -- Fire analytics event (requires challenge_analytics_events table)
    INSERT INTO challenge_analytics_events (challenge_id, actor_id, event_type)
    VALUES (v_new_challenge_id, p_author_id, 'challenge_created');

    RETURN v_new_challenge_id;
END;
$$;


-- ------------------------------------------------------------------------------
-- 3. Submit Challenge Proof
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.submit_challenge_proof(
    p_challenge_id bigint,
    p_proof_text text DEFAULT NULL,
    p_proof_media_url text DEFAULT NULL,
    p_is_draft boolean DEFAULT false,
    p_user_id uuid DEFAULT auth.uid()
)
RETURNS bigint
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_submission_id bigint;
    v_challenge_status challenge_status;
    v_submission_deadline timestamptz;
BEGIN
    IF p_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    -- Verify challenge is active
    SELECT status, submission_deadline INTO v_challenge_status, v_submission_deadline
    FROM challenges WHERE id = p_challenge_id;

    IF v_challenge_status != 'active' AND NOT p_is_draft THEN
        RAISE EXCEPTION 'Challenge is not currently active for submissions';
    END IF;

    IF now() > v_submission_deadline AND NOT p_is_draft THEN
        RAISE EXCEPTION 'Submission deadline has passed';
    END IF;

    -- Insert or update draft
    INSERT INTO challenge_submissions (
        challenge_id, user_id, proof_text, proof_media_url, 
        status, is_late, created_at, updated_at
    ) VALUES (
        p_challenge_id, p_user_id, p_proof_text, p_proof_media_url, 
        CASE WHEN p_is_draft THEN 'draft' ELSE 'pending' END,
        CASE WHEN now() > v_submission_deadline THEN true ELSE false END,
        now(), now()
    ) RETURNING id INTO v_submission_id;

    -- Notify author if not a draft
    IF NOT p_is_draft THEN
        INSERT INTO challenge_notifications (user_id, actor_id, challenge_id, type)
        SELECT created_by, p_user_id, p_challenge_id, 'new_submission'
        FROM challenges WHERE id = p_challenge_id;
    END IF;

    RETURN v_submission_id;
END;
$$;


-- ------------------------------------------------------------------------------
-- 4. Review Challenge Submission (Author action)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.review_challenge_submission(
    p_submission_id bigint,
    p_status text,
    p_score numeric DEFAULT NULL,
    p_rejection_reason text DEFAULT NULL,
    p_reviewer_id uuid DEFAULT auth.uid()
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_challenge_id bigint;
    v_author_id uuid;
    v_submitter_id uuid;
BEGIN
    -- Verify reviewer is author (or admin in future)
    SELECT c.id, c.created_by, cs.user_id INTO v_challenge_id, v_author_id, v_submitter_id
    FROM challenge_submissions cs
    JOIN challenges c ON cs.challenge_id = c.id
    WHERE cs.id = p_submission_id;

    IF v_author_id != p_reviewer_id THEN
        RAISE EXCEPTION 'Only the challenge author can review submissions';
    END IF;

    -- Update submission
    UPDATE challenge_submissions
    SET 
        status = p_status,
        score = COALESCE(p_score, score),
        rejection_reason = p_rejection_reason,
        reviewed_at = now()
    WHERE id = p_submission_id;

    -- Notify Submitter
    IF p_status = 'approved' THEN
        INSERT INTO challenge_notifications (user_id, actor_id, challenge_id, type)
        VALUES (v_submitter_id, p_reviewer_id, v_challenge_id, 'submission_approved');
        
        -- Add points to participant record
        UPDATE challenge_participants
        SET points = points + COALESCE(p_score, 10), -- default 10 points for valid entry
            completed_at = now()
        WHERE challenge_id = v_challenge_id AND user_id = v_submitter_id;
        
    ELSIF p_status = 'rejected' THEN
        INSERT INTO challenge_notifications (user_id, actor_id, challenge_id, type)
        VALUES (v_submitter_id, p_reviewer_id, v_challenge_id, 'submission_rejected');
    END IF;

    RETURN true;
END;
$$;


-- ------------------------------------------------------------------------------
-- 5. Get Challenge Submissions (For Detail View Feed and Author Manage)
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_challenge_submissions(bigint);
CREATE OR REPLACE FUNCTION public.get_challenge_submissions(p_challenge_id bigint)
RETURNS TABLE (
    id uuid,
    user_id uuid,
    user_name text,
    user_username text,
    user_avatar text,
    proof_text text,
    proof_media_url text,
    status text,
    score numeric,
    rejection_reason text,
    created_at timestamptz,
    vote_count bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cs.id,
        cs.user_id,
        p.name AS user_name,
        p.username AS user_username,
        p.avatar_url AS user_avatar,
        cs.proof_text,
        cs.proof_media_url,
        cs.status,
        cs.score,
        cs.rejection_reason,
        cs.created_at,
        (SELECT COUNT(*) FROM challenge_votes cv WHERE cv.submission_id = cs.id) AS vote_count
    FROM 
        challenge_submissions cs
    JOIN 
        profiles p ON cs.user_id = p.id
    WHERE 
        cs.challenge_id = p_challenge_id
        AND cs.status != 'draft' -- Don't show drafts publicly
    ORDER BY 
        cs.created_at DESC;
END;
$$;

-- ------------------------------------------------------------------------------
-- 6. Get Challenge Leaderboard
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_challenge_leaderboard(bigint);
CREATE OR REPLACE FUNCTION public.get_challenge_leaderboard(p_challenge_id bigint)
RETURNS TABLE (
    user_id uuid,
    name text,
    username text,
    avatar_url text,
    points numeric,
    streak integer,
    rank integer
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cp.user_id,
        p.name,
        p.username,
        p.avatar_url,
        cp.points,
        cp.streak,
        cp.current_rank AS rank
    FROM 
        challenge_participants cp
    JOIN 
        profiles p ON cp.user_id = p.id
    WHERE 
        cp.challenge_id = p_challenge_id
    ORDER BY 
        cp.points DESC, cp.joined_at ASC;
END;
$$;
