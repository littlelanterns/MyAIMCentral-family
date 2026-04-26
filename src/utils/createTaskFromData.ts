/**
 * Shared task creation utility used by TasksPage, MomShell, AdultShell, and IndependentShell.
 * Canonical implementation from Tasks.tsx — includes opportunity fields, routine section
 * persistence, and queue item processing that shell callers previously dropped.
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { CreateTaskData } from '@/components/tasks/TaskCreationModal'
import { buildTaskScheduleFields } from '@/utils/buildTaskScheduleFields'
import { fetchFamilyToday } from '@/hooks/useFamilyToday'
import { serializeRoutineSectionsForRpc } from '@/lib/templates/serializeRoutineSectionsForRpc'

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

  // Row 184 NEW-DD Path 2: derive family-local "today" server-side so scheduled
  // DATE writes (due_date, rotation last_rotated_at) don't depend on the
  // clicking device's clock.
  const familyToday = await fetchFamilyToday(creatorId)

  const scheduleFields = buildTaskScheduleFields(data, familyToday)

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
    homework_subject_ids: (data.homeworkSubjectIds?.length ?? 0) > 0 ? data.homeworkSubjectIds : [],
    // PRD-28 NEW-EE: extra credit. Gated at the UI layer — extra_credit without
    // allowance participation is meaningless, but we still write the raw value
    // here so edits don't need dependent-field logic at this layer.
    is_extra_credit: data.isExtraCredit ?? false,
    // Opportunity-specific fields
    ...(data.taskType === 'opportunity' && {
      max_completions: data.maxCompletions ? parseInt(data.maxCompletions, 10) : null,
      claim_lock_duration: data.claimLockDuration ? parseInt(data.claimLockDuration, 10) : null,
      claim_lock_unit: data.claimLockUnit || null,
    }),
  }

  // ── Step 1: Create or update routine template FIRST (so template_id can be set on task rows) ──
  const hasSections = data.taskType === 'routine' && data.routineSections && data.routineSections.length > 0
  let routineTemplateId: string | null = null

  // Deploy from Studio: reuse existing template without creating or modifying it
  if (data.deployFromTemplateId) {
    routineTemplateId = data.deployFromTemplateId
    result.routineTemplateCreated = false
    result.templateId = data.deployFromTemplateId
  } else if (hasSections) {
    // Editing existing template: delegate the multi-step rewrite to a
    // single atomic RPC (migration 100178) so partial commits are
    // impossible. Replaces the previous non-transactional UPDATE +
    // DELETE-steps + DELETE-sections + INSERT-sections + INSERT-steps
    // chain. The RPC also handles the section+step INSERT, so we skip
    // the shared INSERT loop below for the editing path.
    if (data.editingTemplateId) {
      routineTemplateId = data.editingTemplateId
      result.routineTemplateCreated = true
      result.templateId = data.editingTemplateId

      const rpcSections = serializeRoutineSectionsForRpc(data.routineSections!)

      const { error: rpcError } = await supabase.rpc('update_routine_template_atomic', {
        p_template_id: data.editingTemplateId,
        p_title: data.title,
        p_description: data.description || null,
        p_sections: rpcSections,
      })
      if (rpcError) {
        throw new Error(`[createTaskFromData] Atomic template rewrite failed: ${rpcError.message}`)
      }

      // Atomic path is complete — fall through to task-row creation
      // (Step 2). The shared section/step INSERT loop below is skipped
      // for this branch via the `editingHandled` guard.
    } else {
      // Creating new template — with a defensive dedupe check to prevent the
      // "two identical templates 60 seconds apart" pattern Tenise hit on the
      // Bathroom Cleaning template. If a template with the exact same
      // family_id + title + creator was inserted in the last 10 seconds,
      // reuse it instead of creating a second row. This window is short
      // enough to catch rapid double-submit without blocking intentional
      // duplicate-name creation (which takes longer than a 10-second retry).
      const recentThreshold = new Date(Date.now() - 10_000).toISOString()
      const { data: recentDupe } = await supabase
        .from('task_templates')
        .select('id')
        .eq('family_id', familyId)
        .eq('created_by', creatorId)
        .eq('template_name', data.title)
        .eq('template_type', 'routine')
        .is('archived_at', null)
        .gte('created_at', recentThreshold)
        .limit(1)
        .maybeSingle()

      if (recentDupe?.id) {
        console.warn(`[createTaskFromData] Reusing template ${recentDupe.id} — identical insert within 10s dedupe window.`)
        routineTemplateId = recentDupe.id
      } else {
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
          routineTemplateId = template.id
        }
      }
    }

    // Skip the shared INSERT loop when the editingTemplateId branch
    // already handled section+step persistence via the atomic RPC.
    const editingHandled = !!data.editingTemplateId
    if (routineTemplateId && !editingHandled) {
      result.routineTemplateCreated = true
      result.templateId = routineTemplateId
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
            template_id: routineTemplateId!,
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
  } else if (data.taskType === 'routine' && !data.templateOnly) {
    // Routines without sections are broken — they render as empty cards with no checklist.
    // Refuse to create them. The only exception is templateOnly (Studio save with 0 sections is a user error, but harmless).
    console.error('[createTaskFromData] Routine has no sections — aborting. Sections must be configured before saving.')
    return result
  }

  // ── Step 1.5: Build optional task_rewards payload from the reward form block ──
  //
  // NEW-NN forward-write contract: for opportunity tasks to pay out on
  // completion, a task_rewards row must exist alongside the task so the
  // completion-site hook can look up the dollar amount. Without this
  // persistence step, data.reward.rewardType + data.reward.rewardAmount
  // captured by TaskCreationModal were thrown away on save and mom's
  // opportunity completions produced no payment.
  //
  // Mirror of useOpportunityLists.ts line 194-203 (the list-claim path
  // already writes task_rewards correctly).
  type RewardShape = {
    rewardType?: string
    rewardAmount?: string | number
  }
  const rewardBlock = (data.reward ?? {}) as RewardShape
  const rewardType = rewardBlock.rewardType
  const rewardAmountRaw = rewardBlock.rewardAmount
  const rewardAmountNum =
    typeof rewardAmountRaw === 'number'
      ? rewardAmountRaw
      : typeof rewardAmountRaw === 'string' && rewardAmountRaw.trim() !== ''
        ? Number(rewardAmountRaw)
        : null
  const shouldPersistReward =
    !!rewardType &&
    rewardType !== 'none' &&
    rewardAmountNum !== null &&
    !Number.isNaN(rewardAmountNum)

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
    // Rotation implies shared/any — one task rotates between assignees
    const mode = data.rotationEnabled ? 'any' : (data.assignMode ?? 'each')

    // Dedupe check — two overlapping defenses:
    //
    //   1. For ROUTINE tasks with a template: check for ANY active row
    //      matching (family, template, assignee). Routines are unique
    //      per-assignee by design (enforced hard by unique index
    //      tasks_unique_active_routine_per_assignee, migration 100152).
    //      If one already exists, silently reuse it — the user's intent
    //      ("assign Mosiah this routine") is already satisfied.
    //
    //   2. For all other task types: 10-second window check against
    //      (family, template, assignee, title). Catches rapid double-
    //      submit where a slow save prompted the user to click Deploy
    //      again before the first insert's result was visible.
    const dedupeWindow = new Date(Date.now() - 10_000).toISOString()
    const isRoutineInsert = data.taskType === 'routine'
    async function findRecentDupe(assigneeId: string | null): Promise<string | null> {
      if (!routineTemplateId || !assigneeId) return null
      let query = supabase
        .from('tasks')
        .select('id')
        .eq('family_id', familyId)
        .eq('template_id', routineTemplateId)
        .eq('assignee_id', assigneeId)
        .is('archived_at', null)

      if (isRoutineInsert) {
        // Routines: any active row means "already assigned." No time window.
        query = query.eq('task_type', 'routine')
      } else {
        // Non-routines: title + 10s recency window.
        query = query.eq('title', data.title).gte('created_at', dedupeWindow)
      }

      const { data: dupeRow } = await query.limit(1).maybeSingle()
      return (dupeRow?.id as string | undefined) ?? null
    }

    if (assignees.length >= 2 && mode === 'each') {
      // Per-assignee dedupe for the "each" mode — a redundant save would
      // otherwise multiply every assignee's task row.
      const resultRows: string[] = []
      const inserts: Array<Record<string, unknown>> = []
      for (const a of assignees) {
        const assigneeId = resolveAssigneeId(a)
        const dupeId = await findRecentDupe(assigneeId)
        if (dupeId) {
          const reason = isRoutineInsert
            ? 'assignee already has this routine active'
            : '10s dedupe window hit'
          console.warn(`[createTaskFromData] Reusing task ${dupeId} for assignee ${assigneeId} — ${reason}.`)
          resultRows.push(dupeId)
        } else {
          inserts.push({
            ...taskInsertBase,
            assignee_id: assigneeId,
            is_shared: false,
          })
        }
      }
      if (inserts.length > 0) {
        const { data: rows, error } = await supabase.from('tasks').insert(inserts).select('id')
        if (error) {
          console.error('Failed to create tasks:', error)
          return result
        }
        for (const r of rows ?? []) resultRows.push(r.id)
      }
      result.taskIds = resultRows
    } else {
      const primaryId = assignees.length > 0 ? resolveAssigneeId(assignees[0]) : null

      const dupeId = await findRecentDupe(primaryId)
      if (dupeId) {
        const reason = isRoutineInsert
          ? 'assignee already has this routine active'
          : '10s dedupe window hit'
        console.warn(`[createTaskFromData] Reusing task ${dupeId} — ${reason}.`)
        result.taskIds = [dupeId]
        return result
      }

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
                last_rotated_at: familyToday,
              },
            },
          }).eq('id', newTask.id)
          if (rotErr) console.error('Failed to write rotation config:', rotErr)
        }
      }
    }
  }

  // ── Step 3: Persist task_rewards row(s) if the form captured a reward ──
  //
  // NEW-NN: TaskCreationModal exposes rewardType + rewardAmount in the reward
  // form block, but those values were previously never persisted. Without a
  // task_rewards row on the task, the completion-site forward-write hook has
  // nothing to read when it tries to emit an opportunity_earned transaction.
  // Mirror of useOpportunityLists.ts line 194-203 (the claim-from-list path).
  // One task_rewards row per task, keyed on task_id.
  if (shouldPersistReward && result.taskIds.length > 0) {
    const rewardInserts = result.taskIds.map(taskId => ({
      task_id: taskId,
      reward_type: rewardType,
      reward_value: { amount: rewardAmountNum },
    }))
    const { error: rewardError } = await supabase.from('task_rewards').insert(rewardInserts)
    if (rewardError) {
      // Non-fatal: the task still exists and is usable. Log so the founder
      // can see if reward persistence is silently failing; don't throw.
      console.error('[createTaskFromData] Failed to persist task_rewards:', rewardError.message)
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
