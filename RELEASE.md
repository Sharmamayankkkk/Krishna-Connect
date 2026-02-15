# Krishna Connect v2.0.0 — Release Notes

**Release Date:** February 15, 2026
**Codename:** _Govinda Update_

---

## Highlights

This is a major release introducing **voice & video calling**, **bookmark collections**, a completely **redesigned explore page**, an **enhanced chat experience**, a **Twitter-style post detail view**, **Instagram-style Stories** (with stickers, drawing tools, close friends, analytics), **Leela (short-form video)** with full interactions, **Challenges**, **Google AdSense monetization**, comprehensive **legal pages**, an **ad-free premium experience** for verified users, and much more.

---

## New Features

### Voice & Video Calls
- **WebRTC-powered calling** — Make voice and video calls to any devotee directly from chat.
- **Screen sharing** — Share your screen during video calls.
- **Call controls** — Mute/unmute mic, toggle camera on/off, end call.
- **Incoming call notifications** — Push notifications with Accept/Decline buttons.
- **Busy detection** — Automatic "line busy" when the other user is already on a call.
- **Call history** — View all past calls integrated into the Chat page Calls tab.
- **In-chat call indicators** — Missed call, audio/video call events shown inline with callback button.
- **Background support** — Calls continue when you navigate to other pages.
- **Cross-browser** — Safari, Firefox, Edge compatibility with proper feature detection.

