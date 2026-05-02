-- Phase 3 Connector Architecture — Sub-task 1
-- Central contracts table: the switchboard connecting deeds to godmothers.

-- ─── contracts table ─────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.contracts (
  -- Identity
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id       UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  created_by      UUID NOT NULL REFERENCES public.family_members(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

  -- Lifecycle
  status          TEXT NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'recently_deleted', 'archived')),
  deleted_at      TIMESTAMPTZ,
  archived_at     TIMESTAMPTZ,

  -- Deed end (polymorphic addressing)
  source_type     TEXT NOT NULL
                    CHECK (source_type IN (
                      'task_completion',
                      'routine_step_completion',
                      'list_item_completion',
                      'intention_iteration',
                      'widget_data_point',
                      'tracker_widget_event',
                      'time_session_ended',
                      'scheduled_occurrence_active',
                      'opportunity_claimed',
                      'randomizer_drawn'
                    )),
  source_id       UUID,                       -- NULL = any source of this type (family-default)
  source_category TEXT,                       -- optional category filter (e.g., 'chores', 'school')
  family_member_id UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
                                              -- NULL = all kids in family

  -- The IF (qualification logic)
  if_pattern      TEXT NOT NULL
                    CHECK (if_pattern IN (
                      'every_time',
                      'every_nth',
                      'on_threshold_cross',
                      'above_daily_floor',
                      'above_window_floor',
                      'within_date_range',
                      'streak',
                      'calendar'
                    )),
  if_n            INTEGER,                    -- for every_nth
  if_floor        INTEGER,                    -- for above_daily_floor, above_window_floor
  if_window_kind  TEXT                        -- for above_window_floor
                    CHECK (if_window_kind IS NULL OR if_window_kind IN ('day', 'week', 'month')),
  if_window_starts_at TIMESTAMPTZ,            -- for within_date_range
  if_window_ends_at   TIMESTAMPTZ,            -- for within_date_range
  if_calendar_pattern JSONB,                  -- for calendar IF (rrule-based)
  if_offset       INTEGER NOT NULL DEFAULT 0, -- offset before IF evaluates

  -- Godmother end
  godmother_type  TEXT NOT NULL
                    CHECK (godmother_type IN (
                      'allowance_godmother',
                      'numerator_godmother',
                      'money_godmother',
                      'points_godmother',
                      'prize_godmother',
                      'victory_godmother',
                      'family_victory_godmother',
                      'custom_reward_godmother',
                      'assign_task_godmother'
                    )),
  godmother_config_id UUID,                   -- FK to per-godmother config table (NULL = inline payload)

  -- Payload (inline for simple godmothers)
  payload_amount  DECIMAL,                    -- dollar amount, point amount, etc.
  payload_text    TEXT,                        -- custom reward description, victory text, etc.
  payload_config  JSONB,                      -- complex payloads (assign_task template config, etc.)

  -- stroke_of (timing)
  stroke_of       TEXT NOT NULL DEFAULT 'immediate'
                    CHECK (stroke_of IN (
                      'immediate',
                      'end_of_day',
                      'end_of_week',
                      'end_of_period',
                      'at_specific_time',
                      'custom'
                    )),
  stroke_of_time  TIME,                       -- for at_specific_time
  recurrence_details JSONB,                   -- for custom (Universal Scheduler output format)

  -- Inheritance
  inheritance_level TEXT NOT NULL DEFAULT 'family_default'
                    CHECK (inheritance_level IN ('family_default', 'kid_override', 'deed_override')),
  override_mode   TEXT NOT NULL DEFAULT 'replace'
                    CHECK (override_mode IN ('replace', 'add', 'remove')),

  -- Presentation
  presentation_mode TEXT NOT NULL DEFAULT 'silent'
                    CHECK (presentation_mode IN ('silent', 'toast', 'reveal_animation', 'treasure_box')),
  presentation_config JSONB
);

-- ─── Indexes ─────────────────────────────────────────────────────────

-- Contract lookup on deed firing
CREATE INDEX IF NOT EXISTS contracts_deed_lookup_idx
  ON public.contracts (family_id, source_type, family_member_id, godmother_type)
  WHERE status = 'active';

-- Active contract listing
CREATE INDEX IF NOT EXISTS contracts_family_status_idx
  ON public.contracts (family_id, status);

-- Inheritance resolution
CREATE INDEX IF NOT EXISTS contracts_inheritance_idx
  ON public.contracts (family_id, family_member_id, source_type, inheritance_level)
  WHERE status = 'active';

-- Partial unique: one family_default per (family, source_type, godmother_type)
CREATE UNIQUE INDEX IF NOT EXISTS contracts_unique_family_default_idx
  ON public.contracts (family_id, source_type, godmother_type)
  WHERE status = 'active'
    AND inheritance_level = 'family_default'
    AND source_id IS NULL
    AND family_member_id IS NULL;

-- Partial unique: one kid_override per (family, kid, source_type, godmother_type)
CREATE UNIQUE INDEX IF NOT EXISTS contracts_unique_kid_override_idx
  ON public.contracts (family_id, family_member_id, source_type, godmother_type)
  WHERE status = 'active'
    AND inheritance_level = 'kid_override'
    AND source_id IS NULL
    AND family_member_id IS NOT NULL;

-- Partial unique: one deed_override per (source_id, kid, godmother_type)
CREATE UNIQUE INDEX IF NOT EXISTS contracts_unique_deed_override_idx
  ON public.contracts (source_id, family_member_id, godmother_type)
  WHERE status = 'active'
    AND inheritance_level = 'deed_override'
    AND source_id IS NOT NULL;

-- ─── updated_at trigger ──────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.contracts_update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_contracts_updated_at ON public.contracts;
CREATE TRIGGER trg_contracts_updated_at
  BEFORE UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.contracts_update_timestamp();

-- ─── RLS ─────────────────────────────────────────────────────────────

ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Mom (primary_parent) can do everything within her family
CREATE POLICY contracts_mom_all ON public.contracts
  FOR ALL
  USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  )
  WITH CHECK (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid() AND fm.role = 'primary_parent'
    )
  );

-- Other family members can read contracts that affect them
CREATE POLICY contracts_member_read ON public.contracts
  FOR SELECT
  USING (
    family_id IN (
      SELECT fm.family_id FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
    )
    AND (
      family_member_id IS NULL
      OR family_member_id IN (
        SELECT fm.id FROM public.family_members fm
        WHERE fm.user_id = auth.uid()
      )
    )
  );

RAISE NOTICE 'migration 100199: contracts table created with RLS and indexes';
