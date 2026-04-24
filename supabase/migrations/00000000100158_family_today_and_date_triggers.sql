-- NEW-DD Wave 1 remediation (Row 184, FIX_NOW_SEQUENCE v12).
-- Extends the migration 100157 pattern to the remaining 6 vulnerable DATE columns
-- identified in claude/web-sync/CLIENT_DATE_AUDIT_2026-04-23.md (plus reflection_responses,
-- which the audit missed in Category B — drift noted in Row 184 work plan).
--
-- Part 1: util.family_today(p_member_id UUID) RETURNS DATE — single source of truth
--         for "what local date is it for this family right now," used by both client
--         hooks (via useFamilyToday) and any future server code.
--
-- Part 2: Six BEFORE INSERT OR UPDATE triggers deriving each DATE column from the
--         row's operational timestamp at the family's timezone. Pattern matches
--         migration 100157 exactly. Override is bounded by a 1-day window so future
--         backdated entries (log_date = last week) are respected.
--
-- Part 3: Idempotent backfill for misaligned existing rows. Same shape as the
--         one-shot SQL that realigned routine_step_completions on 2026-04-23.
--
-- Convention #257 (no new todayLocalIso() client writes to DATE columns) is now
-- enforceable at the schema level for these 6 tables plus routines already covered.

-- ============================================================================
-- Part 1: family_today RPC
-- ============================================================================

CREATE OR REPLACE FUNCTION public.family_today(p_member_id UUID)
RETURNS DATE
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_family_timezone TEXT;
BEGIN
  SELECT f.timezone INTO v_family_timezone
  FROM family_members fm
  JOIN families f ON f.id = fm.family_id
  WHERE fm.id = p_member_id;

  IF v_family_timezone IS NULL OR v_family_timezone = '' THEN
    v_family_timezone := 'America/Chicago';
  END IF;

  RETURN (NOW() AT TIME ZONE v_family_timezone)::date;
END;
$$;

GRANT EXECUTE ON FUNCTION public.family_today(UUID) TO authenticated, anon;

COMMENT ON FUNCTION public.family_today(UUID) IS
  'Returns today''s local date for the family this member belongs to. Deterministic function of NOW() + families.timezone. Replaces todayLocalIso() in any client read or write that touches a DATE column — see Convention #257.';

-- ============================================================================
-- Part 2: Six trigger functions + triggers
-- ============================================================================

-- Shared helper inlined per-trigger (matches 100157 style). Each trigger:
--   1. Looks up the family's timezone via the row's member column.
--   2. Falls back to America/Chicago on lookup miss.
--   3. Defaults the operational timestamp if NULL.
--   4. Overrides the DATE column when it's within 1 day of server-derived family
--      today (catches the device-clock-misconfiguration bug) OR when it's NULL.
--      Backdated entries (|client date - family today| > 1) are respected.

-- ---------------------------------------------------------------------------
-- Trigger 1: intention_iterations.day_date  ←  recorded_at (fallback created_at)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_intention_iteration_day_date()
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
  WHERE fm.id = NEW.member_id;

  IF v_family_timezone IS NULL OR v_family_timezone = '' THEN
    v_family_timezone := 'America/Chicago';
  END IF;

  v_source_ts := COALESCE(NEW.recorded_at, NEW.created_at, NOW());
  v_server_today := (v_source_ts AT TIME ZONE v_family_timezone)::date;

  IF NEW.day_date IS NULL OR ABS(NEW.day_date - v_server_today) <= 1 THEN
    NEW.day_date := v_server_today;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_intention_iteration_day_date ON public.intention_iterations;
CREATE TRIGGER trg_set_intention_iteration_day_date
  BEFORE INSERT OR UPDATE OF recorded_at, created_at, day_date ON public.intention_iterations
  FOR EACH ROW EXECUTE FUNCTION public.set_intention_iteration_day_date();

-- ---------------------------------------------------------------------------
-- Trigger 2: family_intention_iterations.day_date  ←  created_at
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_family_intention_iteration_day_date()
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
  WHERE fm.id = NEW.member_id;

  IF v_family_timezone IS NULL OR v_family_timezone = '' THEN
    v_family_timezone := 'America/Chicago';
  END IF;

  v_source_ts := COALESCE(NEW.created_at, NOW());
  v_server_today := (v_source_ts AT TIME ZONE v_family_timezone)::date;

  IF NEW.day_date IS NULL OR ABS(NEW.day_date - v_server_today) <= 1 THEN
    NEW.day_date := v_server_today;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_family_intention_iteration_day_date ON public.family_intention_iterations;
