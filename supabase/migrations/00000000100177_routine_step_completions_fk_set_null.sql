-- Worker ROUTINE-SAVE-FIX (c1) — bring routine_step_completions.step_id
-- FK into compliance with Convention #259.
--
-- Convention #259 (CLAUDE.md): "Past `routine_step_completions` survive
-- structural edits because they key on `step_id` (FK to
-- `task_template_steps`). When a step is deleted, the completion rows
-- orphan but stay readable in audit views."
--
-- The live constraint was created with the default ON DELETE NO ACTION,
-- which BLOCKS deletion of any task_template_step that has historical
-- completions. In production this manifests as a silent save failure
-- when mom edits a routine template that already has any completion
-- history — createTaskFromData's DELETE on task_template_steps raises
-- a foreign-key violation, the throw is swallowed by an empty
-- try/finally in TaskCreationModal, and mom sees nothing happen.
--
-- Fix: switch to ON DELETE SET NULL. When a step is deleted, the
-- completion row survives (audit trail preserved) but step_id becomes
-- NULL. All consumer code (TaskCard, RoutineStepChecklist,
-- GuidedActiveTasksSection, useRoutineWeekView, RoutineWeekEditPage,
-- useTaskCompletions) reads step_id by checking
-- `Set<string>.has(currentStep.id)` against the live step list — a
-- NULL step_id silently fails the membership check, which is exactly
-- the desired audit-trail behavior. Verified in c1 audit.
--
-- UNIQUE INDEX safety: uniq_rsc_step_member_date is non-partial
-- (migration 100169) and PostgreSQL treats NULLs as DISTINCT in
-- unique indexes by default. Orphaned rows can coexist without
-- violating uniqueness.

-- Idempotent guard: drop existing FK only if present.
ALTER TABLE public.routine_step_completions
  DROP CONSTRAINT IF EXISTS routine_step_completions_step_id_fkey;

-- Recreate with ON DELETE SET NULL.
ALTER TABLE public.routine_step_completions
  ADD CONSTRAINT routine_step_completions_step_id_fkey
  FOREIGN KEY (step_id)
  REFERENCES public.task_template_steps(id)
  ON DELETE SET NULL;

COMMENT ON CONSTRAINT routine_step_completions_step_id_fkey
  ON public.routine_step_completions IS
  'Worker ROUTINE-SAVE-FIX (c1): ON DELETE SET NULL so routine template structural edits do not block on existing completion history. Completions survive with step_id=NULL when their step is deleted (Convention #259).';
