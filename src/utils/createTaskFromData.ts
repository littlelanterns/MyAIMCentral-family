/**
 * Shared task creation utility used by TasksPage, MomShell, AdultShell, and IndependentShell.
 * Canonical implementation from Tasks.tsx — includes opportunity fields, routine section
 * persistence, and queue item processing that shell callers previously dropped.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { CreateTaskData } from '@/components/tasks/TaskCreationModal'
import { buildTaskScheduleFields } from '@/utils/buildTaskScheduleFields'
import { todayLocalIso } from '@/utils/dates'

interface FamilyMemberLike {
  id: string
  is_active: boolean
}

interface AssigneeLike {
  id?: string
  memberId?: string
}

function resolveAssigneeId(a: AssigneeLike): string {
  return ('memberId' in a && a.memberId) ? a.memberId : a.id!
}

export interface CreateTaskResult {
  /** IDs of tasks created (one per "each" assignee, or one shared task) */
  taskIds: string[]
  /** Whether a routine template was persisted */
  routineTemplateCreated: boolean
  /** ID of the routine template if one was created */
  templateId?: string
  /** Whether a queue item was marked processed */
  queueItemProcessed: boolean
}

/**
 * Creates task(s) from TaskCreationModal data, handling:
 * - Any/Each assignment modes
 * - Opportunity-specific fields (max_completions, claim_lock_duration, claim_lock_unit)
 * - Routine section persistence (template + sections + steps)
 * - Queue item processing (sourceQueueItemId)
 *
 * Callers are responsible for query invalidation and UI state (closing modals, etc.).
 */
