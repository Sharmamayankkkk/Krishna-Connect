-- ============================================================================
-- 25_fix_infinite_recursion.sql
-- Description: Fixes infinite recursion in RLS policies for call_participants.
-- ============================================================================

-- The issue is that 'calls' policy queries 'call_participants', and 'call_participants' policy queries 'calls'.
-- We need to break this cycle. We will modify 'call_participants' to NOT query 'calls'.

-- 1. DROP EXISTING POLICIES ON call_participants
DROP POLICY IF EXISTS "Participants can view other participants in the same call" ON public.call_participants;
DROP POLICY IF EXISTS "Users can insert themselves as participants" ON public.call_participants;
DROP POLICY IF EXISTS "Users can update their own participant status" ON public.call_participants;

-- 2. CREATE NON-RECURSIVE SELECT POLICY
-- Users can see a participant row if:
-- 1. It is their own row (user_id = auth.uid())
-- 2. OR they are a participant in the same call (querying call_participants only)
CREATE POLICY "Participants can view other participants in the same call"
ON public.call_participants FOR SELECT
USING (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.call_participants cp
        WHERE cp.call_id = call_id
        AND cp.user_id = auth.uid()
    )
);

-- 3. RE-CREATE INSERT/UPDATE POLICIES (Keep them simple)
-- Users can only insert themselves (for joining a group call)
CREATE POLICY "Users can insert themselves as participants"
ON public.call_participants FOR INSERT
WITH CHECK (
    user_id = auth.uid()
);

-- Users can update their own status (leaving, declining)
CREATE POLICY "Users can update their own participant status"
ON public.call_participants FOR UPDATE
USING ( user_id = auth.uid() );

-- 4. ENSURE CALLS POLICY REMAINS (already set in previous migration, but good to be sure)
-- The 'calls' policy from migration 24 checks 'call_participants', which is now safe
-- because 'call_participants' policy no longer checks 'calls'.
