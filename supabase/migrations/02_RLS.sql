-- ============================================================================
-- 02_RLS.sql
-- Description: Row Level Security policies.
-- ============================================================================

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.statuses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reposts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pinned_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_collaborators ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION: CORE & SOCIAL
-- ============================================================================

-- Profiles
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone" 
    ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." 
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile." 
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Relationships
CREATE POLICY "Users can manage their own relationships"
    ON public.relationships FOR ALL
    USING ( auth.uid() = user_one_id OR auth.uid() = user_two_id );

CREATE POLICY "Users can view all approved/blocked relationships"
    ON public.relationships FOR SELECT
    USING ( status IN ('approved', 'blocked') );

CREATE POLICY "Users can view their own pending requests"
    ON public.relationships FOR SELECT
    USING ( status = 'pending' AND (auth.uid() = user_one_id OR auth.uid() = user_two_id) );

-- Verification Requests
CREATE POLICY "Users can view own verification request"
    ON public.verification_requests FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own verification request"
    ON public.verification_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own request when action required"
    ON public.verification_requests FOR UPDATE
    USING (auth.uid() = user_id AND status = 'action_required')
    WITH CHECK (auth.uid() = user_id);

-- Reports
CREATE POLICY "Users can create reports" 
    ON public.reports FOR INSERT 
    WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports" 
    ON public.reports FOR SELECT 
    USING (auth.uid() = reporter_id);

-- Push Subscriptions
CREATE POLICY "Users can insert their own subscriptions"
    ON public.push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions"
    ON public.push_subscriptions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can read their own subscriptions"
    ON public.push_subscriptions FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- SECTION: CONTENT (Posts, Comments, Likes)
-- ============================================================================

-- Posts (Public Access Logic)
DROP POLICY IF EXISTS "Posts are viewable by everyone" ON public.posts;
DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON public.posts;

CREATE POLICY "Public posts are viewable by everyone" 
ON public.posts FOR SELECT 
USING (
  (SELECT is_private FROM public.profiles WHERE id = posts.user_id) = false
  OR 
  auth.uid() = user_id
);

CREATE POLICY "Users can create their own posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- Comments
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
CREATE POLICY "Comments are viewable by everyone" 
ON public.comments FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.posts 
        WHERE id = comments.post_id 
        AND (
            (SELECT is_private FROM public.profiles WHERE id = posts.user_id) = false
            OR auth.uid() = posts.user_id
        )
    )
);

CREATE POLICY "Users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- Likes & Reposts
CREATE POLICY "Likes are viewable by everyone" ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like/unlike posts" ON public.post_likes FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Comment likes are viewable by everyone" ON public.comment_likes FOR SELECT USING (true);
CREATE POLICY "Users can like/unlike comments" ON public.comment_likes FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Reposts are viewable by everyone" ON public.post_reposts FOR SELECT USING (true);
CREATE POLICY "Users can repost/unrepost posts" ON public.post_reposts FOR ALL USING (auth.uid() = user_id);

-- Saved Posts
CREATE POLICY "Users can manage saved posts" ON public.saved_posts FOR ALL USING (auth.uid() = user_id);

-- Post Collaborators
CREATE POLICY "Authors can invite collaborators"
    ON post_collaborators FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM posts WHERE posts.id = post_collaborators.post_id AND posts.user_id = auth.uid()));

CREATE POLICY "Users can view collaboration status"
    ON post_collaborators FOR SELECT
    USING (
        user_id = auth.uid() OR 
        EXISTS (SELECT 1 FROM posts WHERE posts.id = post_collaborators.post_id AND posts.user_id = auth.uid()) OR
        status = 'accepted'
    );

CREATE POLICY "Invited users can update status"
    ON post_collaborators FOR UPDATE
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authors can remove collaborators"
    ON post_collaborators FOR DELETE
    USING (EXISTS (SELECT 1 FROM posts WHERE posts.id = post_collaborators.post_id AND posts.user_id = auth.uid()));

-- ============================================================================
-- SECTION: MESSAGING
-- ============================================================================

-- Chats
CREATE POLICY "Authenticated users can create chats." 
    ON public.chats FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can view chats they participate in." 
    ON public.chats FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.participants WHERE chat_id = chats.id AND user_id = auth.uid()));

-- Participants
CREATE POLICY "Chat creators can add participants." 
    ON public.participants FOR INSERT 
    WITH CHECK ((SELECT created_by FROM public.chats WHERE id = chat_id) = auth.uid());

