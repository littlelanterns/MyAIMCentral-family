/**
 * Worker ROUTINE-PROPAGATION (c4) — cloneRoutineTemplate utility.
 *
 * Verifies the deep-clone is fully independent (mutations on the new
 * template never affect the source) and that linked-step resolutions
 * are honored when present, default-shared when absent.
 *
 * Uses a fixture-driven mock supabase that records every insert by
 * table so we can assert exact write shapes.
 */

import { describe, it, expect } from 'vitest'
import {
  cloneRoutineTemplate,
  type LinkedStepResolution,
} from '@/lib/templates/cloneRoutineTemplate'

// ─── Fixture builder ───────────────────────────────────────────

interface SourceSection {
  id: string
  title: string
  section_name: string
  frequency_rule: string | null
  frequency_days: number[] | null
  show_until_complete: boolean
  sort_order: number
}

interface SourceStep {
  id: string
  section_id: string
  title: string
  step_name: string | null
  step_notes: string | null
  instance_count: number | null
  require_photo: boolean | null
  sort_order: number
  step_type: string | null
  linked_source_id: string | null
  linked_source_type: string | null
  display_name_override: string | null
}

interface MockState {
  sections: SourceSection[]
  steps: SourceStep[]
  /** Inserts captured for assertions */
  inserts: {
    task_templates: Array<Record<string, unknown>>
    task_template_sections: Array<Record<string, unknown>>
    task_template_steps: Array<Record<string, unknown>>
  }
}

let nextId = 0
function generatedId(): string {
  nextId += 1
  return `gen-${nextId}`
}

function makeMockSupabase(state: MockState) {
  // Section query: select(...).eq('template_id', X).order(...)
  const sectionSelectQuery = {
    eq: (_col: string, _id: string) => sectionSelectQuery,
    order: () => Promise.resolve({ data: state.sections, error: null }),
  }
  // Steps query: select(...).in('section_id', [...]).order(...)
  const stepSelectQuery = {
    in: (_col: string, ids: string[]) => ({
      order: () =>
        Promise.resolve({
          data: state.steps.filter(s => ids.includes(s.section_id)),
          error: null,
        }),
    }),
  }
  // task_template_sections SELECT chain (different from steps chain)
  const sectionsSelectThenable = {
    select: () => sectionSelectQuery,
    insert: (row: Record<string, unknown>) => ({
      select: () => ({
        single: () => {
          const id = generatedId()
          state.inserts.task_template_sections.push({ ...row, id })
          return Promise.resolve({ data: { id }, error: null })
        },
      }),
    }),
  }
  const stepsSelectThenable = {
    select: () => stepSelectQuery,
    insert: (rows: Record<string, unknown>[]) => {
      state.inserts.task_template_steps.push(...rows)
      return Promise.resolve({ data: null, error: null })
    },
  }
  const templatesThenable = {
    insert: (row: Record<string, unknown>) => ({
      select: () => ({
        single: () => {
          const id = generatedId()
          state.inserts.task_templates.push({ ...row, id })
          return Promise.resolve({ data: { id }, error: null })
        },
      }),
    }),
  }

  return {
    from: (table: string) => {
      if (table === 'task_templates') return templatesThenable
      if (table === 'task_template_sections') return sectionsSelectThenable
      if (table === 'task_template_steps') return stepsSelectThenable
      throw new Error(`Unexpected table: ${table}`)
    },
  }
}

function makeFixture(): MockState {
  return {
    sections: [
      {
        id: 'sec-1',
        title: 'Morning',
        section_name: 'Morning',
        frequency_rule: 'daily',
        frequency_days: null,
        show_until_complete: false,
        sort_order: 0,
      },
      {
        id: 'sec-2',
        title: 'Evening',
        section_name: 'Evening',
        frequency_rule: 'custom',
        frequency_days: [1, 3, 5],
        show_until_complete: true,
        sort_order: 1,
      },
    ],
    steps: [
      {
        id: 'step-1',
        section_id: 'sec-1',
        title: 'Brush teeth',
        step_name: 'Brush teeth',
        step_notes: 'Two minutes',
        instance_count: 1,
        require_photo: false,
        sort_order: 0,
        step_type: 'static',
        linked_source_id: null,
        linked_source_type: null,
        display_name_override: null,
      },
      {
        id: 'step-2',
        section_id: 'sec-1',
        title: 'Reading time',
        step_name: 'Reading time',
        step_notes: null,
        instance_count: 1,
        require_photo: false,
        sort_order: 1,
        step_type: 'linked_sequential',
        linked_source_id: 'seq-source-1',
        linked_source_type: 'sequential_collection',
        display_name_override: 'Math chapter',
      },
      {
        id: 'step-3',
        section_id: 'sec-2',
        title: 'Floss',
        step_name: 'Floss',
        step_notes: null,
        instance_count: 1,
        require_photo: false,
        sort_order: 0,
        step_type: 'static',
        linked_source_id: null,
        linked_source_type: null,
        display_name_override: null,
      },
    ],
    inserts: {
      task_templates: [],
      task_template_sections: [],
      task_template_steps: [],
    },
  }
}

// ─── Tests ─────────────────────────────────────────────────────

