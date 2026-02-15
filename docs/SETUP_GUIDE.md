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

### Summary of All Required Storage Buckets

| Bucket Name | Public | Max Size | MIME Types | Purpose |
|------------|--------|----------|------------|---------|
| `leela` | Yes | 50 MB | video/mp4, video/webm, video/quicktime, video/ogg | Short-form videos (Leela) |
| `avatars` | Yes | 5 MB | image/jpeg, image/png, image/webp, image/gif | User profile pictures |
| `posts` | Yes | 50 MB | image/*, video/* | Post media (images and videos) |
| `statuses` | Yes | 50 MB | image/*, video/* | Story/Status media |
| `chat` | Yes | 25 MB | image/*, video/*, application/pdf, audio/* | Chat attachments |
| `challenges` | Yes | 10 MB | image/*, video/* | Challenge proof submissions |

> **Note:** If any of the above buckets do not already exist, create them following the same steps as the Leela bucket above, adjusting the size limit and MIME types accordingly.

---

## 2. Google AdSense Ad Units

### Existing Ad Units

| # | Unit Name | Type | Placement |
|---|-----------|------|-----------|
| 1 | Profile Not Found | Display | Shown on 404 profile pages |
| 2 | Mid-Post Ad | In-feed | Inserted between posts in the feed |

### New Ad Units to Create

Create the following ad units in your **Google AdSense Dashboard** → **Ads** → **By ad unit**:

| # | Recommended Unit Name | Ad Type | Size / Format | Placement Description |
|---|----------------------|---------|---------------|----------------------|
| 3 | **Profile Sidebar** | Display (Responsive) | Responsive | Right sidebar on user profile pages (desktop only) |
| 4 | **Between Stories** | Display (Responsive) | 300×250 or Responsive | Inserted between every 5th story in the Stories bar viewer |
| 5 | **Explore Grid** | In-feed (Native) | In-feed | Inserted as a tile in the Explore page grid (every 8th position) |
| 6 | **Chat List** | Display (Responsive) | 320×100 (Mobile Banner) | Bottom of the chat list page |
| 7 | **Leela Between Videos** | Display (Responsive) | Responsive (Vertical) | Shown between Leela (short-form) videos every 5th swipe |
| 8 | **Post Detail Sidebar** | Display (Responsive) | 300×250 | Sidebar on the post detail `/post/[id]` page (desktop) |
| 9 | **Notification Page** | Display (Responsive) | 320×100 (Mobile Banner) | Bottom of notification page or between notification groups |
| 10 | **Bookmark Page** | Display (Responsive) | 320×100 | Bottom of the bookmarks page |
| 11 | **Events Page** | Display (Responsive) | Responsive | Between event listings |
| 12 | **Challenges Page** | In-feed (Native) | In-feed | Between challenge cards in the challenges page |

### Steps to Create Each Ad Unit

1. Go to [Google AdSense](https://www.google.com/adsense/) → Sign in
2. Navigate to **Ads** → **By ad unit** → **Create new ad unit**
3. For each unit above:
   - Select the **Ad Type** (Display or In-feed)
   - Enter the **Unit Name** exactly as listed for easy identification
   - Choose the **Size/Format** as recommended
   - Click **Create**
   - Copy the **Ad Unit ID** (e.g., `ca-pub-XXXXXXX/YYYYYYYYYY`)
4. Store the Ad Unit IDs — they will be configured as environment variables or in the ad components

### Ad Placement Guidelines

- **Verified/KCS users** should see fewer or no ads (premium benefit)
- **Do not** place ads inside the Story creator or active call screens
- **Do not** place ads on legal pages (Privacy Policy, Terms, FAQ, Contact)
- **Do not** place ads on the login/signup pages
- Space ads at least 3-5 content items apart to avoid ad fatigue
- Use responsive ad units wherever possible for cross-device compatibility

### Environment Variables for Ad Units

Once the ad units are created, the unit IDs can be configured in your `.env.local`:

```env
# Google AdSense
NEXT_PUBLIC_ADSENSE_CLIENT_ID=ca-pub-3940256099942544

# Ad Unit IDs
NEXT_PUBLIC_AD_PROFILE_SIDEBAR=<unit-id>
NEXT_PUBLIC_AD_BETWEEN_STORIES=<unit-id>
NEXT_PUBLIC_AD_EXPLORE_GRID=<unit-id>
NEXT_PUBLIC_AD_CHAT_LIST=<unit-id>
NEXT_PUBLIC_AD_LEELA_BETWEEN=<unit-id>
NEXT_PUBLIC_AD_POST_DETAIL=<unit-id>
NEXT_PUBLIC_AD_NOTIFICATION=<unit-id>
NEXT_PUBLIC_AD_BOOKMARK=<unit-id>
NEXT_PUBLIC_AD_EVENTS=<unit-id>
NEXT_PUBLIC_AD_CHALLENGES=<unit-id>
```
