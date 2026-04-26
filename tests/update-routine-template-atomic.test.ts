/**
 * Worker ROUTINE-SAVE-FIX (c3) — atomic routine-template rewrite RPC
 * + serialization helper.
 *
 * Two layers of verification:
 *
 * 1. Migration SQL static check — confirms the migration creates the
 *    function with SECURITY DEFINER, GRANTs EXECUTE to authenticated,
 *    enforces a family-ownership RLS check, and returns the
 *    {section_count, step_count} jsonb shape.
 *
 * 2. serializeRoutineSectionsForRpc unit tests — every frequency
 *    edge case (mwf, t_th, custom, daily/weekdays/weekly/monthly,
 *    empty), step-shape preservation (linked-step columns), and
 *    canonical day ordering for custom days.
 *
 * The full DB-behavior test (real Postgres transaction, FK behavior,
 * rollback on mid-flow failure) lives in
 * tests/verification/update-routine-template-atomic.ts and runs
 * against the linked Supabase project.
 */

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import {
  resolveFrequency,
  serializeRoutineSectionsForRpc,
} from '@/lib/templates/serializeRoutineSectionsForRpc'
import type { RoutineSection } from '@/components/tasks/RoutineSectionEditor'

// ─── Layer 1: migration SQL static check ────────────────────────────────

