/**
 * Shared task creation utility used by TasksPage, MomShell, AdultShell, and IndependentShell.
 * Canonical implementation from Tasks.tsx — includes opportunity fields, routine section
 * persistence, and queue item processing that shell callers previously dropped.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { CreateTaskData } from '@/components/tasks/TaskCreationModal'
import { buildTaskScheduleFields } from '@/utils/buildTaskScheduleFields'

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
    // Opportunity-specific fields
    ...(data.taskType === 'opportunity' && {
      max_completions: data.maxCompletions ? parseInt(data.maxCompletions, 10) : null,
      claim_lock_duration: data.claimLockDuration ? parseInt(data.claimLockDuration, 10) : null,
      claim_lock_unit: data.claimLockUnit || null,
    }),
  }

  // Determine who gets the task
  const assignees: AssigneeLike[] = data.wholeFamily
    ? familyMembers.filter(m => m.is_active)
    : data.assignments ?? []
  const mode = data.assignMode ?? 'each'

  if (assignees.length >= 2 && mode === 'each') {
    // "Each of them" — individual copies per person
    const inserts = assignees.map(a => ({
      ...taskBase,
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
    // "Any of them" (shared) or single assignee
    const primaryId = assignees.length > 0 ? resolveAssigneeId(assignees[0]) : null

    const { data: newTask, error } = await supabase.from('tasks').insert({
      ...taskBase,
      assignee_id: primaryId,
      is_shared: assignees.length >= 2,
    }).select().single()

    if (error) {
      console.error('Failed to create task:', error)
      return result
    }

    result.taskIds = [newTask.id]

    // Create task_assignments for all assignees on shared task
    if (newTask && assignees.length > 0) {
      const assignments = assignees.map(a => {
        const mid = resolveAssigneeId(a)
        return {
          task_id: newTask.id,
          member_id: mid,
          family_member_id: mid,
          assigned_by: creatorId,
        }
      })
      const { error: assignError } = await supabase.from('task_assignments').insert(assignments)
      if (assignError) {
        console.error('Failed to create task assignments:', assignError)
      }
    }
  }

  // Persist routine sections if this is a routine
  if (data.taskType === 'routine' && data.routineSections && data.routineSections.length > 0) {
    const { data: template, error: tmplError } = await supabase
      .from('task_templates')
      .insert({
        family_id: familyId,
        created_by: creatorId,
        title: data.title,
        description: data.description || null,
        task_type: 'routine',
        template_type: 'routine',
      })
      .select('id')
      .single()

    if (!tmplError && template) {
      result.routineTemplateCreated = true
      for (const section of data.routineSections) {
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
          const stepInserts = section.steps.map(step => ({
            section_id: sectionRow.id,
            title: step.title,
            step_name: step.title,
            step_notes: step.notes || null,
            instance_count: step.instanceCount,
            require_photo: step.requirePhoto,
            sort_order: step.sort_order,
          }))
          if (stepInserts.length > 0) {
            const { error: stepError } = await supabase.from('task_template_steps').insert(stepInserts)
            if (stepError) console.error('Failed to insert routine steps:', stepError)
          }
        } else if (secError) {
          console.error('Failed to insert routine section:', secError)
        }
      }
    } else if (tmplError) {
      console.error('Failed to create routine template:', tmplError)
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
