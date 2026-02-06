-- Migration: Add pinned posts functionality
-- Verified users: unlimited pins
-- Unverified users: max 3 pins

-- Add pinned_at column to posts
ALTER TABLE posts ADD COLUMN IF NOT EXISTS pinned_at TIMESTAMPTZ DEFAULT NULL;

-- Create index for efficient pinned post queries
CREATE INDEX IF NOT EXISTS idx_posts_pinned ON posts (user_id, pinned_at) WHERE pinned_at IS NOT NULL;

-- Toggle pin function
CREATE OR REPLACE FUNCTION toggle_pin_post(p_post_id BIGINT)
RETURNS JSON AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_is_verified BOOLEAN;
  v_current_count INT;
  v_is_pinned BOOLEAN;
  v_post_owner UUID;
BEGIN
  -- Get post owner and current pin status
  SELECT user_id, (pinned_at IS NOT NULL) 
  INTO v_post_owner, v_is_pinned 
  FROM posts WHERE id = p_post_id;
  
  -- Check post exists and belongs to user
  IF v_post_owner IS NULL THEN
    RETURN json_build_object('success', false, 'message', 'Post not found');
  END IF;
  
  IF v_post_owner != v_user_id THEN
    RETURN json_build_object('success', false, 'message', 'Can only pin your own posts');
  END IF;
  
  -- Get verification status
  SELECT COALESCE(verified, false) INTO v_is_verified FROM profiles WHERE id = v_user_id;
  
  IF v_is_pinned THEN
    -- Unpin the post
    UPDATE posts SET pinned_at = NULL WHERE id = p_post_id;
    RETURN json_build_object('success', true, 'is_pinned', false, 'message', 'Post unpinned');
  ELSE
    -- Check limit for unverified users only
    IF NOT v_is_verified THEN
      SELECT COUNT(*) INTO v_current_count 
      FROM posts WHERE user_id = v_user_id AND pinned_at IS NOT NULL;
      
      IF v_current_count >= 3 THEN
        RETURN json_build_object('success', false, 'message', 'Maximum 3 pinned posts. Get verified for unlimited pins!');
      END IF;
    END IF;
    
    -- Pin the post
    UPDATE posts SET pinned_at = NOW() WHERE id = p_post_id;
    RETURN json_build_object('success', true, 'is_pinned', true, 'message', 'Post pinned to your profile');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
