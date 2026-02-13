-- ============================================================================
-- 20260213_add_bookmark_collections.sql
-- Description: Add bookmark collections tables and RPCs
-- ============================================================================

-- 1. Create Bookmark Collections Table
CREATE TABLE IF NOT EXISTS public.bookmark_collections (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_private BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Bookmark Collection Items Table
CREATE TABLE IF NOT EXISTS public.bookmark_collection_items (
    collection_id BIGINT NOT NULL REFERENCES public.bookmark_collections(id) ON DELETE CASCADE,
    post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (collection_id, post_id)
);

-- 3. RLS for Collections
ALTER TABLE public.bookmark_collections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own collections"
    ON public.bookmark_collections FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own collections"
    ON public.bookmark_collections FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
    ON public.bookmark_collections FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
    ON public.bookmark_collections FOR DELETE
    USING (auth.uid() = user_id);

-- 4. RLS for Collection Items
ALTER TABLE public.bookmark_collection_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view items in their collections"
    ON public.bookmark_collection_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.bookmark_collections c
        WHERE c.id = bookmark_collection_items.collection_id
        AND c.user_id = auth.uid()
    ));

CREATE POLICY "Users can add items to their collections"
    ON public.bookmark_collection_items FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.bookmark_collections c
        WHERE c.id = bookmark_collection_items.collection_id
        AND c.user_id = auth.uid()
    ));

CREATE POLICY "Users can remove items from their collections"
    ON public.bookmark_collection_items FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.bookmark_collections c
        WHERE c.id = bookmark_collection_items.collection_id
        AND c.user_id = auth.uid()
    ));

-- 5. RPCs

-- Get Collections with Post Counts
CREATE OR REPLACE FUNCTION public.get_bookmark_collections()
RETURNS TABLE (
    id BIGINT,
    name TEXT,
    is_private BOOLEAN,
    created_at TIMESTAMPTZ,
    post_count BIGINT,
    last_post_cover TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.name,
        c.is_private,
        c.created_at,
        COUNT(bci.post_id)::BIGINT as post_count,
        (
            SELECT (p.media->0->>'url')::TEXT
            FROM public.bookmark_collection_items bci2
            JOIN public.posts p ON p.id = bci2.post_id
            WHERE bci2.collection_id = c.id
            AND p.media IS NOT NULL
            AND jsonb_array_length(p.media) > 0
            ORDER BY bci2.added_at DESC
            LIMIT 1
        ) as last_post_cover
    FROM public.bookmark_collections c
    LEFT JOIN public.bookmark_collection_items bci ON c.id = bci.collection_id
    WHERE c.user_id = auth.uid()
    GROUP BY c.id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Create Collection
CREATE OR REPLACE FUNCTION public.create_bookmark_collection(
    p_name TEXT,
    p_is_private BOOLEAN DEFAULT TRUE
)
RETURNS BIGINT AS $$
DECLARE
    v_id BIGINT;
BEGIN
    INSERT INTO public.bookmark_collections (user_id, name, is_private)
    VALUES (auth.uid(), p_name, p_is_private)
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Add to Collection (and ensure it's bookmarked generally)
CREATE OR REPLACE FUNCTION public.add_to_collection(
    p_collection_id BIGINT,
    p_post_id BIGINT
)
RETURNS VOID AS $$
BEGIN
    -- Ensure post is bookmarked in general bookmarks table first
    INSERT INTO public.bookmarks (user_id, post_id)
    VALUES (auth.uid(), p_post_id)
    ON CONFLICT (user_id, post_id) DO NOTHING;

    -- Add to specific collection
    INSERT INTO public.bookmark_collection_items (collection_id, post_id)
    VALUES (p_collection_id, p_post_id)
    ON CONFLICT (collection_id, post_id) DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Remove from Collection
CREATE OR REPLACE FUNCTION public.remove_from_collection(
    p_collection_id BIGINT,
    p_post_id BIGINT
)
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.bookmark_collection_items
    WHERE collection_id = p_collection_id
    AND post_id = p_post_id;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Delete Collection
CREATE OR REPLACE FUNCTION public.delete_bookmark_collection(
    p_collection_id BIGINT
)
RETURNS VOID AS $$
BEGIN
    DELETE FROM public.bookmark_collections
    WHERE id = p_collection_id
    AND user_id = auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Get Posts in Collection
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
        p.id, -- using id as cursor for now, typically added_at would be better but this aligns with other RPCs
        EXISTS(SELECT 1 FROM public.bookmarks WHERE post_id = p.id AND user_id = v_user_id),
        COALESCE(COUNT(DISTINCT b.id), 0)
    FROM public.bookmark_collection_items bci
    JOIN public.posts p ON bci.post_id = p.id
    LEFT JOIN public.profiles author ON p.user_id = author.id
    LEFT JOIN public.post_likes pl ON p.id = pl.post_id
    LEFT JOIN public.comments c ON p.id = c.post_id
    LEFT JOIN public.post_reposts pr ON p.id = pr.post_id
    LEFT JOIN public.bookmarks b ON p.id = b.post_id
    WHERE bci.collection_id = p_collection_id
      AND (p_cursor IS NULL OR p.id < p_cursor)
    GROUP BY p.id, author.id, author.name, author.username, author.avatar_url, author.verified, bci.added_at
    ORDER BY bci.added_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
