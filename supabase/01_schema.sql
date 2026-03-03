-- ============================================================================
-- Final-Supabase / 01_schema.sql
-- Description: Complete, consolidated schema for Krishna Connect.
--              Represents the FINAL state of all tables, types, and indexes
--              after applying all migrations from supabase/migrations/ and
--              supabase/Calls/ in order.
-- Run order  : 1st (before rls, functions, features)
-- ============================================================================

-- ============================================================================
-- SECTION 0: EXTENSIONS
-- ============================================================================
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- SECTION 1: ENUMS
-- ============================================================================

-- Core social enums
CREATE TYPE public.rsvp_status AS ENUM ('going', 'interested', 'not_going');

CREATE TYPE public.relationship_status AS ENUM (
    'pending',
    'approved',
    'blocked'
);

-- Notification types (consolidated final list)
CREATE TYPE public.notification_type AS ENUM (
    'follow_request',
    'new_follower',
    'new_like',
    'new_comment',
    'new_repost',
    'collaboration_request',
    'mention',
    'call_missed',
    'call_incoming'
);

-- Calls enums
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'call_type') THEN
        CREATE TYPE public.call_type AS ENUM ('voice', 'video');
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'call_status') THEN
        CREATE TYPE public.call_status AS ENUM (
            'ringing',
            'busy',
            'answered',
            'ended',
            'missed',
            'declined',
            'failed'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'call_signal_type') THEN
        CREATE TYPE public.call_signal_type AS ENUM (
            'offer',
            'answer',
            'ice-candidate',
            'renegotiate',
            'hangup',
            'busy',
            'decline'
        );
    END IF;
END $$;

-- ============================================================================
-- SECTION 2: CORE TABLES
-- ============================================================================

-- ── Profiles ────────────────────────────────────────────────────────────────
-- NOTE: verified column is TEXT ('none' | 'verified' | 'kcs') — evolved from
--       BOOLEAN in early migrations via 20260211_modify_verified_column.sql
CREATE TABLE IF NOT EXISTS public.profiles (
    id              UUID    NOT NULL PRIMARY KEY REFERENCES auth.users(id),
    name            TEXT,
    username        TEXT    UNIQUE,
    avatar_url      TEXT,
    gender          TEXT,
    bio             TEXT,
    -- TEXT verified with enum-like constraint (none/verified/kcs)
    verified        TEXT    NOT NULL DEFAULT 'none'
                            CHECK (verified IN ('none', 'verified', 'kcs')),
    is_private      BOOLEAN NOT NULL DEFAULT FALSE,

    -- Extended profile fields
    banner_url      TEXT,
    location        TEXT,
    website         TEXT,
    phone           TEXT    UNIQUE,              -- added 20260219
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    has_set_privacy BOOLEAN DEFAULT FALSE,

    -- User settings (added 20260124)
    settings        JSONB   DEFAULT '{}'::jsonb
);

COMMENT ON COLUMN public.profiles.verified IS
    'Verification status: none | verified | kcs';

-- ── Relationships (Follows / Blocks) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.relationships (
    id           BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
    user_one_id  UUID   NOT NULL REFERENCES public.profiles(id),
    user_two_id  UUID   NOT NULL REFERENCES public.profiles(id),
    status       public.relationship_status NOT NULL,
    created_at   TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_relationship  UNIQUE (user_one_id, user_two_id),
    CONSTRAINT check_not_self_relationship CHECK (user_one_id <> user_two_id)
);

