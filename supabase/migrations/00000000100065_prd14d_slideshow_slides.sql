-- PRD-14D Phase B: slideshow_slides table
-- Individual slides in the Hub slideshow frame.
-- Content: uploaded photos/art, word art, typed text, Guiding Stars auto-feed.

CREATE TABLE IF NOT EXISTS slideshow_slides (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id               UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  -- Slide content type determines timer tier and rendering
  slide_type              TEXT NOT NULL CHECK (slide_type IN ('image_photo', 'image_word_art', 'text', 'guiding_star_auto')),

  -- Image URL for photo/art and word art slides (Supabase Storage)
  image_url               TEXT DEFAULT NULL,

  -- Body text for typed text slides (rendered in Hub theme)
  text_body               TEXT DEFAULT NULL,

  -- Source reference for auto-generated Guiding Star slides
  source_guiding_star_id  UUID DEFAULT NULL REFERENCES guiding_stars(id) ON DELETE SET NULL,

  sort_order              INTEGER NOT NULL DEFAULT 0,
  is_active               BOOLEAN NOT NULL DEFAULT true,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_ss_family_active_order
  ON slideshow_slides (family_id, is_active, sort_order);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE slideshow_slides ENABLE ROW LEVEL SECURITY;

-- All family members can read (needed to render slideshow)
DO $$ BEGIN
  CREATE POLICY "ss_select_family"
    ON slideshow_slides FOR SELECT
    TO authenticated
    USING (
      family_id IN (
        SELECT family_id FROM family_members WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Only primary_parent can insert
DO $$ BEGIN
  CREATE POLICY "ss_insert_parent"
    ON slideshow_slides FOR INSERT
    TO authenticated
    WITH CHECK (
      family_id IN (
        SELECT family_id FROM family_members
        WHERE user_id = auth.uid() AND role = 'primary_parent'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Only primary_parent can update
DO $$ BEGIN
  CREATE POLICY "ss_update_parent"
    ON slideshow_slides FOR UPDATE
    TO authenticated
    USING (
      family_id IN (
        SELECT family_id FROM family_members
        WHERE user_id = auth.uid() AND role = 'primary_parent'
      )
    )
    WITH CHECK (
      family_id IN (
        SELECT family_id FROM family_members
        WHERE user_id = auth.uid() AND role = 'primary_parent'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Only primary_parent can delete
DO $$ BEGIN
  CREATE POLICY "ss_delete_parent"
    ON slideshow_slides FOR DELETE
    TO authenticated
    USING (
      family_id IN (
        SELECT family_id FROM family_members
        WHERE user_id = auth.uid() AND role = 'primary_parent'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
