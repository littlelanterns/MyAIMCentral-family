-- Worker A: extend routine step completions unique index to include instance_number.
--
-- Migration 100168/100169 created a UNIQUE index on (step_id, family_member_id,
-- period_date) for idempotent checkbox toggles. That index limits each step to
-- exactly one completion per day — which breaks steps with instance_count > 1
-- (e.g., "practice 3 times"). The instance_number column exists (DEFAULT 1,
-- NOT NULL since migration 100023) but was excluded from the unique constraint.
--
-- This migration widens the unique index to (step_id, family_member_id,
-- period_date, instance_number). Existing rows all have instance_number=1,
-- so uniqueness is preserved. Multi-instance steps can now store one row per
-- (step, member, day, instance).
--
-- The useCompleteRoutineStep hook is updated in the same commit to pass
-- onConflict: 'step_id,family_member_id,period_date,instance_number'.

DROP INDEX IF EXISTS public.uniq_rsc_step_member_date;

CREATE UNIQUE INDEX uniq_rsc_step_member_date
  ON public.routine_step_completions (step_id, family_member_id, period_date, instance_number);

COMMENT ON INDEX public.uniq_rsc_step_member_date IS
  'Idempotent checkbox toggle per (step, member, day, instance). Widened from 3-col to 4-col in migration 100191 to support instance_count > 1.';
