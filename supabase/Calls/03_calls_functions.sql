-- ============================================================================
-- 03_calls_functions.sql
-- Description: Database functions and triggers for the calling system.
-- Compatible with: public.users (id TEXT, username TEXT,
--                  first_name TEXT, last_name TEXT, image_url TEXT)
-- ============================================================================

-- ============================================================================
-- FUNCTION: update_call_duration
-- Automatically calculates and updates the duration when a call ends.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.update_call_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('ended', 'missed', 'declined', 'failed')
       AND NEW.ended_at IS NOT NULL
       AND NEW.started_at IS NOT NULL THEN
        NEW.duration_seconds := EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at))::INTEGER;
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (idempotent)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_call_duration') THEN
        CREATE TRIGGER trigger_update_call_duration
            BEFORE UPDATE ON public.calls
            FOR EACH ROW
            EXECUTE FUNCTION public.update_call_duration();
    END IF;
END $$;

-- ============================================================================
-- FUNCTION: check_user_busy
-- Checks if a user is currently on an active call.
-- p_user_id is TEXT to match public.users.id
-- ============================================================================
CREATE OR REPLACE FUNCTION public.check_user_busy(p_user_id TEXT)
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
-- Fetches call history for a user with caller/callee info from users table.
-- Returns: caller_name, caller_username, caller_avatar, etc.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.get_call_history(
    p_user_id TEXT,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    caller_id TEXT,
    callee_id TEXT,
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
    IF p_user_id <> auth.uid()::text THEN
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
        COALESCE(
            NULLIF(TRIM(COALESCE(caller_u.first_name, '') || ' ' || COALESCE(caller_u.last_name, '')), ''),
            caller_u.username
        ) AS caller_name,
        caller_u.username AS caller_username,
        caller_u.image_url AS caller_avatar,
        COALESCE(
            NULLIF(TRIM(COALESCE(callee_u.first_name, '') || ' ' || COALESCE(callee_u.last_name, '')), ''),
            callee_u.username
        ) AS callee_name,
        callee_u.username AS callee_username,
        callee_u.image_url AS callee_avatar
    FROM public.calls c
    LEFT JOIN public.users caller_u ON c.caller_id = caller_u.id
    LEFT JOIN public.users callee_u ON c.callee_id = callee_u.id
    WHERE c.caller_id = p_user_id OR c.callee_id = p_user_id
    ORDER BY c.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- FUNCTION: cleanup_stale_calls
-- Marks ringing calls as missed after 60 seconds of no answer.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cleanup_stale_calls()
RETURNS void AS $$
BEGIN
    UPDATE public.calls
    SET status = 'missed',
        ended_at = NOW(),
        updated_at = NOW()
    WHERE status = 'ringing'
    AND created_at < NOW() - INTERVAL '60 seconds'
    AND (caller_id = auth.uid()::text OR callee_id = auth.uid()::text OR auth.uid() IS NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- Enable Realtime for call_signals and calls (critical for WebRTC signaling)
-- ============================================================================
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.call_signals;
EXCEPTION WHEN duplicate_object THEN
    -- Already added, ignore
    NULL;
END $$;

DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;
EXCEPTION WHEN duplicate_object THEN
    -- Already added, ignore
    NULL;
END $$;
