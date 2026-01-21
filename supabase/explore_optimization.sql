-- ============================================================================
-- EXPLORE PAGE PERFORMANCE OPTIMIZATION
-- ============================================================================
-- Database indexes and optimized query functions for better performance
-- ============================================================================

-- ============================================================================
-- SECTION 1: CREATE PERFORMANCE INDEXES
-- ============================================================================

-- Index on posts table for fast sorting by created_at
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

-- Index on posts.user_id for author joins
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);

-- Indexes on post_likes for fast joins and user checks
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_post ON public.post_likes(user_id, post_id);

-- Indexes on comments for fast counting
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);

-- Indexes on post_reposts
CREATE INDEX IF NOT EXISTS idx_post_reposts_post_id ON public.post_reposts(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reposts_user_id ON public.post_reposts(user_id);

-- ============================================================================
-- SECTION 2: OPTIMIZED PAGINATED POSTS QUERY
-- ============================================================================

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
    author_verified BOOLEAN,
    likes_count BIGINT,
    comments_count BIGINT,
    reposts_count BIGINT,
    is_liked BOOLEAN,
    is_reposted BOOLEAN,
    next_cursor BIGINT
) AS $$
DECLARE
    v_user_id UUID := auth.uid();
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.content,
        p.created_at,
        p.media,
        p.poll,
        p.quote_of_id,
        p.user_id,
        author.name as author_name,
        author.username as author_username,
        author.avatar_url as author_avatar,
        COALESCE(author.verified, FALSE) as author_verified,
        COALESCE(COUNT(DISTINCT pl.id), 0) as likes_count,
        COALESCE(COUNT(DISTINCT c.id), 0) as comments_count,
        COALESCE(COUNT(DISTINCT pr.id), 0) as reposts_count,
        EXISTS(SELECT 1 FROM public.post_likes WHERE post_id = p.id AND user_id = v_user_id) as is_liked,
        EXISTS(SELECT 1 FROM public.post_reposts WHERE post_id = p.id AND user_id = v_user_id) as is_reposted,
        p.id as next_cursor
    FROM public.posts p
    LEFT JOIN public.profiles author ON p.user_id = author.id
    LEFT JOIN public.post_likes pl ON p.id = pl.post_id
    LEFT JOIN public.comments c ON p.id = c.post_id
    LEFT JOIN public.post_reposts pr ON p.id = pr.post_id
    WHERE (p_cursor IS NULL OR p.id < p_cursor)
    GROUP BY p.id, author.id, author.name, author.username, author.avatar_url, author.verified
    ORDER BY p.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- ============================================================================
-- SECTION 3: GET COMMENTS FOR POST (LAZY LOADING)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.get_post_comments(
    p_post_id BIGINT,
    p_limit INT DEFAULT 5
)
RETURNS TABLE (
    id BIGINT,
    content TEXT,
    created_at TIMESTAMPTZ,
    user_id UUID,
    user_name TEXT,
    user_username TEXT,
    user_avatar TEXT,
    likes_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.content,
        c.created_at,
        c.user_id,
        u.name as user_name,
        u.username as user_username,
        u.avatar_url as user_avatar,
        COALESCE(COUNT(cl.id), 0) as likes_count
    FROM public.comments c
    LEFT JOIN public.profiles u ON c.user_id = u.id
    LEFT JOIN public.comment_likes cl ON c.id = cl.comment_id
    WHERE c.post_id = p_post_id
    GROUP BY c.id, u.id, u.name, u.username, u.avatar_url
    ORDER BY c.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- ============================================================================
-- SECTION 4: GRANT PERMISSIONS
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.get_posts_paginated(INT, BIGINT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_post_comments(BIGINT, INT) TO authenticated;

-- ============================================================================
-- SECTION 5: ANALYZE TABLES FOR QUERY PLANNER
-- ============================================================================

ANALYZE public.posts;
ANALYZE public.post_likes;
ANALYZE public.comments;
ANALYZE public.post_reposts;

-- ============================================================================
-- END OF FILE
-- ============================================================================
