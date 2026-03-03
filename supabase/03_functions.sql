-- ============================================================================
-- Final-Supabase / 03_functions.sql
-- Description: All core functions, triggers, and RPCs.
--              This is the FINAL state after all bugfix patches have been
--              applied (verified column is TEXT, media alias is media_urls).
-- Run order  : 3rd (after 01_schema.sql and 02_rls.sql)
-- ============================================================================

-- ============================================================================
-- SECTION 1: USER MANAGEMENT & TRIGGERS
-- ============================================================================

-- Handle New User (creates profile on auth.users insert)
-- Final version from 20260211_modify_verified_column.sql — uses 'none' (TEXT)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, name, username, avatar_url, gender, verified, is_private)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(md5(random()::text), 1, 8)),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        COALESCE(NEW.raw_user_meta_data->>'gender', 'male'),
        'none',
        FALSE
    );
    RETURN NEW;
EXCEPTION WHEN unique_violation THEN
    INSERT INTO public.profiles (id, name, username, avatar_url, gender, verified, is_private)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'name', 'New User'),
        (NEW.raw_user_meta_data->>'username') || '_' || substr(md5(random()::text), 1, 4),
        COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
        COALESCE(NEW.raw_user_meta_data->>'gender', 'male'),
        'none',
        FALSE
    );
    RETURN NEW;
WHEN OTHERS THEN
    RAISE WARNING 'Profile creation failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_new_user();

-- Auto Follow VIP on profile creation
CREATE OR REPLACE FUNCTION public.auto_follow_vip()
RETURNS TRIGGER AS $$
DECLARE
    vip_id UUID := 'e0c05b79-0504-412c-9614-d3f1a6691fe2';
BEGIN
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = vip_id) THEN
        INSERT INTO public.relationships (user_one_id, user_two_id, status)
        VALUES (NEW.id, vip_id, 'approved'::relationship_status)
        ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
EXCEPTION WHEN OTHERS THEN
    RAISE WARNING 'Auto-follow failed: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created_auto_follow ON public.profiles;
CREATE TRIGGER on_profile_created_auto_follow
    AFTER INSERT ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_follow_vip();

-- Prevent VIP from being unfollowed
CREATE OR REPLACE FUNCTION public.prevent_vip_unfollow()
RETURNS TRIGGER AS $$
DECLARE
    vip_id UUID := 'e0c05b79-0504-412c-9614-d3f1a6691fe2';
BEGIN
    IF OLD.user_two_id = vip_id THEN
        RAISE EXCEPTION 'You cannot unfollow the Community Account.';
    END IF;
    RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_relationship_deleted_prevent_unfollow ON public.relationships;
CREATE TRIGGER on_relationship_deleted_prevent_unfollow
    BEFORE DELETE ON public.relationships
    FOR EACH ROW
    EXECUTE FUNCTION public.prevent_vip_unfollow();

-- update_profile RPC
CREATE OR REPLACE FUNCTION public.update_profile(
    p_name       TEXT DEFAULT NULL,
    p_bio        TEXT DEFAULT NULL,
    p_location   TEXT DEFAULT NULL,
    p_website    TEXT DEFAULT NULL,
    p_avatar_url TEXT DEFAULT NULL,
    p_banner_url TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE public.profiles
    SET
        name       = COALESCE(p_name,       name),
        bio        = COALESCE(p_bio,        bio),
        location   = COALESCE(p_location,   location),
        website    = COALESCE(p_website,    website),
        avatar_url = COALESCE(p_avatar_url, avatar_url),
        banner_url = COALESCE(p_banner_url, banner_url)
    WHERE id = auth.uid();
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generic updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_posts_updated_at ON public.posts;
CREATE TRIGGER update_posts_updated_at
    BEFORE UPDATE ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS on_verification_request_update ON public.verification_requests;
CREATE TRIGGER on_verification_request_update
    BEFORE UPDATE ON public.verification_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================
-- SECTION 2: POST PROCESSING (Hashtags & Mentions)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.process_post_content()
RETURNS TRIGGER AS $$
DECLARE
    hashtag_text       TEXT;
    mentioned_username TEXT;
    mentioned_user_id  UUID;
    new_hashtag_id     BIGINT;
BEGIN
    -- 1. Process Hashtags
    FOR hashtag_text IN
        SELECT DISTINCT (regexp_matches(NEW.content, '#([A-Za-z0-9_]+)', 'g'))[1]
    LOOP
        INSERT INTO public.hashtags (tag, usage_count, last_used_at)
        VALUES (hashtag_text, 1, NOW())
        ON CONFLICT (tag) DO UPDATE
            SET usage_count  = hashtags.usage_count + 1,
                last_used_at = NOW()
        RETURNING id INTO new_hashtag_id;

        INSERT INTO public.post_hashtags (post_id, hashtag_id)
        VALUES (NEW.id, new_hashtag_id)
        ON CONFLICT DO NOTHING;
    END LOOP;

    -- 2. Process Mentions
    FOR mentioned_username IN
        SELECT DISTINCT (regexp_matches(NEW.content, '@([A-Za-z0-9_]+)', 'g'))[1]
    LOOP
        SELECT id INTO mentioned_user_id FROM public.profiles WHERE username = mentioned_username;
        IF mentioned_user_id IS NOT NULL AND mentioned_user_id != NEW.user_id THEN
            INSERT INTO public.notifications (user_id, actor_id, type, entity_id, entity_type)
            VALUES (mentioned_user_id, NEW.user_id, 'mention', NEW.id, 'post');
        END IF;
    END LOOP;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_post_created_process_content ON public.posts;
CREATE TRIGGER on_post_created_process_content
    AFTER INSERT ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.process_post_content();

-- ============================================================================
-- SECTION 3: INTERACTION RPCs
-- ============================================================================

-- Toggle Post Like
CREATE OR REPLACE FUNCTION public.toggle_post_like(p_post_id BIGINT)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID    := auth.uid();
    v_is_liked BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM public.post_likes WHERE post_id = p_post_id AND user_id = v_user_id)
    INTO v_is_liked;

    IF v_is_liked THEN
        DELETE FROM public.post_likes WHERE post_id = p_post_id AND user_id = v_user_id;
        RETURN jsonb_build_object('action', 'unliked', 'is_liked', false);
    ELSE
        INSERT INTO public.post_likes (post_id, user_id) VALUES (p_post_id, v_user_id)
        ON CONFLICT (user_id, post_id) DO NOTHING;
        RETURN jsonb_build_object('action', 'liked', 'is_liked', true);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Toggle Post Repost
