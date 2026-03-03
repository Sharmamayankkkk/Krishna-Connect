-- Migration 001: Member Tags
-- Adds a 'tag' column to participants so group members can show
-- a short label (role, title, interest) next to their name in messages.
-- Admins can restrict whether members can set their own tags.

-- 1. Tag on each participant row
ALTER TABLE participants
  ADD COLUMN IF NOT EXISTS tag TEXT CHECK (char_length(tag) <= 25);

-- 2. Permission flag on the chat so admins can lock tag editing to admins-only
--    Stored as a JSONB settings blob to avoid future migrations for each perm.
ALTER TABLE chats
  ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}';

-- Example settings shape:
-- { "members_can_set_tag": true }
