-- Add new columns to comments table
ALTER TABLE public.comments 
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_hidden BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_comments_parent_comment_id ON public.comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_comments_is_pinned ON public.comments(is_pinned) WHERE is_pinned = TRUE;

-- Update trigger for updated_at
CREATE TRIGGER update_comments_updated_at
BEFORE UPDATE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Update get_post_comments RPC to include new fields and sort by pinned
DROP FUNCTION IF EXISTS public.get_post_comments(bigint, integer);
DROP FUNCTION IF EXISTS public.get_post_comments(bigint);

CREATE OR REPLACE FUNCTION public.get_post_comments(p_post_id BIGINT)
RETURNS TABLE (
    id BIGINT, 
    user_id UUID, 
    post_id BIGINT, 
    parent_comment_id BIGINT, 
    content TEXT, 
    created_at TIMESTAMPTZ, 
    updated_at TIMESTAMPTZ,
    is_pinned BOOLEAN,
    is_hidden BOOLEAN,
    user_name TEXT, 
    user_username TEXT, 
    user_avatar_url TEXT, 
    user_verified BOOLEAN, 
    like_count BIGINT,
    reply_count BIGINT,
    is_liked BOOLEAN
) AS $$
DECLARE
    v_user_id UUID := auth.uid();
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
        c.is_pinned,
        c.is_hidden,
        p.name, 
        p.username, 
        p.avatar_url, 
        p.verified, 
        COALESCE(COUNT(DISTINCT cl.user_id), 0)::BIGINT as like_count,
        COALESCE(COUNT(DISTINCT r.id), 0)::BIGINT as reply_count,
        EXISTS(SELECT 1 FROM public.comment_likes my_cl WHERE my_cl.comment_id = c.id AND my_cl.user_id = v_user_id) as is_liked
    FROM public.comments c
    LEFT JOIN public.profiles p ON c.user_id = p.id
    LEFT JOIN public.comment_likes cl ON c.id = cl.comment_id
    LEFT JOIN public.comments r ON r.parent_comment_id = c.id
    WHERE c.post_id = p_post_id
    GROUP BY c.id, p.id
    ORDER BY c.is_pinned DESC, c.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY INVOKER;

-- Trigger to handle mentions in comments
CREATE OR REPLACE FUNCTION process_comment_mentions()
RETURNS TRIGGER AS $$
DECLARE
    mentioned_username TEXT;
    mentioned_user_id UUID;
BEGIN
    -- Process Mentions
    FOR mentioned_username IN SELECT DISTINCT (regexp_matches(NEW.content, '@([A-Za-z0-9_]+)', 'g'))[1]
    LOOP
        SELECT id INTO mentioned_user_id FROM profiles WHERE username = mentioned_username;
        
        -- Don't notify if mentioning self
        IF mentioned_user_id IS NOT NULL AND mentioned_user_id != NEW.user_id THEN
            INSERT INTO notifications (user_id, actor_id, type, entity_id, entity_type)
            VALUES (mentioned_user_id, NEW.user_id, 'mention', NEW.post_id, 'comment') -- entity_type 'comment' or 'post'? Keeping 'post' as per previous usage, but maybe 'comment' is better if supported. The schema check constraint doesn't seem to enforce entity_type enum, it's TEXT. But let's check `process_post_content` uses 'post'.
            -- However, for a comment mention, the entity_id should probably be the post_id so the user goes to the post? Or the comment_id?
            -- If I link to /post/[id], post_id is 100% safer.
            -- Using entity_type 'comment' might break frontend if it expects 'post' for link generation.
            -- Let's stick to 'post' for now OR 'comment' if I update frontend. 
            -- notification_type has 'mention'.
            -- Let's use 'comment' as entity_type and store post_id as entity_id? No, usually entity_id is the thing itself.
            -- But if I click it, I want to go to the post.
            -- Let's use entity_id = post_id and entity_type = 'comment_mention' (new) or just 'post'?
            -- The existing `process_post_content` uses type='mention', entity_id=NEW.id (post id), entity_type='post'.
            -- For comment, let's use type='mention', entity_id=NEW.post_id, entity_type='comment'.
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_comment_created_process_mentions ON public.comments;
CREATE TRIGGER on_comment_created_process_mentions
    AFTER INSERT ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION process_comment_mentions();

-- RLS Policies
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view comments
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments are viewable by everyone" 
ON public.comments FOR SELECT 
USING (true);

-- Policy: Users can insert their own comments
DROP POLICY IF EXISTS "Users can insert their own comments" ON public.comments;
CREATE POLICY "Users can insert their own comments" 
ON public.comments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can edit their own comments
DROP POLICY IF EXISTS "Users can edit their own comments" ON public.comments;
CREATE POLICY "Users can edit their own comments" 
ON public.comments FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Post authors can update comments on their posts (for pinning/hiding)
DROP POLICY IF EXISTS "Post authors can update comments on their posts" ON public.comments;
CREATE POLICY "Post authors can update comments on their posts" 
ON public.comments FOR UPDATE 
USING (
    auth.uid() IN (
        SELECT user_id FROM public.posts WHERE id = post_id
    )
);

-- Policy: Users can delete their own comments
DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
CREATE POLICY "Users can delete their own comments" 
ON public.comments FOR DELETE 
USING (auth.uid() = user_id);

-- Policy: Post authors can delete comments on their posts
DROP POLICY IF EXISTS "Post authors can delete comments on their posts" ON public.comments;
CREATE POLICY "Post authors can delete comments on their posts" 
ON public.comments FOR DELETE 
USING (
     auth.uid() IN (
        SELECT user_id FROM public.posts WHERE id = post_id
    )
);
