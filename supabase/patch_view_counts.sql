-- ============================================================================
-- patch_view_counts.sql
-- Run this in your Supabase SQL editor to fix view counting.
-- ============================================================================

-- ============================================================================
-- FIX 1: record_leela_view — replace unreliable xmax=0 check
-- ============================================================================
-- The previous version used RETURNING (xmax = 0) INTO v_is_new to detect if
-- the row was freshly inserted vs updated. This is unreliable on ON CONFLICT
-- branches in some Postgres versions — xmax is always nonzero after an update
-- even for rows that are new, causing v_is_new to always be FALSE and the
-- view_count to never increment.
--
-- Fix: use an explicit EXISTS check BEFORE the upsert.
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.record_leela_view(
    p_video_id       UUID,
    p_watched_seconds INTEGER DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
    v_already_viewed BOOLEAN;
BEGIN
    -- Check first (before the upsert) so we know if this is truly a new view
    SELECT EXISTS(
        SELECT 1 FROM public.leela_views
        WHERE user_id = auth.uid() AND video_id = p_video_id
    ) INTO v_already_viewed;

    -- Upsert the view record (always track max watched seconds)
    INSERT INTO public.leela_views (user_id, video_id, watched_seconds)
    VALUES (auth.uid(), p_video_id, p_watched_seconds)
    ON CONFLICT (user_id, video_id)
    DO UPDATE SET watched_seconds = GREATEST(leela_views.watched_seconds, EXCLUDED.watched_seconds);

    -- Only increment the counter for a truly first-time view
    IF NOT v_already_viewed THEN
        UPDATE public.leela_videos
        SET view_count = view_count + 1
        WHERE id = p_video_id;
    END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.record_leela_view(UUID, INTEGER) TO authenticated;


-- ============================================================================
-- FIX 2: get_leela_feed — add missing is_bookmarked column
-- ============================================================================
-- The frontend LeelaVideo type expects is_bookmarked but the RPC wasn't
-- returning it, causing all videos to show as un-bookmarked forever.
-- Also adds is_bookmarked = FALSE for anon users (no auth.uid()).
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_leela_feed(
    p_limit  INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id               UUID,
    video_url        TEXT,
    thumbnail_url    TEXT,
    caption          TEXT,
    audio_name       TEXT,
    duration_seconds INTEGER,
    view_count       INTEGER,
    like_count       INTEGER,
    comment_count    INTEGER,
    share_count      INTEGER,
    created_at       TIMESTAMPTZ,
    author_id        UUID,
    author_name      TEXT,
    author_username  TEXT,
    author_avatar    TEXT,
    author_verified  TEXT,
    is_liked         BOOLEAN,
    is_bookmarked    BOOLEAN       -- ← was missing
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
    RETURN QUERY
    SELECT
        v.id,
        v.video_url,
        v.thumbnail_url,
        v.caption,
        v.audio_name,
        v.duration_seconds,
        v.view_count,
        v.like_count,
        v.comment_count,
        v.share_count,
        v.created_at,
        p.id,
        COALESCE(p.name, p.username),
        p.username,
        p.avatar_url,
        COALESCE(p.verified, 'none'),
        -- is_liked
        EXISTS(
            SELECT 1 FROM public.leela_likes ll
            WHERE ll.video_id = v.id AND ll.user_id = auth.uid()
        ),
        -- is_bookmarked
        EXISTS(
            SELECT 1 FROM public.leela_bookmarks lb
            WHERE lb.video_id = v.id AND lb.user_id = auth.uid()
        )
    FROM public.leela_videos v
    JOIN public.profiles p ON p.id = v.user_id
    WHERE v.is_published = true
    ORDER BY v.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_leela_feed(INTEGER, INTEGER) TO authenticated, anon;


-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
