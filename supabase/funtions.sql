-- ============================================================================
--                    FUNCTIONS.SQL - FINAL CONSOLIDATED STATE
-- ============================================================================
-- Description: Contains all utility functions, triggers, and RPCs.
-- ============================================================================

-- ============================================================================
-- SECTION 1: USER & PROFILE MANAGEMENT
-- ============================================================================

-- ----------------------------------------------------------------------------
-- FUNCTION: handle_new_user
-- Purpose: Creates a profile with default settings (is_private=false, verified=false)
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, username, avatar_url, gender, verified, is_private)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'name',
        NEW.raw_user_meta_data->>'username',
        NEW.raw_user_meta_data->>'avatar_url',
        NEW.raw_user_meta_data->>'gender',
        FALSE, -- Verified
        FALSE  -- Private
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW 
    EXECUTE PROCEDURE public.handle_new_user();


-- ============================================================================
-- SECTION 2: CHAT & MESSAGE HELPERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.is_chat_participant(chat_id_to_check BIGINT, user_id_to_check UUID)
RETURNS BOOLEAN AS $$
    SELECT EXISTS(
        SELECT 1 FROM public.participants 
        WHERE chat_id = chat_id_to_check AND user_id = user_id_to_check
    );
$$ LANGUAGE sql SECURITY INVOKER;

