# Krishna Connect — Setup Guide

## Table of Contents

1. [Supabase Storage Bucket Setup](#1-supabase-storage-bucket-setup)
2. [Google AdSense Ad Units](#2-google-adsense-ad-units)

---

## 1. Supabase Storage Bucket Setup

### Leela (Short-Form Videos) Bucket

**Bucket Name:** `leela`

#### Steps on Supabase Dashboard

1. Go to **Supabase Dashboard** → Select your project
2. Navigate to **Storage** (left sidebar)
3. Click **New Bucket**
4. Configure:
   - **Name:** `leela`
   - **Public bucket:** ✅ Yes (videos need to be publicly accessible for playback)
   - **File size limit:** `52428800` (50 MB)
   - **Allowed MIME types:** `video/mp4, video/webm, video/quicktime, video/ogg`
5. Click **Create Bucket**

#### RLS Policies for `leela` Bucket

After creating the bucket, add these Storage policies:

**Policy 1 — Anyone can view Leela videos:**

```sql
CREATE POLICY "Public read access for leela"
ON storage.objects FOR SELECT
USING (bucket_id = 'leela');
```

**Policy 2 — Authenticated users can upload:**

```sql
CREATE POLICY "Authenticated users can upload leela"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'leela'
  AND auth.role() = 'authenticated'
);
```

**Policy 3 — Users can delete their own videos:**

```sql
CREATE POLICY "Users can delete own leela"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'leela'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Upload Path Convention

Videos should be uploaded with the path: `{user_id}/{uuid}.mp4`

Example: `a1b2c3d4/550e8400-e29b-41d4-a716-446655440000.mp4`

---

### All Storage Buckets

These are the **4 buckets** used by Krishna Connect:

| Bucket Name | Public | Purpose | Used By |
|------------|--------|---------|---------|
| `leela` | Yes | Short-form videos (Leela) | `leela/page.tsx` — upload & playback |
| `post_media` | Yes | Post images and videos | `create-post.tsx`, `edit-post-dialog.tsx` — post media uploads |
| `story` | Yes | Story/Status media (images & videos) | `api/status/route.ts` — story creation & deletion |
| `attachments` | Yes | User avatars, chat files, event images, group images | `chat-input.tsx`, `create-event-dialog.tsx`, `edit-group-dialog.tsx`, user profile avatars |

> **Note:** All 4 buckets should already exist on your Supabase project. If `leela` is missing, follow the setup steps above to create it.

---

## 2. Google AdSense Ad Units

**AdSense Client ID:** `ca-pub-4172622079471868`

### All Ad Units

| # | Unit Name | Slot ID | Type | Placement | File |
|---|-----------|---------|------|-----------|------|
| 1 | Profile Not Found | `6010040695` | Display | Shown on 404 profile pages | `profile/[username]/page.tsx` |
| 2 | Mid-Post Ad | `6096829313` | In-feed | Between posts in feed (every 5th) | `google-in-feed-ad.tsx` |
| 3 | Profile Sidebar | `8691086496` | Display | Below tabs on profile page | `profile-view.tsx` |
| 4 | Between Stories | `2513515369` | Display | After stories bar on feed | `feed/page.tsx` |
| 5 | Explore In-Feed | `6261188688` | In-feed (fluid) | Before explore grid | `explore/page.tsx` |
| 6 | Leela Between Videos | `2321943672` | Display | Overlay every 3rd video | `leela/page.tsx` |
| 7 | Post Detail | `2052584005` | Display | After comments on post detail | `post-view.tsx` |
| 8 | Events Page | `1561629410` | Display | After event listings | `events/page.tsx` |

### Pages WITHOUT Ads (by design)

- `/chat` — Chat list and conversations (disruptive to messaging UX)
- `/notifications` — Notification page
- `/bookmarks` — Bookmark collections
- `/challenges` — Challenges page
- Legal pages (Privacy, Terms, FAQ, Contact)
- Auth pages (Login, Signup, Forgot Password)
- Story creator and active call screens

### Ad Placement Guidelines

- **Verified/KCS users** should see fewer or no ads (premium benefit)
- Space ads at least 3-5 content items apart to avoid ad fatigue
- Use responsive ad units wherever possible for cross-device compatibility
- All ad units are implemented using the reusable `GoogleAd` component from `@/components/ads/google-ad`

### Environment Variables

```env
# Google AdSense
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-4172622079471868
```
