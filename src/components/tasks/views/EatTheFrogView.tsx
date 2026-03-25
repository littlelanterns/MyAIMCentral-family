/**
 * EatTheFrogView — PRD-09A View 3
 *
 * Single highlighted "frog" card (rank 1, accent border) at top.
 * Remaining tasks ranked below.
 * Do the hardest thing first.
 */

import { useState } from 'react'
import { Target } from 'lucide-react'
import { TaskCard } from '../TaskCard'
import { EmptyState } from '@/components/shared'
import type { Task } from '@/hooks/useTasks'

interface TaskWithFrogRank extends Task {
  frog_rank: number | null
}

interface EatTheFrogViewProps {
  tasks: Task[]
  onToggle: (task: Task, origin?: { x: number; y: number }) => void
  onEdit?: (task: Task) => void
  onFocusTimer?: (task: Task) => void
  onBreakItDown?: (task: Task) => void
  onDelete?: (task: Task) => void
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void
  isCompleting?: (taskId: string) => boolean
}

export function EatTheFrogView({
  tasks,
  onToggle,
  onEdit,
  onFocusTimer,
  onBreakItDown,
  onDelete,
  onUpdateTask,
  isCompleting,
}: EatTheFrogViewProps) {
  const activeTasks = tasks.filter((t) => t.status !== 'completed')
  const completedTasks = tasks.filter((t) => t.status === 'completed')

  // Sort by frog_rank, nulls last
  const [localRanks, setLocalRanks] = useState<Record<string, number>>({})

  const getRank = (task: TaskWithFrogRank): number => {
    return localRanks[task.id] ?? task.frog_rank ?? 999
  }

  const sortedActive = [...activeTasks].sort((a, b) => getRank(a) - getRank(b))

  const frog = sortedActive[0] ?? null
  const rest = sortedActive.slice(1)

  const promoteToFrog = (taskId: string) => {
    const ranks: Record<string, number> = {}
    sortedActive.forEach((t, i) => {
      ranks[t.id] = t.id === taskId ? 1 : i + 2
    })
    setLocalRanks(ranks)
    onUpdateTask?.(taskId, { frog_rank: 1 } as Partial<Task>)
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<Target size={36} style={{ color: 'var(--color-btn-primary-bg)' }} />}
        title="No frogs today"
        description="Add tasks to identify your most important one."
      />
    )
  }

  return (
    <div className="space-y-4">
      {/* The Frog */}
      {frog && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Target size={20} style={{ color: 'var(--color-btn-primary-bg)' }} />
            <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
              Eat This Frog First
            </h3>
          </div>
          <div
            className="rounded-xl overflow-hidden"
            style={{
              border: '2px solid var(--color-btn-primary-bg)',
              boxShadow: '0 2px 12px color-mix(in srgb, var(--color-btn-primary-bg) 20%, transparent)',
            }}
          >
            <TaskCard
              task={frog}
              isCompleting={isCompleting?.(frog.id)}
              onToggle={onToggle}
              onEdit={onEdit}
              onFocusTimer={onFocusTimer}
              onBreakItDown={onBreakItDown}
              onDelete={onDelete}
            />
          </div>
        </div>
      )}

      {/* Remaining ranked tasks */}
      {rest.length > 0 && (
        <div>
          <h3 className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            After the Frog
          </h3>
          <div className="space-y-2">
            {rest.map((task, i) => (
              <div key={task.id} className="flex items-center gap-2">
                <span
                  className="text-sm font-bold w-5 text-right flex-shrink-0"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {i + 2}
                </span>
                <div className="flex-1">
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
                </div>
                <button
                  onClick={() => promoteToFrog(task.id)}
                  className="text-xs px-2 py-1 rounded flex-shrink-0"
                  style={{
                    color: 'var(--color-btn-primary-bg)',
                    border: '1px solid var(--color-btn-primary-bg)',
                    backgroundColor: 'transparent',
                  }}
                  title="Make this the frog"
                >
                  <Target size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Completed */}
      {completedTasks.length > 0 && (
        <div>
          <h3 className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Done
          </h3>
          <div className="space-y-2">
            {completedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isCompleting={isCompleting?.(task.id)}
                onToggle={onToggle}
                compact
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