CREATE OR REPLACE FUNCTION public.toggle_post_repost(p_post_id BIGINT)
RETURNS JSONB AS $$
DECLARE
    v_user_id    UUID    := auth.uid();
    v_is_reposted BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM public.post_reposts WHERE post_id = p_post_id AND user_id = v_user_id)
    INTO v_is_reposted;

    IF v_is_reposted THEN
        DELETE FROM public.post_reposts WHERE post_id = p_post_id AND user_id = v_user_id;
        RETURN jsonb_build_object('action', 'unreposted', 'is_reposted', false);
    ELSE
        INSERT INTO public.post_reposts (post_id, user_id) VALUES (p_post_id, v_user_id)
        ON CONFLICT (user_id, post_id) DO NOTHING;
        RETURN jsonb_build_object('action', 'reposted', 'is_reposted', true);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Toggle Comment Like
CREATE OR REPLACE FUNCTION public.toggle_comment_like(p_comment_id BIGINT)
RETURNS JSONB AS $$
DECLARE
    v_user_id  UUID    := auth.uid();
    v_is_liked BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM public.comment_likes WHERE comment_id = p_comment_id AND user_id = v_user_id)
    INTO v_is_liked;

    IF v_is_liked THEN
        DELETE FROM public.comment_likes WHERE comment_id = p_comment_id AND user_id = v_user_id;
        RETURN jsonb_build_object('action', 'unliked', 'is_liked', false);
    ELSE
        INSERT INTO public.comment_likes (comment_id, user_id) VALUES (p_comment_id, v_user_id)
        ON CONFLICT (user_id, comment_id) DO NOTHING;
        RETURN jsonb_build_object('action', 'liked', 'is_liked', true);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Toggle Reaction (consolidated — avoids function overload conflicts)
CREATE OR REPLACE FUNCTION public.toggle_reaction(
    p_target_id  BIGINT,
    p_table_name TEXT   -- 'post_likes' | 'post_reposts' | 'comment_likes'
)
RETURNS JSONB AS $$
BEGIN
    -- Route to the right toggle function
    IF p_table_name = 'post_likes' THEN
        RETURN public.toggle_post_like(p_target_id);
    ELSIF p_table_name = 'post_reposts' THEN
        RETURN public.toggle_post_repost(p_target_id);
    ELSIF p_table_name = 'comment_likes' THEN
        RETURN public.toggle_comment_like(p_target_id);
    ELSE
        RAISE EXCEPTION 'Unknown table: %', p_table_name;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Vote on Poll
CREATE OR REPLACE FUNCTION public.vote_on_poll(p_post_id BIGINT, p_option_id TEXT)
RETURNS JSONB AS $$
DECLARE
    current_poll     JSONB;
    voter_id         UUID := auth.uid();
    option_index     INT;
    voted_option_index INT := -1;
    new_options      JSONB := '[]'::JSONB;
    option           JSONB;
    voted_by_array   JSONB;
    option_id_to_match TEXT;
    total_votes      INT := 0;
BEGIN
    SELECT poll INTO current_poll FROM public.posts WHERE id = p_post_id FOR UPDATE;

    IF current_poll IS NULL OR current_poll->'options' IS NULL THEN
        RAISE EXCEPTION 'No poll found for post %', p_post_id;
    END IF;

    FOR option_index IN 0..jsonb_array_length(current_poll->'options') - 1 LOOP
        voted_by_array := COALESCE((current_poll->'options'->option_index)->'votedBy', '[]'::JSONB);
        IF voted_by_array ? voter_id::TEXT THEN
            voted_option_index := option_index;
            EXIT;
        END IF;
    END LOOP;

    FOR option_index IN 0..jsonb_array_length(current_poll->'options') - 1 LOOP
        option := current_poll->'options'->option_index;
        voted_by_array     := COALESCE(option->'votedBy', '[]'::JSONB);
        option_id_to_match := option->>'id';

        IF option_id_to_match = p_option_id THEN
            IF voted_option_index = option_index THEN
                voted_by_array := voted_by_array - voter_id::TEXT;
            ELSE
                IF NOT (voted_by_array ? voter_id::TEXT) THEN
                    voted_by_array := voted_by_array || to_jsonb(voter_id::TEXT);
                END IF;
            END IF;
        ELSIF option_index = voted_option_index AND option_id_to_match != p_option_id THEN
            voted_by_array := voted_by_array - voter_id::TEXT;
        END IF;

        option      := jsonb_set(option, '{votedBy}', voted_by_array);
        option      := jsonb_set(option, '{votes}', to_jsonb(jsonb_array_length(voted_by_array)));
        total_votes := total_votes + jsonb_array_length(voted_by_array);
        new_options := new_options || option;
    END LOOP;

    current_poll := jsonb_set(current_poll, '{options}',    new_options);
    current_poll := jsonb_set(current_poll, '{totalVotes}', to_jsonb(total_votes));
    UPDATE public.posts SET poll = current_poll WHERE id = p_post_id;
    RETURN current_poll;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Toggle Pin Post (for post author)
-- NOTE: live schema has NO is_pinned column on posts. Pinned = pinned_at IS NOT NULL.
CREATE OR REPLACE FUNCTION public.toggle_pin_post(p_post_id BIGINT)
RETURNS JSONB AS $$
DECLARE
    v_user_id  UUID    := auth.uid();
    v_pinned_at TIMESTAMPTZ;
