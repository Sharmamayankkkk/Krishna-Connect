-- ==============================================================================
-- POST-V2 ENHANCEMENTS: NETWORK ALGORITHM, FEATURED FLAGS, AND REWARDS
-- Run this script in the Supabase SQL Editor AFTER running 06_challenges_v2_rpc.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Alter Challenges Table
-- ------------------------------------------------------------------------------
ALTER TABLE public.challenges 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;

-- ------------------------------------------------------------------------------
-- 2. Update get_all_challenges RPC to include is_featured
-- ------------------------------------------------------------------------------
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
    is_featured boolean,
    prize_description text,
    reward_type text,
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
        c.is_featured,
        c.prize_description,
        c.reward_type::text,
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
        )
    ORDER BY 
        c.created_at DESC;
END;
$$;


-- ------------------------------------------------------------------------------
-- 3. Network Discovery RPC `get_network_challenges`
-- ------------------------------------------------------------------------------
-- Returns challenges where either the author is followed by the user, OR
-- a participant of the challenge is followed by the user.
DROP FUNCTION IF EXISTS public.get_network_challenges(uuid, integer);
CREATE OR REPLACE FUNCTION public.get_network_challenges(p_user_id uuid, p_limit integer DEFAULT 10)
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
    is_featured boolean,
    prize_description text,
    reward_type text,
    total_prize_pool text,
    network_reason text
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH UserFollows AS (
        -- Get everyone the user follows
        SELECT user_two_id AS followed_id 
        FROM relationships 
        WHERE user_one_id = p_user_id AND relationships.status = 'approved'
    ),
    MatchedChallenges AS (
        SELECT DISTINCT c.id, 
        CASE 
            WHEN c.created_by IN (SELECT followed_id FROM UserFollows) THEN 'Hosted by a creator you follow'
            ELSE 'Someone you follow is participating'
        END AS network_reason
        FROM challenges c
        LEFT JOIN challenge_participants cp ON c.id = cp.challenge_id
        WHERE c.status IN ('active', 'scheduled')
        AND c.visibility = 'public'
        AND (
            c.created_by IN (SELECT followed_id FROM UserFollows) 
            OR cp.user_id IN (SELECT followed_id FROM UserFollows)
        )
        -- Exclude challenges they created themselves to avoid echo chamber
        AND c.created_by != p_user_id
        -- Exclude challenges they have already joined
        AND NOT EXISTS (SELECT 1 FROM challenge_participants cp3 WHERE cp3.challenge_id = c.id AND cp3.user_id = p_user_id)
    )
    SELECT 
        c.id, c.title, c.description, c.rules, c.created_by AS author_id,
        p.name AS author_name, p.username AS author_username, p.avatar_url AS author_avatar,
        COALESCE(p.verified, 'none') AS author_verified,
        c.start_date, c.end_date, c.status, c.difficulty, c.type AS challenge_type, c.cover_image,
        (SELECT COUNT(*) FROM challenge_participants cp WHERE cp.challenge_id = c.id) AS participant_count,
        (SELECT COUNT(*) FROM challenge_submissions cs WHERE cs.challenge_id = c.id) AS submission_count,
        EXISTS(SELECT 1 FROM challenge_bookmarks cb WHERE cb.challenge_id = c.id AND cb.user_id = p_user_id) AS is_bookmarked,
        FALSE AS has_joined, -- Always false because of CTE filter
        c.is_featured,
        c.prize_description,
        c.reward_type::text,
        NULL::text AS total_prize_pool,
        mc.network_reason
    FROM 
        challenges c
    JOIN MatchedChallenges mc ON c.id = mc.id
    JOIN profiles p ON c.created_by = p.id
    ORDER BY c.created_at DESC
    LIMIT p_limit;
END;
$$;


-- ------------------------------------------------------------------------------
-- 4. Overwrite Declare Winner to Mint Badges
-- ------------------------------------------------------------------------------
-- If the challenge reward type is 'badge', automatically insert into challenge_rewards
CREATE OR REPLACE FUNCTION public.declare_challenge_winner(p_challenge_id BIGINT, p_winner_id UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_reward_type reward_type;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.challenges WHERE id = p_challenge_id AND created_by = auth.uid()) THEN
        RAISE EXCEPTION 'Only the challenge author can declare a winner';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.challenge_submissions WHERE challenge_id = p_challenge_id AND user_id = p_winner_id AND status = 'approved') THEN
        RAISE EXCEPTION 'Winner must have an approved submission';
    END IF;

    -- Fetch reward type
    SELECT reward_type INTO v_reward_type FROM public.challenges WHERE id = p_challenge_id;

    -- Close the challenge and declare winner
    UPDATE public.challenges 
    SET winner_id = p_winner_id, winner_declared_at = now(), status = 'completed' 
    WHERE id = p_challenge_id;
    
    -- Set winner rank
    UPDATE public.challenge_participants 
    SET status = 'winner', current_rank = 1 
    WHERE challenge_id = p_challenge_id AND user_id = p_winner_id;

    -- Compute ranks for others based on points
    WITH ranked AS (
        SELECT user_id, ROW_NUMBER() OVER (ORDER BY points DESC, completed_at ASC) + 1 AS rnk
        FROM public.challenge_participants
        WHERE challenge_id = p_challenge_id AND status = 'submitted' AND user_id != p_winner_id
    )
    UPDATE public.challenge_participants cp SET current_rank = r.rnk
    FROM ranked r WHERE cp.challenge_id = p_challenge_id AND cp.user_id = r.user_id;

    -- Mint Badge if applicable (ignore conflicts if already minted)
    IF v_reward_type = 'badge' THEN
        INSERT INTO public.challenge_rewards (challenge_id, user_id, reward_type, badge_slug)
        VALUES (p_challenge_id, p_winner_id, 'badge', 'gold_winner');
    END IF;
END;
$$;
