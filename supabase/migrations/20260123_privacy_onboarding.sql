-- Add has_set_privacy column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS has_set_privacy BOOLEAN DEFAULT FALSE;

-- Update existing users to have has_set_privacy = FALSE (Implicitly handled by default, but good to be explicit if needed)
-- UPDATE public.profiles SET has_set_privacy = FALSE WHERE has_set_privacy IS NULL;