export async function createTaskFromData(
  supabase: SupabaseClient,
  data: CreateTaskData,
  familyId: string,
  creatorId: string,
  familyMembers: FamilyMemberLike[],
): Promise<CreateTaskResult> {
  // PRD-09A/09B Studio Intelligence Phase 1 guard.
  // Sequential collections have their own creation path: SequentialCreatorModal →
  // useCreateSequentialCollection. If we get here with taskType='sequential',
  // something is wiring the wrong flow. Throwing loudly prevents silent creation of
  // broken single-row "sequential" tasks with no parent collection or child items.
  if ((data.taskType as string) === 'sequential') {
    throw new Error(
      "createTaskFromData: sequential collections must be created via " +
      "useCreateSequentialCollection / SequentialCreatorModal, not through " +
      "TaskCreationModal. This is a bug — check the caller.",
    )
  }

  const result: CreateTaskResult = { taskIds: [], routineTemplateCreated: false, queueItemProcessed: false }

  const scheduleFields = buildTaskScheduleFields(data)

  const taskBase = {
    family_id: familyId,
    created_by: creatorId,
    title: data.title,
    description: data.description || null,
    task_type: data.taskType === 'opportunity'
      ? `opportunity_${data.opportunitySubType ?? 'repeatable'}`
      : data.taskType,
    status: 'pending',
    due_date: scheduleFields.due_date,
    recurrence_rule: scheduleFields.recurrence_rule,
    recurrence_details: scheduleFields.recurrence_details,
    life_area_tag: data.lifeAreaTag || null,
    duration_estimate: data.durationEstimate || null,
    incomplete_action: data.incompleteAction,
    require_approval: data.reward?.requireApproval ?? false,
    victory_flagged: data.reward?.flagAsVictory ?? false,
    source: data.source ?? 'manual',
    source_reference_id: data.sourceReferenceId ?? null,
    // Build M Sub-phase B: paper-craft icon for Play tile rendering.
    // Written only when mom picked one (or auto-match assigned at save time).
    // NULL for non-Play tasks — handled by the migration default.
    icon_asset_key: data.iconAssetKey ?? null,
    icon_variant: data.iconVariant ?? null,
    // PRD-28: task-level tracking flags
    counts_for_allowance: data.countsForAllowance ?? false,
    counts_for_homework: data.countsForHomework ?? false,
    counts_for_gamification: data.countsForGamification ?? true,
    allowance_points: data.allowancePoints ?? null,
    // Opportunity-specific fields
    ...(data.taskType === 'opportunity' && {
      max_completions: data.maxCompletions ? parseInt(data.maxCompletions, 10) : null,
      claim_lock_duration: data.claimLockDuration ? parseInt(data.claimLockDuration, 10) : null,
      claim_lock_unit: data.claimLockUnit || null,
    }),
  }

  // ── Step 1: Create routine template FIRST (so template_id can be set on task rows) ──
  const hasSections = data.taskType === 'routine' && data.routineSections && data.routineSections.length > 0
  let routineTemplateId: string | null = null

  if (hasSections) {
    const { data: template, error: tmplError } = await supabase
      .from('task_templates')
      .insert({
        family_id: familyId,
        created_by: creatorId,
        title: data.title,
        template_name: data.title,
        description: data.description || null,
        task_type: 'routine',
        template_type: 'routine',
      })
      .select('id')
      .single()

    if (tmplError) {
      console.error('[createTaskFromData] Failed to create routine template:', tmplError)
    }

    if (!tmplError && template) {
      result.routineTemplateCreated = true
      result.templateId = template.id
      routineTemplateId = template.id
      for (const section of data.routineSections!) {
        let frequencyRule = section.frequency
        let frequencyDays: number[] | null = null
        if (section.frequency === 'custom') {
          frequencyDays = section.customDays
        } else if (section.frequency === 'mwf') {
          frequencyRule = 'custom'
          frequencyDays = [1, 3, 5]
        } else if (section.frequency === 't_th') {
          frequencyRule = 'custom'
          frequencyDays = [2, 4]
        }

        const { data: sectionRow, error: secError } = await supabase
          .from('task_template_sections')
          .insert({
            template_id: template.id,
            title: section.name,
            section_name: section.name,
            frequency_rule: frequencyRule,
            frequency_days: frequencyDays,
            show_until_complete: section.showUntilComplete,
            sort_order: section.sort_order,
          })
          .select('id')
          .single()

        if (!secError && sectionRow) {
          // Build J: persist linked-step columns when step_type !== 'static'.
          // Back-compat: steps without a step_type default to 'static' at the
          // DB level, so legacy callers don't need to change.
          type StepWithLinkedFields = typeof section.steps[number] & {
            step_type?: 'static' | 'linked_sequential' | 'linked_randomizer' | 'linked_task'
            linked_source_id?: string | null
            linked_source_type?: 'sequential_collection' | 'randomizer_list' | 'recurring_task' | null
            display_name_override?: string | null
          }
          const stepInserts = section.steps.map(step => {
            const s = step as StepWithLinkedFields
            return {
              section_id: sectionRow.id,
              title: step.title,
              step_name: step.title,
              step_notes: step.notes || null,
              instance_count: step.instanceCount,
              require_photo: step.requirePhoto,
              sort_order: step.sort_order,
              step_type: s.step_type ?? 'static',
              linked_source_id: s.linked_source_id ?? null,
              linked_source_type: s.linked_source_type ?? null,
              display_name_override: s.display_name_override ?? null,
            }
          })
          if (stepInserts.length > 0) {
            const { error: stepError } = await supabase.from('task_template_steps').insert(stepInserts)
            if (stepError) console.error('Failed to insert routine steps:', stepError)
          }
        } else if (secError) {
          console.error('Failed to insert routine section:', secError)
        }
      }
    }
  } else if (data.taskType === 'routine') {
    console.warn('[createTaskFromData] Routine has no sections — skipping template creation.')
  }

  // ── Step 2: Create task row(s) with template_id (skip if templateOnly) ──
  if (!(data.templateOnly && data.taskType === 'routine')) {
    // Add template_id to the task if we created one
    const taskInsertBase = {
      ...taskBase,
      ...(routineTemplateId ? { template_id: routineTemplateId } : {}),
    }

    const assignees: AssigneeLike[] = data.wholeFamily
      ? familyMembers.filter(m => m.is_active)
      : data.assignments ?? []
    const mode = data.assignMode ?? 'each'

    if (assignees.length >= 2 && mode === 'each') {
      const inserts = assignees.map(a => ({
        ...taskInsertBase,
        assignee_id: resolveAssigneeId(a),
        is_shared: false,
      }))
      const { data: rows, error } = await supabase.from('tasks').insert(inserts).select('id')
      if (error) {
        console.error('Failed to create tasks:', error)
        return result
      }
      result.taskIds = (rows ?? []).map(r => r.id)
    } else {
      const primaryId = assignees.length > 0 ? resolveAssigneeId(assignees[0]) : null

      const { data: newTask, error } = await supabase.from('tasks').insert({
        ...taskInsertBase,
        assignee_id: primaryId,
        is_shared: assignees.length >= 2,
      }).select().single()

      if (error) {
        console.error('Failed to create task:', error)
        return result
      }

      result.taskIds = [newTask.id]

      if (newTask && assignees.length > 0) {
        const isRotation = data.rotationEnabled && assignees.length >= 2
        const assignments = assignees.map((a, idx) => {
          const mid = resolveAssigneeId(a)
          return {
            task_id: newTask.id,
            member_id: mid,
            family_member_id: mid,
            assigned_by: creatorId,
            ...(isRotation ? {
              rotation_position: idx,
              is_active: idx === 0,
            } : {}),
          }
        })
        const { error: assignError } = await supabase.from('task_assignments').insert(assignments)
        if (assignError) console.error('Failed to create task assignments:', assignError)

        if (isRotation) {
          const memberIds = assignees.map(a => resolveAssigneeId(a))
          const existingDetails = (newTask.recurrence_details as Record<string, unknown>) ?? {}
          const { error: rotErr } = await supabase.from('tasks').update({
            recurrence_details: {
              ...existingDetails,
              rotation: {
                enabled: true,
                frequency: data.rotationFrequency ?? 'weekly',
                members: memberIds,
                current_index: 0,
                last_rotated_at: todayLocalIso(),
              },
            },
          }).eq('id', newTask.id)
          if (rotErr) console.error('Failed to write rotation config:', rotErr)
        }
      }
    }
  }

  // Create Task Breaker subtasks as child tasks linked via parent_task_id
  if (data.taskBreakerSubtasks && data.taskBreakerSubtasks.length > 0 && result.taskIds.length > 0) {
    const parentTaskId = result.taskIds[0]

    // Build list of valid family member IDs for FK safety
    const validMemberIds = new Set(familyMembers.map(m => m.id))

    const subtaskInserts = data.taskBreakerSubtasks.map((st, idx) => ({
      family_id: familyId,
      created_by: creatorId,
      title: st.title,
      description: st.description || null,
      task_type: 'task' as const,
      status: 'pending' as const,
      parent_task_id: parentTaskId,
      task_breaker_level: data.taskBreakerLevel || null,
      // Only set assignee_id if it's a valid family member (FK safety)
      assignee_id: st.suggestedAssigneeId && validMemberIds.has(st.suggestedAssigneeId)
        ? st.suggestedAssigneeId
        : null,
      sort_order: st.sortOrder ?? idx + 1,
      source: 'manual' as const,
      life_area_tag: taskBase.life_area_tag,
    }))

    const { error: subtaskError } = await supabase.from('tasks').insert(subtaskInserts)
    if (subtaskError) {
      console.error('Failed to create Task Breaker subtasks:', subtaskError)
    }
  }

  // Mark queue item as processed if creating from queue
  if (data.sourceQueueItemId) {
    await supabase
      .from('studio_queue')
      .update({ processed_at: new Date().toISOString() })
      .eq('id', data.sourceQueueItemId)
    result.queueItemProcessed = true
  }

  return result
}
