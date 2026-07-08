-- ============================================================================
-- 100296 — Point Economy Slice A2: Config-As-Truth Award Resolution +
--          Routine Points/Prizes + Daily Points Goal
--          PRD-24 Point Economy Addendum §5.1/§5.2/§5.3/§5.5/§5.6/§8.4
--          (rulings 1, 2, 3, 4/RSTP, 10, 11 — Convention #199/#219/#259/#271)
--
-- Depends on migration 100295 (point_transactions, record_point_transaction,
-- section_scheduled_on_day, get_member_day_obligations rewrite — all CURRENT
-- as of this file, verified via git log immediately before writing).
--
-- Twelve parts, in dependency order:
--   1. gamification_configs: + intention_tally_points, + daily_points_goal
--   2. task_templates: + routine_points_mode/routine_step_points/
--      routine_completion_points (Convention #259 live-propagation columns)
--   3. task_template_steps: + 5 reward columns (RSTP scope, carried intact
--      per PECON ruling 4) + a partial unique index on earned_prizes for
--      per-(source_type='routine_step', source_id) idempotency
--   4. contracts.source_type + deed_firings.source_type CHECK widened with
--      'daily_points_goal_met' (ruling 11 — dispatch_godmothers itself is
--      generic over source_type and needs no edit, confirmed by reading its
--      CURRENT 100219 body before writing this file)
--   5. Never-diverged payload_amount NULLing on the 100219-seeded standard
--      points contracts (defect 1 repair) — ONLY where payload_amount still
--      trivially equals the member's current base_points_per_task, so a
--      deliberately-edited contract (via the /contracts power-user page, or
--      any divergence of unknown origin) is never silently touched. Also
--      stamps source_category='point_economy' on these rows so Part 10's
--      idempotent existence check recognizes them (must run BEFORE Part 10).
--   6. task_rewards 'stars'/'points' rows backfilled into tasks.points_override
--      (honesty repair #6 — those rows have never been paid by anything).
--   7. member_points_today(member) — family-local "today" earn-sum, reused
--      by both the client (My Rewards display, Slice A3) and the daily-goal
--      crossing check in Part 8.
--   8. record_point_transaction() REWRITTEN from its 100295 body, adding the
--      daily-points-goal crossing check as an additive, never-throws tail
--      block (fires a 'daily_points_goal_met' deed_firings row at most once
--      per member per family-local day; the EXISTING trg_deed_firings_dispatch
--      AFTER INSERT trigger — confirmed present, 100219:365-369 — handles
--      godmother dispatch automatically; no manual dispatch_godmothers() call
--      needed here).
--   9. execute_points_godmother() REWRITTEN from its CURRENT 100210 body:
--      config-as-truth resolution. payload_amount (or a linked
--      points_godmother_configs row) still wins when explicitly set —
--      custom/wizard-authored contracts keep working exactly as today.
--      Only when NEITHER is set does it fall through to
--      tasks.points_override -> gamification_configs.base_points_per_task
--      (task_completion) or gamification_configs.intention_tally_points
--      (intention_iteration). tasks.counts_for_gamification=false silences
--      task_completion awards unconditionally (Convention #224), checked
--      BEFORE any resolution path — an explicit per-task opt-out beats any
--      contract. dispatch_godmothers is NOT edited (confirmed generic).
--  10. ensure_point_economy_contracts(member) + a trigger on
--      gamification_configs (AFTER INSERT OR UPDATE OF enabled,
--      intention_tally_points) + a one-time backfill for every currently-
--      enabled member (defect 2 repair — members enabled after the 100219
--      cutover never got a points contract at all).
--  11. process_routine_step_completion(completion_id) — the single payout
--      point for per-step points, per-completion points, AND per-step
--      prizes (ruling 4/RSTP), structurally mirroring
--      award_custom_reward_for_completion's idempotent/additive/never-throws
--      shape (CURRENT 100278 body, read in full before writing this). The
--      per_completion required-set is read EXCLUSIVELY through
--      get_member_day_obligations (Convention #271/#278 Rider-2 — never
--      inline day math), expanded by each obligated step's instance_count.
--      NOT wired to any client call site in this migration — that is Slice
--      A3 (useCompleteRoutineStep). Granted to authenticated (unlike
--      record_point_transaction) because A3's client hook calls it directly,
--      matching the established no-explicit-auth-check pattern for
--      RPCs whose blast radius is bounded by an existing row's own state.
--  12. Verification.
-- ============================================================================


-- ============================================================================
-- Part 1 — gamification_configs: new points columns
-- ============================================================================

ALTER TABLE public.gamification_configs
  ADD COLUMN IF NOT EXISTS intention_tally_points INTEGER,
  ADD COLUMN IF NOT EXISTS daily_points_goal INTEGER;

COMMENT ON COLUMN public.gamification_configs.intention_tally_points IS
  'PRD-24 Point Economy Addendum §5.4. NULL = off (default; matches current '
  'behavior — best-intention tallies fire deeds that nothing has ever paid). '
  'When set, every personal tally by this member awards this many points.';

COMMENT ON COLUMN public.gamification_configs.daily_points_goal IS
  'PRD-24 Point Economy Addendum §5.6 (rider 2). NULL = off/invisible '
  'everywhere. A target like "10 points a day" — warm progress display, '
  'never a punishment for missing it. record_point_transaction() fires a '
  'daily_points_goal_met deed exactly once per family-local day on crossing.';


-- ============================================================================
-- Part 2 — task_templates: per-routine points economy (Convention #259
-- live-propagation columns — deployments read these from the template)
-- ============================================================================

ALTER TABLE public.task_templates
  ADD COLUMN IF NOT EXISTS routine_points_mode TEXT NOT NULL DEFAULT 'none'
    CHECK (routine_points_mode IN ('none', 'per_step', 'per_completion')),
  ADD COLUMN IF NOT EXISTS routine_step_points INTEGER,
  ADD COLUMN IF NOT EXISTS routine_completion_points INTEGER;

COMMENT ON COLUMN public.task_templates.routine_points_mode IS
  'PRD-24 Point Economy Addendum §5.2. Default ''none'' — routines earn '
  'nothing until mom opts a routine in (no surprise inflation). Per-template, '
  'not per-kid: gamification_configs.routine_points_mode (never read by any '
  'live code, confirmed by grep before this migration) stays dormant.';


-- ============================================================================
-- Part 3 — task_template_steps: per-step prize rewards (RSTP scope, ruling 4)
-- ============================================================================

ALTER TABLE public.task_template_steps
  ADD COLUMN IF NOT EXISTS reward_type TEXT
    CHECK (reward_type IS NULL OR reward_type IN ('privilege', 'custom', 'money', 'stars')),
  ADD COLUMN IF NOT EXISTS reward_amount NUMERIC,
  ADD COLUMN IF NOT EXISTS reward_description TEXT,
  ADD COLUMN IF NOT EXISTS reward_image_url TEXT,
  ADD COLUMN IF NOT EXISTS reward_image_asset_key TEXT;

COMMENT ON COLUMN public.task_template_steps.reward_type IS
  'PRD-24 Point Economy Addendum §5.5 (RSTP scope carried intact). Paid '
  'inside process_routine_step_completion: privilege/custom -> earned_prizes '
  '(source_type=''routine_step''); money -> grant_money; stars -> '
  'record_point_transaction (replaces routine_step_points for this step '
  'only — mom controls exposure per-step, independent of routine_points_mode).';

-- Per-(step-completion) idempotency for step-level privilege/custom prizes,
-- mirroring the awarded_completion_id partial-unique pattern on earned_prizes
-- (migration 100266) but scoped to source_type='routine_step' with source_id
-- = the routine_step_completions row id (already unique per step/member/
-- date/instance via the UNIQUE INDEX from migration 100191).
CREATE UNIQUE INDEX IF NOT EXISTS idx_earned_prizes_routine_step_source
  ON public.earned_prizes (source_id)
  WHERE source_type = 'routine_step';


-- ============================================================================
-- Part 4 — CHECK widening: 'daily_points_goal_met' (ruling 11)
-- ============================================================================

ALTER TABLE public.contracts
  DROP CONSTRAINT IF EXISTS contracts_source_type_check;
ALTER TABLE public.contracts
  ADD CONSTRAINT contracts_source_type_check
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
    'randomizer_drawn',
    'daily_points_goal_met'
  ));

ALTER TABLE public.deed_firings
  DROP CONSTRAINT IF EXISTS deed_firings_source_type_check;
ALTER TABLE public.deed_firings
  ADD CONSTRAINT deed_firings_source_type_check
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
    'randomizer_drawn',
    'daily_points_goal_met'
  ));


