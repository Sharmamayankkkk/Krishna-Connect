-- Add phone column to profiles table if it doesn't exist
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT UNIQUE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone);

-- Comment to explain usage
COMMENT ON COLUMN public.profiles.phone IS 'User phone number for SMS authentication and notifications.';
