-- ============================================================================
-- Final-Supabase / 02_rls.sql
-- Description: Row Level Security policies for every table.
--              Consolidated from supabase/migrations/02_RLS.sql, Calls/,
--              and all incremental patch files.
-- Run order  : 2nd (after 01_schema.sql)
-- ============================================================================

-- ============================================================================
-- SECTION 1: ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE public.profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.relationships          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_requests  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.privacy_settings       ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.posts                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_collaborators     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_reposts           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comment_likes          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmark_collections      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmark_collection_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_views             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.promotion_requests     ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.audio_rooms            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dm_requests            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chats                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.participants           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pinned_chats           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages               ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.events                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_rsvps            ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.statuses               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.status_views           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_reactions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_replies          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.close_friends          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_highlights       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_highlight_items  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_stickers         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.story_analytics        ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.lists                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.list_members           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications          ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.calls                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_signals           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.call_participants      ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.livestream_chat        ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.leela_videos           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leela_likes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leela_comments         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leela_views            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leela_bookmarks        ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.challenges             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_submissions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_reactions    ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SECTION 2: CORE & SOCIAL
-- ============================================================================

-- ── Profiles ────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
CREATE POLICY "Public profiles are viewable by everyone"
    ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile."
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile."
    ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- ── Relationships ────────────────────────────────────────────────────────────
CREATE POLICY "Users can manage their own relationships"
    ON public.relationships FOR ALL
    USING (auth.uid() = user_one_id OR auth.uid() = user_two_id);

CREATE POLICY "Users can view all approved/blocked relationships"
    ON public.relationships FOR SELECT
    USING (status IN ('approved', 'blocked'));

CREATE POLICY "Users can view their own pending requests"
    ON public.relationships FOR SELECT
    USING (status = 'pending' AND (auth.uid() = user_one_id OR auth.uid() = user_two_id));

-- ── Verification Requests ────────────────────────────────────────────────────
CREATE POLICY "Users can view own verification request"
    ON public.verification_requests FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own verification request"
    ON public.verification_requests FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own request when action required"
    ON public.verification_requests FOR UPDATE
    USING (auth.uid() = user_id AND status = 'action_required')
    WITH CHECK (auth.uid() = user_id);

-- Admin policies for verification requests (from 20260211_admin_policy_verification_requests.sql)
CREATE POLICY "Admins can view all verification requests"
    ON public.verification_requests FOR SELECT
    USING ((SELECT verified FROM public.profiles WHERE id = auth.uid()) = 'kcs');

CREATE POLICY "Admins can update any verification request"
    ON public.verification_requests FOR UPDATE
    USING ((SELECT verified FROM public.profiles WHERE id = auth.uid()) = 'kcs');

-- ── Reports ──────────────────────────────────────────────────────────────────
CREATE POLICY "Users can create reports"
    ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own reports"
    ON public.reports FOR SELECT USING (auth.uid() = reporter_id);

-- ── Push Subscriptions ───────────────────────────────────────────────────────
CREATE POLICY "Users can insert their own subscriptions"
    ON public.push_subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own subscriptions"
    ON public.push_subscriptions FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can read their own subscriptions"
    ON public.push_subscriptions FOR SELECT USING (auth.uid() = user_id);

-- ── Privacy Settings ─────────────────────────────────────────────────────────
CREATE POLICY "Users can view their own privacy settings"
    ON public.privacy_settings FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own privacy settings"
    ON public.privacy_settings FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own privacy settings"
    ON public.privacy_settings FOR UPDATE USING (auth.uid() = user_id);

-- ============================================================================
-- SECTION 3: CONTENT
-- ============================================================================

-- ── Posts ────────────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Posts are viewable by everyone"        ON public.posts;
DROP POLICY IF EXISTS "Public posts are viewable by everyone" ON public.posts;

CREATE POLICY "Public posts are viewable by everyone"
    ON public.posts FOR SELECT
    USING (
        (SELECT is_private FROM public.profiles WHERE id = posts.user_id) = false
        OR auth.uid() = user_id
    );

CREATE POLICY "Users can create their own posts"
    ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own posts"
    ON public.posts FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own posts"
    ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- ── Post Collaborators ───────────────────────────────────────────────────────
CREATE POLICY "Authors can invite collaborators"
    ON public.post_collaborators FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.posts WHERE posts.id = post_collaborators.post_id
        AND posts.user_id = auth.uid()
    ));

