-- ============================================================================
-- FUNCTION: get_all_challenges
-- Purpose: Fetches all active and completed challenges, along with user-specific
--          participation data.
-- Returns: TABLE with challenge details and a boolean indicating if the
--          current user has joined the challenge.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_all_challenges(p_user_id UUID)
RETURNS TABLE (
    id BIGINT,
    title TEXT,
    description TEXT,
    is_active BOOLEAN,
    participant_count BIGINT,
    has_joined BOOLEAN
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.title,
        c.description,
        c.is_active,
        (SELECT COUNT(*) FROM public.challenge_participants WHERE challenge_id = c.id) AS participant_count,
        EXISTS(
            SELECT 1 FROM public.challenge_participants cp
            WHERE cp.challenge_id = c.id AND cp.user_id = p_user_id
        ) AS has_joined
    FROM
        public.challenges c
    ORDER BY
        c.is_active DESC, c.start_date DESC;
END;
$$;

-- 03 November 2025 02:00 IST