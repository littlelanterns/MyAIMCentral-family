-- ============================================================================
-- 00000000100340 — BETA-COHORT: beta_cohort_settings singleton guard
-- ============================================================================
-- Minor finding from the rls-verifier pass on migration 100338 (2026-09-12):
-- beta_cohort_settings has no client policies at all (by design — RPC-only
-- reads via get_beta_cohort_mode(), seat-only writes via a plain UPDATE), but
-- NOTHING stopped a second row from being INSERTed by a service_role/postgres
-- caller. Every reader in the codebase does `SELECT ... FROM
-- beta_cohort_settings LIMIT 1` (get_beta_cohort_mode(), handle_new_user(),
-- create_beta_interim_verification()) — a second row would silently make
-- "which row wins" depend on unspecified row order, a genuine correctness
-- risk for a table that gates whether real signups get charged.
--
-- Fix: a BEFORE INSERT trigger refuses any INSERT once a row already exists.
-- The table's DEFAULT gen_random_uuid() primary key means a UNIQUE
-- constraint on a fixed value isn't available (there's no natural constant
-- to key on), so a trigger is the correct enforcement mechanism — the
-- seat's own framing. Not SECURITY DEFINER: the only caller that can ever
-- reach this INSERT is service_role/postgres (RLS has zero client
-- policies on this table since 100338), which already bypasses RLS on its
-- own privileges — the trigger needs no elevated access beyond what the
-- invoking role already has.
--
-- Idempotent (CREATE OR REPLACE function; DO-guarded CREATE TRIGGER).
-- Authored only — the seat applies per the production-touch gate.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.enforce_beta_cohort_settings_singleton()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $fn$
BEGIN
  IF EXISTS (SELECT 1 FROM public.beta_cohort_settings) THEN
    RAISE EXCEPTION 'beta_cohort_settings is a singleton table — exactly one row may ever exist. Use UPDATE to flip enabled, never INSERT a second row.';
  END IF;
  RETURN NEW;
END;
$fn$;

COMMENT ON FUNCTION public.enforce_beta_cohort_settings_singleton() IS
  'BETA-COHORT singleton guard (migration 100340, rls-verifier finding on 100338). Refuses any INSERT into beta_cohort_settings once a row already exists — every reader assumes exactly one row.';

DO $$ BEGIN
  CREATE TRIGGER trg_beta_cohort_settings_singleton
    BEFORE INSERT ON public.beta_cohort_settings
    FOR EACH ROW EXECUTE FUNCTION public.enforce_beta_cohort_settings_singleton();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ── Self-verification ────────────────────────────────────────────────────
DO $$
DECLARE
  v_row_count INTEGER;
  v_trigger_exists BOOLEAN;
  v_second_insert_blocked BOOLEAN := false;
BEGIN
  SELECT COUNT(*) INTO v_row_count FROM public.beta_cohort_settings;
  IF v_row_count <> 1 THEN
    RAISE EXCEPTION '[100340] expected exactly 1 beta_cohort_settings row at apply time, found %', v_row_count;
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'trg_beta_cohort_settings_singleton'
      AND tgrelid = 'public.beta_cohort_settings'::regclass
  ) INTO v_trigger_exists;
  IF NOT v_trigger_exists THEN
    RAISE EXCEPTION '[100340] trg_beta_cohort_settings_singleton trigger not found';
  END IF;

  -- Prove the guard actually fires, inside a sub-transaction that always
  -- rolls back (never leaves a second row or a permanently-aborted outer
  -- transaction behind).
  BEGIN
    INSERT INTO public.beta_cohort_settings (enabled) VALUES (true);
  EXCEPTION WHEN OTHERS THEN
    v_second_insert_blocked := true;
  END;
  IF NOT v_second_insert_blocked THEN
    RAISE EXCEPTION '[100340] a second beta_cohort_settings row was NOT blocked — singleton guard is not working';
  END IF;

  -- Confirm the probe insert above did not actually land (belt and
  -- suspenders — the exception handler already prevented the outer
  -- statement from committing it, but assert it explicitly).
  SELECT COUNT(*) INTO v_row_count FROM public.beta_cohort_settings;
  IF v_row_count <> 1 THEN
    RAISE EXCEPTION '[100340] beta_cohort_settings row count is % after the guard probe, expected 1', v_row_count;
  END IF;

  RAISE NOTICE '[100340] beta_cohort_settings singleton guard verified — second INSERT correctly blocked, exactly 1 row remains.';
END $$;
