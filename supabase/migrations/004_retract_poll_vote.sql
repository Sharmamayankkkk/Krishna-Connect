-- Migration 004: Retract Poll Vote
-- Adds an RPC function to allow users to retract their vote from a poll.

CREATE OR REPLACE FUNCTION retract_poll_vote(
  p_poll_id   BIGINT,
  p_user_id   UUID,
  p_option_id TEXT DEFAULT NULL
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_option_id IS NOT NULL THEN
    -- Remove vote for a specific option
    DELETE FROM poll_votes
    WHERE poll_id = p_poll_id
      AND user_id = p_user_id
      AND option_id = p_option_id;
  ELSE
    -- Remove all votes by this user on this poll
    DELETE FROM poll_votes
    WHERE poll_id = p_poll_id
      AND user_id = p_user_id;
  END IF;
END;
$$;
