-- ============================================================================
-- List as 5th Task Type
-- ============================================================================
-- Adds 'list' as a valid task_type so a task can represent a list-based
-- assignment (e.g. a shopping run, packing checklist, or study list).
--
-- New columns on tasks:
--   linked_list_id       UUID FK → lists(id)  — the list the task wraps
--   list_delivery_mode   TEXT CHECK           — how items are surfaced
--                          'checklist'  = all items visible at once
--                          'batch'      = items revealed in batches
--                          'sequential' = one item at a time (drip)
--
-- Also adds 'list_batch' to the source CHECK so batch-created list-tasks
-- from the RoutingStrip can be correctly attributed.
-- ============================================================================

-- ─────────────────────────────────────────────────────────────
-- 1. Extend task_type CHECK to include 'list'
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_task_type_check;
ALTER TABLE public.tasks
  ADD CONSTRAINT tasks_task_type_check
  CHECK (task_type IN (
    'task',
    'routine',
    'opportunity_repeatable',
    'opportunity_claimable',
    'opportunity_capped',
    'sequential',
    'habit',
    'guided_form',
    'list'
  ));

-- ─────────────────────────────────────────────────────────────
-- 2. Add linked_list_id column
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS linked_list_id UUID REFERENCES public.lists(id) ON DELETE SET NULL;

-- ─────────────────────────────────────────────────────────────
-- 3. Add list_delivery_mode column
-- ─────────────────────────────────────────────────────────────
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS list_delivery_mode TEXT
    CHECK (list_delivery_mode IN ('checklist', 'batch', 'sequential'));

-- ─────────────────────────────────────────────────────────────
-- 4. Extend source CHECK to include 'list_batch'
-- ─────────────────────────────────────────────────────────────
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
    'list_batch'
  ));

-- ─────────────────────────────────────────────────────────────
-- 5. Index for list-task lookups
-- ─────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_tasks_linked_list
  ON public.tasks (linked_list_id)
  WHERE linked_list_id IS NOT NULL;
