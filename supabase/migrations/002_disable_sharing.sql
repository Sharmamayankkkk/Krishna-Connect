-- Migration 002: Disable Sharing
-- Adds a flag that prevents message forwarding in a chat.
-- Works for both DMs (either user can toggle) and groups (admin only).
-- When true: Forward button is hidden in the UI and copying media is discouraged.

ALTER TABLE chats
  ADD COLUMN IF NOT EXISTS disable_sharing BOOLEAN DEFAULT FALSE;
