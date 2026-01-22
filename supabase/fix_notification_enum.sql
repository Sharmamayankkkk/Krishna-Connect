-- ============================================================================
-- FIX NOTIFICATION TYPE ENUM
-- ============================================================================
-- IMPORTANT: Run this command ALONE first, then test reposting.
-- PostgreSQL requires new enum values to be committed before use.
-- ============================================================================

-- Step 1: Just run this single line:
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'new_repost';

-- After running the above, click "Run" again to verify:
-- SELECT unnest(enum_range(NULL::public.notification_type)) as notification_types;
