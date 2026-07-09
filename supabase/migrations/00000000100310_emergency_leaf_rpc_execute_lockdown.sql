-- Emergency RPC EXECUTE lockdown — 2026-07-09
-- The adversarial safety-stack review found five SECURITY DEFINER leaf
-- functions still anon/authenticated/PUBLIC-executable: the 100300 godmother
-- lockdown sealed the dispatch layer but missed these leaves. Proven live:
-- an unauthenticated anon-key call wrote a real financial_transactions row
-- into a child ledger.
--
-- THIS migration handles ONLY the three with NO legitimate client caller
-- (verified by grep across src/ + supabase/functions/):
--   grant_points                    — called only by internal SECURITY DEFINER godmothers
--   update_ethics_pattern_embedding — called only by the embed Edge Function (service role)
--   insert_ethics_pattern_candidate — called only by validate-ai-output EF (service role)
-- Internal SECURITY DEFINER callers run as the definer, so revoking anon/
-- authenticated does NOT break the deed pipeline or the ethics-library
-- writers — identical reasoning proven correct by the 100300 lockdown.
--
-- grant_money + apply_permission_profile are DELIBERATELY NOT here: both have
-- legitimate mom-facing authenticated callers (src/lib/financial/grantMoney.ts,
-- PermissionHub.tsx). They get in-body authorization gates (migration-100298
-- pattern) via the SECURITY-EMERGENCY worker, not a blunt revoke.
--
-- Idempotent: REVOKE/GRANT are safe to re-run.

REVOKE EXECUTE ON FUNCTION public.grant_points(uuid, uuid, integer) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.grant_points(uuid, uuid, integer) TO service_role;

REVOKE EXECUTE ON FUNCTION public.update_ethics_pattern_embedding(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.update_ethics_pattern_embedding(uuid, text) TO service_role;

REVOKE EXECUTE ON FUNCTION public.insert_ethics_pattern_candidate(text, text, text) FROM PUBLIC, anon, authenticated;
GRANT  EXECUTE ON FUNCTION public.insert_ethics_pattern_candidate(text, text, text) TO service_role;
