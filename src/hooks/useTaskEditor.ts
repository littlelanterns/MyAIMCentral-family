/**
 * useTaskEditor — shared open/save logic for editing an existing task.
 *
 * FO-COMMAND-CENTER (2026-06-10): extracted verbatim from Tasks.tsx so the
 * Family Overview spot-check view can open the SAME full edit modal inline
 * (founder Q4: "open full edit modal right there, no page hopping") without
 * forking the save path. One implementation, two mount points — the exact
 * divergent-rewrite-chain bug class Worker ROUTINE-SAVE-FIX eliminated must
 * not be reintroduced.
 *
 * - openEditTask loads routine template sections so the editor is pre-filled
 * - saveEditTask updates the deployment row (snapshot fields, Convention #259)
 *   and rewrites routine templates via the atomic RPC (migration 100178);
 *   errors THROW so TaskCreationModal's catch surfaces the error toast.
 */

import { useState, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { buildTaskScheduleFields } from '@/utils/buildTaskScheduleFields'
import { fetchFamilyToday } from '@/hooks/useFamilyToday'
import { serializeRoutineSectionsForRpc } from '@/lib/templates/serializeRoutineSectionsForRpc'
import type { Task } from '@/hooks/useTasks'
import type { CreateTaskData } from '@/components/tasks/TaskCreationModal'
import type { RoutineSection } from '@/components/tasks/RoutineSectionEditor'

export interface TaskEditor {
  editingTask: Task | null
  editRoutineSections: RoutineSection[] | undefined
  openEditTask: (task: Task) => Promise<void>
  /**
   * FO-COMMAND-CENTER: open the editor from a surface that only holds a slim
   * row (the Family Overview column queries select a subset of columns) —
   * fetches the full task row first.
   */
  openEditTaskById: (taskId: string) => Promise<void>
  saveEditTask: (data: CreateTaskData) => Promise<void>
  closeEditor: () => void
}

export function useTaskEditor(): TaskEditor {
  const { data: member } = useFamilyMember()
  const queryClient = useQueryClient()
  const [editingTask, setEditingTask] = useState<Task | null>(null)
  const [editRoutineSections, setEditRoutineSections] = useState<RoutineSection[] | undefined>(undefined)

  // ── Open task for editing (loads routine sections if applicable) ──
  const openEditTask = useCallback(async (task: Task) => {
    setEditingTask(task)

    // For routines, load the template sections so the editor is pre-filled
    if (task.task_type === 'routine' && task.template_id) {
      const { data: sections } = await supabase
        .from('task_template_sections')
        .select('id, title, section_name, frequency_rule, frequency_days, show_until_complete, sort_order')
        .eq('template_id', task.template_id)
        .order('sort_order')

      if (sections?.length) {
        const routineSections: RoutineSection[] = []
        for (const sec of sections) {
          const { data: steps } = await supabase
            .from('task_template_steps')
            .select('id, title, step_name, step_notes, instance_count, require_photo, sort_order, step_type, linked_source_id, linked_source_type, display_name_override')
            .eq('section_id', sec.id)
            .order('sort_order')

          let frequency: RoutineSection['frequency'] = 'daily'
          const days = (sec.frequency_days as number[]) ?? []
          if (sec.frequency_rule === 'custom') {
            const sorted = [...days].sort().join(',')
            if (sorted === '1,2,3,4,5') frequency = 'weekdays'
            else if (sorted === '1,3,5') frequency = 'mwf'
            else if (sorted === '2,4') frequency = 't_th'
            else frequency = 'custom'
          } else {
            frequency = (sec.frequency_rule as typeof frequency) ?? 'daily'
          }

          routineSections.push({
            id: sec.id,
            name: sec.section_name ?? sec.title ?? '',
            frequency,
            customDays: days.map(Number),
            showUntilComplete: sec.show_until_complete ?? false,
            sort_order: sec.sort_order ?? 0,
            isEditing: false,
            steps: (steps ?? []).map(st => ({
              id: st.id,
              title: st.title ?? st.step_name ?? '',
              notes: st.step_notes ?? '',
              showNotes: !!(st.step_notes),
              instanceCount: st.instance_count ?? 1,
              requirePhoto: st.require_photo ?? false,
              sort_order: st.sort_order ?? 0,
              step_type: (st.step_type as 'static' | 'linked_sequential' | 'linked_randomizer' | 'linked_task') ?? 'static',
              linked_source_id: st.linked_source_id ?? null,
              linked_source_type: st.linked_source_type ?? null,
              display_name_override: st.display_name_override ?? null,
            })),
          })
        }
        setEditRoutineSections(routineSections)
      }
    } else {
      setEditRoutineSections(undefined)
    }
  }, [])

  // ── Save edits ──
  const saveEditTask = useCallback(
    async (data: CreateTaskData) => {
      if (!editingTask) return
      if (!member?.id) {
        console.error('Cannot edit task: member not loaded')
        return
      }

      // Row 184 NEW-DD Path 2: family-timezone-derived "today" for due_date writes.
      const familyToday = await fetchFamilyToday(member.id)
      const scheduleFields = buildTaskScheduleFields(data, familyToday)

      // Update the deployment task row (snapshot fields per Convention #259).
      const { error: taskUpdateError } = await supabase
        .from('tasks')
        .update({
          title: data.title,
          description: data.description || null,
          life_area_tag: data.lifeAreaTag || null,
          life_area_tags: data.lifeAreaTag ? [data.lifeAreaTag] : [],
          duration_estimate: data.durationEstimate || null,
          incomplete_action: data.incompleteAction,
          require_approval: data.reward?.requireApproval ?? false,
          victory_flagged: data.reward?.flagAsVictory ?? false,
          due_date: scheduleFields.due_date,
          recurrence_rule: scheduleFields.recurrence_rule,
          recurrence_details: scheduleFields.recurrence_details,
          counts_for_allowance: data.countsForAllowance ?? false,
          counts_for_homework: data.countsForHomework ?? false,
          counts_for_gamification: data.countsForGamification ?? true,
          // KIDS-REWARDS-PAGE Q5c: custom-reward promise fields are editable
          // ("...OR at any point she edits that item later")
          reward_description: data.reward?.rewardDescription?.trim() || null,
          reward_image_url: data.reward?.rewardImageUrl ?? null,
          reward_image_asset_key: data.reward?.rewardImageAssetKey ?? null,
        })
        .eq('id', editingTask.id)

      if (taskUpdateError) {
        // Worker ROUTINE-SAVE-FIX (c3): throw so TaskCreationModal's catch
        // block (c2) surfaces the failure via error toast.
        throw new Error(`Failed to update task: ${taskUpdateError.message}`)
      }

      // Update routine template sections via the atomic RPC (migration
      // 100178) — partial commits are impossible.
      if (data.editingTemplateId && data.routineSections?.length) {
        const rpcSections = serializeRoutineSectionsForRpc(data.routineSections)
        const { error: rpcError } = await supabase.rpc('update_routine_template_atomic', {
          p_template_id: data.editingTemplateId,
          p_title: data.title,
          p_description: data.description || null,
          p_sections: rpcSections,
        })
        if (rpcError) {
          throw new Error(`Atomic template rewrite failed: ${rpcError.message}`)
        }
      }

      queryClient.invalidateQueries({ queryKey: ['tasks'] })
      queryClient.invalidateQueries({ queryKey: ['calendar'] })
      queryClient.invalidateQueries({ queryKey: ['task_templates_customized'] })
      queryClient.invalidateQueries({ queryKey: ['routine-template-steps'] })
      // FO-COMMAND-CENTER: FO column + spot-check caches
      queryClient.invalidateQueries({ queryKey: ['fo-tasks'] })
      queryClient.invalidateQueries({ queryKey: ['fo-routines'] })
      queryClient.invalidateQueries({ queryKey: ['fo-sequential'] })
      setEditingTask(null)
      setEditRoutineSections(undefined)
    },
    [editingTask, member?.id, queryClient]
  )

  const closeEditor = useCallback(() => {
    setEditingTask(null)
    setEditRoutineSections(undefined)
  }, [])

  // Fetch the full row, then open — for slim-row surfaces (FO columns).
  const openEditTaskById = useCallback(
    async (taskId: string) => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('id', taskId)
        .single()
      if (error || !data) {
        console.error('openEditTaskById failed:', error)
        return
      }
      await openEditTask(data as Task)
    },
    [openEditTask]
  )

  return { editingTask, editRoutineSections, openEditTask, openEditTaskById, saveEditTask, closeEditor }
}
