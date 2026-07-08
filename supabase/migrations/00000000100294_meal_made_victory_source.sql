-- ============================================================================
-- 00000000100294_meal_made_victory_source.sql
-- ============================================================================
-- Build: PRD-42 KitchenCompass, Phase A, Slice A3
-- Adds 'meal_made' to victories.source CHECK (PRD §12.3 — first-solo-dinner
-- / cooking-milestone Victory). Rewritten from the CURRENT production
-- constraint (migration 100223, the latest of the two that have ever
-- touched victories_source_check) — not a stale copy.
-- Idempotent (safe to re-run).
-- ============================================================================

BEGIN;

ALTER TABLE public.victories DROP CONSTRAINT IF EXISTS victories_source_check;
ALTER TABLE public.victories ADD CONSTRAINT victories_source_check
  CHECK (source = ANY (ARRAY[
    'manual', 'task_completed', 'tracker_entry', 'intention_iteration',
    'widget_milestone', 'lila_conversation', 'notepad_routed',
    'reflection_routed', 'list_item_completed', 'list_completed',
    'routine_completion', 'homeschool_logged', 'plan_completed',
    'milestone_completed', 'family_feed', 'bookshelf', 'contract_grant',
    'meal_made'
  ]));

DO $$
BEGIN
  RAISE NOTICE 'migration 100294: victories_source_check now includes meal_made';
END $$;

COMMIT;
