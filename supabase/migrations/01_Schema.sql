-- ============================================================================
-- 01_Schema.sql
-- Description: Core database structure (Tables, Types, Indexes).
-- ============================================================================

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- SECTION: ENUMS
-- ============================================================================

CREATE TYPE public.rsvp_status AS ENUM ('going', 'interested', 'not_going');

CREATE TYPE public.relationship_status AS ENUM (
    'pending',
    'approved',
    'blocked'
);

-- Consolidated notification types including later additions
CREATE TYPE public.notification_type AS ENUM (
    'follow_request',
    'new_follower',
    'new_like',
    'new_comment',
    'new_repost',
    'collaboration_request',
    'mention'
);

-- ============================================================================
-- SECTION: CORE TABLES
-- ============================================================================

-- Profiles (Consolidated)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID NOT NULL PRIMARY KEY REFERENCES auth.users(id),
    name TEXT,
    username TEXT UNIQUE,
    avatar_url TEXT,
    gender TEXT,
    bio TEXT,
    verified BOOLEAN DEFAULT FALSE NOT NULL,
    is_private BOOLEAN DEFAULT FALSE NOT NULL,
    
    -- Extended fields
    banner_url TEXT,
    location TEXT,
    website TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    has_set_privacy BOOLEAN DEFAULT FALSE
);

COMMENT ON COLUMN public.profiles.verified IS 'Indicates if a user is verified.';

-- Relationships (Follows/Blocks)
CREATE TABLE IF NOT EXISTS public.relationships (
    id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
    user_one_id UUID NOT NULL REFERENCES public.profiles(id),
    user_two_id UUID NOT NULL REFERENCES public.profiles(id),
    status public.relationship_status NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_relationship UNIQUE (user_one_id, user_two_id),
    CONSTRAINT check_not_self_relationship CHECK (user_one_id <> user_two_id)
);

-- Reports
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id UUID REFERENCES public.profiles(id) NOT NULL DEFAULT auth.uid(),
    target_user_id UUID REFERENCES public.profiles(id) NOT NULL,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verification Requests
CREATE TABLE IF NOT EXISTS public.verification_requests (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'yearly')),
    has_social_discount BOOLEAN DEFAULT FALSE,
    social_links JSONB DEFAULT '{}'::jsonb,
    meeting_details JSONB DEFAULT NULL,
    status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN ('submitted', 'reviewing', 'action_required', 'meet_scheduled', 'verified', 'rejected')),
    admin_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_user_verification UNIQUE (user_id)
);

-- Push Subscriptions
CREATE TABLE IF NOT EXISTS push_subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES profiles(id),
    endpoint TEXT NOT NULL UNIQUE,
    p256dh TEXT NOT NULL,
    auth TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SECTION: CONTENT & SOCIAL FEED
-- ============================================================================

