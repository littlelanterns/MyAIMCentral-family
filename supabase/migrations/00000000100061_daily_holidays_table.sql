-- PRD-10 Enhancement: daily_holidays table
-- Platform-level table for "Today Is..." fun holidays widget
-- Not family-scoped — shared across all families

CREATE TABLE IF NOT EXISTS daily_holidays (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  date_month INTEGER NOT NULL CHECK (date_month BETWEEN 1 AND 12),
  date_day INTEGER NOT NULL CHECK (date_day BETWEEN 1 AND 31),
  date_type TEXT NOT NULL DEFAULT 'fixed' CHECK (date_type IN ('fixed', 'floating')),
  floating_rule TEXT, -- e.g. 'easter+5', 'thanksgiving+1', 'weekday-3-1' (3rd Monday)
  tags TEXT[] NOT NULL DEFAULT '{}',
  is_kid_friendly BOOLEAN NOT NULL DEFAULT true,
  silliness_score INTEGER NOT NULL DEFAULT 0 CHECK (silliness_score BETWEEN 0 AND 10),
  obscurity_score INTEGER NOT NULL DEFAULT 0 CHECK (obscurity_score BETWEEN 0 AND 10),
  is_excluded BOOLEAN NOT NULL DEFAULT false,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Primary lookup: "what holidays are today?"
CREATE INDEX IF NOT EXISTS idx_dh_date_lookup
  ON daily_holidays (date_month, date_day)
  WHERE is_excluded = false;

-- Filter for floating date resolver
CREATE INDEX IF NOT EXISTS idx_dh_date_type
  ON daily_holidays (date_type)
  WHERE date_type = 'floating';

-- RLS: All authenticated users can SELECT. No user INSERT/UPDATE/DELETE.
ALTER TABLE daily_holidays ENABLE ROW LEVEL SECURITY;

CREATE POLICY "daily_holidays_select_authenticated"
  ON daily_holidays FOR SELECT
  TO authenticated
  USING (true);

-- Platform content — only service_role can modify
CREATE POLICY "daily_holidays_insert_service"
  ON daily_holidays FOR INSERT
  TO service_role
  WITH CHECK (true);

CREATE POLICY "daily_holidays_update_service"
  ON daily_holidays FOR UPDATE
  TO service_role
  USING (true);

CREATE POLICY "daily_holidays_delete_service"
  ON daily_holidays FOR DELETE
  TO service_role
  USING (true);
