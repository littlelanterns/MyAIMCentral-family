-- ============================================================================
-- ST-0 hotfix — restore 'studio' and 'wizard' to tasks_source_check
-- Date: 2026-07-04
-- Build: STUDIO-EXPERIENCE cleanup, finding F-21 (P0)
--
-- Bug: RepeatedActionChartWizard.tsx (Progress Chart / Potty Chart wizard,
-- src/components/studio/wizards/RepeatedActionChartWizard.tsx) has NEVER
-- successfully deployed in production. Its first DB write — the tracked
-- action-task insert — uses source: 'studio', a value that has NEVER existed
-- in ANY historical definition of tasks_source_check, going all the way back
-- to the constraint's introduction in migration 00000000100023. Every
-- constraint rewrite since (100054, 100110, 100112, 100115, 100134, 100139,
-- 100232, 100262, 100278) enumerated a growing list of sources but never
-- included 'studio' or 'wizard' — this was never a regression, it was DOA.
--
-- The insert throws on the CHECK violation, the wizard's catch block shows
-- a generic "Something went wrong. Please try again." toast, and zero rows
-- are created. Verified live 2026-07-04 via direct DB probes + browser run.
--
-- This migration is based on the CURRENT production enumeration in migration
-- 00000000100278_reward_proposals.sql (23 values — the newest migration that
-- touches this constraint, confirmed via `grep -rl tasks_source_check
-- supabase/migrations/*.sql`). Per this repo's own documented
-- copy-stale-body regression pattern (see KIDS-REWARDS-PAGE build notes on
-- migrations 100266→100269), this list is built from the newest known-good
-- body, never an older one.
--
-- Adds exactly two values (23 → 25):
--   'studio' — written by RepeatedActionChartWizard.tsx (the wizard this
--              migration unblocks).
--   'wizard' — not currently written to `tasks.source` by any code path
--              (grep-verified 2026-07-04; the one `source: 'wizard'` literal
--              in the codebase, UniversalListWizard.tsx:457, targets
--              `activity_log_entries.source`, not `tasks.source`), but
--              restored per the founder-approved ST-0 dispatch scope as a
--              forward-compatible sibling value for future wizard-originated
--              task writes, matching the `wizard_templates`/`activity_log`
--              naming already in use elsewhere.
--
-- IMPORTANT — this list is effectively append-only. Removing a value that a
-- live code path writes silently breaks that feature the next time it
-- deploys, with no error surfaced anywhere except a swallowed catch block on
-- the client (exactly this bug). Any future rewrite of this constraint MUST
-- start from this file's list, not an older one, and MUST grep
-- `src/**/*.{ts,tsx}` for every `source: '<literal>'` flowing into a `tasks`
-- insert before removing anything. See tests/task-source-constraint.test.ts
-- for the automated guard.
--
-- Idempotent: safe to re-run.
-- ============================================================================

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
    'wizard'
  ));

-- ============================================================================
-- Verification
-- ============================================================================

DO $$
DECLARE
  v_ok BOOLEAN;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.constraint_column_usage
    WHERE table_name = 'tasks'
      AND constraint_name = 'tasks_source_check'
  ) INTO v_ok;

  IF NOT v_ok THEN
    RAISE EXCEPTION 'migration 100283: tasks_source_check constraint not found after rebuild';
  END IF;

  RAISE NOTICE 'Migration 100283 complete: tasks_source_check now allows 25 values (added studio, wizard).';
END $$;
