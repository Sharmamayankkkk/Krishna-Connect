-- Add settings column to profiles table if it doesn't exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{}'::jsonb;

-- Comment on column
COMMENT ON COLUMN profiles.settings IS 'User preferences for theme, notifications, privacy, etc.';
