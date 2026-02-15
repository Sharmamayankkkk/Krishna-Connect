-- ============================================================
-- 15_stories_complete.sql
-- Complete Stories feature: Close Friends, Highlights, Stickers,
-- Analytics, Visibility controls
-- ============================================================

-- 1. Close Friends table
CREATE TABLE IF NOT EXISTS public.close_friends (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS idx_close_friends_user ON public.close_friends(user_id);
CREATE INDEX IF NOT EXISTS idx_close_friends_friend ON public.close_friends(friend_id);

-- 2. Story Highlights
CREATE TABLE IF NOT EXISTS public.story_highlights (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    cover_url TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_story_highlights_user ON public.story_highlights(user_id);

CREATE TABLE IF NOT EXISTS public.story_highlight_items (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    highlight_id BIGINT NOT NULL REFERENCES public.story_highlights(id) ON DELETE CASCADE,
    status_id BIGINT NOT NULL REFERENCES public.statuses(id) ON DELETE CASCADE,
    sort_order INT DEFAULT 0,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(highlight_id, status_id)
);

CREATE INDEX IF NOT EXISTS idx_story_highlight_items_highlight ON public.story_highlight_items(highlight_id);

-- 3. Story Stickers (overlay metadata)
CREATE TABLE IF NOT EXISTS public.story_stickers (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    status_id BIGINT NOT NULL REFERENCES public.statuses(id) ON DELETE CASCADE,
    sticker_type TEXT NOT NULL, -- 'mention', 'hashtag', 'time', 'link', 'countdown', 'poll', 'question'
    data JSONB NOT NULL DEFAULT '{}',
    position_x FLOAT DEFAULT 50, -- percentage from left
    position_y FLOAT DEFAULT 50, -- percentage from top
    scale FLOAT DEFAULT 1,
    rotation FLOAT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_story_stickers_status ON public.story_stickers(status_id);

-- 4. Add visibility and view tracking columns to statuses
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'statuses' AND column_name = 'visibility') THEN
        ALTER TABLE public.statuses ADD COLUMN visibility TEXT DEFAULT 'public'; -- 'public', 'close_friends'
    END IF;
END $$;

-- 5. Story analytics tracking table (navigation taps, exits)
CREATE TABLE IF NOT EXISTS public.story_analytics (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    status_id BIGINT NOT NULL REFERENCES public.statuses(id) ON DELETE CASCADE,
    viewer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    action_type TEXT NOT NULL, -- 'forward_tap', 'back_tap', 'exit', 'link_click', 'sticker_tap', 'reply', 'reaction'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_story_analytics_status ON public.story_analytics(status_id);

-- ==================
-- RLS POLICIES
-- ==================

ALTER TABLE public.close_friends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_highlight_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_stickers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_analytics ENABLE ROW LEVEL SECURITY;

-- Close Friends: only owner can manage, friends can see they are in the list
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'close_friends_select') THEN
        CREATE POLICY close_friends_select ON public.close_friends FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'close_friends_insert') THEN
        CREATE POLICY close_friends_insert ON public.close_friends FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'close_friends_delete') THEN
        CREATE POLICY close_friends_delete ON public.close_friends FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Story Highlights: public read, only owner can manage
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'story_highlights_select') THEN
        CREATE POLICY story_highlights_select ON public.story_highlights FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'story_highlights_insert') THEN
        CREATE POLICY story_highlights_insert ON public.story_highlights FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'story_highlights_update') THEN
        CREATE POLICY story_highlights_update ON public.story_highlights FOR UPDATE USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'story_highlights_delete') THEN
        CREATE POLICY story_highlights_delete ON public.story_highlights FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- Highlight Items: public read, owner of highlight can manage
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'story_highlight_items_select') THEN
        CREATE POLICY story_highlight_items_select ON public.story_highlight_items FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'story_highlight_items_insert') THEN
        CREATE POLICY story_highlight_items_insert ON public.story_highlight_items FOR INSERT WITH CHECK (
            EXISTS (SELECT 1 FROM public.story_highlights h WHERE h.id = highlight_id AND h.user_id = auth.uid())
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'story_highlight_items_delete') THEN
        CREATE POLICY story_highlight_items_delete ON public.story_highlight_items FOR DELETE USING (
            EXISTS (SELECT 1 FROM public.story_highlights h WHERE h.id = highlight_id AND h.user_id = auth.uid())
        );
    END IF;
END $$;

-- Story Stickers: public read, status owner can manage
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'story_stickers_select') THEN
        CREATE POLICY story_stickers_select ON public.story_stickers FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'story_stickers_insert') THEN
        CREATE POLICY story_stickers_insert ON public.story_stickers FOR INSERT WITH CHECK (
            EXISTS (SELECT 1 FROM public.statuses s WHERE s.id = status_id AND s.user_id = auth.uid())
        );
    END IF;
END $$;

-- Story Analytics: status owner can read, viewers can insert
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'story_analytics_select') THEN
        CREATE POLICY story_analytics_select ON public.story_analytics FOR SELECT USING (
            EXISTS (SELECT 1 FROM public.statuses s WHERE s.id = status_id AND s.user_id = auth.uid())
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'story_analytics_insert') THEN
        CREATE POLICY story_analytics_insert ON public.story_analytics FOR INSERT WITH CHECK (auth.uid() = viewer_id);
    END IF;
END $$;

-- ==================
-- FUNCTIONS
-- ==================

-- Get story analytics summary for a status
CREATE OR REPLACE FUNCTION public.get_story_analytics(p_status_id BIGINT)
RETURNS TABLE(
    total_views BIGINT,
    total_reactions BIGINT,
    total_replies BIGINT,
    forward_taps BIGINT,
    back_taps BIGINT,
    exits BIGINT,
    link_clicks BIGINT,
    sticker_taps BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    -- Only status owner can see analytics
    IF NOT EXISTS (SELECT 1 FROM public.statuses s WHERE s.id = p_status_id AND s.user_id = auth.uid()) THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        (SELECT COUNT(*)::BIGINT FROM public.status_views sv WHERE sv.status_id = p_status_id),
        (SELECT COUNT(*)::BIGINT FROM public.story_reactions sr WHERE sr.status_id = p_status_id),
        (SELECT COUNT(*)::BIGINT FROM public.story_replies srp WHERE srp.status_id = p_status_id),
        (SELECT COUNT(*)::BIGINT FROM public.story_analytics sa WHERE sa.status_id = p_status_id AND sa.action_type = 'forward_tap'),
        (SELECT COUNT(*)::BIGINT FROM public.story_analytics sa WHERE sa.status_id = p_status_id AND sa.action_type = 'back_tap'),
        (SELECT COUNT(*)::BIGINT FROM public.story_analytics sa WHERE sa.status_id = p_status_id AND sa.action_type = 'exit'),
        (SELECT COUNT(*)::BIGINT FROM public.story_analytics sa WHERE sa.status_id = p_status_id AND sa.action_type = 'link_click'),
        (SELECT COUNT(*)::BIGINT FROM public.story_analytics sa WHERE sa.status_id = p_status_id AND sa.action_type = 'sticker_tap');
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_story_analytics(BIGINT) TO authenticated;

-- Realtime
DO $$ BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.close_friends;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.story_highlights;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.story_highlight_items;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.story_stickers;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

NOTIFY pgrst, 'reload schema';
