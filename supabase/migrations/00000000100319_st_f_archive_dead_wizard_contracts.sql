-- Migration: 00000000100319_st_f_archive_dead_wizard_contracts.sql
-- Build: STUDIO-EXPERIENCE — ST-F (Reward-wire truth)
--
-- F-14 remediation. ListRevealAssignmentWizard and ActivityListWizard have
-- always authored contracts against deed source types NOTHING ever fires
-- (source_type IN ('list_item_completion', 'randomizer_drawn') — every
-- client fireDeed() call site fires 'task_completion' or
-- 'intention_iteration'; the only server producer is
-- 'scheduled_occurrence_active'). These rows have sat inert on every
-- family's /contracts page since the wizards shipped (Phase 3.7/3.8).
--
-- The Studio-Experience audit (claude/feature-decisions/Studio-Experience.md
-- F-14/S1) traced the ACTUAL payment paths for these wizards and found them
-- already correct and independent of the dead contracts:
--   - Opportunity board money  -> task_rewards + grant_money_for_task_completion
--   - Opportunity board points -> tasks.points_override + the standing
--     per-family points_godmother resolution (execute_points_godmother,
--     config-as-truth path) fired on the normal task_completion deed
--   - Opportunity board privilege/custom -> task_rewards +
--     award_custom_reward_for_completion
--   - Draw-flavor task creation -> Randomizer.tsx's handleAssign (already
--     worked, independent of the wizard, for any randomizer list)
--   - ActivityListWizard segment-tile gamification -> the standing per-kid
--     creature_godmother / page_unlock_godmother contracts (migration
--     100225) fired on the ordinary task_completion deed
--   - ActivityListWizard routine-step points -> task_template_steps.reward_type
--     ('stars') via process_routine_step_completion (migration 100296)
--
-- The ST-F code fix stops the three wizard code paths from authoring new
-- dead contracts (STUDIO-EXPERIENCE ST-F, 2026-08-23). This migration
-- archives the EXISTING dead rows so mom's /contracts page (which already
-- filters to status IN ('active','recently_deleted') per useContracts.ts)
-- stops showing them, and dispatch_godmothers (which only evaluates
-- status='active' contracts, migration 100206) stops walking them.
--
-- Scope is deliberately conservative: only rows with a wizard-authored
-- source_category are touched. ActivityListWizard's "combined reward scope"
-- every-Nth contract (rewardScope='combined') sets source_category=NULL,
-- indistinguishable from a mom-authored /contracts page every_nth reward —
-- those rows are left untouched by this migration (the code fix prevents
-- any NEW ones; existing combined-scope rows are a flagged residual, noted
-- in the ST-F build record).
--
-- Idempotent: re-running only re-touches rows that are somehow still
-- 'active', which won't happen after the first run.

BEGIN;

DO $$
DECLARE
  v_archived_count INTEGER;
BEGIN
  UPDATE public.contracts
     SET status = 'archived',
         archived_at = now()
   WHERE status = 'active'
     AND source_category IN ('opportunity_wizard', 'draw_wizard', 'activity_list');

  GET DIAGNOSTICS v_archived_count = ROW_COUNT;
  RAISE NOTICE 'migration 100319: archived % dead wizard-authored contract row(s)', v_archived_count;
END $$;

COMMIT;
