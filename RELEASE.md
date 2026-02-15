# Krishna Connect v2.0.0 — Release Notes

**Release Date:** February 15, 2026
**Codename:** _Govinda Update_

---

## Highlights

This is a major release introducing **voice & video calling**, **bookmark collections**, a completely **redesigned explore page**, an **enhanced chat experience**, a **Twitter-style post detail view**, **Instagram-style Stories**, **Leela (short-form video)**, **Challenges**, comprehensive **legal pages**, and much more.

---

## New Features

### Voice & Video Calls
- **WebRTC-powered calling** — Make voice and video calls to any devotee directly from chat.
- **Screen sharing** — Share your screen during video calls.
- **Call controls** — Mute/unmute mic, toggle camera on/off, end call.
- **Incoming call notifications** — Push notifications with Accept/Decline buttons.
- **Busy detection** — Automatic "line busy" when the other user is already on a call.
- **Call history** — View all past calls integrated into the Chat page tabs.
- **In-chat call indicators** — Missed call, audio/video call events shown inline with callback button.
- **Background support** — Calls continue when you navigate to other pages.
- **Cross-browser** — Safari, Firefox, Edge compatibility with proper feature detection.

### Instagram-style Stories (Complete Redesign)
- **Create Story** — Photo, Video, Text modes with Music coming soon.
- **Text stories** — Color picker (10 colors), gradient backgrounds (6 options), canvas rendering.
- **Video stories** — Up to 50MB upload, mute/unmute in viewer.
- **View Story** — Full-screen Instagram-style viewer with thin progress bars.
- **Reply to stories** — Input bar at bottom sends replies to story author.
- **Like stories** — Heart button + double-tap to like with animation.
- **Delete own stories** — Via dropdown menu.
- **Report stories** — Flag option for inappropriate content.
- **Viewers sheet** — See who viewed your story with avatars and usernames.
- **Pause on hold** — Touch/mouse hold pauses story.

### Leela (Short-form Video)
- **Reels/Shorts-style** vertical video player at `/leela`.
- **Upload button** for creating short videos.
- **Leela tab** on profile pages showing user's short-form videos.
- **SQL schema** for leela_videos table.

### Bookmark Collections
- **Save posts** to organized bookmark collections.
- **Create custom collections** with names and descriptions.
- **Move bookmarks** between collections.
- **Collection detail view** with all saved posts displayed.
- **Post count indicators** on each collection card.

### Redesigned Explore Page (Instagram-style)
- **3-column media grid** with actual image and video thumbnails from posts.
- **Mixed tile sizes** — Featured 2x2 tiles for variety.
- **Hover overlays** showing likes and comments count.
- **Video & multi-image indicators** with badges.
- **Category filter pills** — For You, Trending, Latest, People.
- **Trending hashtags** — Compact pill/cloud layout with popularity-based sizing.
- **Suggested devotees** — Horizontal scroll row with gradient avatar rings.
- **Image placeholders** — Gradient cards with content preview for text-only posts.
- **Fully mobile responsive** — Optimized for any screen size.

### Enhanced Chat Experience
- **Quick access contacts** row with online status dots.
- **Message previews** in chat list with timestamps.
- **Unread indicators** — Bold styling and count badges.
- **Chats/Calls/Groups tabs** — All communication in one place.
- **Username overflow fixed** — Long usernames no longer overflow on mobile.

### Challenges System
- **Full challenges feature** with SQL schema for submissions, rankings, winners.
- **Verified-only creation** — Only verified/KCS users can create challenges.
- **Proof submission** — Participants submit proof of completion.
- **Author verification** — Challenge creators review and approve submissions.
- **Ranking and winner declaration**.
- **Featured in Feed and Explore**.

### Polls & Quiz Mode
- **Fixed vote tracking** — `hasVoted` now properly checks votedBy array.
- **Quiz mode** — `isQuiz` toggle with correct answer selector.
- **Visual feedback** — Progress bars, correct/wrong answer highlighting.
- **Per-option voter list** — See who voted for each option.

### Post Enhancements
- **Link previews** — URLs in posts show rich OG previews (image, title, description).
- **QR code detection** — Hover over QR codes in images to get redirect link.
- **Custom emoji support** — `:emojiName:` renders inline emoji images.
- **Official emoji picker** — Premium feature for verified/KCS users.
- **Stickers** — Available to all users in posts and chat.
- **Like count clickable** — Opens LikedByDialog showing who liked the post.

### Post Detail Page (Twitter-style)
- **Thread view** — Quoted posts shown as connected threads with vertical line.
- **Engagement stats bar** — Reposts, Likes, Views, and Bookmarks counts.
- **Quote/Repost dropdown** — Restored repost and quote post options.
- **Threaded comments** — Compact comment cards with verification badges.

### Profile Updates
- **Reposts tab** — New tab showing all posts a user has reposted.
- **Leela tab** — Short-form video content.
- **Removed** Likes and Media tabs (replaced with more useful features).

### Get Verified Page (Complete Redesign)
- **Modern gradient hero** with animated badge.
- **Benefits grid** including Official Emojis, unlimited pins, promotions.
- **Comparison table** — Normal vs Verified features.
- **Pricing cards** with visual selection.
- **Step-by-step process** visualization.

