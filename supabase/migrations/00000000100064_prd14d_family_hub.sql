-- PRD-14D: Family Hub — Phase A tables + calendar_events.show_on_hub + feature keys
-- 4 new tables: family_hub_configs, family_best_intentions, family_intention_iterations, countdowns
-- 1 column addition: calendar_events.show_on_hub

-- ═══════════════════════════════════════════════════════════════════════════════
-- 1. family_hub_configs — one row per family (UNIQUE on family_id)
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS family_hub_configs (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id         UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,

  -- Hub appearance
  hub_title         TEXT DEFAULT NULL,               -- NULL = "[Family Name] Hub"
  theme_override    TEXT DEFAULT NULL,               -- Theme ID override, NULL = family default

  -- Section configuration
  section_order     TEXT[] NOT NULL DEFAULT '{family_calendar,family_best_intentions,victories_summary,countdowns,widget_grid,member_access}',
  section_visibility JSONB NOT NULL DEFAULT '{}',    -- section_key → boolean. Missing keys default true.

  -- Victory display settings
  victory_settings  JSONB NOT NULL DEFAULT '{"show_count": true, "include_teens": true, "celebrate_pin_required": true}',

  -- Slideshow configuration (Phase B — column included now to avoid second migration)
  slideshow_config  JSONB NOT NULL DEFAULT '{}',

  -- TV mode configuration (PRD-14E — column included now to avoid second migration)
  tv_config         JSONB DEFAULT NULL,

  -- Hub Mode PIN (hashed, NULL = Hub Mode not configured)
  hub_pin           TEXT DEFAULT NULL,

  -- Preferences (onboarding_dismissed, etc.)
  preferences       JSONB NOT NULL DEFAULT '{}',

  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_fhc_family UNIQUE (family_id)
);

CREATE INDEX IF NOT EXISTS idx_fhc_family ON family_hub_configs (family_id);

ALTER TABLE family_hub_configs ENABLE ROW LEVEL SECURITY;

