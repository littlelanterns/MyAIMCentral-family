-- ============================================================================
-- 100295 — Point Economy Slice A1: Ledger + Semantic Section-Day-Match Fix
--          PRD-24 Point Economy Addendum §5.1/§5.3/§8.1 (Convention #271/#278
--          Rider 2, Convention #223 append-only-ledger discipline)
--
-- Two independent pieces, shipped together because A2 (config-as-truth award
-- resolution) depends on both:
--
--   1. point_transactions — new append-only ledger table + the choke-point
--      record_point_transaction() RPC. grant_points() is retrofitted to
--      delegate to it (its external signature and return shape are
--      UNTOUCHED — dispatch_godmothers is not edited). Opening-balance
--      backfill gives every existing family_member a starting ledger row so
--      SUM(amount) = balance_after = family_members.gamification_points holds
--      from day one.
--
--   2. Semantic section-day-match fix (defect 4 from the addendum's design
--      session) — get_member_day_obligations and calculate_allowance_progress
--      (both CURRENT bodies as of migration 100247, verified via
--      `grep -rl` across all migrations immediately before this one was
--      written — no later migration touches either function) currently match
--      a routine section to a calendar day via
--        (EXTRACT(DOW FROM d)::INT::TEXT) = ANY(tts.frequency_days)
--      with NO branch on frequency_rule at all. For 'daily'/'weekly'/
--      'monthly' sections (stored with frequency_days = NULL, which is how
--      the routine editor serializes them — see
--      serializeRoutineSectionsForRpc.ts / update_routine_template_atomic),
--      `x = ANY(NULL)` evaluates to NULL (falsy), so those sections currently
--      match ZERO days, not every day. Verified in production immediately
--      before writing this migration: 12 such sections exist, ALL on
--      undeployed templates (zero active_deployed_tasks, zero assignees) —
--      so today this is silent-but-harmless, but the point-economy
--      routine-completion event (Slice A2) is a NEW consumer of
--      get_member_day_obligations that would immediately misfire the moment
--      mom deploys her first daily-section routine, and the addendum's rider
--      2 (daily points goal) makes correctness here load-bearing for money-
--      adjacent math via calculate_allowance_progress too.
--
--      Fix: new public.section_scheduled_on_day(frequency_rule,
--      frequency_days, date) predicate, mirroring the CLIENT's
--      isSectionActiveToday (RoutineStepChecklist.tsx:787-840) core
--      day-membership decision EXACTLY, including its fail-open behavior for
--      malformed/empty custom sections (the client's `days.length` guard
--      means an empty/NULL frequency_days on a 'custom' or 'specific_days'
--      section also falls through to "every day", not "no day"):
--        daily / NULL rule            → every day
--        weekdays                     → DOW 1-5 (Mon-Fri)
--        custom / specific_days       → frequency_days array membership,
--                                        ONLY when frequency_days is
--                                        non-empty; empty/NULL falls through
--        anything else (incl. weekly/monthly, and any future value)
--                                      → every day (client-reader parity —
--                                        this is the exact fallthrough the
--                                        addendum calls "match-all")
--
--      This function replaces the raw day-match expression at exactly 3
--      sites: 1 in get_member_day_obligations (the section JOIN), 2 in
--      calculate_allowance_progress (the day-loop denominator subquery, and
--      the completions-counting show_until_complete OR-clause). Both
--      function bodies below are otherwise BYTE-FOR-BYTE identical to their
--      100247 CURRENT bodies — no other behavior changes ride along.
--
--      tests/routine-day-state-invariant.test.ts is extended in this SAME
--      migration (never a later one, per the coordination seat's rider) with
--      a parallel TS mirror of section_scheduled_on_day and a corpus proving
--      TS/SQL agreement — the file's own existing contract ("if you change
--      one, change the other, and this test must still pass") is honored.
--
-- Pre-apply production check run immediately before this file was written
-- (coordination seat rider 1): re-queried the 12 frequency_days-NULL
-- sections; all 12 still show 0 active_deployed_tasks / 0 distinct_assignees.
-- No real kid's allowance denominator is affected by this fix today.
-- ============================================================================


-- ============================================================================
-- Part 1 — point_transactions ledger
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.point_transactions (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id         UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  family_member_id  UUID NOT NULL REFERENCES public.family_members(id) ON DELETE CASCADE,
  amount            INTEGER NOT NULL,        -- + earn, − spend/adjustment-down
  balance_after     INTEGER NOT NULL,        -- running balance at insert time
  transaction_type  TEXT NOT NULL
                      CHECK (transaction_type IN ('earn', 'spend', 'refund', 'adjustment')),
  source_type       TEXT NOT NULL,           -- free text, same posture as earned_prizes.source_type
  source_id         UUID,
  description       TEXT,
  idempotency_key   TEXT UNIQUE,             -- plain UNIQUE: Postgres never treats NULL as
                                              -- conflicting with NULL, so unlimited rows may
                                              -- omit a key while non-null keys stay unique.
  acted_by          UUID REFERENCES public.family_members(id) ON DELETE SET NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pt_member_created
  ON public.point_transactions (family_member_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pt_family_created
  ON public.point_transactions (family_id, created_at DESC);

COMMENT ON TABLE public.point_transactions IS
  'PRD-24 Point Economy Addendum §8.1 (Convention #223 append-only ledger — '
  'third sibling after financial_transactions and family_goal_contributions). '
  'INSERT-only via record_point_transaction() SECURITY DEFINER; no client '
  'write policies exist on this table by design. Invariant: SUM(amount) over '
  'a member''s rows = their latest balance_after = family_members.gamification_points.';

ALTER TABLE public.point_transactions ENABLE ROW LEVEL SECURITY;

-- SELECT only: mom sees every row in her family; a member sees their own
-- rows. No write policy of any kind — see record_point_transaction() below.
DROP POLICY IF EXISTS "pt_select" ON public.point_transactions;
CREATE POLICY "pt_select"
  ON public.point_transactions FOR SELECT
  USING (
    family_member_id IN (
      SELECT fm.id FROM public.family_members fm WHERE fm.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.user_id = auth.uid()
        AND fm.family_id = point_transactions.family_id
        AND fm.role = 'primary_parent'
    )
  );


-- ── record_point_transaction ─────────────────────────────────────────────
-- The single choke point for every gamification_points mutation. INTERNAL
-- ONLY (revoked from anon/authenticated below, matching the
-- evaluate_family_goal_award precedent in migration 100284) — callers are
-- other SECURITY DEFINER functions (grant_points here; process_routine_step_
-- completion + the Reward Shop purchase RPCs in later slices), which run
-- with the DEFINER's own privileges internally and so are unaffected by the
-- REVOKE. If a future slice needs genuine direct-from-client access (e.g.
-- Reset & Advanced), the correct shape is a purpose-built wrapper RPC that
-- authorizes its own specific caller context and then calls this function —
-- never granting this primitive itself to authenticated.

CREATE OR REPLACE FUNCTION public.record_point_transaction(
  p_family_id         UUID,
  p_family_member_id  UUID,
  p_amount            INTEGER,
  p_transaction_type  TEXT,
  p_source_type       TEXT,
  p_source_id         UUID DEFAULT NULL,
  p_description       TEXT DEFAULT NULL,
  p_idempotency_key   TEXT DEFAULT NULL,
  p_acted_by          UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_current_balance INTEGER;
  v_new_balance     INTEGER;
  v_txn_id          UUID;
BEGIN
  IF p_transaction_type NOT IN ('earn', 'spend', 'refund', 'adjustment') THEN
    RETURN jsonb_build_object('status', 'error', 'error_message', 'invalid transaction_type');
  END IF;

  IF p_amount IS NULL OR p_amount = 0 THEN
    RETURN jsonb_build_object('status', 'error', 'error_message', 'amount must be non-zero');
  END IF;

  -- Idempotency short-circuit BEFORE the row lock: a retried call with the
  -- same key is a cheap unlocked read, not a contested write.
  IF p_idempotency_key IS NOT NULL THEN
    SELECT id, balance_after INTO v_txn_id, v_new_balance
      FROM public.point_transactions
     WHERE idempotency_key = p_idempotency_key;
    IF FOUND THEN
      RETURN jsonb_build_object(
        'status', 'already_recorded',
        'transaction_id', v_txn_id,
        'balance_after', v_new_balance
      );
    END IF;
  END IF;

  -- Row lock: serializes concurrent earns/spends against the same member so
  -- balance math is race-safe (the shop purchase race in Worker B leans on
  -- this same lock).
  SELECT gamification_points INTO v_current_balance
    FROM public.family_members
   WHERE id = p_family_member_id
     AND family_id = p_family_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('status', 'error', 'error_message', 'member not found');
  END IF;

  v_current_balance := COALESCE(v_current_balance, 0);
  v_new_balance := v_current_balance + p_amount;

  IF v_new_balance < 0 THEN
    -- Never an error state to the caller — celebration-only law (ruling 9).
    -- The caller decides how to frame this; we just refuse the write.
    RETURN jsonb_build_object(
      'status', 'insufficient_balance',
      'balance_after', v_current_balance
    );
  END IF;

  INSERT INTO public.point_transactions (
    family_id, family_member_id, amount, balance_after,
    transaction_type, source_type, source_id, description,
    idempotency_key, acted_by
  ) VALUES (
    p_family_id, p_family_member_id, p_amount, v_new_balance,
    p_transaction_type, p_source_type, p_source_id, p_description,
    p_idempotency_key, p_acted_by
  )
  ON CONFLICT (idempotency_key) DO NOTHING
  RETURNING id INTO v_txn_id;

  -- Race: a concurrent call won the idempotency key between our check above
  -- and this insert. Our computed balance was never applied — report the
  -- winner's balance instead.
  IF v_txn_id IS NULL THEN
    SELECT id, balance_after INTO v_txn_id, v_new_balance
      FROM public.point_transactions
     WHERE idempotency_key = p_idempotency_key;
    RETURN jsonb_build_object(
      'status', 'already_recorded',
      'transaction_id', v_txn_id,
      'balance_after', v_new_balance
    );
  END IF;

  UPDATE public.family_members
     SET gamification_points = v_new_balance
   WHERE id = p_family_member_id;

  RETURN jsonb_build_object(
    'status', 'recorded',
    'transaction_id', v_txn_id,
    'balance_after', v_new_balance
  );
END;
$fn$;

REVOKE ALL ON FUNCTION public.record_point_transaction(
  UUID, UUID, INTEGER, TEXT, TEXT, UUID, TEXT, TEXT, UUID
) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_point_transaction(
  UUID, UUID, INTEGER, TEXT, TEXT, UUID, TEXT, TEXT, UUID
) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_point_transaction(
  UUID, UUID, INTEGER, TEXT, TEXT, UUID, TEXT, TEXT, UUID
) TO service_role;

COMMENT ON FUNCTION public.record_point_transaction IS
  'PRD-24 Point Economy Addendum §8.1: the single choke point for every '
  'gamification_points mutation. Append-only, row-locked, idempotency-key '
  'deduplicated. INTERNAL ONLY — revoked from anon/authenticated (mirrors '
  'the evaluate_family_goal_award precedent, migration 100284). Called by '
  'grant_points() here; by process_routine_step_completion() and the Reward '
  'Shop purchase RPCs in later slices.';


-- ── grant_points retrofit ────────────────────────────────────────────────
-- External signature and return shape are UNCHANGED (dispatch_godmothers /
-- execute_points_godmother / src/lib/gamification/grantPoints.ts all call
-- this exact signature and read status/points_awarded/new_total — verified
-- against the CURRENT 100210 body before writing this rewrite). Internally
-- it now delegates the actual balance mutation to record_point_transaction
-- instead of UPDATE-ing family_members directly, so every point grant —
-- connector-driven or otherwise — lands a ledger row.

CREATE OR REPLACE FUNCTION public.grant_points(
  p_family_id  UUID,
  p_member_id  UUID,
  p_points     INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_config  RECORD;
  v_result  JSONB;
BEGIN
  IF p_points IS NULL OR p_points <= 0 THEN
    RETURN jsonb_build_object(
      'status', 'no_op',
      'error_message', 'points must be positive'
    );
  END IF;

  SELECT * INTO v_config
    FROM public.gamification_configs
   WHERE family_id = p_family_id
     AND family_member_id = p_member_id;

  IF NOT FOUND OR NOT COALESCE(v_config.enabled, false) THEN
    RETURN jsonb_build_object(
      'status', 'no_op',
      'error_message', 'gamification disabled for this member'
    );
  END IF;

  v_result := public.record_point_transaction(
    p_family_id,
    p_member_id,
    p_points,
    'earn',
    'contract_grant',
    NULL,
    NULL,
    NULL,
    NULL
  );

  IF (v_result ->> 'status') NOT IN ('recorded', 'already_recorded') THEN
    RETURN jsonb_build_object(
      'status', 'failed',
      'error_message', COALESCE(v_result ->> 'error_message', 'ledger write failed')
    );
  END IF;

  RETURN jsonb_build_object(
    'status', 'granted',
    'points_awarded', p_points,
    'new_total', (v_result ->> 'balance_after')::integer
  );
END;
$fn$;

COMMENT ON FUNCTION public.grant_points IS
  'Generic gamification points grant. Delegates the actual ledger write to '
  'record_point_transaction() (PRD-24 Point Economy Addendum). External '
  'signature and JSONB return shape (status/points_awarded/new_total) are '
  'UNCHANGED from the pre-ledger 100210 body — dispatch_godmothers and '
  'execute_points_godmother are not edited by this migration. Respects '
  'gamification_configs.enabled. Does not touch streaks, creatures, or pages.';


-- ── Opening-balance backfill ─────────────────────────────────────────────
-- One 'opening_balance' row per family_member so the ledger invariant
-- (SUM(amount) = balance_after = family_members.gamification_points) holds
-- for every member from the moment the ledger exists — including members
-- with a zero balance today. Idempotent: skips any member who already has
-- an opening_balance row (safe to re-run this migration file).

INSERT INTO public.point_transactions (
  family_id, family_member_id, amount, balance_after,
  transaction_type, source_type, description
)
SELECT
  fm.family_id,
  fm.id,
  COALESCE(fm.gamification_points, 0),
  COALESCE(fm.gamification_points, 0),
  'adjustment',
  'opening_balance',
  'Opening balance at ledger creation'
FROM public.family_members fm
WHERE NOT EXISTS (
  SELECT 1 FROM public.point_transactions pt
   WHERE pt.family_member_id = fm.id
     AND pt.source_type = 'opening_balance'
);


-- ============================================================================
-- Part 2 — Semantic section-day-match fix (defect 4)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.section_scheduled_on_day(
  p_frequency_rule TEXT,
  p_frequency_days TEXT[],
  p_date           DATE
)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p_frequency_rule IS NULL OR p_frequency_rule = 'daily' THEN TRUE
    WHEN p_frequency_rule = 'weekdays' THEN
      EXTRACT(DOW FROM p_date)::INT BETWEEN 1 AND 5
    WHEN p_frequency_rule IN ('custom', 'specific_days')
         AND p_frequency_days IS NOT NULL
         AND array_length(p_frequency_days, 1) > 0
      THEN (EXTRACT(DOW FROM p_date)::INT::TEXT) = ANY(p_frequency_days)
    ELSE TRUE
    -- weekly / monthly / malformed-empty-custom / any unrecognized value →
    -- match every day. Mirrors the client's isSectionActiveToday
    -- (RoutineStepChecklist.tsx:787-840) final fallthrough exactly,
    -- including its fail-open behavior for a custom/specific_days section
    -- whose frequency_days is empty or NULL (the client's `days.length`
    -- guard skips the array-membership branch entirely in that case and
    -- falls through to `return true`).
  END;
$$;

GRANT EXECUTE ON FUNCTION public.section_scheduled_on_day(TEXT, TEXT[], DATE)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.section_scheduled_on_day IS
  'PRD-24 Point Economy Addendum defect 4 fix. Single source of truth for '
  '"was this routine section scheduled on this exact calendar day," used by '
  'get_member_day_obligations and calculate_allowance_progress. Mirrors the '
  'client RoutineStepChecklist.tsx isSectionActiveToday core day-membership '
  'decision (excluding its show_until_complete carry-forward branches, '
  'which are a separate, already-correct concern handled by each caller''s '
  'own show_until_complete OR-clause). tests/routine-day-state-invariant.'
  'test.ts carries a parallel TS mirror — change one, change the other.';


-- ── get_member_day_obligations — day-match fix only ──────────────────────
-- Body otherwise byte-for-byte identical to the CURRENT 100247 definition.

DROP FUNCTION IF EXISTS public.get_member_day_obligations(UUID, DATE, DATE);

CREATE FUNCTION public.get_member_day_obligations(
  p_member_id    UUID,
  p_period_start DATE,
  p_period_end   DATE
)
RETURNS TABLE (
  date                   DATE,
  source_type            TEXT,
  task_id                UUID,
  template_id            UUID,
  section_id             UUID,
  step_id                UUID,
  pool_id                UUID,
  task_segment_id        UUID,
  counts_for_allowance   BOOLEAN,
  counts_for_gamification BOOLEAN,
  counts_for_homework    BOOLEAN,
  is_extra_credit        BOOLEAN,
  allowance_points       INTEGER,
  homework_subject_ids   UUID[]
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  v_member_family UUID;
  v_authorized BOOLEAN := FALSE;
BEGIN
  -- Authorization: service_role, or a member of the subject's family.
  SELECT family_id INTO v_member_family FROM family_members WHERE id = p_member_id;
  IF v_member_family IS NULL THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  IF auth.role() = 'service_role' THEN
    v_authorized := TRUE;
  ELSIF auth.uid() IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM family_members caller
      WHERE caller.family_id = v_member_family
        AND caller.user_id = auth.uid()
    ) INTO v_authorized;
  END IF;

  IF NOT v_authorized THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  RETURN QUERY
  WITH period_days AS (
    SELECT gs::DATE AS d
    FROM generate_series(p_period_start, p_period_end, INTERVAL '1 day') gs
  ),
  -- Candidate routine tasks: assigned directly OR via task_assignments.
  candidate_tasks AS (
    SELECT DISTINCT t.id, t.template_id, t.pool_id, t.task_segment_id,
           t.counts_for_allowance, t.counts_for_gamification,
           t.counts_for_homework, t.is_extra_credit,
           t.allowance_points, t.homework_subject_ids
    FROM tasks t
    WHERE t.task_type = 'routine'
      AND t.template_id IS NOT NULL
      AND (
        t.assignee_id = p_member_id
        OR EXISTS (
          SELECT 1 FROM task_assignments ta
           WHERE ta.task_id = t.id AND ta.family_member_id = p_member_id
        )
      )
      -- coarse pre-filter; Layer 1 does the authoritative per-day check
      AND t.created_at::DATE <= p_period_end
      AND (t.archived_at IS NULL OR t.archived_at::DATE >= p_period_start)
  )
  SELECT
    pd.d AS date,
    'routine_step'::TEXT AS source_type,
    ct.id AS task_id,
    ct.template_id,
    tts.id AS section_id,
    stp.id AS step_id,
    ct.pool_id,
    ct.task_segment_id,
    ct.counts_for_allowance,
    ct.counts_for_gamification,
    ct.counts_for_homework,
    ct.is_extra_credit,
    ct.allowance_points,
    ct.homework_subject_ids
  FROM period_days pd
  JOIN candidate_tasks ct ON TRUE
  -- authoritative per-day task activity (painted rdates, until, dtstart, etc.)
  JOIN LATERAL (
    SELECT public.obligation_active_for_member_on_date(ct.id, p_member_id, pd.d) AS active
  ) act ON act.active
  -- sections scheduled on this day (Convention #271 defect-4 fix, 100295:
  -- semantic day-match via section_scheduled_on_day instead of raw
  -- frequency_days membership, so daily/weekly/monthly sections — stored
  -- with frequency_days = NULL — correctly match every day instead of none)
  JOIN task_template_sections tts
    ON tts.template_id = ct.template_id
   AND public.section_scheduled_on_day(tts.frequency_rule, tts.frequency_days, pd.d)
  -- steps that existed on this day (created_at fairness, 100244)
  JOIN task_template_steps stp
    ON stp.section_id = tts.id
   AND stp.created_at::DATE <= pd.d
  ORDER BY pd.d, tts.sort_order, stp.sort_order;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_member_day_obligations(UUID, DATE, DATE)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.get_member_day_obligations IS
  'Convention #271 Layer 2 (public canonical query). One row per (date, '
  'routine step) that counts for the member in the period. This build '
  'populates source_type=''routine_step'' only; future builds extend to '
  'other source types without renaming. Return shape carries pool_id, '
  'task_segment_id, is_extra_credit, homework_subject_ids for future reward '
  'surfaces. Gates each day through obligation_active_for_member_on_date so '
  'painted rdates / until / dtstart are honored. 100295: section-day '
  'matching now routes through section_scheduled_on_day (semantic, '
  'frequency_rule-aware) instead of raw frequency_days array membership — '
  'fixes daily/weekly/monthly sections (frequency_days=NULL) silently '
  'matching zero days.';


-- ── calculate_allowance_progress — day-match fix only (2 sites) ──────────
-- Body otherwise byte-for-byte identical to the CURRENT 100247 definition.

CREATE OR REPLACE FUNCTION public.calculate_allowance_progress(
  p_member_id    UUID,
  p_period_start DATE,
  p_period_end   DATE,
  p_grace_days   JSONB DEFAULT NULL,
  p_pool_name    TEXT  DEFAULT 'default'
)
RETURNS TABLE (
  pool_name                TEXT,
  effective_tasks_assigned NUMERIC,
  effective_tasks_completed NUMERIC,
  completion_percentage    NUMERIC,
  total_points             NUMERIC,
  completed_points         NUMERIC,
  base_amount              NUMERIC,
  bonus_applied            BOOLEAN,
  bonus_amount             NUMERIC,
  calculated_amount        NUMERIC,
  total_earned             NUMERIC,
  minimum_threshold        INTEGER,
  bonus_threshold          INTEGER,
  calculation_approach     TEXT,
  rounding_behavior        TEXT,
  raw_steps_completed      INTEGER,
  raw_steps_available      INTEGER,
  nonroutine_tasks_total   INTEGER,
  nonroutine_tasks_completed INTEGER,
  extra_credit_completed   INTEGER,
  extra_credit_weight_added NUMERIC,
  numerator_boost_total    NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_config RECORD;
  v_config_id UUID;
  v_period_days INT;
  v_total_assigned NUMERIC := 0;
  v_total_completed NUMERIC := 0;
  v_total_points NUMERIC := 0;
  v_completed_points NUMERIC := 0;
  v_task RECORD;
  v_days_active INT;
  v_pool_fraction NUMERIC;
  v_weight NUMERIC;
  v_routine_total_possible INT;
  v_routine_actual_completed INT;
  v_routine_orphan_completed INT;
  v_routine_fraction NUMERIC;
  v_completion_pct NUMERIC;
  v_base NUMERIC;
  v_calc_amount NUMERIC;
  v_bonus_applied BOOLEAN;
  v_bonus_amt NUMERIC;
  v_total_earned_val NUMERIC;
  v_effective_start DATE;
  v_effective_end DATE;
  v_day DATE;
  v_day_step_count INT;
  v_member_family UUID;
  v_authorized BOOLEAN := FALSE;
  v_raw_steps_completed INT := 0;
  v_raw_steps_available INT := 0;
  v_nonroutine_total INT := 0;
  v_nonroutine_completed INT := 0;
  v_extra_credit_completed INT := 0;
  v_extra_credit_weight NUMERIC := 0;
  v_grace_enabled BOOLEAN;
  v_overage_cap NUMERIC;
  v_full_exclude_set DATE[] := ARRAY[]::DATE[];
  v_numerator_keep_set DATE[] := ARRAY[]::DATE[];
  v_grace_entry JSONB;
  v_grace_date DATE;
  v_grace_mode TEXT;
  v_numerator_boost NUMERIC := 0;
BEGIN
  SELECT family_id INTO v_member_family FROM family_members WHERE id = p_member_id;
  IF v_member_family IS NULL THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  IF auth.role() = 'service_role' THEN
    v_authorized := TRUE;
  ELSIF auth.uid() IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM family_members caller
      WHERE caller.family_id = v_member_family
        AND caller.user_id = auth.uid()
    ) INTO v_authorized;
  END IF;

  IF NOT v_authorized THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT * INTO v_config
  FROM allowance_configs
  WHERE family_member_id = p_member_id
    AND allowance_configs.pool_name = p_pool_name;

  IF NOT FOUND OR NOT v_config.enabled THEN
    RETURN QUERY SELECT
      p_pool_name,
      0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC,
      0::NUMERIC, FALSE, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC,
      0::INTEGER, 0::INTEGER, 'dynamic'::TEXT, 'round_nearest'::TEXT,
      0::INTEGER, 0::INTEGER, 0::INTEGER, 0::INTEGER,
      0::INTEGER, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;

  v_config_id := v_config.id;
  v_overage_cap := COALESCE(v_config.overage_cap, 100);

  v_grace_enabled := COALESCE(v_config.grace_days_enabled, TRUE);
  IF v_grace_enabled AND p_grace_days IS NOT NULL AND jsonb_typeof(p_grace_days) = 'array' THEN
    FOR v_grace_entry IN SELECT * FROM jsonb_array_elements(p_grace_days) LOOP
      IF jsonb_typeof(v_grace_entry) = 'string' THEN
        BEGIN
          v_grace_date := (v_grace_entry #>> '{}')::DATE;
          v_full_exclude_set := array_append(v_full_exclude_set, v_grace_date);
        EXCEPTION WHEN OTHERS THEN
          NULL;
        END;
      ELSIF jsonb_typeof(v_grace_entry) = 'object' THEN
        BEGIN
          v_grace_date := (v_grace_entry ->> 'date')::DATE;
          v_grace_mode := COALESCE(v_grace_entry ->> 'mode', 'full_exclude');
          IF v_grace_mode = 'numerator_keep' THEN
            v_numerator_keep_set := array_append(v_numerator_keep_set, v_grace_date);
          ELSE
            v_full_exclude_set := array_append(v_full_exclude_set, v_grace_date);
          END IF;
        EXCEPTION WHEN OTHERS THEN
          NULL;
        END;
      END IF;
    END LOOP;
  END IF;

  v_period_days := (p_period_end - p_period_start) + 1;
  IF v_period_days < 1 THEN
    v_period_days := 1;
  END IF;
  v_base := COALESCE(v_config.weekly_amount, 0);

  -- Include tasks archived DURING the period (100243 fix)
  FOR v_task IN
    SELECT t.id, t.task_type, t.status, t.template_id, t.allowance_points, t.created_at,
           t.is_extra_credit, t.archived_at
    FROM tasks t
    WHERE t.assignee_id = p_member_id
      AND t.counts_for_allowance = TRUE
      AND (t.archived_at IS NULL OR t.archived_at::DATE > p_period_start)
      AND t.created_at::DATE <= p_period_end
      AND (
        t.pool_id = v_config_id
        OR (t.pool_id IS NULL AND p_pool_name = 'default')
      )
  LOOP
    v_effective_start := GREATEST(v_task.created_at::DATE, p_period_start);
    IF v_effective_start > p_period_end THEN
      CONTINUE;
    END IF;

    IF v_task.archived_at IS NOT NULL THEN
      v_effective_end := LEAST(p_period_end, (v_task.archived_at::DATE - 1));
      IF v_effective_end < v_effective_start THEN
        CONTINUE;
      END IF;
    ELSE
      v_effective_end := p_period_end;
    END IF;

    v_days_active := (v_effective_end - v_effective_start) + 1;
    v_pool_fraction := v_days_active::NUMERIC / v_period_days;
    v_weight := COALESCE(v_task.allowance_points, v_config.default_point_value, 1);

    IF v_task.is_extra_credit = TRUE
       AND v_task.task_type <> 'routine'
       AND COALESCE(v_config.extra_credit_enabled, FALSE) = TRUE THEN
      IF v_task.status = 'completed' THEN
        v_extra_credit_completed := v_extra_credit_completed + 1;
        v_extra_credit_weight := v_extra_credit_weight + (v_weight * v_pool_fraction);
        v_total_completed := v_total_completed + v_pool_fraction;
        v_completed_points := v_completed_points + (v_weight * v_pool_fraction);
      END IF;
      CONTINUE;
    END IF;

    v_total_assigned := v_total_assigned + v_pool_fraction;
    v_total_points := v_total_points + (v_weight * v_pool_fraction);

    IF v_task.task_type = 'routine' AND v_task.template_id IS NOT NULL THEN
      v_routine_total_possible := 0;
      v_day := v_effective_start;
      WHILE v_day <= v_effective_end LOOP
        IF v_day = ANY(v_full_exclude_set) OR v_day = ANY(v_numerator_keep_set) THEN
          v_day := v_day + 1;
          CONTINUE;
        END IF;

        -- ── Convention #271: gate the day through Layer 1 so painted rdates,
        -- until, dtstart are honored. Before this, the day-loop counted by
        -- frequency_days/DOW alone, which is why past-end-date painted
        -- routines silently inflated the denominator. ──
        IF NOT public.obligation_active_for_member_on_date(v_task.id, p_member_id, v_day) THEN
          v_day := v_day + 1;
          CONTINUE;
        END IF;

        -- Steps scheduled this day (100244 created_at fairness kept as-is;
        -- 100295: semantic day-match via section_scheduled_on_day replaces
        -- raw frequency_days membership so daily/weekly/monthly sections —
        -- stored with frequency_days=NULL — count instead of silently
        -- dropping out of the denominator, defect 4).
        SELECT COALESCE(SUM(
          (SELECT COUNT(*)::INT FROM task_template_steps stp
           WHERE stp.section_id = tts.id
             AND stp.created_at::DATE <= v_day)
        ), 0)
        INTO v_day_step_count
        FROM task_template_sections tts
        WHERE tts.template_id = v_task.template_id
          AND public.section_scheduled_on_day(tts.frequency_rule, tts.frequency_days, v_day);

        v_routine_total_possible := v_routine_total_possible + COALESCE(v_day_step_count, 0);
        v_day := v_day + 1;
      END LOOP;

      -- Part A: completions with valid step_id, gated by Layer 1 activity per
      -- completion's period_date (painted-aware). 100295: show_until_complete
      -- carry-forward OR-clause now pairs with the semantic day-match
      -- predicate instead of raw frequency_days membership.
      SELECT COUNT(*)::INT
      INTO v_routine_actual_completed
      FROM (
        SELECT DISTINCT rsc.step_id, rsc.period_date
        FROM routine_step_completions rsc
        JOIN task_template_steps stp ON stp.id = rsc.step_id
        JOIN task_template_sections tts ON tts.id = stp.section_id
        WHERE rsc.task_id = v_task.id
          AND rsc.member_id = p_member_id
          AND rsc.period_date BETWEEN v_effective_start AND v_effective_end
          AND (
            tts.show_until_complete = TRUE
            OR public.section_scheduled_on_day(tts.frequency_rule, tts.frequency_days, rsc.period_date)
          )
          AND NOT (rsc.period_date = ANY(v_full_exclude_set))
          AND public.obligation_active_for_member_on_date(v_task.id, p_member_id, rsc.period_date)
      ) dedup;

      -- Part B: orphaned completions (step_id IS NULL from template edits).
      SELECT COUNT(*)::INT
      INTO v_routine_orphan_completed
      FROM routine_step_completions rsc
      WHERE rsc.task_id = v_task.id
        AND rsc.member_id = p_member_id
        AND rsc.step_id IS NULL
        AND rsc.period_date BETWEEN v_effective_start AND v_effective_end
        AND NOT (rsc.period_date = ANY(v_full_exclude_set))
        AND public.obligation_active_for_member_on_date(v_task.id, p_member_id, rsc.period_date);

      v_routine_actual_completed := v_routine_actual_completed + v_routine_orphan_completed;

      v_raw_steps_available := v_raw_steps_available + v_routine_total_possible;
      v_raw_steps_completed := v_raw_steps_completed
        + LEAST(v_routine_actual_completed, v_routine_total_possible);

      IF v_routine_total_possible > 0 THEN
        v_routine_fraction := LEAST(
          v_routine_actual_completed::NUMERIC / v_routine_total_possible,
          1
        );
        v_total_completed := v_total_completed + (v_routine_fraction * v_pool_fraction);
        v_completed_points := v_completed_points
          + (v_weight * v_routine_fraction * v_pool_fraction);
      END IF;
    ELSE
      v_nonroutine_total := v_nonroutine_total + 1;
      IF v_task.status = 'completed' THEN
        v_nonroutine_completed := v_nonroutine_completed + 1;
        v_total_completed := v_total_completed + v_pool_fraction;
        v_completed_points := v_completed_points + (v_weight * v_pool_fraction);
      END IF;
    END IF;
  END LOOP;

  SELECT COALESCE(SUM((cgl.metadata ->> 'boost_weight')::decimal), 0)
  INTO v_numerator_boost
  FROM contract_grant_log cgl
  JOIN deed_firings df ON df.id = cgl.deed_firing_id
  WHERE cgl.godmother_type = 'numerator'
    AND cgl.status = 'granted'
    AND cgl.metadata ->> 'family_member_id' = p_member_id::text
    AND COALESCE(cgl.metadata ->> 'pool_name', 'default') = p_pool_name
    AND df.fired_at::date BETWEEN p_period_start AND p_period_end;

  v_total_completed := v_total_completed + v_numerator_boost;
  v_completed_points := v_completed_points + v_numerator_boost;

  IF v_total_assigned = 0 THEN
    v_completion_pct := 100;
  ELSIF COALESCE(v_config.calculation_approach, 'dynamic') = 'points_weighted' THEN
    v_completion_pct := CASE WHEN v_total_points > 0
      THEN LEAST((v_completed_points / v_total_points) * 100, v_overage_cap)
      ELSE 100 END;
  ELSE
    v_completion_pct := LEAST((v_total_completed / v_total_assigned) * 100, v_overage_cap);
  END IF;

  IF v_completion_pct < COALESCE(v_config.minimum_threshold, 0) THEN
    v_calc_amount := 0;
  ELSE
    v_calc_amount := v_base * (v_completion_pct / 100);
  END IF;

  v_bonus_applied := v_completion_pct >= COALESCE(v_config.bonus_threshold, 90);
  IF v_bonus_applied THEN
    IF COALESCE(v_config.bonus_type, 'percentage') = 'flat' THEN
      v_bonus_amt := COALESCE(v_config.bonus_flat_amount, 0);
    ELSE
      v_bonus_amt := v_calc_amount * (COALESCE(v_config.bonus_percentage, 0) / 100);
    END IF;
  ELSE
    v_bonus_amt := 0;
  END IF;

  CASE COALESCE(v_config.rounding_behavior, 'nearest_cent')
    WHEN 'round_up' THEN
      v_calc_amount := CEIL(v_calc_amount * 100) / 100;
      v_bonus_amt := CEIL(v_bonus_amt * 100) / 100;
    WHEN 'round_down' THEN
      v_calc_amount := FLOOR(v_calc_amount * 100) / 100;
      v_bonus_amt := FLOOR(v_bonus_amt * 100) / 100;
    ELSE
      v_calc_amount := ROUND(v_calc_amount, 2);
      v_bonus_amt := ROUND(v_bonus_amt, 2);
  END CASE;

  v_total_earned_val := v_calc_amount + v_bonus_amt;

  RETURN QUERY SELECT
    p_pool_name,
    v_total_assigned,
    v_total_completed,
    v_completion_pct,
    v_total_points,
    v_completed_points,
    v_base,
    v_bonus_applied,
    v_bonus_amt,
    v_calc_amount,
    v_total_earned_val,
    COALESCE(v_config.minimum_threshold, 0)::INTEGER,
    COALESCE(v_config.bonus_threshold, 90)::INTEGER,
    COALESCE(v_config.calculation_approach, 'dynamic'),
    COALESCE(v_config.rounding_behavior, 'nearest_cent'),
    v_raw_steps_completed,
    v_raw_steps_available,
    v_nonroutine_total,
    v_nonroutine_completed,
    v_extra_credit_completed,
    v_extra_credit_weight,
    v_numerator_boost;
END;
$$;

GRANT EXECUTE ON FUNCTION public.calculate_allowance_progress(UUID, DATE, DATE, JSONB, TEXT)
  TO authenticated, service_role;

COMMENT ON FUNCTION public.calculate_allowance_progress(UUID, DATE, DATE, JSONB, TEXT) IS
  '100247 (Convention #271): routine denominator + completion counting gate '
  'each day through obligation_active_for_member_on_date so painted rdates / '
  'until / dtstart are honored. 100295: section-day matching (both the '
  'denominator day-loop and the completions show_until_complete OR-clause) '
  'now routes through section_scheduled_on_day (semantic, frequency_rule- '
  'aware) instead of raw frequency_days array membership — fixes daily/'
  'weekly/monthly sections (frequency_days=NULL) silently matching zero '
  'days. Preserves: archived task proportional counting (100243), '
  'step.created_at fairness (100244), show_until_complete (100239), orphan '
  'counting (100241), multi-pool (100235), numerator boost, grace days.';


-- ============================================================================
-- Verification
-- ============================================================================

DO $$
DECLARE
  v_pt_count INT;
  v_opening_count INT;
  v_ledger_reconciled INT;
  v_section_fn_exists BOOLEAN;
BEGIN
  SELECT count(*) INTO v_pt_count FROM public.point_transactions;
  SELECT count(*) INTO v_opening_count
    FROM public.point_transactions WHERE source_type = 'opening_balance';

  -- Reconciliation check: every member's SUM(amount) should equal their
  -- current gamification_points (opening-balance backfill makes this true
  -- at migration time; future writes must keep it true).
  SELECT count(*) INTO v_ledger_reconciled
  FROM (
    SELECT fm.id, COALESCE(fm.gamification_points, 0) AS fm_balance,
           COALESCE(SUM(pt.amount), 0) AS ledger_sum
    FROM public.family_members fm
    LEFT JOIN public.point_transactions pt ON pt.family_member_id = fm.id
    GROUP BY fm.id, fm.gamification_points
    HAVING COALESCE(fm.gamification_points, 0) <> COALESCE(SUM(pt.amount), 0)
  ) mismatches;

  SELECT EXISTS (
    SELECT 1 FROM pg_proc
    WHERE proname = 'section_scheduled_on_day' AND pronamespace = 'public'::regnamespace
  ) INTO v_section_fn_exists;

  RAISE NOTICE 'migration 100295: point economy ledger + day-match fix applied';
  RAISE NOTICE '  point_transactions rows: %', v_pt_count;
  RAISE NOTICE '  opening_balance rows: %', v_opening_count;
  RAISE NOTICE '  members with ledger/balance mismatch (should be 0): %', v_ledger_reconciled;
  RAISE NOTICE '  section_scheduled_on_day exists: %', v_section_fn_exists;
END $$;
