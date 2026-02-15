-- ============================================================================
-- 08_fix_collection_posts.sql
-- Fix: get_collection_posts function fails because:
--   1. post_likes/post_reposts have composite PK (user_id, post_id), no 'id' column
--   2. profiles.verified is TEXT ('none','verified','kcs'), not BOOLEAN
--   3. Ambiguous user_id in EXISTS subqueries
-- Run this AFTER all previous SQL files (01-07)
-- ============================================================================

-- Drop and recreate get_collection_posts with correct types
DROP FUNCTION IF EXISTS public.get_collection_posts(BIGINT, INT, BIGINT);

CREATE OR REPLACE FUNCTION public.get_collection_posts(
    p_collection_id BIGINT,
    p_limit INT DEFAULT 20,
    p_cursor BIGINT DEFAULT NULL
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
)
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    RETURN QUERY
    SELECT
        p.id,
        p.content,
        p.created_at,
        COALESCE(p.media_urls, '[]'::jsonb),
        p.poll,
        p.quote_of_id,
        p.user_id,
        author.name,
        author.username,
        author.avatar_url,
        COALESCE(author.verified, 'none'),
        COUNT(DISTINCT pls.user_id)::BIGINT,
        COUNT(DISTINCT c.id)::BIGINT,
        COUNT(DISTINCT prs.user_id)::BIGINT,
        EXISTS(SELECT 1 FROM public.post_likes lk WHERE lk.post_id = p.id AND lk.user_id = v_user_id),
        EXISTS(SELECT 1 FROM public.post_reposts rp WHERE rp.post_id = p.id AND rp.user_id = v_user_id),
        p.id,
        EXISTS(SELECT 1 FROM public.bookmarks bk WHERE bk.post_id = p.id AND bk.user_id = v_user_id),
        COUNT(DISTINCT b.user_id)::BIGINT
    FROM public.bookmark_collection_items bci
    JOIN public.posts p ON bci.post_id = p.id
    LEFT JOIN public.profiles author ON p.user_id = author.id
    LEFT JOIN public.post_likes pls ON p.id = pls.post_id
    LEFT JOIN public.comments c ON p.id = c.post_id
    LEFT JOIN public.post_reposts prs ON p.id = prs.post_id
    LEFT JOIN public.bookmarks b ON p.id = b.post_id
    WHERE bci.collection_id = p_collection_id
      AND (p_cursor IS NULL OR p.id < p_cursor)
    GROUP BY p.id, p.content, p.created_at, p.media_urls, p.poll, p.quote_of_id, p.user_id,
             author.name, author.username, author.avatar_url, author.verified, bci.added_at
    ORDER BY bci.added_at DESC
    LIMIT p_limit;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.get_collection_posts(BIGINT, INT, BIGINT) TO authenticated;

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
