-- ============================================================
-- 09_leela_schema.sql
-- Schema for Leela (short-form video feature like Reels/Shorts)
-- ============================================================

-- Leela videos table
CREATE TABLE IF NOT EXISTS public.leela_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  caption TEXT,
  audio_name TEXT,
  duration_seconds INTEGER,
  width INTEGER,
  height INTEGER,
  view_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0,
  comment_count INTEGER DEFAULT 0,
  share_count INTEGER DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Leela video likes
CREATE TABLE IF NOT EXISTS public.leela_likes (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.leela_videos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, video_id)
);

-- Leela video comments
CREATE TABLE IF NOT EXISTS public.leela_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.leela_videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  parent_id UUID REFERENCES public.leela_comments(id) ON DELETE CASCADE,
  like_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Leela video views (for tracking unique views)
CREATE TABLE IF NOT EXISTS public.leela_views (
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.leela_videos(id) ON DELETE CASCADE,
  watched_seconds INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, video_id)
);

-- ============================================================
-- Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_leela_videos_user ON public.leela_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_leela_videos_created ON public.leela_videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leela_videos_published ON public.leela_videos(is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leela_comments_video ON public.leela_comments(video_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leela_likes_video ON public.leela_likes(video_id);

-- ============================================================
-- RLS Policies
-- ============================================================
ALTER TABLE public.leela_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leela_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leela_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leela_views ENABLE ROW LEVEL SECURITY;

-- Leela videos: anyone can read published, owners can manage their own
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'leela_videos_select' AND tablename = 'leela_videos') THEN
    CREATE POLICY leela_videos_select ON public.leela_videos FOR SELECT USING (is_published = true OR user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'leela_videos_insert' AND tablename = 'leela_videos') THEN
    CREATE POLICY leela_videos_insert ON public.leela_videos FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'leela_videos_update' AND tablename = 'leela_videos') THEN
    CREATE POLICY leela_videos_update ON public.leela_videos FOR UPDATE USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'leela_videos_delete' AND tablename = 'leela_videos') THEN
    CREATE POLICY leela_videos_delete ON public.leela_videos FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

-- Leela likes: anyone authed can like, owners can delete
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'leela_likes_select' AND tablename = 'leela_likes') THEN
    CREATE POLICY leela_likes_select ON public.leela_likes FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'leela_likes_insert' AND tablename = 'leela_likes') THEN
    CREATE POLICY leela_likes_insert ON public.leela_likes FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'leela_likes_delete' AND tablename = 'leela_likes') THEN
    CREATE POLICY leela_likes_delete ON public.leela_likes FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

-- Leela comments
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'leela_comments_select' AND tablename = 'leela_comments') THEN
    CREATE POLICY leela_comments_select ON public.leela_comments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'leela_comments_insert' AND tablename = 'leela_comments') THEN
    CREATE POLICY leela_comments_insert ON public.leela_comments FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'leela_comments_delete' AND tablename = 'leela_comments') THEN
    CREATE POLICY leela_comments_delete ON public.leela_comments FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;

-- Leela views
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'leela_views_select' AND tablename = 'leela_views') THEN
    CREATE POLICY leela_views_select ON public.leela_views FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'leela_views_insert' AND tablename = 'leela_views') THEN
    CREATE POLICY leela_views_insert ON public.leela_views FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'leela_views_upsert' AND tablename = 'leela_views') THEN
    CREATE POLICY leela_views_upsert ON public.leela_views FOR UPDATE USING (user_id = auth.uid());
  END IF;
END $$;

-- ============================================================
-- Functions
-- ============================================================

-- Increment view count + track unique view
CREATE OR REPLACE FUNCTION public.record_leela_view(p_video_id UUID, p_watched_seconds INTEGER DEFAULT 0)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Upsert view record
  INSERT INTO public.leela_views (user_id, video_id, watched_seconds)
  VALUES (auth.uid(), p_video_id, p_watched_seconds)
  ON CONFLICT (user_id, video_id) DO UPDATE SET watched_seconds = GREATEST(leela_views.watched_seconds, p_watched_seconds);

  -- Increment view count on video
  UPDATE public.leela_videos SET view_count = view_count + 1 WHERE id = p_video_id;
END;
$$;

-- Get Leela feed (paginated, for-you style)
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
  is_liked BOOLEAN
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
    EXISTS(SELECT 1 FROM public.leela_likes ll WHERE ll.video_id = v.id AND ll.user_id = auth.uid()) AS is_liked
  FROM public.leela_videos v
  JOIN public.profiles p ON p.id = v.user_id
  WHERE v.is_published = true
  ORDER BY v.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Get user's Leela videos
CREATE OR REPLACE FUNCTION public.get_user_leela_videos(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  video_url TEXT,
  thumbnail_url TEXT,
  caption TEXT,
  view_count INTEGER,
  like_count INTEGER,
  comment_count INTEGER,
  created_at TIMESTAMPTZ
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
    v.view_count,
    v.like_count,
    v.comment_count,
    v.created_at
  FROM public.leela_videos v
  WHERE v.user_id = p_user_id AND v.is_published = true
  ORDER BY v.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;

-- Grant execute
GRANT EXECUTE ON FUNCTION public.record_leela_view(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_leela_feed(INTEGER, INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION public.get_user_leela_videos(UUID, INTEGER, INTEGER) TO authenticated, anon;

-- Enable realtime
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.leela_videos;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.leela_likes;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.leela_comments;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Reload PostgREST schema cache
NOTIFY pgrst, 'reload schema';
