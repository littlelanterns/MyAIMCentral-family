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

  const segmentNameById = useMemo(() => {
    const map = new Map<string, string>()
    for (const s of allSegments) {
      map.set(s.id, s.segment_name)
    }
    return map
  }, [allSegments])

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
              const isInOtherSegment = taskSegmentId && taskSegmentId !== segment.id
              const otherSegmentName = taskSegmentId ? segmentNameById.get(taskSegmentId) : null

              return (
                <button
                  key={task.id}
                  type="button"
                  onClick={() => handleToggle(task.id, taskSegmentId)}
                  disabled={saving}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors"
                  style={{
                    backgroundColor: isInThisSegment
                      ? 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, var(--color-bg-card))'
                      : 'transparent',
                  }}
                >
                  {isInThisSegment ? (
                    <CheckSquare size={18} style={{ color: 'var(--color-btn-primary-bg)', flexShrink: 0 }} />
                  ) : (
                    <Square size={18} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>
                      {task.title}
                    </p>
                    {isInOtherSegment && otherSegmentName && (
                      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        Currently in: {otherSegmentName}
                      </p>
                    )}
                  </div>
                </button>
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
