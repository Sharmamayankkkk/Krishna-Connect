-- Migration 010: Push Notification Webhooks
-- Creates triggers to hit our Next.js /api/push/send route for real-time notifications

CREATE EXTENSION IF NOT EXISTS pg_net;

-- ============================================================================
-- 1. Notifications Table Webhook (Likes, Follows, Comments, etc)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.webhook_push_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_actor_name TEXT;
    v_actor_username TEXT;
    v_body TEXT;
    v_title TEXT;
    v_url TEXT;
    -- Set your production domain below:
    v_webhook_url TEXT := 'https://krishnaconnect.in/api/push/send';
    v_payload JSONB;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Don't send push if the user triggered it on their own entity
        IF NEW.user_id = NEW.actor_id THEN
            RETURN NEW;
        END IF;

        SELECT name, username INTO v_actor_name, v_actor_username FROM public.profiles WHERE id = NEW.actor_id;

        -- Format title and body based on type
        v_title := 'New Notification';
        v_url := '/notifications';

        IF NEW.type = 'new_like' THEN
            v_body := COALESCE(v_actor_name, 'Someone') || ' liked your post';
        ELSIF NEW.type = 'new_comment' THEN
            v_body := COALESCE(v_actor_name, 'Someone') || ' commented on your post';
        ELSIF NEW.type = 'new_repost' THEN
            v_body := COALESCE(v_actor_name, 'Someone') || ' reposted your post';
        ELSIF NEW.type = 'new_follower' THEN
            v_body := COALESCE(v_actor_name, 'Someone') || ' started following you';
            v_title := 'New Follower';
            v_url := '/profile/' || COALESCE(v_actor_username, '');
        ELSIF NEW.type = 'mention' THEN
            v_body := COALESCE(v_actor_name, 'Someone') || ' mentioned you';
        ELSIF NEW.type = 'live_event' THEN
            v_title := 'Live Event!';
            v_body := COALESCE(v_actor_name, 'Someone') || ' just went live!';
        END IF;

        IF v_body IS NOT NULL THEN
            v_payload := jsonb_build_object(
                'userId', NEW.user_id,
                'title', v_title,
                'body', v_body,
                'url', v_url
            );

            PERFORM net.http_post(
                url := v_webhook_url,
                body := v_payload,
                headers := '{"Content-Type": "application/json"}'::jsonb
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_push_on_notification ON public.notifications;
CREATE TRIGGER trigger_push_on_notification
    AFTER INSERT ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.webhook_push_notification();


-- ============================================================================
-- 2. Messages Table Webhook (Chat activity)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.webhook_push_message()
RETURNS TRIGGER AS $$
DECLARE
    v_actor_name TEXT;
    v_chat_name TEXT;
    v_body TEXT;
    v_title TEXT;
    v_url TEXT;
    -- Set your production domain below:
    v_webhook_url TEXT := 'https://krishnaconnect.in/api/push/send';
    v_payload JSONB;
    v_target_users UUID[];
    v_chat_type TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Get sender name
        SELECT name INTO v_actor_name FROM public.profiles WHERE id = NEW.user_id;

        -- Get chat details to form title/body
        SELECT name, type INTO v_chat_name, v_chat_type FROM public.chats WHERE id = NEW.chat_id;

        IF v_chat_type = 'group' THEN
            v_title := COALESCE(v_chat_name, 'Group Chat');
            v_body := COALESCE(v_actor_name, 'Someone') || ': ' || COALESCE(NULLIF(NEW.content, ''), 'Sent an attachment');
        ELSE
            v_title := COALESCE(v_actor_name, 'New Message');
            v_body := COALESCE(NULLIF(NEW.content, ''), 'Sent an attachment');
        END IF;

        v_url := '/chat/' || NEW.chat_id;

        -- Get all participants except the sender
        SELECT array_agg(user_id) INTO v_target_users 
        FROM public.participants 
        WHERE chat_id = NEW.chat_id AND user_id != NEW.user_id;

        IF v_target_users IS NOT NULL AND array_length(v_target_users, 1) > 0 THEN
            v_payload := jsonb_build_object(
                'userIds', v_target_users,
                'title', v_title,
                'body', v_body,
                'url', v_url
            );

            PERFORM net.http_post(
                url := v_webhook_url,
                body := v_payload,
                headers := '{"Content-Type": "application/json"}'::jsonb
            );
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_push_on_message ON public.messages;
CREATE TRIGGER trigger_push_on_message
    AFTER INSERT ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION public.webhook_push_message();