CREATE POLICY "Users can view collaboration status"
    ON public.post_collaborators FOR SELECT
    USING (
        user_id = auth.uid() OR
        EXISTS (SELECT 1 FROM public.posts WHERE posts.id = post_collaborators.post_id AND posts.user_id = auth.uid()) OR
        status = 'accepted'
    );

CREATE POLICY "Invited users can update status"
    ON public.post_collaborators FOR UPDATE
    USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Authors can remove collaborators"
    ON public.post_collaborators FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.posts WHERE posts.id = post_collaborators.post_id
        AND posts.user_id = auth.uid()
    ));

-- ── Comments ─────────────────────────────────────────────────────────────────
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

CREATE POLICY "Users can create comments"
    ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own comments"
    ON public.comments FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
    ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- ── Likes & Reposts ──────────────────────────────────────────────────────────
CREATE POLICY "Likes are viewable by everyone"           ON public.post_likes FOR SELECT USING (true);
CREATE POLICY "Users can like/unlike posts"              ON public.post_likes FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Comment likes are viewable by everyone"   ON public.comment_likes FOR SELECT USING (true);
CREATE POLICY "Users can like/unlike comments"           ON public.comment_likes FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Reposts are viewable by everyone"         ON public.post_reposts FOR SELECT USING (true);
CREATE POLICY "Users can repost/unrepost posts"          ON public.post_reposts FOR ALL USING (auth.uid() = user_id);

-- ── Bookmarks ────────────────────────────────────────────────────────────────
CREATE POLICY "Users can manage bookmarks" ON public.bookmarks FOR ALL USING (auth.uid() = user_id);

-- ── Bookmark Collections ─────────────────────────────────────────────────────
CREATE POLICY "Users can view their own collections"
    ON public.bookmark_collections FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own collections"
    ON public.bookmark_collections FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
    ON public.bookmark_collections FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
    ON public.bookmark_collections FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view items in their collections"
    ON public.bookmark_collection_items FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.bookmark_collections c
        WHERE c.id = bookmark_collection_items.collection_id AND c.user_id = auth.uid()
    ));

CREATE POLICY "Users can add items to their collections"
    ON public.bookmark_collection_items FOR INSERT
    WITH CHECK (EXISTS (
        SELECT 1 FROM public.bookmark_collections c
        WHERE c.id = bookmark_collection_items.collection_id AND c.user_id = auth.uid()
    ));

CREATE POLICY "Users can remove items from their collections"
    ON public.bookmark_collection_items FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.bookmark_collections c
        WHERE c.id = bookmark_collection_items.collection_id AND c.user_id = auth.uid()
    ));

-- ── Post Views & Promotions ──────────────────────────────────────────────────
CREATE POLICY "Anyone can insert post views"
    ON public.post_views FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view post analytics for their own posts"
    ON public.post_views FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.posts p WHERE p.id = post_views.post_id AND p.user_id = auth.uid()
    ));

CREATE POLICY "Users can manage their own promotion requests"
    ON public.promotion_requests FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- SECTION 4: MESSAGING
-- ============================================================================

-- ── Chats ────────────────────────────────────────────────────────────────────
CREATE POLICY "Authenticated users can create chats."
    ON public.chats FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Users can view chats they participate in."
    ON public.chats FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.participants WHERE chat_id = chats.id AND user_id = auth.uid()
    ));

-- ── Participants ─────────────────────────────────────────────────────────────
CREATE POLICY "Chat creators can add participants."
    ON public.participants FOR INSERT
    WITH CHECK ((SELECT created_by FROM public.chats WHERE id = chat_id) = auth.uid());

CREATE POLICY "Users can view participants of chats they are in."
    ON public.participants FOR SELECT
    USING (EXISTS (
        SELECT 1 FROM public.participants p2 WHERE p2.chat_id = participants.chat_id AND p2.user_id = auth.uid()
    ));

-- ── Messages ─────────────────────────────────────────────────────────────────
CREATE POLICY "Users can send messages in chats they participate in."
    ON public.messages FOR INSERT TO authenticated
    WITH CHECK (
        (user_id = auth.uid()) AND
        (chat_id IN (SELECT p.chat_id FROM public.participants p WHERE p.user_id = auth.uid()))
    );

