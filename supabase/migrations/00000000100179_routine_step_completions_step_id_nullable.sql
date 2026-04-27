-- Worker ROUTINE-SAVE-FIX follow-up — drop NOT NULL on routine_step_completions.step_id
--
-- Migration 100177 changed the FK to ON DELETE SET NULL so completion history
-- survives structural edits to routine templates (Convention #259). But the
-- step_id column itself was still defined as NOT NULL, which contradicts the
-- SET NULL action: when a step is deleted, Postgres tries to set step_id to
-- NULL but the NOT NULL constraint rejects it, raising:
--   null value in column "step_id" of relation "routine_step_completions"
--   violates not-null constraint
--
-- This migration drops the NOT NULL on step_id so the SET NULL action can
-- actually fire. The column becomes nullable; orphaned completion rows
-- (from deleted steps) keep all their other fields and their original
-- task_id, member_id, completed_at, etc. — they just no longer point to
-- a step that no longer exists.
--
-- All consumers of routine_step_completions.step_id were verified during
-- Worker ROUTINE-SAVE-FIX Phase 1 audit to handle NULL step_id safely
-- (membership checks via Set<string>.has(step.id) silently miss orphaned
-- completions, which is the desired audit-trail behavior).

ALTER TABLE public.routine_step_completions
  ALTER COLUMN step_id DROP NOT NULL;

COMMENT ON COLUMN public.routine_step_completions.step_id IS
  'FK to task_template_steps.id. Nullable per Convention #259: completion rows survive structural edits to routine templates by orphaning their step_id reference (ON DELETE SET NULL). Migration 100177 set the FK action; migration 100179 dropped the NOT NULL.';