-- All family members can read the Hub config
DO $$ BEGIN
  CREATE POLICY "fhc_select_family"
    ON family_hub_configs FOR SELECT
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
  CREATE POLICY "fhc_insert_parent"
    ON family_hub_configs FOR INSERT
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
  CREATE POLICY "fhc_update_parent"
    ON family_hub_configs FOR UPDATE
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
  CREATE POLICY "fhc_delete_parent"
    ON family_hub_configs FOR DELETE
    TO authenticated
    USING (
      family_id IN (
        SELECT family_id FROM family_members
        WHERE user_id = auth.uid() AND role = 'primary_parent'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Updated_at trigger
DROP TRIGGER IF EXISTS trg_fhc_updated_at ON family_hub_configs;
CREATE TRIGGER trg_fhc_updated_at
  BEFORE UPDATE ON family_hub_configs
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();


-- ═══════════════════════════════════════════════════════════════════════════════
-- 2. family_best_intentions — family-level intentions
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS family_best_intentions (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id               UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  created_by_member_id    UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,

  title                   TEXT NOT NULL,
  description             TEXT DEFAULT NULL,
  participating_member_ids UUID[] NOT NULL,
  require_pin_to_tally    BOOLEAN NOT NULL DEFAULT false,
  is_active               BOOLEAN NOT NULL DEFAULT true,
  is_included_in_ai       BOOLEAN NOT NULL DEFAULT true,
  sort_order              INTEGER NOT NULL DEFAULT 0,
  archived_at             TIMESTAMPTZ DEFAULT NULL,

  created_at              TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fbi_family_active
  ON family_best_intentions (family_id, is_active, archived_at);
CREATE INDEX IF NOT EXISTS idx_fbi_family_ai
  ON family_best_intentions (family_id, is_included_in_ai, archived_at);

ALTER TABLE family_best_intentions ENABLE ROW LEVEL SECURITY;

-- All family members can read active, non-archived intentions
DO $$ BEGIN
  CREATE POLICY "fbi_select_family"
    ON family_best_intentions FOR SELECT
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
  CREATE POLICY "fbi_insert_parent"
    ON family_best_intentions FOR INSERT
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
  CREATE POLICY "fbi_update_parent"
    ON family_best_intentions FOR UPDATE
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
  CREATE POLICY "fbi_delete_parent"
    ON family_best_intentions FOR DELETE
    TO authenticated
    USING (
      family_id IN (
        SELECT family_id FROM family_members
        WHERE user_id = auth.uid() AND role = 'primary_parent'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_fbi_updated_at ON family_best_intentions;
CREATE TRIGGER trg_fbi_updated_at
  BEFORE UPDATE ON family_best_intentions
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();


-- ═══════════════════════════════════════════════════════════════════════════════
-- 3. family_intention_iterations — one row per tally tap
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS family_intention_iterations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id     UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  intention_id  UUID NOT NULL REFERENCES family_best_intentions(id) ON DELETE CASCADE,
  member_id     UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  day_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_fii_intention_day
  ON family_intention_iterations (intention_id, day_date);
CREATE INDEX IF NOT EXISTS idx_fii_intention_member_day
  ON family_intention_iterations (intention_id, member_id, day_date);
CREATE INDEX IF NOT EXISTS idx_fii_family
  ON family_intention_iterations (family_id);

ALTER TABLE family_intention_iterations ENABLE ROW LEVEL SECURITY;

-- All family members can read tallies (needed to render Hub display)
DO $$ BEGIN
  CREATE POLICY "fii_select_family"
    ON family_intention_iterations FOR SELECT
    TO authenticated
    USING (
      family_id IN (
        SELECT family_id FROM family_members WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Family members can insert their own tally rows
DO $$ BEGIN
  CREATE POLICY "fii_insert_own"
    ON family_intention_iterations FOR INSERT
    TO authenticated
    WITH CHECK (
      member_id IN (
        SELECT id FROM family_members WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Primary parent can also insert for any member (Hub attribution pattern)
DO $$ BEGIN
  CREATE POLICY "fii_insert_parent"
    ON family_intention_iterations FOR INSERT
    TO authenticated
    WITH CHECK (
      family_id IN (
        SELECT family_id FROM family_members
        WHERE user_id = auth.uid() AND role = 'primary_parent'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Only primary_parent can delete (to correct accidental taps)
DO $$ BEGIN
  CREATE POLICY "fii_delete_parent"
    ON family_intention_iterations FOR DELETE
    TO authenticated
    USING (
      family_id IN (
        SELECT family_id FROM family_members
        WHERE user_id = auth.uid() AND role = 'primary_parent'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- 4. countdowns — countdown events displayed on Hub
-- ═══════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS countdowns (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id             UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  created_by_member_id  UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,

  title                 TEXT NOT NULL,
  emoji                 TEXT DEFAULT NULL,
  target_date           DATE NOT NULL,
  show_on_target_day    BOOLEAN NOT NULL DEFAULT true,
  is_active             BOOLEAN NOT NULL DEFAULT true,
  recurring_annually    BOOLEAN NOT NULL DEFAULT false,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_cd_family_active_date
  ON countdowns (family_id, is_active, target_date);

ALTER TABLE countdowns ENABLE ROW LEVEL SECURITY;

-- All family members can read active countdowns
DO $$ BEGIN
  CREATE POLICY "cd_select_family"
    ON countdowns FOR SELECT
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
  CREATE POLICY "cd_insert_parent"
    ON countdowns FOR INSERT
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
  CREATE POLICY "cd_update_parent"
    ON countdowns FOR UPDATE
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
  CREATE POLICY "cd_delete_parent"
    ON countdowns FOR DELETE
    TO authenticated
    USING (
      family_id IN (
        SELECT family_id FROM family_members
        WHERE user_id = auth.uid() AND role = 'primary_parent'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DROP TRIGGER IF EXISTS trg_cd_updated_at ON countdowns;
CREATE TRIGGER trg_cd_updated_at
  BEFORE UPDATE ON countdowns
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();


-- ═══════════════════════════════════════════════════════════════════════════════
-- 5. calendar_events.show_on_hub column
-- ═══════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'calendar_events' AND column_name = 'show_on_hub'
  ) THEN
    ALTER TABLE calendar_events ADD COLUMN show_on_hub BOOLEAN NOT NULL DEFAULT true;
  END IF;
END $$;


-- ═══════════════════════════════════════════════════════════════════════════════
-- 6. Feature keys
-- ═══════════════════════════════════════════════════════════════════════════════

INSERT INTO feature_key_registry (feature_key, display_name, description, prd_source)
VALUES
  ('family_hub', 'Family Hub', 'Shared family coordination surface — calendar, intentions, countdowns, widgets, member access', 'PRD-14D'),
  ('family_hub_best_intentions', 'Family Best Intentions', 'Family-level intentions with per-member tally tracking', 'PRD-14D'),
  ('family_hub_slideshow', 'Hub Slideshow Frame', 'Digital picture frame with photos, word art, text, and Guiding Stars auto-feed', 'PRD-14D'),
  ('family_hub_tv_route', 'Hub TV Mode', 'Smart TV rendering at /hub/tv with D-pad navigation and ambient mode', 'PRD-14E')
ON CONFLICT (feature_key) DO NOTHING;
