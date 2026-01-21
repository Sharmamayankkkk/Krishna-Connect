-- ============================================================================
-- GROUPS SYSTEM HELPER FUNCTIONS
-- ============================================================================
-- This file contains SQL functions to support the groups feature
-- ============================================================================

-- ============================================================================
-- SECTION 1: FETCH PUBLIC GROUPS WITH MEMBER COUNTS
-- ============================================================================

-- Get all public groups with member count and user membership status
CREATE OR REPLACE FUNCTION public.get_public_groups(p_limit INT DEFAULT 50, p_offset INT DEFAULT 0)
RETURNS TABLE (
    id BIGINT,
    name TEXT,
    description TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ,
    created_by UUID,
    creator_name TEXT,
    creator_username TEXT,
    creator_avatar TEXT,
    member_count BIGINT,
    is_member BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.description,
        c.avatar_url,
        c.created_at,
        c.created_by,
        p.name AS creator_name,
        p.username AS creator_username,
        p.avatar_url AS creator_avatar,
        COALESCE(member_counts.count, 0) AS member_count,
        COALESCE(user_member.is_member, FALSE) AS is_member
    FROM public.chats c
    LEFT JOIN public.profiles p ON c.created_by = p.id
    LEFT JOIN (
        SELECT chat_id, COUNT(*) as count
        FROM public.participants
        GROUP BY chat_id
    ) member_counts ON c.id = member_counts.chat_id
    LEFT JOIN (
        SELECT chat_id, TRUE as is_member
        FROM public.participants
        WHERE user_id = auth.uid()
    ) user_member ON c.id = user_member.chat_id
    WHERE c.type = 'group' AND c.is_public = TRUE
    ORDER BY member_counts.count DESC NULLS LAST, c.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- ============================================================================
-- SECTION 2: GET USER'S GROUPS
-- ============================================================================

-- Get groups that the current user is a member of
CREATE OR REPLACE FUNCTION public.get_user_groups(p_limit INT DEFAULT 50, p_offset INT DEFAULT 0)
RETURNS TABLE (
    id BIGINT,
    name TEXT,
    description TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ,
    created_by UUID,
    creator_name TEXT,
    creator_username TEXT,
    creator_avatar TEXT,
    member_count BIGINT,
    is_admin BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.description,
        c.avatar_url,
        c.created_at,
        c.created_by,
        p.name AS creator_name,
        p.username AS creator_username,
        p.avatar_url AS creator_avatar,
        COALESCE(member_counts.count, 0) AS member_count,
        part.is_admin
    FROM public.chats c
    INNER JOIN public.participants part ON c.id = part.chat_id AND part.user_id = auth.uid()
    LEFT JOIN public.profiles p ON c.created_by = p.id
    LEFT JOIN (
        SELECT chat_id, COUNT(*) as count
        FROM public.participants
        GROUP BY chat_id
    ) member_counts ON c.id = member_counts.chat_id
    WHERE c.type = 'group'
    ORDER BY c.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- ============================================================================
-- SECTION 3: GET SUGGESTED GROUPS
-- ============================================================================

-- Get suggested groups (public groups user hasn't joined, sorted by popularity)
CREATE OR REPLACE FUNCTION public.get_suggested_groups(p_limit INT DEFAULT 10)
RETURNS TABLE (
    id BIGINT,
    name TEXT,
    description TEXT,
    avatar_url TEXT,
    created_at TIMESTAMPTZ,
    member_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.description,
        c.avatar_url,
        c.created_at,
        COALESCE(member_counts.count, 0) AS member_count
    FROM public.chats c
    LEFT JOIN (
        SELECT chat_id, COUNT(*) as count
        FROM public.participants
        GROUP BY chat_id
    ) member_counts ON c.id = member_counts.chat_id
    WHERE c.type = 'group' 
        AND c.is_public = TRUE
        AND NOT EXISTS (
            SELECT 1 FROM public.participants
            WHERE chat_id = c.id AND user_id = auth.uid()
        )
    ORDER BY member_counts.count DESC NULLS LAST, c.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- ============================================================================
-- SECTION 4: JOIN GROUP FUNCTION
-- ============================================================================

-- Join a public group
CREATE OR REPLACE FUNCTION public.join_group(p_group_id BIGINT)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_is_public BOOLEAN;
    v_already_member BOOLEAN;
BEGIN
    -- Check if group exists and is public
    SELECT is_public INTO v_is_public
    FROM public.chats
    WHERE id = p_group_id AND type = 'group';
    
    IF v_is_public IS NULL THEN
        RETURN jsonb_build_object('success', false, 'message', 'Group not found');
    END IF;
    
    IF v_is_public = FALSE THEN
        RETURN jsonb_build_object('success', false, 'message', 'Group is private');
    END IF;
    
    -- Check if already a member
    SELECT EXISTS(
        SELECT 1 FROM public.participants
        WHERE chat_id = p_group_id AND user_id = v_user_id
    ) INTO v_already_member;
    
    IF v_already_member THEN
        RETURN jsonb_build_object('success', false, 'message', 'Already a member');
    END IF;
    
    -- Add user to group
    INSERT INTO public.participants (chat_id, user_id, is_admin)
    VALUES (p_group_id, v_user_id, FALSE);
    
    RETURN jsonb_build_object('success', true, 'message', 'Successfully joined group');
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- ============================================================================
-- SECTION 5: LEAVE GROUP FUNCTION
-- ============================================================================

-- Leave a group
CREATE OR REPLACE FUNCTION public.leave_group(p_group_id BIGINT)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_is_creator BOOLEAN;
BEGIN
    -- Check if user is the creator
    SELECT (created_by = v_user_id) INTO v_is_creator
    FROM public.chats
    WHERE id = p_group_id AND type = 'group';
    
    IF v_is_creator THEN
        RETURN jsonb_build_object('success', false, 'message', 'Creator cannot leave group');
    END IF;
    
    -- Remove user from group
    DELETE FROM public.participants
    WHERE chat_id = p_group_id AND user_id = v_user_id;
    
    RETURN jsonb_build_object('success', true, 'message', 'Successfully left group');
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- ============================================================================
-- SECTION 6: GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.get_public_groups(INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_groups(INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_suggested_groups(INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.join_group(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.leave_group(BIGINT) TO authenticated;

-- ============================================================================
-- END OF FILE
-- ============================================================================
