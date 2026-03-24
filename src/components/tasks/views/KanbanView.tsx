/**
 * KanbanView — PRD-09A View 9
 *
 * 3 columns: To Do, In Progress, Done.
 * Tasks movable between columns via button controls (no full DnD).
 * Uses kanban_status field.
 */

import { useState } from 'react'
import { TaskCard } from '../TaskCard'
import { EmptyState } from '@/components/shared'
import { Columns3, ArrowRight, ArrowLeft } from 'lucide-react'
import type { Task } from '@/hooks/useTasks'

type KanbanStatus = 'to_do' | 'in_progress' | 'done'

interface TaskWithKanban extends Task {
  kanban_status: KanbanStatus | null
}

interface KanbanViewProps {
  tasks: Task[]
  onToggle: (task: Task, origin?: { x: number; y: number }) => void
  onEdit?: (task: Task) => void
  onFocusTimer?: (task: Task) => void
  onBreakItDown?: (task: Task) => void
  onDelete?: (task: Task) => void
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void
  isCompleting?: (taskId: string) => boolean
}

const COLUMNS: { key: KanbanStatus; label: string; color: string }[] = [
  { key: 'to_do', label: 'To Do', color: 'var(--color-text-secondary)' },
  { key: 'in_progress', label: 'In Progress', color: 'var(--color-warning)' },
  { key: 'done', label: 'Done', color: 'var(--color-success)' },
]

export function KanbanView({
  tasks,
  onToggle,
  onEdit,
  onFocusTimer,
  onBreakItDown,
  onDelete,
  onUpdateTask,
  isCompleting,
}: KanbanViewProps) {
  const [localStatuses, setLocalStatuses] = useState<Record<string, KanbanStatus>>({})

  const getStatus = (task: TaskWithKanban): KanbanStatus => {
    if (localStatuses[task.id]) return localStatuses[task.id]
    if (task.kanban_status) return task.kanban_status as KanbanStatus
    // Auto-derive from task status
    if (task.status === 'completed') return 'done'
    if (task.status === 'in_progress') return 'in_progress'
    return 'to_do'
  }

  const moveTask = (taskId: string, direction: 'forward' | 'back') => {
    const task = tasks.find((t) => t.id === taskId)
    if (!task) return

    const current = getStatus(task)
    const colIndex = COLUMNS.findIndex((c) => c.key === current)
    const nextIndex =
      direction === 'forward'
        ? Math.min(colIndex + 1, COLUMNS.length - 1)
        : Math.max(colIndex - 1, 0)

    const nextStatus = COLUMNS[nextIndex].key
    setLocalStatuses((prev) => ({ ...prev, [taskId]: nextStatus }))
    onUpdateTask?.(taskId, { kanban_status: nextStatus } as Partial<Task>)
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<Columns3 size={36} />}
        title="Nothing in the pipeline"
        description="Add tasks to move them through To Do, In Progress, and Done."
      />
    )
  }

  return (
    <div className="space-y-4">
      {COLUMNS.map((col) => {
        const colTasks = tasks.filter((t) => getStatus(t) === col.key)
        const colIndex = COLUMNS.findIndex((c) => c.key === col.key)

        return (
          <div
            key={col.key}
            className="rounded-xl overflow-hidden"
            style={{
              border: '1.5px solid var(--color-border)',
              borderRadius: 'var(--vibe-radius-card, 0.5rem)',
            }}
          >
            {/* Column header */}
            <div
              className="flex items-center gap-2 px-4 py-2.5"
              style={{
                backgroundColor: 'var(--color-bg-card)',
                borderBottom: '1px solid var(--color-border)',
              }}
            >
              <span
                className="w-2 h-2 rounded-full"
                style={{ backgroundColor: col.color }}
              />
              <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-heading)' }}>
                {col.label}
              </h3>
              <span
                className="ml-auto text-xs px-2 py-0.5 rounded-full"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {colTasks.length}
              </span>
            </div>

            {/* Tasks */}
            <div
              className="p-3 space-y-2"
              style={{ backgroundColor: 'var(--color-bg-secondary)', minHeight: 80 }}
            >
              {colTasks.length === 0 ? (
                <p
                  className="text-center text-xs py-4"
                  style={{ color: 'var(--color-text-secondary)', opacity: 0.5 }}
                >
                  Empty
                </p>
              ) : (
                colTasks.map((task) => (
                  <div key={task.id} className="space-y-1">
                    <TaskCard
                      task={task}
                      isCompleting={isCompleting?.(task.id)}
                      onToggle={onToggle}
                      onEdit={onEdit}
                      onFocusTimer={onFocusTimer}
                      onBreakItDown={onBreakItDown}
                      onDelete={onDelete}
                      compact
                    />
                    {/* Move controls */}
                    <div className="flex gap-1 justify-end px-1">
                      {colIndex > 0 && (
                        <button
                          onClick={() => moveTask(task.id, 'back')}
                          className="flex items-center gap-1 text-xs px-2 py-0.5 rounded"
                          style={{
                            color: 'var(--color-text-secondary)',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg-card)',
                          }}
                        >
                          <ArrowLeft size={10} />
                          {COLUMNS[colIndex - 1].label}
                        </button>
                      )}
                      {colIndex < COLUMNS.length - 1 && (
                        <button
                          onClick={() => moveTask(task.id, 'forward')}
                          className="flex items-center gap-1 text-xs px-2 py-0.5 rounded"
                          style={{
                            color: 'var(--color-text-secondary)',
                            border: '1px solid var(--color-border)',
                            backgroundColor: 'var(--color-bg-card)',
                          }}
                        >
                          {COLUMNS[colIndex + 1].label}
                          <ArrowRight size={10} />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
