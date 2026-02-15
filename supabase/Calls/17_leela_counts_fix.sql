-- ============================================================
-- 17_leela_counts_fix.sql
-- Fix Leela interaction counts: update get_leela_feed to compute
-- live counts from actual tables, add is_bookmarked, and add
-- triggers to keep denormalized counts in sync.
-- ============================================================

-- ============================================================
-- 1. Triggers to keep leela_videos counts in sync
-- ============================================================

-- Like count trigger function
CREATE OR REPLACE FUNCTION public.update_leela_like_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.leela_videos SET like_count = like_count + 1 WHERE id = NEW.video_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.leela_videos SET like_count = GREATEST(like_count - 1, 0) WHERE id = OLD.video_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Comment count trigger function
CREATE OR REPLACE FUNCTION public.update_leela_comment_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.leela_videos SET comment_count = comment_count + 1 WHERE id = NEW.video_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.leela_videos SET comment_count = GREATEST(comment_count - 1, 0) WHERE id = OLD.video_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Drop existing triggers if they exist, then create
DROP TRIGGER IF EXISTS trg_leela_like_count ON public.leela_likes;
CREATE TRIGGER trg_leela_like_count
  AFTER INSERT OR DELETE ON public.leela_likes
  FOR EACH ROW EXECUTE FUNCTION public.update_leela_like_count();

DROP TRIGGER IF EXISTS trg_leela_comment_count ON public.leela_comments;
CREATE TRIGGER trg_leela_comment_count
  AFTER INSERT OR DELETE ON public.leela_comments
  FOR EACH ROW EXECUTE FUNCTION public.update_leela_comment_count();

-- ============================================================
-- 2. One-time fix: sync existing counts from actual data
-- ============================================================
UPDATE public.leela_videos v SET
  like_count = (SELECT COUNT(*) FROM public.leela_likes ll WHERE ll.video_id = v.id),
  comment_count = (SELECT COUNT(*) FROM public.leela_comments lc WHERE lc.video_id = v.id),
  view_count = (SELECT COUNT(*) FROM public.leela_views lv WHERE lv.video_id = v.id);

-- ============================================================
-- 3. Updated get_leela_feed with is_bookmarked support
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_leela_feed(
  p_limit INTEGER DEFAULT 10,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  video_url TEXT,
  thumbnail_url TEXT,
  caption TEXT,
  audio_name TEXT,
  duration_seconds INTEGER,
  view_count INTEGER,
  like_count INTEGER,
  comment_count INTEGER,
  share_count INTEGER,
  created_at TIMESTAMPTZ,
  author_id UUID,
  author_name TEXT,
  author_username TEXT,
  author_avatar TEXT,
  author_verified TEXT,
  is_liked BOOLEAN,
  is_bookmarked BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
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
    p.id AS author_id,
    COALESCE(p.name, p.username) AS author_name,
    p.username AS author_username,
    p.avatar_url AS author_avatar,
    COALESCE(p.verified, 'none') AS author_verified,
    EXISTS(SELECT 1 FROM public.leela_likes ll WHERE ll.video_id = v.id AND ll.user_id = auth.uid()) AS is_liked,
    EXISTS(SELECT 1 FROM public.leela_bookmarks lb WHERE lb.video_id = v.id AND lb.user_id = auth.uid()) AS is_bookmarked
  FROM public.leela_videos v
  JOIN public.profiles p ON p.id = v.user_id
  WHERE v.is_published = true
  ORDER BY v.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Re-grant execute
GRANT EXECUTE ON FUNCTION public.get_leela_feed(INTEGER, INTEGER) TO authenticated, anon;

-- Reload schema
NOTIFY pgrst, 'reload schema';
