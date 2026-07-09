-- ============================================================================
-- 100311 — EMERGENCY: authorization gates for grant_money and
--          apply_permission_profile
--
-- Companion to migration 100310 (SECURITY-EMERGENCY worker, seat-dispatched
-- 2026-07-09 from the adversarial safety-stack review, WORKSTREAM 2). That
-- migration bare-revoked the three leaf functions with NO legitimate client
-- caller. These two functions are handled separately BECAUSE they DO have a
-- legitimate authenticated client caller — a bare revoke would break real
-- product UI, so each gets an in-function authorization gate instead,
-- mirroring the exact pattern established by migration 100298
-- (process_routine_step_completion) and migration 100300
-- (member_points_today): resolve authorization AFTER any read needed to
-- determine it, BEFORE any row is written or deleted, RAISE EXCEPTION on
-- failure.
--
-- ── grant_money (CRITICAL) ──────────────────────────────────────────────
-- Live-proven exploitable by an unauthenticated (anon-key) caller with zero
-- session: a hand-crafted RPC call wrote a real financial_transactions row
-- to a Testworth kid's ledger (a $0.01 grant, then deleted — zero residue).
-- The function took p_family_id/p_member_id/p_amount as plain arguments
-- with no auth check at all.
--
-- Legitimate callers (grepped across src/ — exactly two, both fire from
-- src/lib/financial/grantMoney.ts): useCompleteTask (src/hooks/useTasks.ts)
-- and completeTask (src/components/tasks/useTaskCompletion.ts), both firing
-- on completion of an approval-not-required opportunity task with a money
-- reward. The completing member's OWN browser session calls this RPC
-- directly — frequently a kid self-serving their own opportunity board job.
-- A family-membership gate (not a Convention #274 financial_tracking-grant
-- gate) is therefore the correct boundary: that grant tier governs adults
-- viewing/managing OTHER members' ledgers, and would incorrectly lock a
-- kid out of their own legitimate completion-triggered earning. This gate
-- closes the CRITICAL unauthenticated/cross-family vector. It does NOT
-- close the narrower same-family residual (an authenticated member of the
-- correct family could still tamper with p_amount from devtools, since the
-- amount is client-supplied) — closing that requires moving the client
-- task-money path to a completion-id-shaped server-computed award
-- (mirroring award_custom_reward_for_completion / process_routine_step_
-- completion), tracked as a follow-up and explicitly out of scope for this
-- emergency lockdown.
--
-- ── apply_permission_profile (HIGH) ─────────────────────────────────────
-- Live-proven exploitable the same way: an anon-key call against a bogus
-- family_id ran the DELETE+INSERT body to completion (HTTP 204; zero-row
-- effect only because the target family didn't exist). The function's own
-- v_mom_id lookup was a data lookup for attribution (disabled_by /
-- granting_member_id), never an authorization check.
--
-- Legitimate caller: PermissionHub.tsx:1518, the mom-only Permission Hub
-- page — the ONLY client call site in src/ (grep-verified) and no
-- server-side/Edge-Function caller exists. Gate: service_role, or the
-- caller must themselves be p_family_id's active primary_parent — matches
-- the function's real usage exactly (mom applying a profile to one of her
-- own family members) with no behavior change for her.
--
-- Both functions gain SET search_path = public + public.-qualified table
-- references (apply_permission_profile previously had neither) — the same
-- SECURITY DEFINER search_path hardening 100298/100300 applied elsewhere.
-- No other logic changes to either function body.
-- ============================================================================


-- ============================================================================
-- Part 1 — grant_money: family-membership authorization gate
-- ============================================================================

