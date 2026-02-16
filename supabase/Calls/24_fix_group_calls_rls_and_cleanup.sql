-- ============================================================================
-- 24_fix_group_calls_rls_and_cleanup.sql
-- Description: Fixes RLS for group calls and adds triggers to auto-end calls/update UI.
-- ============================================================================

-- 1. DROP EXISTING RESTRICTIVE RLS POLICIES ON calls
-- We need to drop "Users can view their own calls" as it only checks caller/callee.
DROP POLICY IF EXISTS "Users can view their own calls" ON public.calls;

-- 2. CREATE NEW INCLUSIVE RLS POLICY
-- Allows viewing if:
-- - You are the caller OR callee (1-on-1)
-- - OR You are a participant in the call
-- - OR The call is verified as a group call AND you are a member of that group chat
CREATE POLICY "Users can view calls they are involved in"
ON public.calls FOR SELECT
USING (
    auth.uid() = caller_id 
    OR auth.uid() = callee_id
    OR EXISTS (
        SELECT 1 FROM public.call_participants cp
        WHERE cp.call_id = id
        AND cp.user_id = auth.uid()
    )
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

-- 3. FUNCTION TO AUTO-END GROUP CALL WHEN LAST PERSON LEAVES
CREATE OR REPLACE FUNCTION public.auto_end_group_call()
RETURNS TRIGGER AS $$
DECLARE
    active_count INTEGER;
BEGIN
    -- Only proceed if status changed to 'left' or 'declined'
    IF NEW.status IN ('left', 'declined') THEN
        -- Count remaining active participants
        SELECT COUNT(*) INTO active_count
        FROM public.call_participants
        WHERE call_id = NEW.call_id
        AND status = 'joined';

        -- If no one is left, end the call
        IF active_count = 0 THEN
            UPDATE public.calls
            SET status = 'ended',
                ended_at = NOW()
            WHERE id = NEW.call_id
            AND status != 'ended'; -- Prevent redundant updates
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. TRIGGER FOR AUTO-ENDING CALLS
DROP TRIGGER IF EXISTS on_participant_leave ON public.call_participants;
CREATE TRIGGER on_participant_leave
AFTER UPDATE OF status ON public.call_participants
FOR EACH ROW
EXECUTE FUNCTION public.auto_end_group_call();

-- 5. FUNCTION TO UPDATE CHAT MESSAGE WHEN CALL ENDS
-- Replaces '|started|' with '|ended|' in the call history message
CREATE OR REPLACE FUNCTION public.sync_call_message_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Only run if status changed to 'ended'
    IF NEW.status = 'ended' AND OLD.status != 'ended' THEN
        -- The call message format is: [[CALL:type|status|duration|caller_id|call_id]]
        -- We want to change 'started' or 'ringing' or 'answered' to 'ended'
        -- But specifically for the persistent "Join" button, we look for 'started'.
        
        -- We'll try to replace 'started' with 'ended' for this call ID.
        -- We target messages that contain the call ID.
        UPDATE public.messages
        SET content = REPLACE(content, '|started|', '|ended|')
        WHERE content LIKE '%[[CALL:%' 
          AND content LIKE '%' || NEW.id || ']]%'
          AND content LIKE '%|started|%';
          
        -- Also handle 'ringing' or 'answered' if we want them to show as ended too
        UPDATE public.messages
        SET content = REPLACE(content, '|answered|', '|ended|')
        WHERE content LIKE '%[[CALL:%' 
          AND content LIKE '%' || NEW.id || ']]%'
          AND content LIKE '%|answered|%';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. TRIGGER FOR UPDATING CHAT MESSAGES
DROP TRIGGER IF EXISTS on_call_ended_update_ui ON public.calls;
CREATE TRIGGER on_call_ended_update_ui
AFTER UPDATE OF status ON public.calls
FOR EACH ROW
EXECUTE FUNCTION public.sync_call_message_status();
