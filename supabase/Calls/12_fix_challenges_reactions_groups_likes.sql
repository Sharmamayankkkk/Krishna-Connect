-- ============================================================
-- 12_fix_challenges_reactions_groups_likes.sql
-- Fixes for:
--   1. challenges ALTER TABLE syntax (wrapped in IF EXISTS)
--   2. toggle_reaction DROP before recreate
--   3. get_user_groups RPC (missing)
--   4. get_post_likes_users RPC (verified type mismatch)
-- ============================================================

-- ============================================================
-- 1. Fix challenges table columns (only if table exists)
--    The challenges table is created by 10_challenges_schema.sql.
--    If file 10 hasn't been run yet, skip these ALTER statements.
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'challenges') THEN
    ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS cover_image TEXT;
    ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS rules TEXT;
    ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS prize_description TEXT;
    ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS max_participants INTEGER;
    ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS requires_proof BOOLEAN DEFAULT true;
    ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
    ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS winner_id UUID REFERENCES public.profiles(id);
    ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS winner_declared_at TIMESTAMPTZ;
    ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';
    ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- Fix challenge_participants too (only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'challenge_participants') THEN
    ALTER TABLE public.challenge_participants ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'joined';
    ALTER TABLE public.challenge_participants ADD COLUMN IF NOT EXISTS rank INTEGER;
    ALTER TABLE public.challenge_participants ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0;
    ALTER TABLE public.challenge_participants ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add check constraint separately (idempotent, only if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'challenge_participants') THEN
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint WHERE conname = 'challenge_participants_status_check'
    ) THEN
      ALTER TABLE public.challenge_participants
        ADD CONSTRAINT challenge_participants_status_check
        CHECK (status IN ('joined', 'submitted', 'verified', 'rejected', 'winner'));
    END IF;
  END IF;
END $$;

-- ============================================================
-- 2. Fix toggle_reaction: DROP first then recreate
--    Error: cannot change return type of existing function
-- ============================================================

-- Drop ALL overloads to start clean
DROP FUNCTION IF EXISTS public.toggle_reaction(TEXT, UUID, UUID);
DROP FUNCTION IF EXISTS public.toggle_reaction(TEXT, BIGINT, UUID);

-- Recreate with correct BIGINT message_id
CREATE OR REPLACE FUNCTION public.toggle_reaction(
  p_emoji TEXT,
  p_message_id BIGINT,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_reactions JSONB;
  v_user_list JSONB;
  v_new_reactions JSONB;
BEGIN
  SELECT COALESCE(reactions, '{}'::JSONB) INTO v_current_reactions
  FROM public.messages
  WHERE id = p_message_id;

  IF v_current_reactions IS NULL THEN
    RAISE EXCEPTION 'Message not found';
  END IF;

  v_user_list := COALESCE(v_current_reactions -> p_emoji, '[]'::JSONB);

  IF v_user_list @> to_jsonb(p_user_id::TEXT) THEN
    v_user_list := (
      SELECT COALESCE(jsonb_agg(elem), '[]'::JSONB)
      FROM jsonb_array_elements(v_user_list) AS elem
      WHERE elem #>> '{}' != p_user_id::TEXT
    );

    IF jsonb_array_length(v_user_list) = 0 THEN
      v_new_reactions := v_current_reactions - p_emoji;
    ELSE
      v_new_reactions := jsonb_set(v_current_reactions, ARRAY[p_emoji], v_user_list);
    END IF;
  ELSE
    v_user_list := v_user_list || to_jsonb(p_user_id::TEXT);
    v_new_reactions := jsonb_set(v_current_reactions, ARRAY[p_emoji], v_user_list);
  END IF;

  UPDATE public.messages SET reactions = v_new_reactions WHERE id = p_message_id;

  RETURN v_new_reactions;
END;
$$;

GRANT EXECUTE ON FUNCTION public.toggle_reaction(TEXT, BIGINT, UUID) TO authenticated;

-- ============================================================
-- 3. Add get_user_groups RPC (missing from schema)
-- ============================================================

DROP FUNCTION IF EXISTS public.get_user_groups(UUID);

CREATE OR REPLACE FUNCTION public.get_user_groups(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  image_url TEXT,
  description TEXT,
  member_count BIGINT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id,
    g.name,
    g.image_url,
    g.description,
    (SELECT COUNT(*) FROM public.group_members gm2 WHERE gm2.group_id = g.id) AS member_count,
    g.created_at
  FROM public.groups g
  JOIN public.group_members gm ON gm.group_id = g.id
  WHERE gm.user_id = p_user_id
  ORDER BY g.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_groups(UUID) TO authenticated;

-- ============================================================
-- 4. Fix get_post_likes_users — verified is TEXT not BOOLEAN
-- ============================================================

DROP FUNCTION IF EXISTS public.get_post_likes_users(INTEGER);
DROP FUNCTION IF EXISTS public.get_post_likes_users(BIGINT);

CREATE OR REPLACE FUNCTION public.get_post_likes_users(p_post_id INTEGER)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  name TEXT,
  avatar_url TEXT,
  verified TEXT,
  bio TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id AS user_id,
    p.username,
    COALESCE(p.name, p.username) AS name,
    p.avatar_url,
    COALESCE(p.verified, 'none') AS verified,
    COALESCE(p.bio, '') AS bio
  FROM public.post_likes pl
  JOIN public.profiles p ON p.id = pl.user_id
  WHERE pl.post_id = p_post_id
  ORDER BY pl.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_post_likes_users(INTEGER) TO authenticated, anon;

-- ============================================================
-- Reload PostgREST schema cache
-- ============================================================
NOTIFY pgrst, 'reload schema';
