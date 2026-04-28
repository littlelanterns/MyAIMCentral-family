/**
 * TaskCardPlay — PRD-09A Play Shell
 *
 * Large colorful task tiles with one-tap completion.
 * No metadata. No view toggle. Big tap targets (56px min).
 * Emoji used per Play shell rules.
 * Celebration animation on completion.
 */

import { useState } from 'react'
import { CheckCircle2, Circle, Play } from 'lucide-react'
import type { Task } from '@/hooks/useTasks'
import { useTaskPracticeAggregation } from '@/hooks/usePractice'
import { formatPracticeAggregation } from '@/lib/tasks/formatPracticeAggregation'

export interface TaskCardPlayProps {
  task: Task
  isCompleting?: boolean
  onToggle: (task: Task, origin?: { x: number; y: number }) => void
  /** Color index for tile accent — cycles through palette */
  colorIndex?: number
  /** Daily Progress Marking: "Worked on this today" action */
  onWorkedOnThis?: (task: Task) => void
}

// Play shell tile accent colors — icons use Lucide (no emoji per convention)
const TILE_COLORS = [
  { bg: 'var(--color-play-tile-1-bg, #FFF0D9)', border: 'var(--color-play-tile-1-border, #FFBE5C)' },
  { bg: 'var(--color-play-tile-2-bg, #E8F7F0)', border: 'var(--color-play-tile-2-border, #5CC8A0)' },
  { bg: 'var(--color-play-tile-3-bg, #F0E8FF)', border: 'var(--color-play-tile-3-border, #A87AEF)' },
  { bg: 'var(--color-play-tile-4-bg, #FFE8F0)', border: 'var(--color-play-tile-4-border, #F07AAF)' },
  { bg: 'var(--color-play-tile-5-bg, #E8F0FF)', border: 'var(--color-play-tile-5-border, #7AA8F0)' },
  { bg: 'var(--color-play-tile-6-bg, #F7F0E8)', border: 'var(--color-play-tile-6-border, #C8A05C)' },
]

export function TaskCardPlay({
  task,
  isCompleting = false,
  onToggle,
  colorIndex = 0,
  onWorkedOnThis,
}: TaskCardPlayProps) {
  const [isPressed, setIsPressed] = useState(false)
  const isCompleted = task.status === 'completed'
  const isTrackProgress = task.track_progress && !isCompleted
  const color = TILE_COLORS[colorIndex % TILE_COLORS.length]

  const { data: practiceAgg } = useTaskPracticeAggregation(
    task.track_progress ? task.id : undefined,
  )
  const aggText = practiceAgg
    ? formatPracticeAggregation(practiceAgg.totalSessions, task.track_duration ? practiceAgg.totalDurationMinutes : null)
    : ''

  return (
    <div className="flex flex-col">
      <button
        onPointerDown={() => setIsPressed(true)}
        onPointerUp={(e) => {
          setIsPressed(false)
          if (isCompleting) return
          if (isTrackProgress && onWorkedOnThis) {
            onWorkedOnThis(task)
            return
          }
          const rect = e.currentTarget.getBoundingClientRect()
          onToggle(task, {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          })
        }}
        onPointerLeave={() => setIsPressed(false)}
        disabled={isCompleting}
        className="w-full text-center transition-all select-none"
        style={{
          padding: '1.25rem 1rem',
          backgroundColor: isCompleted ? 'var(--color-play-completed-bg, #F0FFF4)' : color.bg,
          border: `2.5px solid ${isCompleted ? 'var(--color-play-completed-border, #5CC8A0)' : color.border}`,
          borderRadius: isTrackProgress ? '1.25rem 1.25rem 0 0' : '1.25rem',
          minHeight: 56,
          transform: isPressed ? 'scale(0.97)' : 'scale(1)',
          opacity: isCompleting ? 0.6 : isCompleted ? 0.75 : 1,
          cursor: isCompleting ? 'wait' : 'pointer',
          boxShadow: isPressed
            ? 'none'
            : `0 4px 12px color-mix(in srgb, ${color.border} 25%, transparent)`,
        }}
        aria-label={
          isTrackProgress
            ? `Worked on: ${task.title}`
            : isCompleted
            ? `${task.title} — done! Tap to undo`
            : `Complete: ${task.title}`
        }
      >
        <div className="mb-2" aria-hidden="true" style={{ color: isCompleted ? 'var(--color-play-completed-border, #5CC8A0)' : color.border }}>
          {isCompleted ? <CheckCircle2 size={28} /> : isTrackProgress ? <Play size={28} /> : <Circle size={28} />}
        </div>
        <p
          className="font-semibold text-sm leading-snug"
          style={{
            color: isCompleted ? 'var(--color-play-completed-text, #3D8A5F)' : 'var(--color-play-tile-text, #2D2D2D)',
            textDecoration: isCompleted ? 'line-through' : 'none',
          }}
        >
          {task.title}
        </p>
        {isCompleted && (
          <p className="text-xs mt-1" style={{ color: 'var(--color-play-completed-border, #5CC8A0)' }}>
            Great job!
          </p>
        )}
        {isTrackProgress && aggText && (
          <p className="text-xs mt-1" style={{ color: 'var(--color-play-tile-text, #2D2D2D)', opacity: 0.7 }}>
            {aggText}
          </p>
        )}
      </button>

      {/* Track-progress tasks get a separate "Done" button below the tile */}
      {isTrackProgress && (
        <button
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect()
            onToggle(task, { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
          }}
          className="w-full py-2 text-xs font-medium transition-colors select-none"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-play-completed-border, #5CC8A0) 15%, transparent)',
            color: 'var(--color-play-completed-text, #3D8A5F)',
            border: `2.5px solid ${color.border}`,
            borderTop: 'none',
            borderRadius: '0 0 1.25rem 1.25rem',
            minHeight: 40,
          }}
        >
          All done!
        </button>
      )}
    </div>
  )
}