CREATE TRIGGER trg_set_family_intention_iteration_day_date
  BEFORE INSERT OR UPDATE OF created_at, day_date ON public.family_intention_iterations
  FOR EACH ROW EXECUTE FUNCTION public.set_family_intention_iteration_day_date();

-- ---------------------------------------------------------------------------
-- Trigger 3: task_completions.period_date  ←  completed_at
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_task_completion_period_date()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_family_timezone TEXT;
  v_source_ts       TIMESTAMPTZ;
  v_server_today    DATE;
  v_lookup_id       UUID;
BEGIN
  -- Prefer family_member_id (canonical column name on this table),
  -- fall back to member_id for older rows.
  v_lookup_id := COALESCE(NEW.family_member_id, NEW.member_id);

  SELECT f.timezone INTO v_family_timezone
  FROM family_members fm JOIN families f ON f.id = fm.family_id
  WHERE fm.id = v_lookup_id;

  IF v_family_timezone IS NULL OR v_family_timezone = '' THEN
    v_family_timezone := 'America/Chicago';
  END IF;

  IF NEW.completed_at IS NULL THEN
    NEW.completed_at := NOW();
  END IF;

  v_source_ts := NEW.completed_at;
  v_server_today := (v_source_ts AT TIME ZONE v_family_timezone)::date;

  IF NEW.period_date IS NULL OR ABS(NEW.period_date - v_server_today) <= 1 THEN
    NEW.period_date := v_server_today;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_task_completion_period_date ON public.task_completions;
CREATE TRIGGER trg_set_task_completion_period_date
  BEFORE INSERT OR UPDATE OF completed_at, period_date ON public.task_completions
  FOR EACH ROW EXECUTE FUNCTION public.set_task_completion_period_date();

-- ---------------------------------------------------------------------------
-- Trigger 4: homeschool_time_logs.log_date  ←  created_at
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_homeschool_time_log_date()
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

  -- Backdating is a real use case for homeschool logs (mom logs yesterday's hours
  -- this morning). Only override when log_date is within 1 day of server-derived
  -- today — that's the device-clock-bug signature.
  IF NEW.log_date IS NULL OR ABS(NEW.log_date - v_server_today) <= 1 THEN
    NEW.log_date := v_server_today;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_homeschool_time_log_date ON public.homeschool_time_logs;
CREATE TRIGGER trg_set_homeschool_time_log_date
  BEFORE INSERT OR UPDATE OF created_at, log_date ON public.homeschool_time_logs
  FOR EACH ROW EXECUTE FUNCTION public.set_homeschool_time_log_date();

