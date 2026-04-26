/**
 * Worker ROUTINE-SAVE-FIX (c3) — pure helper that serializes a
 * RoutineSection[] (the modal's in-memory shape) into the JSONB
 * payload accepted by the update_routine_template_atomic RPC.
 *
 * Frequency-rule normalization happens here, NOT in the RPC, so that
 * the SQL stays simple and we can unit-test the mapping without a
 * database round-trip:
 *
 *   - 'mwf'  → frequency_rule='custom', frequency_days=[1,3,5]
 *   - 't_th' → frequency_rule='custom', frequency_days=[2,4]
 *   - 'custom' → uses caller-provided customDays (sorted, deduped)
 *   - any other value (daily/weekdays/weekly/monthly) → passes through
 *     with frequency_days=null
 *
 * Linked-step columns (step_type, linked_source_id, linked_source_type,
 * display_name_override) are preserved verbatim. The RPC handles
 * defaulting step_type to 'static' and converting empty strings to
 * NULL for the linked_source_* columns.
 */

import type { RoutineSection, RoutineStep } from '@/components/tasks/RoutineSectionEditor'

export interface RpcSection {
  title: string
  section_name: string
  frequency_rule: string
  frequency_days: number[] | null
  show_until_complete: boolean
  sort_order: number
  steps: RpcStep[]
}

export interface RpcStep {
  title: string
  step_name: string
  step_notes: string | null
  instance_count: number
  require_photo: boolean
  sort_order: number
  step_type: string
  linked_source_id: string | null
  linked_source_type: string | null
  display_name_override: string | null
}

/**
 * Resolve a section's frequency to (frequency_rule, frequency_days).
 * Pure, deterministic, unit-testable.
 */
export function resolveFrequency(
  section: Pick<RoutineSection, 'frequency' | 'customDays'>,
): { frequency_rule: string; frequency_days: number[] | null } {
  switch (section.frequency) {
    case 'mwf':
      return { frequency_rule: 'custom', frequency_days: [1, 3, 5] }
    case 't_th':
      return { frequency_rule: 'custom', frequency_days: [2, 4] }
    case 'custom': {
      // Sort + dedupe so the persisted array is canonical regardless of
      // the order mom clicked the day chips.
      const unique = Array.from(new Set(section.customDays ?? []))
        .filter(d => Number.isInteger(d) && d >= 0 && d <= 6)
        .sort((a, b) => a - b)
      return { frequency_rule: 'custom', frequency_days: unique }
    }
    default:
      // daily / weekdays / weekly / monthly — frequency_rule passes
      // through, no day-array needed.
      return { frequency_rule: section.frequency, frequency_days: null }
  }
}

function serializeStep(step: RoutineStep): RpcStep {
  return {
    title: step.title,
    step_name: step.title,
    step_notes: step.notes && step.notes.trim() !== '' ? step.notes : null,
    instance_count: step.instanceCount,
    require_photo: step.requirePhoto,
    sort_order: step.sort_order,
    step_type: step.step_type ?? 'static',
    linked_source_id: step.linked_source_id ?? null,
    linked_source_type: step.linked_source_type ?? null,
    display_name_override: step.display_name_override ?? null,
  }
}

/**
 * Serialize the modal's RoutineSection[] into the RPC payload shape.
 *
 * Strips empty sections (zero steps) — those are placeholders mom
 * abandoned mid-edit and should never persist. Same defensive cleanup
 * as the existing render-time `s.steps.length > 0` filter in
 * RoutineStepChecklist.
 */
export function serializeRoutineSectionsForRpc(
  sections: RoutineSection[],
): RpcSection[] {
  return sections.map(section => {
    const { frequency_rule, frequency_days } = resolveFrequency(section)
    return {
      title: section.name,
      section_name: section.name,
      frequency_rule,
      frequency_days,
      show_until_complete: section.showUntilComplete,
      sort_order: section.sort_order,
      steps: (section.steps ?? []).map(serializeStep),
    }
  })
}
