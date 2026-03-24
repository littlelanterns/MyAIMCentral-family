/**
 * OneFiveThreeView — PRD-09A View 4
 *
 * Three sections: 1 Big (max 1), 3 Medium (max 3), 5 Small (max 5).
 * "Not Today" collapse for overflow.
 * Forces realistic daily planning.
 */

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { TaskCard } from '../TaskCard'
import { EmptyState } from '@/components/shared'
import type { Task } from '@/hooks/useTasks'

type ImportanceLevel = 'critical_1' | 'important_3' | 'small_5' | null

interface TaskWithImportance extends Task {
  importance_level?: ImportanceLevel
}

interface OneFiveThreeViewProps {
  tasks: Task[]
  onToggle: (task: Task, origin?: { x: number; y: number }) => void
  onEdit?: (task: Task) => void
  onFocusTimer?: (task: Task) => void
  onBreakItDown?: (task: Task) => void
  onDelete?: (task: Task) => void
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void
  isCompleting?: (taskId: string) => boolean
}

const SLOTS = [
  {
    key: 'critical_1' as ImportanceLevel,
    label: '1 Big Task',
    max: 1,
    description: 'The most important thing today',
    color: 'var(--color-error)',
  },
  {
    key: 'important_3' as ImportanceLevel,
    label: '3 Medium Tasks',
    max: 3,
    description: 'Important but not critical',
    color: 'var(--color-warning)',
  },
  {
    key: 'small_5' as ImportanceLevel,
    label: '5 Small Tasks',
    max: 5,
    description: 'Quick wins and easy completions',
    color: 'var(--color-success)',
  },
]

export function OneFiveThreeView({
  tasks,
  onToggle,
  onEdit,
  onFocusTimer,
  onBreakItDown,
  onDelete,
  onUpdateTask,
  isCompleting,
}: OneFiveThreeViewProps) {
  const [localLevels, setLocalLevels] = useState<Record<string, ImportanceLevel>>({})
  const [showNotToday, setShowNotToday] = useState(false)

  const getLevel = (task: TaskWithImportance): ImportanceLevel => {
    return localLevels[task.id] ?? task.importance_level ?? null
  }

  const setLevel = (taskId: string, level: ImportanceLevel) => {
    setLocalLevels((prev) => ({ ...prev, [taskId]: level }))
    onUpdateTask?.(taskId, { importance_level: level } as Partial<Task>)
  }

  const activeTasks = tasks.filter((t) => t.status !== 'completed')

  // Group by level
  const grouped: Record<string, Task[]> = { critical_1: [], important_3: [], small_5: [] }
  const unplaced: Task[] = []
  const overflow: Task[] = []

  activeTasks.forEach((task) => {
    const level = getLevel(task)
    if (!level) {
      unplaced.push(task)
    } else {
      const slotDef = SLOTS.find((s) => s.key === level)!
      const bucket = grouped[level]
      if (bucket.length < slotDef.max) {
        bucket.push(task)
      } else {
        overflow.push(task)
      }
    }
  })

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<span style={{ fontSize: 36 }}>📋</span>}
        title="Plan your day"
        description="1 big task, 3 medium tasks, 5 small tasks. That's a perfect day."
      />
    )
  }

  return (
    <div className="space-y-4">
      {SLOTS.map((slot) => {
        const slotTasks = grouped[slot.key!] ?? []
        const remaining = slot.max - slotTasks.length

        return (
          <div
            key={slot.key}
            className="rounded-xl p-4"
            style={{
              border: `1.5px solid ${slot.color}`,
              backgroundColor: `color-mix(in srgb, ${slot.color} 5%, var(--color-bg-card))`,
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {slot.label}
                </h3>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {slot.description}
                </p>
              </div>
              <span
                className="text-lg font-bold"
                style={{ color: slot.color }}
              >
                {slotTasks.length}/{slot.max}
              </span>
            </div>

            {/* Tasks in this slot */}
            <div className="space-y-2">
              {slotTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isCompleting={isCompleting?.(task.id)}
                  onToggle={onToggle}
                  onEdit={onEdit}
                  onFocusTimer={onFocusTimer}
                  onBreakItDown={onBreakItDown}
                  onDelete={onDelete}
                  compact
                />
              ))}
            </div>

            {/* Empty slot placeholders + unplaced suggestions */}
            {remaining > 0 && unplaced.length > 0 && (
              <div className="mt-2 space-y-1">
                {unplaced.slice(0, Math.min(remaining, 3)).map((task) => (
                  <button
                    key={task.id}
                    onClick={() => setLevel(task.id, slot.key)}
                    className="w-full text-left px-3 py-2 rounded-lg text-xs flex items-center gap-2 transition-all"
                    style={{
                      border: `1px dashed ${slot.color}`,
                      backgroundColor: 'transparent',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    <span style={{ color: slot.color }}>+</span>
                    <span className="truncate">{task.title}</span>
                    <span className="ml-auto opacity-60">Add here</span>
                  </button>
                ))}
              </div>
            )}

            {remaining > 0 && unplaced.length === 0 && slotTasks.length === 0 && (
              <p className="text-xs text-center py-2" style={{ color: 'var(--color-text-secondary)', opacity: 0.5 }}>
                {remaining} slot{remaining > 1 ? 's' : ''} open
              </p>
            )}
          </div>
        )
      })}

      {/* Not Today overflow */}
      {(overflow.length > 0 || unplaced.filter((_t, i) => i >= 3).length > 0) && (
        <div>
          <button
            onClick={() => setShowNotToday(!showNotToday)}
            className="flex items-center gap-2 w-full text-sm font-medium mb-2"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {showNotToday ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            Not Today ({overflow.length + Math.max(0, unplaced.length - 9)})
          </button>
          {showNotToday && (
            <div className="space-y-2 pl-2" style={{ borderLeft: '2px solid var(--color-border)' }}>
              {overflow.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isCompleting={isCompleting?.(task.id)}
                  onToggle={onToggle}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  compact
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
