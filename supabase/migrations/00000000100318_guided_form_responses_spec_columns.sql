-- ============================================================
-- STUDIO-EXPERIENCE ST-A (finding F-04c / audit B9 class)
--
-- guided_form_responses was created (migration 000024) with column names
-- that never matched the founder spec OR the frontend written against it:
--
--   spec + frontend (GuidedFormAssignModal / FillView / ReviewView / Card):
--     section_content TEXT, filled_by ('mom'|'child'), completed_at
--   live table:
--     response_content TEXT NOT NULL, response_metadata JSONB
--
-- Result: EVERY guided-form assignment write has failed since the table was
-- born (missing columns + the NOT NULL family_id the writers also omitted)
-- — the table sits at 0 rows in production, and the Studio guided-form
-- tiles' "Mom fills → assigns → child completes" promise was undeliverable.
--
-- The founder spec (specs/studio-seed-templates.md §Guided Forms —
-- Architecture: "guided_form_responses table: task_id, family_member_id,
-- section_key, section_content TEXT, filled_by ('mom'|'child'),
-- completed_at") is the authority. The table has 0 rows, so renaming the
-- never-written response_content to its spec name is safe and brings the
-- whole existing frontend module into correctness at once.
--
-- Idempotent: guarded by information_schema checks.
-- ============================================================

DO $$
BEGIN
  -- Rename response_content → section_content (spec name). 0 rows; nothing
  -- has ever read or written the old name successfully.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'guided_form_responses'
      AND column_name = 'response_content'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'guided_form_responses'
      AND column_name = 'section_content'
  ) THEN
    ALTER TABLE public.guided_form_responses
      RENAME COLUMN response_content TO section_content;
  END IF;

  -- filled_by: who authored this section's content (spec: 'mom' | 'child')
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'guided_form_responses'
      AND column_name = 'filled_by'
  ) THEN
    ALTER TABLE public.guided_form_responses
      ADD COLUMN filled_by TEXT NOT NULL DEFAULT 'child'
      CHECK (filled_by IN ('mom', 'child'));
  END IF;

  -- completed_at: when the section was completed (mom's sections at assign
  -- time; child's sections at fill time)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'guided_form_responses'
      AND column_name = 'completed_at'
  ) THEN
    ALTER TABLE public.guided_form_responses
      ADD COLUMN completed_at TIMESTAMPTZ;
  END IF;

  -- lila_enabled: whether mom allowed LiLa help on this (child) section
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'guided_form_responses'
      AND column_name = 'lila_enabled'
  ) THEN
    ALTER TABLE public.guided_form_responses
      ADD COLUMN lila_enabled BOOLEAN NOT NULL DEFAULT false;
  END IF;
END $$;
