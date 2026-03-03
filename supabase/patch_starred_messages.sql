-- Migration: Add per-user starred messages support
-- The is_starred boolean flag is global. This adds a starred_by UUID[] column
-- so each user can star messages independently (like WhatsApp).

-- Add starred_by column for per-user starring
ALTER TABLE public.messages
    ADD COLUMN IF NOT EXISTS starred_by UUID[] DEFAULT ARRAY[]::UUID[];

-- Migrate existing starred messages: if is_starred=true, we don't know who starred it,
-- so we leave starred_by empty. New stars will use the array.

-- Function to toggle star for a specific user
CREATE OR REPLACE FUNCTION public.toggle_star_message(p_message_id BIGINT, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_is_starred BOOLEAN;
    v_new_starred UUID[];
BEGIN
    -- Check if user already starred the message
    SELECT p_user_id = ANY(starred_by) INTO v_is_starred
    FROM public.messages
    WHERE id = p_message_id;

    IF v_is_starred THEN
        -- Remove the star
        v_new_starred := array_remove(starred_by, p_user_id);
        UPDATE public.messages
        SET starred_by = v_new_starred,
            is_starred = (array_length(v_new_starred, 1) IS NOT NULL)
        WHERE id = p_message_id;
        RETURN FALSE;
    ELSE
        -- Add the star
        UPDATE public.messages
        SET starred_by = array_append(starred_by, p_user_id),
            is_starred = TRUE
        WHERE id = p_message_id;
        RETURN TRUE;
    END IF;
END;
$$;

-- Function to get starred messages for a user across all their chats
CREATE OR REPLACE FUNCTION public.get_user_starred_messages(p_user_id UUID)
RETURNS SETOF public.messages
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
    SELECT m.*
    FROM public.messages m
    JOIN public.participants p ON p.chat_id = m.chat_id AND p.user_id = p_user_id
    WHERE p_user_id = ANY(m.starred_by)
    ORDER BY m.created_at DESC;
$$;
