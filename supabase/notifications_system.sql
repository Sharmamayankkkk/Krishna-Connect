-- ============================================================================
-- NOTIFICATION SYSTEM ENHANCEMENTS
-- ============================================================================
-- This file contains additional SQL functions for the notifications system
-- to support the frontend implementation.
-- ============================================================================

-- ============================================================================
-- SECTION 1: NOTIFICATION FETCHING FUNCTIONS
-- ============================================================================

-- Get notifications with actor profile information
-- This makes it easy for the frontend to display notifications with user details
CREATE OR REPLACE FUNCTION public.get_user_notifications(p_limit INT DEFAULT 50, p_offset INT DEFAULT 0)
RETURNS TABLE (
    id BIGINT,
    user_id UUID,
    actor_id UUID,
    type TEXT,
    entity_id BIGINT,
    is_read BOOLEAN,
    created_at TIMESTAMPTZ,
    actor_name TEXT,
    actor_username TEXT,
    actor_avatar_url TEXT,
    actor_verified BOOLEAN,
    post_content TEXT,
    post_media_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        n.id,
        n.user_id,
        n.actor_id,
        n.type::TEXT,
        n.entity_id,
        n.is_read,
        n.created_at,
        p.name AS actor_name,
        p.username AS actor_username,
        p.avatar_url AS actor_avatar_url,
        p.verified AS actor_verified,
        CASE 
            WHEN n.type IN ('like', 'comment', 'repost', 'quote', 'collaboration_request') AND n.entity_id IS NOT NULL THEN
                SUBSTRING(posts.content FROM 1 FOR 100)
            ELSE NULL
        END AS post_content,
        CASE
            WHEN n.type IN ('like', 'comment', 'repost', 'quote', 'collaboration_request') AND n.entity_id IS NOT NULL AND jsonb_array_length(posts.media_urls) > 0 THEN
                posts.media_urls->0->>'type'
            ELSE NULL
        END AS post_media_type
    FROM public.notifications n
    LEFT JOIN public.profiles p ON n.actor_id = p.id
    LEFT JOIN public.posts posts ON n.entity_id = posts.id
    WHERE n.user_id = auth.uid()
    ORDER BY n.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Get unread notification count
CREATE OR REPLACE FUNCTION public.get_unread_notification_count()
RETURNS BIGINT AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)
        FROM public.notifications
        WHERE user_id = auth.uid() AND is_read = FALSE
    );
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Mark a single notification as read
CREATE OR REPLACE FUNCTION public.mark_notification_as_read(p_notification_id BIGINT)
RETURNS VOID AS $$
BEGIN
    UPDATE public.notifications
    SET is_read = TRUE
    WHERE id = p_notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Delete a notification
CREATE OR REPLACE FUNCTION public.delete_notification(p_notification_id BIGINT)
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.notifications
    WHERE id = p_notification_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Delete all notifications for the current user
CREATE OR REPLACE FUNCTION public.delete_all_notifications()
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.notifications
    WHERE user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- ============================================================================
-- SECTION 2: NOTIFICATION POLICY ENHANCEMENTS
-- ============================================================================

-- Allow users to delete their own notifications
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications" 
    ON public.notifications FOR DELETE 
    USING (auth.uid() = user_id);

-- ============================================================================
-- SECTION 3: GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.get_user_notifications(INT, INT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_unread_notification_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_notification_as_read(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_notification(BIGINT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_all_notifications() TO authenticated;

-- ============================================================================
-- END OF FILE
-- ============================================================================
