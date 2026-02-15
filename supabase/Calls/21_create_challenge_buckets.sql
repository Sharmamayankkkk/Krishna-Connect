-- ============================================================
-- 21_create_challenge_buckets.sql (FIXED)
-- Creates storage buckets for challenges and sets up RLS policies.
-- ============================================================

-- 1. Create the 'challenges' bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'challenges', 
  'challenges', 
  true, 
  10485760, -- 10MB limit
  ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET 
  public = true,
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

-- 2. Policies for 'challenges' bucket

-- Drop existing policies if they conflict (cleanup)
DROP POLICY IF EXISTS "Public Access Challenges" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload Challenges" ON storage.objects;
DROP POLICY IF EXISTS "Users Update Own Challenges" ON storage.objects;
DROP POLICY IF EXISTS "Users Delete Own Challenges" ON storage.objects;

-- Allow public read of all files in 'challenges' bucket
CREATE POLICY "Public Access Challenges"
ON storage.objects FOR SELECT
USING ( bucket_id = 'challenges' );

-- Allow authenticated users to upload files to 'challenges' bucket
CREATE POLICY "Authenticated Upload Challenges"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'challenges' 
  AND auth.role() = 'authenticated'
);

-- Allow users to update their own files (if needed)
CREATE POLICY "Users Update Own Challenges"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'challenges' 
  AND auth.uid() = owner
);

-- Allow users to delete their own files
CREATE POLICY "Users Delete Own Challenges"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'challenges' 
  AND auth.uid() = owner
);

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
