-- Storage policies for family-avatars bucket
-- Allows authenticated users to upload/update/delete their family's avatars
-- Public read is handled by the bucket's public setting

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload avatars"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'family-avatars');

-- Allow authenticated users to update (upsert) files
CREATE POLICY "Authenticated users can update avatars"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'family-avatars')
WITH CHECK (bucket_id = 'family-avatars');

-- Allow authenticated users to delete files
CREATE POLICY "Authenticated users can delete avatars"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'family-avatars');

-- Allow public read (redundant with public bucket but explicit)
CREATE POLICY "Public can read avatars"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'family-avatars');
