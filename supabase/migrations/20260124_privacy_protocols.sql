-- Privacy Protocols Migration
-- Implements strict privacy checks for followers/following lists and DM creation

-- 1. Update get_followers_list to enforce privacy
CREATE OR REPLACE FUNCTION public.get_followers_list(target_user_id UUID)
RETURNS TABLE (id UUID, name TEXT, username TEXT, avatar_url TEXT, bio TEXT, verified BOOLEAN, followed_at TIMESTAMPTZ) AS $$
DECLARE
    v_is_private BOOLEAN;
    v_is_following BOOLEAN;
BEGIN
    -- Check if target user is private
    SELECT is_private INTO v_is_private FROM public.profiles WHERE id = target_user_id;
    
    -- Check if current user is following target user (approved)
    SELECT EXISTS (
        SELECT 1 FROM public.relationships 
        WHERE user_one_id = auth.uid() 
        AND user_two_id = target_user_id 
        AND status = 'approved'
    ) INTO v_is_following;

    -- Privacy Check: If private, not following, and not viewing own profile -> Return empty
    IF v_is_private AND NOT v_is_following AND auth.uid() != target_user_id THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT p.id, p.name, p.username, p.avatar_url, p.bio, p.verified, r.created_at
    FROM public.relationships r
    JOIN public.profiles p ON p.id = r.user_one_id
    WHERE r.user_two_id = target_user_id AND r.status = 'approved'
    ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Update get_following_list to enforce privacy
CREATE OR REPLACE FUNCTION public.get_following_list(target_user_id UUID)
RETURNS TABLE (id UUID, name TEXT, username TEXT, avatar_url TEXT, bio TEXT, verified BOOLEAN, followed_at TIMESTAMPTZ) AS $$
DECLARE
    v_is_private BOOLEAN;
    v_is_following BOOLEAN;
BEGIN
    -- Check if target user is private
    SELECT is_private INTO v_is_private FROM public.profiles WHERE id = target_user_id;
    
    -- Check if current user is following target user (approved)
    SELECT EXISTS (
        SELECT 1 FROM public.relationships 
        WHERE user_one_id = auth.uid() 
        AND user_two_id = target_user_id 
        AND status = 'approved'
    ) INTO v_is_following;

    -- Privacy Check: If private, not following, and not viewing own profile -> Return empty
    IF v_is_private AND NOT v_is_following AND auth.uid() != target_user_id THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT p.id, p.name, p.username, p.avatar_url, p.bio, p.verified, r.created_at
    FROM public.relationships r
    JOIN public.profiles p ON p.id = r.user_two_id
    WHERE r.user_one_id = target_user_id AND r.status = 'approved'
    ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update create_dm_chat to enforce messaging restrictions
CREATE OR REPLACE FUNCTION public.create_dm_chat(target_user_id UUID)
RETURNS BIGINT AS $$
DECLARE 
    v_chat_id BIGINT;
    v_is_private BOOLEAN;
    v_is_following BOOLEAN;
BEGIN
    -- Check if a DM chat already exists
    v_chat_id := public.get_dm_chat_id(target_user_id);
    IF v_chat_id IS NOT NULL THEN
        RETURN v_chat_id;
    END IF;

    -- Check if target user is private
    SELECT is_private INTO v_is_private FROM public.profiles WHERE id = target_user_id;
    
    -- Check if current user is following target user (approved)
    SELECT EXISTS (
        SELECT 1 FROM public.relationships 
        WHERE user_one_id = auth.uid() 
        AND user_two_id = target_user_id 
        AND status = 'approved'
    ) INTO v_is_following;

    -- Restriction: If target is private and user is not following, deny creation
    IF v_is_private AND NOT v_is_following THEN
        RAISE EXCEPTION 'You cannot message this private account until they accept your follow request.';
    END IF;

    -- Create new DM chat
    INSERT INTO public.chats (type) VALUES ('dm') RETURNING id INTO v_chat_id;
    INSERT INTO public.participants (chat_id, user_id) VALUES (v_chat_id, auth.uid()), (v_chat_id, target_user_id);
    
    RETURN v_chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