CREATE POLICY "Users can view messages in chats they participate in."
    ON public.messages FOR SELECT TO authenticated
    USING (chat_id IN (SELECT p.chat_id FROM public.participants p WHERE p.user_id = auth.uid()));

CREATE POLICY "Users can delete their own messages."
    ON public.messages FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can update their own messages."
    ON public.messages FOR UPDATE TO authenticated USING (true) WITH CHECK (user_id = auth.uid());

-- ── Pinned Chats ─────────────────────────────────────────────────────────────
CREATE POLICY "Users can view their own pinned chats"  ON public.pinned_chats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can pin their own chats"          ON public.pinned_chats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unpin their own chats"        ON public.pinned_chats FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- SECTION 5: EVENTS & STATUS
-- ============================================================================

-- ── Events ───────────────────────────────────────────────────────────────────
CREATE POLICY "Public can read all events."
    ON public.events FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create events"
    ON public.events FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Creator can manage their own event"
    ON public.events FOR ALL USING (auth.uid() = creator_id);

-- NOTE: These policies were updated in 20260211_modify_verified_column.sql
-- to use TEXT verified instead of BOOLEAN
CREATE POLICY "Verified users can create events."
    ON public.events FOR INSERT
    WITH CHECK ((SELECT verified FROM public.profiles WHERE id = auth.uid()) IN ('verified', 'kcs'));

CREATE POLICY "Verified users or event creators can update events."
    ON public.events FOR UPDATE
    USING ((SELECT verified FROM public.profiles WHERE id = auth.uid()) IN ('verified', 'kcs') OR creator_id = auth.uid());

CREATE POLICY "Verified users or event creators can delete events."
    ON public.events FOR DELETE
    USING ((SELECT verified FROM public.profiles WHERE id = auth.uid()) IN ('verified', 'kcs') OR creator_id = auth.uid());

-- ── RSVPs ────────────────────────────────────────────────────────────────────
CREATE POLICY "Public can read all RSVPs."       ON public.event_rsvps FOR SELECT USING (true);
CREATE POLICY "Users can insert their own RSVP." ON public.event_rsvps FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own RSVP." ON public.event_rsvps FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete their own RSVP." ON public.event_rsvps FOR DELETE USING (auth.uid() = user_id);

-- ── Statuses / Stories ───────────────────────────────────────────────────────
CREATE POLICY "Users can view their own statuses"      ON public.statuses FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can view all non-expired statuses" ON public.statuses FOR SELECT USING (expires_at > NOW());
CREATE POLICY "Users can create their own statuses"    ON public.statuses FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own statuses"    ON public.statuses FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own views"      ON public.status_views FOR SELECT USING (auth.uid() = viewer_id);
CREATE POLICY "Users can mark a status as viewed"   ON public.status_views FOR INSERT WITH CHECK (auth.uid() = viewer_id);

-- ── Story Reactions ──────────────────────────────────────────────────────────
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

-- ── Story Replies ─────────────────────────────────────────────────────────────
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'story_replies_select') THEN
        CREATE POLICY story_replies_select ON public.story_replies FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'story_replies_insert') THEN
        CREATE POLICY story_replies_insert ON public.story_replies FOR INSERT WITH CHECK (auth.uid() = sender_id);
    END IF;
END $$;

-- ── Close Friends ─────────────────────────────────────────────────────────────
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

-- ── Story Highlights ─────────────────────────────────────────────────────────
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

-- ── Story Stickers ────────────────────────────────────────────────────────────
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

-- ── Story Analytics ───────────────────────────────────────────────────────────
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

-- ============================================================================
-- SECTION 6: LISTS & NOTIFICATIONS
-- ============================================================================

-- ── Lists ────────────────────────────────────────────────────────────────────
CREATE POLICY "Users can view their own lists."    ON public.lists FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "Users can create their own lists."  ON public.lists FOR INSERT WITH CHECK (owner_id = auth.uid());
CREATE POLICY "Users can update their own lists."  ON public.lists FOR UPDATE USING (owner_id = auth.uid());
CREATE POLICY "Users can delete their own lists."  ON public.lists FOR DELETE USING (owner_id = auth.uid());

CREATE POLICY "Users can view members of lists they own."
    ON public.list_members FOR SELECT
    USING (EXISTS (SELECT 1 FROM public.lists WHERE lists.id = list_members.list_id AND lists.owner_id = auth.uid()));

