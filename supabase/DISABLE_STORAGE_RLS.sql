-- Disable RLS for Storage - Allow Uploads Without Authentication
-- This is necessary because the app uses custom auth (user_profiles) not Supabase Auth
-- Safe for family apps where all users are trusted

-- Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('commitment-photos', 'commitment-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop ALL existing policies to start completely fresh
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON storage.objects;
DROP POLICY IF EXISTS "Allow public to view photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads commitment" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads commitment" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete commitment photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to upload submission photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view submission photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own photos" ON storage.objects;

-- Create policies that work with anon (unauthenticated) users
-- This allows the app to upload without Supabase Auth sessions

-- 1. Allow ANYONE (including anon) to upload to commitment-photos
CREATE POLICY "Allow anon uploads to commitment-photos"
ON storage.objects
FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'commitment-photos');

-- 2. Allow ANYONE to read from commitment-photos
CREATE POLICY "Allow anon reads from commitment-photos"
ON storage.objects
FOR SELECT
TO anon, authenticated, public
USING (bucket_id = 'commitment-photos');

-- 3. Allow ANYONE to update/delete (for cleanup)
CREATE POLICY "Allow anon updates to commitment-photos"
ON storage.objects
FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'commitment-photos')
WITH CHECK (bucket_id = 'commitment-photos');

CREATE POLICY "Allow anon deletes from commitment-photos"
ON storage.objects
FOR DELETE
TO anon, authenticated
USING (bucket_id = 'commitment-photos');

-- Verify the setup
SELECT * FROM storage.buckets WHERE id = 'commitment-photos';

SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'objects'
  AND bucket_id = 'commitment-photos'
ORDER BY policyname;