-- Posts
CREATE TABLE IF NOT EXISTS public.posts (
    id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    content TEXT,
    media_urls JSONB, -- Array of objects: [{url: "...", type: "image"}]
    poll JSONB,       -- {question: "...", options: [...], totalVotes: int}
    quote_of_id BIGINT REFERENCES public.posts(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ,
    CONSTRAINT check_post_has_content CHECK (
        content IS NOT NULL OR 
        media_urls IS NOT NULL OR 
        poll IS NOT NULL OR 
        quote_of_id IS NOT NULL
    )
);

-- Hashtags
CREATE TABLE IF NOT EXISTS hashtags (
    id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
    tag TEXT NOT NULL UNIQUE,
    usage_count INT DEFAULT 1,
    last_used_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post Hashtags (Join)
CREATE TABLE IF NOT EXISTS post_hashtags (
    post_id BIGINT NOT NULL REFERENCES posts(id),
    hashtag_id BIGINT NOT NULL REFERENCES hashtags(id),
    PRIMARY KEY (post_id, hashtag_id)
);

-- Post Collaborators
CREATE TABLE IF NOT EXISTS post_collaborators (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    post_id BIGINT REFERENCES posts(id),
    user_id UUID REFERENCES profiles(id),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(post_id, user_id)
);

-- Comments
CREATE TABLE IF NOT EXISTS public.comments (
    id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    post_id BIGINT NOT NULL REFERENCES public.posts(id),
    parent_comment_id BIGINT REFERENCES public.comments(id),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Likes & Reposts
CREATE TABLE IF NOT EXISTS public.post_likes (
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    post_id BIGINT NOT NULL REFERENCES public.posts(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (user_id, post_id)
);

CREATE TABLE IF NOT EXISTS public.post_reposts (
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    post_id BIGINT NOT NULL REFERENCES public.posts(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (user_id, post_id)
);

CREATE TABLE IF NOT EXISTS public.comment_likes (
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    comment_id BIGINT NOT NULL REFERENCES public.comments(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    PRIMARY KEY (user_id, comment_id)
);

-- Saved Posts
CREATE TABLE IF NOT EXISTS public.saved_posts (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY, -- Not in Ref, fallback
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    post_id BIGINT NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, post_id)
);

-- ============================================================================
-- SECTION: MESSAGING
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.chats (
    id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    type TEXT NOT NULL, -- 'dm' or 'group'
    name TEXT,
    avatar_url TEXT,
    description TEXT,
    created_by UUID REFERENCES public.profiles(id) DEFAULT auth.uid(),
    is_public BOOLEAN DEFAULT TRUE,
    history_visible BOOLEAN DEFAULT TRUE,
    invite_code UUID DEFAULT gen_random_uuid()
);

CREATE TABLE IF NOT EXISTS public.participants (
    id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
    chat_id BIGINT REFERENCES public.chats(id) NOT NULL,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    is_admin BOOLEAN DEFAULT FALSE,
    UNIQUE(chat_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.pinned_chats (
    id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    chat_id BIGINT REFERENCES public.chats(id) NOT NULL,
    pinned_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(user_id, chat_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
    id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    chat_id BIGINT REFERENCES public.chats(id) NOT NULL,
    user_id UUID REFERENCES public.profiles(id) NOT NULL,
    content TEXT,
    is_edited BOOLEAN DEFAULT FALSE,
    attachment_url TEXT,
    attachment_metadata JSONB,
    reactions JSONB,
    read_by UUID[] DEFAULT ARRAY[]::UUID[],
    deleted_for UUID[],
    is_pinned BOOLEAN DEFAULT FALSE,
    reply_to_message_id BIGINT NULL REFERENCES public.messages(id),
    is_starred BOOLEAN NOT NULL DEFAULT FALSE -- ADDED
);

-- ============================================================================
-- SECTION: EVENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.events (
    id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    creator_id UUID NOT NULL REFERENCES public.profiles(id),
    title TEXT NOT NULL,
    description TEXT,
    thumbnail TEXT,
    date_time TIMESTAMPTZ NOT NULL,
    meet_link TEXT,
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS public.event_rsvps (
    event_id BIGINT NOT NULL REFERENCES public.events(id),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    status public.rsvp_status NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (event_id, user_id)
);

-- ============================================================================
-- SECTION: LISTS & STATUS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.statuses (
    id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    media_url TEXT NOT NULL,
    media_type TEXT NOT NULL DEFAULT 'image',
    caption TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + '1 day'::interval)
);

CREATE TABLE IF NOT EXISTS public.status_views (
    status_id BIGINT NOT NULL REFERENCES public.statuses(id),
    viewer_id UUID NOT NULL REFERENCES public.profiles(id),
    viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (status_id, viewer_id)
);

CREATE TABLE IF NOT EXISTS public.lists (
    id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    owner_id UUID NOT NULL REFERENCES public.profiles(id),
    name TEXT NOT NULL,
    description TEXT,
    is_private BOOLEAN DEFAULT TRUE NOT NULL,
    CONSTRAINT lists_owner_id_name_key UNIQUE (owner_id, name)
);

CREATE TABLE IF NOT EXISTS public.list_members (
    id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
    list_id BIGINT NOT NULL REFERENCES public.lists(id),
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT list_members_list_id_user_id_key UNIQUE (list_id, user_id)
);

-- ============================================================================
-- SECTION: NOTIFICATIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id BIGINT GENERATED ALWAYS AS IDENTITY NOT NULL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES public.profiles(id),
    actor_id UUID NOT NULL REFERENCES public.profiles(id),
    type public.notification_type NOT NULL,
    entity_id BIGINT,
    entity_type TEXT, -- Added/Fixed
    is_read BOOLEAN DEFAULT FALSE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    CONSTRAINT check_not_self_notification CHECK (user_id <> actor_id)
);

-- ============================================================================
-- SECTION: INDEXES
-- ============================================================================

-- Search Indexes (TRGM)
CREATE INDEX IF NOT EXISTS idx_profiles_name_trgm ON profiles USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_profiles_username_trgm ON profiles USING gin (username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_posts_content_trgm ON posts USING gin (content gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_events_title_trgm ON events USING gin (title gin_trgm_ops);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);

CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_id ON public.post_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_post_likes_user_post ON public.post_likes(user_id, post_id);

CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id);

CREATE INDEX IF NOT EXISTS idx_post_reposts_post_id ON public.post_reposts(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reposts_user_id ON public.post_reposts(user_id);

CREATE INDEX IF NOT EXISTS idx_pinned_chats_user_id ON public.pinned_chats(user_id);
CREATE INDEX IF NOT EXISTS idx_pinned_chats_chat_id ON public.pinned_chats(chat_id);

CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id ON public.verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON public.verification_requests(status);

CREATE INDEX IF NOT EXISTS idx_hashtags_usage ON hashtags(usage_count DESC, last_used_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_entity_type ON public.notifications(entity_type);
