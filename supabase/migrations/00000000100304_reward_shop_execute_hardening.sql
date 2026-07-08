-- ============================================================================
-- 100304 — PECON-SHOP hardening: explicit REVOKE FROM PUBLIC/anon on the 5
--          Reward Shop functions from migration 100302.
--
-- rls-verifier's live pass on 100302 (RLS-VERIFICATION.md, "Migration 100302
-- — PECON-SHOP") returned PASS with zero authorization gaps — every function
-- correctly gates on family membership before computing or paying anything,
-- confirmed against a genuinely unauthenticated (anon-role, no JWT) caller.
-- It flagged one WARNING-level (non-blocking) hygiene item: none of the 5
-- functions had an explicit REVOKE from PUBLIC/anon before their GRANT TO
-- authenticated, so the implicit PUBLIC-execute grant Postgres applies at
-- CREATE FUNCTION time (unless explicitly revoked) still lets anon reach the
-- function body — safely, since every body's internal check fails closed,
-- but as pure defense-in-depth this closes even the theoretical crack rather
-- than relying solely on the in-body check to keep failing closed forever.
--
-- No logic changes. No behavior changes for any authorized caller.
-- ============================================================================

BEGIN;

REVOKE ALL ON FUNCTION public.purchase_reward_shop_item(UUID, UUID, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.purchase_reward_shop_item(UUID, UUID, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.purchase_reward_shop_item(UUID, UUID, UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.resolve_reward_shop_purchase(UUID, TEXT, TEXT, UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.resolve_reward_shop_purchase(UUID, TEXT, TEXT, UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.resolve_reward_shop_purchase(UUID, TEXT, TEXT, UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.cancel_reward_shop_purchase(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cancel_reward_shop_purchase(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION public.cancel_reward_shop_purchase(UUID) TO authenticated, service_role;

REVOKE ALL ON FUNCTION public.member_completion_percentage(UUID, DATE, DATE) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.member_completion_percentage(UUID, DATE, DATE) FROM anon;
GRANT EXECUTE ON FUNCTION public.member_completion_percentage(UUID, DATE, DATE) TO authenticated, service_role;

REVOKE ALL ON FUNCTION util.has_reward_rules_grant(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION util.has_reward_rules_grant(UUID) FROM anon;
GRANT EXECUTE ON FUNCTION util.has_reward_rules_grant(UUID) TO authenticated;

DO $$
DECLARE
  v_anon_has_any BOOLEAN;
BEGIN
  SELECT
    has_function_privilege('anon', 'public.purchase_reward_shop_item(uuid,uuid,uuid)', 'EXECUTE')
    OR has_function_privilege('anon', 'public.resolve_reward_shop_purchase(uuid,text,text,uuid)', 'EXECUTE')
    OR has_function_privilege('anon', 'public.cancel_reward_shop_purchase(uuid)', 'EXECUTE')
    OR has_function_privilege('anon', 'public.member_completion_percentage(uuid,date,date)', 'EXECUTE')
    OR has_function_privilege('anon', 'util.has_reward_rules_grant(uuid)', 'EXECUTE')
  INTO v_anon_has_any;

  IF v_anon_has_any THEN
    RAISE EXCEPTION 'migration 100304: anon still holds EXECUTE on a Reward Shop function';
  END IF;

  RAISE NOTICE 'migration 100304: anon EXECUTE revoked on all 5 Reward Shop functions';
END $$;

COMMIT;
