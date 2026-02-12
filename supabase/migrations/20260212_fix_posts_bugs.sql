-- ============================================================================
-- 20260212_fix_posts_bugs.sql
-- Description: Fix post deletion constraint, add bookmarks table, and update RPC
-- ============================================================================

-- 1. Fix Post Deletion (post_views constraint)
ALTER TABLE public.post_views
DROP CONSTRAINT IF EXISTS post_views_post_id_fkey,
ADD CONSTRAINT post_views_post_id_fkey
    FOREIGN KEY (post_id)
    REFERENCES public.posts(id)
    ON DELETE CASCADE;

-- 2. Create Bookmarks Table (if not exists)
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- 3. RLS for Bookmarks
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can view their own bookmarks"
    ON public.bookmarks FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can create their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can create their own bookmarks"
    ON public.bookmarks FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own bookmarks" ON public.bookmarks;
CREATE POLICY "Users can delete their own bookmarks"
    ON public.bookmarks FOR DELETE
    USING (auth.uid() = user_id);

-- 4. Update get_posts_paginated RPC to include bookmark status AND filtering
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
    author_verified BOOLEAN,
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
        p.id, p.content, p.created_at, p.media, p.poll, p.quote_of_id, p.user_id,
        author.name, author.username, author.avatar_url, COALESCE(author.verified, FALSE),
        COALESCE(COUNT(DISTINCT pl.id), 0),
        COALESCE(COUNT(DISTINCT c.id), 0),
        COALESCE(COUNT(DISTINCT pr.id), 0),
        EXISTS(SELECT 1 FROM public.post_likes WHERE post_id = p.id AND user_id = v_user_id),
        EXISTS(SELECT 1 FROM public.post_reposts WHERE post_id = p.id AND user_id = v_user_id),
        p.id,
        EXISTS(SELECT 1 FROM public.bookmarks WHERE post_id = p.id AND user_id = v_user_id),
        COALESCE(COUNT(DISTINCT b.id), 0)
    FROM public.posts p
    LEFT JOIN public.profiles author ON p.user_id = author.id
    LEFT JOIN public.post_likes pl ON p.id = pl.post_id
    LEFT JOIN public.comments c ON p.id = c.post_id
    LEFT JOIN public.post_reposts pr ON p.id = pr.post_id
    LEFT JOIN public.bookmarks b ON p.id = b.post_id
    WHERE (p_cursor IS NULL OR p.id < p_cursor)
      AND (
          CASE 
              WHEN p_filter = 'bookmarks' THEN EXISTS (SELECT 1 FROM public.bookmarks bm WHERE bm.post_id = p.id AND bm.user_id = v_user_id)
              ELSE TRUE 
          END
      )
    GROUP BY p.id, author.id, author.name, author.username, author.avatar_url, author.verified
    ORDER BY p.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
