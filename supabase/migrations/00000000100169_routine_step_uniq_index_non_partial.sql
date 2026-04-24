-- Row 192 NEW-LL (follow-up) / Worker TOGGLE-2 — convert uniq_rsc_step_member_date
-- to a non-partial UNIQUE index so PostgREST can use it for ON CONFLICT.
--
-- Migration 100168 created `uniq_rsc_step_member_date` as a PARTIAL index
-- with `WHERE family_member_id IS NOT NULL`. The constraint is enforced at
-- the DB level (raw INSERT of a duplicate is rejected with sqlstate 23505,
-- verified by tests/verification/new-ll-checkbox-idempotent.ts scenario 2),
-- BUT PostgREST cannot use partial indexes for ON CONFLICT inference
-- through the REST API. Symptom: useCompleteRoutineStep's
-- .upsert(..., { onConflict: 'step_id,family_member_id,period_date',
-- ignoreDuplicates: true }) fails with "there is no unique or exclusion
-- constraint matching the ON CONFLICT specification".
--
-- Fix: drop the partial index and recreate it without the WHERE clause.
-- PostgreSQL treats each NULL as DISTINCT in a UNIQUE index by default
-- (NULLS DISTINCT — standard SQL), so legacy rows with
-- family_member_id IS NULL still coexist without violating uniqueness.
-- The 100168 cleanup CTE already collapsed legacy NULL duplicates.
--
-- File 100168 was updated in-place to document the non-partial version
-- (so future deploys to fresh databases create the correct index from
-- the start). This migration handles the in-flight DB that already has
-- the partial form applied.

DROP INDEX IF EXISTS public.uniq_rsc_step_member_date;

CREATE UNIQUE INDEX IF NOT EXISTS uniq_rsc_step_member_date
  ON public.routine_step_completions (step_id, family_member_id, period_date);

COMMENT ON INDEX public.uniq_rsc_step_member_date IS
  'Row 192 NEW-LL: enforces checkbox idempotency. Non-partial so PostgREST recognizes it for ON CONFLICT. NULLs are DISTINCT (PG default) so legacy rows with NULL family_member_id are unaffected.';
