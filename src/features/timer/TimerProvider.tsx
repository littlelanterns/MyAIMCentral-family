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
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import {
  useActiveTimers,
  useTimerActions,
  useTimerConfig,
  useTimerTick,
} from './useTimer'
import type { StartTimerOptions } from './useTimer'
import type { ActiveTimer, TimeSession } from './types'
import { useShell } from '@/components/shells/ShellProvider'
import { FloatingBubble } from './FloatingBubble'

// ---------------------------------------------------------------------------
// Context shape
// ---------------------------------------------------------------------------

/** Idle reminder state for a single session. */
export interface IdleReminder {
  sessionId: string
  label: string
}

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
  /** Idle reminders that should be shown as dismissible toasts/banners. */
  idleReminders: IdleReminder[]
  /** Dismiss an idle reminder for a session. */
  dismissIdleReminder: (sessionId: string) => void
  /**
   * Returns true if the given session is a pomodoro break that cannot be
   * dismissed early (Guided/Play shell with pomodoro_break_required config).
   */
  isBreakEnforced: (sessionId: string) => boolean
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
  const { shell } = useShell()

  // Raw sessions from Supabase (refetched every 5 s by useActiveTimers)
  const { data: sessions = [], isLoading } = useActiveTimers()

  // Timer config for the current member (idle thresholds, auto-pause, break enforcement)
  const { data: timerConfig } = useTimerConfig()

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

  // ---- Idle reminder state (Issue #4) ------------------------------------

  const [idleReminders, setIdleReminders] = useState<IdleReminder[]>([])
  // Track last reminder timestamp per session to respect idle_repeat_minutes
  const lastIdleReminderRef = useRef<Map<string, number>>(new Map())

  const dismissIdleReminder = useCallback((sessionId: string) => {
    setIdleReminders((prev) => prev.filter((r) => r.sessionId !== sessionId))
    // Push the "last reminded" time forward so the repeat interval restarts
    lastIdleReminderRef.current.set(sessionId, Date.now())
  }, [])

  // ---- Auto-pause tracking (Issue #5) ------------------------------------
  // Track which sessions have already been auto-paused so we don't repeat
  const autoPausedRef = useRef<Set<string>>(new Set())

  // ---- Idle + auto-pause check effect (runs every tick via activeTimers) --
  useEffect(() => {
    const idleThreshold = timerConfig?.idle_reminder_minutes ?? 45
    const idleRepeat = timerConfig?.idle_repeat_minutes ?? 60
    const autoPauseMinutes = timerConfig?.auto_pause_minutes ?? 0 // 0 = disabled

    const now = Date.now()
    const newReminders: IdleReminder[] = []

    for (const timer of activeTimers) {
      const { session, elapsed, label } = timer
      const sid = session.id

      // --- Issue #5: Auto-pause check ---
      if (
        autoPauseMinutes > 0 &&
        elapsed > autoPauseMinutes * 60 &&
        !autoPausedRef.current.has(sid)
      ) {
        autoPausedRef.current.add(sid)
        actions.pauseTimer(sid).catch(console.error)
        continue // Skip idle check — session is being paused
      }

      // --- Issue #4: Idle reminder check ---
      if (idleThreshold > 0 && elapsed > idleThreshold * 60) {
        const lastReminded = lastIdleReminderRef.current.get(sid) ?? 0
        const repeatMs = idleRepeat * 60 * 1000
        if (now - lastReminded >= repeatMs) {
          lastIdleReminderRef.current.set(sid, now)
          newReminders.push({ sessionId: sid, label })
        }
      }
    }

    if (newReminders.length > 0) {
      setIdleReminders((prev) => {
        // Merge, avoiding duplicates
        const existing = new Set(prev.map((r) => r.sessionId))
        const merged = [...prev]
        for (const nr of newReminders) {
          if (!existing.has(nr.sessionId)) {
            merged.push(nr)
          }
        }
        return merged
      })
    }

    // Clean up stale reminders for sessions that no longer exist
    const activeIds = new Set(activeTimers.map((t) => t.session.id))
    setIdleReminders((prev) => prev.filter((r) => activeIds.has(r.sessionId)))

    // Clean up auto-pause tracking for sessions that ended
    for (const sid of autoPausedRef.current) {
      if (!activeIds.has(sid)) autoPausedRef.current.delete(sid)
    }
  }, [activeTimers, timerConfig, actions])

  // ---- Issue #6: Break enforcement ---------------------------------------

  const isBreakEnforced = useCallback(
    (sessionId: string): boolean => {
      const timer = activeTimers.find((t) => t.session.id === sessionId)
      if (!timer) return false
      if (timer.session.timer_mode !== 'pomodoro_break') return false
      // Only enforce in guided/play shells
      if (shell !== 'guided' && shell !== 'play') return false
      // Check if config requires break enforcement (default false)
      return timerConfig?.pomodoro_break_required ?? false
    },
    [activeTimers, shell, timerConfig]
  )

  // ---- Actions -----------------------------------------------------------

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
      idleReminders,
      dismissIdleReminder,
      isBreakEnforced,
    }),
    [activeTimers, isLoading, showPanel, startTimer, stopTimer, pauseTimer, idleReminders, dismissIdleReminder, isBreakEnforced]
  )

  return (
    <TimerContext.Provider value={value}>
      {children}
      {/* FloatingBubble is always rendered here so shells don't need to place it */}
      <FloatingBubble />
      {/* Idle reminder banners (Issue #4) */}
      {idleReminders.length > 0 && (
        <IdleReminderBanner
          reminders={idleReminders}
          onDismiss={dismissIdleReminder}
        />
      )}
    </TimerContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// IdleReminderBanner — simple fixed-position dismissible banner (Issue #4)
// ---------------------------------------------------------------------------

interface IdleReminderBannerProps {
  reminders: IdleReminder[]
  onDismiss: (sessionId: string) => void
}

function IdleReminderBanner({ reminders, onDismiss }: IdleReminderBannerProps) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 12,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 45,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxWidth: 360,
        width: 'calc(100% - 32px)',
      }}
    >
      {reminders.map((r) => (
        <div
          key={r.sessionId}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 10,
            padding: '10px 14px',
            borderRadius: 'var(--vibe-radius-card, 10px)',
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-warning, #f59e0b)',
            boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
            fontSize: 13,
            color: 'var(--color-text-primary)',
          }}
        >
          <span style={{ flex: 1 }}>
            Timer <strong>{r.label}</strong> has been running a while. Still going?
          </span>
          <button
            onClick={() => onDismiss(r.sessionId)}
            style={{
              padding: '4px 10px',
              borderRadius: 'var(--vibe-radius-sm, 6px)',
              border: '1px solid var(--color-border)',
              background: 'var(--color-bg-secondary)',
              color: 'var(--color-text-secondary)',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
              flexShrink: 0,
            }}
          >
            Dismiss
          </button>
        </div>
      ))}
    </div>
  )
}
