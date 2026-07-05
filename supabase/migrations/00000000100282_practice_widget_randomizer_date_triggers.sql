-- ============================================================================
-- CLIENT-DATE-REMEDIATION — Residual closure (Row 184 NEW-DD / Convention #257)
--
-- Extends the migration 100158 pattern (family-timezone-derived DATE columns,
-- ±1-day override window, BEFORE INSERT OR UPDATE triggers) to the three
-- remaining unprotected DATE columns identified in the 2026-07-01 residual
-- audit (claude/feature-decisions/Client-Date-Remediation.md §3A):
--
--   W1 practice_log.period_date            ← created_at
--   W2 widget_data_points.recorded_date    ← recorded_at
--   W3 randomizer_draws.routine_instance_date ← drawn_at (fallback created_at)
--
-- Same architecture as 100158/100163: triggers own writes, family_today owns
-- reads. Client-side fixes for the read sites (R1-R6) and the write-path
-- UTC-slice evasion in usePractice.ts (W1 client fix) ship alongside this
-- migration in the same commit.
--
-- NOTE ON W4 (streak fix, founder gate G1 APPROVED): investigation during
-- this build found the originally-scoped fix moot. `roll_creature_for_completion`
-- (which the audit assumed still computed streaks with CURRENT_DATE) was
-- DROPPED in migration 100221 (Phase 3 Worker F cutover) — streak logic no
-- longer lives there. The successor `compute_streak()` RPC (100204) was
-- ALREADY made family-timezone-aware by migration 100240, predating this
-- build entirely. No further SQL fix is needed for G1's literal ask.
--
-- What IS still broken (discovered this session, not in the original audit):
-- `family_members.current_streak` / `longest_streak` / `last_task_completion_date`
-- are DEAD COLUMNS — nothing has written to them since roll_creature_for_completion
-- was dropped (2026-05-03), yet PlayDashboard/MyRewards/GuidedDashboard display
-- them directly. This is a wiring gap, not a timezone bug, and it is fixed on
-- the client side of this same build by reading `compute_streak()` live instead
-- (see useMemberStreak hook) — no migration needed since compute_streak already
-- exists and is already correct. This GRANT statement is a safety-net in case
-- the function's default PUBLIC execute privilege was ever revoked.
-- ============================================================================

GRANT EXECUTE ON FUNCTION public.compute_streak(UUID, TEXT, UUID) TO authenticated, anon;

-- ============================================================================
-- W1: practice_log.period_date ← created_at
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_practice_log_period_date()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_family_timezone TEXT;
  v_source_ts       TIMESTAMPTZ;
  v_server_today    DATE;
BEGIN
  SELECT f.timezone INTO v_family_timezone
  FROM family_members fm JOIN families f ON f.id = fm.family_id
  WHERE fm.id = NEW.family_member_id;

  IF v_family_timezone IS NULL OR v_family_timezone = '' THEN
    v_family_timezone := 'America/Chicago';
  END IF;

  v_source_ts := COALESCE(NEW.created_at, NOW());
  v_server_today := (v_source_ts AT TIME ZONE v_family_timezone)::date;

  IF NEW.period_date IS NULL OR ABS(NEW.period_date - v_server_today) <= 1 THEN
    NEW.period_date := v_server_today;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_practice_log_period_date ON public.practice_log;
CREATE TRIGGER trg_set_practice_log_period_date
  BEFORE INSERT OR UPDATE OF created_at, period_date ON public.practice_log
  FOR EACH ROW EXECUTE FUNCTION public.set_practice_log_period_date();

COMMENT ON FUNCTION public.set_practice_log_period_date() IS
  'Sets practice_log.period_date from created_at at the family''s local timezone (±1-day override window). Closes the two-step .toISOString()->.slice(0,10) UTC-date evasion in usePractice.ts (Convention #257).';

-- ============================================================================
-- W2: widget_data_points.recorded_date ← recorded_at
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_widget_data_point_recorded_date()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_family_timezone TEXT;
  v_source_ts       TIMESTAMPTZ;
  v_server_today    DATE;
BEGIN
  SELECT f.timezone INTO v_family_timezone
  FROM family_members fm JOIN families f ON f.id = fm.family_id
  WHERE fm.id = NEW.family_member_id;

  IF v_family_timezone IS NULL OR v_family_timezone = '' THEN
    v_family_timezone := 'America/Chicago';
  END IF;

  IF NEW.recorded_at IS NULL THEN
    NEW.recorded_at := NOW();
  END IF;

  v_source_ts := NEW.recorded_at;
  v_server_today := (v_source_ts AT TIME ZONE v_family_timezone)::date;

  -- ±1-day window deliberately leaves the 2026-03-26 bulk seed-import rows
  -- (dated far in the past) untouched — only the device-clock-misconfiguration
  -- signature (evening entries landing on "tomorrow") gets corrected.
  IF NEW.recorded_date IS NULL OR ABS(NEW.recorded_date - v_server_today) <= 1 THEN
    NEW.recorded_date := v_server_today;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_widget_data_point_recorded_date ON public.widget_data_points;
CREATE TRIGGER trg_set_widget_data_point_recorded_date
  BEFORE INSERT OR UPDATE OF recorded_at, recorded_date ON public.widget_data_points
  FOR EACH ROW EXECUTE FUNCTION public.set_widget_data_point_recorded_date();

COMMENT ON FUNCTION public.set_widget_data_point_recorded_date() IS
  'Sets widget_data_points.recorded_date from recorded_at at the family''s local timezone (±1-day override window). Column previously had no trigger at all — every evening tracker tap after ~6-7pm Central dated tomorrow on a correctly-configured device (Convention #257).';

-- ============================================================================
-- W3: randomizer_draws.routine_instance_date ← drawn_at (fallback created_at)
--
-- KNOWN EDGE CASE: a trigger correction that shifts routine_instance_date
-- could collide with the auto_surprise UNIQUE partial index
-- (list_id, family_member_id, routine_instance_date) WHERE draw_source =
-- 'auto_surprise' if a draw already exists for the corrected day. The insert
-- then fails loudly (unique_violation) rather than silently creating a
-- split-brain second draw for the same logical day — this is the CORRECT
-- failure mode. useSurpriseMeAutoDraw's existing unique-violation fallback
-- (re-fetch and return the existing row) already handles this gracefully.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_randomizer_draw_instance_date()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_family_timezone TEXT;
  v_source_ts       TIMESTAMPTZ;
  v_server_today    DATE;
BEGIN
  SELECT f.timezone INTO v_family_timezone
  FROM family_members fm JOIN families f ON f.id = fm.family_id
  WHERE fm.id = NEW.family_member_id;

  IF v_family_timezone IS NULL OR v_family_timezone = '' THEN
    v_family_timezone := 'America/Chicago';
  END IF;

  v_source_ts := COALESCE(NEW.drawn_at, NEW.created_at, NOW());
  v_server_today := (v_source_ts AT TIME ZONE v_family_timezone)::date;

  IF NEW.routine_instance_date IS NULL OR ABS(NEW.routine_instance_date - v_server_today) <= 1 THEN
    NEW.routine_instance_date := v_server_today;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_randomizer_draw_instance_date ON public.randomizer_draws;
CREATE TRIGGER trg_set_randomizer_draw_instance_date
  BEFORE INSERT OR UPDATE OF drawn_at, created_at, routine_instance_date ON public.randomizer_draws
  FOR EACH ROW EXECUTE FUNCTION public.set_randomizer_draw_instance_date();

COMMENT ON FUNCTION public.set_randomizer_draw_instance_date() IS
  'Sets randomizer_draws.routine_instance_date from drawn_at (fallback created_at) at the family''s local timezone (±1-day override window). Structural/pre-emptive fix — 0 production rows affected at time of writing (Convention #257).';

-- ============================================================================
-- Idempotent backfill of misaligned existing rows (±1-day window only)
-- ============================================================================

-- practice_log (4 known misaligned rows, all dated tomorrow per UTC evening writes)
UPDATE public.practice_log pl
SET period_date = (pl.created_at AT TIME ZONE f.timezone)::date
FROM public.family_members fm, public.families f
WHERE pl.family_member_id = fm.id
  AND fm.family_id = f.id
  AND (pl.created_at AT TIME ZONE f.timezone)::date != pl.period_date
  AND ABS(pl.period_date - (pl.created_at AT TIME ZONE f.timezone)::date) <= 1;

-- widget_data_points (3 known misaligned rows, written 7:00-7:01pm Central 2026-03-30).
-- The ±1 window deliberately excludes the 2026-03-26 bulk seed-import rows.
UPDATE public.widget_data_points wdp
SET recorded_date = (wdp.recorded_at AT TIME ZONE f.timezone)::date
FROM public.family_members fm, public.families f
WHERE wdp.family_member_id = fm.id
  AND fm.family_id = f.id
  AND (wdp.recorded_at AT TIME ZONE f.timezone)::date != wdp.recorded_date
  AND ABS(wdp.recorded_date - (wdp.recorded_at AT TIME ZONE f.timezone)::date) <= 1;

-- randomizer_draws: 0 rows in production at time of writing, backfill is a no-op
-- but kept for idempotency/completeness if run against a future dataset.
UPDATE public.randomizer_draws rd
SET routine_instance_date = (COALESCE(rd.drawn_at, rd.created_at) AT TIME ZONE f.timezone)::date
FROM public.family_members fm, public.families f
WHERE rd.family_member_id = fm.id
  AND fm.family_id = f.id
  AND rd.routine_instance_date IS NOT NULL
  AND (COALESCE(rd.drawn_at, rd.created_at) AT TIME ZONE f.timezone)::date != rd.routine_instance_date
  AND ABS(rd.routine_instance_date - (COALESCE(rd.drawn_at, rd.created_at) AT TIME ZONE f.timezone)::date) <= 1;

-- ============================================================================
-- Verification queries (run post-apply; expect 0 for every row)
-- ============================================================================
-- SELECT 'practice_log' AS tbl, COUNT(*) FROM practice_log pl
--   JOIN family_members fm ON fm.id = pl.family_member_id
--   JOIN families f ON f.id = fm.family_id
--  WHERE ABS(pl.period_date - (pl.created_at AT TIME ZONE f.timezone)::date) <= 1
--    AND pl.period_date != (pl.created_at AT TIME ZONE f.timezone)::date
-- UNION ALL SELECT 'widget_data_points', COUNT(*) FROM widget_data_points wdp
--   JOIN family_members fm ON fm.id = wdp.family_member_id
--   JOIN families f ON f.id = fm.family_id
--  WHERE ABS(wdp.recorded_date - (wdp.recorded_at AT TIME ZONE f.timezone)::date) <= 1
--    AND wdp.recorded_date != (wdp.recorded_at AT TIME ZONE f.timezone)::date
-- UNION ALL SELECT 'randomizer_draws', COUNT(*) FROM randomizer_draws rd
--   JOIN family_members fm ON fm.id = rd.family_member_id
--   JOIN families f ON f.id = fm.family_id
--  WHERE rd.routine_instance_date IS NOT NULL
--    AND ABS(rd.routine_instance_date - (COALESCE(rd.drawn_at, rd.created_at) AT TIME ZONE f.timezone)::date) <= 1
--    AND rd.routine_instance_date != (COALESCE(rd.drawn_at, rd.created_at) AT TIME ZONE f.timezone)::date;

DO $$ BEGIN RAISE NOTICE 'migration 100282: practice_log/widget_data_points/randomizer_draws date triggers + backfill applied'; END $$;
