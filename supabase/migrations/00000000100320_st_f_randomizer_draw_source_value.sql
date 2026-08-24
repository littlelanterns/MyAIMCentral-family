-- Migration: 00000000100320_st_f_randomizer_draw_source_value.sql
-- Build: STUDIO-EXPERIENCE — ST-F (Reward-wire truth)
--
-- P0-class finding (same bug class as F-21 / ST-0's 'studio'/'wizard' gap):
-- Randomizer.tsx's handleAssign — the ONLY code in the platform that turns a
-- randomizer draw into a real task on a kid's dashboard, used by EVERY
-- randomizer list regardless of how it was created — has ALWAYS inserted
-- `tasks.source = 'randomizer_draw'`, a value that has NEVER existed in
-- tasks_source_check. Every draw-and-assign has failed with a 23514
-- constraint violation since this code shipped (live-reproduced 2026-08-23
-- driving the actual UI: "new row for relation \"tasks\" violates check
-- constraint \"tasks_source_check\""). `src/types/tasks.ts`'s TaskSource
-- union separately declares 'randomizer_reveal' (a value that IS in the
-- live constraint) but nothing in the codebase ever writes it — the
-- constraint and the type union both drifted from what the implementation
-- actually does.
--
-- Fix: extend the constraint to match the code (ST-0 precedent — rebuild
-- from the CURRENT full enumeration, verified live immediately before
-- writing this migration via pg_get_constraintdef, never a stale copy;
-- authored with the same `source IN (...)` shape as migration 100283 so
-- tests/task-source-constraint.test.ts's extraction regex parses it).
-- 'randomizer_draw' added; every existing value preserved byte-for-byte.
--
-- Idempotent: DROP/ADD CONSTRAINT is safe to re-run (DROP IF EXISTS).

BEGIN;

ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_source_check;

ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_source_check
  CHECK (source IN (
    'manual',
    'template_deployed',
    'lila_conversation',
    'notepad_routed',
    'review_route',
    'meeting_action',
    'goal_decomposition',
    'project_planner',
    'member_request',
    'sequential_promoted',
    'recurring_generated',
    'guided_form_assignment',
    'list_batch',
    'rhythm_priority',
    'rhythm_mindsweep_lite',
    'randomizer_reveal',
    'allowance_makeup',
    'opportunity_list_claim',
    'list_promotion',
    'icon_launcher',
    'activity_list',
    'mindsweep_auto',
    'reward_proposal',
    'studio',
    'wizard',
    'randomizer_draw'
  ));

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'tasks_source_check'
  ) THEN
    RAISE EXCEPTION 'migration 100320: tasks_source_check constraint missing after rebuild';
  END IF;
  RAISE NOTICE 'migration 100320: tasks_source_check now permits randomizer_draw';
END $$;

COMMIT;
