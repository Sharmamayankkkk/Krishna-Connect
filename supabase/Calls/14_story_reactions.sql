-- ============================================================
-- 14_story_reactions.sql
-- Story likes and replies for Instagram-style Stories feature
-- ============================================================

-- Story Reactions (Likes)
CREATE TABLE IF NOT EXISTS public.story_reactions (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    status_id BIGINT NOT NULL REFERENCES public.statuses(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    emoji TEXT NOT NULL DEFAULT '❤️',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(status_id, user_id)
);

-- Story Replies (DM-style replies to stories)
CREATE TABLE IF NOT EXISTS public.story_replies (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    status_id BIGINT NOT NULL REFERENCES public.statuses(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_story_reactions_status ON public.story_reactions(status_id);
CREATE INDEX IF NOT EXISTS idx_story_reactions_user ON public.story_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_story_replies_status ON public.story_replies(status_id);
CREATE INDEX IF NOT EXISTS idx_story_replies_sender ON public.story_replies(sender_id);
CREATE INDEX IF NOT EXISTS idx_story_replies_receiver ON public.story_replies(receiver_id);

-- RLS
ALTER TABLE public.story_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_replies ENABLE ROW LEVEL SECURITY;

-- Story Reactions Policies
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'story_reactions_select') THEN
        CREATE POLICY story_reactions_select ON public.story_reactions FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'story_reactions_insert') THEN
        CREATE POLICY story_reactions_insert ON public.story_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'story_reactions_delete') THEN
        CREATE POLICY story_reactions_delete ON public.story_reactions FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Story Replies Policies
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'story_replies_select') THEN
        CREATE POLICY story_replies_select ON public.story_replies FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'story_replies_insert') THEN
        CREATE POLICY story_replies_insert ON public.story_replies FOR INSERT WITH CHECK (auth.uid() = sender_id);
    END IF;
END $$;

-- Add media_type support to statuses if not already there
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'statuses' AND column_name = 'media_type') THEN
        ALTER TABLE public.statuses ADD COLUMN media_type TEXT DEFAULT 'image';
    END IF;
END $$;

-- Realtime
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.story_reactions;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.story_replies;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
