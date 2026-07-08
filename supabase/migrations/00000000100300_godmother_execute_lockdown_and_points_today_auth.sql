-- ============================================================================
-- 100300 — EMERGENCY: lock down all 15 connector godmother-dispatch
--          functions (unauthenticated arbitrary money/points minting) +
--          add the missing auth gate to member_points_today
--
-- Seat-authorized 2026-07-07, discovered as a byproduct of the PECON-EARN
-- Slice A2 rls-verifier sweep, NOT a PECON-EARN scope item (folded in on
-- explicit seat direction). Full incident record in
-- .claude/rules/current-builds/PECON-earn.md and RLS-VERIFICATION.md.
--
-- FINDING: dispatch_godmothers(uuid) and all 14 execute_*_godmother(uuid,
-- jsonb, jsonb, text) functions have carried anon/authenticated/PUBLIC
-- EXECUTE grants since their original Phase-3 Connector Architecture
-- migrations (100207-100219) — meaning a fully UNAUTHENTICATED request
-- (no login required) can call any of them directly with a hand-crafted
-- p_deed_firing/p_payload JSON naming ANY family_id/family_member_id, with
-- ZERO requirement that any real deed_firings row, contract, or completion
-- ever existed. Live-proved (rolled back, zero residue) by rls-verifier:
-- a fabricated payload moved a real member's gamification_points from
-- 30 to 1,000,029 in one execute_points_godmother call; a second probe
-- minted a real $5,000.00 financial_transactions credit via
-- execute_money_godmother. Confirmed via
-- `grep -rn "rpc('execute_" src/ supabase/functions/` that ZERO client
-- code anywhere calls any of these 15 functions directly — every
-- legitimate invocation is dispatch_godmothers' own internal CASE
-- statement (migration 100219), itself only ever invoked by
-- trg_deed_firing_dispatch (the AFTER INSERT trigger on deed_firings).
--
-- SAFE-BY-CONSTRUCTION (seat-verified against live production before
-- authorizing this migration): both trg_deed_firing_dispatch AND
-- dispatch_godmothers are themselves SECURITY DEFINER, so the legitimate
-- deed-firing -> dispatch -> godmother-execution chain runs entirely in
-- the functions' OWNER context and is UNAFFECTED by revoking PUBLIC/anon/
-- authenticated execute on the 15 functions below — Postgres privilege
-- checks for a call made FROM WITHIN a SECURITY DEFINER function apply to
-- the DEFINER's role, not the original client's role (same mechanism
-- already proven for grant_points -> record_point_transaction in
-- migration 100295/100296, and independently re-confirmed live by
-- rls-verifier's second pass on 100298 — a real deed firing still landed
-- an award end-to-end after this exact revoke pattern was applied to
-- record_point_transaction).
--
-- FIX 1: REVOKE EXECUTE FROM PUBLIC, anon, authenticated on all 15
--        functions; GRANT to service_role only. No logic changes to any
--        of the 15 function bodies.
--
-- FIX 2: member_points_today(member_id) — flagged WARNING (not blocking)
--        by rls-verifier: it has no auth check and returns a real
--        aggregate (today's point sum) for ANY member_id to ANY caller.
--        Unlike the 15 functions above, this one genuinely IS meant to be
--        directly client-callable (Slice A3's My Rewards daily-goal
--        display calls it for the viewing member) — so the fix here is a
--        GATE, not a revoke, matching the exact auth-check pattern used by
--        get_member_day_obligations/calculate_allowance_progress (100295)
--        and process_routine_step_completion (100298): service_role, or a
--        family_members row in the SAME family as p_member_id. Rewritten
--        from its 100296 body; logic otherwise unchanged.
-- ============================================================================


-- ============================================================================
-- Part 1 — Lockdown: dispatch_godmothers + 14 execute_*_godmother functions
-- ============================================================================

REVOKE ALL ON FUNCTION public.dispatch_godmothers(uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.dispatch_godmothers(uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.dispatch_godmothers(uuid) TO service_role;

REVOKE ALL ON FUNCTION public.execute_allowance_godmother(uuid, jsonb, jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.execute_allowance_godmother(uuid, jsonb, jsonb, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.execute_allowance_godmother(uuid, jsonb, jsonb, text) TO service_role;

REVOKE ALL ON FUNCTION public.execute_assign_task_godmother(uuid, jsonb, jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.execute_assign_task_godmother(uuid, jsonb, jsonb, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.execute_assign_task_godmother(uuid, jsonb, jsonb, text) TO service_role;

REVOKE ALL ON FUNCTION public.execute_coloring_reveal_godmother(uuid, jsonb, jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.execute_coloring_reveal_godmother(uuid, jsonb, jsonb, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.execute_coloring_reveal_godmother(uuid, jsonb, jsonb, text) TO service_role;

REVOKE ALL ON FUNCTION public.execute_creature_godmother(uuid, jsonb, jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.execute_creature_godmother(uuid, jsonb, jsonb, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.execute_creature_godmother(uuid, jsonb, jsonb, text) TO service_role;

REVOKE ALL ON FUNCTION public.execute_custom_reward_godmother(uuid, jsonb, jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.execute_custom_reward_godmother(uuid, jsonb, jsonb, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.execute_custom_reward_godmother(uuid, jsonb, jsonb, text) TO service_role;

REVOKE ALL ON FUNCTION public.execute_family_victory_godmother(uuid, jsonb, jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.execute_family_victory_godmother(uuid, jsonb, jsonb, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.execute_family_victory_godmother(uuid, jsonb, jsonb, text) TO service_role;

REVOKE ALL ON FUNCTION public.execute_money_godmother(uuid, jsonb, jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.execute_money_godmother(uuid, jsonb, jsonb, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.execute_money_godmother(uuid, jsonb, jsonb, text) TO service_role;

REVOKE ALL ON FUNCTION public.execute_numerator_godmother(uuid, jsonb, jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.execute_numerator_godmother(uuid, jsonb, jsonb, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.execute_numerator_godmother(uuid, jsonb, jsonb, text) TO service_role;

REVOKE ALL ON FUNCTION public.execute_page_unlock_godmother(uuid, jsonb, jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.execute_page_unlock_godmother(uuid, jsonb, jsonb, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.execute_page_unlock_godmother(uuid, jsonb, jsonb, text) TO service_role;

REVOKE ALL ON FUNCTION public.execute_points_godmother(uuid, jsonb, jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.execute_points_godmother(uuid, jsonb, jsonb, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.execute_points_godmother(uuid, jsonb, jsonb, text) TO service_role;

REVOKE ALL ON FUNCTION public.execute_prize_godmother(uuid, jsonb, jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.execute_prize_godmother(uuid, jsonb, jsonb, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.execute_prize_godmother(uuid, jsonb, jsonb, text) TO service_role;

REVOKE ALL ON FUNCTION public.execute_recognition_godmother(uuid, jsonb, jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.execute_recognition_godmother(uuid, jsonb, jsonb, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.execute_recognition_godmother(uuid, jsonb, jsonb, text) TO service_role;

REVOKE ALL ON FUNCTION public.execute_victory_godmother(uuid, jsonb, jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.execute_victory_godmother(uuid, jsonb, jsonb, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.execute_victory_godmother(uuid, jsonb, jsonb, text) TO service_role;

REVOKE ALL ON FUNCTION public.execute_widget_data_point_godmother(uuid, jsonb, jsonb, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.execute_widget_data_point_godmother(uuid, jsonb, jsonb, text) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.execute_widget_data_point_godmother(uuid, jsonb, jsonb, text) TO service_role;

COMMENT ON FUNCTION public.dispatch_godmothers IS
  '100300 EMERGENCY LOCKDOWN: revoked from anon/authenticated. Internal-only '
  '— invoked exclusively by trg_deed_firing_dispatch (AFTER INSERT trigger '
  'on deed_firings, migration 100219), itself SECURITY DEFINER, so the '
  'legitimate deed->dispatch->godmother chain is unaffected. Was previously '
  'PUBLIC-executable (fully unauthenticated) since its original 100206/'
  '100219 migrations — closed a live cross-tenant arbitrary money/points '
  'minting vulnerability, see RLS-VERIFICATION.md.';

COMMENT ON FUNCTION public.execute_points_godmother IS
  '100300 EMERGENCY LOCKDOWN: revoked from anon/authenticated (was fully '
  'PUBLIC-executable, unauthenticated). Called only via dispatch_godmothers, '
  'itself SECURITY DEFINER — unaffected. PRD-24 Point Economy Addendum §5.1 '
  '(ruling 1) config-as-truth resolution logic (100296) is unchanged by '
  'this migration.';


-- ============================================================================
-- Part 2 — member_points_today: add the family-membership auth gate
-- (rewritten from its 100296 body; logic otherwise unchanged)
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
  v_member_family    UUID;
  v_authorized        BOOLEAN := FALSE;
  v_sum               INTEGER;
BEGIN
  SELECT fm.family_id, f.timezone INTO v_member_family, v_family_timezone
    FROM public.family_members fm
    JOIN public.families f ON f.id = fm.family_id
   WHERE fm.id = p_member_id;

  IF v_member_family IS NULL THEN
    RAISE EXCEPTION 'Member not found';
  END IF;

  IF auth.role() = 'service_role' THEN
    v_authorized := TRUE;
  ELSIF auth.uid() IS NOT NULL THEN
    SELECT EXISTS (
      SELECT 1 FROM public.family_members caller
      WHERE caller.family_id = v_member_family
        AND caller.user_id = auth.uid()
    ) INTO v_authorized;
  END IF;

  IF NOT v_authorized THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

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
  'progress. 100300: added the family-membership authorization gate '
  '(service_role OR caller is a family_members row in the same family as '
  'p_member_id) — was previously callable by any authenticated user for '
  'any member_id, leaking a real points-today aggregate cross-family '
  '(rls-verifier WARNING finding). Used by the My Rewards daily-goal '
  'display (Slice A3) and by record_point_transaction''s goal-crossing check.';


-- ============================================================================
-- Verification (informational only — the authoritative post-apply check is
-- a separate has_function_privilege() probe run immediately after this
-- migration applies, since proacl parsing inline here is error-prone)
-- ============================================================================

DO $$
DECLARE
  v_gate_present BOOLEAN;
BEGIN
  SELECT prosrc LIKE '%Not authorized%' AND prosrc LIKE '%auth.role() = ''service_role''%'
    INTO v_gate_present
  FROM pg_proc
  WHERE proname = 'member_points_today' AND pronamespace = 'public'::regnamespace;

  RAISE NOTICE 'migration 100300: godmother lockdown + member_points_today auth gate applied';
  RAISE NOTICE '  member_points_today auth gate present: %', v_gate_present;
END $$;
