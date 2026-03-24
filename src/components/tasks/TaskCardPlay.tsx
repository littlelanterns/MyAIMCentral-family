/**
 * TaskCardPlay — PRD-09A Play Shell
 *
 * Large colorful task tiles with one-tap completion.
 * No metadata. No view toggle. Big tap targets (56px min).
 * Emoji used per Play shell rules.
 * Celebration animation on completion.
 */

import { useState } from 'react'
import type { Task } from '@/hooks/useTasks'

export interface TaskCardPlayProps {
  task: Task
  isCompleting?: boolean
  onToggle: (task: Task, origin?: { x: number; y: number }) => void
  /** Color index for tile accent — cycles through palette */
  colorIndex?: number
}

// Play shell tile colors — warm, saturated, friendly
const TILE_COLORS = [
  { bg: '#FFF0D9', border: '#FFBE5C', icon: '⭐' },
  { bg: '#E8F7F0', border: '#5CC8A0', icon: '✅' },
  { bg: '#F0E8FF', border: '#A87AEF', icon: '🎯' },
  { bg: '#FFE8F0', border: '#F07AAF', icon: '🌸' },
  { bg: '#E8F0FF', border: '#7AA8F0', icon: '💙' },
  { bg: '#F7F0E8', border: '#C8A05C', icon: '🌟' },
]

export function TaskCardPlay({
  task,
  isCompleting = false,
  onToggle,
  colorIndex = 0,
}: TaskCardPlayProps) {
  const [isPressed, setIsPressed] = useState(false)
  const isCompleted = task.status === 'completed'
  const color = TILE_COLORS[colorIndex % TILE_COLORS.length]

  return (
    <button
      onPointerDown={() => setIsPressed(true)}
      onPointerUp={(e) => {
        setIsPressed(false)
        if (!isCompleting) {
          const rect = e.currentTarget.getBoundingClientRect()
          onToggle(task, {
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
          })
        }
      }}
      onPointerLeave={() => setIsPressed(false)}
      disabled={isCompleting}
      className="w-full text-center transition-all select-none"
      style={{
        padding: '1.25rem 1rem',
        backgroundColor: isCompleted ? '#F0FFF4' : color.bg,
        border: `2.5px solid ${isCompleted ? '#5CC8A0' : color.border}`,
        borderRadius: '1.25rem',
        minHeight: 56,
        transform: isPressed ? 'scale(0.97)' : 'scale(1)',
        opacity: isCompleting ? 0.6 : isCompleted ? 0.75 : 1,
        cursor: isCompleting ? 'wait' : 'pointer',
        boxShadow: isPressed
          ? 'none'
          : `0 4px 12px color-mix(in srgb, ${color.border} 25%, transparent)`,
      }}
      aria-label={isCompleted ? `${task.title} — done! Tap to undo` : `Complete: ${task.title}`}
    >
      <div className="text-2xl mb-2" aria-hidden="true">
        {isCompleted ? '✅' : color.icon}
      </div>
      <p
        className="font-semibold text-sm leading-snug"
        style={{
          color: isCompleted ? '#3D8A5F' : '#2D2D2D',
          textDecoration: isCompleted ? 'line-through' : 'none',
        }}
      >
        {task.title}
      </p>
      {isCompleted && (
        <p className="text-xs mt-1" style={{ color: '#5CC8A0' }}>
          Great job! 🎉
        </p>
      )}
    </button>
  )
}