-- ============================================================================
-- Part 5 — Never-diverged payload NULLing + source_category stamping
-- (defect 1 repair, data fix, idempotent — MUST run before Part 10)
-- ============================================================================

-- Stamp source_category on every 100219-seeded standard points contract
-- (task_completion + points_godmother + a specific family_member_id is the
-- exact shape that seed produced) so Part 10's idempotent existence check
-- recognizes these rows and never creates a duplicate.
UPDATE public.contracts c
SET source_category = 'point_economy'
WHERE c.godmother_type = 'points_godmother'
  AND c.source_type = 'task_completion'
  AND c.family_member_id IS NOT NULL
  AND (c.source_category IS NULL OR c.source_category <> 'point_economy');

-- NULL payload_amount ONLY where it still trivially equals the member's
-- CURRENT base_points_per_task — i.e., zero information is lost, because the
-- effective award amount is identical before and after this NULLing. A
-- diverged contract (mom edited the setting after cutover but the payload
-- never updated, OR a genuine /contracts customization) is left untouched —
-- "deliberate edits keep payload semantics." Known limitation, not silently
-- fixed further: a diverged contract's payload_amount stays authoritative
-- going forward too (config-as-truth resolution only applies when
-- payload_amount IS NULL) until mom (or a future UI) explicitly clears it.
UPDATE public.contracts c
SET payload_amount = NULL
WHERE c.godmother_type = 'points_godmother'
  AND c.source_type = 'task_completion'
  AND c.family_member_id IS NOT NULL
  AND c.payload_amount IS NOT NULL
  AND c.payload_amount = (
    SELECT gc.base_points_per_task
    FROM public.gamification_configs gc
    WHERE gc.family_id = c.family_id
      AND gc.family_member_id = c.family_member_id
  );


