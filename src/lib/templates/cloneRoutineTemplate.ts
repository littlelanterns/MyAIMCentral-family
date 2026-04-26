/**
 * Worker ROUTINE-PROPAGATION (c4, founder D4) — clone a routine
 * template (deep copy of template + sections + steps).
 *
 * Lives under src/lib/templates/ (D6 Thread 1) so future Worker 2
 * SHARED-ROUTINES, Worker 3 SHARED-LISTS, and any future template-
 * deploy worker can share the same primitive.
 *
 * Pure deep-clone — does NOT insert a tasks row, does NOT pick an
 * assignee. The independent duplicate flow (RoutineDuplicateTemplateDialog
 * via the chooser) uses this directly. The clone-and-deploy flow
 * (RoutineDuplicateDialog) calls this and then inserts a tasks row.
 *
 * Linked-step semantics: by default, linked_source_id / _type /
 * display_name_override are copied as-is so the duplicate shares
 * source content with the original. Callers that need to re-resolve
 * specific linked steps to different sources (e.g. Mosiah's bathroom
 * routine pointing at his bedroom randomizer instead of his sister's)
 * pass a linkedStepResolutions map.
 */

import type { SupabaseClient } from '@supabase/supabase-js'

export type LinkedSourceType =
  | 'sequential_collection'
  | 'randomizer_list'
  | 'recurring_task'

export interface LinkedStepResolution {
  /** The original step id (in the source template) */
  sourceStepId: string
  /** The replacement source id */
  resolvedSourceId: string
  /** The replacement source type */
  resolvedSourceType: LinkedSourceType
  /** The replacement source display name */
  resolvedSourceName: string
}

export interface CloneRoutineTemplateInput {
  sourceTemplateId: string
  newTitle: string
  familyId: string
  createdBy: string
  /**
   * Optional per-step linked-source remappings. When omitted, every
   * linked step in the source is copied with the same linked_source_id
   * (children share progress on shared sources). When present, matching
   * sourceStepId entries are remapped to the resolved source.
   */
  linkedStepResolutions?: LinkedStepResolution[]
}

export interface CloneRoutineTemplateResult {
  newTemplateId: string
  sectionCount: number
  stepCount: number
}

interface SourceSectionRow {
  id: string
  title: string | null
  section_name: string | null
  frequency_rule: string | null
  frequency_days: number[] | null
  show_until_complete: boolean | null
  sort_order: number
}

interface SourceStepRow {
  id: string
  section_id: string
  title: string | null
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

/**
 * Deep-clones a routine template. Returns the new template id.
 *
 * Throws on any DB error (caller is responsible for surfacing the
 * error to the user — the existing RoutineDuplicateDialog and the
 * new chooser-based flows both render an error banner above the
 * action buttons).
 */
export async function cloneRoutineTemplate(
  supabase: SupabaseClient,
  input: CloneRoutineTemplateInput,
): Promise<CloneRoutineTemplateResult> {
  const {
    sourceTemplateId,
    newTitle,
    familyId,
    createdBy,
    linkedStepResolutions,
  } = input

  // 1. Fetch source sections + steps in two round-trips.
  const { data: sourceSections, error: secError } = await supabase
    .from('task_template_sections')
    .select(
      'id, title, section_name, frequency_rule, frequency_days, show_until_complete, sort_order',
    )
    .eq('template_id', sourceTemplateId)
    .order('sort_order', { ascending: true })

  if (secError) throw secError

  const sectionIds = (sourceSections ?? []).map(s => s.id)
  let sourceSteps: SourceStepRow[] = []
  if (sectionIds.length > 0) {
    const { data: stepsData, error: stepError } = await supabase
      .from('task_template_steps')
      .select(
        'id, section_id, title, step_name, step_notes, instance_count, require_photo, sort_order, step_type, linked_source_id, linked_source_type, display_name_override',
      )
      .in('section_id', sectionIds)
      .order('sort_order', { ascending: true })
    if (stepError) throw stepError
    sourceSteps = (stepsData ?? []) as SourceStepRow[]
  }

  // 2. Insert the new template row.
  const { data: newTemplate, error: tplError } = await supabase
    .from('task_templates')
    .insert({
      family_id: familyId,
      created_by: createdBy,
      title: newTitle,
      template_name: newTitle,
      task_type: 'routine',
      template_type: 'routine',
      is_system: false,
    })
    .select('id')
    .single()

  if (tplError) throw tplError
  if (!newTemplate?.id) {
    throw new Error('cloneRoutineTemplate: insert returned no id')
  }
  const newTemplateId = newTemplate.id as string

  // Build a resolution map keyed by source step id for O(1) lookup.
  const resolutionByStepId = new Map<string, LinkedStepResolution>()
  for (const r of linkedStepResolutions ?? []) {
    resolutionByStepId.set(r.sourceStepId, r)
  }

  // 3. Clone each section and its steps in order.
  let totalSteps = 0
  for (const section of (sourceSections ?? []) as SourceSectionRow[]) {
    const { data: newSection, error: newSecError } = await supabase
      .from('task_template_sections')
      .insert({
        template_id: newTemplateId,
        title: section.title,
        section_name: section.section_name ?? section.title,
        frequency_rule: section.frequency_rule,
        frequency_days: section.frequency_days,
        show_until_complete: section.show_until_complete ?? false,
        sort_order: section.sort_order,
      })
      .select('id')
      .single()

    if (newSecError) throw newSecError
    if (!newSection?.id) continue

    const stepsForSection = sourceSteps.filter(s => s.section_id === section.id)
    if (stepsForSection.length === 0) continue

    const stepInserts = stepsForSection.map(step => {
      const resolution = resolutionByStepId.get(step.id)
      return {
        section_id: newSection.id as string,
        title: step.title,
        step_name: step.step_name ?? step.title,
        step_notes: step.step_notes,
        instance_count: step.instance_count ?? 1,
        require_photo: step.require_photo ?? false,
        sort_order: step.sort_order,
        step_type: step.step_type ?? 'static',
        linked_source_id: resolution
          ? resolution.resolvedSourceId
          : step.linked_source_id,
        linked_source_type: resolution
          ? resolution.resolvedSourceType
          : step.linked_source_type,
        display_name_override: resolution
          ? resolution.resolvedSourceName
          : step.display_name_override,
      }
    })

    const { error: stepInsErr } = await supabase
      .from('task_template_steps')
      .insert(stepInserts)
    if (stepInsErr) throw stepInsErr
    totalSteps += stepInserts.length
  }

  return {
    newTemplateId,
    sectionCount: (sourceSections ?? []).length,
    stepCount: totalSteps,
  }
}
