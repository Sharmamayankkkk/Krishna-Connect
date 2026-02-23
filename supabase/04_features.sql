-- ============================================================================
-- Final-Supabase / 04_features.sql
-- Description: Specialized feature functions — Calls/WebRTC signaling,
--              Leela (short-form video), Challenges, and Stories analytics.
-- Run order  : 4th and final (after 01, 02, 03)
-- ============================================================================

-- ============================================================================
-- SECTION 1: CALLS / WebRTC
-- ============================================================================

-- Auto-calculate duration when a call ends
CREATE OR REPLACE FUNCTION public.update_call_duration()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IN ('ended', 'missed', 'declined', 'failed')
       AND NEW.ended_at IS NOT NULL
       AND NEW.started_at IS NOT NULL THEN
        NEW.duration_seconds := EXTRACT(EPOCH FROM (NEW.ended_at - NEW.started_at))::INTEGER;
    END IF;
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trigger_update_call_duration') THEN
        CREATE TRIGGER trigger_update_call_duration
            BEFORE UPDATE ON public.calls
            FOR EACH ROW
            EXECUTE FUNCTION public.update_call_duration();
    END IF;
END $$;

-- check_user_busy — returns TRUE if the user is currently on an active call
CREATE OR REPLACE FUNCTION public.check_user_busy(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.calls
        WHERE (caller_id = p_user_id OR callee_id = p_user_id)
        AND status IN ('ringing', 'answered')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- get_call_history — paginated call history with caller/callee profile info
CREATE OR REPLACE FUNCTION public.get_call_history(
    p_user_id UUID,
    p_limit   INTEGER DEFAULT 50,
    p_offset  INTEGER DEFAULT 0
)
RETURNS TABLE (
    id               UUID,
    caller_id        UUID,
    callee_id        UUID,
    call_type        public.call_type,
    status           public.call_status,
    started_at       TIMESTAMPTZ,
    ended_at         TIMESTAMPTZ,
    duration_seconds INTEGER,
    created_at       TIMESTAMPTZ,
    caller_name      TEXT,
    caller_username  TEXT,
    caller_avatar    TEXT,
    callee_name      TEXT,
    callee_username  TEXT,
    callee_avatar    TEXT
) AS $$
BEGIN
    IF p_user_id <> auth.uid() THEN
        RAISE EXCEPTION 'Unauthorized: cannot access another user''s call history';
    END IF;
    RETURN QUERY
    SELECT
        c.id, c.caller_id, c.callee_id, c.call_type, c.status,
        c.started_at, c.ended_at, c.duration_seconds, c.created_at,
        COALESCE(cp.name, cp.username), cp.username, cp.avatar_url,
        COALESCE(cc.name, cc.username), cc.username, cc.avatar_url
    FROM public.calls c
    LEFT JOIN public.profiles cp ON c.caller_id = cp.id
    LEFT JOIN public.profiles cc ON c.callee_id = cc.id
    WHERE c.caller_id = p_user_id OR c.callee_id = p_user_id
    ORDER BY c.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- cleanup_stale_calls — marks ringing calls as missed after 60 seconds
CREATE OR REPLACE FUNCTION public.cleanup_stale_calls()
RETURNS void AS $$
BEGIN
    UPDATE public.calls
    SET status = 'missed', ended_at = NOW(), updated_at = NOW()
    WHERE status = 'ringing'
    AND created_at < NOW() - INTERVAL '60 seconds'
    AND (caller_id = auth.uid() OR callee_id = auth.uid() OR auth.uid() IS NULL);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grants
GRANT EXECUTE ON FUNCTION public.check_user_busy(UUID)                     TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_stale_calls()                     TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_call_history(UUID, INTEGER, INTEGER)  TO authenticated;

-- ============================================================================
-- SECTION 2: LEELA (Short-form Videos)
-- ============================================================================

-- record_leela_view — upserts a view record; increments count only on first view
CREATE OR REPLACE FUNCTION public.record_leela_view(p_video_id UUID, p_watched_seconds INTEGER DEFAULT 0)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_is_new BOOLEAN;
BEGIN
    INSERT INTO public.leela_views (user_id, video_id, watched_seconds)
    VALUES (auth.uid(), p_video_id, p_watched_seconds)
    ON CONFLICT (user_id, video_id)
    DO UPDATE SET watched_seconds = GREATEST(leela_views.watched_seconds, p_watched_seconds)
    RETURNING (xmax = 0) INTO v_is_new;

    IF v_is_new THEN
        UPDATE public.leela_videos SET view_count = view_count + 1 WHERE id = p_video_id;
    END IF;
END;
$$;

-- get_leela_feed — paginated public feed
CREATE OR REPLACE FUNCTION public.get_leela_feed(p_limit INTEGER DEFAULT 10, p_offset INTEGER DEFAULT 0)
RETURNS TABLE (
    id               UUID, video_url TEXT, thumbnail_url TEXT, caption TEXT,
    audio_name       TEXT, duration_seconds INTEGER,
    view_count       INTEGER, like_count INTEGER, comment_count INTEGER, share_count INTEGER,
    created_at       TIMESTAMPTZ,
    author_id        UUID, author_name TEXT, author_username TEXT, author_avatar TEXT,
    author_verified  TEXT, is_liked BOOLEAN
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY
    SELECT
        v.id, v.video_url, v.thumbnail_url, v.caption, v.audio_name, v.duration_seconds,
        v.view_count, v.like_count, v.comment_count, v.share_count, v.created_at,
        p.id, COALESCE(p.name, p.username), p.username, p.avatar_url,
        COALESCE(p.verified, 'none'),
        EXISTS(SELECT 1 FROM public.leela_likes ll WHERE ll.video_id = v.id AND ll.user_id = auth.uid())
    FROM public.leela_videos v
    JOIN public.profiles p ON p.id = v.user_id
    WHERE v.is_published = true
    ORDER BY v.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- get_user_leela_videos
CREATE OR REPLACE FUNCTION public.get_user_leela_videos(p_user_id UUID, p_limit INTEGER DEFAULT 20, p_offset INTEGER DEFAULT 0)
RETURNS TABLE (
    id UUID, video_url TEXT, thumbnail_url TEXT, caption TEXT,
    view_count INTEGER, like_count INTEGER, comment_count INTEGER, created_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY
    SELECT v.id, v.video_url, v.thumbnail_url, v.caption,
           v.view_count, v.like_count, v.comment_count, v.created_at
    FROM public.leela_videos v
    WHERE v.user_id = p_user_id AND v.is_published = true
    ORDER BY v.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_leela_view(UUID, INTEGER)                TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_leela_feed(INTEGER, INTEGER)                TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_leela_videos(UUID, INTEGER, INTEGER)   TO authenticated, anon;

-- ============================================================================
-- SECTION 3: CHALLENGES
-- ============================================================================

-- get_all_challenges — full enhanced listing with creator, stats, user status
CREATE OR REPLACE FUNCTION public.get_all_challenges(p_user_id UUID)
RETURNS TABLE (
    id BIGINT, title TEXT, description TEXT, cover_image TEXT, rules TEXT,
    prize_description TEXT, category TEXT, requires_proof BOOLEAN,
    is_active BOOLEAN, is_featured BOOLEAN, start_date TIMESTAMPTZ, end_date TIMESTAMPTZ,
    created_by UUID, creator_name TEXT, creator_username TEXT, creator_avatar TEXT,
    creator_verified TEXT, participant_count BIGINT, submission_count BIGINT,
    has_joined BOOLEAN, has_submitted BOOLEAN, user_submission_status TEXT,
    winner_id UUID, winner_name TEXT, winner_declared_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id, c.title, c.description, c.cover_image, c.rules, c.prize_description,
        c.category, c.requires_proof, c.is_active, c.is_featured, c.start_date, c.end_date,
        c.created_by,
        COALESCE(p.name, p.username), p.username, p.avatar_url, COALESCE(p.verified, 'none'),
        (SELECT COUNT(*) FROM public.challenge_participants cp2 WHERE cp2.challenge_id = c.id),
        (SELECT COUNT(*) FROM public.challenge_submissions cs  WHERE cs.challenge_id  = c.id),
        EXISTS(SELECT 1 FROM public.challenge_participants cp3 WHERE cp3.challenge_id = c.id AND cp3.user_id = p_user_id),
        EXISTS(SELECT 1 FROM public.challenge_submissions  cs2 WHERE cs2.challenge_id = c.id AND cs2.user_id = p_user_id),
        (SELECT cs3.status FROM public.challenge_submissions cs3 WHERE cs3.challenge_id = c.id AND cs3.user_id = p_user_id LIMIT 1),
        c.winner_id,
        (SELECT wp.name FROM public.profiles wp WHERE wp.id = c.winner_id),
        c.winner_declared_at
    FROM public.challenges c
    JOIN public.profiles p ON p.id = c.created_by
    ORDER BY c.is_featured DESC, c.is_active DESC, c.start_date DESC;
END;
$$;

-- create_challenge — verified users only
CREATE OR REPLACE FUNCTION public.create_challenge(
    p_title              TEXT,
    p_description        TEXT,
    p_rules              TEXT       DEFAULT NULL,
    p_prize_description  TEXT       DEFAULT NULL,
    p_cover_image        TEXT       DEFAULT NULL,
    p_category           TEXT       DEFAULT 'general',
    p_requires_proof     BOOLEAN    DEFAULT true,
    p_max_participants   INTEGER    DEFAULT NULL,
    p_start_date         TIMESTAMPTZ DEFAULT now(),
    p_end_date           TIMESTAMPTZ DEFAULT NULL
)
RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_verified     TEXT;
    v_challenge_id BIGINT;
BEGIN
    SELECT COALESCE(verified, 'none') INTO v_verified FROM public.profiles WHERE id = auth.uid();
    IF v_verified = 'none' THEN RAISE EXCEPTION 'Only verified users can create challenges'; END IF;

    INSERT INTO public.challenges (
        title, description, created_by, start_date, end_date, is_active,
        cover_image, rules, prize_description, category, requires_proof, max_participants
    ) VALUES (
        p_title, p_description, auth.uid(), p_start_date, p_end_date, true,
        p_cover_image, p_rules, p_prize_description, p_category, p_requires_proof, p_max_participants
    ) RETURNING id INTO v_challenge_id;

    RETURN v_challenge_id;
END;
$$;

-- submit_challenge_proof
CREATE OR REPLACE FUNCTION public.submit_challenge_proof(
    p_challenge_id   BIGINT,
    p_proof_text     TEXT    DEFAULT NULL,
    p_proof_media_url TEXT   DEFAULT NULL,
    p_proof_media_type TEXT  DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_submission_id UUID;
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.challenge_participants WHERE challenge_id = p_challenge_id AND user_id = auth.uid()) THEN
        RAISE EXCEPTION 'You must join the challenge first';
    END IF;

    INSERT INTO public.challenge_submissions (challenge_id, user_id, proof_text, proof_media_url, proof_media_type, status)
    VALUES (p_challenge_id, auth.uid(), p_proof_text, p_proof_media_url, p_proof_media_type, 'pending')
    ON CONFLICT (challenge_id, user_id)
    DO UPDATE SET proof_text = p_proof_text, proof_media_url = p_proof_media_url,
                  proof_media_type = p_proof_media_type, status = 'pending', updated_at = now()
    RETURNING id INTO v_submission_id;

    UPDATE public.challenge_participants SET status = 'submitted', completed_at = now()
    WHERE challenge_id = p_challenge_id AND user_id = auth.uid();

    RETURN v_submission_id;
END;
$$;

-- review_challenge_submission — challenge author only
CREATE OR REPLACE FUNCTION public.review_challenge_submission(
    p_submission_id  UUID,
    p_status         TEXT,
    p_score          INTEGER DEFAULT 0,
    p_reviewer_notes TEXT    DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_challenge_id BIGINT; v_user_id UUID;
BEGIN
    SELECT challenge_id, user_id INTO v_challenge_id, v_user_id FROM public.challenge_submissions WHERE id = p_submission_id;

    IF NOT EXISTS (SELECT 1 FROM public.challenges WHERE id = v_challenge_id AND created_by = auth.uid()) THEN
        RAISE EXCEPTION 'Only the challenge author can review submissions';
    END IF;

    UPDATE public.challenge_submissions
    SET status = p_status, reviewed_by = auth.uid(), reviewed_at = now(),
        reviewer_notes = p_reviewer_notes, updated_at = now()
    WHERE id = p_submission_id;

    UPDATE public.challenge_participants
    SET status = CASE WHEN p_status = 'approved' THEN 'verified' ELSE 'rejected' END, score = p_score
    WHERE challenge_id = v_challenge_id AND user_id = v_user_id;
END;
$$;

-- declare_challenge_winner
CREATE OR REPLACE FUNCTION public.declare_challenge_winner(p_challenge_id BIGINT, p_winner_id UUID)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.challenges WHERE id = p_challenge_id AND created_by = auth.uid()) THEN
        RAISE EXCEPTION 'Only the challenge author can declare a winner';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM public.challenge_submissions WHERE challenge_id = p_challenge_id AND user_id = p_winner_id AND status = 'approved') THEN
        RAISE EXCEPTION 'Winner must have an approved submission';
    END IF;

    UPDATE public.challenges SET winner_id = p_winner_id, winner_declared_at = now(), is_active = false WHERE id = p_challenge_id;
    UPDATE public.challenge_participants SET status = 'winner', rank = 1 WHERE challenge_id = p_challenge_id AND user_id = p_winner_id;

    WITH ranked AS (
        SELECT user_id, ROW_NUMBER() OVER (ORDER BY score DESC, completed_at ASC) + 1 AS rnk
        FROM public.challenge_participants
        WHERE challenge_id = p_challenge_id AND status = 'verified' AND user_id != p_winner_id
    )
    UPDATE public.challenge_participants cp SET rank = r.rnk
    FROM ranked r WHERE cp.challenge_id = p_challenge_id AND cp.user_id = r.user_id;
END;
$$;

-- get_challenge_leaderboard
CREATE OR REPLACE FUNCTION public.get_challenge_leaderboard(p_challenge_id BIGINT)
RETURNS TABLE (user_id UUID, name TEXT, username TEXT, avatar_url TEXT, verified TEXT, status TEXT, score INTEGER, rank INTEGER, submitted_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY
    SELECT p.id, COALESCE(p.name, p.username), p.username, p.avatar_url,
           COALESCE(p.verified, 'none'), cp.status, COALESCE(cp.score, 0), cp.rank, cp.completed_at
    FROM public.challenge_participants cp
    JOIN public.profiles p ON p.id = cp.user_id
    WHERE cp.challenge_id = p_challenge_id
    ORDER BY cp.rank NULLS LAST, cp.score DESC, cp.completed_at ASC;
END;
$$;

-- get_featured_challenges
CREATE OR REPLACE FUNCTION public.get_featured_challenges(p_limit INTEGER DEFAULT 5)
RETURNS TABLE (id BIGINT, title TEXT, description TEXT, cover_image TEXT, category TEXT, participant_count BIGINT, is_active BOOLEAN, creator_name TEXT, creator_avatar TEXT, end_date TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY
    SELECT c.id, c.title, c.description, c.cover_image, c.category,
        (SELECT COUNT(*) FROM public.challenge_participants cp WHERE cp.challenge_id = c.id),
        c.is_active, COALESCE(p.name, p.username), p.avatar_url, c.end_date
    FROM public.challenges c
    JOIN public.profiles p ON p.id = c.created_by
    WHERE c.is_featured = true AND c.is_active = true
    ORDER BY c.start_date DESC LIMIT p_limit;
END;
$$;

-- get_challenge_submissions (for challenge author review)
CREATE OR REPLACE FUNCTION public.get_challenge_submissions(p_challenge_id BIGINT)
RETURNS TABLE (id UUID, user_id UUID, user_name TEXT, user_username TEXT, user_avatar TEXT, proof_text TEXT, proof_media_url TEXT, proof_media_type TEXT, status TEXT, reviewer_notes TEXT, created_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY
    SELECT cs.id, cs.user_id, COALESCE(p.name, p.username), p.username, p.avatar_url,
           cs.proof_text, cs.proof_media_url, cs.proof_media_type, cs.status, cs.reviewer_notes, cs.created_at
    FROM public.challenge_submissions cs
    JOIN public.profiles p ON p.id = cs.user_id
    WHERE cs.challenge_id = p_challenge_id
    ORDER BY cs.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_all_challenges(UUID)                                                          TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.create_challenge(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT, BOOLEAN, INTEGER, TIMESTAMPTZ, TIMESTAMPTZ) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_challenge_proof(BIGINT, TEXT, TEXT, TEXT)                                   TO authenticated;
GRANT EXECUTE ON FUNCTION public.review_challenge_submission(UUID, TEXT, INTEGER, TEXT)                             TO authenticated;
GRANT EXECUTE ON FUNCTION public.declare_challenge_winner(BIGINT, UUID)                                             TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_challenge_leaderboard(BIGINT)                                                  TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_featured_challenges(INTEGER)                                                   TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_challenge_submissions(BIGINT)                                                  TO authenticated;

-- ============================================================================
-- SECTION 4: STORIES
-- ============================================================================

-- get_story_analytics — only the story owner sees analytics
CREATE OR REPLACE FUNCTION public.get_story_analytics(p_status_id BIGINT)
RETURNS TABLE (
    total_views    BIGINT, total_reactions BIGINT, total_replies  BIGINT,
    forward_taps   BIGINT, back_taps       BIGINT, exits          BIGINT,
    link_clicks    BIGINT, sticker_taps    BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.statuses s WHERE s.id = p_status_id AND s.user_id = auth.uid()) THEN
        RETURN;
    END IF;

    RETURN QUERY SELECT
        (SELECT COUNT(*)::BIGINT FROM public.status_views    sv  WHERE sv.status_id = p_status_id),
        (SELECT COUNT(*)::BIGINT FROM public.story_reactions sr  WHERE sr.status_id = p_status_id),
        (SELECT COUNT(*)::BIGINT FROM public.story_replies   srp WHERE srp.status_id = p_status_id),
        (SELECT COUNT(*)::BIGINT FROM public.story_analytics sa  WHERE sa.status_id = p_status_id AND sa.action_type = 'forward_tap'),
        (SELECT COUNT(*)::BIGINT FROM public.story_analytics sa  WHERE sa.status_id = p_status_id AND sa.action_type = 'back_tap'),
        (SELECT COUNT(*)::BIGINT FROM public.story_analytics sa  WHERE sa.status_id = p_status_id AND sa.action_type = 'exit'),
        (SELECT COUNT(*)::BIGINT FROM public.story_analytics sa  WHERE sa.status_id = p_status_id AND sa.action_type = 'link_click'),
        (SELECT COUNT(*)::BIGINT FROM public.story_analytics sa  WHERE sa.status_id = p_status_id AND sa.action_type = 'sticker_tap');
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_story_analytics(BIGINT) TO authenticated;

-- ============================================================================
-- SECTION 5: STORAGE BUCKET SETUP
-- ============================================================================

-- Media buckets
INSERT INTO storage.buckets (id, name, public) VALUES ('post_media',  'post_media',  true)  ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars',     'avatars',     true)  ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('chat_media',  'chat_media',  false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('status_media','status_media',false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('leela_videos','leela_videos', true) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('banners',     'banners',     true)  ON CONFLICT DO NOTHING;

-- ============================================================================
-- Final schema cache reload
-- ============================================================================
NOTIFY pgrst, 'reload schema';
