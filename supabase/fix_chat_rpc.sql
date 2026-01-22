-- ============================================================================
-- Fix Chat RPCs for Integer IDs and 'participants' table name
-- ============================================================================

-- Drop existing functions
DROP FUNCTION IF EXISTS public.get_dm_chat_id(uuid);
DROP FUNCTION IF EXISTS public.create_dm_chat(uuid);

-- Re-create get_dm_chat_id 
-- Uses BIGINT for chat_id
-- Uses 'participants' table instead of 'chat_members'
CREATE OR REPLACE FUNCTION public.get_dm_chat_id(target_user_id UUID)
RETURNS BIGINT AS $$
DECLARE
    v_chat_id BIGINT;
BEGIN
    SELECT c.id INTO v_chat_id
    FROM public.chats c
    JOIN public.participants cm1 ON cm1.chat_id = c.id
    JOIN public.participants cm2 ON cm2.chat_id = c.id
    WHERE c.type = 'dm'
    AND cm1.user_id = auth.uid()
    AND cm2.user_id = target_user_id;
    
    RETURN v_chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-create create_dm_chat
-- Uses BIGINT for chat_id
-- Uses 'participants' table instead of 'chat_members'
-- Removes 'role' column from insert as it might not exist or be handled by default
CREATE OR REPLACE FUNCTION public.create_dm_chat(target_user_id UUID)
RETURNS BIGINT AS $$
DECLARE
    v_chat_id BIGINT;
BEGIN
    -- Create chat
    INSERT INTO public.chats (type)
    VALUES ('dm')
    RETURNING id INTO v_chat_id;

    -- Add members
    INSERT INTO public.participants (chat_id, user_id)
    VALUES 
    (v_chat_id, auth.uid()),
    (v_chat_id, target_user_id);

    RETURN v_chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
