-- Migration: Add language preference to profiles
-- Stores user preferred language for i18n persistence

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS preferred_language TEXT DEFAULT 'en';

-- Add a check constraint for valid language codes
ALTER TABLE profiles
ADD CONSTRAINT valid_language_code CHECK (
  preferred_language IN (
    'en', 'hi', 'bn', 'ta', 'te', 'mr', 'gu', 'kn', 'ml', 'pa', 'or', 'as',
    'sa', 'ur', 'es', 'fr', 'de', 'pt', 'it', 'ru', 'ar', 'zh', 'ja', 'ko'
  )
);

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_profiles_preferred_language ON profiles (preferred_language);