-- ---------------------------------------------------------------------------
-- Trigger 5: victory_celebrations.celebration_date  ←  created_at
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_victory_celebration_date()
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

  -- Celebrations may reference past days (reviewing yesterday's victories).
  -- Only override the device-clock-bug window.
  IF NEW.celebration_date IS NULL OR ABS(NEW.celebration_date - v_server_today) <= 1 THEN
    NEW.celebration_date := v_server_today;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_victory_celebration_date ON public.victory_celebrations;
CREATE TRIGGER trg_set_victory_celebration_date
  BEFORE INSERT OR UPDATE OF created_at, celebration_date ON public.victory_celebrations
  FOR EACH ROW EXECUTE FUNCTION public.set_victory_celebration_date();

-- ---------------------------------------------------------------------------
-- Trigger 6: reflection_responses.response_date  ←  created_at
--   (audit-doc drift: audit lists this as read-only Category C but the write
--    site at useReflections.ts:281 is also vulnerable — covered here per plan)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_reflection_response_date()
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
  WHERE fm.id = NEW.member_id;

  IF v_family_timezone IS NULL OR v_family_timezone = '' THEN
    v_family_timezone := 'America/Chicago';
  END IF;

  v_source_ts := COALESCE(NEW.created_at, NOW());
  v_server_today := (v_source_ts AT TIME ZONE v_family_timezone)::date;

  IF NEW.response_date IS NULL OR ABS(NEW.response_date - v_server_today) <= 1 THEN
    NEW.response_date := v_server_today;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_reflection_response_date ON public.reflection_responses;
CREATE TRIGGER trg_set_reflection_response_date
  BEFORE INSERT OR UPDATE OF created_at, response_date ON public.reflection_responses
  FOR EACH ROW EXECUTE FUNCTION public.set_reflection_response_date();

-- ============================================================================
-- Part 3: Idempotent backfill of misaligned existing rows
-- ============================================================================

-- intention_iterations
UPDATE public.intention_iterations ii
SET day_date = (COALESCE(ii.recorded_at, ii.created_at) AT TIME ZONE f.timezone)::date
FROM public.family_members fm, public.families f
WHERE ii.member_id = fm.id
  AND fm.family_id = f.id
  AND (COALESCE(ii.recorded_at, ii.created_at) AT TIME ZONE f.timezone)::date != ii.day_date
  AND ABS(ii.day_date - (COALESCE(ii.recorded_at, ii.created_at) AT TIME ZONE f.timezone)::date) <= 1;

-- family_intention_iterations
UPDATE public.family_intention_iterations fii
SET day_date = (fii.created_at AT TIME ZONE f.timezone)::date
FROM public.family_members fm, public.families f
WHERE fii.member_id = fm.id
  AND fm.family_id = f.id
  AND (fii.created_at AT TIME ZONE f.timezone)::date != fii.day_date
  AND ABS(fii.day_date - (fii.created_at AT TIME ZONE f.timezone)::date) <= 1;

-- task_completions
UPDATE public.task_completions tc
SET period_date = (tc.completed_at AT TIME ZONE f.timezone)::date
FROM public.family_members fm, public.families f
WHERE COALESCE(tc.family_member_id, tc.member_id) = fm.id
  AND fm.family_id = f.id
  AND (tc.completed_at AT TIME ZONE f.timezone)::date != tc.period_date
  AND ABS(tc.period_date - (tc.completed_at AT TIME ZONE f.timezone)::date) <= 1;

-- homeschool_time_logs (0 rows today, idempotent)
UPDATE public.homeschool_time_logs htl
SET log_date = (htl.created_at AT TIME ZONE f.timezone)::date
FROM public.family_members fm, public.families f
WHERE htl.family_member_id = fm.id
  AND fm.family_id = f.id
  AND (htl.created_at AT TIME ZONE f.timezone)::date != htl.log_date
  AND ABS(htl.log_date - (htl.created_at AT TIME ZONE f.timezone)::date) <= 1;

-- victory_celebrations (0 rows today, idempotent)
UPDATE public.victory_celebrations vc
SET celebration_date = (vc.created_at AT TIME ZONE f.timezone)::date
FROM public.family_members fm, public.families f
WHERE vc.family_member_id = fm.id
  AND fm.family_id = f.id
  AND (vc.created_at AT TIME ZONE f.timezone)::date != vc.celebration_date
  AND ABS(vc.celebration_date - (vc.created_at AT TIME ZONE f.timezone)::date) <= 1;

-- reflection_responses
UPDATE public.reflection_responses rr
SET response_date = (rr.created_at AT TIME ZONE f.timezone)::date
FROM public.family_members fm, public.families f
WHERE rr.member_id = fm.id
  AND fm.family_id = f.id
  AND (rr.created_at AT TIME ZONE f.timezone)::date != rr.response_date
  AND ABS(rr.response_date - (rr.created_at AT TIME ZONE f.timezone)::date) <= 1;

-- ============================================================================
-- Verification queries (run post-apply to confirm 0 misaligned rows per table)
-- ============================================================================
-- SELECT 'routine_step_completions' AS tbl, COUNT(*) FROM routine_step_completions rsc
--   JOIN family_members fm ON fm.id = rsc.member_id
--   JOIN families f ON f.id = fm.family_id
--  WHERE ABS(rsc.period_date - (rsc.completed_at AT TIME ZONE f.timezone)::date) <= 1
--    AND rsc.period_date != (rsc.completed_at AT TIME ZONE f.timezone)::date
-- UNION ALL SELECT 'intention_iterations', COUNT(*) FROM intention_iterations ii
--   JOIN family_members fm ON fm.id = ii.member_id
--   JOIN families f ON f.id = fm.family_id
--  WHERE ABS(ii.day_date - (COALESCE(ii.recorded_at, ii.created_at) AT TIME ZONE f.timezone)::date) <= 1
--    AND ii.day_date != (COALESCE(ii.recorded_at, ii.created_at) AT TIME ZONE f.timezone)::date
-- ...etc for the other 4 tables. Expected: every row returns 0.