BEGIN
    SELECT pinned_at INTO v_pinned_at FROM public.posts WHERE id = p_post_id AND user_id = v_user_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Post not found or not owned by you');
    END IF;

    IF v_pinned_at IS NOT NULL THEN
        -- Currently pinned — unpin it
        UPDATE public.posts SET pinned_at = NULL WHERE id = p_post_id AND user_id = v_user_id;
        RETURN jsonb_build_object('success', true, 'is_pinned', false);
    ELSE
        -- Unpin any other pinned post first
        UPDATE public.posts SET pinned_at = NULL WHERE user_id = v_user_id AND pinned_at IS NOT NULL;
        -- Pin this one
        UPDATE public.posts SET pinned_at = NOW() WHERE id = p_post_id AND user_id = v_user_id;
        RETURN jsonb_build_object('success', true, 'is_pinned', true);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Toggle Pin Comment (for post author)
CREATE OR REPLACE FUNCTION public.toggle_pin_comment(p_comment_id BIGINT)
RETURNS JSONB AS $$
DECLARE
    v_post_id   BIGINT;
    v_is_pinned BOOLEAN;
BEGIN
    SELECT post_id, is_pinned INTO v_post_id, v_is_pinned
    FROM public.comments WHERE id = p_comment_id;

    -- Verify caller owns the post
    IF NOT EXISTS (SELECT 1 FROM public.posts WHERE id = v_post_id AND user_id = auth.uid()) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Only post authors can pin comments');
    END IF;

    IF v_is_pinned THEN
        UPDATE public.comments SET is_pinned = false WHERE id = p_comment_id;
        RETURN jsonb_build_object('success', true, 'is_pinned', false);
    ELSE
        UPDATE public.comments SET is_pinned = false WHERE post_id = v_post_id;
        UPDATE public.comments SET is_pinned = true  WHERE id     = p_comment_id;
        RETURN jsonb_build_object('success', true, 'is_pinned', true);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- ============================================================================
-- SECTION 4: FEED & SEARCH RPCs
-- ============================================================================

-- Get Posts Paginated (final version — verified is TEXT)
DROP FUNCTION IF EXISTS public.get_posts_paginated(INT, BIGINT, TEXT);
CREATE OR REPLACE FUNCTION public.get_posts_paginated(
    p_limit  INT    DEFAULT 20,
    p_cursor BIGINT DEFAULT NULL,
    p_filter TEXT   DEFAULT 'for_you'
)
RETURNS TABLE (
    id               BIGINT,
    content          TEXT,
    created_at       TIMESTAMPTZ,
    media            JSONB,
    poll             JSONB,
    quote_of_id      BIGINT,
    user_id          UUID,
    author_name      TEXT,
    author_username  TEXT,
    author_avatar    TEXT,
    author_verified  TEXT,
    likes_count      BIGINT,
    comments_count   BIGINT,
    reposts_count    BIGINT,
    is_liked         BOOLEAN,
    is_reposted      BOOLEAN,
    next_cursor      BIGINT
) AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    RETURN QUERY
    SELECT
        p.id, p.content, p.created_at,
        COALESCE(p.media_urls, '[]'::jsonb) AS media,
        p.poll, p.quote_of_id, p.user_id,
        author.name, author.username, author.avatar_url,
        COALESCE(author.verified, 'none'),
        COALESCE(COUNT(DISTINCT pl.user_id), 0),
        COALESCE(COUNT(DISTINCT c.id),       0),
        COALESCE(COUNT(DISTINCT pr.user_id), 0),
        EXISTS(SELECT 1 FROM public.post_likes   WHERE post_id = p.id AND user_id = v_user_id),
        EXISTS(SELECT 1 FROM public.post_reposts WHERE post_id = p.id AND user_id = v_user_id),
        p.id
    FROM public.posts p
    LEFT JOIN public.profiles    author ON p.user_id  = author.id
    LEFT JOIN public.post_likes  pl     ON p.id       = pl.post_id
    LEFT JOIN public.comments    c      ON p.id       = c.post_id
    LEFT JOIN public.post_reposts pr    ON p.id       = pr.post_id
    WHERE (p_cursor IS NULL OR p.id < p_cursor)
    GROUP BY p.id, author.id, author.name, author.username, author.avatar_url, author.verified
    ORDER BY p.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Get Home Feed (guest/auth)
CREATE OR REPLACE FUNCTION public.get_home_feed(p_limit INT, p_offset INT)
RETURNS SETOF public.posts
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_uid UUID := auth.uid();
BEGIN
    IF v_uid IS NULL THEN
        IF p_offset > 0 THEN RETURN; END IF;
        p_limit := LEAST(p_limit, 30);
        RETURN QUERY SELECT * FROM public.posts
            WHERE user_id IN (SELECT id FROM public.profiles WHERE is_private = false)
            ORDER BY created_at DESC LIMIT p_limit;
    ELSE
        RETURN QUERY SELECT * FROM public.posts
            WHERE user_id IN (SELECT id FROM public.profiles WHERE is_private = false)
            ORDER BY created_at DESC LIMIT p_limit OFFSET p_offset;
    END IF;
END;
$$;

-- Get Following Feed
CREATE OR REPLACE FUNCTION public.get_following_feed(
    p_limit  INT    DEFAULT 20,
    p_cursor BIGINT DEFAULT NULL
)
RETURNS TABLE (
    id               BIGINT, content TEXT, created_at TIMESTAMPTZ,
    media            JSONB,  poll JSONB,   quote_of_id BIGINT,
    user_id          UUID,   author_name TEXT, author_username TEXT,
    author_avatar    TEXT,   author_verified TEXT,
    likes_count      BIGINT, comments_count BIGINT, reposts_count BIGINT,
    is_liked         BOOLEAN, is_reposted BOOLEAN, next_cursor BIGINT
) AS $$
DECLARE v_user_id UUID := auth.uid();
BEGIN
    RETURN QUERY
    SELECT
        p.id, p.content, p.created_at, COALESCE(p.media_urls, '[]'::jsonb), p.poll, p.quote_of_id, p.user_id,
        a.name, a.username, a.avatar_url, COALESCE(a.verified, 'none'),
        COALESCE(COUNT(DISTINCT pl.user_id), 0),
        COALESCE(COUNT(DISTINCT c.id),       0),
        COALESCE(COUNT(DISTINCT pr.user_id), 0),
        EXISTS(SELECT 1 FROM public.post_likes   WHERE post_id = p.id AND user_id = v_user_id),
        EXISTS(SELECT 1 FROM public.post_reposts WHERE post_id = p.id AND user_id = v_user_id),
        p.id
    FROM public.posts p
    JOIN public.profiles a ON p.user_id = a.id
    JOIN public.relationships r ON r.user_two_id = p.user_id
        AND r.user_one_id = v_user_id AND r.status = 'approved'
    LEFT JOIN public.post_likes  pl ON p.id = pl.post_id
    LEFT JOIN public.comments    c  ON p.id = c.post_id
    LEFT JOIN public.post_reposts pr ON p.id = pr.post_id
    WHERE (p_cursor IS NULL OR p.id < p_cursor)
    GROUP BY p.id, a.id, a.name, a.username, a.avatar_url, a.verified
    ORDER BY p.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Get Hashtag Feed
