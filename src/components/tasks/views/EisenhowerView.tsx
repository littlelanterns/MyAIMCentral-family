/**
 * EisenhowerView — PRD-09A View 2
 *
 * 2×2 grid: Do Now (urgent+important), Schedule (important),
 * Delegate (urgent), Eliminate (neither).
 * Tasks can be moved between quadrants via button controls.
 */

import { useState } from 'react'
import { TaskCard } from '../TaskCard'
import { EmptyState } from '@/components/shared'
import { Grid2x2, Plus } from 'lucide-react'
import type { Task } from '@/hooks/useTasks'

type EisenhowerQuadrant = 'do_now' | 'schedule' | 'delegate' | 'eliminate' | null

interface TaskWithQuadrant extends Task {
  eisenhower_quadrant?: EisenhowerQuadrant
}

interface EisenhowerViewProps {
  tasks: Task[]
  onToggle: (task: Task, origin?: { x: number; y: number }) => void
  onEdit?: (task: Task) => void
  onFocusTimer?: (task: Task) => void
  onBreakItDown?: (task: Task) => void
  onDelete?: (task: Task) => void
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void
  isCompleting?: (taskId: string) => boolean
}

const QUADRANTS = [
  {
    key: 'do_now' as EisenhowerQuadrant,
    label: 'Do Now',
    sublabel: 'Urgent + Important',
    borderColor: 'var(--color-error)',
    bgColor: 'color-mix(in srgb, var(--color-error) 6%, var(--color-bg-card))',
  },
  {
    key: 'schedule' as EisenhowerQuadrant,
    label: 'Schedule',
    sublabel: 'Important, Not Urgent',
    borderColor: 'var(--color-btn-primary-bg)',
    bgColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 6%, var(--color-bg-card))',
  },
  {
    key: 'delegate' as EisenhowerQuadrant,
    label: 'Delegate',
    sublabel: 'Urgent, Not Important',
    borderColor: 'var(--color-warning)',
    bgColor: 'color-mix(in srgb, var(--color-warning) 6%, var(--color-bg-card))',
  },
  {
    key: 'eliminate' as EisenhowerQuadrant,
    label: 'Eliminate',
    sublabel: 'Not Urgent, Not Important',
    borderColor: 'var(--color-text-secondary)',
    bgColor: 'var(--color-bg-card)',
  },
]

