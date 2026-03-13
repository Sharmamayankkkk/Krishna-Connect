-- ============================================================================
-- Migration: get_explore_feed RPC (v2 - optimized, no timeout)
-- Run in: Supabase SQL Editor
-- ============================================================================

-- Drop old version first
DROP FUNCTION IF EXISTS public.get_explore_feed(INT, INT);

CREATE OR REPLACE FUNCTION public.get_explore_feed(
    p_limit  INT  DEFAULT 60,
    p_offset INT  DEFAULT 0
)
RETURNS TABLE (
    id              BIGINT,
    content         TEXT,
    media_urls      JSONB,
    poll            JSONB,
    created_at      TIMESTAMPTZ,
    user_id         UUID,
    views_count     INT,
    is_promoted     BOOLEAN,
    author_id       UUID,
    author_name     TEXT,
    author_username TEXT,
    author_avatar   TEXT,
    author_verified TEXT,
    like_count      BIGINT,
    comment_count   BIGINT,
    repost_count    BIGINT,
    is_liked        BOOLEAN,
    is_reposted     BOOLEAN
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    -- Apply LIMIT first on posts, then do cheap per-row subquery counts
    WITH paged_posts AS (
        SELECT p.*
        FROM public.posts p
        JOIN public.profiles pr ON pr.id = p.user_id
        WHERE pr.is_private = false
        ORDER BY p.created_at DESC
        LIMIT p_limit OFFSET p_offset
    )
    SELECT
        p.id,
        p.content,
        COALESCE(p.media_urls, '[]'::jsonb),
        p.poll,
        p.created_at,
        p.user_id,
        COALESCE(p.views_count, 0),
        COALESCE(p.is_promoted, false),
        pr.id,
        pr.name,
        pr.username,
        pr.avatar_url,
        COALESCE(pr.verified, 'none'),
        (SELECT COUNT(*) FROM public.post_likes   pl WHERE pl.post_id = p.id)::BIGINT,
        (SELECT COUNT(*) FROM public.comments      c  WHERE c.post_id  = p.id)::BIGINT,
        (SELECT COUNT(*) FROM public.post_reposts  rp WHERE rp.post_id = p.id)::BIGINT,
        EXISTS(SELECT 1 FROM public.post_likes  pl WHERE pl.post_id = p.id AND pl.user_id = auth.uid()),
        EXISTS(SELECT 1 FROM public.post_reposts rp WHERE rp.post_id = p.id AND rp.user_id = auth.uid())
    FROM paged_posts p
    JOIN public.profiles pr ON pr.id = p.user_id
    ORDER BY p.created_at DESC;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION public.get_explore_feed(INT, INT) TO authenticated, anon;
