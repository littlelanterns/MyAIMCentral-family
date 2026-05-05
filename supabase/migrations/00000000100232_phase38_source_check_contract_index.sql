-- Phase 3.8: Fix tasks_source_check + contracts_unique_kid_override_idx
--
-- BUG #2-5: tasks_source_check missing 'list_promotion', 'icon_launcher', 'activity_list'
-- BUG #6: contracts_unique_kid_override_idx missing source_category, blocking per-subject contracts

-- ─── 1. Rebuild tasks_source_check — add 3 new values (18 → 21) ──

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
    'activity_list'
  ));

-- ─── 2. Rebuild contracts_unique_kid_override_idx with source_category ──
-- Old: (family_id, family_member_id, source_type, godmother_type)
-- New: (family_id, family_member_id, source_type, godmother_type, COALESCE(source_category, ''))
-- This allows per-subject activity_list contracts alongside generic task_completion contracts.

DROP INDEX IF EXISTS public.contracts_unique_kid_override_idx;
CREATE UNIQUE INDEX contracts_unique_kid_override_idx
  ON public.contracts (family_id, family_member_id, source_type, godmother_type, COALESCE(source_category, ''))
  WHERE status = 'active'
    AND inheritance_level = 'kid_override'
    AND source_id IS NULL
    AND family_member_id IS NOT NULL;
