-- ============================================================================
-- 06_fix_posts_rpc.sql
-- Fix: "column pl.id does not exist" in get_posts_paginated
--
-- Root causes:
--   1. post_likes has composite PK (user_id, post_id) — no "id" column
--   2. post_reposts has composite PK (user_id, post_id) — no "id" column
--   3. profiles.verified is TEXT ('none','verified','kcs'), not BOOLEAN
--
-- Run this AFTER all other migrations. It drops and recreates the function.
-- ============================================================================

DROP FUNCTION IF EXISTS public.get_posts_paginated(INT, BIGINT, TEXT);

CREATE OR REPLACE FUNCTION public.get_posts_paginated(
    p_limit INT DEFAULT 20,
    p_cursor BIGINT DEFAULT NULL,
    p_filter TEXT DEFAULT 'for_you'
)
RETURNS TABLE (
    id BIGINT,
    content TEXT,
    created_at TIMESTAMPTZ,
    media JSONB,
    poll JSONB,
    quote_of_id BIGINT,
    user_id UUID,
    author_name TEXT,
    author_username TEXT,
    author_avatar TEXT,
    author_verified TEXT,
    likes_count BIGINT,
    comments_count BIGINT,
    reposts_count BIGINT,
    is_liked BOOLEAN,
    is_reposted BOOLEAN,
    next_cursor BIGINT,
    is_bookmarked BOOLEAN,
    bookmarks_count BIGINT
) AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.content,
        p.created_at,
        COALESCE(p.media_urls, '[]'::jsonb) AS media,
        p.poll,
        p.quote_of_id,
        p.user_id,
        author.name,
        author.username,
        author.avatar_url,
        -- verified is TEXT: 'none', 'verified', or 'kcs'
        COALESCE(author.verified, 'none') AS author_verified,
        -- post_likes has no "id" column; count by user_id instead
        COALESCE(COUNT(DISTINCT pl.user_id), 0) AS likes_count,
        COALESCE(COUNT(DISTINCT c.id), 0) AS comments_count,
        -- post_reposts has no "id" column; count by user_id instead
        COALESCE(COUNT(DISTINCT pr.user_id), 0) AS reposts_count,
        EXISTS(SELECT 1 FROM public.post_likes WHERE post_id = p.id AND user_id = v_user_id) AS is_liked,
        EXISTS(SELECT 1 FROM public.post_reposts WHERE post_id = p.id AND user_id = v_user_id) AS is_reposted,
        p.id AS next_cursor,
        EXISTS(SELECT 1 FROM public.bookmarks WHERE post_id = p.id AND user_id = v_user_id) AS is_bookmarked,
        COALESCE(COUNT(DISTINCT b.id), 0) AS bookmarks_count
    FROM public.posts p
    LEFT JOIN public.profiles author ON p.user_id = author.id
    LEFT JOIN public.post_likes pl ON p.id = pl.post_id
    LEFT JOIN public.comments c ON p.id = c.post_id
    LEFT JOIN public.post_reposts pr ON p.id = pr.post_id
    LEFT JOIN public.bookmarks b ON p.id = b.post_id
    WHERE (p_cursor IS NULL OR p.id < p_cursor)
      AND (
          p_filter <> 'bookmarks'
          OR (p_filter = 'bookmarks' AND EXISTS (SELECT 1 FROM public.bookmarks bm WHERE bm.post_id = p.id AND bm.user_id = v_user_id))
      )
    GROUP BY p.id, author.id, author.name, author.username, author.avatar_url, author.verified
    ORDER BY p.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
