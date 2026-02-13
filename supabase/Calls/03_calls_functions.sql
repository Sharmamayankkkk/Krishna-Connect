-- ============================================================================
-- 03_calls_functions.sql
-- Description: Database functions and triggers for the calling system.
-- ============================================================================

-- ============================================================================
-- FUNCTION: update_call_duration
-- Automatically calculates and updates the duration when a call ends.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_call_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('ended', 'missed', 'declined', 'failed') AND NEW.ended_at IS NOT NULL AND NEW.started_at IS NOT NULL THEN
        NEW.duration_seconds := EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at))::INTEGER;
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_update_call_duration
    BEFORE UPDATE ON public.calls
    FOR EACH ROW
    EXECUTE FUNCTION public.update_call_duration();

-- ============================================================================
-- FUNCTION: check_user_busy
-- Checks if a user is currently on an active call.
-- Returns true if user is busy.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.check_user_busy(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.calls
        WHERE (caller_id = p_user_id OR callee_id = p_user_id)
        AND status IN ('ringing', 'answered')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: get_call_history
-- Fetches call history for a user with caller/callee profile info.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_call_history(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    caller_id UUID,
    callee_id UUID,
    call_type public.call_type,
    status public.call_status,
    started_at TIMESTAMPTZ,
    ended_at TIMESTAMPTZ,
    duration_seconds INTEGER,
    created_at TIMESTAMPTZ,
    caller_name TEXT,
    caller_username TEXT,
    caller_avatar TEXT,
    callee_name TEXT,
    callee_username TEXT,
    callee_avatar TEXT
) AS $$
BEGIN
    -- Authorization: users can only query their own call history
    IF p_user_id <> auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: cannot access another user''s call history';
    END IF;

    RETURN QUERY
    SELECT
        c.id,
        c.caller_id,
        c.callee_id,
        c.call_type,
        c.status,
        c.started_at,
        c.ended_at,
        c.duration_seconds,
        c.created_at,
        caller_profile.name AS caller_name,
        caller_profile.username AS caller_username,
        caller_profile.avatar_url AS caller_avatar,
        callee_profile.name AS callee_name,
        callee_profile.username AS callee_username,
        callee_profile.avatar_url AS callee_avatar
    FROM public.calls c
    JOIN public.profiles caller_profile ON c.caller_id = caller_profile.id
    JOIN public.profiles callee_profile ON c.callee_id = callee_profile.id
    WHERE c.caller_id = p_user_id OR c.callee_id = p_user_id
    ORDER BY c.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: cleanup_stale_calls
-- Marks ringing calls as missed after 60 seconds of no answer.
-- Should be invoked by a server-side scheduled job (e.g., pg_cron or Edge Function).
-- Restricted: only the calling user's own stale calls can be affected,
-- but this is intended for service-role or admin use.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cleanup_stale_calls()
RETURNS void AS $$
BEGIN
    -- Only clean up calls involving the current user, or allow service role
    UPDATE public.calls
    SET status = 'missed',
        ended_at = NOW(),
        updated_at = NOW()
    WHERE status = 'ringing'
    AND created_at < NOW() - INTERVAL '60 seconds'
    AND (caller_id = auth.uid() OR callee_id = auth.uid() OR auth.uid() IS NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Enable Realtime for call_signals (critical for WebRTC signaling)
-- ============================================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.call_signals;
ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;
