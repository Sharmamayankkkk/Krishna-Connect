-- ============================================================================
-- 26_fix_recursion_with_functions.sql
-- Description: Fixes infinite recursion in RLS policies by using SECURITY DEFINER functions.
-- ============================================================================

-- 1. Helper function to check if user is a participant (Bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_active_participant(p_call_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.call_participants 
        WHERE call_id = p_call_id 
        AND user_id = p_user_id
    );
END;
$$;

-- 2. Helper function to check if user is caller or callee (Bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_call_owner(p_call_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.calls 
        WHERE id = p_call_id 
        AND (caller_id = p_user_id OR callee_id = p_user_id)
    );
END;
$$;

-- 3. Update 'calls' policy
DROP POLICY IF EXISTS "Users can view calls they are involved in" ON public.calls;

CREATE POLICY "Users can view calls they are involved in"
ON public.calls FOR SELECT
USING (
    -- Direct check (optimization)
    caller_id = auth.uid() 
    OR callee_id = auth.uid()
    -- Check if participant (using secure function to avoid recursion)
    OR is_active_participant(id, auth.uid())
    -- Group chat logic (assuming this doesn't recurse with calls/participants in a bad way)
    OR (
        is_group = true 
        AND chat_id IS NOT NULL 
        AND EXISTS (
            SELECT 1 FROM public.participants cpart
            WHERE cpart.chat_id = calls.chat_id
            AND cpart.user_id = auth.uid()
        )
    )
);

-- 4. Update 'call_participants' policy
DROP POLICY IF EXISTS "Participants can view other participants in the same call" ON public.call_participants;
DROP POLICY IF EXISTS "Participants can view partners" ON public.call_participants; -- Cleanup old names if any

CREATE POLICY "Participants can view other participants in the same call"
ON public.call_participants FOR SELECT
USING (
    -- Can always see self
    user_id = auth.uid()
    -- Can see others if I am a participant (using secure function)
    OR is_active_participant(call_id, auth.uid())
    -- Can see others if I am the caller/callee (using secure function)
    OR is_call_owner(call_id, auth.uid())
);
