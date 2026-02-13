-- ============================================================================
-- 02_calls_rls.sql
-- Description: Row Level Security policies for calls and call_signals tables.
-- Note: caller_id / callee_id / sender_id / receiver_id are TEXT columns
--       that store user IDs. auth.uid() returns UUID, so we cast to TEXT.
-- ============================================================================

-- Enable RLS
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_signals ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION: CALLS TABLE POLICIES
-- ============================================================================

-- Users can view their own calls (as caller or callee)
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own calls' AND tablename = 'calls') THEN
        CREATE POLICY "Users can view their own calls"
            ON public.calls FOR SELECT
            USING (auth.uid()::text = caller_id OR auth.uid()::text = callee_id);
    END IF;
END $$;

-- Users can create calls where they are the caller
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create calls as caller' AND tablename = 'calls') THEN
        CREATE POLICY "Users can create calls as caller"
            ON public.calls FOR INSERT
            WITH CHECK (auth.uid()::text = caller_id);
    END IF;
END $$;

-- Users can update calls they are part of
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own calls' AND tablename = 'calls') THEN
        CREATE POLICY "Users can update their own calls"
            ON public.calls FOR UPDATE
            USING (auth.uid()::text = caller_id OR auth.uid()::text = callee_id);
    END IF;
END $$;

-- ============================================================================
-- SECTION: CALL_SIGNALS TABLE POLICIES
-- ============================================================================

-- Users can view signals addressed to them or sent by them
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own signals' AND tablename = 'call_signals') THEN
        CREATE POLICY "Users can view their own signals"
            ON public.call_signals FOR SELECT
            USING (auth.uid()::text = sender_id OR auth.uid()::text = receiver_id);
    END IF;
END $$;

-- Users can insert signals where they are the sender
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can send signals' AND tablename = 'call_signals') THEN
        CREATE POLICY "Users can send signals"
            ON public.call_signals FOR INSERT
            WITH CHECK (auth.uid()::text = sender_id);
    END IF;
END $$;
