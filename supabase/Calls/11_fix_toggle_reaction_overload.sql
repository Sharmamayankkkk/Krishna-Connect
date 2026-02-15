-- ============================================================
-- 11_fix_toggle_reaction_overload.sql
-- Fix: Drop the incorrect UUID overload of toggle_reaction
-- that causes PostgREST PGRST203 ambiguity error.
-- Messages use bigint IDs, so only the bigint version is correct.
-- ============================================================

-- Drop the incorrect UUID overload
DROP FUNCTION IF EXISTS public.toggle_reaction(p_emoji TEXT, p_message_id UUID, p_user_id UUID);

-- Ensure the correct bigint version exists
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
  -- Get current reactions for the message
  SELECT COALESCE(reactions, '{}'::JSONB) INTO v_current_reactions
  FROM public.messages
  WHERE id = p_message_id;

  IF v_current_reactions IS NULL THEN
    RAISE EXCEPTION 'Message not found';
  END IF;

  -- Get the current list of users for this emoji
  v_user_list := COALESCE(v_current_reactions -> p_emoji, '[]'::JSONB);

  -- Check if user already reacted with this emoji
  IF v_user_list @> to_jsonb(p_user_id::TEXT) THEN
    -- Remove the user's reaction
    v_user_list := (
      SELECT COALESCE(jsonb_agg(elem), '[]'::JSONB)
      FROM jsonb_array_elements(v_user_list) AS elem
      WHERE elem #>> '{}' != p_user_id::TEXT
    );

    -- If no users left for this emoji, remove the emoji key entirely
    IF jsonb_array_length(v_user_list) = 0 THEN
      v_new_reactions := v_current_reactions - p_emoji;
    ELSE
      v_new_reactions := jsonb_set(v_current_reactions, ARRAY[p_emoji], v_user_list);
    END IF;
  ELSE
    -- Add the user's reaction
    v_user_list := v_user_list || to_jsonb(p_user_id::TEXT);
    v_new_reactions := jsonb_set(v_current_reactions, ARRAY[p_emoji], v_user_list);
  END IF;

  -- Update the message
  UPDATE public.messages SET reactions = v_new_reactions WHERE id = p_message_id;

  RETURN v_new_reactions;
END;
$$;

-- Grant execute
GRANT EXECUTE ON FUNCTION public.toggle_reaction(TEXT, BIGINT, UUID) TO authenticated;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
