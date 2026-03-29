-- ============================================================
-- PRD-14B: Calendar System
-- Reconciled against PRD-14B, PRD-35, and founder-approved
-- consolidated update spec (2026-03-28).
--
-- Tables: event_categories, calendar_events, event_attendees,
--         calendar_settings
-- Column: family_members.calendar_color (ADD IF NOT EXISTS)
--
-- Key schema decisions (from consolidated spec):
--   - Date storage: separate event_date DATE + start_time TIME
--     + end_time TIME + end_date DATE (not combined TIMESTAMPTZ)
--   - Recurrence: recurrence_details JSONB (RRULE) + recurrence_rule
--     TEXT quick-filter. No individual recurrence columns.
--   - Category: category_id UUID FK (not text slug)
--   - items_to_bring: JSONB [{text, checked, ai_suggested}]
--   - transportation_notes TEXT (PRD naming)
--   - reminder_minutes INTEGER[] (array for multiple reminders)
--   - 11 system categories per PRD-14B Decision #15
--   - default_drive_time_minutes DEFAULT 30 (per PRD)
-- ============================================================

-- ─────────────────────────────────────────────────────────────
-- 1. event_categories
--    family_id IS NULL = system-level default category
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_categories (
  id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id  UUID          REFERENCES families(id) ON DELETE CASCADE,
  name       VARCHAR(100)  NOT NULL,
  slug       TEXT          NOT NULL,
  icon       VARCHAR(50)   NOT NULL DEFAULT 'calendar-days',
  color      VARCHAR(7),
  is_system  BOOLEAN       NOT NULL DEFAULT false,
  sort_order INTEGER       NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- Partial unique index for system categories (family_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_cal_categories_system_slug
  ON event_categories (slug) WHERE family_id IS NULL;

-- Partial unique index for family categories
CREATE UNIQUE INDEX IF NOT EXISTS idx_cal_categories_family_slug
  ON event_categories (family_id, slug) WHERE family_id IS NOT NULL;

-- ─────────────────────────────────────────────────────────────
-- 2. calendar_events
--    Uses separate DATE + TIME fields per PRD-14B schema.
--    Recurrence via RRULE JSONB per PRD-35.
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calendar_events (
  id                     UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id              UUID          NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  created_by             UUID          NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,

  -- Core fields
  title                  TEXT          NOT NULL,
  description            TEXT,
  location               TEXT,

  -- Timing (separate date + time per PRD-14B)
  event_date             DATE          NOT NULL,
  end_date               DATE,                        -- NULL = same-day event
  start_time             TIME,                        -- NULL = all-day event
  end_time               TIME,
  is_all_day             BOOLEAN       NOT NULL DEFAULT false,

  -- Classification
  event_type             TEXT          NOT NULL DEFAULT 'event'
                           CHECK (event_type IN ('task','event','deadline','reminder','appointment','activity')),
  category_id            UUID          REFERENCES event_categories(id),
  priority               TEXT          CHECK (priority IN ('low','medium','high')),
  color                  VARCHAR(7),                  -- Hex, inherits from member color if NULL
  icon_override          TEXT,                        -- Lucide icon name override

  -- Source / intake
  source_type            TEXT          NOT NULL DEFAULT 'manual'
                           CHECK (source_type IN ('manual','review_route','image_ocr','lila_guided','task_auto','google_sync')),
  source_reference_id    UUID,
  source_image_url       TEXT,
  external_id            TEXT,
  external_source        TEXT,
  last_synced_at         TIMESTAMPTZ,

  -- Recurrence (RRULE JSONB per PRD-35 + quick-filter enum)
  recurrence_rule        TEXT          CHECK (recurrence_rule IN ('daily','weekdays','weekly','biweekly','monthly','yearly','custom')),
  recurrence_details     JSONB,                       -- Full RRULE JSONB: {rrule, dtstart, until, count, exdates, rdates, timezone, schedule_type, ...}
  recurrence_parent_id   UUID          REFERENCES calendar_events(id),

  -- Approval workflow
  status                 TEXT          NOT NULL DEFAULT 'approved'
                           CHECK (status IN ('draft','pending_approval','approved','rejected','cancelled')),
  rejection_note         TEXT,
  approved_by            UUID          REFERENCES family_members(id),
  approved_at            TIMESTAMPTZ,

  -- Logistics (PRD naming)
  transportation_needed  BOOLEAN       NOT NULL DEFAULT false,
  transportation_notes   TEXT,                        -- "Mom driving", "Carpool with Smith family"
  items_to_bring         JSONB         NOT NULL DEFAULT '[]'::jsonb,  -- [{text, checked, ai_suggested}]
  leave_by_time          TIME,                        -- Auto-calculated from start_time - drive_time
  notes                  TEXT,

  -- Reminders (array for multiple reminders per event)
  reminder_minutes       INTEGER[],

  -- AI context
  is_included_in_ai      BOOLEAN       NOT NULL DEFAULT true,

  -- Audit
  created_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- ─────────────────────────────────────────────────────────────
-- 3. event_attendees
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS event_attendees (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id         UUID         NOT NULL REFERENCES calendar_events(id) ON DELETE CASCADE,
  family_member_id UUID         NOT NULL REFERENCES family_members(id) ON DELETE CASCADE,
  attendee_role    TEXT         NOT NULL DEFAULT 'attending'
                     CHECK (attendee_role IN ('attending','driving','requested_presence')),
  response_status  TEXT         NOT NULL DEFAULT 'pending'
                     CHECK (response_status IN ('pending','accepted','declined')),
  created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, family_member_id)
);

-- ─────────────────────────────────────────────────────────────
-- 4. calendar_settings (one row per family)
-- ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS calendar_settings (
  id                         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id                  UUID        NOT NULL REFERENCES families(id) ON DELETE CASCADE,
  default_drive_time_minutes INTEGER     NOT NULL DEFAULT 30,
  required_intake_fields     JSONB       NOT NULL DEFAULT '[]'::jsonb,
  auto_approve_members       UUID[]      DEFAULT '{}',
  week_start_day             INTEGER     NOT NULL DEFAULT 0 CHECK (week_start_day IN (0, 1)),
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (family_id)
);

-- ─────────────────────────────────────────────────────────────
-- 5. family_members.calendar_color (idempotent ADD)
-- ─────────────────────────────────────────────────────────────
ALTER TABLE family_members ADD COLUMN IF NOT EXISTS calendar_color VARCHAR(7);

-- ─────────────────────────────────────────────────────────────
-- Indexes
-- ─────────────────────────────────────────────────────────────
-- calendar_events
CREATE INDEX IF NOT EXISTS idx_cal_events_family         ON calendar_events (family_id);
CREATE INDEX IF NOT EXISTS idx_cal_events_creator        ON calendar_events (created_by);
CREATE INDEX IF NOT EXISTS idx_cal_events_date           ON calendar_events (event_date);
CREATE INDEX IF NOT EXISTS idx_cal_events_family_date    ON calendar_events (family_id, event_date);
CREATE INDEX IF NOT EXISTS idx_cal_events_creator_date   ON calendar_events (created_by, event_date);
CREATE INDEX IF NOT EXISTS idx_cal_events_status         ON calendar_events (status);
CREATE INDEX IF NOT EXISTS idx_cal_events_family_status  ON calendar_events (family_id, status);
CREATE INDEX IF NOT EXISTS idx_cal_events_type           ON calendar_events (event_type);
CREATE INDEX IF NOT EXISTS idx_cal_events_source         ON calendar_events (source_type);
CREATE INDEX IF NOT EXISTS idx_cal_events_recurrence     ON calendar_events (recurrence_parent_id) WHERE recurrence_parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_cal_events_external       ON calendar_events (external_source, external_id) WHERE external_id IS NOT NULL;

-- event_attendees
CREATE INDEX IF NOT EXISTS idx_cal_attendees_event       ON event_attendees (event_id);
CREATE INDEX IF NOT EXISTS idx_cal_attendees_member      ON event_attendees (family_member_id);
CREATE INDEX IF NOT EXISTS idx_cal_attendees_response    ON event_attendees (family_member_id, response_status);

-- event_categories
CREATE INDEX IF NOT EXISTS idx_cal_categories_family     ON event_categories (family_id);

-- calendar_settings
CREATE INDEX IF NOT EXISTS idx_cal_settings_family       ON calendar_settings (family_id);

-- ─────────────────────────────────────────────────────────────
-- Triggers — updated_at
-- ─────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_cal_events_updated_at ON calendar_events;
CREATE TRIGGER trg_cal_events_updated_at
  BEFORE UPDATE ON calendar_events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trg_cal_settings_updated_at ON calendar_settings;
CREATE TRIGGER trg_cal_settings_updated_at
  BEFORE UPDATE ON calendar_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ─────────────────────────────────────────────────────────────
-- RLS
-- ─────────────────────────────────────────────────────────────

-- event_categories
ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_categories_select" ON event_categories;
CREATE POLICY "event_categories_select" ON event_categories
  FOR SELECT USING (
    family_id IS NULL
    OR family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "event_categories_insert_primary_parent" ON event_categories;
CREATE POLICY "event_categories_insert_primary_parent" ON event_categories
  FOR INSERT WITH CHECK (
    family_id IS NOT NULL
    AND family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role = 'primary_parent'
    )
  );

DROP POLICY IF EXISTS "event_categories_update_primary_parent" ON event_categories;
CREATE POLICY "event_categories_update_primary_parent" ON event_categories
  FOR UPDATE USING (
    family_id IS NOT NULL
    AND is_system = false
    AND family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role = 'primary_parent'
    )
  );

DROP POLICY IF EXISTS "event_categories_delete_primary_parent" ON event_categories;
CREATE POLICY "event_categories_delete_primary_parent" ON event_categories
  FOR DELETE USING (
    family_id IS NOT NULL
    AND is_system = false
    AND family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role = 'primary_parent'
    )
  );