CREATE OR REPLACE FUNCTION public.grant_money(
  p_family_id          UUID,
  p_member_id          UUID,
  p_amount             DECIMAL,
  p_transaction_type   TEXT DEFAULT 'opportunity_earned',
  p_description        TEXT DEFAULT '',
  p_source_type        TEXT DEFAULT NULL,
  p_source_reference_id UUID DEFAULT NULL,
  p_category           TEXT DEFAULT NULL,
  p_metadata           JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_current_balance DECIMAL(10,2);
  v_new_balance     DECIMAL(10,2);
  v_tx_id           UUID;
  v_authorized      BOOLEAN := FALSE;
BEGIN
  -- ── Authorization gate (100311) — MUST run before any balance is
  -- computed or any row written. ──
  IF auth.role() = 'service_role' THEN
    v_authorized := TRUE;
  ELSIF auth.uid() IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.family_members caller
      WHERE caller.family_id = p_family_id
        AND caller.user_id = auth.uid()
    ) INTO v_authorized;
  END IF;

  IF NOT v_authorized THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RETURN jsonb_build_object(
      'status', 'no_op',
      'error_message', 'amount must be positive'
    );
  END IF;

  v_current_balance := COALESCE(
    public.calculate_running_balance(p_member_id),
    0.00
  );
  v_new_balance := v_current_balance + p_amount;

  BEGIN
    INSERT INTO public.financial_transactions (
      family_id, family_member_id, transaction_type,
      amount, balance_after, description,
      source_type, source_reference_id, category, metadata
    ) VALUES (
      p_family_id, p_member_id, p_transaction_type,
      p_amount, v_new_balance, p_description,
      p_source_type, p_source_reference_id, p_category, p_metadata
    )
    RETURNING id INTO v_tx_id;
  EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object(
      'status', 'already_awarded',
      'error_message', 'duplicate transaction detected'
    );
  END;

  RETURN jsonb_build_object(
    'status', 'granted',
    'transaction_id', v_tx_id,
    'amount', p_amount,
    'balance_after', v_new_balance
  );
END;
$fn$;

COMMENT ON FUNCTION public.grant_money IS
  'Generic financial transaction writer. Append-only. Handles idempotency '
  'via unique-violation catch. Used by both connector godmothers and '
  'client-side helpers. 100311: added the family-membership authorization '
  'gate (service_role OR caller is a family_members row in the same family '
  'as p_family_id) BEFORE any balance computation or write — closes a live '
  'unauthenticated/cross-tenant arbitrary-money-mint vulnerability found by '
  'the 2026-07-09 adversarial safety-stack review. Residual same-family '
  'amount-tampering risk (client supplies p_amount) is a documented, '
  'separate follow-up — see migration comment.';


-- ============================================================================
-- Part 2 — apply_permission_profile: primary_parent authorization gate
-- ============================================================================

CREATE OR REPLACE FUNCTION public.apply_permission_profile(
  p_family_id UUID,
  p_member_id UUID,
  p_role_group TEXT,
  p_level TEXT
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $fn$
DECLARE
  v_mom_id UUID;
  v_authorized BOOLEAN := FALSE;
BEGIN
  -- ── Authorization gate (100311) — MUST run before any DELETE/INSERT.
  -- Matches the function's only real caller (PermissionHub.tsx, mom-only
  -- page): service_role, or the caller must be p_family_id's own active
  -- primary_parent. ──
  IF auth.role() = 'service_role' THEN
    v_authorized := TRUE;
  ELSIF auth.uid() IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.family_members caller
      WHERE caller.family_id = p_family_id
        AND caller.user_id = auth.uid()
        AND caller.role = 'primary_parent'
        AND caller.is_active = true
    ) INTO v_authorized;
  END IF;

  IF NOT v_authorized THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  SELECT id INTO v_mom_id
  FROM public.family_members
  WHERE family_id = p_family_id AND role = 'primary_parent' AND is_active = true
  LIMIT 1;

  -- Layer 2: reset toggles from profile
  DELETE FROM public.member_feature_toggles
  WHERE family_id = p_family_id AND member_id = p_member_id;

  INSERT INTO public.member_feature_toggles (
    family_id, member_id, feature_key, is_disabled, enabled,
    blocked_by_tier, applied_profile_level, disabled_by
  )
  SELECT
    p_family_id,
    p_member_id,
    plp.feature_key,
    NOT plp.feature_enabled,
    plp.feature_enabled,
    false,
    p_level,
    COALESCE(v_mom_id, p_member_id)
  FROM public.permission_level_profiles plp
  WHERE plp.role_group = p_role_group AND plp.level = p_level;

  -- Layer 3: reset per-kid grants from profile (adult roles only).
  -- EXPLICIT-GRANT-ONLY keys are never deleted nor created here — a profile
  -- reset must not wipe mom's finance/management/assignment/gift-planning
  -- grants (PERMISSIONS-WIRING 2026-06-09 + RR-DEPLOY-SCOPING 2026-06-10 +
  -- PRD-43 2026-07-07). settings_basic is personal-shaped and no longer gets
  -- per-kid rows.
  IF p_role_group IN ('dad_adults', 'special_adults') AND v_mom_id IS NOT NULL THEN
    DELETE FROM public.member_permissions
    WHERE family_id = p_family_id
      AND granted_to = p_member_id
      AND permission_key NOT IN ('financial_tracking', 'studio', 'reward_rules', 'task_assignment', 'gift_planning');

    INSERT INTO public.member_permissions (
      family_id, granting_member_id, granted_to, target_member_id,
      permission_key, access_level
    )
    SELECT
      p_family_id,
      v_mom_id,
      p_member_id,
      child.id,
      plp.feature_key,
      plp.default_permission_level
    FROM public.permission_level_profiles plp
    CROSS JOIN public.family_members child
    WHERE plp.role_group = p_role_group
      AND plp.level = p_level
      AND plp.feature_enabled = true
      AND plp.feature_key NOT IN ('settings_basic', 'financial_tracking', 'studio', 'reward_rules', 'task_assignment', 'gift_planning')
      AND child.family_id = p_family_id
      AND child.role = 'member'
      AND child.is_active = true
    ON CONFLICT (family_id, granted_to, target_member_id, permission_key) DO UPDATE
    SET access_level = EXCLUDED.access_level;
  END IF;
