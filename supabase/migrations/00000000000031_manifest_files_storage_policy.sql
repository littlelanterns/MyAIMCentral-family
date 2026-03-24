-- Storage policy for manifest-files bucket
-- Users can upload to their own folder and read their own files
-- Service role can read all (for Edge Functions)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'manifest-files', 'manifest-files', false, 52428800,
  ARRAY['application/pdf','text/plain','text/markdown','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/png','image/jpeg','image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Users can upload files to their own member_id folder
CREATE POLICY "Users can upload own files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'manifest-files'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.family_members WHERE user_id = auth.uid()
    )
  );

-- Users can read their own files
CREATE POLICY "Users can read own files" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'manifest-files'
    AND (storage.foldername(name))[1] IN (
      SELECT id::text FROM public.family_members WHERE user_id = auth.uid()
    )
  );
