-- PRD-25: Guided Dashboard Phase A
-- Creates spelling_coaching_cache table (for Phase B usage)
-- Registers feature keys for Guided Dashboard

-- ─── spelling_coaching_cache ────────────────────────────────
-- Global spelling coaching cache — grows as AI generates explanations for new words
CREATE TABLE IF NOT EXISTS spelling_coaching_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  misspelling TEXT NOT NULL,
  correction TEXT NOT NULL,
  explanation TEXT NOT NULL,
  source TEXT NOT NULL DEFAULT 'ai_generated' CHECK (source IN ('seed_data', 'ai_generated')),
  language TEXT NOT NULL DEFAULT 'en',
  usage_count INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Unique constraint on misspelling+language to prevent duplicates
CREATE UNIQUE INDEX IF NOT EXISTS idx_scc_misspelling_lang
  ON spelling_coaching_cache (lower(misspelling), language);

-- Index for lookup performance
CREATE INDEX IF NOT EXISTS idx_scc_correction
  ON spelling_coaching_cache (lower(correction));

-- RLS: public read (all users benefit), only service_role writes (Edge Function)
ALTER TABLE spelling_coaching_cache ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'spelling_coaching_cache' AND policyname = 'Anyone can read spelling cache'
  ) THEN
    CREATE POLICY "Anyone can read spelling cache"
      ON spelling_coaching_cache FOR SELECT
      USING (true);
  END IF;
END $$;

-- Trigger for updated_at
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'set_spelling_coaching_cache_updated_at'
  ) THEN
    CREATE TRIGGER set_spelling_coaching_cache_updated_at
      BEFORE UPDATE ON spelling_coaching_cache
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
  END IF;
END $$;

-- ─── Feature keys ───────────────────────────────────────────
INSERT INTO feature_key_registry (feature_key, display_name, description, prd_source)
VALUES
  ('guided_dashboard', 'Guided Dashboard', 'Guided member dashboard with sections and NBT engine', 'PRD-25'),
  ('guided_nbt', 'Next Best Thing Engine', 'Deterministic task suggestion engine for Guided dashboard', 'PRD-25'),
  ('guided_best_intentions', 'Guided Best Intentions', 'Best Intentions section on Guided dashboard', 'PRD-25'),
  ('guided_reading_support', 'Reading Support', 'TTS icons, larger font, icon pairing for Guided members', 'PRD-25'),
  ('guided_spelling_coaching', 'Spelling Coaching', 'Teaching explanations with spell check corrections', 'PRD-25'),
  ('guided_reflections', 'Guided Reflections', 'Reflection prompts in Write drawer and celebrations', 'PRD-25'),
  ('guided_write_drawer', 'Write Drawer', 'Multi-tab Write drawer for Guided shell', 'PRD-25')
ON CONFLICT (feature_key) DO NOTHING;
