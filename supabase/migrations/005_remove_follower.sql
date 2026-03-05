-- Migration: Remove Follower RPC
-- Allows an account owner (the followee) to remove someone who follows them.
-- SECURITY DEFINER is required so the followee can delete a row they didn't create
-- (RLS normally only allows user_one_id to delete their own follow row).

-- Drop old version first (PostgreSQL won't allow renaming parameters via CREATE OR REPLACE)
DROP FUNCTION IF EXISTS remove_follower(UUID);

CREATE OR REPLACE FUNCTION remove_follower(follower_user_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM relationships
  WHERE user_one_id = follower_user_id
    AND user_two_id = auth.uid();
END;
$$;