### Legal & Compliance
- **Privacy Policy** — 12 comprehensive sections covering nudity, harassment, legal actions, DMCA, data protection.
- **Terms & Conditions** — Prohibited content, 3-tier enforcement, DMCA takedown, governing law.
- **Contact Us** — Updated with madanmohandas@krishnaconnect.in.
- **FAQ page** — 17 Q&As across 6 categories.
- **Developers page** — Updated with department names.

### Settings Improvements
- **Password reset flow fixed** — Proxy intercepts `?code=` params for proper auth exchange.
- **Security settings** — Active sessions, 2FA toggle (Coming Soon), login alerts.
- **Account management** — Export data, delete account with confirmation.
- **Back button** on mobile settings.
- **Promotions** link added to sidebar.

### Navigation & Layout
- **Consistent headers** across all pages with backdrop blur and icons.
- **Bottom nav hidden** on chat/[id] conversations and Leela player.
- **Mobile nav duplication fixed** — No more duplicate items in sidebar vs bottom nav.
- **Status page removed** — Stories integrated into feed (no separate page needed).
- **Moodboard deleted** — Cleaned up unused feature.
- **Calls and Groups merged into Chat** — Single unified communication hub.

### Cross-Browser Compatibility
- **Safari** — WebRTC fixes, vendor-prefixed CSS, notification compatibility.
- **Firefox** — Video thumbnail duration handling, proper CSS scrollbar styling.
- **Edge** — Full feature parity with Chrome.
- **iOS Safari** — Safe area insets, `playsInline` attributes, tap delay fixes.

### SEO & Metadata
- **35+ pages** now have proper title and description metadata.
- **Copyright updated** to 2026.
- **All Unicode emojis replaced** with Lucide icons for professional appearance.

---

## Bug Fixes

### SQL Schema Corrections
- All SQL files corrected to reference `public.profiles` (UUID) instead of `public.users`.
- `check_user_busy` RPC fixed with correct UUID parameter type.
- `get_posts_paginated` RPC fixed (pl.id, pr.id, verified type, ambiguous user_id).
- `get_collection_posts` RPC fixed (`p.media` changed to `p.media_urls`).
- `toggle_reaction` overload resolved (PGRST203).
- `toggle_pin_post` verified check fixed for TEXT column.
- `get_user_groups` RPC added (was missing).
- `get_post_likes_users` return type fixed (TEXT not BOOLEAN).

### Other Fixes
- Service worker duplicate cache entry removed.
- Next.js 16 `params` Promise unwrapping in bookmarks/[id].
- Hashtag page media rendering fixed.
- Footer links corrected (/privacy → /privacy-policy, /terms → /terms-and-conditions).
- Broken "Contact Support" links on get-verified page fixed.
- Autoprefixer removed (redundant with Tailwind CSS v3, caused missing module error).

---

## Database Migrations

Execute these SQL files in order on your Supabase instance:

| Order | File | Description |
|-------|------|-------------|
| 1 | `supabase/Calls/01_calls_schema.sql` | Tables: calls, call_signals |
| 2 | `supabase/Calls/02_calls_rls.sql` | Row Level Security policies |
| 3 | `supabase/Calls/03_calls_functions.sql` | RPC functions for calls |
| 4 | `supabase/Calls/04_call_notifications.sql` | Call notification triggers |
| 5 | `supabase/Calls/05_fix_rpc_functions.sql` | Recreates functions with GRANT |
| 6 | `supabase/Calls/06_fix_posts_rpc.sql` | Fixes get_posts_paginated |
| 7 | `supabase/Calls/07_fix_ambiguous_user_id.sql` | Fixes ambiguous user_id |
| 8 | `supabase/Calls/08_fix_collection_posts.sql` | Fixes get_collection_posts |
| 9 | `supabase/Calls/09_leela_schema.sql` | Leela short-form video tables |
| 10 | `supabase/Calls/10_challenges_schema.sql` | Challenges tables and functions |
| 11 | `supabase/Calls/11_fix_toggle_reaction_overload.sql` | Fix toggle_reaction overload |
| 12 | `supabase/Calls/12_fix_challenges_reactions_groups_likes.sql` | Fix challenges + add RPCs |
| 13 | `supabase/Calls/13_fix_pin_and_kcs_privileges.sql` | Fix pin post for verified |
| 14 | `supabase/Calls/14_story_reactions.sql` | Story likes and replies |
| — | `supabase/migrations/20260213_add_bookmark_collections.sql` | Bookmark collections |

---

## Technical Details

- **Package version:** `0.1.0` to `2.0.0`
- **WebRTC:** Peer-to-peer via Supabase Realtime signaling
- **Push Notifications:** Service worker with call-specific actions
- **Video Thumbnails:** Client-side canvas extraction
- **Cross-Browser:** Feature detection, vendor prefixes, graceful fallbacks
- **No new runtime dependencies added** — Built with existing packages
- **All debug console.log statements removed** — Zero in entire src/ directory

---

## Security

- All SQL functions include `SECURITY DEFINER` with `SET search_path = public`
- Row Level Security on all new tables
- Auth checks (`auth.uid()`) in all RPC functions
- Open redirect prevention in auth callback
- CodeQL security scan: **0 alerts**

---

## Compatibility

- **Desktop:** Full multi-column layout, hover interactions
- **Tablet:** Responsive 2-column grid, adaptive spacing
- **Mobile:** Single-column, touch-optimized, compact navigation, safe area insets
- **Browsers:** Chrome, Firefox, Safari, Edge (WebRTC requires modern browser)

---

_Hare Krishna!_
