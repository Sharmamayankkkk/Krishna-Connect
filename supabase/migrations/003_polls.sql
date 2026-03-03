-- Migration 003: Polls
-- Creates polls and poll_votes tables.
-- A poll message has attachment_metadata.type = 'poll' and attachment_metadata.pollId.

CREATE TABLE IF NOT EXISTS polls (
  id            BIGSERIAL PRIMARY KEY,
  chat_id       BIGINT REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
  created_by    UUID REFERENCES auth.users(id) NOT NULL,
  question      TEXT NOT NULL CHECK (char_length(question) <= 300),
  options       JSONB NOT NULL,       -- [{ id: string, text: string }]
  is_anonymous  BOOLEAN DEFAULT FALSE,
  allows_multiple BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT now(),
  closes_at     TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS poll_votes (
  id         BIGSERIAL PRIMARY KEY,
  poll_id    BIGINT REFERENCES polls(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES auth.users(id) NOT NULL,
  option_id  TEXT NOT NULL,
  voted_at   TIMESTAMPTZ DEFAULT now()
);

-- Allow multiple votes per user only when allows_multiple is true
-- Enforce single vote via unique constraint (handled in RPC below)

-- RPC: cast or change a vote
CREATE OR REPLACE FUNCTION cast_poll_vote(
  p_poll_id  BIGINT,
  p_user_id  UUID,
  p_option_id TEXT
) RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_allows_multiple BOOLEAN;
BEGIN
  SELECT allows_multiple INTO v_allows_multiple FROM polls WHERE id = p_poll_id;

  IF NOT v_allows_multiple THEN
    -- remove existing vote before inserting new one
    DELETE FROM poll_votes WHERE poll_id = p_poll_id AND user_id = p_user_id;
  END IF;

  INSERT INTO poll_votes (poll_id, user_id, option_id)
  VALUES (p_poll_id, p_user_id, p_option_id)
  ON CONFLICT DO NOTHING;
END;
$$;

-- Enable RLS
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;

-- Policies: chat members can read polls in their chats
CREATE POLICY "Chat members can read polls"
  ON polls FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM participants
      WHERE participants.chat_id = polls.chat_id
        AND participants.user_id = auth.uid()
    )
  );

CREATE POLICY "Chat members can read votes"
  ON poll_votes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM polls p
      JOIN participants pt ON pt.chat_id = p.chat_id
      WHERE p.id = poll_votes.poll_id
        AND pt.user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can vote"
  ON poll_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own votes"
  ON poll_votes FOR DELETE
  USING (auth.uid() = user_id);
