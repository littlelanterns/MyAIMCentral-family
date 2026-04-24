-- Row 192 NEW-LL / Worker TOGGLE-2 — routine step checkbox idempotent toggle
--
-- Founder intent (locked 2026-04-24): checkbox state = single source of truth.
-- Checked = exactly one row for (step_id, family_member_id, period_date).
-- Unchecked = zero rows. Re-clicking a checked step = no-op.
--
-- Before this migration, useCompleteRoutineStep INSERTed unconditionally on every
-- click. Mosiah's live data 2026-04-24 surfaced the symptom: Zone 2 Herringbone
-- had 17 raw rows for 12 unique completed steps; Bathroom Cleaning had 20 rows
-- for 12 unique steps. Migration 100164 dedupes at RPC read time so allowance
-- math stayed correct, but duplicates were still accumulating in the raw table.
--
-- This migration is the WRITE-time fix:
--   1. Cleanup CTE — collapse historical duplicates per
--      (step_id, family_member_id, period_date), keeping the EARLIEST
--      completed_at row (the original click — preserves the truest timestamp).
--   2. UNIQUE INDEX on (step_id, family_member_id, period_date) — guarantees
--      future re-clicks cannot produce duplicate rows. The matching hook
--      (useCompleteRoutineStep) uses ON CONFLICT DO NOTHING so re-checking a
--      checked step is a silent no-op.
--   3. Drop the now-redundant non-unique 4-column index that included
--      instance_number (idx_rsc_step_member_date) — the new UNIQUE index covers
--      every query that index served. instance_number itself is left in place;
--      it is unused by every UI write/delete path (always defaults to 1) but
--      column removal is out of NEW-LL scope.
--
-- Interaction with gamification pipeline: roll_creature_for_completion keys off
-- task_completions.id, NOT routine_step_completions. Per Convention #206 the
-- unmark cascade (point reversal on uncheck) is explicitly NOT implemented and
-- is tracked separately as NEW-HH / B1b. This migration is purely the DB-level
-- toggle invariant.

-- ──────────────────────────────────────────────────────────────────────────
-- Step 1. Backfill — collapse duplicate rows per (step_id, family_member_id,
-- period_date), keeping the earliest completed_at.
-- ──────────────────────────────────────────────────────────────────────────

WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY step_id, family_member_id, period_date
      ORDER BY completed_at ASC, id ASC
    ) AS rn
  FROM public.routine_step_completions
  WHERE family_member_id IS NOT NULL
)
DELETE FROM public.routine_step_completions
WHERE id IN (SELECT id FROM ranked WHERE rn > 1);

-- Defensive: also collapse the legacy member_id column path. Some rows pre-date
-- the family_member_id backfill in migration 100023 — handle both shapes.
WITH ranked_legacy AS (
  SELECT
    id,
    ROW_NUMBER() OVER (
      PARTITION BY step_id, member_id, period_date
      ORDER BY completed_at ASC, id ASC
    ) AS rn
  FROM public.routine_step_completions
  WHERE family_member_id IS NULL AND member_id IS NOT NULL
)
DELETE FROM public.routine_step_completions
WHERE id IN (SELECT id FROM ranked_legacy WHERE rn > 1);

-- ──────────────────────────────────────────────────────────────────────────
-- Step 2. UNIQUE INDEX guaranteeing one row per (step, member, day).
--
-- Partial index excludes the legacy NULL-family_member_id path (which the
-- backfill above already deduplicated). All current writes set family_member_id
-- via useCompleteRoutineStep (mirrors completion.member_id into family_member_id).
-- ──────────────────────────────────────────────────────────────────────────

CREATE UNIQUE INDEX IF NOT EXISTS uniq_rsc_step_member_date
  ON public.routine_step_completions (step_id, family_member_id, period_date)
  WHERE family_member_id IS NOT NULL;

-- ──────────────────────────────────────────────────────────────────────────
-- Step 3. Drop the now-redundant non-unique 4-column index. The new UNIQUE
-- index covers every read pattern that index served (lookups by step+member+day,
-- and by step+member alone via prefix).
-- ──────────────────────────────────────────────────────────────────────────

DROP INDEX IF EXISTS public.idx_rsc_step_member_date;

COMMENT ON INDEX public.uniq_rsc_step_member_date IS
  'Row 192 NEW-LL: enforces checkbox idempotency. Re-clicking an already-checked routine step is a no-op via ON CONFLICT DO NOTHING in useCompleteRoutineStep.';

-- ──────────────────────────────────────────────────────────────────────────
-- Verification (post-migration assertion). Run this manually or via
-- tests/verification/new-ll-checkbox-idempotent.ts. Expected: zero rows.
--
-- SELECT step_id, family_member_id, period_date, COUNT(*) AS dupes
-- FROM public.routine_step_completions
-- WHERE family_member_id IS NOT NULL
-- GROUP BY step_id, family_member_id, period_date
-- HAVING COUNT(*) > 1;
-- ──────────────────────────────────────────────────────────────────────────