-- calendar_events
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "calendar_events_select_family" ON calendar_events;
CREATE POLICY "calendar_events_select_family" ON calendar_events
  FOR SELECT USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
    AND (
      status IN ('approved', 'pending_approval')
      OR created_by IN (
        SELECT id FROM family_members WHERE user_id = auth.uid()
      )
      OR family_id IN (
        SELECT family_id FROM family_members
        WHERE user_id = auth.uid() AND role = 'primary_parent'
      )
    )
  );

DROP POLICY IF EXISTS "calendar_events_insert_family_member" ON calendar_events;
CREATE POLICY "calendar_events_insert_family_member" ON calendar_events
  FOR INSERT WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
    AND created_by IN (
      SELECT id FROM family_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "calendar_events_update" ON calendar_events;
CREATE POLICY "calendar_events_update" ON calendar_events
  FOR UPDATE USING (
    created_by IN (
      SELECT id FROM family_members WHERE user_id = auth.uid()
    )
    OR family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role = 'primary_parent'
    )
  );

DROP POLICY IF EXISTS "calendar_events_delete" ON calendar_events;
CREATE POLICY "calendar_events_delete" ON calendar_events
  FOR DELETE USING (
    created_by IN (
      SELECT id FROM family_members WHERE user_id = auth.uid()
    )
    OR family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role = 'primary_parent'
    )
  );