describe('migration 100178_update_routine_template_atomic_rpc.sql', () => {
  const migrationPath = resolve(
    __dirname,
    '../supabase/migrations/00000000100178_update_routine_template_atomic_rpc.sql',
  )
  const sql = readFileSync(migrationPath, 'utf8')

  it('creates the function with the expected signature', () => {
    expect(sql).toMatch(
      /CREATE OR REPLACE FUNCTION\s+public\.update_routine_template_atomic\s*\(\s*p_template_id\s+uuid,\s*p_title\s+text,\s*p_description\s+text,\s*p_sections\s+jsonb\s*\)/i,
    )
  })

  it('marks the function SECURITY DEFINER', () => {
    expect(sql).toMatch(/SECURITY DEFINER/)
  })

  it('pins the search_path to a safe value', () => {
    // Defensive: SECURITY DEFINER without a fixed search_path is a
    // textbook privilege-escalation surface.
    expect(sql).toMatch(/SET search_path\s*=\s*public,\s*pg_temp/i)
  })

  it('enforces a family-ownership check inside the function', () => {
    // The check uses family_members.user_id to resolve the caller's
    // family, then compares it to the template's family_id.
    expect(sql).toMatch(/family_members/)
    expect(sql).toMatch(/insufficient_privilege/)
  })

  it('GRANTs EXECUTE to authenticated', () => {
    expect(sql).toMatch(
      /GRANT EXECUTE ON FUNCTION\s+public\.update_routine_template_atomic[^;]*TO authenticated/is,
    )
  })

  it('returns a {section_count, step_count} jsonb result', () => {
    expect(sql).toMatch(/jsonb_build_object\s*\(\s*['"]section_count['"]/i)
    expect(sql).toMatch(/['"]step_count['"]/i)
  })

  it('runs DELETE + INSERT inside the function body (single transaction)', () => {
    expect(sql).toMatch(/DELETE FROM\s+public\.task_template_steps/i)
    expect(sql).toMatch(/DELETE FROM\s+public\.task_template_sections/i)
    expect(sql).toMatch(/INSERT INTO\s+public\.task_template_sections/i)
    expect(sql).toMatch(/INSERT INTO\s+public\.task_template_steps/i)
  })

  it('updates task_templates metadata as the first step', () => {
    expect(sql).toMatch(/UPDATE\s+public\.task_templates/i)
  })
})

// ─── Layer 2a: resolveFrequency unit tests ─────────────────────────────

describe('resolveFrequency', () => {
  it('expands mwf to custom + [1,3,5]', () => {
    expect(resolveFrequency({ frequency: 'mwf', customDays: [] })).toEqual({
      frequency_rule: 'custom',
      frequency_days: [1, 3, 5],
    })
  })

  it('expands t_th to custom + [2,4]', () => {
    expect(resolveFrequency({ frequency: 't_th', customDays: [] })).toEqual({
      frequency_rule: 'custom',
      frequency_days: [2, 4],
    })
  })

  it('passes through daily with frequency_days=null', () => {
    expect(resolveFrequency({ frequency: 'daily', customDays: [] })).toEqual({
      frequency_rule: 'daily',
      frequency_days: null,
    })
  })

  it('passes through weekdays with frequency_days=null', () => {
    expect(resolveFrequency({ frequency: 'weekdays', customDays: [] })).toEqual({
      frequency_rule: 'weekdays',
      frequency_days: null,
    })
  })

  it('passes through weekly with frequency_days=null', () => {
    expect(resolveFrequency({ frequency: 'weekly', customDays: [] })).toEqual({
      frequency_rule: 'weekly',
      frequency_days: null,
    })
  })

  it('passes through monthly with frequency_days=null', () => {
    expect(resolveFrequency({ frequency: 'monthly', customDays: [] })).toEqual({
      frequency_rule: 'monthly',
      frequency_days: null,
    })
  })

  it('emits sorted, unique custom days', () => {
    expect(
      resolveFrequency({ frequency: 'custom', customDays: [3, 1, 5, 1, 3] }),
    ).toEqual({
      frequency_rule: 'custom',
      frequency_days: [1, 3, 5],
    })
  })

  it('rejects out-of-range custom day values', () => {
    expect(
      resolveFrequency({ frequency: 'custom', customDays: [-1, 0, 7, 8, 3] }),
    ).toEqual({
      frequency_rule: 'custom',
      frequency_days: [0, 3],
    })
  })

  it('handles empty customDays for custom frequency (mom mid-edit)', () => {
    expect(
      resolveFrequency({ frequency: 'custom', customDays: [] }),
    ).toEqual({
      frequency_rule: 'custom',
      frequency_days: [],
    })
  })
})

// ─── Layer 2b: serializeRoutineSectionsForRpc unit tests ───────────────

function makeSection(overrides: Partial<RoutineSection> = {}): RoutineSection {
  return {
    id: 'sec-1',
    name: 'Mornings',
    frequency: 'daily',
    customDays: [],
    showUntilComplete: false,
    sort_order: 0,
    isEditing: false,
    steps: [],
    ...overrides,
  }
}

describe('serializeRoutineSectionsForRpc', () => {
  it('serializes a daily section with steps', () => {
    const sections: RoutineSection[] = [
      makeSection({
        steps: [
          {
            id: 'step-1',
            title: 'Brush teeth',
            notes: 'for two minutes',
            showNotes: true,
            instanceCount: 1,
            requirePhoto: false,
            sort_order: 0,
            step_type: 'static',
            linked_source_id: null,
            linked_source_type: null,
            display_name_override: null,
          },
        ],
      }),
    ]
    const out = serializeRoutineSectionsForRpc(sections)
    expect(out).toEqual([
      {
        title: 'Mornings',
        section_name: 'Mornings',
        frequency_rule: 'daily',
        frequency_days: null,
        show_until_complete: false,
        sort_order: 0,
        steps: [
          {
            title: 'Brush teeth',
            step_name: 'Brush teeth',
            step_notes: 'for two minutes',
            instance_count: 1,
            require_photo: false,
            sort_order: 0,
            step_type: 'static',
            linked_source_id: null,
            linked_source_type: null,
            display_name_override: null,
          },
        ],
      },
    ])
  })

  it('preserves linked-step columns verbatim', () => {
    const sections: RoutineSection[] = [
      makeSection({
        steps: [
          {
            id: 'step-1',
            title: 'Linked step',
            notes: '',
            showNotes: false,
            instanceCount: 1,
            requirePhoto: false,
            sort_order: 0,
            step_type: 'linked_sequential',
            linked_source_id: 'src-uuid',
            linked_source_type: 'sequential_collection',
            display_name_override: 'Custom name',
          },
        ],
      }),
    ]
    const out = serializeRoutineSectionsForRpc(sections)
    expect(out[0].steps[0]).toMatchObject({
      step_type: 'linked_sequential',
      linked_source_id: 'src-uuid',
      linked_source_type: 'sequential_collection',
      display_name_override: 'Custom name',
    })
  })

  it('normalizes empty step_notes to null', () => {
    const sections: RoutineSection[] = [
      makeSection({
        steps: [
          {
            id: 'step-1',
            title: 'Plain step',
            notes: '',
            showNotes: false,
            instanceCount: 1,
            requirePhoto: false,
            sort_order: 0,
            step_type: 'static',
            linked_source_id: null,
            linked_source_type: null,
            display_name_override: null,
          },
          {
            id: 'step-2',
            title: 'Whitespace-only notes',
            notes: '   ',
            showNotes: false,
            instanceCount: 1,
            requirePhoto: false,
            sort_order: 1,
            step_type: 'static',
            linked_source_id: null,
            linked_source_type: null,
            display_name_override: null,
          },
        ],
      }),
    ]
    const out = serializeRoutineSectionsForRpc(sections)
    expect(out[0].steps[0].step_notes).toBeNull()
    expect(out[0].steps[1].step_notes).toBeNull()
  })

  it('expands mwf to custom + [1,3,5] in the serialized payload', () => {
    const sections: RoutineSection[] = [makeSection({ frequency: 'mwf' })]
    const out = serializeRoutineSectionsForRpc(sections)
    expect(out[0].frequency_rule).toBe('custom')
    expect(out[0].frequency_days).toEqual([1, 3, 5])
  })

  it('expands t_th to custom + [2,4] in the serialized payload', () => {
    const sections: RoutineSection[] = [makeSection({ frequency: 't_th' })]
    const out = serializeRoutineSectionsForRpc(sections)
    expect(out[0].frequency_rule).toBe('custom')
    expect(out[0].frequency_days).toEqual([2, 4])
  })

  it('preserves section sort_order on multi-section payloads', () => {
    const sections: RoutineSection[] = [
      makeSection({ id: 'a', name: 'Mornings', sort_order: 0 }),
      makeSection({ id: 'b', name: 'Afternoons', sort_order: 1 }),
      makeSection({ id: 'c', name: 'Evenings', sort_order: 2 }),
    ]
    const out = serializeRoutineSectionsForRpc(sections)
    expect(out.map(s => s.section_name)).toEqual(['Mornings', 'Afternoons', 'Evenings'])
    expect(out.map(s => s.sort_order)).toEqual([0, 1, 2])
  })

  it('handles empty sections array', () => {
    expect(serializeRoutineSectionsForRpc([])).toEqual([])
  })
})