CREATE OR REPLACE FUNCTION public.get_hashtag_posts(
    p_hashtag TEXT,
    p_limit   INT    DEFAULT 20,
    p_offset  INT    DEFAULT 0
)
RETURNS TABLE (
    id               BIGINT, content TEXT, created_at TIMESTAMPTZ,
    media            JSONB,  poll JSONB,   quote_of_id BIGINT,
    user_id          UUID,   author_name TEXT, author_username TEXT,
    author_avatar    TEXT,   author_verified TEXT,
    likes_count      BIGINT, comments_count BIGINT, reposts_count BIGINT,
    is_liked         BOOLEAN, is_reposted BOOLEAN
) AS $$
DECLARE v_user_id UUID := auth.uid();
BEGIN
    RETURN QUERY
    SELECT
        p.id, p.content, p.created_at, COALESCE(p.media_urls, '[]'::jsonb), p.poll, p.quote_of_id, p.user_id,
        a.name, a.username, a.avatar_url, COALESCE(a.verified, 'none'),
        COALESCE(COUNT(DISTINCT pl.user_id), 0),
        COALESCE(COUNT(DISTINCT c.id),       0),
        COALESCE(COUNT(DISTINCT pr.user_id), 0),
        EXISTS(SELECT 1 FROM public.post_likes   WHERE post_id = p.id AND user_id = v_user_id),
        EXISTS(SELECT 1 FROM public.post_reposts WHERE post_id = p.id AND user_id = v_user_id)
    FROM public.posts p
    JOIN public.profiles  a  ON p.user_id    = a.id
    JOIN public.post_hashtags ph ON ph.post_id = p.id
    JOIN public.hashtags  h  ON ph.hashtag_id = h.id
    LEFT JOIN public.post_likes   pl ON p.id = pl.post_id
    LEFT JOIN public.comments     c  ON p.id = c.post_id
    LEFT JOIN public.post_reposts pr ON p.id = pr.post_id
    WHERE LOWER(h.tag) = LOWER(p_hashtag)
    GROUP BY p.id, a.id, a.name, a.username, a.avatar_url, a.verified
    ORDER BY p.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Search Global (fuzzy)
CREATE OR REPLACE FUNCTION public.search_global(search_query TEXT)
RETURNS TABLE (
    type      TEXT, id TEXT, title TEXT, subtitle TEXT,
    url       TEXT, image TEXT, sim_score REAL
) LANGUAGE plpgsql STABLE AS $$
BEGIN
    RETURN QUERY
    (SELECT 'user'::TEXT, p.id::TEXT, p.name,
        '@' || p.username, '/profile/' || p.username, p.avatar_url,
        GREATEST(similarity(p.name, search_query), similarity(p.username, search_query))::REAL
    FROM public.profiles p
    WHERE p.name % search_query OR p.username % search_query
       OR p.name ILIKE '%' || search_query || '%' OR p.username ILIKE '%' || search_query || '%'
    ORDER BY 7 DESC LIMIT 5)
    UNION ALL
    (SELECT 'post'::TEXT, po.id::TEXT,
        COALESCE(SUBSTRING(po.content FROM 1 FOR 50) || '...', 'Media Post'),
        TO_CHAR(po.created_at, 'Mon DD, YYYY'),
        '/post/' || po.id,
        COALESCE((po.media_urls->0->>'url'), NULL),
        similarity(COALESCE(po.content, ''), search_query)::REAL
    FROM public.posts po
    WHERE po.content % search_query OR po.content ILIKE '%' || search_query || '%'
    ORDER BY 7 DESC LIMIT 5)
    UNION ALL
    (SELECT 'event'::TEXT, e.id::TEXT, e.title,
        TO_CHAR(e.date_time, 'Mon DD, HH24:MI'),
        '/events/' || e.id, e.thumbnail,
        similarity(e.title, search_query)::REAL
    FROM public.events e
    WHERE e.title % search_query OR e.title ILIKE '%' || search_query || '%'
    ORDER BY 7 DESC LIMIT 5);
END;
$$;

-- Search Hashtags
CREATE OR REPLACE FUNCTION public.search_hashtags(search_term TEXT)
RETURNS TABLE (id BIGINT, tag TEXT, usage_count INT) AS $$
BEGIN
    RETURN QUERY
    SELECT h.id, h.tag, h.usage_count
    FROM public.hashtags h
    WHERE h.tag ILIKE search_term || '%'
    ORDER BY h.usage_count DESC LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Search Mentions (final — verified TEXT)
