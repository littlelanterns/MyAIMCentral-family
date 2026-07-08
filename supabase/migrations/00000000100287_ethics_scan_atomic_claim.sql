-- ============================================================================
-- PRD-41 Phase 2 fix-up #1 — atomic batch claim for validate-ai-output.
--
-- Phase 1 shipped a plain SELECT-then-UPDATE-to-processing claim, which lets
-- two overlapping cron invocations double-claim the same pending rows (a
-- Tier-2-heavy batch can exceed the 60s cron interval and overlap the next
-- tick — double-embedding + double-Haiku spend at the enforcement flip).
-- This RPC does the claim as a single atomic statement with
-- FOR UPDATE SKIP LOCKED (PRD §Tier 2 idempotency spec), so a concurrent
-- invocation skips rows already locked by the first and never re-processes
-- them.
--
-- Service-role only (validate-ai-output is the sole caller; deployed
-- --no-verify-jwt with an in-code bearer check). Idempotent.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.claim_pending_ethics_scans(p_limit integer DEFAULT 50)
RETURNS SETOF public.ai_output_scans
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  UPDATE public.ai_output_scans
  SET status = 'processing'
  WHERE id IN (
    SELECT id FROM public.ai_output_scans
    WHERE status = 'pending'
    ORDER BY created_at ASC
    LIMIT p_limit
    FOR UPDATE SKIP LOCKED
  )
  RETURNING *;
$$;

REVOKE ALL ON FUNCTION public.claim_pending_ethics_scans(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.claim_pending_ethics_scans(integer) TO service_role;

COMMENT ON FUNCTION public.claim_pending_ethics_scans(integer) IS
  'PRD-41 — atomically claims up to p_limit pending ai_output_scans rows '
  '(status pending -> processing) with FOR UPDATE SKIP LOCKED so overlapping '
  'validate-ai-output cron invocations cannot double-claim. Service-role only.';
