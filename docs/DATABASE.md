# Database Schema Documentation

The application runs on a **Supabase (PostgreSQL 15+)** database. All access is controlled via **Row Level Security (RLS)** policies that ensure users can only access data they're authorized to see.

## Core Tables

### `public.profiles`
Stores user identity and public profile information.
- `id` (UUID, PK): Links to `auth.users`.
- `username` (Text, Unique): Public handle.
- `full_name` (Text): Display name.
- `avatar_url` (Text): Path to image in storage.
- `banner_url` (Text): Path to banner image.
- `bio`, `location`, `website`: Meta details.
- `verified` (Boolean): Verification status.
- `created_at` (Timestamptz): Account creation timestamp.
- `settings` (JSONB): User preferences and settings.

### `public.posts`
User-generated content for the feed.
- `id` (BigInt/Identity, PK): Post ID.
- `content` (Text): The text body.
- `author_id` (UUID): FK to profiles.
- `created_at` (Timestamptz): Post creation time.
- `updated_at` (Timestamptz): Last edit time.
- `media_urls` (JSONB): Array of media attachments.
- `scheduled_for` (Timestamptz): Scheduled publish time (nullable).
- `pinned` (Boolean): Whether post is pinned to profile.
- `parent_post_id` (BigInt): FK to posts for threads/replies.

### `public.chats`
Conversations between users.
- `id` (BigInt/Identity, PK): Chat ID.
- `type` (Text): 'dm' (Direct Message) or 'group'.
- `name` (Text): Group name (nullable).
- `created_at` (Timestamptz).
- `created_by` (UUID): Chat creator.

### `public.participants`
Link table for users in chats.
- `chat_id` (BigInt): FK to chats.
- `user_id` (UUID): FK to profiles.
- `joined_at` (Timestamptz).
- `role` (Text): 'admin' or 'member'.

### `public.messages`
Messages within a chat.
- `id` (BigInt, PK).
- `chat_id` (BigInt): FK to chats.
- `sender_id` (UUID): FK to profiles.
- `content` (Text): Message text.
- `created_at` (Timestamptz).
- `edited_at` (Timestamptz, nullable): Last edit timestamp.
- `reply_to` (BigInt, nullable): FK to messages for replies.
- `media_urls` (JSONB): Attached media files.

### `public.reports`
System for reporting users or content.
- `id` (UUID, PK).
- `reporter_id` (UUID): User filing the report.
- `target_user_id` (UUID, nullable): User being reported.
- `target_post_id` (BigInt, nullable): Post being reported.
- `target_message_id` (BigInt, nullable): Message being reported.
- `reason` (Text): Report category.
- `description` (Text): Detailed explanation.
- `status` (Text): 'pending', 'resolved', 'dismissed'.
- `created_at` (Timestamptz).

### `public.events`
Community events and gatherings.
- `id` (BigInt/Identity, PK).
- `title` (Text): Event name.
- `description` (Text): Event details.
- `created_by` (UUID): FK to profiles (must be verified).
- `start_time` (Timestamptz): Event start.
- `end_time` (Timestamptz): Event end.
- `location` (Text): Physical or virtual location.
- `banner_url` (Text): Event banner image.
- `created_at` (Timestamptz).

### `public.event_participants`
RSVP tracking for events.
- `event_id` (BigInt): FK to events.
- `user_id` (UUID): FK to profiles.
- `status` (Text): 'going', 'interested', 'not_going'.
- `created_at` (Timestamptz).

### `public.groups`
Topic-based communities.
- `id` (BigInt/Identity, PK).
- `name` (Text): Group name.
- `description` (Text): Group purpose.
- `created_by` (UUID): FK to profiles.
- `avatar_url` (Text): Group icon.
- `banner_url` (Text): Group banner.
- `created_at` (Timestamptz).
- `is_private` (Boolean): Privacy setting.

### `public.group_members`
Group membership tracking.
- `group_id` (BigInt): FK to groups.
- `user_id` (UUID): FK to profiles.
- `role` (Text): 'admin', 'moderator', or 'member'.
- `joined_at` (Timestamptz).

### `public.likes`
Post and content likes.
- `id` (BigInt/Identity, PK).
- `user_id` (UUID): FK to profiles.
- `post_id` (BigInt, nullable): FK to posts.
- `created_at` (Timestamptz).

### `public.comments`
Comments on posts.
- `id` (BigInt/Identity, PK).
- `post_id` (BigInt): FK to posts.
- `author_id` (UUID): FK to profiles.
- `content` (Text): Comment text.
- `created_at` (Timestamptz).
- `updated_at` (Timestamptz): Last edit time.
- `parent_comment_id` (BigInt, nullable): FK for nested comments.
- `is_pinned` (Boolean): Highlighted at the top.
- `is_hidden` (Boolean): Hidden from view (moderation).

### `public.bookmarks`
Saved posts.
- `id` (BigInt/Identity, PK).
- `user_id` (UUID): FK to profiles.
- `post_id` (BigInt): FK to posts.
- `created_at` (Timestamptz).

