/**
 * PRD-18 Enhancement 8: TaskBreaker Modal Wrapper (On the Horizon)
 *
 * Thin ModalV2 wrapper around the existing TaskBreaker component.
 * Opened from OnTheHorizonSection when mom taps "Break into steps"
 * on an upcoming task.
 *
 * TaskBreaker is normally embedded inside TaskCreationModal. It
 * returns a BrokenTask[] via onApply. This wrapper takes those
 * subtasks and writes them directly to the tasks table as children
 * of the parent (parent_task_id = parentTaskId), then closes and
 * invalidates the tasks + on-the-horizon query caches.
 *
 * Child tasks inherit:
 *   - family_id from the parent context
 *   - assignee_id from the parent member (simple case — subtasks
 *     are assigned to the same person unless TaskBreaker suggested
 *     otherwise via suggestedAssigneeId)
 *   - due_date stays the same as the parent's due date
 *   - life_area_tag from the parent (via the prop)
 *   - task_type='task' (not routine/opportunity — subtasks are flat)
 *   - source='goal_decomposition' (existing enum value for Task Breaker)
 *   - status='pending'
 *
 * On write failure: toast error, leave modal open, let user retry.
 */

import { useState } from 'react'
import { Zap } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { ModalV2 } from '@/components/shared/ModalV2'
import { TaskBreaker } from '@/components/tasks/TaskBreaker'
import type { BrokenTask } from '@/components/tasks/TaskBreaker'
import { supabase } from '@/lib/supabase/client'

interface Props {
  parentTaskId: string
  parentTitle: string
  parentDescription?: string
  lifeAreaTag?: string
  familyId: string
  memberId: string
  onClose: () => void
}

export function TaskBreakerModalFromHorizon({
  parentTaskId,
  parentTitle,
  parentDescription,
  lifeAreaTag,
  familyId,
  memberId,
  onClose,
}: Props) {
  const queryClient = useQueryClient()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleApply = async (subtasks: BrokenTask[]) => {
    if (subtasks.length === 0) {
      onClose()
      return
    }

    setSaving(true)
    setError(null)

    try {
      // Load the parent task to inherit due_date
      const { data: parent, error: parentError } = await supabase
        .from('tasks')
        .select('due_date, life_area_tag')
        .eq('id', parentTaskId)
        .single()

      if (parentError) throw parentError

      // Also mark the parent task with task_breaker_level so
      // the "hasSubtasks" detection in OnTheHorizonSection recognizes
      // it as in-progress on next render.
      const { error: parentUpdateError } = await supabase
        .from('tasks')
        .update({ task_breaker_level: 'detailed' })
        .eq('id', parentTaskId)

      if (parentUpdateError) throw parentUpdateError

      // Insert child tasks
      const rows = subtasks.map((subtask, idx) => ({
        family_id: familyId,
        created_by: memberId,
        assignee_id: subtask.suggestedAssigneeId ?? memberId,
        title: subtask.title,
        description: subtask.description ?? null,
        task_type: 'task' as const,
        status: 'pending' as const,
        parent_task_id: parentTaskId,
        due_date: parent?.due_date ?? null,
        life_area_tag: lifeAreaTag ?? parent?.life_area_tag ?? null,
        source: 'goal_decomposition' as const,
        sort_order: subtask.sortOrder ?? idx,
      }))

      const { error: insertError } = await supabase.from('tasks').insert(rows)
      if (insertError) throw insertError

      // Invalidate caches so On the Horizon, Task Preview, and Tasks page
      // all reflect the new subtasks immediately.
      queryClient.invalidateQueries({ queryKey: ['tasks', familyId] })
      queryClient.invalidateQueries({ queryKey: ['on-the-horizon', familyId, memberId] })

      onClose()
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Something went wrong saving your subtasks. Try again?'
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalV2
      id={`task-breaker-horizon-${parentTaskId}`}
      isOpen={true}
      onClose={onClose}
      type="transient"
      size="lg"
      title="Break this into steps"
      subtitle={parentTitle}
      icon={Zap}
    >
      <div className="space-y-3">
        {error && (
          <div
            className="rounded-lg px-4 py-3 text-sm"
            style={{
              background: 'color-mix(in srgb, var(--color-danger, #b91c1c) 10%, transparent)',
              border: '1px solid var(--color-danger, #b91c1c)',
              color: 'var(--color-text-primary)',
            }}
          >
            {error}
          </div>
        )}

        {saving && (
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Saving subtasks…
          </p>
        )}

        <TaskBreaker
          taskTitle={parentTitle}
          taskDescription={parentDescription}
          lifeAreaTag={lifeAreaTag}
          onApply={handleApply}
          onCancel={onClose}
        />
      </div>
    </ModalV2>
  )
}
