-- Migration: 00000000100136_homeschool_tracking.sql
-- PRD-28 Sub-phase B: Homework subject configuration + time logging
-- Creates: homeschool_subjects, homeschool_configs, homeschool_time_logs
-- Pattern: family-first config with per-child override via nullable family_member_id

-- ============================================================
-- 1. homeschool_subjects — family-wide subject list
-- ============================================================

CREATE TABLE IF NOT EXISTS homeschool_subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  default_weekly_hours DECIMAL(5,2) DEFAULT NULL, -- nullable: targets are opt-in, never pre-populated
  icon_key TEXT, -- Lucide icon name for Play variant display
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true, -- archive only, never delete
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- No duplicate subject names per family
CREATE UNIQUE INDEX IF NOT EXISTS idx_hs_family_name
  ON homeschool_subjects (family_id, name);

-- Active subjects query
CREATE INDEX IF NOT EXISTS idx_hs_family_active
  ON homeschool_subjects (family_id, is_active)
  WHERE is_active = true;

-- RLS
ALTER TABLE homeschool_subjects ENABLE ROW LEVEL SECURITY;

-- Mom full CRUD
CREATE POLICY hs_mom_all ON homeschool_subjects
  FOR ALL
  USING (
    family_id IN (
      SELECT fm.family_id FROM family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  )
  WITH CHECK (
    family_id IN (
      SELECT fm.family_id FROM family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  );

-- Members read own family
CREATE POLICY hs_members_read ON homeschool_subjects
  FOR SELECT
  USING (
    family_id IN (
      SELECT fm.family_id FROM family_members fm
      WHERE fm.user_id = auth.uid()
    )
  );

-- updated_at trigger
CREATE OR REPLACE TRIGGER trg_hs_updated_at
  BEFORE UPDATE ON homeschool_subjects
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 2. homeschool_configs — family-default + per-child override
-- ============================================================

CREATE TABLE IF NOT EXISTS homeschool_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  family_member_id UUID REFERENCES family_members(id) ON DELETE CASCADE, -- NULL = family-wide default
  time_allocation_mode TEXT NOT NULL DEFAULT 'full'
    CHECK (time_allocation_mode IN ('full', 'weighted', 'strict')),
  allow_subject_overlap BOOLEAN NOT NULL DEFAULT true,
  subject_hour_overrides JSONB NOT NULL DEFAULT '{}', -- subject_id -> weekly_hours overrides
  school_year_start DATE, -- nullable: optional school year boundary
  school_year_end DATE,
  term_breaks JSONB NOT NULL DEFAULT '[]', -- [{name, start_date, end_date}]
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- One family-wide default per family (family_member_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_hc_family_default
  ON homeschool_configs (family_id)
  WHERE family_member_id IS NULL;

-- One config per child (family_member_id IS NOT NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_hc_child_unique
  ON homeschool_configs (family_member_id)
  WHERE family_member_id IS NOT NULL;

-- Query by family
CREATE INDEX IF NOT EXISTS idx_hc_family
  ON homeschool_configs (family_id);

-- RLS
ALTER TABLE homeschool_configs ENABLE ROW LEVEL SECURITY;

-- Mom full CRUD
CREATE POLICY hc_mom_all ON homeschool_configs
  FOR ALL
  USING (
    family_id IN (
      SELECT fm.family_id FROM family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  )
  WITH CHECK (
    family_id IN (
      SELECT fm.family_id FROM family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  );

-- Members read own family configs (family default + own child config)
CREATE POLICY hc_members_read ON homeschool_configs
  FOR SELECT
  USING (
    family_id IN (
      SELECT fm.family_id FROM family_members fm
      WHERE fm.user_id = auth.uid()
    )
  );

-- updated_at trigger
CREATE OR REPLACE TRIGGER trg_hc_updated_at
  BEFORE UPDATE ON homeschool_configs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 3. homeschool_time_logs — compliance-ready time records
-- ============================================================

CREATE TABLE IF NOT EXISTS homeschool_time_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  family_member_id UUID NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  subject_id UUID NOT NULL REFERENCES homeschool_subjects(id),
  task_id UUID REFERENCES tasks(id) ON DELETE SET NULL, -- NULL for Log Learning entries without a task
  log_date DATE NOT NULL,
  minutes_logged INTEGER NOT NULL CHECK (minutes_logged > 0),
  allocation_mode_used TEXT NOT NULL
    CHECK (allocation_mode_used IN ('full', 'weighted', 'strict')),
  source TEXT NOT NULL
    CHECK (source IN ('task_completed', 'child_report', 'manual_entry', 'timer_session')),
  source_reference_id UUID, -- FK to source (task_completion_id, time_session_id, etc.)
  status TEXT NOT NULL DEFAULT 'confirmed'
    CHECK (status IN ('pending', 'confirmed', 'rejected')),
  description TEXT,
  approved_by UUID REFERENCES family_members(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Compliance query: hours per subject per child per day
CREATE INDEX IF NOT EXISTS idx_htl_member_subject_date
  ON homeschool_time_logs (family_member_id, subject_id, log_date);

-- All subjects for a child on a date
CREATE INDEX IF NOT EXISTS idx_htl_member_date
  ON homeschool_time_logs (family_member_id, log_date);

-- Family-wide subject queries
CREATE INDEX IF NOT EXISTS idx_htl_family_subject_date
  ON homeschool_time_logs (family_id, subject_id, log_date);

-- Pending approvals
CREATE INDEX IF NOT EXISTS idx_htl_status
  ON homeschool_time_logs (status)
  WHERE status = 'pending';

-- Source traceability
CREATE INDEX IF NOT EXISTS idx_htl_source_ref
  ON homeschool_time_logs (source, source_reference_id)
  WHERE source_reference_id IS NOT NULL;

-- RLS
ALTER TABLE homeschool_time_logs ENABLE ROW LEVEL SECURITY;

-- Mom reads all, writes all
CREATE POLICY htl_mom_all ON homeschool_time_logs
  FOR ALL
  USING (
    family_id IN (
      SELECT fm.family_id FROM family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  )
  WITH CHECK (
    family_id IN (
      SELECT fm.family_id FROM family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  );

-- Members read own
CREATE POLICY htl_members_read ON homeschool_time_logs
  FOR SELECT
  USING (
    family_member_id IN (
      SELECT fm.id FROM family_members fm
      WHERE fm.user_id = auth.uid()
    )
  );

-- Children INSERT with status='pending' only
CREATE POLICY htl_children_insert ON homeschool_time_logs
  FOR INSERT
  WITH CHECK (
    status = 'pending'
    AND family_member_id IN (
      SELECT fm.id FROM family_members fm
      WHERE fm.user_id = auth.uid()
    )
  );

-- updated_at trigger
CREATE OR REPLACE TRIGGER trg_htl_updated_at
  BEFORE UPDATE ON homeschool_time_logs
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 4. Extend family_requests source CHECK to include new sources
-- ============================================================

-- Add 'homeschool_child_report' and 'financial_approval' to the source CHECK constraint
-- Rebuild-enum pattern: DROP old constraint, ADD new one with all values
ALTER TABLE public.family_requests DROP CONSTRAINT IF EXISTS family_requests_source_check;
ALTER TABLE public.family_requests ADD CONSTRAINT family_requests_source_check
  CHECK (source IN ('quick_request', 'notepad_route', 'mindsweep_auto', 'homeschool_child_report', 'financial_approval'));

-- ============================================================
-- Verification
-- ============================================================

DO $$
BEGIN
  RAISE NOTICE 'homeschool_subjects table: %', (SELECT count(*) FROM homeschool_subjects);
  RAISE NOTICE 'homeschool_configs table: %', (SELECT count(*) FROM homeschool_configs);
  RAISE NOTICE 'homeschool_time_logs table: %', (SELECT count(*) FROM homeschool_time_logs);
END $$;
