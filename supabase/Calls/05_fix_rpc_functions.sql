-- ============================================================================
-- 05_fix_rpc_functions.sql
-- Description: Fix for PostgREST PGRST202 error - "Could not find the
--   function public.check_user_busy(p_user_id) in the schema cache"
--
-- Root cause: PostgREST caches function signatures. When the calls schema
--   was first created, the function may not have been visible to PostgREST
--   or the parameter type didn't match expectations. This script:
--   1. Drops existing functions cleanly
--   2. Recreates them with correct signatures (UUID to match profiles.id)
--   3. Sends a schema cache reload notification to PostgREST
--
-- Run this AFTER 01-04 SQL files have been executed.
-- ============================================================================

-- ============================================================================
-- Step 1: Drop existing functions to ensure clean state
-- ============================================================================

-- Drop check_user_busy with all possible parameter types
DROP FUNCTION IF EXISTS public.check_user_busy(TEXT);
DROP FUNCTION IF EXISTS public.check_user_busy(UUID);

-- Drop get_call_history with all possible parameter types
DROP FUNCTION IF EXISTS public.get_call_history(TEXT, INTEGER, INTEGER);
DROP FUNCTION IF EXISTS public.get_call_history(UUID, INTEGER, INTEGER);

-- Drop cleanup_stale_calls
DROP FUNCTION IF EXISTS public.cleanup_stale_calls();

-- ============================================================================
-- Step 2: Recreate functions with correct signatures
-- NOTE: All user ID parameters are UUID to match public.profiles.id type.
-- ============================================================================

-- check_user_busy: Returns true if user is on an active/ringing call
CREATE OR REPLACE FUNCTION public.check_user_busy(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.calls
        WHERE (caller_id = p_user_id OR callee_id = p_user_id)
        AND status IN ('ringing', 'answered')
    );
END;
$$;

-- get_call_history: Returns paginated call history with user details
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
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
        COALESCE(caller_p.name, caller_p.username) AS caller_name,
        caller_p.username AS caller_username,
        caller_p.avatar_url AS caller_avatar,
        COALESCE(callee_p.name, callee_p.username) AS callee_name,
        callee_p.username AS callee_username,
        callee_p.avatar_url AS callee_avatar
    FROM public.calls c
    LEFT JOIN public.profiles caller_p ON c.caller_id = caller_p.id
    LEFT JOIN public.profiles callee_p ON c.callee_id = callee_p.id
    WHERE c.caller_id = p_user_id OR c.callee_id = p_user_id
    ORDER BY c.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- cleanup_stale_calls: Mark ringing calls as missed after 60s
CREATE OR REPLACE FUNCTION public.cleanup_stale_calls()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    UPDATE public.calls
    SET status = 'missed',
        ended_at = NOW(),
        updated_at = NOW()
    WHERE status = 'ringing'
    AND created_at < NOW() - INTERVAL '60 seconds'
    AND (caller_id = auth.uid() OR callee_id = auth.uid() OR auth.uid() IS NULL);
END;
$$;

-- ============================================================================
-- Step 3: Grant execute permissions (ensure PostgREST can call them)
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.check_user_busy(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_busy(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_call_history(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_stale_calls() TO authenticated;

-- ============================================================================
-- Step 4: Notify PostgREST to reload its schema cache
-- This is critical — without this, PostgREST won't see the new functions
-- until it restarts or the cache expires.
-- ============================================================================

NOTIFY pgrst, 'reload schema';
