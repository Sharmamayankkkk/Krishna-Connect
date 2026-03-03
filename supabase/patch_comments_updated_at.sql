-- ============================================================================
-- patch_comments_updated_at.sql
-- Run this in your Supabase SQL editor.
--
-- Fixes:
--   1. Add updated_at column to comments table so the "(edited)" badge shows
--      in the UI after a user edits their comment.
--   2. Re-create the get_post_comments RPC to also return updated_at so the
--      frontend can populate the editedAt field.
-- ============================================================================


-- ============================================================================
-- FIX 1: Add updated_at column to comments table
-- ============================================================================
ALTER TABLE public.comments
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL;

-- Keep updated_at in sync automatically on every UPDATE
CREATE OR REPLACE FUNCTION public.set_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS comments_set_updated_at ON public.comments;
CREATE TRIGGER comments_set_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.set_comments_updated_at();


-- ============================================================================
-- FIX 2: Rebuild get_post_comments to include updated_at
-- ============================================================================
DROP FUNCTION IF EXISTS public.get_post_comments(BIGINT);
CREATE OR REPLACE FUNCTION public.get_post_comments(p_post_id BIGINT)
RETURNS TABLE (
    id                BIGINT,
    user_id           UUID,
    post_id           BIGINT,
    parent_comment_id BIGINT,
    content           TEXT,
    created_at        TIMESTAMPTZ,
    updated_at        TIMESTAMPTZ,
    user_name         TEXT,
    user_username     TEXT,
    user_avatar_url   TEXT,
    user_verified     TEXT,
    like_count        BIGINT,
    is_pinned         BOOLEAN,
    is_hidden         BOOLEAN,
    is_liked          BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.user_id,
        c.post_id,
        c.parent_comment_id,
        c.content,
        c.created_at,
        c.updated_at,
        p.name,
        p.username,
        p.avatar_url,
        p.verified,
        COALESCE(COUNT(cl.user_id), 0)::BIGINT,
        c.is_pinned,
        c.is_hidden,
        EXISTS(
            SELECT 1 FROM public.comment_likes cl2
            WHERE cl2.comment_id = c.id AND cl2.user_id = auth.uid()
        )
    FROM public.comments c
    LEFT JOIN public.profiles      p  ON c.user_id    = p.id
    LEFT JOIN public.comment_likes cl ON c.id         = cl.comment_id
    WHERE c.post_id = p_post_id
      AND (c.is_hidden = false OR c.user_id = auth.uid())
    GROUP BY c.id, p.id
    ORDER BY c.is_pinned DESC, c.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;
