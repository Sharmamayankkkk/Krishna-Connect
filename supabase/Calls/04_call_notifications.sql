-- ============================================================================
-- 04_call_notifications.sql
-- Description: Functions and triggers to support push notifications for calls.
-- Handles sending push notifications when a new call is created and 
-- cleaning up notifications when calls are answered or ended.
-- ============================================================================

-- ============================================================================
-- FUNCTION: notify_on_incoming_call
-- Triggered on INSERT to calls table.
-- Creates a system notification record for the callee.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.notify_on_incoming_call()
RETURNS TRIGGER AS $$
BEGIN
    -- Only notify on new ringing calls
    IF NEW.status = 'ringing' THEN
        -- Insert a notification record for the callee
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            body,
            data,
            created_at
        )
        SELECT
            NEW.callee_id,
            'incoming_call',
            CASE NEW.call_type
                WHEN 'video' THEN 'Incoming Video Call'
                ELSE 'Incoming Voice Call'
            END,
            caller.name || ' is calling you...',
            jsonb_build_object(
                'call_id', NEW.id,
                'caller_id', NEW.caller_id,
                'call_type', NEW.call_type,
                'caller_name', caller.name,
                'caller_avatar', caller.avatar_url
            ),
            NOW()
        FROM public.profiles caller
        WHERE caller.id = NEW.caller_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger only if it doesn't exist (safe for re-runs)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_notify_incoming_call'
    ) THEN
        CREATE TRIGGER trigger_notify_incoming_call
            AFTER INSERT ON public.calls
            FOR EACH ROW
            EXECUTE FUNCTION public.notify_on_incoming_call();
    END IF;
END;
$$;

-- ============================================================================
-- FUNCTION: cleanup_call_notification
-- When a call is answered, declined, missed, or ended, mark related
-- notifications as read to clear them from the UI.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cleanup_call_notification()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('answered', 'declined', 'missed', 'ended', 'busy', 'failed')
       AND OLD.status = 'ringing' THEN
        UPDATE public.notifications
        SET read = true
        WHERE user_id = NEW.callee_id
          AND data->>'call_id' = NEW.id::text
          AND type = 'incoming_call';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_cleanup_call_notification'
    ) THEN
        CREATE TRIGGER trigger_cleanup_call_notification
            AFTER UPDATE ON public.calls
            FOR EACH ROW
            EXECUTE FUNCTION public.cleanup_call_notification();
    END IF;
END;
$$;
