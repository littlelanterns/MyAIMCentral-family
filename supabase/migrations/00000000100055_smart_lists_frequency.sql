-- ============================================================
-- Smart Lists: Frequency Rules, Pool Mode & Draw Engine
-- Migration 100055
-- Spec: specs/smart-lists-reveal-mechanics-spec.md
-- ============================================================
-- Adds per-item frequency rules to list_items, pool_mode to lists,
-- and creates list_item_member_tracking for individual pool tracking.
-- Reuses existing columns where semantically equivalent:
--   max_instances     → lifetime_max
--   completed_instances → lifetime_completion_count
--   next_available_at → cooldown result timestamp
-- ============================================================

-- ============================================================
-- SECTION 1: Add frequency columns to list_items
-- ============================================================

ALTER TABLE public.list_items
  ADD COLUMN IF NOT EXISTS frequency_min INTEGER,
  ADD COLUMN IF NOT EXISTS frequency_max INTEGER,
  ADD COLUMN IF NOT EXISTS frequency_period TEXT
    CHECK (frequency_period IN ('day', 'week', 'month')),
  ADD COLUMN IF NOT EXISTS cooldown_hours INTEGER,
  ADD COLUMN IF NOT EXISTS last_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS period_completion_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS reward_amount DECIMAL;

-- Index for frequency-aware draw queries
CREATE INDEX IF NOT EXISTS idx_li_frequency
  ON public.list_items(list_id, is_available, frequency_period)
  WHERE is_available = true;

-- ============================================================
-- SECTION 2: Add pool_mode and eligible_members to lists
-- ============================================================

ALTER TABLE public.lists
  ADD COLUMN IF NOT EXISTS pool_mode TEXT NOT NULL DEFAULT 'individual'
    CHECK (pool_mode IN ('individual', 'shared')),
  ADD COLUMN IF NOT EXISTS eligible_members UUID[];

-- ============================================================
-- SECTION 3: Create list_item_member_tracking table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.list_item_member_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  list_item_id UUID NOT NULL REFERENCES public.list_items(id) ON DELETE CASCADE,
  family_member_id UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  last_completed_at TIMESTAMPTZ,
  period_completion_count INTEGER NOT NULL DEFAULT 0,
  lifetime_completion_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(list_item_id, family_member_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_limt_member
  ON public.list_item_member_tracking(family_member_id);

-- updated_at trigger
CREATE TRIGGER trg_limt_updated_at
  BEFORE UPDATE ON public.list_item_member_tracking
  FOR EACH ROW EXECUTE FUNCTION util.set_updated_at();

-- ============================================================
-- SECTION 4: RLS for list_item_member_tracking
-- ============================================================

ALTER TABLE public.list_item_member_tracking ENABLE ROW LEVEL SECURITY;

-- Select: family-scoped via list_item → list → family_id
CREATE POLICY "limt_select_family" ON public.list_item_member_tracking
  FOR SELECT USING (
    list_item_id IN (
      SELECT li.id FROM public.list_items li
      JOIN public.lists l ON li.list_id = l.id
      WHERE l.family_id IN (
        SELECT fm.family_id FROM public.family_members fm WHERE fm.user_id = auth.uid()
      )
    )
  );

-- Insert: member can insert own tracking rows
CREATE POLICY "limt_insert_own" ON public.list_item_member_tracking
  FOR INSERT WITH CHECK (
    family_member_id IN (
      SELECT id FROM public.family_members WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
        AND fm.role = 'primary_parent'
        AND fm.family_id IN (
          SELECT fm2.family_id FROM public.family_members fm2
          WHERE fm2.id = list_item_member_tracking.family_member_id
        )
    )
  );

-- Update: member can update own, mom can update any in family
CREATE POLICY "limt_update_own_or_mom" ON public.list_item_member_tracking
  FOR UPDATE USING (
    family_member_id IN (
      SELECT id FROM public.family_members WHERE user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
        AND fm.role = 'primary_parent'
        AND fm.family_id IN (
          SELECT fm2.family_id FROM public.family_members fm2
          WHERE fm2.id = list_item_member_tracking.family_member_id
        )
    )
  );

-- Delete: mom only
CREATE POLICY "limt_delete_mom" ON public.list_item_member_tracking
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
        AND fm.role = 'primary_parent'
        AND fm.family_id IN (
          SELECT fm2.family_id FROM public.family_members fm2
          WHERE fm2.id = list_item_member_tracking.family_member_id
        )
    )
  );

-- ============================================================
-- SECTION 5: Period reset function
-- ============================================================
-- Resets period_completion_count based on frequency_period.
-- Intended to be called by pg_cron daily at midnight.
-- Handles day/week/month boundaries.
-- ============================================================

CREATE OR REPLACE FUNCTION public.reset_list_frequency_counters()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_dow INTEGER := EXTRACT(DOW FROM CURRENT_DATE)::INTEGER; -- 0=Sun
  v_dom INTEGER := EXTRACT(DAY FROM CURRENT_DATE)::INTEGER;
  v_week_start INTEGER := 0; -- default Sunday, could read from calendar_settings
BEGIN
  -- Daily reset: always reset items with frequency_period = 'day'
  UPDATE public.list_items
  SET period_completion_count = 0
  WHERE frequency_period = 'day'
    AND period_completion_count > 0;

  UPDATE public.list_item_member_tracking
  SET period_completion_count = 0
  WHERE period_completion_count > 0
    AND list_item_id IN (
      SELECT id FROM public.list_items WHERE frequency_period = 'day'
    );

  -- Weekly reset: only on the configured week start day
  IF v_dow = v_week_start THEN
    UPDATE public.list_items
    SET period_completion_count = 0
    WHERE frequency_period = 'week'
      AND period_completion_count > 0;

    UPDATE public.list_item_member_tracking
    SET period_completion_count = 0
    WHERE period_completion_count > 0
      AND list_item_id IN (
        SELECT id FROM public.list_items WHERE frequency_period = 'week'
      );
  END IF;

  -- Monthly reset: only on the 1st
  IF v_dom = 1 THEN
    UPDATE public.list_items
    SET period_completion_count = 0
    WHERE frequency_period = 'month'
      AND period_completion_count > 0;

    UPDATE public.list_item_member_tracking
    SET period_completion_count = 0
    WHERE period_completion_count > 0
      AND list_item_id IN (
        SELECT id FROM public.list_items WHERE frequency_period = 'month'
      );
  END IF;

  -- Re-enable items whose lifetime limit hasn't been reached
  -- but were disabled due to period cap (frequency_max)
  UPDATE public.list_items
  SET is_available = true
  WHERE is_available = false
    AND frequency_max IS NOT NULL
    AND period_completion_count = 0
    AND (max_instances IS NULL OR completed_instances < max_instances);
END;
$$;

-- ============================================================
-- SECTION 6: Schedule the reset (pg_cron)
-- ============================================================
-- Runs daily at midnight UTC. Adjust timezone as needed.
-- pg_cron must be enabled in the Supabase project.
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    PERFORM cron.unschedule('reset_list_frequency_counters');
    PERFORM cron.schedule(
      'reset_list_frequency_counters',
      '0 0 * * *',
      'SELECT public.reset_list_frequency_counters()'
    );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- pg_cron not available, skip scheduling
  RAISE NOTICE 'pg_cron not available, skipping frequency reset scheduling';
END;
$$;
