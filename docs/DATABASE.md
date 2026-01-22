# Database Schema Documentation

The application runs on a **Supabase (PostgreSQL)** database. All access is controlled via **Row Level Security (RLS)**.

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

### `public.posts`
User-generated content for the feed.
- `id` (BigInt/Identity, PK): Post ID.
- `content` (Text): The text body.
- `author_id` (UUID): FK to profiles.
- `created_at` (Timestamptz).
- `media_urls` (JSONB): Array of attachments.

### `public.chats`
Conversations between users.
- `id` (BigInt/Identity, PK): Chat ID.
- `type` (Text): 'dm' (Direct Message) or 'group'.
- `created_at` (Timestamptz).

### `public.participants`
Link table for users in chats.
- `chat_id` (BigInt): FK to chats.
- `user_id` (UUID): FK to profiles.
- `joined_at` (Timestamptz).

### `public.messages`
Messages within a chat.
- `id` (BigInt, PK).
- `chat_id` (BigInt).
- `sender_id` (UUID).
- `content` (Text).

### `public.reports`
System for reporting users or content.
- `id` (UUID, PK).
- `reporter_id` (UUID): User filing the report.
- `target_user_id` (UUID): User being reported.
- `reason` (Text).
- `description` (Text).
- `status` (Text): 'pending', 'resolved', etc.

---

## Key RPC Functions (Stored Procedures)

### `create_dm_chat(target_user_id UUID) -> BIGINT`
Safely creates a new Direct Message conversation.
1. Inserts a new row into `chats` (`type = 'dm'`).
2. Inserts both the current user and target user into `participants`.
3. Returns the new `chat_id`.

### `get_dm_chat_id(target_user_id UUID) -> BIGINT`
Checks if a DM already exists between the current user and the target user. Returns the `chat_id` if found, or `NULL`.

### `block_user(target_user_id UUID) -> BOOLEAN`
updates the `relationships` table to set the status to 'blocked' between the current user and target.

### `update_profile(...)`
Securely updates the user's profile fields, ensuring users can only modify their own data.
