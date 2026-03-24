/**
 * TimerProvider (PRD-36)
 *
 * Context provider that wraps at shell level. Manages active timer state,
 * exposes actions, and renders the FloatingBubble so it is always present
 * when a shell is mounted.
 *
 * Usage:
 *   Wrap your shell root with <TimerProvider>. The FloatingBubble renders
 *   automatically — you do not need to place it separately.
 */

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  useActiveTimers,
  useTimerActions,
  useTimerTick,
} from './useTimer'
import type { StartTimerOptions } from './useTimer'
import type { ActiveTimer, TimeSession } from './types'
import { FloatingBubble } from './FloatingBubble'

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

interface TimerContextType {
  /** All timers currently running (ended_at IS NULL) for this family. */
  activeTimers: ActiveTimer[]
  /** True while the initial query is loading. */
  isLoading: boolean
  /** Whether the MiniPanel is open. */
  showPanel: boolean
  setShowPanel: (show: boolean) => void
  /** Start a new timer session. */
  startTimer: (opts: StartTimerOptions) => Promise<TimeSession>
  /** Stop (close) a running session. */
  stopTimer: (sessionId: string) => Promise<void>
  /** Pause a running session (sets ended_at + auto_paused = true). */
  pauseTimer: (sessionId: string) => Promise<void>
}

const TimerContext = createContext<TimerContextType | null>(null)

// ---------------------------------------------------------------------------
// useTimerContext — consumed by FloatingBubble and MiniPanel
// ---------------------------------------------------------------------------

export function useTimerContext(): TimerContextType {
  const ctx = useContext(TimerContext)
  if (!ctx) {
    throw new Error('useTimerContext must be used inside <TimerProvider>')
  }
  return ctx
}

// ---------------------------------------------------------------------------
// Helper: compute display label from a session
// ---------------------------------------------------------------------------

function labelForSession(session: TimeSession): string {
  if (session.standalone_label) return session.standalone_label
  // If we ever wire task titles via a join, that would go here. For now
  // fall back to a human-readable mode name.
  switch (session.timer_mode) {
    case 'stopwatch':       return 'Stopwatch'
    case 'countdown':       return 'Countdown'
    case 'pomodoro_focus':  return 'Focus'
    case 'pomodoro_break':  return 'Break'
    case 'clock':           return 'Clock'
    default:                return 'Timer'
  }
}

// ---------------------------------------------------------------------------
// TimerProvider
// ---------------------------------------------------------------------------

interface TimerProviderProps {
  children: ReactNode
}

export function TimerProvider({ children }: TimerProviderProps) {
  const [showPanel, setShowPanel] = useState(false)

  // Raw sessions from Supabase (refetched every 5 s by useActiveTimers)
  const { data: sessions = [], isLoading } = useActiveTimers()

  // Live per-second ticks — one interval for all sessions
  const ticks = useTimerTick(sessions)

  // Mutation helpers
  const actions = useTimerActions()

  // Build the ActiveTimer[] array by merging sessions with their tick state.
  const activeTimers = useMemo<ActiveTimer[]>(() => {
    return sessions.map((session): ActiveTimer => {
      const tick = ticks.get(session.id) ?? { elapsed: 0, remaining: null }
      return {
        session,
        elapsed: tick.elapsed,
        remaining: tick.remaining,
        label: labelForSession(session),
      }
    })
  }, [sessions, ticks])

  const startTimer = useCallback(
    async (opts: StartTimerOptions): Promise<TimeSession> => {
      const session = await actions.startTimer(opts)
      return session
    },
    [actions]
  )

  const stopTimer = useCallback(
    async (sessionId: string): Promise<void> => {
      await actions.stopTimer(sessionId)
    },
    [actions]
  )

  const pauseTimer = useCallback(
    async (sessionId: string): Promise<void> => {
      await actions.pauseTimer(sessionId)
    },
    [actions]
  )

  const value: TimerContextType = useMemo(
    () => ({
      activeTimers,
      isLoading,
      showPanel,
      setShowPanel,
      startTimer,
      stopTimer,
      pauseTimer,
    }),
    [activeTimers, isLoading, showPanel, startTimer, stopTimer, pauseTimer]
  )

  return (
    <TimerContext.Provider value={value}>
      {children}
      {/* FloatingBubble is always rendered here so shells don't need to place it */}
      <FloatingBubble />
    </TimerContext.Provider>
  )
}
