/**
 * PlayTaskTileGrid — Build M Sub-phase B
 *
 * Responsive grid wrapper for PlayTaskTile. Splits the task list into
 * pending and completed lanes:
 *   • Pending tiles render in the main 2-col (phone) / 3-col (tablet)
 *     / 4-col (desktop) grid
 *   • Completed tiles slide into a compact "Done today" row below at
 *     the same per-tile size, with reduced opacity (handled by the tile)
 *
 * Sub-phase C will wire the gamification hooks; Sub-phase B just renders
 * the layout and forwards taps to the parent's onComplete handler.
 */

import { useMemo } from 'react'
import { PlayTaskTile } from './PlayTaskTile'
import { usePlayTaskIcons } from '@/hooks/usePlayTaskIcons'
import type { Task } from '@/types/tasks'

interface PlayTaskTileGridProps {
  tasks: Task[]
  completingTaskIds: Set<string>
  onTapTask: (task: Task) => void
}

export function PlayTaskTileGrid({
  tasks,
  completingTaskIds,
  onTapTask,
}: PlayTaskTileGridProps) {
  // Resolve icon URLs in one batch (no N+1)
  const { iconUrls } = usePlayTaskIcons(tasks)

  // Split into pending vs completed
  const { pending, completed } = useMemo(() => {
    const p: Task[] = []
    const c: Task[] = []
    for (const task of tasks) {
      if (task.status === 'completed' || task.status === 'pending_approval') {
        c.push(task)
      } else {
        p.push(task)
      }
    }
    return { pending: p, completed: c }
  }, [tasks])

  if (tasks.length === 0) {
    return (
      <div
        style={{
          padding: '2rem 1rem',
          textAlign: 'center',
          borderRadius: 'var(--vibe-radius-card, 1rem)',
          backgroundColor: 'var(--color-bg-card)',
          border: '1px dashed var(--color-border)',
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--font-size-sm)',
        }}
      >
        No tasks for today. Take it easy!
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {pending.length > 0 && (
        <section>
          <h2
            style={{
              margin: '0 0 0.5rem 0',
              fontSize: 'var(--font-size-base)',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
            }}
          >
            What's next
          </h2>
          <div className="play-tile-grid">
            {pending.map(task => (
              <PlayTaskTile
                key={task.id}
                task={task}
                iconUrl={iconUrls[task.id] ?? null}
                isCompleting={completingTaskIds.has(task.id)}
                onTap={onTapTask}
              />
            ))}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <h2
            style={{
              margin: '0 0 0.5rem 0',
              fontSize: 'var(--font-size-base)',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
            }}
          >
            Done today
          </h2>
          <div className="play-tile-grid">
            {completed.map(task => (
              <PlayTaskTile
                key={task.id}
                task={task}
                iconUrl={iconUrls[task.id] ?? null}
                isCompleting={false}
                onTap={onTapTask}
              />
            ))}
          </div>
        </section>
      )}

      <style>{`
        .play-tile-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 0.75rem;
        }
        @media (min-width: 640px) {
          .play-tile-grid {
            grid-template-columns: repeat(3, minmax(0, 1fr));
          }
        }
        @media (min-width: 1024px) {
          .play-tile-grid {
            grid-template-columns: repeat(4, minmax(0, 1fr));
          }
        }
      `}</style>
    </div>
  )
}