DROP FUNCTION IF EXISTS public.search_mentions(TEXT);
CREATE OR REPLACE FUNCTION public.search_mentions(search_term TEXT)
RETURNS TABLE (id UUID, username TEXT, name TEXT, avatar_url TEXT, verified TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.username, p.name, p.avatar_url, p.verified
    FROM public.profiles p
    WHERE p.username ILIKE search_term || '%'
       OR p.name ILIKE '%' || search_term || '%'
    ORDER BY CASE WHEN p.username ILIKE search_term || '%' THEN 1 ELSE 2 END
    LIMIT 5;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get Trending Topics
CREATE OR REPLACE FUNCTION public.get_trending_topics()
RETURNS TABLE (id BIGINT, hashtag TEXT, posts_count INT, category TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT h.id, h.tag, h.usage_count, 'General'::TEXT
    FROM public.hashtags h
    ORDER BY h.usage_count DESC, h.last_used_at DESC
    LIMIT 10;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get Who To Follow (final version — no ambiguous column)
CREATE OR REPLACE FUNCTION public.get_who_to_follow(limit_count INT DEFAULT 5)
RETURNS TABLE (
    id UUID, name TEXT, username TEXT, avatar_url TEXT, bio TEXT,
    verified TEXT, is_private BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.name, p.username, p.avatar_url, p.bio, p.verified, p.is_private
    FROM public.profiles p
    WHERE p.id != auth.uid()
    AND NOT EXISTS (
        SELECT 1 FROM public.relationships r
        WHERE r.user_one_id = auth.uid() AND r.user_two_id = p.id AND r.status = 'approved'
    )
    ORDER BY RANDOM()
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 5: POST HELPERS
-- ============================================================================

-- Get Post Comments (final — verified TEXT, with hidden/pinned/updated_at/is_liked)
DROP FUNCTION IF EXISTS public.get_post_comments(BIGINT);
CREATE OR REPLACE FUNCTION public.get_post_comments(p_post_id BIGINT)
RETURNS TABLE (
    id                BIGINT, user_id UUID, post_id BIGINT,
    parent_comment_id BIGINT, content TEXT, created_at TIMESTAMPTZ,
    updated_at        TIMESTAMPTZ,
    user_name         TEXT, user_username TEXT, user_avatar_url TEXT,
    user_verified     TEXT, like_count BIGINT,
    is_pinned         BOOLEAN, is_hidden BOOLEAN, is_liked BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id, c.user_id, c.post_id, c.parent_comment_id, c.content, c.created_at,
        c.updated_at,
        p.name, p.username, p.avatar_url, p.verified,
        COALESCE(COUNT(cl.user_id), 0)::BIGINT,
        c.is_pinned, c.is_hidden,
        EXISTS(
            SELECT 1 FROM public.comment_likes cl2
            WHERE cl2.comment_id = c.id AND cl2.user_id = auth.uid()
        )
    FROM public.comments c
    LEFT JOIN public.profiles     p  ON c.user_id    = p.id
    LEFT JOIN public.comment_likes cl ON c.id         = cl.comment_id
    WHERE c.post_id = p_post_id AND (c.is_hidden = false OR c.user_id = auth.uid())
    GROUP BY c.id, p.id
    ORDER BY c.is_pinned DESC, c.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Log Post View (bulk safe)
CREATE OR REPLACE FUNCTION public.log_post_view(p_post_id BIGINT)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.post_views (post_id, user_id) VALUES (p_post_id, auth.uid());
EXCEPTION WHEN OTHERS THEN
    NULL; -- Silently ignore errors so UI is never blocked
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Increment Post Views (trigger)
CREATE OR REPLACE FUNCTION public.increment_post_views()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.posts SET views_count = COALESCE(views_count, 0) + 1 WHERE id = NEW.post_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_post_view_created ON public.post_views;
CREATE TRIGGER on_post_view_created
    AFTER INSERT ON public.post_views
    FOR EACH ROW
    EXECUTE FUNCTION public.increment_post_views();

-- ============================================================================
-- SECTION 6: PROFILE HELPERS
-- ============================================================================

-- Get Profile By Username (final — verified TEXT)
DROP FUNCTION IF EXISTS public.get_profile_by_username(TEXT, UUID);
CREATE OR REPLACE FUNCTION public.get_profile_by_username(
    p_username            TEXT,
    p_requesting_user_id  UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID, name TEXT, username TEXT, avatar_url TEXT, banner_url TEXT,
    bio TEXT, location TEXT, website TEXT, verified TEXT, is_private BOOLEAN,
    created_at TIMESTAMPTZ, follower_count BIGINT, following_count BIGINT,
    post_count BIGINT, is_following BOOLEAN, follow_status TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.id, p.name, p.username, p.avatar_url, p.banner_url,
        p.bio, p.location, p.website, p.verified, p.is_private, p.created_at,
        (SELECT COUNT(*) FROM public.relationships r WHERE r.user_two_id = p.id AND r.status = 'approved')::BIGINT,
        (SELECT COUNT(*) FROM public.relationships r WHERE r.user_one_id = p.id AND r.status = 'approved')::BIGINT,
        (SELECT COUNT(*) FROM public.posts WHERE user_id = p.id)::BIGINT,
        CASE WHEN p_requesting_user_id IS NULL THEN FALSE
             ELSE EXISTS(SELECT 1 FROM public.relationships r
                         WHERE r.user_one_id = p_requesting_user_id AND r.user_two_id = p.id AND r.status = 'approved')
        END,
        COALESCE((SELECT r.status::TEXT FROM public.relationships r
                  WHERE r.user_one_id = p_requesting_user_id AND r.user_two_id = p.id
                  AND r.status IN ('pending','approved') LIMIT 1), 'none')
    FROM public.profiles p
    WHERE LOWER(p.username) = LOWER(p_username);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get Followers List
DROP FUNCTION IF EXISTS public.get_followers_list(UUID);
CREATE OR REPLACE FUNCTION public.get_followers_list(target_user_id UUID)
RETURNS TABLE (id UUID, name TEXT, username TEXT, avatar_url TEXT, bio TEXT, verified TEXT, followed_at TIMESTAMPTZ) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.name, p.username, p.avatar_url, p.bio, p.verified, r.created_at
    FROM public.relationships r
    JOIN public.profiles p ON p.id = r.user_one_id
    WHERE r.user_two_id = target_user_id AND r.status = 'approved'
    ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get Following List
DROP FUNCTION IF EXISTS public.get_following_list(UUID);
CREATE OR REPLACE FUNCTION public.get_following_list(target_user_id UUID)
RETURNS TABLE (id UUID, name TEXT, username TEXT, avatar_url TEXT, bio TEXT, verified TEXT, followed_at TIMESTAMPTZ) AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, p.name, p.username, p.avatar_url, p.bio, p.verified, r.created_at
    FROM public.relationships r
    JOIN public.profiles p ON p.id = r.user_two_id
    WHERE r.user_one_id = target_user_id AND r.status = 'approved'
    ORDER BY r.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get User Follower Counts
CREATE OR REPLACE FUNCTION public.get_user_follower_counts(target_user_id UUID)
RETURNS TABLE (follower_count BIGINT, following_count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT
        (SELECT COUNT(*) FROM public.relationships WHERE user_two_id = target_user_id AND status = 'approved')::BIGINT,
        (SELECT COUNT(*) FROM public.relationships WHERE user_one_id = target_user_id AND status = 'approved')::BIGINT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Block User
CREATE OR REPLACE FUNCTION public.block_user(target_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE v_exists BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 FROM public.relationships
        WHERE (user_one_id = auth.uid() AND user_two_id = target_user_id)
           OR (user_one_id = target_user_id AND user_two_id = auth.uid())
    ) INTO v_exists;

    IF v_exists THEN
        UPDATE public.relationships
        SET status = 'blocked', user_one_id = auth.uid(), user_two_id = target_user_id
        WHERE (user_one_id = auth.uid() AND user_two_id = target_user_id)
           OR (user_one_id = target_user_id AND user_two_id = auth.uid());
    ELSE
        INSERT INTO public.relationships (user_one_id, user_two_id, status)
        VALUES (auth.uid(), target_user_id, 'blocked');
    END IF;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 7: NOTIFICATIONS
-- ============================================================================

-- Notification trigger (likes, comments, reposts)
CREATE OR REPLACE FUNCTION public.handle_new_trigger_notification()
RETURNS TRIGGER AS $$
DECLARE
    actor_id     UUID;
    entity_id    BIGINT;
    notif_type   TEXT;
    recipient_id UUID;
BEGIN
    actor_id  := NEW.user_id;
    entity_id := NEW.post_id;

    IF TG_TABLE_NAME = 'post_likes' THEN
        notif_type := 'new_like';
        SELECT user_id INTO recipient_id FROM public.posts WHERE id = NEW.post_id;
    ELSIF TG_TABLE_NAME = 'comments' THEN
        notif_type := 'new_comment';
        SELECT user_id INTO recipient_id FROM public.posts WHERE id = NEW.post_id;
    ELSIF TG_TABLE_NAME = 'post_reposts' THEN
        notif_type := 'new_repost';
        SELECT user_id INTO recipient_id FROM public.posts WHERE id = NEW.post_id;
    END IF;

    IF recipient_id IS NOT NULL AND recipient_id != actor_id THEN
        INSERT INTO public.notifications (user_id, actor_id, type, entity_id, entity_type)
        VALUES (recipient_id, actor_id, notif_type::public.notification_type, entity_id, 'post');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_new_like_create_notification    ON public.post_likes;
DROP TRIGGER IF EXISTS on_new_comment_create_notification ON public.comments;
DROP TRIGGER IF EXISTS on_new_repost_create_notification  ON public.post_reposts;

CREATE TRIGGER on_new_like_create_notification
    AFTER INSERT ON public.post_likes
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_trigger_notification();

CREATE TRIGGER on_new_comment_create_notification
    AFTER INSERT ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_trigger_notification();

CREATE TRIGGER on_new_repost_create_notification
    AFTER INSERT ON public.post_reposts
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_trigger_notification();

-- Get User Notifications (final — verified TEXT)
DROP FUNCTION IF EXISTS public.get_user_notifications(INT, INT);
CREATE OR REPLACE FUNCTION public.get_user_notifications(p_limit INT DEFAULT 50, p_offset INT DEFAULT 0)
RETURNS TABLE (
    id BIGINT, user_id UUID, actor_id UUID, type TEXT, entity_id BIGINT,
    is_read BOOLEAN, created_at TIMESTAMPTZ,
    actor_name TEXT, actor_username TEXT, actor_avatar_url TEXT, actor_verified TEXT,
    post_content TEXT, post_media_type TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        n.id, n.user_id, n.actor_id, n.type::TEXT, n.entity_id, n.is_read, n.created_at,
        p.name, p.username, p.avatar_url, p.verified,
        CASE WHEN n.entity_id IS NOT NULL
             THEN SUBSTRING(posts.content FROM 1 FOR 100) ELSE NULL END,
        CASE WHEN n.entity_id IS NOT NULL AND posts.media_urls IS NOT NULL
                  AND jsonb_array_length(posts.media_urls) > 0
             THEN posts.media_urls->0->>'type' ELSE NULL END
    FROM public.notifications n
    LEFT JOIN public.profiles p    ON n.actor_id  = p.id
    LEFT JOIN public.posts    posts ON n.entity_id = posts.id
    WHERE n.user_id = auth.uid()
    ORDER BY n.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- ============================================================================
-- SECTION 8: MESSAGING
-- ============================================================================

-- Get DM Chat ID
CREATE OR REPLACE FUNCTION public.get_dm_chat_id(target_user_id UUID)
RETURNS BIGINT AS $$
DECLARE v_chat_id BIGINT;
BEGIN
    SELECT c.id INTO v_chat_id
    FROM public.chats c
    JOIN public.participants cm1 ON cm1.chat_id = c.id AND cm1.user_id = auth.uid()
    JOIN public.participants cm2 ON cm2.chat_id = c.id AND cm2.user_id = target_user_id
    WHERE c.type = 'dm';
    RETURN v_chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create DM Chat
CREATE OR REPLACE FUNCTION public.create_dm_chat(target_user_id UUID)
RETURNS BIGINT AS $$
DECLARE v_chat_id BIGINT;
BEGIN
    INSERT INTO public.chats (type) VALUES ('dm') RETURNING id INTO v_chat_id;
    INSERT INTO public.participants (chat_id, user_id) VALUES (v_chat_id, auth.uid()), (v_chat_id, target_user_id);
    RETURN v_chat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Toggle Pin Chat
CREATE OR REPLACE FUNCTION public.toggle_pin_chat(p_chat_id BIGINT)
RETURNS JSONB AS $$
DECLARE
    v_user_id  UUID    := auth.uid();
    v_is_pinned BOOLEAN;
BEGIN
    SELECT EXISTS(SELECT 1 FROM public.pinned_chats WHERE user_id = v_user_id AND chat_id = p_chat_id)
    INTO v_is_pinned;

    IF v_is_pinned THEN
        DELETE FROM public.pinned_chats WHERE user_id = v_user_id AND chat_id = p_chat_id;
        RETURN jsonb_build_object('success', true, 'is_pinned', false);
    ELSE
        INSERT INTO public.pinned_chats (user_id, chat_id) VALUES (v_user_id, p_chat_id);
        RETURN jsonb_build_object('success', true, 'is_pinned', true);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- ============================================================================
-- SECTION 9: GROUPS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_public_groups(p_limit INT DEFAULT 50, p_offset INT DEFAULT 0)
RETURNS TABLE (
    id BIGINT, name TEXT, description TEXT, avatar_url TEXT, created_at TIMESTAMPTZ,
    created_by UUID, creator_name TEXT, creator_username TEXT, creator_avatar TEXT,
    member_count BIGINT, is_member BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.name, c.description, c.avatar_url, c.created_at, c.created_by,
        p.name, p.username, p.avatar_url,
        COALESCE(mc.count, 0),
        COALESCE(um.is_member, FALSE)
    FROM public.chats c
    LEFT JOIN public.profiles p ON c.created_by = p.id
    LEFT JOIN (SELECT chat_id, COUNT(*) AS count FROM public.participants GROUP BY chat_id) mc ON c.id = mc.chat_id
    LEFT JOIN (SELECT chat_id, TRUE AS is_member FROM public.participants WHERE user_id = auth.uid()) um ON c.id = um.chat_id
    WHERE c.type = 'group' AND c.is_public = TRUE
    ORDER BY mc.count DESC NULLS LAST, c.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

CREATE OR REPLACE FUNCTION public.get_user_groups(p_limit INT DEFAULT 50, p_offset INT DEFAULT 0)
RETURNS TABLE (
    id BIGINT, name TEXT, description TEXT, avatar_url TEXT, created_at TIMESTAMPTZ,
    created_by UUID, creator_name TEXT, creator_username TEXT, creator_avatar TEXT,
    member_count BIGINT, is_admin BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.name, c.description, c.avatar_url, c.created_at, c.created_by,
        p.name, p.username, p.avatar_url, COALESCE(mc.count, 0), part.is_admin
    FROM public.chats c
    INNER JOIN public.participants part ON c.id = part.chat_id AND part.user_id = auth.uid()
    LEFT JOIN  public.profiles     p   ON c.created_by = p.id
    LEFT JOIN (SELECT chat_id, COUNT(*) AS count FROM public.participants GROUP BY chat_id) mc ON c.id = mc.chat_id
    WHERE c.type = 'group'
    ORDER BY c.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

CREATE OR REPLACE FUNCTION public.join_group(p_group_id BIGINT)
RETURNS JSONB AS $$
DECLARE
    v_user_id       UUID    := auth.uid();
    v_is_public     BOOLEAN;
    v_already_member BOOLEAN;
BEGIN
    SELECT is_public INTO v_is_public FROM public.chats WHERE id = p_group_id AND type = 'group';
    IF v_is_public IS NULL THEN RETURN jsonb_build_object('success', false, 'message', 'Group not found'); END IF;
    IF NOT v_is_public    THEN RETURN jsonb_build_object('success', false, 'message', 'Group is private');  END IF;

    SELECT EXISTS(SELECT 1 FROM public.participants WHERE chat_id = p_group_id AND user_id = v_user_id)
    INTO v_already_member;
    IF v_already_member THEN RETURN jsonb_build_object('success', false, 'message', 'Already a member'); END IF;

    INSERT INTO public.participants (chat_id, user_id, is_admin) VALUES (p_group_id, v_user_id, FALSE);
    RETURN jsonb_build_object('success', true, 'message', 'Successfully joined group');
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

CREATE OR REPLACE FUNCTION public.leave_group(p_group_id BIGINT)
RETURNS JSONB AS $$
DECLARE
    v_user_id    UUID    := auth.uid();
    v_is_creator BOOLEAN;
BEGIN
    SELECT (created_by = v_user_id) INTO v_is_creator FROM public.chats WHERE id = p_group_id AND type = 'group';
    IF v_is_creator THEN RETURN jsonb_build_object('success', false, 'message', 'Creator cannot leave group'); END IF;
    DELETE FROM public.participants WHERE chat_id = p_group_id AND user_id = v_user_id;
    RETURN jsonb_build_object('success', true, 'message', 'Successfully left group');
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- ============================================================================
-- SECTION 10: ANALYTICS & PROMOTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_monthly_promotion_count(p_user_id UUID)
RETURNS INT AS $$
DECLARE v_count INT;
BEGIN
    SELECT COUNT(*) INTO v_count FROM public.promotion_requests
    WHERE user_id = p_user_id AND status = 'approved'
      AND created_at >= date_trunc('month', CURRENT_DATE);
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.request_promotion(p_post_id BIGINT)
RETURNS JSON AS $$
DECLARE
    v_user_id      UUID := auth.uid();
    v_owner_id     UUID;
    v_verified     TEXT;
    v_count        INT;
BEGIN
    SELECT user_id INTO v_owner_id FROM public.posts WHERE id = p_post_id;
    IF v_owner_id != v_user_id THEN
        RETURN json_build_object('success', false, 'message', 'You can only promote your own posts');
    END IF;

    SELECT verified INTO v_verified FROM public.profiles WHERE id = v_user_id;
    v_count := public.get_monthly_promotion_count(v_user_id);

    IF v_verified IN ('verified','kcs') AND v_count < 3 THEN
        INSERT INTO public.promotion_requests (user_id, post_id, status, admin_notes)
        VALUES (v_user_id, p_post_id, 'approved', 'Auto-approved: Verified user monthly free limit');
        UPDATE public.posts SET is_promoted = TRUE, promoted_until = NOW() + INTERVAL '24 hours' WHERE id = p_post_id;
        RETURN json_build_object('success', true, 'message', 'Promotion activated! (Free limit used)');
    ELSE
        INSERT INTO public.promotion_requests (user_id, post_id, status) VALUES (v_user_id, p_post_id, 'payment_pending');
        RETURN json_build_object('success', true, 'message', 'Promotion request submitted. Contact us for payment.');
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_analytics(p_user_id UUID, p_days INT DEFAULT 30)
RETURNS TABLE (date DATE, views INT, likes INT, comments INT) AS $$
BEGIN
    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(CURRENT_DATE - (p_days - 1), CURRENT_DATE, '1 day'::interval)::DATE AS d
    )
    SELECT
        ds.d,
        COALESCE(COUNT(DISTINCT pv.id), 0)::INT  AS views,
        COALESCE(COUNT(DISTINCT pl.created_at), 0)::INT AS likes,
        COALESCE(COUNT(DISTINCT c.id), 0)::INT   AS comments
    FROM date_series ds
    LEFT JOIN public.posts      p  ON p.user_id = p_user_id
    LEFT JOIN public.post_views pv ON pv.post_id = p.id AND pv.viewed_at::DATE = ds.d
    LEFT JOIN public.post_likes pl ON pl.post_id = p.id AND pl.created_at::DATE = ds.d
    LEFT JOIN public.comments   c  ON c.post_id  = p.id AND c.created_at::DATE  = ds.d
    GROUP BY ds.d ORDER BY ds.d;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 11: BOOKMARK COLLECTIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_bookmark_collections()
RETURNS TABLE (id BIGINT, name TEXT, is_private BOOLEAN, created_at TIMESTAMPTZ, post_count BIGINT, last_post_cover TEXT) AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.name, c.is_private, c.created_at, COUNT(bci.post_id)::BIGINT,
        (SELECT (p.media_urls->0->>'url')::TEXT
         FROM public.bookmark_collection_items bci2
         JOIN public.posts p ON p.id = bci2.post_id
         WHERE bci2.collection_id = c.id AND p.media_urls IS NOT NULL AND jsonb_array_length(p.media_urls) > 0
         ORDER BY bci2.added_at DESC LIMIT 1)
    FROM public.bookmark_collections c
    LEFT JOIN public.bookmark_collection_items bci ON c.id = bci.collection_id
    WHERE c.user_id = auth.uid()
    GROUP BY c.id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

CREATE OR REPLACE FUNCTION public.create_bookmark_collection(p_name TEXT, p_is_private BOOLEAN DEFAULT TRUE)
RETURNS BIGINT AS $$
DECLARE v_id BIGINT;
BEGIN
    INSERT INTO public.bookmark_collections (user_id, name, is_private) VALUES (auth.uid(), p_name, p_is_private) RETURNING id INTO v_id;
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

CREATE OR REPLACE FUNCTION public.add_to_collection(p_collection_id BIGINT, p_post_id BIGINT)
RETURNS VOID AS $$
BEGIN
    -- Save to bookmarks (live table name)
    INSERT INTO public.bookmarks (user_id, post_id) VALUES (auth.uid(), p_post_id) ON CONFLICT DO NOTHING;
    INSERT INTO public.bookmark_collection_items (collection_id, post_id) VALUES (p_collection_id, p_post_id) ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

CREATE OR REPLACE FUNCTION public.remove_from_collection(p_collection_id BIGINT, p_post_id BIGINT)
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.bookmark_collection_items WHERE collection_id = p_collection_id AND post_id = p_post_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

CREATE OR REPLACE FUNCTION public.delete_bookmark_collection(p_collection_id BIGINT)
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.bookmark_collections WHERE id = p_collection_id AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- ============================================================================
-- SECTION 12: ADMIN STATS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_admin_stats()
RETURNS TABLE (
    total_users       BIGINT, verified_users BIGINT, kcs_users BIGINT,
    total_posts       BIGINT, total_comments BIGINT, total_relationships BIGINT,
    total_chats       BIGINT, total_messages BIGINT,
    pending_verifications BIGINT, pending_reports BIGINT,
    new_users_today   BIGINT, new_posts_today BIGINT
) AS $$
BEGIN
    RETURN QUERY SELECT
        (SELECT COUNT(*) FROM public.profiles)::BIGINT,
        (SELECT COUNT(*) FROM public.profiles WHERE verified = 'verified')::BIGINT,
        (SELECT COUNT(*) FROM public.profiles WHERE verified = 'kcs')::BIGINT,
        (SELECT COUNT(*) FROM public.posts)::BIGINT,
        (SELECT COUNT(*) FROM public.comments)::BIGINT,
        (SELECT COUNT(*) FROM public.relationships WHERE status = 'approved')::BIGINT,
        (SELECT COUNT(*) FROM public.chats)::BIGINT,
        (SELECT COUNT(*) FROM public.messages)::BIGINT,
        (SELECT COUNT(*) FROM public.verification_requests WHERE status = 'submitted')::BIGINT,
        (SELECT COUNT(*) FROM public.reports WHERE status = 'pending')::BIGINT,
        (SELECT COUNT(*) FROM public.profiles WHERE created_at >= CURRENT_DATE)::BIGINT,
        (SELECT COUNT(*) FROM public.posts WHERE created_at >= CURRENT_DATE)::BIGINT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- SECTION 13: REALTIME PUBLICATIONS
-- ============================================================================

DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.call_signals;  EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.calls;          EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.leela_videos;   EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.leela_likes;    EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.leela_comments; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_submissions; EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.challenge_reactions;   EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.close_friends;         EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.story_highlights;      EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.story_reactions;       EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.story_replies;         EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.livestream_chat;       EXCEPTION WHEN duplicate_object THEN NULL; END $$;

NOTIFY pgrst, 'reload schema';