CREATE POLICY "Users can add members to lists they own."
    ON public.list_members FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM public.lists WHERE lists.id = list_members.list_id AND lists.owner_id = auth.uid()));

CREATE POLICY "Users can remove members from lists they own."
    ON public.list_members FOR DELETE
    USING (EXISTS (SELECT 1 FROM public.lists WHERE lists.id = list_members.list_id AND lists.owner_id = auth.uid()));

-- ── Notifications ─────────────────────────────────────────────────────────────
CREATE POLICY "Users can only see their own notifications"
    ON public.notifications FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications (mark as read)"
    ON public.notifications FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own notifications"
    ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- ============================================================================
-- SECTION 7: CALLS
-- ============================================================================

-- ── Calls Table ───────────────────────────────────────────────────────────────
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own calls' AND tablename = 'calls') THEN
        CREATE POLICY "Users can view their own calls"
            ON public.calls FOR SELECT
            USING (auth.uid() = caller_id OR auth.uid() = callee_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create calls as caller' AND tablename = 'calls') THEN
        CREATE POLICY "Users can create calls as caller"
            ON public.calls FOR INSERT
            WITH CHECK (auth.uid() = caller_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update their own calls' AND tablename = 'calls') THEN
        CREATE POLICY "Users can update their own calls"
            ON public.calls FOR UPDATE
            USING (auth.uid() = caller_id OR auth.uid() = callee_id);
    END IF;
END $$;

-- ── Call Signals ─────────────────────────────────────────────────────────────
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view their own signals' AND tablename = 'call_signals') THEN
        CREATE POLICY "Users can view their own signals"
            ON public.call_signals FOR SELECT
            USING (auth.uid() = sender_id OR auth.uid() = receiver_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can send signals' AND tablename = 'call_signals') THEN
        CREATE POLICY "Users can send signals"
            ON public.call_signals FOR INSERT
            WITH CHECK (auth.uid() = sender_id);
    END IF;
END $$;

-- ── Call Participants ─────────────────────────────────────────────────────────
CREATE POLICY "Participants can view other participants in the same call"
    ON public.call_participants FOR SELECT
    USING (
        EXISTS (SELECT 1 FROM public.call_participants cp WHERE cp.call_id = call_id AND cp.user_id = auth.uid())
        OR
        EXISTS (SELECT 1 FROM public.calls c WHERE c.id = call_id AND (c.caller_id = auth.uid() OR c.callee_id = auth.uid()))
    );

CREATE POLICY "Users can insert themselves as participants"
    ON public.call_participants FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own participant status"
    ON public.call_participants FOR UPDATE USING (user_id = auth.uid());

-- ============================================================================
-- SECTION 8: LIVESTREAM
-- ============================================================================

CREATE POLICY "Anyone can read livestream chat"
    ON public.livestream_chat FOR SELECT USING (true);

CREATE POLICY "Authenticated users can send chat messages"
    ON public.livestream_chat FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own messages"
    ON public.livestream_chat FOR DELETE USING (auth.uid() = user_id);

-- ── Audio Rooms ─────────────────────────────────────────────────────────────
CREATE POLICY "Anyone can view active audio rooms"
    ON public.audio_rooms FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create audio rooms"
    ON public.audio_rooms FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Creators can update their audio rooms"
    ON public.audio_rooms FOR UPDATE USING (auth.uid() = creator_id);
CREATE POLICY "Creators can delete their audio rooms"
    ON public.audio_rooms FOR DELETE USING (auth.uid() = creator_id);

-- ── Blocked Users ───────────────────────────────────────────────────────────
CREATE POLICY "Users can view their own blocked list"
    ON public.blocked_users FOR SELECT USING (auth.uid() = blocker_id);
CREATE POLICY "Users can block others"
    ON public.blocked_users FOR INSERT WITH CHECK (auth.uid() = blocker_id);
CREATE POLICY "Users can unblock others"
    ON public.blocked_users FOR DELETE USING (auth.uid() = blocker_id);

-- ── DM Requests ─────────────────────────────────────────────────────────────
CREATE POLICY "Users can view DM requests sent or received"
    ON public.dm_requests FOR SELECT
    USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);
CREATE POLICY "Users can send DM requests"
    ON public.dm_requests FOR INSERT WITH CHECK (auth.uid() = from_user_id);
CREATE POLICY "Recipients can update DM request status"
    ON public.dm_requests FOR UPDATE USING (auth.uid() = to_user_id);

CREATE POLICY "Hosts can delete messages in their streams"
    ON public.livestream_chat FOR DELETE
    USING (EXISTS (
        SELECT 1 FROM public.livestreams
        WHERE livestreams.id = livestream_chat.livestream_id
        AND livestreams.host_id = auth.uid()
    ));

-- ============================================================================
-- SECTION 9: LEELA
-- ============================================================================

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

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'leela_bookmarks_select' AND tablename = 'leela_bookmarks') THEN
        CREATE POLICY leela_bookmarks_select ON public.leela_bookmarks FOR SELECT USING (user_id = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'leela_bookmarks_insert' AND tablename = 'leela_bookmarks') THEN
        CREATE POLICY leela_bookmarks_insert ON public.leela_bookmarks FOR INSERT WITH CHECK (user_id = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'leela_bookmarks_delete' AND tablename = 'leela_bookmarks') THEN
        CREATE POLICY leela_bookmarks_delete ON public.leela_bookmarks FOR DELETE USING (user_id = auth.uid());
    END IF;
END $$;

-- ============================================================================
-- SECTION 10: CHALLENGES
-- ============================================================================

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'challenges_select' AND tablename = 'challenges') THEN
        CREATE POLICY challenges_select ON public.challenges FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'challenges_insert' AND tablename = 'challenges') THEN
        CREATE POLICY challenges_insert ON public.challenges FOR INSERT WITH CHECK (created_by = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'challenges_update' AND tablename = 'challenges') THEN
        CREATE POLICY challenges_update ON public.challenges FOR UPDATE USING (created_by = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'challenges_delete' AND tablename = 'challenges') THEN
        CREATE POLICY challenges_delete ON public.challenges FOR DELETE USING (created_by = auth.uid());
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'challenge_participants_select' AND tablename = 'challenge_participants') THEN
        CREATE POLICY challenge_participants_select ON public.challenge_participants FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'challenge_participants_insert' AND tablename = 'challenge_participants') THEN
        CREATE POLICY challenge_participants_insert ON public.challenge_participants FOR INSERT WITH CHECK (user_id = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'challenge_participants_delete' AND tablename = 'challenge_participants') THEN
        CREATE POLICY challenge_participants_delete ON public.challenge_participants FOR DELETE USING (user_id = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'challenge_participants_update' AND tablename = 'challenge_participants') THEN
        CREATE POLICY challenge_participants_update ON public.challenge_participants FOR UPDATE USING (user_id = auth.uid());
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'challenge_submissions_select' AND tablename = 'challenge_submissions') THEN
        CREATE POLICY challenge_submissions_select ON public.challenge_submissions FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'challenge_submissions_insert' AND tablename = 'challenge_submissions') THEN
        CREATE POLICY challenge_submissions_insert ON public.challenge_submissions FOR INSERT WITH CHECK (user_id = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'challenge_submissions_update' AND tablename = 'challenge_submissions') THEN
        CREATE POLICY challenge_submissions_update ON public.challenge_submissions FOR UPDATE USING (
            user_id = auth.uid() OR
            EXISTS (SELECT 1 FROM public.challenges c WHERE c.id = challenge_id AND c.created_by = auth.uid())
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'challenge_reactions_select' AND tablename = 'challenge_reactions') THEN
        CREATE POLICY challenge_reactions_select ON public.challenge_reactions FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'challenge_reactions_insert' AND tablename = 'challenge_reactions') THEN
        CREATE POLICY challenge_reactions_insert ON public.challenge_reactions FOR INSERT WITH CHECK (user_id = auth.uid());
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'challenge_reactions_delete' AND tablename = 'challenge_reactions') THEN
        CREATE POLICY challenge_reactions_delete ON public.challenge_reactions FOR DELETE USING (user_id = auth.uid());
    END IF;
END $$;

-- ============================================================================
-- SECTION 11: STORAGE BUCKET POLICIES
-- ============================================================================

CREATE POLICY "Allow public read access to post media"
    ON storage.objects FOR SELECT USING (bucket_id = 'post_media');

CREATE POLICY "Allow authenticated users to upload post media"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'post_media' AND auth.role() = 'authenticated');

CREATE POLICY "Allow users to delete their own post media"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'post_media' AND auth.uid() = owner);

CREATE POLICY "Allow users to update their own post media"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'post_media' AND auth.uid() = owner);
