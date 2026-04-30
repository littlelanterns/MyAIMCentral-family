-- Migration: Promote instantiation_mode and collaboration_mode to first-class columns
--
-- Previously, instantiation_mode lived inside JSONB fields:
--   - tasks.recurrence_details->'instantiation_mode'
--   - lists.schedule_config->'instantiation_mode'
--
-- This migration:
--   1. Adds instantiation_mode TEXT and collaboration_mode TEXT to both tasks and lists
--   2. Backfills instantiation_mode from the JSONB sub-fields
--   3. Backfills collaboration_mode = 'solo_claim' for existing shared items
--   4. Removes the instantiation_mode key from the JSONB fields (cleanup)
--
-- instantiation_mode values:
--   'per_assignee_instance'    — each assignee gets their own independent instance
--   'shared_anyone_completes'  — one shared instance, any assignee can complete
--
-- collaboration_mode values:
--   'solo_claim'    — one person claims/works on it at a time
--   'collaborative' — multiple people can work on it simultaneously

----------------------------------------------------------------------
-- 1. Add columns to tasks
----------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'instantiation_mode'
  ) THEN
    ALTER TABLE public.tasks
      ADD COLUMN instantiation_mode TEXT DEFAULT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'tasks' AND column_name = 'collaboration_mode'
  ) THEN
    ALTER TABLE public.tasks
      ADD COLUMN collaboration_mode TEXT DEFAULT NULL;
  END IF;
END $$;

-- Add CHECK constraints (idempotent via IF NOT EXISTS on constraint name)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_schema = 'public' AND table_name = 'tasks' AND constraint_name = 'tasks_instantiation_mode_check'
  ) THEN
    ALTER TABLE public.tasks
      ADD CONSTRAINT tasks_instantiation_mode_check
      CHECK (instantiation_mode IS NULL OR instantiation_mode IN ('per_assignee_instance', 'shared_anyone_completes'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_schema = 'public' AND table_name = 'tasks' AND constraint_name = 'tasks_collaboration_mode_check'
  ) THEN
    ALTER TABLE public.tasks
      ADD CONSTRAINT tasks_collaboration_mode_check
      CHECK (collaboration_mode IS NULL OR collaboration_mode IN ('solo_claim', 'collaborative'));
  END IF;
END $$;

----------------------------------------------------------------------
-- 2. Add columns to lists
----------------------------------------------------------------------

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lists' AND column_name = 'instantiation_mode'
  ) THEN
    ALTER TABLE public.lists
      ADD COLUMN instantiation_mode TEXT DEFAULT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'lists' AND column_name = 'collaboration_mode'
  ) THEN
    ALTER TABLE public.lists
      ADD COLUMN collaboration_mode TEXT DEFAULT NULL;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_schema = 'public' AND table_name = 'lists' AND constraint_name = 'lists_instantiation_mode_check'
  ) THEN
    ALTER TABLE public.lists
      ADD CONSTRAINT lists_instantiation_mode_check
      CHECK (instantiation_mode IS NULL OR instantiation_mode IN ('per_assignee_instance', 'shared_anyone_completes'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage
    WHERE table_schema = 'public' AND table_name = 'lists' AND constraint_name = 'lists_collaboration_mode_check'
  ) THEN
    ALTER TABLE public.lists
      ADD CONSTRAINT lists_collaboration_mode_check
      CHECK (collaboration_mode IS NULL OR collaboration_mode IN ('solo_claim', 'collaborative'));
  END IF;
END $$;

----------------------------------------------------------------------
-- 3. Backfill tasks.instantiation_mode from recurrence_details JSONB
----------------------------------------------------------------------

UPDATE public.tasks
SET instantiation_mode = recurrence_details->>'instantiation_mode'
WHERE recurrence_details->>'instantiation_mode' IS NOT NULL
  AND recurrence_details->>'instantiation_mode' != ''
  AND instantiation_mode IS NULL;

----------------------------------------------------------------------
-- 4. Backfill lists.instantiation_mode from schedule_config JSONB
----------------------------------------------------------------------

UPDATE public.lists
SET instantiation_mode = schedule_config->>'instantiation_mode'
WHERE schedule_config->>'instantiation_mode' IS NOT NULL
  AND schedule_config->>'instantiation_mode' != ''
  AND instantiation_mode IS NULL;

----------------------------------------------------------------------
-- 5. Backfill collaboration_mode for existing shared tasks
----------------------------------------------------------------------

UPDATE public.tasks
SET collaboration_mode = 'solo_claim'
WHERE is_shared = true AND collaboration_mode IS NULL;

----------------------------------------------------------------------
-- 6. Backfill collaboration_mode for existing shared lists
----------------------------------------------------------------------

UPDATE public.lists
SET collaboration_mode = 'solo_claim'
WHERE is_shared = true AND collaboration_mode IS NULL;

----------------------------------------------------------------------
-- 7. Remove instantiation_mode key from JSONB fields (cleanup)
----------------------------------------------------------------------

UPDATE public.tasks
SET recurrence_details = recurrence_details - 'instantiation_mode'
WHERE recurrence_details ? 'instantiation_mode';

UPDATE public.lists
SET schedule_config = schedule_config - 'instantiation_mode'
WHERE schedule_config ? 'instantiation_mode';
