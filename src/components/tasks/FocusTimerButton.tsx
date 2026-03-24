/**
 * PRD-09A + PRD-36: Focus Timer integration for task cards.
 * Invokes the Universal Timer (PRD-36) with timer_mode='pomodoro_focus'
 * and attaches the task_id to the time_session.
 */

import { useState } from 'react'
import { Timer, Loader2 } from 'lucide-react'
import { useTimerActions } from '@/features/timer'

interface FocusTimerButtonProps {
  taskId: string
  taskTitle: string
  /** Compact icon-only variant for inline use */
  compact?: boolean
  onTimerStarted?: () => void
}

export function FocusTimerButton({
  taskId,
  taskTitle,
  compact = false,
  onTimerStarted,
}: FocusTimerButtonProps) {
  const { startTimer } = useTimerActions()
  const [starting, setStarting] = useState(false)

  async function handleStart() {
    setStarting(true)
    try {
      await startTimer({
        mode: 'pomodoro_focus',
        taskId,
        standaloneLabel: taskTitle,
      })
      onTimerStarted?.()
    } catch (err) {
      console.error('Failed to start focus timer:', err)
    } finally {
      setStarting(false)
    }
  }

  if (compact) {
    return (
      <button
        onClick={handleStart}
        disabled={starting}
        className="p-1.5 rounded-lg transition-colors hover:scale-105"
        style={{
          background: 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, transparent)',
          color: 'var(--color-btn-primary-bg)',
        }}
        title="Start Focus Timer"
      >
        {starting ? <Loader2 size={16} className="animate-spin" /> : <Timer size={16} />}
      </button>
    )
  }

  return (
    <button
      onClick={handleStart}
      disabled={starting}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
      style={{
        background: 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, transparent)',
        color: 'var(--color-btn-primary-bg)',
        border: '1px solid color-mix(in srgb, var(--color-btn-primary-bg) 20%, transparent)',
      }}
    >
      {starting ? <Loader2 size={14} className="animate-spin" /> : <Timer size={14} />}
      Focus Timer
    </button>
  )
}