END;
$fn$;

COMMENT ON FUNCTION public.apply_permission_profile IS
  'PRD-02 permission profile application. 100311: added the primary_parent '
  'authorization gate (service_role OR caller is p_family_id''s own active '
  'primary_parent) BEFORE any DELETE/INSERT — closes a live unauthenticated '
  'cross-tenant permission-rewrite vulnerability found by the 2026-07-09 '
  'adversarial safety-stack review. Matches its only real client caller '
  '(PermissionHub.tsx, mom-only page) exactly; no behavior change for mom. '
  'Also added SET search_path = public + public.-qualified table '
  'references (previously had neither) — no other logic changes.';


-- ============================================================================
-- Verification
-- ============================================================================

DO $$
DECLARE
  v_grant_money_gate BOOLEAN;
  v_profile_gate BOOLEAN;
  v_anon_has_grant_money BOOLEAN;
  v_anon_has_profile BOOLEAN;
BEGIN
  SELECT prosrc LIKE '%Not authorized%' AND prosrc LIKE '%auth.role() = ''service_role''%'
    INTO v_grant_money_gate
  FROM pg_proc
  WHERE proname = 'grant_money' AND pronamespace = 'public'::regnamespace;

  SELECT prosrc LIKE '%Not authorized%' AND prosrc LIKE '%auth.role() = ''service_role''%'
    INTO v_profile_gate
  FROM pg_proc
  WHERE proname = 'apply_permission_profile' AND pronamespace = 'public'::regnamespace;

  -- These functions were never revoked from anon/authenticated (they keep
  -- their legitimate client callers) — the in-body RAISE EXCEPTION is the
  -- gate, not a REVOKE. Confirm anon can still technically reach the body
  -- (grant unchanged) so the informational check below is meaningful — the
  -- real proof that anon calls now FAIL is the live Playwright probe, not
  -- this DO block.
  SELECT has_function_privilege('anon',
    'public.grant_money(uuid,uuid,decimal,text,text,text,uuid,text,jsonb)', 'EXECUTE')
    INTO v_anon_has_grant_money;
  SELECT has_function_privilege('anon',
    'public.apply_permission_profile(uuid,uuid,text,text)', 'EXECUTE')
    INTO v_anon_has_profile;

  RAISE NOTICE 'migration 100311: grant_money + apply_permission_profile auth gates applied';
  RAISE NOTICE '  grant_money body contains the authorization gate: %', v_grant_money_gate;
  RAISE NOTICE '  apply_permission_profile body contains the authorization gate: %', v_profile_gate;
  RAISE NOTICE '  anon still holds EXECUTE grant on grant_money (expected true — gate is in-body): %', v_anon_has_grant_money;
  RAISE NOTICE '  anon still holds EXECUTE grant on apply_permission_profile (expected true — gate is in-body): %', v_anon_has_profile;
END $$;
