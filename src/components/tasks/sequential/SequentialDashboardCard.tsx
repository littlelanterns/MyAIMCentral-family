/**
 * Compact dashboard card for a sequential collection.
 *
 * Shows one card per collection with:
 *   - Collection title + progress (e.g., "3/32")
 *   - The current active item(s) with checkboxes
 *   - "Browse all" to expand the full list inline
 *   - Completed items shown with strikethrough + completion date
 *   - Un-complete via tap on completed items
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
  const [browsing, setBrowsing] = useState(false)

  const sorted = useMemo(
    () => [...tasks].sort((a, b) => (a.sequential_position ?? 0) - (b.sequential_position ?? 0)),
    [tasks],
  )

  const completed = sorted.filter(t => t.status === 'completed')
  const active = sorted.filter(t => t.sequential_is_active && t.status !== 'completed')
  const upcoming = sorted.filter(t => !t.sequential_is_active && t.status !== 'completed')

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setBrowsing(!browsing)}
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
          {completed.length}/{sorted.length}
        </span>
        {browsing ? (
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
            width: `${sorted.length > 0 ? (completed.length / sorted.length) * 100 : 0}%`,
            backgroundColor: 'var(--color-btn-primary-bg)',
            borderRadius: 2,
            transition: 'width 0.3s ease',
          }}
        />
      </div>

      {/* Active items — always visible */}
      {!browsing && active.length > 0 && (
        <div className="px-4 pb-3 space-y-1.5">
          {active.map(task => (
            <TaskRow
              key={task.id}
              task={task}
              onToggle={onToggle}
              isCompleting={isCompleting(task.id)}
              showPosition
              totalItems={sorted.length}
            />
          ))}
          {(upcoming.length > 0 || completed.length > 0) && (
            <button
              onClick={() => setBrowsing(true)}
              className="text-xs font-medium mt-1"
              style={{ color: 'var(--color-btn-primary-bg)' }}
            >
              Browse all {sorted.length} items
            </button>
          )}
        </div>
      )}

      {/* All done state */}
      {!browsing && active.length === 0 && completed.length === sorted.length && sorted.length > 0 && (
        <div className="px-4 pb-3">
          <p className="text-xs" style={{ color: 'var(--color-success, #22c55e)' }}>
            All {sorted.length} items complete!
          </p>
        </div>
      )}

      {/* Browse mode — full list */}
      {browsing && (
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
        onClick={(e) => onToggle(task, { x: e.clientX, y: e.clientY })}
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

      {/* Active badge (only in browse mode for non-completed) */}
      {showCompletionDate && !isDone && task.sequential_is_active && (
        <span
          className="text-xs px-1.5 py-0.5 rounded-full shrink-0"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)',
            color: 'var(--color-btn-primary-bg)',
            fontWeight: 500,
          }}
        >
          Next
        </span>
      )}
    </div>
  )
}
