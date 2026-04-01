-- PRD-14D Phase B: Storage bucket for Hub slideshow images
-- Family-scoped folder structure: hub-slideshow/{family_id}/{filename}
-- Public bucket so images can be displayed without signed URLs

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'hub-slideshow', 'hub-slideshow', true, 10485760,
  ARRAY['image/png','image/jpeg','image/webp','image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Family members can upload to their family's folder
DO $$ BEGIN
  CREATE POLICY "Hub slideshow upload" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (
      bucket_id = 'hub-slideshow'
      AND (storage.foldername(name))[1] IN (
        SELECT family_id::text FROM public.family_members WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Anyone can read (public bucket for Hub display)
DO $$ BEGIN
  CREATE POLICY "Hub slideshow read" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'hub-slideshow');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Family primary parent can delete from their family's folder
DO $$ BEGIN
  CREATE POLICY "Hub slideshow delete" ON storage.objects
    FOR DELETE TO authenticated
    USING (
      bucket_id = 'hub-slideshow'
      AND (storage.foldername(name))[1] IN (
        SELECT family_id::text FROM public.family_members
        WHERE user_id = auth.uid() AND role = 'primary_parent'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
