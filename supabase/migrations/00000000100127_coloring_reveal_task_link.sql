-- ============================================================================
-- Build M Phase 4 — Coloring Reveal Task Link
--
-- Adds earning_task_id to member_coloring_reveals so each coloring picture
-- can be linked to a specific task. Each completion of that task = one
-- reveal step (1:1 mapping). This replaces the earning_mode system for
-- coloring reveals — the earning_mode/threshold columns are preserved
-- for backward compat but the UI no longer exposes them.
--
-- Founder decision 2026-04-10: coloring reveals are visual tally counters
-- tied to a specific repeatable action, not a second reward system with
-- its own earning strategy. Creatures use earning modes; coloring reveals
-- use direct task linkage.
-- ============================================================================

-- Add the task link column
ALTER TABLE public.member_coloring_reveals
  ADD COLUMN IF NOT EXISTS earning_task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL;

-- Index for fast lookup when a task is completed
CREATE INDEX IF NOT EXISTS idx_mcr_earning_task
  ON public.member_coloring_reveals (earning_task_id)
  WHERE earning_task_id IS NOT NULL AND is_active = true AND is_complete = false;

-- Verification
DO $$ BEGIN
  RAISE NOTICE 'migration 100127: earning_task_id column added to member_coloring_reveals';
END $$;
