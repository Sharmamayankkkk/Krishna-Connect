-- ============================================================================
-- 02_calls_rls.sql
-- Description: Row Level Security policies for calls and call_signals tables.
-- ============================================================================

-- Enable RLS
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_signals ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION: CALLS TABLE POLICIES
-- ============================================================================

-- Users can view their own calls (as caller or callee)
CREATE POLICY "Users can view their own calls"
    ON public.calls FOR SELECT
    USING (auth.uid() = caller_id OR auth.uid() = callee_id);

-- Users can create calls where they are the caller
CREATE POLICY "Users can create calls as caller"
    ON public.calls FOR INSERT
    WITH CHECK (auth.uid() = caller_id);

-- Users can update calls they are part of (to change status, end call, etc.)
CREATE POLICY "Users can update their own calls"
    ON public.calls FOR UPDATE
    USING (auth.uid() = caller_id OR auth.uid() = callee_id);

-- ============================================================================
-- SECTION: CALL_SIGNALS TABLE POLICIES
-- ============================================================================

-- Users can view signals addressed to them or sent by them
CREATE POLICY "Users can view their own signals"
    ON public.call_signals FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can insert signals where they are the sender
CREATE POLICY "Users can send signals"
    ON public.call_signals FOR INSERT
    WITH CHECK (auth.uid() = sender_id);
