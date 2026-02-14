# Krishna Connect v2.0.0 — Release Notes

**Release Date:** February 14, 2026
**Codename:** _Govinda Update_

---

## 🎉 Highlights

This is a major release introducing **voice & video calling**, **bookmark collections**, a completely **redesigned explore page**, an **enhanced chat experience**, and a **Twitter-style post detail view** — all built to bring the Krishna Connect community closer together.

---

## ✨ New Features

### 📞 Voice & Video Calls
- **WebRTC-powered calling** — Make voice and video calls to any devotee directly from chat.
- **Screen sharing** — Share your screen during video calls.
- **Call controls** — Mute/unmute mic, toggle camera on/off, end call.
- **Incoming call notifications** — Push notifications with Accept/Decline buttons.
- **Busy detection** — Automatic "line busy" when the other user is already on a call.
- **Call history** — View all past calls (incoming, outgoing, missed) on the `/calls` page.
- **Background support** — Calls continue when you navigate to other pages.

### 🔖 Bookmark Collections
- **Save posts** to organized bookmark collections.
- **Create custom collections** with names and descriptions.
- **Move bookmarks** between collections.
- **Collection detail view** with all saved posts displayed.
- **Post count indicators** on each collection card.

### 🔍 Redesigned Explore Page (Instagram-style)
- **3-column media grid** with actual image and video thumbnails from posts.
- **Mixed tile sizes** — Featured 2×2 tiles for variety.
- **Hover overlays** showing ❤️ likes and 💬 comments count.
- **Video & multi-image indicators** with badges.
- **Category filter pills** — For You, Trending, Latest, People.
- **Trending hashtags** — Compact pill/cloud layout with popularity-based sizing and color.
- **Suggested devotees** — Horizontal scroll row with gradient avatar rings.
- **Image placeholders** — Gradient cards with content preview for text-only posts or failed loads.
- **Fully mobile responsive** — Optimized for any screen size.

### 💬 Enhanced Chat Experience
- **Quick access contacts** row with online status dots.
- **Message previews** in chat list with timestamps.
- **Unread indicators** — Bold styling and count badges.
- **Engaging empty state** with action buttons.
- **Pinned conversations** section.

### 📄 Redesigned Post Detail Page (`/post/[id]`)
- **Twitter-style thread view** — Quoted posts shown as connected threads with vertical line.
- **Engagement stats bar** — Reposts, Likes, Views, and Bookmarks counts displayed prominently.
- **Full timestamp** — Shows exact time and date (e.g., "2:30 PM · Feb 14, 2026").
- **Threaded comments** — Compact comment cards with author avatar, verification badge, timestamps, and like buttons (no longer rendered as full PostCard components).
- **Inline action bar** — Like, Repost, Bookmark, and Share directly from the detail view.
- **Reply composer** — Streamlined reply box with the logged-in user's avatar.

### 👤 Profile Reposts Tab
- **New "Reposts" tab** on profile pages showing all posts a user has reposted.
- Fetches from the `post_reposts` table with full post data (author, media, stats).

---

## 🐛 Bug Fixes

### Hashtag Page Media
- **Fixed:** Posts with images/videos on `/hashtag/[tag]` pages were showing no media. The `media_urls` JSONB array contains `{url, type}` objects, but the code was filtering for plain strings — effectively filtering out all media. Now properly maps both object and string formats.

### SQL Schema Corrections
- **Fixed:** All SQL files corrected to reference `public.profiles` (UUID primary key) instead of `public.users` (which doesn't exist in the database).
- **Fixed:** `check_user_busy` RPC function — Dropped and recreated with correct UUID parameter type, proper `GRANT EXECUTE`, and `NOTIFY pgrst, 'reload schema'` to refresh PostgREST cache.
- **Fixed:** `get_posts_paginated` RPC — `COUNT(DISTINCT pl.id)` changed to `COUNT(DISTINCT pl.user_id)` since `post_likes` has a composite PK `(user_id, post_id)` with no `id` column. Same fix for `post_reposts`.
- **Fixed:** `author_verified` return type changed from `BOOLEAN` to `TEXT` to match the actual `profiles.verified` column (values: `'none'`, `'verified'`, `'kcs'`).
- **Fixed:** Ambiguous `user_id` column references in `get_posts_paginated` — All references qualified with table aliases.
- **Fixed:** `get_collection_posts` RPC — `p.media` changed to `p.media_urls` to match actual column name.

### Bookmark Collections
- **Fixed:** Collection detail page now correctly parses collection IDs and handles `media_urls` as JSONB objects.
- **Fixed:** `get_collection_posts` and `get_bookmark_collections` RPCs corrected with proper column references and types.

### Service Worker
- **Fixed:** Duplicate `/logo/krishna_connect.png` in the `APP_SHELL` cache array causing `Cache.addAll()` to fail with `InvalidStateError`.

### Next.js 16 Compatibility
- **Fixed:** `params.id` accessed directly instead of via `React.use()` in bookmarks detail page (`/bookmarks/[id]`). Updated to use `Promise<{ id: string }>` pattern.

---

## 🗄️ Database Migrations

The following SQL files need to be executed in order on your Supabase instance:

| Order | File | Description |
|-------|------|-------------|
| 1 | `supabase/Calls/01_calls_schema.sql` | Tables: `calls`, `call_signals` with UUID FKs to `profiles` |
| 2 | `supabase/Calls/02_calls_rls.sql` | Row Level Security policies |
| 3 | `supabase/Calls/03_calls_functions.sql` | Functions: `check_user_busy`, `get_call_history`, `cleanup_stale_calls` |
| 4 | `supabase/Calls/04_call_notifications.sql` | Triggers for call notification records |
| 5 | `supabase/Calls/05_fix_rpc_functions.sql` | Recreates functions with GRANT + schema reload |
| 6 | `supabase/Calls/06_fix_posts_rpc.sql` | Fixes `get_posts_paginated` (pl.id, pr.id, verified type) |
| 7 | `supabase/Calls/07_fix_ambiguous_user_id.sql` | Fixes ambiguous `user_id` in subqueries |
| 8 | `supabase/Calls/08_fix_collection_posts.sql` | Fixes `get_collection_posts` RPC |
| — | `supabase/migrations/20260213_add_bookmark_collections.sql` | Bookmark collections tables and RPCs |

---

## 📦 Technical Details

- **Package version:** `0.1.0` → `2.0.0`
- **WebRTC:** Peer-to-peer connections via Supabase Realtime for signaling
- **Push Notifications:** Service worker with call-specific action buttons (Accept/Decline)
- **Video Thumbnails:** Client-side canvas extraction from video URLs
- **No new dependencies added** — Built entirely with existing packages

---

## 🔒 Security

- All SQL functions include `SECURITY DEFINER` with `SET search_path = public`
- Row Level Security policies enforce that users can only access their own call records
- Auth checks (`auth.uid()`) in all RPC functions
- CodeQL security scan: **0 alerts**

---

## 📱 Compatibility

- **Desktop:** Full 3-column layout, hover interactions
- **Tablet:** Responsive 2-column grid, adaptive spacing
- **Mobile:** Single-column layout, touch-optimized, compact navigation
- **Browsers:** Chrome, Firefox, Safari, Edge (WebRTC requires modern browser)

---

_Hare Krishna! 🙏_