### `public.notifications`
User notifications.
- `id` (BigInt/Identity, PK).
- `user_id` (UUID): FK to profiles (recipient).
- `type` (Text): Notification type (like, comment, mention, follow, etc.).
- `content` (Text): Notification message.
- `related_user_id` (UUID, nullable): FK to profiles (actor).
- `related_post_id` (BigInt, nullable): FK to posts.
- `read` (Boolean): Read status.
- `created_at` (Timestamptz).

### `public.relationships`
User relationships (follows, blocks).
- `follower_id` (UUID): FK to profiles (following user).
- `following_id` (UUID): FK to profiles (followed user).
- `status` (Text): 'following', 'blocked'.
- `created_at` (Timestamptz).

### `public.stories`
Ephemeral 24-hour content.
- `id` (BigInt/Identity, PK).
- `user_id` (UUID): FK to profiles.
- `media_url` (Text): Story image/video.
- `caption` (Text, nullable): Story text.
- `created_at` (Timestamptz).
- `expires_at` (Timestamptz): Auto-delete timestamp.

### `public.leela_videos`
Short-form video content (Reels/Shorts).
- `id` (UUID, PK).
- `user_id` (UUID): FK to profiles.
- `video_url` (Text): URL of the video file.
- `thumbnail_url` (Text, nullable): Preview image.
- `caption` (Text, nullable): Video description.
-   `view_count` (BigInt): Total views.
-   `like_count` (BigInt): Total likes.
-   `comment_count` (BigInt): Total comments.
- `created_at` (Timestamptz).

---

## Key RPC Functions (Stored Procedures)

### `create_dm_chat(target_user_id UUID) -> BIGINT`
Safely creates a new Direct Message conversation.
1. Checks if a DM already exists between users.
2. Inserts a new row into `chats` (`type = 'dm'`) if needed.
3. Inserts both the current user and target user into `participants`.
4. Returns the `chat_id`.

### `get_dm_chat_id(target_user_id UUID) -> BIGINT`
Checks if a DM already exists between the current user and the target user. Returns the `chat_id` if found, or `NULL` if not.

### `block_user(target_user_id UUID) -> BOOLEAN`
Updates the `relationships` table to set the status to 'blocked' between the current user and target user. Prevents the blocked user from seeing or interacting with the blocker's content.

### `unblock_user(target_user_id UUID) -> BOOLEAN`
Removes the block relationship between users, restoring normal interaction capabilities.

### `follow_user(target_user_id UUID) -> BOOLEAN`
Creates a following relationship in the `relationships` table.

### `unfollow_user(target_user_id UUID) -> BOOLEAN`
Removes the following relationship between users.

### `update_profile(...)`
Securely updates the user's profile fields, ensuring users can only modify their own data. Protected by RLS policies.

### `get_user_feed(limit_count INT, offset_count INT) -> TABLE`
Returns a personalized feed of posts from followed users and public posts.

### `get_trending_hashtags(limit_count INT) -> TABLE`
Returns the most popular hashtags based on recent usage.

### `mark_notifications_read(notification_ids BIGINT[]) -> BOOLEAN`
Marks multiple notifications as read in a single operation.

### `cleanup_expired_stories() -> INT`
Automatically removes stories older than 24 hours. Called by a scheduled job.

---

## Row Level Security (RLS) Policies

All tables implement RLS policies to ensure data security:

### Profiles
- **SELECT**: Public profiles visible to all authenticated users.
- **UPDATE**: Users can only update their own profile.
- **DELETE**: Users can delete their own profile.

### Posts
- **SELECT**: All authenticated users can view public posts.
- **INSERT**: Authenticated users can create posts.
- **UPDATE**: Authors can edit their own posts.
- **DELETE**: Authors can delete their own posts.

### Messages
- **SELECT**: Users can only read messages from chats they participate in.
- **INSERT**: Users can send messages to chats they're part of.
- **UPDATE**: Users can edit their own messages.
- **DELETE**: Users can delete their own messages.

### Events
- **SELECT**: All authenticated users can view events.
- **INSERT**: Only verified users can create events.
- **UPDATE**: Event creators can edit their events.
- **DELETE**: Event creators can delete their events.

### Groups
- **SELECT**: All users can view public groups; members can view private groups.
- **INSERT**: Any authenticated user can create a group.
- **UPDATE**: Group admins can update group details.
- **DELETE**: Group creators can delete groups.

---

## Database Triggers

### `update_posts_updated_at`
Automatically updates the `updated_at` timestamp when a post is modified.

### `create_notification_on_like`
Creates a notification when someone likes a post.

### `create_notification_on_comment`
Creates a notification when someone comments on a post.

### `create_notification_on_mention`
Creates a notification when a user is mentioned in a post or comment.

### `create_notification_on_follow`
Creates a notification when someone follows a user.

---

## Indexes

Performance optimizations through strategic indexing:
- `idx_posts_author_created`: Posts by author and creation date
- `idx_messages_chat_created`: Messages by chat and creation time
- `idx_notifications_user_read`: Notifications by user and read status
- `idx_relationships_follower_following`: Following relationships
- `idx_events_start_time`: Events by start time
- `idx_stories_expires`: Stories by expiration time for cleanup
