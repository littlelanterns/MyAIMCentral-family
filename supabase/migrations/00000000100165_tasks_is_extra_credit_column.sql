-- Worker B1b / NEW-EE — Extra Credit column on tasks + task_templates.
--
-- PRD-28 §Screen 2 Section 5 (L202) specifies Extra Credit as a grace mechanism:
-- mom designates specific tasks as "extra credit" so kids can do additional work
-- to offset missed tasks. PRD-28 L979 specifies the math: extra-credit completions
-- contribute to the numerator (restoring toward 100%) but NOT to the denominator.
-- Effective completion is capped at 100% — extra credit cannot push above.
--
-- The schema already has `allowance_configs.extra_credit_enabled BOOLEAN` (master
-- toggle per child) and `allowance_periods.extra_credit_completed INTEGER` (per-
-- period tally), but there was no per-task designation mechanism. Adding
-- `is_extra_credit BOOLEAN DEFAULT false NOT NULL` to tasks + task_templates closes
-- the gap. The RPC update in migration 100168 (B1b) + the UI toggle in
-- TaskCreationModal consume this column.
--
-- This migration is schema-only and idempotent. The RPC that consumes the column
-- lands separately (100168) so either can be reverted independently.
--
-- Default false preserves existing behavior — no existing task is extra credit
-- unless mom explicitly toggles it after this lands.

ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS is_extra_credit BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.task_templates
  ADD COLUMN IF NOT EXISTS is_extra_credit BOOLEAN NOT NULL DEFAULT false;

COMMENT ON COLUMN public.tasks.is_extra_credit IS
  'PRD-28 Extra Credit: when true + counts_for_allowance=true, this task counts into the numerator of the allowance completion % but NOT the denominator. Capped at 100% effective completion. Designated by mom in TaskCreationModal. Consumed by calculate_allowance_progress RPC.';

COMMENT ON COLUMN public.task_templates.is_extra_credit IS
  'PRD-28 Extra Credit template flag: when true, tasks deployed from this template default to is_extra_credit=true. Mom can toggle at task level.';

-- Indexing: extra-credit tasks are a small subset per family, partial index keeps
-- the RPC query fast without bloating the btree on the false path.
CREATE INDEX IF NOT EXISTS idx_tasks_extra_credit
  ON public.tasks (family_id, assignee_id)
  WHERE is_extra_credit = true AND counts_for_allowance = true AND archived_at IS NULL;
