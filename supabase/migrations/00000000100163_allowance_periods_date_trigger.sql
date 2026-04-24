-- Row 9 SCOPE-3.F14 / Worker B1a — Allowance Period Correctness Floor
--
-- Extends the migration 100158 family of date-coercion triggers to
-- allowance_periods. 100158 intentionally deferred allowance_periods to this
-- row (see claude/web-sync/TRIAGE_WORKSHEET.md Row 9 dispatch note); this
-- migration closes that gap.
--
-- Part 1: BEFORE INSERT OR UPDATE trigger on allowance_periods that derives
--         period_start and period_end server-side from families.timezone and
--         allowance_configs.period_start_day / period_type. Implements
--         founder Option (b): first period may be a partial first week
--         (period_start = server-today, period_end = the day BEFORE the next
--         configured period_start_day). Subsequent periods are always full
--         7-day weeks aligned to period_start_day.
--
-- Part 2: Partial unique index guaranteeing at most one active/makeup_window
--         period per member at a time. DB-level safeguard against the React
--         strict-mode double-fire of useStartAllowancePeriod and against any
--         future write path that forgets the "check for existing active"
--         guard.
--
-- Part 3: Idempotent backfill of misaligned existing rows with a 1-day
--         override window (same pattern as 100158). Preserves backdated
--         imports and makeup-window extensions unchanged.
--
-- Convention #257 (no new client todayLocalIso() writes to DATE columns) is
-- enforceable at the schema level for allowance_periods after this migration
-- lands. The trigger is the floor — any client that omits period_start /
-- period_end is safely normalized.

-- ============================================================================
-- Part 1: Trigger — set_allowance_period_dates()
-- ============================================================================

CREATE OR REPLACE FUNCTION public.set_allowance_period_dates()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_family_timezone   TEXT;
  v_server_today      DATE;
  v_config            RECORD;
  v_start_dow         INT;        -- 0 = Sunday, 6 = Saturday (pg DOW)
  v_current_dow       INT;
  v_days_until_start  INT;
  v_first_period      BOOLEAN;
  v_expected_end      DATE;
  v_prior_count       INT;
