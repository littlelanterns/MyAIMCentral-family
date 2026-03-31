-- PRD-14C: Family Overview — family_overview_configs table
-- Per-member configuration for the Family Overview perspective tab.
-- PRD schema is authoritative: family_member_id UNIQUE (not family_id UNIQUE).

-- ─── Table ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS family_overview_configs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id       UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,

  -- Which members appear as columns (empty = first-time default: all children)
  selected_member_ids UUID[] NOT NULL DEFAULT '{}',

  -- Column ordering (empty = use family_members sort_order)
  column_order     UUID[] NOT NULL DEFAULT '{}',

  -- Section keys in display order
  section_order    TEXT[] NOT NULL DEFAULT '{events,tasks,best_intentions,trackers,weekly_completion,opportunities,victories}',

  -- Row-level collapse + per-column overrides
  -- Shape: {"tasks": {"collapsed": false, "overrides": {"<member_id>": true}}, ...}
  section_states   JSONB NOT NULL DEFAULT '{}',

  -- Calendar section collapse
  calendar_collapsed BOOLEAN NOT NULL DEFAULT false,

  -- Extensible preferences (calendar_view, onboarding_dismissed, etc.)
  preferences      JSONB NOT NULL DEFAULT '{}',

  created_at       TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT now(),

  CONSTRAINT uq_foc_member UNIQUE (family_member_id)
);

-- ─── Indexes ─────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_foc_family ON family_overview_configs (family_id);

-- ─── RLS ─────────────────────────────────────────────────────────────────────
ALTER TABLE family_overview_configs ENABLE ROW LEVEL SECURITY;

-- Members can read their own config
DO $$ BEGIN
  CREATE POLICY "foc_select_own"
    ON family_overview_configs FOR SELECT
    TO authenticated
    USING (
      family_member_id IN (
        SELECT id FROM family_members WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Mom (primary_parent) can read any family member's config
DO $$ BEGIN
  CREATE POLICY "foc_select_parent"
    ON family_overview_configs FOR SELECT
    TO authenticated
    USING (
      family_id IN (
        SELECT family_id FROM family_members
        WHERE user_id = auth.uid() AND role = 'primary_parent'
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Members can insert their own config (first access auto-create)
DO $$ BEGIN
  CREATE POLICY "foc_insert_own"
    ON family_overview_configs FOR INSERT
    TO authenticated
    WITH CHECK (
      family_member_id IN (
        SELECT id FROM family_members WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Members can update their own config
DO $$ BEGIN
  CREATE POLICY "foc_update_own"
    ON family_overview_configs FOR UPDATE
    TO authenticated
    USING (
      family_member_id IN (
        SELECT id FROM family_members WHERE user_id = auth.uid()
      )
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Service role full access
DO $$ BEGIN
  CREATE POLICY "foc_service_all"
    ON family_overview_configs FOR ALL
    TO service_role
    USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── Trigger ─────────────────────────────────────────────────────────────────
CREATE OR REPLACE TRIGGER trg_foc_updated_at
  BEFORE UPDATE ON family_overview_configs
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

-- ─── Feature keys (family_overview already registered in migration 00000000000009) ──
INSERT INTO feature_key_registry (feature_key, display_name, description, prd_source)
VALUES
  ('family_overview_ai', 'Family Overview AI', 'AI digest and forecast sections within Family Overview', 'PRD-14C')
ON CONFLICT (feature_key) DO NOTHING;