### Instagram-style Stories (Complete Redesign)
- **Create Story** — Photo, Video, Text modes with Music coming soon.
- **Sticker system** — Mention (@), Hashtag (#), Time/Date, Link, Countdown stickers. Draggable, resizable on canvas.
- **Drawing tool** — Canvas overlay with 10 colors, 3 brush sizes, eraser, undo/redo.
- **Text blocks** — Multiple text blocks, 4 fonts (Sans/Serif/Mono/Script), alignment, background highlight, color picker.
- **Text stories** — Color picker (10 colors), 6 gradient backgrounds, canvas-based rendering.
- **Video stories** — Up to 50MB upload, unmuted by default with smart autoplay fallback.
- **Close Friends** — Share stories to Close Friends only (green ring indicator, "Close Friend" badge).
- **View Story** — Full-screen Instagram-style viewer with thin animated progress bars.
- **Reply to stories** — Replies sent as DMs with story thumbnail context (`[[STORY_REPLY:url]]` format rendered beautifully in chat).
- **Like stories** — Heart button + quick emoji reactions (6 emojis). Likes shown in viewers list.
- **Viewers sheet** — See who viewed your story, with heart icon next to users who liked.
- **Analytics sheet** — Creators see views, reactions, replies, forward/back taps, exits.
- **Swipe down to exit** — Smooth translate/scale animation.
- **Interactive stickers** — Tap to open profile, hashtag, or link.
- **Delete own stories** — Via dropdown menu with proper z-index.
- **Report stories** — Flag option for inappropriate content.
- **Pause on hold** — Touch/mouse hold pauses story playback.
- **Redesigned header controls** — Backdrop-blur pill buttons (mute, pause, more, close) with `active:scale-90` feedback.
- **Mobile responsive** — Full `100dvh`, safe-area-inset-bottom for notched phones, responsive padding/icons throughout.
- **Add to Highlights** — Coming Soon placeholder.

### Leela (Short-form Video)
- **Vertical video player** at `/leela` — Full-screen swipe-through experience.
- **Upload button** for creating short videos (uploaded to `leela` storage bucket).
- **Like** — Toggle via `leela_likes` table, red filled heart with scale animation, double-tap to like with heart overlay.
- **Comment** — Bottom sheet with comment list (user avatars, timestamps), post form with Enter-to-submit, real-time count.
- **Bookmark** — Toggle via `leela_bookmarks` table, filled icon when saved, toast confirmation.
- **Share** — Web Share API on mobile (native share sheet), clipboard copy fallback on desktop.
- **Leela tab on profile** — Instagram-style 3-column grid with 9:16 aspect ratio cells, video thumbnails, hover overlay showing view/like counts, play icon with view count.
- **Google AdSense** — Leela Between Videos ad unit between every 3rd video.
- **SQL schema** — `leela_videos`, `leela_likes`, `leela_comments`, `leela_bookmarks` tables with RLS and toggle RPCs.

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
- **Category filter pills** — For You, Trending, Latest, People (actual filtering).
- **Trending hashtags** — Compact pill/cloud layout with popularity-based sizing and color.
- **Suggested devotees** — Horizontal scroll row with gradient avatar rings.
- **Image placeholders** — Gradient cards with content preview and username for text-only posts.
- **Deterministic media selection** — Multi-image posts show varied image using `postId % length`.
- **Proper media_urls handling** — Supports both `{url,type}` objects and plain string formats.
- **Fully mobile responsive** — Optimized for any screen size with `sm:` breakpoints.

### Enhanced Chat Experience
- **Quick access contacts** row with online status dots.
- **Message previews** in chat list with timestamps.
- **Unread indicators** — Bold styling and count badges.
- **Chats/Calls/Groups tabs** — All communication in one place (merged from separate pages).
- **Story replies rendered** — `StoryReplyMessage` component shows story thumbnail + reply text.
- **Call history messages** — `CallMessage` component shows missed/completed calls with callback button.
- **Username overflow fixed** — `max-w` constraints prevent overflow on mobile.

### Challenges System
- **Full challenges feature** with SQL schema for submissions, rankings, winners.
- **Verified-only creation** — Only verified/KCS users can create challenges.
- **Proof submission** — Participants submit proof of completion.
- **Author verification** — Challenge creators review and approve submissions.
- **Ranking and winner declaration**.
- **Featured in Feed and Explore**.

### Polls & Quiz Mode
- **Fixed vote tracking** — `hasVoted` now properly checks votedBy array.
- **Quiz mode** — `isQuiz` toggle with correct answer selector in create post.
- **Visual feedback** — Progress bars, correct/wrong answer highlighting (green/red).
- **Per-option voter list** — See who voted for each option.

### Post Enhancements
- **Link previews** — URLs in posts show rich OG previews (image, title, description, favicon) via `/api/link-preview` endpoint.
- **QR code detection** — Hover over QR codes in images to get redirect link via BarcodeDetector API.
- **Custom emoji support** — `:emojiName:` renders inline emoji images in posts and chat.
- **Official emoji picker** — Premium feature for verified/KCS users only (locked tab with "Get Verified" upsell for others).
- **Stickers** — Available to all users in posts and chat.
- **Like count clickable** — Opens LikedByDialog showing who liked the post.
- **Redesigned video player** — Unmuted by default, gradient bottom control bar, scrubbing progress bar with time display, play/pause/mute/fullscreen buttons, auto-hide controls after 3s, replay button when video ends.

### Post Detail Page (Twitter-style)
- **Thread view** — Quoted posts shown as connected threads with vertical line.
- **Engagement stats bar** — Reposts, Likes, Views, and Bookmarks counts.
- **Quote/Repost dropdown** — Restored repost and quote post options.
- **Threaded comments** — Compact comment cards with verification badges.
- **Google AdSense** — Post Detail ad unit after comments.

### Profile Updates
- **Reposts tab** — New tab showing all posts a user has reposted.
- **Leela tab** — Instagram-style 3-column grid of short-form videos with thumbnails, view/like counts, and links to player.
- **Removed** Likes and Media tabs (replaced with more useful features).
- **Google AdSense** — Profile Sidebar ad unit below tabs.

### Get Verified Page (Complete Redesign)
- **Modern gradient hero** with animated badge.
- **Benefits grid** — Official Emojis, Unlimited Pins, Ad-Free Experience, Promotions, and more.
- **Comparison table** — Normal vs Verified features (includes Ad-Free row).
- **Active Benefits list** — Verified users see their active perks including Ad-Free.
- **Pricing cards** with visual selection.
- **Step-by-step process** visualization (Apply → KCS Meet → Verified!).

### Google AdSense Integration
- **6 new ad units** placed across the platform:
  - **Between Stories** — Feed page, after stories bar (slot: `2513515369`).
  - **Explore In-Feed** — Fluid ad before explore grid (slot: `6261188688`).
  - **Leela Between Videos** — Between every 3rd Leela video (slot: `2321943672`).
  - **Profile Sidebar** — Below profile tabs (slot: `8691086496`).
  - **Post Detail** — After comments section (slot: `2052584005`).
  - **Events Page** — After event listings (slot: `1561629410`).
- **Ad-free for premium users** — Verified and KCS users see no ads (GoogleAd returns null).
- **No ads on** chat, notifications, bookmarks, challenges pages.
- Uses existing `GoogleAd` component with slot/format/layout-key props.

### Notifications Page (Redesigned)
- **Time-based grouping** — "Today", "Yesterday", "This Week", "Earlier" sections.
- **Gradient icon bubbles** — Each notification type has colored gradient icon overlay.
- **Filter tabs with count badges** — Unread count per category.
- **Working pagination** — Load More fetches next 30 notifications.
- **Better empty states** — Gradient icon boxes with contextual messages.

### Legal & Compliance
- **Privacy Policy** — 12 comprehensive sections covering nudity, harassment, legal actions, DMCA, data protection.
- **Terms & Conditions** — Prohibited content, 3-tier enforcement, DMCA takedown, governing law.
- **Contact Us** — Updated with madanmohandas@krishnaconnect.in across all pages and API routes.
- **FAQ page** (`/faq`) — 17 Q&As across 6 categories using Accordion UI.
- **Developers page** — Updated with department names (removed individual names).
- **Footer links fixed** — All legal page links corrected and accessible publicly.

### Settings Improvements
- **Password reset flow fixed** — Proxy intercepts `?code=` params for proper auth code exchange, redirects to `/update-password`.
- **Security settings** — Active sessions display, 2FA toggle (Coming Soon), login alerts (Coming Soon).
- **Account management** — Export data, delete account with confirmation dialog.
- **Back button** on mobile settings.
- **Promotions** link added to sidebar.

### Navigation & Layout
- **Consistent headers** across all pages with `bg-background/95 backdrop-blur` + SidebarTrigger + icon + title.
- **Bottom nav hidden** on chat/[id] conversations and Leela player.
- **Mobile nav duplication fixed** — Bottom nav items hidden from sidebar on mobile with `hidden md:block`.
- **Status page removed** — Stories integrated into feed (components moved to `stories/`).
- **Moodboard deleted** — Cleaned up unused feature and all related files.
- **Calls and Groups merged into Chat** — Single unified communication hub with tabs.
- **Removed** standalone `/calls` and `/groups` routes and sidebar entries.

### Cross-Browser Compatibility
- **Safari** — Removed deprecated `new RTCSessionDescription/ICECandidate()`, `playsInline`/`webkit-playsinline`, notification feature detection via `Notification.maxActions`.
- **Firefox** — Video thumbnail `Infinity` duration handling, `canplaythrough` fallback event.
- **Edge** — Full feature parity with Chrome.
- **iOS Safari** — Safe area insets, tap highlight removal, text size adjust, overscroll-behavior.
- **CSS** — `-webkit-backdrop-filter` manual prefixes, `-webkit-tap-highlight-color`, `-webkit-text-size-adjust`.

### SEO & Metadata
- **35+ pages** now have proper title and description metadata via layout.tsx files.
- **Copyright updated** to 2026.
- **All Unicode emojis replaced** with Lucide icons for professional appearance.
- **All debug console.log statements removed** — Zero in entire `src/` directory.

---

## Bug Fixes

### SQL Schema Corrections
- All SQL files corrected to reference `public.profiles` (UUID) instead of `public.users`.
- `check_user_busy` RPC fixed with correct UUID parameter type.
- `get_posts_paginated` RPC fixed (`pl.id` → `pl.user_id`, `pr.id` → `pr.user_id`, `verified` TEXT not BOOLEAN, ambiguous `user_id` qualified with table aliases).
- `get_collection_posts` RPC fixed (`p.media` → `p.media_urls`, same column fixes as above).
- `toggle_reaction` overload resolved (PGRST203 — dropped incorrect UUID overload).
- `toggle_pin_post` verified check fixed for TEXT column (`IN ('verified', 'kcs')`).
- `get_user_groups` RPC added (was missing, caused PGRST202).
- `get_post_likes_users` return type fixed (TEXT not BOOLEAN for verified column).

### Build Fixes
- Service worker duplicate cache entry for `krishna_connect.png` removed.
- Next.js 16 `params` Promise unwrapping with `React.use()` in bookmarks/[id].
- ES2018 regex `/s` flag replaced with `[\s\S]` for broader TypeScript target compat.
- Missing `formatDistanceToNow` import added to chat.tsx.
- `User` type property `is_verified` (not `verified`) corrected in google-ad and get-verified.
- Supabase profiles join array vs single-object handling in Leela comments.
- `middleware.ts` deleted (Next.js 16 uses `proxy.ts` instead).
- Autoprefixer removed (redundant with Tailwind CSS v3, caused missing module error).

### Other Fixes
- Hashtag page media rendering fixed — properly maps `{url,type}` JSONB objects.
- Footer links corrected (`/privacy` → `/privacy-policy`, `/terms` → `/terms-and-conditions`).
- Broken "Contact Support" links on get-verified page replaced with `/contact-us`.
- Storage bucket references corrected (`media` → `post_media` in edit-post, `media` → `leela` in Leela page).
- Story viewer header buttons (pause, more, close) now clickable — navigation overlay no longer covers top/bottom areas.
- Story video unmuted by default with smart autoplay fallback for browser policy.

---

## Database Migrations

Execute these SQL files **in order** on your Supabase instance:

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
| 15 | `supabase/Calls/15_stories_complete.sql` | Close friends, highlights, stickers, analytics |
| 16 | `supabase/Calls/16_leela_interactions.sql` | Leela comments and bookmarks |
| — | `supabase/migrations/20260213_add_bookmark_collections.sql` | Bookmark collections |

### Required Storage Buckets

| Bucket | Type | Purpose |
|--------|------|---------|
| `post_media` | Public | Post images and videos |
| `story` | Public | Story images and videos |
| `leela` | Public | Short-form video uploads |
| `attachments` | Public | Chat attachments, user avatars |

---

## Technical Details

- **Package version:** `0.1.0` → `2.0.0`
- **WebRTC:** Peer-to-peer via Supabase Realtime signaling
- **Push Notifications:** Service worker with call-specific Accept/Decline actions
- **Video Thumbnails:** Client-side canvas extraction from random frames
- **Video Player:** Custom controls with gradient overlay, scrubbing, time display, auto-hide
- **Story Rendering:** Canvas-based text-to-image for text stories, sticker overlay system
- **Cross-Browser:** Feature detection (not UA sniffing), vendor prefixes, graceful fallbacks
- **Ad Monetization:** Google AdSense with 8 ad unit slots, premium ad-free for verified users
- **No new runtime dependencies added** — Built with existing packages
- **All debug console.log statements removed** — Zero in entire src/ directory

---

## Security

- All SQL functions include `SECURITY DEFINER` with `SET search_path = public`
- Row Level Security on all new tables (calls, stories, leela, challenges, bookmarks)
- Auth checks (`auth.uid()`) in all RPC functions
- Open redirect prevention in auth callback (`next` param validated)
- URL validation with protocol check for story link stickers
- `NOTIFY pgrst, 'reload schema'` in all SQL migration files
- CodeQL security scan: **0 alerts**

---

## Compatibility

- **Desktop:** Full multi-column layout, hover interactions, sidebar navigation
- **Tablet:** Responsive 2-column grid, adaptive spacing
- **Mobile:** Single-column, touch-optimized, bottom navigation, safe area insets, swipe gestures
- **Browsers:** Chrome, Firefox, Safari, Edge (WebRTC requires modern browser)
- **iOS Safari:** `playsInline`, `-webkit-tap-highlight-color`, safe area padding
- **Notched devices:** `env(safe-area-inset-bottom)` support

---

_Hare Krishna! Jay Sri Krishna!_