describe('cloneRoutineTemplate', () => {
  it('inserts a new template row with the given title', async () => {
    nextId = 0
    const state = makeFixture()
    const supabase = makeMockSupabase(state)
    await cloneRoutineTemplate(supabase as never, {
      sourceTemplateId: 'src-1',
      newTitle: 'Bathroom routine for Mosiah',
      familyId: 'fam-1',
      createdBy: 'mem-1',
    })
    expect(state.inserts.task_templates).toHaveLength(1)
    expect(state.inserts.task_templates[0]).toMatchObject({
      family_id: 'fam-1',
      created_by: 'mem-1',
      title: 'Bathroom routine for Mosiah',
      template_name: 'Bathroom routine for Mosiah',
      task_type: 'routine',
      template_type: 'routine',
      is_system: false,
    })
  })

  it('clones every section preserving frequency + show_until_complete', async () => {
    nextId = 0
    const state = makeFixture()
    const supabase = makeMockSupabase(state)
    await cloneRoutineTemplate(supabase as never, {
      sourceTemplateId: 'src-1',
      newTitle: 'copy',
      familyId: 'fam-1',
      createdBy: 'mem-1',
    })
    expect(state.inserts.task_template_sections).toHaveLength(2)
    expect(state.inserts.task_template_sections[0]).toMatchObject({
      title: 'Morning',
      frequency_rule: 'daily',
      show_until_complete: false,
    })
    expect(state.inserts.task_template_sections[1]).toMatchObject({
      title: 'Evening',
      frequency_rule: 'custom',
      frequency_days: [1, 3, 5],
      show_until_complete: true,
    })
  })

  it('clones every step preserving linked-source fields by default', async () => {
    nextId = 0
    const state = makeFixture()
    const supabase = makeMockSupabase(state)
    await cloneRoutineTemplate(supabase as never, {
      sourceTemplateId: 'src-1',
      newTitle: 'copy',
      familyId: 'fam-1',
      createdBy: 'mem-1',
    })
    expect(state.inserts.task_template_steps).toHaveLength(3)
    // Static step preserved
    expect(state.inserts.task_template_steps[0]).toMatchObject({
      title: 'Brush teeth',
      step_type: 'static',
      linked_source_id: null,
    })
    // Linked step preserves the same source by default (shared progress)
    expect(state.inserts.task_template_steps[1]).toMatchObject({
      title: 'Reading time',
      step_type: 'linked_sequential',
      linked_source_id: 'seq-source-1',
      linked_source_type: 'sequential_collection',
      display_name_override: 'Math chapter',
    })
  })

  it('honors linkedStepResolutions to remap specific steps', async () => {
    nextId = 0
    const state = makeFixture()
    const supabase = makeMockSupabase(state)
    const resolutions: LinkedStepResolution[] = [
      {
        sourceStepId: 'step-2',
        resolvedSourceId: 'seq-source-2',
        resolvedSourceType: 'sequential_collection',
        resolvedSourceName: 'Mosiah math chapter',
      },
    ]
    await cloneRoutineTemplate(supabase as never, {
      sourceTemplateId: 'src-1',
      newTitle: 'copy',
      familyId: 'fam-1',
      createdBy: 'mem-1',
      linkedStepResolutions: resolutions,
    })
    expect(state.inserts.task_template_steps[1]).toMatchObject({
      linked_source_id: 'seq-source-2',
      linked_source_type: 'sequential_collection',
      display_name_override: 'Mosiah math chapter',
    })
    // Static step (step-1) is NOT remapped — resolutions only apply to
    // their matching sourceStepId.
    expect(state.inserts.task_template_steps[0].linked_source_id).toBeNull()
  })

  it('returns sectionCount + stepCount for caller toasts', async () => {
    nextId = 0
    const state = makeFixture()
    const supabase = makeMockSupabase(state)
    const result = await cloneRoutineTemplate(supabase as never, {
      sourceTemplateId: 'src-1',
      newTitle: 'copy',
      familyId: 'fam-1',
      createdBy: 'mem-1',
    })
    expect(result.sectionCount).toBe(2)
    expect(result.stepCount).toBe(3)
    expect(result.newTemplateId).toBeTruthy()
  })

  it('handles a template with no sections (empty result)', async () => {
    nextId = 0
    const state: MockState = {
      sections: [],
      steps: [],
      inserts: {
        task_templates: [],
        task_template_sections: [],
        task_template_steps: [],
      },
    }
    const supabase = makeMockSupabase(state)
    const result = await cloneRoutineTemplate(supabase as never, {
      sourceTemplateId: 'src-empty',
      newTitle: 'copy',
      familyId: 'fam-1',
      createdBy: 'mem-1',
    })
    expect(result.sectionCount).toBe(0)
    expect(result.stepCount).toBe(0)
    // Template row still gets created so mom can edit/add sections later.
    expect(state.inserts.task_templates).toHaveLength(1)
  })

  it('clone independence — inserted rows reference NEW section ids, not source ids', async () => {
    // Prove deep independence: every cloned step's section_id must
    // come from the new section insert, NOT match source step.section_id.
    nextId = 0
    const state = makeFixture()
    const supabase = makeMockSupabase(state)
    await cloneRoutineTemplate(supabase as never, {
      sourceTemplateId: 'src-1',
      newTitle: 'copy',
      familyId: 'fam-1',
      createdBy: 'mem-1',
    })
    const newSectionIds = new Set(
      state.inserts.task_template_sections.map(r => r.id),
    )
    for (const step of state.inserts.task_template_steps) {
      expect(newSectionIds.has(step.section_id as string)).toBe(true)
      // And NOT a source section id
      expect(['sec-1', 'sec-2']).not.toContain(step.section_id)
    }
  })
})
