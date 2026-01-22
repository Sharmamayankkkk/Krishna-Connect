-- Create post_collaborators table
CREATE TABLE IF NOT EXISTS post_collaborators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id BIGINT REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Enable RLS
ALTER TABLE post_collaborators ENABLE ROW LEVEL SECURITY;

-- Policies
-- 1. Authors can create invitations (insert)
CREATE POLICY "Authors can invite collaborators"
    ON post_collaborators
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM posts
            WHERE posts.id = post_collaborators.post_id
            AND posts.user_id = auth.uid()
        )
    );

-- 2. Invited users can view their invitations
--    Authors can view invitations they sent
CREATE POLICY "Users can view collaboration status"
    ON post_collaborators
    FOR SELECT
    USING (
        user_id = auth.uid() OR -- Invited user
        EXISTS ( -- Author of the post
            SELECT 1 FROM posts
            WHERE posts.id = post_collaborators.post_id
            AND posts.user_id = auth.uid()
        ) OR
        status = 'accepted' -- Public can see accepted collaborators (for feed display)
    );

-- 3. Invited users can update status (accept/decline)
CREATE POLICY "Invited users can update status"
    ON post_collaborators
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 4. Authors can remove collaborators (delete)
CREATE POLICY "Authors can remove collaborators"
    ON post_collaborators
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM posts
            WHERE posts.id = post_collaborators.post_id
            AND posts.user_id = auth.uid()
        )
    );

-- Add 'collaboration_request' to notification_type enum
ALTER TYPE public.notification_type ADD VALUE IF NOT EXISTS 'collaboration_request';
