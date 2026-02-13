-- ============================================================================
-- 04_call_notifications.sql
-- Description: Functions and triggers to support push notifications for calls.
-- Compatible with: public.users (id TEXT, first_name TEXT, last_name TEXT, image_url TEXT)
--
-- NOTE: The notification insertion is best-effort. If the notifications table
--       does not exist, the trigger will log a notice and skip silently.
--       Push notifications are primarily sent via the API route, not this trigger.
-- ============================================================================

-- ============================================================================
-- FUNCTION: notify_on_incoming_call
-- Triggered on INSERT to calls table.
-- Attempts to create a notification record for the callee if notifications
-- table exists. Gracefully does nothing if the table is missing.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.notify_on_incoming_call()
RETURNS TRIGGER AS $$
BEGIN
    -- Only notify on new ringing calls
    IF NEW.status = 'ringing' THEN
        -- Attempt to insert notification; skip if table does not exist
        BEGIN
            EXECUTE format(
                'INSERT INTO public.notifications (user_id, actor_id, type, entity_id, is_read, created_at)
                 VALUES ($1, $2, $3, NULL, FALSE, NOW())'
            ) USING NEW.callee_id, NEW.caller_id, 'mention';
            -- Using 'mention' type as a fallback since 'incoming_call' may not exist in the enum.
            -- The actual push notification is sent via the API, this is just an in-app record.
        EXCEPTION WHEN undefined_table OR invalid_text_representation OR others THEN
            -- Table doesn't exist or column types don't match; skip silently.
            RAISE NOTICE 'Could not insert call notification: %', SQLERRM;
        END;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger (idempotent)
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
-- When a call is answered, declined, missed, or ended, attempt to mark related
-- notifications as read. Gracefully handles missing notifications table.
-- ============================================================================
CREATE OR REPLACE FUNCTION public.cleanup_call_notification()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('answered', 'declined', 'missed', 'ended', 'busy', 'failed')
       AND OLD.status = 'ringing' THEN
        BEGIN
            EXECUTE format(
                'UPDATE public.notifications SET is_read = TRUE
                 WHERE user_id = $1 AND actor_id = $2 AND is_read = FALSE'
            ) USING NEW.callee_id, NEW.caller_id;
        EXCEPTION WHEN undefined_table OR others THEN
            -- Notifications table doesn't exist; skip silently.
            RAISE NOTICE 'Could not update call notification: %', SQLERRM;
        END;
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
