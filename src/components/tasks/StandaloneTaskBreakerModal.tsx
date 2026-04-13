/**
 * PRD-09A: Standalone Task Breaker Modal
 *
 * Opens as a standalone tool — user types a task name (or snaps a photo),
 * breaks it down, and saves the result as a parent task + child subtasks.
 * Entry points: QuickTasks strip button, AI Vault, On the Horizon.
 */

import { useState } from 'react'
import { Zap } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { TaskBreaker, type BrokenTask } from './TaskBreaker'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useQueryClient } from '@tanstack/react-query'

interface StandaloneTaskBreakerModalProps {
  isOpen: boolean
  onClose: () => void
}

export function StandaloneTaskBreakerModal({ isOpen, onClose }: StandaloneTaskBreakerModalProps) {
  const { data: member } = useFamilyMember()
  const queryClient = useQueryClient()
  const [taskTitle, setTaskTitle] = useState('')
  const [taskDescription, setTaskDescription] = useState('')
  const [phase, setPhase] = useState<'input' | 'breaking'>('input')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleStartBreaking() {
    if (!taskTitle.trim()) return
    setPhase('breaking')
  }

  async function handleApply(subtasks: BrokenTask[]) {
    if (!member?.family_id || !member?.id) return
    setSaving(true)
    setError(null)

    try {
      // Create the parent task
      const { data: parentTask, error: parentError } = await supabase
        .from('tasks')
        .insert({
          family_id: member.family_id,
          created_by: member.id,
          assignee_id: member.id,
          title: taskTitle.trim(),
          description: taskDescription.trim() || null,
          task_type: 'task',
          status: 'pending',
          source: 'manual',
        })
        .select('id')
        .single()

      if (parentError) throw parentError

      // Create child subtasks linked to parent
      const childRows = subtasks.map((st, idx) => ({
        family_id: member.family_id,
        created_by: member.id,
        assignee_id: st.suggestedAssigneeId || member.id,
        title: st.title,
        description: st.description || null,
        task_type: 'task' as const,
        status: 'pending' as const,
        source: 'manual' as const,
        parent_task_id: parentTask.id,
        task_breaker_level: 'detailed' as const,
        sort_order: idx + 1,
      }))

      const { error: childError } = await supabase
        .from('tasks')
        .insert(childRows)

      if (childError) throw childError

      // Invalidate tasks cache
      queryClient.invalidateQueries({ queryKey: ['tasks'] })

      // Reset and close
      resetState()
      onClose()
    } catch (err) {
      console.error('Failed to save broken-down task:', err)
      setError('Failed to save. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  function resetState() {
    setTaskTitle('')
    setTaskDescription('')
    setPhase('input')
    setError(null)
    setSaving(false)
  }

  function handleClose() {
    resetState()
    onClose()
  }

  return (
    <ModalV2
      isOpen={isOpen}
      onClose={handleClose}
      title="Task Breaker"
      type="transient"
      size="md"
      id="standalone-task-breaker"
    >
      <div className="p-4 flex flex-col gap-4">
        {phase === 'input' && (
          <>
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              Describe a task and let AI break it into actionable steps.
            </p>

            <div>
              <label
                className="text-xs font-medium block mb-1"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                What needs to be done?
              </label>
              <input
                type="text"
                value={taskTitle}
                onChange={e => setTaskTitle(e.target.value)}
                placeholder="e.g., Clean the garage, Plan the birthday party..."
                className="w-full px-3 py-2.5 rounded-lg text-sm"
                style={{
                  background: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                }}
                onKeyDown={e => { if (e.key === 'Enter' && taskTitle.trim()) handleStartBreaking() }}
                autoFocus
              />
            </div>

            <div>
              <label
                className="text-xs font-medium block mb-1"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Details (optional)
              </label>
              <textarea
                value={taskDescription}
                onChange={e => setTaskDescription(e.target.value)}
                placeholder="Any extra context — who's involved, constraints, priorities..."
                rows={2}
                className="w-full px-3 py-2 rounded-lg text-sm resize-none"
                style={{
                  background: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                }}
              />
            </div>

            <button
              onClick={handleStartBreaking}
              disabled={!taskTitle.trim()}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-40"
              style={{
                background: 'var(--gradient-primary, var(--color-btn-primary-bg))',
                color: 'var(--color-btn-primary-text)',
              }}
            >
              <Zap size={16} />
              Next — Choose Detail Level
            </button>
          </>
        )}

        {phase === 'breaking' && (
          <>
            {saving && (
              <div
                className="text-center text-sm py-2"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Saving task and subtasks...
              </div>
            )}
            {error && (
              <p className="text-xs text-center" style={{ color: 'var(--color-error, #e55)' }}>
                {error}
              </p>
            )}
            <TaskBreaker
              taskTitle={taskTitle.trim()}
              taskDescription={taskDescription.trim() || undefined}
              onApply={handleApply}
              onCancel={() => setPhase('input')}
            />
          </>
        )}
      </div>
    </ModalV2>
  )
}
