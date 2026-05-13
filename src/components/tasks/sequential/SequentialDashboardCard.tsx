/**
 * Compact dashboard card for a sequential collection.
 *
 * Collapsed (default): title + progress badge + the next uncompleted item with checkbox
 * Expanded: full browsable list with completion dates and un-complete
 */

import { useState, useMemo } from 'react'
import { BookOpen, ChevronDown, ChevronRight, Check } from 'lucide-react'
import type { Task } from '@/hooks/useTasks'
import type { SequentialCollection } from '@/types/tasks'

interface SequentialDashboardCardProps {
  collection: SequentialCollection
  tasks: Task[]
  onToggle: (task: Task, origin?: { x: number; y: number }) => void
  isCompleting: (taskId: string) => boolean
}

export function SequentialDashboardCard({
  collection,
  tasks,
  onToggle,
  isCompleting,
}: SequentialDashboardCardProps) {
  const [expanded, setExpanded] = useState(false)

  const sorted = useMemo(
    () => [...tasks].sort((a, b) => (a.sequential_position ?? 0) - (b.sequential_position ?? 0)),
    [tasks],
  )

  const completedCount = sorted.filter(t => t.status === 'completed').length
  const nextUp = sorted.filter(t => t.status !== 'completed')
  const activeCount = collection.allow_out_of_order ? sorted.length : (collection.active_count ?? 1)
  const visibleNext = nextUp.slice(0, Math.max(1, activeCount - (activeCount > 1 ? 0 : 0)))
  const allDone = completedCount === sorted.length && sorted.length > 0

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Header — always visible, toggles expand */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2.5 px-4 py-3 text-left"
      >
        <BookOpen size={18} style={{ color: 'var(--color-btn-primary-bg)' }} />
        <span className="flex-1 font-semibold text-sm" style={{ color: 'var(--color-text-heading)' }}>
          {collection.title}
        </span>
        <span
          className="text-xs px-2 py-0.5 rounded-full font-medium"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)',
            color: 'var(--color-btn-primary-bg)',
          }}
        >
          {completedCount}/{sorted.length}
        </span>
        {expanded ? (
          <ChevronDown size={14} style={{ color: 'var(--color-text-secondary)' }} />
        ) : (
          <ChevronRight size={14} style={{ color: 'var(--color-text-secondary)' }} />
        )}
      </button>

      {/* Progress bar */}
      <div className="mx-4 mb-2" style={{ height: 3, backgroundColor: 'var(--color-border)', borderRadius: 2 }}>
        <div
          style={{
            height: '100%',
            width: `${sorted.length > 0 ? (completedCount / sorted.length) * 100 : 0}%`,
            backgroundColor: 'var(--color-btn-primary-bg)',
            borderRadius: 2,
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Collapsed: show just the next assignment(s) */}
      {!expanded && !allDone && (
        <div className="px-4 pb-3 space-y-1.5">
          {visibleNext.slice(0, collection.allow_out_of_order ? 1 : activeCount).map(task => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={onToggle}
              isCompleting={isCompleting(task.id)}
              showPosition
              totalItems={sorted.length}
            />
          ))}
          <button
            onClick={(e) => { e.stopPropagation(); setExpanded(true) }}
            className="text-xs font-medium mt-0.5"
            style={{ color: 'var(--color-btn-primary-bg)' }}
          >
            View all {sorted.length} items
          </button>
        </div>
      )}

      {/* Collapsed: all done */}
      {!expanded && allDone && (
        <div className="px-4 pb-3">
          <p className="text-xs font-medium" style={{ color: 'var(--color-success, #22c55e)' }}>
            All {sorted.length} items complete!
          </p>
        </div>
      )}

      {/* Expanded: full browsable list */}
      {expanded && (
        <div className="px-4 pb-3 space-y-1">
          {sorted.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={onToggle}
              isCompleting={isCompleting(task.id)}
              showPosition
              showCompletionDate
              totalItems={sorted.length}
            />
          ))}
        </div>
      )}
    </div>
  )
}

function TaskRow({
  task,
  onToggle,
  isCompleting,
  showPosition,
  showCompletionDate,
  totalItems,
}: {
  task: Task
  onToggle: (task: Task, origin?: { x: number; y: number }) => void
  isCompleting: boolean
  showPosition?: boolean
  showCompletionDate?: boolean
  totalItems?: number
}) {
  const isDone = task.status === 'completed'
  const position = (task.sequential_position ?? 0) + 1

  return (
    <div
      className="flex items-center gap-2.5 py-1.5 rounded-lg px-2 -mx-2 transition-colors"
      style={{
        opacity: isCompleting ? 0.5 : 1,
        backgroundColor: isDone ? 'color-mix(in srgb, var(--color-success, #22c55e) 5%, transparent)' : 'transparent',
      }}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(task, { x: e.clientX, y: e.clientY }) }}
        disabled={isCompleting}
        className="flex items-center justify-center shrink-0 rounded-md transition-colors"
        style={{
          width: 22,
          height: 22,
          border: isDone ? 'none' : '2px solid var(--color-border)',
          backgroundColor: isDone ? 'var(--color-success, #22c55e)' : 'transparent',
        }}
        title={isDone ? 'Mark as not done' : 'Mark as done'}
      >
        {isDone && <Check size={14} style={{ color: '#fff' }} />}
      </button>

      {/* Position number */}
      {showPosition && (
        <span
          className="text-xs font-medium shrink-0"
          style={{
            color: 'var(--color-text-secondary)',
            width: totalItems && totalItems >= 10 ? 20 : 14,
            textAlign: 'right',
          }}
        >
          {position}
        </span>
      )}

      {/* Title + description */}
      <div className="flex-1 min-w-0">
        <span
          className="text-sm block truncate"
          style={{
            color: isDone ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
            textDecoration: isDone ? 'line-through' : 'none',
          }}
        >
          {task.title}
        </span>
        {task.description && (
          <span className="text-xs block truncate" style={{ color: 'var(--color-text-secondary)' }}>
            {task.description}
          </span>
        )}
      </div>

      {/* Completion date */}
      {showCompletionDate && isDone && task.completed_at && (
        <span className="text-xs shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
          {new Date(task.completed_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
        </span>
      )}
    </div>
  )
}