export function EisenhowerView({
  tasks,
  onToggle,
  onEdit,
  onFocusTimer,
  onBreakItDown,
  onDelete,
  onUpdateTask,
  isCompleting,
}: EisenhowerViewProps) {
  // Local state for quadrant overrides (persisted via onUpdateTask in real flow)
  const [localQuadrants, setLocalQuadrants] = useState<Record<string, EisenhowerQuadrant>>({})

  const getQuadrant = (task: TaskWithQuadrant): EisenhowerQuadrant => {
    return localQuadrants[task.id] ?? task.eisenhower_quadrant ?? null
  }

  const setQuadrant = (taskId: string, quadrant: EisenhowerQuadrant) => {
    setLocalQuadrants((prev) => ({ ...prev, [taskId]: quadrant }))
    onUpdateTask?.(taskId, { eisenhower_quadrant: quadrant } as Partial<Task>)
  }

  const unplaced = tasks.filter((t) => !getQuadrant(t) && t.status !== 'completed')

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<Grid2x2 size={36} />}
        title="No tasks to sort"
        description="Add tasks to organize them with the Eisenhower Matrix."
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* Unplaced tasks banner */}
      {unplaced.length > 0 && (
        <div
          className="p-3 rounded-lg"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px dashed var(--color-border)',
          }}
        >
          <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            {unplaced.length} task{unplaced.length > 1 ? 's' : ''} not yet placed — drag or use the
            quadrant buttons below each
          </p>
        </div>
      )}

      {/* 2x2 Grid */}
      <div className="grid grid-cols-2 gap-3">
        {QUADRANTS.map((q) => {
          const quadrantTasks = tasks.filter(
            (t) => getQuadrant(t) === q.key && t.status !== 'completed'
          )
          const completedInQuadrant = tasks.filter(
            (t) => getQuadrant(t) === q.key && t.status === 'completed'
          )

          return (
            <div
              key={q.key}
              className="rounded-lg p-3 min-h-[140px]"
              style={{
                backgroundColor: q.bgColor,
                border: `1.5px solid ${q.borderColor}`,
                borderRadius: 'var(--vibe-radius-card, 0.5rem)',
              }}
            >
              {/* Quadrant header */}
              <div className="mb-2">
                <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                  {q.label}
                </h3>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {q.sublabel}
                </p>
              </div>

              {/* Tasks */}
              <div className="space-y-1.5">
                {quadrantTasks.map((task) => (
                  <QuadrantTaskItem
                    key={task.id}
                    task={task}
                    currentQuadrant={q.key}
                    onToggle={onToggle}
                    onMove={setQuadrant}
                    isCompleting={isCompleting?.(task.id)}
                  />
                ))}
                {completedInQuadrant.map((task) => (
                  <QuadrantTaskItem
                    key={task.id}
                    task={task}
                    currentQuadrant={q.key}
                    onToggle={onToggle}
                    onMove={setQuadrant}
                    isCompleting={isCompleting?.(task.id)}
                  />
                ))}
              </div>

              {/* Add unplaced */}
              {unplaced.length > 0 && (
                <div className="mt-2 space-y-1">
                  {unplaced.slice(0, 2).map((task) => (
                    <button
                      key={task.id}
                      onClick={() => setQuadrant(task.id, q.key)}
                      className="w-full text-left px-2 py-1 rounded text-xs flex items-center gap-1.5 transition-colors"
                      style={{
                        color: 'var(--color-text-secondary)',
                        border: '1px dashed var(--color-border)',
                        backgroundColor: 'transparent',
                      }}
                    >
                      <Plus size={10} />
                      <span className="truncate">{task.title}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

interface QuadrantTaskItemProps {
  task: Task
  currentQuadrant: EisenhowerQuadrant
  onToggle: (task: Task, origin?: { x: number; y: number }) => void
  onMove: (taskId: string, quadrant: EisenhowerQuadrant) => void
  isCompleting?: boolean
}

function QuadrantTaskItem({
  task,
  currentQuadrant,
  onToggle,
  onMove,
  isCompleting,
}: QuadrantTaskItemProps) {
  const [showMoveMenu, setShowMoveMenu] = useState(false)
  const isCompleted = task.status === 'completed'
  const otherQuadrants = QUADRANTS.filter((q) => q.key !== currentQuadrant)

  return (
    <div className="relative">
      <div
        className="flex items-center gap-1.5 px-2 py-1.5 rounded"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          opacity: isCompleted ? 0.6 : 1,
        }}
      >
        {/* Quick checkbox */}
        <button
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            onToggle(task, { x: rect.left + 8, y: rect.top + 8 })
          }}
          disabled={isCompleting}
          style={{ flexShrink: 0, color: isCompleted ? 'var(--color-success)' : 'var(--color-text-secondary)' }}
        >
          {isCompleted ? '✓' : '○'}
        </button>

        <span
          className="flex-1 text-xs truncate"
          style={{
            color: isCompleted ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
            textDecoration: isCompleted ? 'line-through' : 'none',
          }}
        >
          {task.title}
        </span>

        {/* Move button */}
        {!isCompleted && (
          <button
            onClick={() => setShowMoveMenu(!showMoveMenu)}
            className="text-xs px-1 opacity-50 hover:opacity-100 flex-shrink-0"
            style={{ color: 'var(--color-text-secondary)' }}
            title="Move to another quadrant"
          >
            ↔
          </button>
        )}
      </div>

      {/* Move menu */}
      {showMoveMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowMoveMenu(false)} />
          <div
            className="absolute left-0 z-50 rounded shadow-lg overflow-hidden"
            style={{
              top: '100%',
              marginTop: 2,
              backgroundColor: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              minWidth: 140,
            }}
          >
            {otherQuadrants.map((q) => (
              <button
                key={q.key}
                onClick={() => {
                  onMove(task.id, q.key)
                  setShowMoveMenu(false)
                }}
                className="flex items-center gap-2 w-full px-3 py-2 text-xs text-left"
                style={{ color: 'var(--color-text-primary)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                Move to {q.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
