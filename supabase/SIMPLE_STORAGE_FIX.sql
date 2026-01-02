-- Simple Storage Fix - Allow All Operations on commitment-photos bucket
-- This is the simplest approach for a family app where all users should be able to upload

-- Ensure the bucket exists and is public
INSERT INTO storage.buckets (id, name, public)
VALUES ('commitment-photos', 'commitment-photos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop ALL existing policies on storage.objects to start fresh
DROP POLICY IF EXISTS "Allow authenticated uploads commitment" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads commitment" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete commitment photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow public reads" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to upload submission photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to view submission photos" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own photos" ON storage.objects;

-- Create ONE simple policy that allows ALL operations for authenticated users
CREATE POLICY "Allow all operations for authenticated users"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'commitment-photos')
WITH CHECK (bucket_id = 'commitment-photos');

-- Also allow public reads
CREATE POLICY "Allow public to view photos"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'commitment-photos');

-- Verify the bucket and policies
SELECT * FROM storage.buckets WHERE id = 'commitment-photos';

SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'objects'
  AND (policyname LIKE '%commitment%' OR policyname LIKE '%all operations%')
ORDER BY policyname;
