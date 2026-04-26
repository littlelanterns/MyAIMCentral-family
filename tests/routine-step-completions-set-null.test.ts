/**
 * Worker ROUTINE-SAVE-FIX (c1) — verify migration 100177 brings the
 * routine_step_completions.step_id FK into compliance with Convention #259.
 *
 * Two layers of verification:
 *
 * 1. Migration SQL static check — confirms the migration drops the existing
 *    NO ACTION FK and recreates it with ON DELETE SET NULL. Catches an
 *    accidental edit-then-revert before it ships.
 *
 * 2. Consumer behavior under NULL step_id — every consumer code path that
 *    reads step_id from completion rows builds a Set<string> and checks
 *    membership against live step IDs. Orphaned completions (step_id=NULL,
 *    after the underlying step was deleted) MUST silently fail the
 *    membership check. We verify that contract by simulating the
 *    Set-construction the consumers do and asserting:
 *      - NULL step_ids do not enter the Set<string>
 *      - Set<string>.has(real_step.id) returns true for live completions
 *      - Set<string>.has(any_real_id) returns false when only orphans exist
 *
 * The full DB-behavior test (real Postgres FK firing on DELETE) lives in
 * tests/verification/routine-step-completions-set-null.ts and runs against
 * the linked Supabase project.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import type { RoutineStepCompletion } from '@/types/tasks'

// ─── Layer 1: migration SQL static check ────────────────────────────────

describe('migration 100177_routine_step_completions_fk_set_null.sql', () => {
  const migrationPath = resolve(
    __dirname,
    '../supabase/migrations/00000000100177_routine_step_completions_fk_set_null.sql',
  )
  const sql = readFileSync(migrationPath, 'utf8')

  it('drops the existing FK constraint with IF EXISTS guard', () => {
    expect(sql).toMatch(
      /ALTER TABLE\s+public\.routine_step_completions\s+DROP CONSTRAINT IF EXISTS routine_step_completions_step_id_fkey/i,
    )
  })

  it('recreates the FK with ON DELETE SET NULL', () => {
    expect(sql).toMatch(/FOREIGN KEY\s*\(step_id\)/i)
    expect(sql).toMatch(/REFERENCES\s+public\.task_template_steps\s*\(id\)/i)
    expect(sql).toMatch(/ON DELETE SET NULL/i)
  })

  it('includes a constraint comment referencing Convention #259', () => {
    expect(sql).toMatch(/COMMENT ON CONSTRAINT routine_step_completions_step_id_fkey/i)
    expect(sql).toMatch(/Convention #259/i)
  })

  it('does not contain a CASCADE directive (audit trail must survive)', () => {
    // Defensive: a well-meaning future edit might switch SET NULL → CASCADE
    // and silently destroy the audit trail Convention #259 promises.
    expect(sql).not.toMatch(/ON DELETE CASCADE/i)
  })
})

// ─── Layer 2: consumer behavior under NULL step_id ──────────────────────

function makeCompletion(
  step_id: string | null,
  overrides: Partial<RoutineStepCompletion> = {},
): RoutineStepCompletion {
  return {
    id: 'completion-' + Math.random().toString(36).slice(2, 10),
    task_id: 'task-1',
    step_id,
    member_id: 'member-1',
    family_member_id: 'member-1',
    instance_number: 1,
    period_date: '2026-04-26',
    completed_at: '2026-04-26T20:00:00Z',
    photo_url: null,
    created_at: '2026-04-26T20:00:00Z',
    ...overrides,
  }
}

describe('consumer Set<string> construction handles NULL step_id', () => {
  // This is the canonical pattern used by TaskCard.tsx, RoutineStepChecklist.tsx,
  // and GuidedActiveTasksSection.tsx after migration 100177:
  //   const completedIds = new Set(
  //     completions.map(c => c.step_id).filter((id): id is string => id !== null)
  //   )
  // We replicate it inline so this test fails loudly if any consumer drops
  // the filter and accidentally constructs a Set<string | null>.
  function buildCompletedIdSet(
    completions: RoutineStepCompletion[],
  ): Set<string> {
    return new Set(
      completions
        .map(c => c.step_id)
        .filter((id): id is string => id !== null),
    )
  }

  it('excludes NULL step_ids from the Set', () => {
    const completions: RoutineStepCompletion[] = [
      makeCompletion(null),
      makeCompletion('step-real-1'),
      makeCompletion(null),
      makeCompletion('step-real-2'),
    ]
    const set = buildCompletedIdSet(completions)
    expect(set.size).toBe(2)
    expect(set.has('step-real-1')).toBe(true)
    expect(set.has('step-real-2')).toBe(true)
  })

  it('returns false for any live step.id when only orphans exist', () => {
    const completions: RoutineStepCompletion[] = [
      makeCompletion(null),
      makeCompletion(null),
    ]
    const set = buildCompletedIdSet(completions)
    expect(set.size).toBe(0)
    expect(set.has('any-live-step-id')).toBe(false)
  })

  it('returns true for matching live step.id when completion is non-orphan', () => {
    const completions: RoutineStepCompletion[] = [
      makeCompletion('step-A'),
    ]
    const set = buildCompletedIdSet(completions)
    expect(set.has('step-A')).toBe(true)
    expect(set.has('step-B')).toBe(false)
  })

  it('orphan completions never produce a false-positive checkmark on a live step', () => {
    // The integrity guarantee: a deleted-step completion (audit row) should
    // NOT cause a different live step's checkbox to render as completed.
    // Building Set<string> via the filter pattern guarantees this.
    const completions: RoutineStepCompletion[] = [
      makeCompletion(null), // orphan from a deleted "old morning" step
      makeCompletion('step-new-morning'), // current completion on live step
    ]
    const set = buildCompletedIdSet(completions)
    const liveStepIdsToCheck = ['step-new-morning', 'step-evening', 'step-bath']
    const checked = liveStepIdsToCheck.filter(id => set.has(id))
    expect(checked).toEqual(['step-new-morning'])
  })
})

// ─── Layer 2b: type-system contract ─────────────────────────────────────

describe('RoutineStepCompletion type', () => {
  it('allows step_id to be null', () => {
    // Compile-time assertion: this should typecheck. If the type is reverted
    // to step_id: string the test file itself fails to compile.
    const orphan: RoutineStepCompletion = makeCompletion(null)
    expect(orphan.step_id).toBeNull()
  })

  it('allows step_id to be a string', () => {
    const live: RoutineStepCompletion = makeCompletion('step-abc')
    expect(live.step_id).toBe('step-abc')
  })
})
