/**
 * SimpleListView — PRD-09A View 1
 *
 * Plain checkboxes, drag reorder via up/down arrows.
 * Default view for all shells.
 */

import { useState, useCallback } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { TaskCard } from '../TaskCard'
import { EmptyState } from '@/components/shared'
import { CheckSquare } from 'lucide-react'
import type { Task } from '@/hooks/useTasks'

interface SimpleListViewProps {
  tasks: Task[]
  onToggle: (task: Task, origin?: { x: number; y: number }) => void
  onEdit?: (task: Task) => void
  onFocusTimer?: (task: Task) => void
  onBreakItDown?: (task: Task) => void
  onAssign?: (task: Task) => void
  onDelete?: (task: Task) => void
  isCompleting?: (taskId: string) => boolean
}

export function SimpleListView({
  tasks,
  onToggle,
  onEdit,
  onFocusTimer,
  onBreakItDown,
  onAssign,
  onDelete,
  isCompleting,
}: SimpleListViewProps) {
  const [orderedIds, setOrderedIds] = useState<string[]>(() => tasks.map((t) => t.id))

  // Sync when tasks change
  const currentIds = tasks.map((t) => t.id)
  const needsSync = currentIds.some((id) => !orderedIds.includes(id))
  const resolvedIds = needsSync
    ? [...orderedIds, ...currentIds.filter((id) => !orderedIds.includes(id))]
    : orderedIds

  const orderedTasks = resolvedIds
    .map((id) => tasks.find((t) => t.id === id))
    .filter(Boolean) as Task[]

  const moveUp = useCallback(
    (index: number) => {
      if (index === 0) return
      const next = [...resolvedIds]
      ;[next[index - 1], next[index]] = [next[index], next[index - 1]]
      setOrderedIds(next)
    },
    [resolvedIds]
  )

  const moveDown = useCallback(
    (index: number) => {
      if (index === resolvedIds.length - 1) return
      const next = [...resolvedIds]
      ;[next[index], next[index + 1]] = [next[index + 1], next[index]]
      setOrderedIds(next)
    },
    [resolvedIds]
  )

  if (orderedTasks.length === 0) {
    return (
      <EmptyState
        icon={<CheckSquare size={36} />}
        title="All clear!"
        description="No tasks here. Add one to get started."
      />
    )
  }

  return (
    <div className="space-y-2">
      {orderedTasks.map((task, index) => (
        <div key={task.id} className="flex items-center gap-1">
          {/* Reorder controls */}
          <div className="flex flex-col gap-0.5 flex-shrink-0">
            <button
              onClick={() => moveUp(index)}
              disabled={index === 0}
              className="p-0.5 rounded opacity-40 hover:opacity-80 disabled:opacity-20 transition-opacity"
              style={{ color: 'var(--color-text-secondary)' }}
              aria-label="Move up"
            >
              <ChevronUp size={14} />
            </button>
            <button
              onClick={() => moveDown(index)}
              disabled={index === orderedTasks.length - 1}
              className="p-0.5 rounded opacity-40 hover:opacity-80 disabled:opacity-20 transition-opacity"
              style={{ color: 'var(--color-text-secondary)' }}
              aria-label="Move down"
            >
              <ChevronDown size={14} />
            </button>
          </div>

          <div className="flex-1">
            <TaskCard
              task={task}
              isCompleting={isCompleting?.(task.id)}
              onToggle={onToggle}
              onEdit={onEdit}
              onFocusTimer={onFocusTimer}
              onBreakItDown={onBreakItDown}
              onAssign={onAssign}
              onDelete={onDelete}
            />
          </div>
        </div>
      ))}
    </div>
  )
}