-- ============================================================================
-- Part 6 — task_rewards 'stars'/'points' -> tasks.points_override backfill
-- (honesty repair #6, data fix, idempotent)
-- ============================================================================

UPDATE public.tasks t
SET points_override = (tr.reward_value ->> 'amount')::integer
FROM public.task_rewards tr
WHERE tr.task_id = t.id
  AND tr.reward_type IN ('stars', 'points')
  AND t.points_override IS NULL
  AND (tr.reward_value ->> 'amount') IS NOT NULL
  AND (tr.reward_value ->> 'amount') ~ '^\d+$';


-- ============================================================================
-- Part 7 — member_points_today (family-local "today" earn-sum)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.member_points_today(p_member_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_family_timezone TEXT;
  v_sum INTEGER;
BEGIN
  SELECT f.timezone INTO v_family_timezone
    FROM public.family_members fm
    JOIN public.families f ON f.id = fm.family_id
   WHERE fm.id = p_member_id;

  IF v_family_timezone IS NULL OR v_family_timezone = '' THEN
    v_family_timezone := 'America/Chicago';
  END IF;

  SELECT COALESCE(SUM(pt.amount), 0) INTO v_sum
    FROM public.point_transactions pt
   WHERE pt.family_member_id = p_member_id
     AND pt.transaction_type = 'earn'
     AND (pt.created_at AT TIME ZONE v_family_timezone)::date = public.family_today(p_member_id);

  RETURN v_sum;
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.member_points_today(UUID) TO authenticated, service_role;

COMMENT ON FUNCTION public.member_points_today IS
  'PRD-24 Point Economy Addendum §5.6. SUM of today''s ''earn'' transactions '
  'at the family-local day (Convention #257 — reuses public.family_today, '
  'never client day math). Spending/refunds/adjustments never subtract '
  'progress. Used by the My Rewards daily-goal display (Slice A3) and by '
  'record_point_transaction''s goal-crossing check.';


-- ============================================================================
-- Part 8 — record_point_transaction REWRITE: adds daily-goal deed firing
-- ============================================================================

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
  v_daily_goal      INTEGER;
  v_today_earned    INTEGER;
  v_family_timezone TEXT;
  v_today           DATE;
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

  -- ── Daily Points Goal (rider 2, §5.6) — additive tail block. A failure
  -- here must NEVER unwind or fail the ledger write above it. ──
  IF p_transaction_type = 'earn' THEN
    BEGIN
      SELECT daily_points_goal INTO v_daily_goal
        FROM public.gamification_configs
       WHERE family_id = p_family_id AND family_member_id = p_family_member_id;

      IF v_daily_goal IS NOT NULL AND v_daily_goal > 0 THEN
        v_today_earned := public.member_points_today(p_family_member_id);

        -- Fires exactly at the crossing moment: the sum WITHOUT this earn was
        -- under the goal, and WITH it (already applied above) meets/exceeds
        -- it. Subsequent earns the same day never re-satisfy "was under."
        IF (v_today_earned - p_amount) < v_daily_goal AND v_today_earned >= v_daily_goal THEN
          SELECT f.timezone INTO v_family_timezone
            FROM public.family_members fm
            JOIN public.families f ON f.id = fm.family_id
           WHERE fm.id = p_family_member_id;
          IF v_family_timezone IS NULL OR v_family_timezone = '' THEN
            v_family_timezone := 'America/Chicago';
          END IF;
          v_today := (NOW() AT TIME ZONE v_family_timezone)::date;

          -- The existing trg_deed_firings_dispatch AFTER INSERT trigger
          -- (migration 100219) calls dispatch_godmothers automatically —
          -- no manual dispatch call needed here. idempotency_key is the
          -- true backstop; the crossing check above is the fast path.
          INSERT INTO public.deed_firings (
            family_id, family_member_id, source_type, source_id, fired_at,
            metadata, idempotency_key
          ) VALUES (
            p_family_id, p_family_member_id, 'daily_points_goal_met',
            p_family_member_id, now(),
            jsonb_build_object('date', v_today, 'points_today', v_today_earned, 'goal', v_daily_goal),
            format('dpg:%s:%s', p_family_member_id, v_today)
          )
          ON CONFLICT (idempotency_key) DO NOTHING;
        END IF;
      END IF;
    EXCEPTION WHEN OTHERS THEN
      NULL; -- goal-crossing detection must never block the ledger write
    END;
  END IF;

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
  'PRD-24 Point Economy Addendum §8.1 + §5.6 (100296 adds the daily-goal '
  'crossing deed). Single choke point for every gamification_points '
  'mutation. Append-only, row-locked, idempotency-key deduplicated. '
  'INTERNAL ONLY — revoked from anon/authenticated. Fires '
  'daily_points_goal_met into deed_firings at most once per member per '
  'family-local day when an earn crosses gamification_configs.'
  'daily_points_goal; the existing trg_deed_firings_dispatch trigger routes '
  'it through the connector automatically.';


-- ============================================================================
-- Part 9 — execute_points_godmother REWRITE: config-as-truth resolution
-- ============================================================================

CREATE OR REPLACE FUNCTION public.execute_points_godmother(
  p_contract_id  UUID,
  p_deed_firing  JSONB,
  p_payload      JSONB,
  p_stroke_of    TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_family_id    UUID;
  v_member_id    UUID;
  v_source_type  TEXT;
  v_source_id    UUID;
  v_points       INTEGER;
  v_config_id    UUID;
  v_task         RECORD;
  v_intention    RECORD;
  v_description  TEXT;
  v_result       JSONB;
BEGIN
  v_family_id   := (p_deed_firing ->> 'family_id')::uuid;
  v_member_id   := (p_deed_firing ->> 'family_member_id')::uuid;
  v_source_type := p_deed_firing ->> 'source_type';
  v_source_id   := NULLIF(p_deed_firing ->> 'source_id', '')::uuid;

  IF v_member_id IS NULL THEN
    RETURN jsonb_build_object(
      'status', 'failed',
      'error_message', 'points_godmother: deed firing has no family_member_id'
    );
  END IF;

  -- Convention #224: an explicit per-task opt-out beats every resolution
  -- path, including a custom contract's payload_amount — "off means off."
  IF v_source_type = 'task_completion' AND v_source_id IS NOT NULL THEN
    SELECT points_override, counts_for_gamification, title
      INTO v_task
      FROM public.tasks
     WHERE id = v_source_id;

    IF FOUND AND COALESCE(v_task.counts_for_gamification, true) = false THEN
      RETURN jsonb_build_object(
        'status', 'no_op',
        'error_message', 'counts_for_gamification is false'
      );
    END IF;
  END IF;

  -- 1. Explicit config-table godmother_config_id (points_godmother_configs)
  --    — pre-existing option, unchanged from the 100210 body.
  v_config_id := (p_payload ->> 'godmother_config_id')::uuid;
  IF v_config_id IS NOT NULL THEN
    SELECT base_points INTO v_points
      FROM public.points_godmother_configs
     WHERE id = v_config_id;
  END IF;

  -- 2. payload_amount wins if explicitly set — custom/wizard-authored
  --    contracts keep working exactly as today.
  IF v_points IS NULL THEN
    v_points := (p_payload ->> 'payload_amount')::integer;
  END IF;

  -- 3. Config-as-truth resolution (PRD-24 Point Economy Addendum §5.1) —
  --    only reached when NEITHER a config row NOR an explicit payload_amount
  --    was set on the contract.
  IF v_points IS NULL THEN
    IF v_source_type = 'task_completion' THEN
      v_points := v_task.points_override;
      IF v_points IS NULL THEN
        SELECT base_points_per_task INTO v_points
          FROM public.gamification_configs
         WHERE family_id = v_family_id AND family_member_id = v_member_id;
      END IF;
      v_description := NULLIF(v_task.title, '');

    ELSIF v_source_type = 'intention_iteration' THEN
      SELECT intention_tally_points INTO v_points
        FROM public.gamification_configs
       WHERE family_id = v_family_id AND family_member_id = v_member_id;
      -- NULL intention_tally_points -> mom has not opted intentions into
      -- points -> falls through to the no_op guard below.

      IF v_source_id IS NOT NULL THEN
        SELECT statement INTO v_intention
          FROM public.best_intentions
         WHERE id = v_source_id;
        v_description := NULLIF(v_intention.statement, '');
      END IF;
    END IF;
  END IF;

  IF v_points IS NULL OR v_points <= 0 THEN
    RETURN jsonb_build_object(
      'status', 'no_op',
      'error_message', 'points_godmother: no positive points resolved (config/payload/task/intention all empty)'
    );
  END IF;

  v_result := public.record_point_transaction(
    v_family_id,
    v_member_id,
    v_points,
    'earn',
    v_source_type,
    v_source_id,
    v_description,
    NULL, -- idempotency handled at the connector/contract_grant_log layer
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
    'grant_reference', v_member_id,
    'metadata', jsonb_build_object(
      'points_awarded', v_points,
      'new_total', (v_result ->> 'balance_after')::integer,
      'family_member_id', v_member_id
    )
  );
END;
$fn$;

COMMENT ON FUNCTION public.execute_points_godmother IS
  'PRD-24 Point Economy Addendum §5.1 (ruling 1). Config-as-truth award '
  'resolution: contract.payload_amount / points_godmother_configs wins when '
  'explicitly set; otherwise task_completion resolves '
  'tasks.points_override -> gamification_configs.base_points_per_task, and '
  'intention_iteration resolves gamification_configs.intention_tally_points '
  '(NULL = no award). counts_for_gamification=false silences task_completion '
  'unconditionally. Writes through record_point_transaction (the ledger '
  'choke point) instead of touching family_members.gamification_points '
  'directly — supersedes the 100210 body, which only ever read '
  'payload_amount, the root cause of the dead ''Points per task'' setting.';


-- ============================================================================
-- Part 10 — ensure_point_economy_contracts + trigger + one-time backfill
-- (defect 2 repair: provisioning gap for post-cutover enabled members)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.ensure_point_economy_contracts(p_member_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_config    RECORD;
  v_family_id UUID;
  v_mom_id    UUID;
BEGIN
  SELECT * INTO v_config
    FROM public.gamification_configs
   WHERE family_member_id = p_member_id;

  IF NOT FOUND OR NOT COALESCE(v_config.enabled, false) THEN
    RETURN; -- nothing to ensure while gamification is disabled
  END IF;

  v_family_id := v_config.family_id;

  SELECT mom.id INTO v_mom_id
    FROM public.families f
    JOIN public.family_members mom
      ON mom.user_id = f.primary_parent_id AND mom.family_id = f.id
   WHERE f.id = v_family_id;

  -- Standard task_completion points contract.
  IF NOT EXISTS (
    SELECT 1 FROM public.contracts c
     WHERE c.family_id = v_family_id
       AND c.family_member_id = p_member_id
       AND c.source_type = 'task_completion'
       AND c.godmother_type = 'points_godmother'
       AND c.source_category = 'point_economy'
  ) THEN
    INSERT INTO public.contracts (
      family_id, created_by, source_type, source_id, family_member_id,
      source_category, if_pattern, godmother_type, stroke_of, payload_amount,
      inheritance_level, override_mode, status
    ) VALUES (
      v_family_id, COALESCE(v_mom_id, p_member_id), 'task_completion', NULL, p_member_id,
      'point_economy', 'every_time', 'points_godmother', 'immediate', NULL,
      'kid_override', 'replace', 'active'
    );
  END IF;

  -- Standard intention_iteration points contract — only when mom has set a value.
  IF v_config.intention_tally_points IS NOT NULL THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.contracts c
       WHERE c.family_id = v_family_id
         AND c.family_member_id = p_member_id
         AND c.source_type = 'intention_iteration'
         AND c.godmother_type = 'points_godmother'
         AND c.source_category = 'point_economy'
    ) THEN
      INSERT INTO public.contracts (
        family_id, created_by, source_type, source_id, family_member_id,
        source_category, if_pattern, godmother_type, stroke_of, payload_amount,
        inheritance_level, override_mode, status
      ) VALUES (
        v_family_id, COALESCE(v_mom_id, p_member_id), 'intention_iteration', NULL, p_member_id,
        'point_economy', 'every_time', 'points_godmother', 'immediate', NULL,
        'kid_override', 'replace', 'active'
      );
    END IF;
  END IF;
END;
$fn$;

REVOKE ALL ON FUNCTION public.ensure_point_economy_contracts(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.ensure_point_economy_contracts(UUID) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.ensure_point_economy_contracts(UUID) TO service_role;

COMMENT ON FUNCTION public.ensure_point_economy_contracts IS
  'PRD-24 Point Economy Addendum defect 2 repair. Idempotently ensures a '
  'member has the standard points_godmother contracts their current '
  'gamification_configs settings imply (task_completion always; '
  'intention_iteration when intention_tally_points is set). Called by the '
  'trigger below on every gamification_configs enable/points-config change, '
  'plus a one-time backfill in this migration for members already enabled.';

CREATE OR REPLACE FUNCTION public.trg_ensure_point_economy_contracts()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
BEGIN
  PERFORM public.ensure_point_economy_contracts(NEW.family_member_id);
  RETURN NEW;
END;
$fn$;

DROP TRIGGER IF EXISTS trg_gc_ensure_point_economy_contracts ON public.gamification_configs;
CREATE TRIGGER trg_gc_ensure_point_economy_contracts
  AFTER INSERT OR UPDATE OF enabled, intention_tally_points ON public.gamification_configs
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_ensure_point_economy_contracts();

-- One-time backfill for every member already enabled at migration time.
DO $$
DECLARE
  v_member_id UUID;
BEGIN
  FOR v_member_id IN
    SELECT family_member_id FROM public.gamification_configs WHERE enabled = true
  LOOP
    PERFORM public.ensure_point_economy_contracts(v_member_id);
  END LOOP;
END $$;


-- ============================================================================
-- Part 11 — process_routine_step_completion (the routine-economics payout point)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.process_routine_step_completion(
  p_completion_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_completion     RECORD;
  v_step           RECORD;
  v_step_label     TEXT;
  v_task           RECORD;
  v_template       RECORD;
  v_step_points    INTEGER;
  v_pt_result      JSONB;
  v_prize_id       UUID;
  v_money_result   JSONB;
  v_required       INTEGER;
  v_done           INTEGER;
  v_newly_complete BOOLEAN := FALSE;
  v_contributor    RECORD;
  v_rc_result      JSONB;
  v_result         JSONB := jsonb_build_object('status', 'processed');
BEGIN
  SELECT rsc.id, rsc.task_id, rsc.step_id, rsc.member_id, rsc.period_date, rsc.instance_number
    INTO v_completion
    FROM public.routine_step_completions rsc
   WHERE rsc.id = p_completion_id;

  IF v_completion.id IS NULL THEN
    RETURN jsonb_build_object('status', 'not_found');
  END IF;

  IF v_completion.step_id IS NULL THEN
    -- Orphaned completion (a template edit removed this step) — nothing to pay.
    RETURN jsonb_build_object('status', 'skipped_orphan_step');
  END IF;

  SELECT stp.id, stp.section_id, stp.step_name, stp.display_name_override,
         stp.reward_type, stp.reward_amount, stp.reward_description,
         stp.reward_image_url, stp.reward_image_asset_key, stp.instance_count
    INTO v_step
    FROM public.task_template_steps stp
   WHERE stp.id = v_completion.step_id;

  IF v_step.id IS NULL THEN
    RETURN jsonb_build_object('status', 'skipped_step_not_found');
  END IF;

  SELECT t.id, t.family_id, t.template_id, t.counts_for_gamification, t.title
    INTO v_task
    FROM public.tasks t
   WHERE t.id = v_completion.task_id;

  IF v_task.id IS NULL THEN
    RETURN jsonb_build_object('status', 'skipped_task_not_found');
  END IF;

  SELECT tt.routine_points_mode, tt.routine_step_points, tt.routine_completion_points
    INTO v_template
    FROM public.task_templates tt
   WHERE tt.id = v_task.template_id;

  v_step_label := COALESCE(NULLIF(v_step.display_name_override, ''), v_step.step_name, v_task.title);

  -- ── Per-step points: a step-level 'stars' reward REPLACES the routine's
  -- per-step amount for this step only; otherwise routine_points_mode=
  -- 'per_step' pays the routine-level amount. Independent of
  -- counts_for_gamification=false, which silences BOTH. ──
  IF COALESCE(v_task.counts_for_gamification, true) THEN
    IF v_step.reward_type = 'stars' AND v_step.reward_amount IS NOT NULL THEN
      v_step_points := v_step.reward_amount::integer;
    ELSIF COALESCE(v_template.routine_points_mode, 'none') = 'per_step' THEN
      v_step_points := v_template.routine_step_points;
    END IF;

    IF v_step_points IS NOT NULL AND v_step_points > 0 THEN
      BEGIN
        v_pt_result := public.record_point_transaction(
          v_task.family_id,
          v_completion.member_id,
          v_step_points,
          'earn',
          'routine_step',
          v_completion.step_id,
          'Step: ' || v_step_label,
          format('rsp:%s:%s:%s:%s', v_completion.step_id, v_completion.member_id,
                 v_completion.period_date, v_completion.instance_number),
          NULL
        );
        v_result := v_result || jsonb_build_object('step_points', v_pt_result);
      EXCEPTION WHEN OTHERS THEN
        -- Convention #199: a reward-side failure must never block the
        -- checkmark the client already committed.
        v_result := v_result || jsonb_build_object('step_points_error', SQLERRM);
      END;
    END IF;
  END IF;

  -- ── Per-step prize (privilege / custom / money) — independent of points,
  -- mom sets these per-step regardless of routine_points_mode. ──
  IF v_step.reward_type IN ('privilege', 'custom') THEN
    BEGIN
      INSERT INTO public.earned_prizes (
        family_id, family_member_id, source_type, source_id,
        prize_type, prize_text, prize_name,
        prize_image_url, prize_asset_key,
        visibility, created_by
      ) VALUES (
        v_task.family_id, v_completion.member_id, 'routine_step', v_completion.id,
        CASE
          WHEN v_step.reward_image_url IS NOT NULL AND v_step.reward_image_url <> '' THEN 'image'
          WHEN v_step.reward_image_asset_key IS NOT NULL AND v_step.reward_image_asset_key <> '' THEN 'platform_image'
          ELSE 'text'
        END,
        COALESCE(NULLIF(v_step.reward_description, ''), v_step_label),
        NULLIF(LEFT(BTRIM(COALESCE(NULLIF(v_step.reward_description, ''), v_step_label)), 80), ''),
        NULLIF(v_step.reward_image_url, ''), NULLIF(v_step.reward_image_asset_key, ''),
        'family', v_completion.member_id
      )
      ON CONFLICT (source_id) WHERE source_type = 'routine_step' DO NOTHING
      RETURNING id INTO v_prize_id;
      v_result := v_result || jsonb_build_object('step_prize_id', v_prize_id);
    EXCEPTION WHEN OTHERS THEN
      v_result := v_result || jsonb_build_object('step_prize_error', SQLERRM);
    END;

  ELSIF v_step.reward_type = 'money' AND v_step.reward_amount IS NOT NULL THEN
    BEGIN
      v_money_result := public.grant_money(
        p_family_id           := v_task.family_id,
        p_member_id           := v_completion.member_id,
        p_amount              := v_step.reward_amount,
        p_transaction_type    := 'opportunity_earned',
        p_description         := 'Step reward: ' || v_step_label,
        p_source_type         := 'routine_step',
        p_source_reference_id := v_completion.id
      );
      v_result := v_result || jsonb_build_object('step_money', v_money_result);
    EXCEPTION WHEN OTHERS THEN
      v_result := v_result || jsonb_build_object('step_money_error', SQLERRM);
    END;
  END IF;

  -- ── Per-completion evaluation (routine_points_mode='per_completion') —
  -- required set read EXCLUSIVELY via get_member_day_obligations
  -- (Convention #271/#278 Rider-2), never inline day math. ──
  IF COALESCE(v_template.routine_points_mode, 'none') = 'per_completion'
     AND COALESCE(v_task.counts_for_gamification, true)
     AND COALESCE(v_template.routine_completion_points, 0) > 0 THEN
    BEGIN
      SELECT COALESCE(SUM(stp2.instance_count), 0) INTO v_required
      FROM (
        SELECT DISTINCT step_id
        FROM public.get_member_day_obligations(v_completion.member_id, v_completion.period_date, v_completion.period_date)
        WHERE task_id = v_task.id AND step_id IS NOT NULL
      ) obligated
      JOIN public.task_template_steps stp2 ON stp2.id = obligated.step_id;

      SELECT COUNT(*) INTO v_done
        FROM public.routine_step_completions rsc2
       WHERE rsc2.task_id = v_task.id
         AND rsc2.period_date = v_completion.period_date;

      v_newly_complete := v_required > 0 AND v_done >= v_required;

      IF v_newly_complete THEN
        -- Every assignee who completed >=1 step today gets the completion
        -- award (contribution-based, never a free-rider award). Re-evaluated
        -- on every step check for the day; idempotency_key makes redundant
        -- attempts for already-awarded contributors silent no-ops, so no
        -- distributed coordination is needed across simultaneous completions.
        FOR v_contributor IN
          SELECT DISTINCT member_id
          FROM public.routine_step_completions
          WHERE task_id = v_task.id AND period_date = v_completion.period_date
        LOOP
          BEGIN
            v_rc_result := public.record_point_transaction(
              v_task.family_id,
              v_contributor.member_id,
              v_template.routine_completion_points,
              'earn',
              'routine_completion',
              v_task.id,
              'Completed: ' || v_task.title,
              format('rcp:%s:%s:%s', v_task.id, v_contributor.member_id, v_completion.period_date),
              NULL
            );
          EXCEPTION WHEN OTHERS THEN
            NULL; -- one contributor's award failing must not block the others
          END;
        END LOOP;
        v_result := v_result || jsonb_build_object('completion_awarded', true, 'required', v_required, 'done', v_done);
      ELSE
        v_result := v_result || jsonb_build_object('completion_awarded', false, 'required', v_required, 'done', v_done);
      END IF;
    EXCEPTION WHEN OTHERS THEN
      v_result := v_result || jsonb_build_object('completion_error', SQLERRM);
    END;
  END IF;

  RETURN v_result;
END;
$fn$;

GRANT EXECUTE ON FUNCTION public.process_routine_step_completion(UUID) TO authenticated, service_role;

COMMENT ON FUNCTION public.process_routine_step_completion IS
  'PRD-24 Point Economy Addendum §5.3/§5.5 (rulings 3, 4). The single payout '
  'point for per-step points, per-completion points, and per-step prizes. '
  'Never-throws additive (Convention #199) — a reward-side failure never '
  'unwinds the checkmark. Attribution = routine_step_completions.member_id, '
  'never assignee_id (Convention #202/#267 parity, riders 3-4). '
  'per_completion required-set reads get_member_day_obligations exclusively '
  '(Convention #271/#278 Rider-2). NOT wired to any client call site by this '
  'migration — Slice A3 wires useCompleteRoutineStep to call it.';


-- ============================================================================
-- Part 12 — Verification
-- ============================================================================

DO $$
DECLARE
  v_never_diverged_nulled INT;
  v_still_diverged INT;
  v_task_rewards_backfilled INT;
  v_ensure_fn_exists BOOLEAN;
  v_process_fn_exists BOOLEAN;
  v_contracts_after_backfill INT;
  v_intention_contracts INT;
BEGIN
  SELECT count(*) INTO v_never_diverged_nulled
  FROM public.contracts
  WHERE godmother_type = 'points_godmother' AND source_type = 'task_completion'
    AND family_member_id IS NOT NULL AND payload_amount IS NULL
    AND source_category = 'point_economy';

  SELECT count(*) INTO v_still_diverged
  FROM public.contracts c
  WHERE c.godmother_type = 'points_godmother' AND c.source_type = 'task_completion'
    AND c.family_member_id IS NOT NULL AND c.payload_amount IS NOT NULL
    AND c.source_category = 'point_economy';

  SELECT count(*) INTO v_task_rewards_backfilled
  FROM public.tasks t
  JOIN public.task_rewards tr ON tr.task_id = t.id
  WHERE tr.reward_type IN ('stars', 'points') AND t.points_override IS NOT NULL;

  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'ensure_point_economy_contracts' AND pronamespace = 'public'::regnamespace
  ) INTO v_ensure_fn_exists;

  SELECT EXISTS (
    SELECT 1 FROM pg_proc WHERE proname = 'process_routine_step_completion' AND pronamespace = 'public'::regnamespace
  ) INTO v_process_fn_exists;

  SELECT count(*) INTO v_contracts_after_backfill
  FROM public.contracts
  WHERE godmother_type = 'points_godmother' AND source_type = 'task_completion'
    AND source_category = 'point_economy';

  SELECT count(*) INTO v_intention_contracts
  FROM public.contracts
  WHERE godmother_type = 'points_godmother' AND source_type = 'intention_iteration'
    AND source_category = 'point_economy';

  RAISE NOTICE 'migration 100296: config-as-truth + routine economics applied';
  RAISE NOTICE '  standard task_completion points contracts (source_category stamped): %', v_contracts_after_backfill;
  RAISE NOTICE '  never-diverged NULLed this run: %', v_never_diverged_nulled;
  RAISE NOTICE '  still-diverged (left untouched, deliberate-edit rule): %', v_still_diverged;
  RAISE NOTICE '  task_rewards stars/points rows with points_override now set: %', v_task_rewards_backfilled;
  RAISE NOTICE '  standard intention_iteration points contracts: %', v_intention_contracts;
  RAISE NOTICE '  ensure_point_economy_contracts exists: %', v_ensure_fn_exists;
  RAISE NOTICE '  process_routine_step_completion exists: %', v_process_fn_exists;
END $$;
