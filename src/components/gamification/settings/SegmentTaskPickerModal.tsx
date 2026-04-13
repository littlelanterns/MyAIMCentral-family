/**
 * SegmentTaskPickerModal — Build M Phase 4
 *
 * Simple modal for assigning tasks to a segment. Shows the member's tasks
 * with checkboxes; checked = assigned to this segment.
 */

import { useState, useMemo } from 'react'
import { Search, CheckSquare, Square } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { useTasks } from '@/hooks/useTasks'
import { useAssignTaskToSegment } from '@/hooks/useTaskSegments'
import type { TaskSegment } from '@/types/play-dashboard'

interface SegmentTaskPickerModalProps {
  isOpen: boolean
  onClose: () => void
  segment: TaskSegment
  familyId: string
  memberId: string
  /** All segments for this member — used to show which segment a task is currently in */
  allSegments: TaskSegment[]
}

export function SegmentTaskPickerModal({
  isOpen,
  onClose,
  segment,
  familyId,
  memberId,
  allSegments,
}: SegmentTaskPickerModalProps) {
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)

  const { data: tasks = [] } = useTasks(familyId, { assigneeId: memberId })
  const assignMutation = useAssignTaskToSegment()

  // Only show active, non-archived tasks
  const activeTasks = useMemo(() => {
    return tasks.filter(
      (t) =>
        !t.archived_at &&
        t.status !== 'cancelled' &&
        t.status !== 'completed',
    )
  }, [tasks])

  const filtered = useMemo(() => {
    if (!search.trim()) return activeTasks
    const q = search.toLowerCase()
    return activeTasks.filter((t) => t.title.toLowerCase().includes(q))
  }, [activeTasks, search])

  async function handleToggle(taskId: string, currentSegmentId: string | null) {
    setSaving(true)
    try {
      const newSegmentId = currentSegmentId === segment.id ? null : segment.id
      await assignMutation.mutateAsync({
        taskId,
        segmentId: newSegmentId,
        familyId,
      })
    } catch {
      // toast would be nice, but the mutation error logging covers it
    }
    setSaving(false)
  }

  async function handleSegmentChange(taskId: string, newSegmentId: string | null) {
    setSaving(true)
    try {
      await assignMutation.mutateAsync({
        taskId,
        segmentId: newSegmentId,
        familyId,
      })
    } catch {
      // mutation error logging covers it
    }
    setSaving(false)
  }

  return (
    <ModalV2
      id={`segment-task-picker-${segment.id}`}
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="md"
      title={`Assign Tasks — ${segment.segment_name}`}
    >
      <div className="space-y-3">
        {/* Search */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2"
            style={{ color: 'var(--color-text-secondary)' }}
          />
          <input
            type="text"
            placeholder="Search tasks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm outline-none"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>

        {/* Task list */}
        <div className="max-h-80 overflow-y-auto space-y-1">
          {filtered.length === 0 ? (
            <p className="text-center py-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {search ? 'No tasks match your search.' : 'No active tasks for this member.'}
            </p>
          ) : (
            filtered.map((task) => {
              const taskSegmentId = (task as { task_segment_id?: string | null }).task_segment_id ?? null
              const isInThisSegment = taskSegmentId === segment.id

              return (
                <div
                  key={task.id}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg transition-colors"
                  style={{
                    backgroundColor: isInThisSegment
                      ? 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, var(--color-bg-card))'
                      : 'transparent',
                  }}
                >
                  {/* Checkbox — toggle assignment to the current segment */}
                  <button
                    type="button"
                    onClick={() => handleToggle(task.id, taskSegmentId)}
                    disabled={saving}
                    style={{ flexShrink: 0, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                  >
                    {isInThisSegment ? (
                      <CheckSquare size={18} style={{ color: 'var(--color-btn-primary-bg)' }} />
                    ) : (
                      <Square size={18} style={{ color: 'var(--color-text-secondary)' }} />
                    )}
                  </button>

                  {/* Task title */}
                  <p className="flex-1 text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {task.title}
                  </p>

                  {/* Segment quick-assign dropdown — lets mom move tasks between segments inline */}
                  <select
                    value={taskSegmentId ?? ''}
                    onChange={(e) => handleSegmentChange(task.id, e.target.value || null)}
                    disabled={saving}
                    className="text-xs rounded-md px-1.5 py-1 outline-none"
                    style={{
                      backgroundColor: 'var(--color-bg-primary)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-secondary)',
                      maxWidth: '7rem',
                    }}
                  >
                    <option value="">None</option>
                    {allSegments.map((s) => (
                      <option key={s.id} value={s.id}>{s.segment_name}</option>
                    ))}
                  </select>
                </div>
              )
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </ModalV2>
  )
}
