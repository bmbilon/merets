-- Fix Storage RLS Policies for Photo Uploads
-- This allows authenticated users to upload and view photos in the submission-photos bucket

-- First, ensure the bucket exists (if not, create it)
INSERT INTO storage.buckets (id, name, public)
VALUES ('submission-photos', 'submission-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to upload submission photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view submission photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own photos" ON storage.objects;

-- Create new policies for submission-photos bucket

-- 1. Allow authenticated users to upload photos
CREATE POLICY "Allow authenticated uploads"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'submission-photos');

-- 2. Allow public read access (so photos can be viewed)
CREATE POLICY "Allow public reads"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'submission-photos');

-- 3. Allow users to delete their own photos (optional, for cleanup)
CREATE POLICY "Allow users to delete their own photos"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'submission-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Verify the policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'objects'
  AND policyname LIKE '%submission%'
ORDER BY policyname;