CREATE POLICY "Users can view participants of chats they are in." 
    ON public.participants FOR SELECT 
    USING (EXISTS (SELECT 1 FROM public.participants WHERE chat_id = participants.chat_id AND user_id = auth.uid()));

-- Messages
CREATE POLICY "Users can send messages in chats they participate in."
    ON public.messages FOR INSERT TO authenticated
    WITH CHECK ((user_id = auth.uid()) AND (chat_id IN (SELECT p.chat_id FROM public.participants p WHERE p.user_id = auth.uid())));

CREATE POLICY "Users can view messages in chats they participate in."
    ON public.messages FOR SELECT TO authenticated
    USING (chat_id IN (SELECT p.chat_id FROM public.participants p WHERE p.user_id = auth.uid()));

CREATE POLICY "Users can delete their own messages."
    ON public.messages FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can update their own messages."
    ON public.messages FOR UPDATE TO authenticated USING (true) WITH CHECK (user_id = auth.uid());

-- Pinned Chats
CREATE POLICY "Users can view their own pinned chats" ON public.pinned_chats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can pin their own chats" ON public.pinned_chats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unpin their own chats" ON public.pinned_chats FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- SECTION: EVENTS, STATUS, LISTS, NOTIFICATIONS
-- ============================================================================

-- Events
CREATE POLICY "Public can read all events." ON public.events FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create events" ON public.events FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Creator can manage their own event" ON public.events FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY "Verified users can create events." ON public.events FOR INSERT WITH CHECK ((SELECT verified FROM public.profiles WHERE id = auth.uid()) = true);
CREATE POLICY "Verified users or event creators can update events." ON public.events FOR UPDATE USING ((SELECT verified FROM public.profiles WHERE id = auth.uid()) = true OR creator_id = auth.uid());

-- RSVPs
CREATE POLICY "Public can read all RSVPs." ON public.event_rsvps FOR SELECT USING (true);
CREATE POLICY "Users can insert their own RSVP." ON public.event_rsvps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own RSVP." ON public.event_rsvps FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own RSVP." ON public.event_rsvps FOR DELETE USING (auth.uid() = user_id);

-- Statuses
CREATE POLICY "Users can view their own statuses" ON public.statuses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create their own statuses" ON public.statuses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own statuses" ON public.statuses FOR DELETE USING (auth.uid() = user_id);
CREATE POLICY "Users can view all non-expired statuses" ON public.statuses FOR SELECT USING (expires_at > NOW());

CREATE POLICY "Users can view their own views" ON public.status_views FOR SELECT USING (auth.uid() = viewer_id);
CREATE POLICY "Users can mark a status as viewed" ON public.status_views FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- Lists
CREATE POLICY "Users can view their own lists." ON public.lists FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "Users can create their own lists." ON public.lists FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Users can update their own lists." ON public.lists FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Users can delete their own lists." ON public.lists FOR DELETE USING (owner_id = auth.uid());

CREATE POLICY "Users can view members of lists they own." ON public.list_members FOR SELECT USING (EXISTS (SELECT 1 FROM public.lists WHERE lists.id = list_members.list_id AND lists.owner_id = auth.uid()));
CREATE POLICY "Users can add members to lists they own." ON public.list_members FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM public.lists WHERE lists.id = list_members.list_id AND lists.owner_id = auth.uid()));
CREATE POLICY "Users can remove members from lists they own." ON public.list_members FOR DELETE USING (EXISTS (SELECT 1 FROM public.lists WHERE lists.id = list_members.list_id AND lists.owner_id = auth.uid()));

-- Notifications
CREATE POLICY "Users can only see their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications (mark as read)" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- SECTION: STORAGE
-- ============================================================================

CREATE POLICY "Allow public read access to post media"
    ON storage.objects FOR SELECT USING ( bucket_id = 'post_media' );

CREATE POLICY "Allow authenticated users to upload post media"
    ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'post_media' AND auth.role() = 'authenticated' );

CREATE POLICY "Allow users to delete their own post media"
    ON storage.objects FOR DELETE USING ( bucket_id = 'post_media' AND auth.uid() = owner );

CREATE POLICY "Allow users to update their own post media"
    ON storage.objects FOR UPDATE USING ( bucket_id = 'post_media' AND auth.uid() = owner );
