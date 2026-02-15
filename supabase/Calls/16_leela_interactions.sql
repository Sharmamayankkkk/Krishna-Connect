-- ============================================================
-- 16_leela_interactions.sql
-- Leela video interactions: comments, bookmarks
-- (leela_likes already created by 09_leela_schema.sql)
-- ============================================================

-- 1. Comments table
CREATE TABLE IF NOT EXISTS public.leela_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.leela_videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_leela_comments_video ON public.leela_comments(video_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leela_comments_user ON public.leela_comments(user_id);

-- 2. Bookmarks table
CREATE TABLE IF NOT EXISTS public.leela_bookmarks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  video_id UUID NOT NULL REFERENCES public.leela_videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(video_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_leela_bookmarks_user ON public.leela_bookmarks(user_id);

-- 3. RLS for leela_comments
ALTER TABLE public.leela_comments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leela_comments' AND policyname = 'leela_comments_select') THEN
    CREATE POLICY leela_comments_select ON public.leela_comments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leela_comments' AND policyname = 'leela_comments_insert') THEN
    CREATE POLICY leela_comments_insert ON public.leela_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leela_comments' AND policyname = 'leela_comments_delete') THEN
    CREATE POLICY leela_comments_delete ON public.leela_comments FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- 4. RLS for leela_bookmarks
ALTER TABLE public.leela_bookmarks ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leela_bookmarks' AND policyname = 'leela_bookmarks_select') THEN
    CREATE POLICY leela_bookmarks_select ON public.leela_bookmarks FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leela_bookmarks' AND policyname = 'leela_bookmarks_insert') THEN
    CREATE POLICY leela_bookmarks_insert ON public.leela_bookmarks FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'leela_bookmarks' AND policyname = 'leela_bookmarks_delete') THEN
    CREATE POLICY leela_bookmarks_delete ON public.leela_bookmarks FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- 5. Realtime
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.leela_comments;
  ALTER PUBLICATION supabase_realtime ADD TABLE public.leela_bookmarks;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 6. Schema reload
NOTIFY pgrst, 'reload schema';