BEGIN
  -- ---- Lookup family timezone via member ---------------------------------
  SELECT f.timezone INTO v_family_timezone
  FROM family_members fm JOIN families f ON f.id = fm.family_id
  WHERE fm.id = NEW.family_member_id;

  IF v_family_timezone IS NULL OR v_family_timezone = '' THEN
    v_family_timezone := 'America/Chicago';
  END IF;

  v_server_today := (NOW() AT TIME ZONE v_family_timezone)::date;

  -- ---- Lookup allowance_configs (period_type, period_start_day) ----------
  SELECT period_type, period_start_day
    INTO v_config
  FROM allowance_configs
  WHERE family_member_id = NEW.family_member_id;

  -- Allowance config missing is only valid if bootstrap hasn't run yet —
  -- but a period should not be inserted before the config exists. Fail loud.
  IF NOT FOUND THEN
    RAISE EXCEPTION
      'allowance_periods insert for member % has no matching allowance_configs row (bootstrap ordering violation)',
      NEW.family_member_id;
  END IF;

  -- MVP fail-loud: only weekly is wired. Biweekly/monthly are PRD-28
  -- post-MVP (§Screen 2 Section 7 "Deferred" note) pending PRD-35 adoption.
  IF COALESCE(v_config.period_type, 'weekly') <> 'weekly' THEN
    RAISE EXCEPTION
      'allowance_periods date trigger: period_type=% is not yet wired (MVP is weekly only)',
      v_config.period_type;
  END IF;

  -- ---- Resolve period_start_day text → DOW integer -----------------------
  v_start_dow := CASE LOWER(v_config.period_start_day)
    WHEN 'sunday'    THEN 0
    WHEN 'monday'    THEN 1
    WHEN 'tuesday'   THEN 2
    WHEN 'wednesday' THEN 3
    WHEN 'thursday'  THEN 4
    WHEN 'friday'    THEN 5
    WHEN 'saturday'  THEN 6
    ELSE 0
  END;

  -- ---- Determine whether this is the FIRST period for this member --------
  -- First period = no other rows exist for this member (excluding this row
  -- itself on UPDATE). Uses an "IS DISTINCT FROM" NULL-safe comparison so a
  -- new INSERT with a freshly minted NEW.id still counts correctly.
  SELECT COUNT(*) INTO v_prior_count
  FROM allowance_periods
  WHERE family_member_id = NEW.family_member_id
    AND id IS DISTINCT FROM NEW.id;

  v_first_period := (v_prior_count = 0);

  -- ---- Derive period_start -----------------------------------------------
  -- Policy differs by period-ordinal:
  --
  --   First period (bootstrap):
  --     NULL                          → server-today
  --     within 1 day of server-today  → coerce to server-today (clock-drift fix)
  --     more than 1 day off           → respect (backdated import)
  --
  --   Subsequent periods (cron roll-over or manual insert):
  --     NULL                          → prior.period_end + 1
  --     non-NULL                      → respect exactly
  --
  --   The 1-day coercion WINDOW is intentionally NOT applied to subsequent
  --   periods. If the cron misses a day and recovers, it computes
  --   nextStart = prior.period_end + 1 (which may be yesterday in family tz
  --   and still be the correct schedule-aligned value). A 1-day coercion
  --   here would incorrectly advance that value to server-today and shift
  --   every downstream week by a day.
  IF v_first_period THEN
    IF NEW.period_start IS NULL THEN
      NEW.period_start := v_server_today;
    ELSIF ABS(NEW.period_start - v_server_today) <= 1 THEN
      NEW.period_start := v_server_today;
    END IF;
  ELSE
    IF NEW.period_start IS NULL THEN
      SELECT period_end + 1 INTO NEW.period_start
      FROM allowance_periods
      WHERE family_member_id = NEW.family_member_id
        AND id IS DISTINCT FROM NEW.id
      ORDER BY period_end DESC
      LIMIT 1;
      -- If there genuinely is no prior row (should not happen given
      -- v_first_period was false), fail loud rather than silently fill.
      IF NEW.period_start IS NULL THEN
        RAISE EXCEPTION
          'allowance_periods trigger: subsequent-period insert has no prior row to anchor period_start (member %)',
          NEW.family_member_id;
      END IF;
    END IF;
  END IF;

  -- ---- Derive period_end --------------------------------------------------
  -- Compute the expected period_end from the now-canonical period_start.
  v_current_dow := EXTRACT(DOW FROM NEW.period_start)::INT;

  IF v_first_period THEN
    -- Option (b): first period may be partial.
    -- days_until_next_start_day = (start_dow - current_dow + 7) mod 7
    --   but 0 (already on start day) → full 7-day week (7, not 0).
    -- period_end = period_start + days_until_next_start_day - 1
    v_days_until_start := ((v_start_dow - v_current_dow + 7) % 7);
    IF v_days_until_start = 0 THEN
      v_days_until_start := 7;
    END IF;
    v_expected_end := NEW.period_start + (v_days_until_start - 1);
  ELSE
    -- Subsequent periods must be full 7-day weeks (period_start_day through
    -- period_start_day+6). If period_start doesn't align, still compute
    -- period_end as start+6 — the write path for subsequent periods is the
    -- cron roll-over which sets period_start = prior.period_end + 1, so
    -- alignment is maintained inductively once the first period is closed.
    v_expected_end := NEW.period_start + 6;
  END IF;

  -- Apply the same 1-day correction window for period_end.
  IF NEW.period_end IS NULL THEN
    NEW.period_end := v_expected_end;
  ELSIF ABS(NEW.period_end - v_expected_end) <= 1 THEN
    NEW.period_end := v_expected_end;
  END IF;

  -- ---- Final sanity check: period_end must be >= period_start ------------
  IF NEW.period_end < NEW.period_start THEN
    RAISE EXCEPTION
      'allowance_periods: period_end % precedes period_start %',
      NEW.period_end, NEW.period_start;
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_allowance_period_dates() IS
  'Row 9 SCOPE-3.F14 / Worker B1a. BEFORE INSERT OR UPDATE trigger on allowance_periods that derives period_start + period_end server-side from families.timezone + allowance_configs.period_start_day. Implements founder Option (b): first period may be partial (server-today → day-before-next-period_start_day); subsequent periods are full 7-day weeks. Fails loud on period_type <> ''weekly'' (PRD-28 MVP constraint).';

DROP TRIGGER IF EXISTS trg_set_allowance_period_dates ON public.allowance_periods;
CREATE TRIGGER trg_set_allowance_period_dates
  BEFORE INSERT OR UPDATE OF period_start, period_end, family_member_id
  ON public.allowance_periods
  FOR EACH ROW EXECUTE FUNCTION public.set_allowance_period_dates();

-- ============================================================================
-- Part 2: Partial unique index — one active/makeup_window period per member
-- ============================================================================

