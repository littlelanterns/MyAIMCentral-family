-- Storage policies for manifest-files bucket (InnerWorkings file uploads)
-- Allows authenticated users to upload and read their files

CREATE POLICY "Authenticated users can upload to manifest-files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'manifest-files');

CREATE POLICY "Authenticated users can read manifest-files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'manifest-files');

CREATE POLICY "Authenticated users can update manifest-files"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'manifest-files')
WITH CHECK (bucket_id = 'manifest-files');

CREATE POLICY "Authenticated users can delete manifest-files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'manifest-files');