CREATE OR REPLACE FUNCTION public.get_dm_chat_id(user_1_id UUID, user_2_id UUID)
RETURNS TABLE(chat_id BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT p1.chat_id
    FROM participants p1
    JOIN participants p2 ON p1.chat_id = p2.chat_id
    JOIN chats c ON p1.chat_id = c.id
    WHERE c.type = 'dm'
        AND p1.user_id = user_1_id
        AND p2.user_id = user_2_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.mark_messages_as_read(p_chat_id BIGINT, p_user_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE messages
    SET read_by = array_append(read_by, p_user_id)
    WHERE chat_id = p_chat_id
        AND NOT (read_by @> ARRAY[p_user_id]);
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.get_unread_counts(p_user_id UUID)
RETURNS TABLE(chat_id_result BIGINT, unread_count_result BIGINT)
LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT
        m.chat_id,
        COUNT(m.id)::BIGINT
    FROM messages AS m
    WHERE
        m.chat_id IN (SELECT par.chat_id FROM participants AS par WHERE par.user_id = p_user_id)
        AND m.user_id != p_user_id
        AND NOT (COALESCE(m.read_by, '{}'::UUID[]) @> ARRAY[p_user_id])
    GROUP BY m.chat_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_last_messages_for_chats(p_chat_ids BIGINT[])
RETURNS TABLE(chat_id BIGINT, content TEXT, attachment_metadata JSONB, created_at TIMESTAMPTZ) AS $$
BEGIN
    RETURN QUERY
    WITH ranked_messages AS (
        SELECT m.chat_id, m.content, m.attachment_metadata, m.created_at,
            ROW_NUMBER() OVER(PARTITION BY m.chat_id ORDER BY m.created_at DESC) as rn
        FROM messages m WHERE m.chat_id = ANY(p_chat_ids)
    )
    SELECT rm.chat_id, rm.content, rm.attachment_metadata, rm.created_at
    FROM ranked_messages rm WHERE rm.rn = 1;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.toggle_reaction(p_emoji TEXT, p_message_id BIGINT, p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    reaction_users UUID[];
BEGIN
    SELECT COALESCE(reactions->p_emoji, '[]'::jsonb)::jsonb->>0 INTO reaction_users
    FROM messages WHERE id = p_message_id;

    IF p_user_id = ANY(reaction_users) THEN
        UPDATE messages
        SET reactions = jsonb_set(reactions, ARRAY[p_emoji], to_jsonb(array_remove(reaction_users, p_user_id)))
        WHERE id = p_message_id;

        UPDATE messages
        SET reactions = reactions - p_emoji
        WHERE id = p_message_id AND jsonb_array_length(reactions->p_emoji) = 0;
    ELSE
        UPDATE messages
        SET reactions = jsonb_set(COALESCE(reactions, '{}'::jsonb), ARRAY[p_emoji], to_jsonb(COALESCE(reaction_users, '{}'::UUID[]) || ARRAY[p_user_id]))
        WHERE id = p_message_id;
    END IF;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- SECTION 3: SOCIAL RELATIONSHIP LOGIC
-- ============================================================================

CREATE OR REPLACE FUNCTION public.request_follow(target_user_id UUID)
RETURNS json AS $$
DECLARE
    target_is_private BOOLEAN;
    new_status public.relationship_status;
    new_relationship RECORD;
BEGIN
    SELECT is_private INTO target_is_private FROM public.profiles WHERE id = target_user_id;

    IF target_is_private THEN new_status := 'pending';
    ELSE new_status := 'approved';
    END IF;

    INSERT INTO public.relationships (user_one_id, user_two_id, status)
    VALUES (auth.uid(), target_user_id, new_status)
    ON CONFLICT (user_one_id, user_two_id) DO NOTHING
    RETURNING * INTO new_relationship;

    RETURN json_build_object('status', new_status, 'relationship', row_to_json(new_relationship));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.approve_follow(requestor_user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.relationships
    SET status = 'approved'
    WHERE user_one_id = requestor_user_id AND user_two_id = auth.uid() AND status = 'pending';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.unfollow_user(target_user_id UUID)
RETURNS void AS $$
BEGIN
    DELETE FROM public.relationships
    WHERE user_one_id = auth.uid() AND user_two_id = target_user_id AND status IN ('approved', 'pending');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.remove_follower(target_user_id UUID)
RETURNS void AS $$
BEGIN
    DELETE FROM public.relationships
    WHERE user_one_id = target_user_id AND user_two_id = auth.uid() AND status = 'approved';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.block_user(target_user_id UUID)
RETURNS void AS $$
BEGIN
    INSERT INTO public.relationships (user_one_id, user_two_id, status)
    VALUES (auth.uid(), target_user_id, 'blocked')
    ON CONFLICT (user_one_id, user_two_id) DO UPDATE SET status = 'blocked';

    DELETE FROM public.relationships
    WHERE user_one_id = target_user_id AND user_two_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.unblock_user(target_user_id UUID)
RETURNS void AS $$
BEGIN
    DELETE FROM public.relationships
    WHERE user_one_id = auth.uid() AND user_two_id = target_user_id AND status = 'blocked';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- SECTION 4: NOTIFICATION TRIGGERS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_follow_request()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, actor_id, type)
    VALUES (NEW.user_two_id, NEW.user_one_id, 'follow_request');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_follow_request_create_notification
    AFTER INSERT ON public.relationships
    FOR EACH ROW WHEN (NEW.status = 'pending')
    EXECUTE FUNCTION public.handle_new_follow_request();

CREATE OR REPLACE FUNCTION public.handle_new_like()
RETURNS TRIGGER AS $$
DECLARE post_author_id UUID;
BEGIN
    SELECT user_id INTO post_author_id FROM public.posts WHERE id = NEW.post_id;
    IF NEW.user_id <> post_author_id THEN
        INSERT INTO public.notifications (user_id, actor_id, type, entity_id)
        VALUES (post_author_id, NEW.user_id, 'new_like', NEW.post_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_like_create_notification
    AFTER INSERT ON public.post_likes
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_like();

CREATE OR REPLACE FUNCTION public.handle_new_comment()
RETURNS TRIGGER AS $$
DECLARE post_author_id UUID;
BEGIN
    SELECT user_id INTO post_author_id FROM public.posts WHERE id = NEW.post_id;
    IF NEW.user_id <> post_author_id THEN
        INSERT INTO public.notifications (user_id, actor_id, type, entity_id)
        VALUES (post_author_id, NEW.user_id, 'new_comment', NEW.post_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_comment_create_notification
    AFTER INSERT ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_comment();

CREATE OR REPLACE FUNCTION public.handle_new_repost()
RETURNS TRIGGER AS $$
DECLARE post_author_id UUID;
BEGIN
    SELECT user_id INTO post_author_id FROM public.posts WHERE id = NEW.post_id;
    IF NEW.user_id <> post_author_id THEN
        INSERT INTO public.notifications (user_id, actor_id, type, entity_id)
        VALUES (post_author_id, NEW.user_id, 'new_repost', NEW.post_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_repost_create_notification
    AFTER INSERT ON public.post_reposts
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_repost();

CREATE OR REPLACE FUNCTION public.mark_all_notifications_as_read()
RETURNS void AS $$
BEGIN
    UPDATE public.notifications SET is_read = true WHERE user_id = auth.uid() AND is_read = false;
END;
$$ LANGUAGE plpgsql;


-- ============================================================================
-- SECTION 5: FEED INTERACTION & POLLS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.toggle_post_like(p_post_id BIGINT)
RETURNS void AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.post_likes WHERE user_id = auth.uid() AND post_id = p_post_id) THEN
        DELETE FROM public.post_likes WHERE user_id = auth.uid() AND post_id = p_post_id;
    ELSE
        INSERT INTO public.post_likes (user_id, post_id) VALUES (auth.uid(), p_post_id);
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.toggle_comment_like(p_comment_id BIGINT)
RETURNS void AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.comment_likes WHERE user_id = auth.uid() AND comment_id = p_comment_id) THEN
        DELETE FROM public.comment_likes WHERE user_id = auth.uid() AND comment_id = p_comment_id;
    ELSE
        INSERT INTO public.comment_likes (user_id, comment_id) VALUES (auth.uid(), p_comment_id);
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.toggle_post_repost(p_post_id BIGINT)
RETURNS void AS $$
BEGIN
    IF EXISTS (SELECT 1 FROM public.post_reposts WHERE user_id = auth.uid() AND post_id = p_post_id) THEN
        DELETE FROM public.post_reposts WHERE user_id = auth.uid() AND post_id = p_post_id;
    ELSE
        INSERT INTO public.post_reposts (user_id, post_id) VALUES (auth.uid(), p_post_id);
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.vote_on_poll(p_post_id BIGINT, p_option_id INT)
RETURNS void AS $$
DECLARE
    current_poll JSONB;
    voter_id UUID := auth.uid();
    option_index INT;
    voted_option_index INT := -1;
    new_options JSONB := '[]'::JSONB;
    option JSONB;
    voted_by_array JSONB;
BEGIN
    SELECT poll INTO current_poll FROM public.posts WHERE id = p_post_id FOR UPDATE;

    IF current_poll IS NULL OR current_poll->'options' IS NULL THEN
        RAISE EXCEPTION 'No poll found for this post.';
    END IF;

    -- Find if the user has already voted on any option
    FOR option_index IN 0..jsonb_array_length(current_poll->'options') - 1 LOOP
        voted_by_array := (current_poll->'options'->option_index)->'votedBy';
        IF voted_by_array @> to_jsonb(voter_id) THEN
            voted_option_index := option_index;
            EXIT;
        END IF;
    END LOOP;

    -- Rebuild options
    FOR option_index IN 0..jsonb_array_length(current_poll->'options') - 1 LOOP
        option := current_poll->'options'->option_index;
        voted_by_array := COALESCE(option->'votedBy', '[]'::JSONB);

        IF (option->>'id')::INT = p_option_id THEN
            IF voted_option_index = option_index THEN
                voted_by_array := voted_by_array - voter_id::TEXT; -- Toggle off
            ELSIF NOT (voted_by_array @> to_jsonb(voter_id)) THEN
                voted_by_array := voted_by_array || to_jsonb(voter_id); -- Vote new
            END IF;
        ELSIF option_index = voted_option_index THEN
            voted_by_array := voted_by_array - voter_id::TEXT; -- Remove old vote
        END IF;
        
        option := jsonb_set(option, '{votedBy}', voted_by_array);
        option := jsonb_set(option, '{votes}', to_jsonb(jsonb_array_length(voted_by_array)));
        new_options := new_options || option;
    END LOOP;

    UPDATE public.posts
    SET poll = jsonb_set(current_poll, '{options}', new_options)
    WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================================================
-- SECTION 6: UTILITY
-- ============================================================================

CREATE OR REPLACE FUNCTION public.clear_storage()
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    bucket_record RECORD;
    object_record RECORD;
BEGIN
    FOR bucket_record IN SELECT id FROM storage.buckets LOOP
        FOR object_record IN SELECT name FROM storage.objects WHERE bucket_id = bucket_record.id LOOP
            DELETE FROM storage.objects WHERE bucket_id = bucket_record.id AND name = object_record.name;
        END LOOP;
    END LOOP;
END;
$$;