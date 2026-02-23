# Final-Supabase — Consolidated Schema

A clean, ordered merge of **all** SQL migrations from:
- `supabase/migrations/` (26 files)
- `supabase/Calls/` (26 files)

Run these four files **in order** on a fresh Supabase project.

---

## Execution Order

| # | File | Contents |
|---|------|----------|
| 1 | `01_schema.sql` | Extensions, enums, all table DDL, and indexes |
| 2 | `02_rls.sql` | Row Level Security policies for every table |
| 3 | `03_functions.sql` | Core RPCs, triggers, and helper functions |
| 4 | `04_features.sql` | Feature functions: Calls/WebRTC, Leela, Challenges, Stories |

---

## Key Design Decisions

### `verified` column — TEXT not BOOLEAN
The `profiles.verified` column was migrated from `BOOLEAN → TEXT` in
`20260211_modify_verified_column.sql`. The final schema uses:
```
verified TEXT CHECK (verified IN ('none', 'verified', 'kcs'))
```
All RPCs use `COALESCE(verified, 'none')` and check `IN ('verified', 'kcs')`.

### Media column
The actual column name is `media_urls` (JSONB). RPCs alias it as `media` in
their return types so existing frontend code works. Do not rename it.

### Challenges — merged from two files
`19_create_challenges_table.sql` (base) and `10_challenges_schema.sql` (extensions)
have been merged into a single final definition in `01_schema.sql`.

---

## Tables by Feature

| Feature | Tables |
|---------|--------|
| Core | `profiles`, `relationships`, `reports`, `verification_requests`, `push_subscriptions`, `privacy_settings`, `blocked_users`, `dm_requests` |
| Posts | `posts`, `hashtags`, `post_hashtags`, `post_collaborators`, `comments`, `post_likes`, `post_reposts`, `comment_likes`, `bookmarks`, `bookmark_collections`, `bookmark_collection_items`, `post_views`, `promotion_requests` |
| Messaging | `chats`, `participants`, `pinned_chats`, `messages` |
| Events | `events`, `event_rsvps` |
| Stories | `statuses`, `status_views`, `story_reactions`, `story_replies`, `close_friends`, `story_highlights`, `story_highlight_items`, `story_stickers`, `story_analytics` |
| Lists | `lists`, `list_members` |
| Notifications | `notifications` |
| Calls | `calls`, `call_signals`, `call_participants` |
| Audio Rooms | `audio_rooms` |
| Livestream | `livestreams`, `livestream_guests`, `livestream_chat` |
| Leela | `leela_videos`, `leela_likes`, `leela_comments`, `leela_views`, `leela_bookmarks` |
| Challenges | `challenges`, `challenge_participants`, `challenge_submissions`, `challenge_reactions` |