-- ── Reports ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.reports (
    id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id    UUID REFERENCES public.profiles(id) NOT NULL DEFAULT auth.uid(),
    target_user_id UUID REFERENCES public.profiles(id) NOT NULL,
    reason         TEXT NOT NULL,
    description    TEXT,
    status         TEXT DEFAULT 'pending'
                   CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ── Verification Requests ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.verification_requests (
    id                   BIGSERIAL PRIMARY KEY,
    user_id              UUID NOT NULL REFERENCES public.profiles(id),
    plan_type            TEXT NOT NULL CHECK (plan_type IN ('monthly', 'yearly')),
    has_social_discount  BOOLEAN DEFAULT FALSE,
    social_links         JSONB DEFAULT '{}'::jsonb,
    meeting_details      JSONB DEFAULT NULL,
    status               TEXT NOT NULL DEFAULT 'submitted'
                         CHECK (status IN ('submitted', 'reviewing', 'action_required',
                                           'meet_scheduled', 'verified', 'rejected')),
    admin_notes          TEXT,
    expires_at           TIMESTAMPTZ,           -- added 20260211
    created_at           TIMESTAMPTZ DEFAULT NOW(),
    updated_at           TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_verification UNIQUE (user_id)
);

-- ── Push Subscriptions ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id    UUID REFERENCES public.profiles(id),
    endpoint   TEXT NOT NULL UNIQUE,
    p256dh     TEXT NOT NULL,
    auth       TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ── Privacy Protocols ───────────────────────────────────────────────────────
-- (from 20260124_privacy_protocols.sql)
CREATE TABLE IF NOT EXISTS public.privacy_settings (
    user_id             UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    who_can_message     TEXT DEFAULT 'everyone' CHECK (who_can_message IN ('everyone', 'followers', 'nobody')),
    who_can_see_posts   TEXT DEFAULT 'everyone' CHECK (who_can_see_posts IN ('everyone', 'followers', 'nobody')),
    who_can_see_stories TEXT DEFAULT 'everyone' CHECK (who_can_see_stories IN ('everyone', 'followers', 'close_friends')),
    show_activity       BOOLEAN DEFAULT TRUE,
    show_online_status  BOOLEAN DEFAULT TRUE,
    allow_tagging       BOOLEAN DEFAULT TRUE,
    updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ── Audio Rooms (Stream.io Audio Spaces) ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.audio_rooms (
    id               UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    room_call_id     TEXT NOT NULL UNIQUE,
    creator_id       UUID NOT NULL REFERENCES public.profiles(id),
    title            TEXT NOT NULL,
    topic            TEXT,
    status           TEXT NOT NULL DEFAULT 'active'
                     CHECK (status IN ('active', 'ended')),
    participant_count INTEGER DEFAULT 0,
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    ended_at         TIMESTAMPTZ,
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── Blocked Users (dedicated table) ──────────────────────────────────────────
-- NOTE: the relationships table also tracks 'blocked' status for follow-graph
-- purposes. This table is a fast lookup used by the block system.
CREATE TABLE IF NOT EXISTS public.blocked_users (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    blocker_id UUID NOT NULL REFERENCES public.profiles(id),
    blocked_id UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW()),
    UNIQUE(blocker_id, blocked_id)
);

-- ============================================================================
-- SECTION 3: CONTENT & SOCIAL FEED
-- ============================================================================

-- ── Posts ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.posts (
    id             BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
    user_id        UUID NOT NULL REFERENCES public.profiles(id),
    content        TEXT,
    media_urls     JSONB,          -- [{url:"...", type:"image"}]
    poll           JSONB,          -- {question:"...", options:[...], totalVotes:int}
    quote_of_id    BIGINT REFERENCES public.posts(id),
    is_promoted    BOOLEAN DEFAULT FALSE,           -- promotions (20260208)
    promoted_until TIMESTAMPTZ,                    -- promotions (20260208)
    views_count    INT DEFAULT 0,                  -- analytics  (20260208)
    -- NOTE: is_pinned is NOT a separate column in the live DB.
    -- Pinned state is determined by pinned_at IS NOT NULL.
    pinned_at      TIMESTAMPTZ,                    -- pinned posts
    created_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- NOTE: posts also have a virtual `media` JSONB alias used in RPCs.
-- The actual column is media_urls; RPCs alias it as media.

-- ── Hashtags ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.hashtags (
    id           BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
    tag          TEXT NOT NULL UNIQUE,
    usage_count  INT DEFAULT 1,
    last_used_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.post_hashtags (
    post_id    BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    hashtag_id BIGINT NOT NULL REFERENCES public.hashtags(id) ON DELETE CASCADE,
    PRIMARY KEY (post_id, hashtag_id)
);

-- ── Post Collaborators ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.post_collaborators (
    id       UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id  BIGINT REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id  UUID   REFERENCES public.profiles(id) ON DELETE CASCADE,
    status   TEXT NOT NULL DEFAULT 'pending'
             CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- ── Comments ─────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.comments (
    id                BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
    user_id           UUID   NOT NULL REFERENCES public.profiles(id),
    post_id           BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    parent_comment_id BIGINT REFERENCES public.comments(id) ON DELETE CASCADE,  -- replies
    content           TEXT   NOT NULL,
    is_pinned         BOOLEAN DEFAULT FALSE,     -- pinned comment (20260213)
    is_hidden         BOOLEAN DEFAULT FALSE,     -- hidden comment (20260213)
    created_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at        TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Auto-update updated_at only when comment content is edited
-- (pin/hide/other metadata changes must NOT advance updated_at)
CREATE OR REPLACE FUNCTION public.set_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.content IS DISTINCT FROM OLD.content THEN
        NEW.updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS comments_set_updated_at ON public.comments;
CREATE TRIGGER comments_set_updated_at
    BEFORE UPDATE ON public.comments
    FOR EACH ROW EXECUTE FUNCTION public.set_comments_updated_at();

-- ── Likes & Reposts ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.post_likes (
    user_id    UUID   NOT NULL REFERENCES public.profiles(id),
    post_id    BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (user_id, post_id)
);

CREATE TABLE IF NOT EXISTS public.post_reposts (
    user_id    UUID   NOT NULL REFERENCES public.profiles(id),
    post_id    BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (user_id, post_id)
);

CREATE TABLE IF NOT EXISTS public.comment_likes (
    user_id    UUID   NOT NULL REFERENCES public.profiles(id),
    comment_id BIGINT NOT NULL REFERENCES public.comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (user_id, comment_id)
);

-- ── Bookmarks (saved posts) ──────────────────────────────────────────────────
-- Live table name is 'bookmarks' (not saved_posts)
CREATE TABLE IF NOT EXISTS public.bookmarks (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    UUID   NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id    BIGINT NOT NULL REFERENCES public.posts(id)    ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bookmark Collections (20260213)
CREATE TABLE IF NOT EXISTS public.bookmark_collections (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    UUID   NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name       TEXT   NOT NULL,
    is_private BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.bookmark_collection_items (
    collection_id BIGINT NOT NULL REFERENCES public.bookmark_collections(id) ON DELETE CASCADE,
    post_id       BIGINT NOT NULL REFERENCES public.posts(id)                ON DELETE CASCADE,
    added_at      TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (collection_id, post_id)
);

-- ── Post Analytics ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.post_views (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    post_id    BIGINT REFERENCES public.posts(id)    NOT NULL ON DELETE CASCADE,
    user_id    UUID   REFERENCES public.profiles(id),  -- nullable for anon
    viewed_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.promotion_requests (
    id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id        UUID   REFERENCES public.profiles(id) NOT NULL,
    post_id        BIGINT REFERENCES public.posts(id)    NOT NULL,
    status         TEXT DEFAULT 'pending'
                   CHECK (status IN ('pending', 'approved', 'rejected', 'payment_pending')),
    admin_notes    TEXT,
    credits_used   INTEGER DEFAULT 0,
    duration_hours INTEGER DEFAULT 24,
    amount         NUMERIC DEFAULT 0.00,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 4: MESSAGING
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.chats (
    id              BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
    created_at      TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    type            TEXT NOT NULL,       -- 'dm' or 'group'
    name            TEXT,
    avatar_url      TEXT,
    description     TEXT,
    created_by      UUID REFERENCES public.profiles(id) DEFAULT auth.uid(),
    is_public       BOOLEAN DEFAULT TRUE,
    history_visible BOOLEAN DEFAULT TRUE,
    invite_code     UUID DEFAULT gen_random_uuid()
);

CREATE TABLE IF NOT EXISTS public.participants (
    id       BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
    chat_id  BIGINT REFERENCES public.chats(id)    NOT NULL ON DELETE CASCADE,
    user_id  UUID   REFERENCES public.profiles(id) NOT NULL ON DELETE CASCADE,
    is_admin BOOLEAN DEFAULT FALSE,
    UNIQUE(chat_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.pinned_chats (
    id        BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
    user_id   UUID   REFERENCES public.profiles(id) NOT NULL ON DELETE CASCADE,
    chat_id   BIGINT REFERENCES public.chats(id)    NOT NULL ON DELETE CASCADE,
    pinned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, chat_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
    id                   BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
    created_at           TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    chat_id              BIGINT REFERENCES public.chats(id)    NOT NULL ON DELETE CASCADE,
    user_id              UUID   REFERENCES public.profiles(id) NOT NULL ON DELETE CASCADE,
    content              TEXT,
    is_edited            BOOLEAN DEFAULT FALSE,
    attachment_url       TEXT,
    attachment_metadata  JSONB,
    reactions            JSONB,
    read_by              UUID[] DEFAULT ARRAY[]::UUID[],
    deleted_for          UUID[],
    is_pinned            BOOLEAN DEFAULT FALSE,
    reply_to_message_id  BIGINT REFERENCES public.messages(id),
    is_starred           BOOLEAN NOT NULL DEFAULT FALSE
);

-- ── DM Requests ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.dm_requests (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    from_user_id UUID NOT NULL REFERENCES public.profiles(id),
    to_user_id   UUID NOT NULL REFERENCES public.profiles(id),
    status       TEXT NOT NULL DEFAULT 'pending'
                 CHECK (status IN ('pending', 'approved', 'rejected')),
    reason       TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

-- ============================================================================
-- SECTION 5: EVENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.events (
    id          BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    creator_id  UUID        NOT NULL REFERENCES public.profiles(id),
    title       TEXT        NOT NULL,
    description TEXT,
    thumbnail   TEXT,
    date_time   TIMESTAMPTZ NOT NULL,
    meet_link   TEXT,
    is_deleted  BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.event_rsvps (
    event_id   BIGINT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id    UUID   NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status     public.rsvp_status NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (event_id, user_id)
);

-- ============================================================================
-- SECTION 6: STATUSES / STORIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.statuses (
    id          BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
    user_id     UUID   NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    media_url   TEXT   NOT NULL,
    media_type  TEXT   NOT NULL DEFAULT 'image',
    caption     TEXT,
    visibility  TEXT   DEFAULT 'public',   -- 'public', 'close_friends'
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + '1 day'::interval)
);

CREATE TABLE IF NOT EXISTS public.status_views (
    status_id  BIGINT NOT NULL REFERENCES public.statuses(id) ON DELETE CASCADE,
    viewer_id  UUID   NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    viewed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (status_id, viewer_id)
);

-- Story Reactions (emoji likes on stories)
CREATE TABLE IF NOT EXISTS public.story_reactions (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    status_id  BIGINT NOT NULL REFERENCES public.statuses(id) ON DELETE CASCADE,
    user_id    UUID   NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    emoji      TEXT   NOT NULL DEFAULT '❤️',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(status_id, user_id)
);

-- Story Replies
CREATE TABLE IF NOT EXISTS public.story_replies (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    status_id   BIGINT NOT NULL REFERENCES public.statuses(id) ON DELETE CASCADE,
    sender_id   UUID   NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID   NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    message     TEXT   NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Close Friends
CREATE TABLE IF NOT EXISTS public.close_friends (
    id        BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, friend_id)
);

-- Story Highlights
CREATE TABLE IF NOT EXISTS public.story_highlights (
    id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name       TEXT NOT NULL,
    cover_url  TEXT,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.story_highlight_items (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    highlight_id BIGINT NOT NULL REFERENCES public.story_highlights(id) ON DELETE CASCADE,
    status_id    BIGINT NOT NULL REFERENCES public.statuses(id)          ON DELETE CASCADE,
    sort_order   INT DEFAULT 0,
    added_at     TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(highlight_id, status_id)
);

-- Story Stickers
CREATE TABLE IF NOT EXISTS public.story_stickers (
    id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    status_id    BIGINT NOT NULL REFERENCES public.statuses(id) ON DELETE CASCADE,
    sticker_type TEXT   NOT NULL,  -- 'mention','hashtag','time','link','countdown','poll','question'
    data         JSONB  NOT NULL DEFAULT '{}',
    position_x   FLOAT  DEFAULT 50,
    position_y   FLOAT  DEFAULT 50,
    scale        FLOAT  DEFAULT 1,
    rotation     FLOAT  DEFAULT 0,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Story Analytics
CREATE TABLE IF NOT EXISTS public.story_analytics (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    status_id   BIGINT NOT NULL REFERENCES public.statuses(id)   ON DELETE CASCADE,
    viewer_id   UUID   NOT NULL REFERENCES public.profiles(id)   ON DELETE CASCADE,
    action_type TEXT   NOT NULL,  -- 'forward_tap','back_tap','exit','link_click','sticker_tap','reply','reaction'
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SECTION 7: LISTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.lists (
    id          BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
    created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    owner_id    UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    description TEXT,
    is_private  BOOLEAN DEFAULT TRUE NOT NULL,
    CONSTRAINT lists_owner_id_name_key UNIQUE (owner_id, name)
);

CREATE TABLE IF NOT EXISTS public.list_members (
    id         BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
    list_id    BIGINT NOT NULL REFERENCES public.lists(id)      ON DELETE CASCADE,
    user_id    UUID   NOT NULL REFERENCES public.profiles(id)   ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT list_members_list_id_user_id_key UNIQUE (list_id, user_id)
);

-- ============================================================================
-- SECTION 8: NOTIFICATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id          BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
    user_id     UUID   NOT NULL REFERENCES public.profiles(id),
    actor_id    UUID   NOT NULL REFERENCES public.profiles(id),
    type        public.notification_type NOT NULL,
    entity_id   BIGINT,
    entity_type TEXT,
    is_read     BOOLEAN DEFAULT FALSE NOT NULL,
    created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT check_not_self_notification CHECK (user_id <> actor_id)
);

-- ============================================================================
-- SECTION 9: CALLS (WebRTC)
-- ============================================================================

-- Calls table
CREATE TABLE IF NOT EXISTS public.calls (
    id               UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    caller_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    callee_id        UUID REFERENCES public.profiles(id) ON DELETE CASCADE,  -- nullable for group calls
    call_type        public.call_type   NOT NULL DEFAULT 'voice',
    status           public.call_status NOT NULL DEFAULT 'ringing',
    is_group         BOOLEAN DEFAULT false,
    chat_id          BIGINT REFERENCES public.chats(id) ON DELETE SET NULL,  -- optional group chat link
    stream_call_id   TEXT,                          -- Stream.io call ID (for group/video calls)
    started_at       TIMESTAMPTZ,
    ended_at         TIMESTAMPTZ,
    duration_seconds INTEGER DEFAULT 0,
    created_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at       TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE  public.calls IS 'Stores call records for voice and video calls.';
COMMENT ON COLUMN public.calls.duration_seconds IS 'Duration in seconds, calculated when call ends.';

-- Call signals (WebRTC signaling)
CREATE TABLE IF NOT EXISTS public.call_signals (
    id          BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    call_id     UUID NOT NULL REFERENCES public.calls(id)    ON DELETE CASCADE,
    sender_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    signal_type public.call_signal_type NOT NULL,
    payload     JSONB NOT NULL DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

COMMENT ON TABLE  public.call_signals IS 'WebRTC signaling channel using Supabase Realtime.';
COMMENT ON COLUMN public.call_signals.payload IS 'Contains SDP offers/answers or ICE candidates.';

-- Group call participants
CREATE TABLE IF NOT EXISTS public.call_participants (
    call_id   UUID NOT NULL REFERENCES public.calls(id)    ON DELETE CASCADE,
    user_id   UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status    TEXT NOT NULL DEFAULT 'joined',   -- joined, left, declined
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    left_at   TIMESTAMPTZ,
    tracks    JSONB DEFAULT '{}'::jsonb,        -- {audio: true, video: true}
    PRIMARY KEY (call_id, user_id)
);

-- ============================================================================
-- SECTION 10: LIVESTREAMS
-- ============================================================================

-- Livestreams table (from stream_sdk_tables migration)
-- NOTE: Live DB uses uuid_generate_v4() and stream_call_id (not stream_id).
--       Status is backstage/live/ended (not scheduled).
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE TABLE IF NOT EXISTS public.livestreams (
    id             UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    stream_call_id TEXT NOT NULL UNIQUE,        -- Stream.io call ID
    host_id        UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title          TEXT NOT NULL,
    description    TEXT,
    status         TEXT NOT NULL DEFAULT 'backstage'
                   CHECK (status IN ('backstage','live','ended')),
    viewer_count   INT DEFAULT 0,
    started_at     TIMESTAMPTZ,
    ended_at       TIMESTAMPTZ,
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Livestream guests
CREATE TABLE IF NOT EXISTS public.livestream_guests (
    id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    livestream_id UUID NOT NULL REFERENCES public.livestreams(id) ON DELETE CASCADE,
    user_id      UUID NOT NULL REFERENCES public.profiles(id)     ON DELETE CASCADE,
    status       TEXT NOT NULL DEFAULT 'invited'
                 CHECK (status IN ('invited','accepted','declined','joined','left')),
    invited_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    joined_at    TIMESTAMPTZ,
    left_at      TIMESTAMPTZ,
    UNIQUE(livestream_id, user_id)
);

-- Livestream chat
CREATE TABLE IF NOT EXISTS public.livestream_chat (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    livestream_id UUID NOT NULL REFERENCES public.livestreams(id)  ON DELETE CASCADE,
    user_id       UUID NOT NULL REFERENCES public.profiles(id)     ON DELETE CASCADE,
    message       TEXT NOT NULL CHECK (char_length(message) > 0 AND char_length(message) <= 500),
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- SECTION 11: LEELA (Short-form Videos)
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.leela_videos (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    video_url        TEXT NOT NULL,
    thumbnail_url    TEXT,
    caption          TEXT,
    audio_name       TEXT,
    duration_seconds INTEGER,
    width            INTEGER,
    height           INTEGER,
    view_count       INTEGER DEFAULT 0,
    like_count       INTEGER DEFAULT 0,
    comment_count    INTEGER DEFAULT 0,
    share_count      INTEGER DEFAULT 0,
    is_published     BOOLEAN DEFAULT true,
    created_at       TIMESTAMPTZ DEFAULT now(),
    updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leela_likes (
    user_id    UUID NOT NULL REFERENCES public.profiles(id)       ON DELETE CASCADE,
    video_id   UUID NOT NULL REFERENCES public.leela_videos(id)   ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, video_id)
);

CREATE TABLE IF NOT EXISTS public.leela_comments (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    video_id   UUID NOT NULL REFERENCES public.leela_videos(id)   ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES public.profiles(id)        ON DELETE CASCADE,
    content    TEXT NOT NULL,
    parent_id  UUID REFERENCES public.leela_comments(id)          ON DELETE CASCADE,
    like_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.leela_views (
    user_id         UUID NOT NULL REFERENCES public.profiles(id)     ON DELETE CASCADE,
    video_id        UUID NOT NULL REFERENCES public.leela_videos(id) ON DELETE CASCADE,
    watched_seconds INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, video_id)
);

CREATE TABLE IF NOT EXISTS public.leela_bookmarks (
    id         UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    video_id   UUID NOT NULL REFERENCES public.leela_videos(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES public.profiles(id)     ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, video_id)
);

-- ============================================================================
-- SECTION 12: CHALLENGES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.challenges (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    created_by          UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title               TEXT NOT NULL,
    description         TEXT,
    cover_image         TEXT,
    rules               TEXT,
    prize_description   TEXT,
    category            TEXT DEFAULT 'general',
    max_participants    INTEGER,
    requires_proof      BOOLEAN DEFAULT true,
    is_featured         BOOLEAN DEFAULT false,
    is_active           BOOLEAN DEFAULT true,
    start_date          TIMESTAMPTZ DEFAULT now(),
    end_date            TIMESTAMPTZ,
    winner_id           UUID REFERENCES public.profiles(id),
    winner_declared_at  TIMESTAMPTZ,
    created_at          TIMESTAMPTZ DEFAULT now(),
    updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.challenge_participants (
    challenge_id BIGINT NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    user_id      UUID   NOT NULL REFERENCES public.profiles(id)   ON DELETE CASCADE,
    status       TEXT DEFAULT 'joined'
                 CHECK (status IN ('joined','submitted','verified','rejected','winner')),
    rank         INTEGER,
    score        INTEGER DEFAULT 0,
    completed_at TIMESTAMPTZ,
    created_at   TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (challenge_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.challenge_submissions (
    id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id     BIGINT NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    user_id          UUID   NOT NULL REFERENCES public.profiles(id)   ON DELETE CASCADE,
    proof_text       TEXT,
    proof_media_url  TEXT,
    proof_media_type TEXT CHECK (proof_media_type IN ('image','video','link')),
    status           TEXT DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
    reviewer_notes   TEXT,
    reviewed_by      UUID REFERENCES public.profiles(id),
    reviewed_at      TIMESTAMPTZ,
    created_at       TIMESTAMPTZ DEFAULT now(),
    updated_at       TIMESTAMPTZ DEFAULT now(),
    UNIQUE(challenge_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.challenge_reactions (
    user_id      UUID   NOT NULL REFERENCES public.profiles(id)   ON DELETE CASCADE,
    challenge_id BIGINT NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ DEFAULT now(),
    PRIMARY KEY (user_id, challenge_id)
);

-- ============================================================================
-- SECTION 13: ADMIN / STATS
-- ============================================================================

-- (Admin stats functions are in 03_functions.sql)

-- ============================================================================
-- SECTION 14: INDEXES
-- ============================================================================

-- ── Search (TRGM) ────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_profiles_name_trgm     ON public.profiles USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_username_trgm ON public.profiles USING gin (username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_posts_content_trgm     ON public.posts    USING gin (content gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_events_title_trgm      ON public.events   USING gin (title gin_trgm_ops);

-- ── Posts ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_id    ON public.posts(user_id);

-- ── Post Likes ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id   ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id   ON public.post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_post ON public.post_likes(user_id, post_id);

-- ── Comments ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);

-- ── Reposts ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_post_reposts_post_id ON public.post_reposts(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reposts_user_id ON public.post_reposts(user_id);

-- ── Chats ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_pinned_chats_user_id ON public.pinned_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_pinned_chats_chat_id ON public.pinned_chats(chat_id);

-- ── Verification ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id ON public.verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status  ON public.verification_requests(status);

-- ── Hashtags ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_hashtags_usage ON public.hashtags(usage_count DESC, last_used_at DESC);

-- ── Notifications ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_notifications_entity_type ON public.notifications(entity_type);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id     ON public.notifications(user_id);

-- ── Analytics ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_post_views_post_id    ON public.post_views(post_id);
CREATE INDEX IF NOT EXISTS idx_post_views_user_id    ON public.post_views(user_id);
CREATE INDEX IF NOT EXISTS idx_post_views_created_at ON public.post_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_promotion_requests_user_id ON public.promotion_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_promotion_requests_status  ON public.promotion_requests(status);

-- ── Calls ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_calls_caller_id        ON public.calls(caller_id);
CREATE INDEX IF NOT EXISTS idx_calls_callee_id        ON public.calls(callee_id);
CREATE INDEX IF NOT EXISTS idx_calls_status           ON public.calls(status);
CREATE INDEX IF NOT EXISTS idx_calls_created_at       ON public.calls(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_signals_call_id   ON public.call_signals(call_id);
CREATE INDEX IF NOT EXISTS idx_call_signals_receiver  ON public.call_signals(receiver_id);
CREATE INDEX IF NOT EXISTS idx_call_participants_call ON public.call_participants(call_id);
CREATE INDEX IF NOT EXISTS idx_call_participants_user ON public.call_participants(user_id);

-- ── Leela ────────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_leela_videos_user      ON public.leela_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_leela_videos_created   ON public.leela_videos(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leela_videos_published ON public.leela_videos(is_published, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leela_comments_video   ON public.leela_comments(video_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leela_likes_video      ON public.leela_likes(video_id);

-- ── Challenges ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_challenges_featured           ON public.challenges(is_featured, is_active);
CREATE INDEX IF NOT EXISTS idx_challenges_category           ON public.challenges(category);
CREATE INDEX IF NOT EXISTS idx_challenges_creator            ON public.challenges(created_by);
CREATE INDEX IF NOT EXISTS idx_challenge_participants_status ON public.challenge_participants(status);
CREATE INDEX IF NOT EXISTS idx_challenge_submissions_challenge ON public.challenge_submissions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_submissions_user    ON public.challenge_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_submissions_status  ON public.challenge_submissions(status);

-- ── Stories ──────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_close_friends_user          ON public.close_friends(user_id);
CREATE INDEX IF NOT EXISTS idx_close_friends_friend        ON public.close_friends(friend_id);
CREATE INDEX IF NOT EXISTS idx_story_highlights_user       ON public.story_highlights(user_id);
CREATE INDEX IF NOT EXISTS idx_story_highlight_items       ON public.story_highlight_items(highlight_id);
CREATE INDEX IF NOT EXISTS idx_story_stickers_status       ON public.story_stickers(status_id);
CREATE INDEX IF NOT EXISTS idx_story_analytics_status      ON public.story_analytics(status_id);
CREATE INDEX IF NOT EXISTS idx_story_reactions_status      ON public.story_reactions(status_id);
CREATE INDEX IF NOT EXISTS idx_story_reactions_user        ON public.story_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_story_replies_status        ON public.story_replies(status_id);
CREATE INDEX IF NOT EXISTS idx_story_replies_sender        ON public.story_replies(sender_id);
CREATE INDEX IF NOT EXISTS idx_story_replies_receiver      ON public.story_replies(receiver_id);

-- ── Livestreams ──────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS livestream_chat_livestream_id_idx ON public.livestream_chat(livestream_id);
CREATE INDEX IF NOT EXISTS livestream_chat_created_at_idx    ON public.livestream_chat(created_at DESC);
CREATE INDEX IF NOT EXISTS livestream_chat_user_id_idx       ON public.livestream_chat(user_id);