-- event_attendees
ALTER TABLE event_attendees ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "event_attendees_select" ON event_attendees;
CREATE POLICY "event_attendees_select" ON event_attendees
  FOR SELECT USING (
    event_id IN (
      SELECT id FROM calendar_events
      WHERE family_id IN (
        SELECT family_id FROM family_members WHERE user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "event_attendees_insert" ON event_attendees;
CREATE POLICY "event_attendees_insert" ON event_attendees
  FOR INSERT WITH CHECK (
    event_id IN (
      SELECT id FROM calendar_events
      WHERE
        created_by IN (SELECT id FROM family_members WHERE user_id = auth.uid())
        OR family_id IN (
          SELECT family_id FROM family_members
          WHERE user_id = auth.uid() AND role = 'primary_parent'
        )
    )
  );

DROP POLICY IF EXISTS "event_attendees_update" ON event_attendees;
CREATE POLICY "event_attendees_update" ON event_attendees
  FOR UPDATE USING (
    event_id IN (
      SELECT id FROM calendar_events
      WHERE
        created_by IN (SELECT id FROM family_members WHERE user_id = auth.uid())
        OR family_id IN (
          SELECT family_id FROM family_members
          WHERE user_id = auth.uid() AND role = 'primary_parent'
        )
    )
  );

DROP POLICY IF EXISTS "event_attendees_delete" ON event_attendees;
CREATE POLICY "event_attendees_delete" ON event_attendees
  FOR DELETE USING (
    event_id IN (
      SELECT id FROM calendar_events
      WHERE
        created_by IN (SELECT id FROM family_members WHERE user_id = auth.uid())
        OR family_id IN (
          SELECT family_id FROM family_members
          WHERE user_id = auth.uid() AND role = 'primary_parent'
        )
    )
  );

-- calendar_settings
ALTER TABLE calendar_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "calendar_settings_select_family" ON calendar_settings;
CREATE POLICY "calendar_settings_select_family" ON calendar_settings
  FOR SELECT USING (
    family_id IN (
      SELECT family_id FROM family_members WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "calendar_settings_insert_primary_parent" ON calendar_settings;
CREATE POLICY "calendar_settings_insert_primary_parent" ON calendar_settings
  FOR INSERT WITH CHECK (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role = 'primary_parent'
    )
  );

DROP POLICY IF EXISTS "calendar_settings_update_primary_parent" ON calendar_settings;
CREATE POLICY "calendar_settings_update_primary_parent" ON calendar_settings
  FOR UPDATE USING (
    family_id IN (
      SELECT family_id FROM family_members
      WHERE user_id = auth.uid() AND role = 'primary_parent'
    )
  );

-- ─────────────────────────────────────────────────────────────
-- Seed Data — 11 system event categories per PRD-14B
-- Uses Learning (not School) per Decision #15 (homeschool families).
-- Includes Faith, Music & Arts, Travel, Celebration per PRD.
-- ─────────────────────────────────────────────────────────────
INSERT INTO event_categories (name, slug, icon, color, is_system, sort_order, family_id)
VALUES
  ('Learning',       'learning',       'book-open',        '#4A90D9', true,  0, NULL),
  ('Sports',         'sports',         'circle',           '#48BB78', true,  1, NULL),
  ('Medical',        'medical',        'stethoscope',      '#E53E3E', true,  2, NULL),
  ('Family',         'family',         'home',             '#9F7AEA', true,  3, NULL),
  ('Social',         'social',         'users',            '#ED8936', true,  4, NULL),
  ('Faith',          'faith',          'church',           '#8B5CF6', true,  5, NULL),
  ('Music & Arts',   'music_arts',     'music',            '#EC4899', true,  6, NULL),
  ('Travel',         'travel',         'map-pin',          '#14B8A6', true,  7, NULL),
  ('Celebration',    'celebration',    'party-popper',     '#F59E0B', true,  8, NULL),
  ('Work',           'work',           'briefcase',        '#718096', true,  9, NULL),
  ('Other',          'other',          'calendar-days',    '#A0AEC0', true, 10, NULL)
ON CONFLICT DO NOTHING;