-- Guards against React strict-mode double-fire of useStartAllowancePeriod and
-- any future bootstrap path that forgets the "check for existing active"
-- guard. If two concurrent inserts slip past the client guard, this index
-- rejects the second. Does NOT conflict with cron roll-over because cron
-- transitions old period active → calculated BEFORE inserting the next
-- period active.
CREATE UNIQUE INDEX IF NOT EXISTS allowance_periods_one_active_per_member
  ON public.allowance_periods (family_member_id)
  WHERE status IN ('active', 'makeup_window');

COMMENT ON INDEX public.allowance_periods_one_active_per_member IS
  'Row 9 SCOPE-3.F14 / Worker B1a. At most one period per member in an unresolved state. Prevents double-bootstrap (React strict-mode) and cron-race duplicates.';

-- ============================================================================
-- Part 3: Idempotent backfill of misaligned existing rows
-- ============================================================================

-- For existing rows, re-derive period_start + period_end server-side and
-- override ONLY when within 1 day of expected (the device-clock-bug window).
-- Backdated historical imports — more than 1 day off — are respected.
--
-- Implementation: realignment is equivalent to re-running the trigger logic.
-- Rather than duplicate the PL/pgSQL body in SQL, we perform a no-op UPDATE
-- that fires the trigger for every row. The trigger's own guards determine
-- which rows actually change.
--
-- This is safe because:
--   * The trigger only changes dates when they're within the 1-day window.
--   * Updates outside the 1-day window are no-ops (trigger respects the
--     existing value).
--   * The partial unique index is already in place; any row that would
--     produce a conflict is an existing conflict and will surface loud.

DO $backfill$
DECLARE
  v_row RECORD;
  v_updated INT := 0;
BEGIN
  FOR v_row IN
    SELECT id FROM public.allowance_periods
  LOOP
    BEGIN
      UPDATE public.allowance_periods
        SET period_start = period_start,
            period_end   = period_end
        WHERE id = v_row.id;
      v_updated := v_updated + 1;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'backfill skipped row % — %', v_row.id, SQLERRM;
    END;
  END LOOP;
  RAISE NOTICE 'allowance_periods backfill touched % rows (trigger decides which actually changed)', v_updated;
END;
$backfill$;

-- ============================================================================
-- Part 4: Verification queries (commented — run post-apply)
-- ============================================================================
--
-- 1. Zero misaligned rows within the 1-day bug window:
--
--    SELECT ap.id,
--           ap.period_start,
--           ap.period_end,
--           ac.period_start_day,
--           f.timezone
--    FROM allowance_periods ap
--    JOIN family_members fm ON fm.id = ap.family_member_id
--    JOIN families f ON f.id = fm.family_id
--    JOIN allowance_configs ac ON ac.family_member_id = ap.family_member_id
--    WHERE (ap.period_end - ap.period_start) NOT BETWEEN 0 AND 6;
--    -- Expected: 0 (all weeks length 1–7 days; first week may be partial).
--
-- 2. Every active/makeup_window pair is unique per member:
--
--    SELECT family_member_id, COUNT(*)
--    FROM allowance_periods
--    WHERE status IN ('active', 'makeup_window')
--    GROUP BY 1 HAVING COUNT(*) > 1;
--    -- Expected: 0 rows.
--
-- 3. Every subsequent period is aligned to period_start_day:
--
--    WITH members_with_prior AS (
--      SELECT family_member_id
--      FROM allowance_periods
--      GROUP BY 1 HAVING COUNT(*) > 1
--    )
--    SELECT ap.id, ap.period_start, ac.period_start_day,
--           EXTRACT(DOW FROM ap.period_start) AS actual_dow
--    FROM allowance_periods ap
--    JOIN members_with_prior mwp ON mwp.family_member_id = ap.family_member_id
--    JOIN allowance_configs ac ON ac.family_member_id = ap.family_member_id
--    WHERE ap.period_start <> (
--      SELECT MIN(period_start) FROM allowance_periods
--      WHERE family_member_id = ap.family_member_id
--    )
--    AND EXTRACT(DOW FROM ap.period_start)::INT <> (
--      CASE LOWER(ac.period_start_day)
--        WHEN 'sunday' THEN 0 WHEN 'monday' THEN 1 WHEN 'tuesday' THEN 2
--        WHEN 'wednesday' THEN 3 WHEN 'thursday' THEN 4 WHEN 'friday' THEN 5
--        WHEN 'saturday' THEN 6 ELSE 0 END
--    );
--    -- Expected: 0 (every non-first period starts on configured day).
