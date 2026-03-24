/**
 * PlayModeTimer — PRD-36
 *
 * Play-shell timer experience for young children. Two screens:
 *
 *   Screen 1 — Age Gate
 *     "How old are you?" with large tappable age buttons.
 *     Under 18 → friendly nudge to get a grown-up.
 *     18+ → full controls (edge-case adults using a child device).
 *
 *   Screen 2 — Mom Quick-Start Countdown
 *     Large preset duration buttons (parent sets the time for the child).
 *     Immediately starts a countdown session on tap.
 *     Visual timer fills/depletes using VisualTimer with showNumbers=false.
 *     Big "DONE!" celebration at 0.
 *
 * This is a speed bump, not security: age selection is useState only, never
 * persisted.
 */

import { useState, useEffect, useCallback } from 'react'
import { PartyPopper, RefreshCw, Clock } from 'lucide-react'
import { useTimerActions, useActiveTimers, useTimerTick } from './useTimer'
import { useTimerConfig } from './useTimer'
import { VisualTimer } from './VisualTimers'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import type { VisualTimerStyle } from './types'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const AGE_BUTTONS = [3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13] as const
type AgeOption = typeof AGE_BUTTONS[number] | '14-17' | '18+'

const PRESET_MINUTES = [1, 2, 5, 10, 15, 30] as const

// ---------------------------------------------------------------------------
// Screen 1 — Age Gate
// ---------------------------------------------------------------------------

interface AgeGateProps {
  onAgeSelected: (unlocked: boolean) => void
}

function AgeGate({ onAgeSelected }: AgeGateProps) {
  return (
    <div className="flex flex-col items-center gap-6 px-4 py-8 text-center">
      {/* Heading */}
      <div className="space-y-2">
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full"
          style={{ backgroundColor: 'var(--color-golden-honey, #f59e0b)', opacity: 0.9 }}
        >
          <Clock size={32} style={{ color: '#fff' }} />
        </div>
        <h2
          className="text-2xl font-bold"
          style={{ color: 'var(--color-text-primary, #111827)' }}
        >
          Timer Time!
        </h2>
        <p
          className="text-base"
          style={{ color: 'var(--color-text-muted, #6b7280)' }}
        >
          How old are you?
        </p>
      </div>

      {/* Age grid */}
      <div className="grid grid-cols-4 gap-3 w-full max-w-xs">
        {AGE_BUTTONS.map((age) => (
          <button
            key={age}
            onClick={() => onAgeSelected(false)}
            className="flex items-center justify-center rounded-2xl font-bold transition-all active:scale-95"
            style={{
              height: 56,
              fontSize: '1.25rem',
              backgroundColor: 'var(--color-surface-raised, #f9fafb)',
              color: 'var(--color-text-primary, #111827)',
              border: '2px solid var(--color-border, #e5e7eb)',
            }}
          >
            {age}
          </button>
        ))}
        {/* 14-17 button */}
        <button
          onClick={() => onAgeSelected(false)}
          className="col-span-2 flex items-center justify-center rounded-2xl font-bold transition-all active:scale-95"
          style={{
            height: 56,
            fontSize: '1rem',
            backgroundColor: 'var(--color-surface-raised, #f9fafb)',
            color: 'var(--color-text-primary, #111827)',
            border: '2px solid var(--color-border, #e5e7eb)',
          }}
        >
          14 – 17
        </button>
        {/* 18+ button */}
        <button
          onClick={() => onAgeSelected(true)}
          className="col-span-2 flex items-center justify-center rounded-2xl font-bold transition-all active:scale-95"
          style={{
            height: 56,
            fontSize: '1rem',
            backgroundColor: 'var(--color-surface-raised, #f9fafb)',
            color: 'var(--color-text-primary, #111827)',
            border: '2px solid var(--color-border, #e5e7eb)',
          }}
        >
          18+
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Under-18 message
// ---------------------------------------------------------------------------

interface UnderAgeMessageProps {
  onReset: () => void
}

function UnderAgeMessage({ onReset }: UnderAgeMessageProps) {
  return (
    <div className="flex flex-col items-center gap-6 px-6 py-10 text-center">
      {/* Friendly illustration placeholder */}
      <div
        className="flex h-24 w-24 items-center justify-center rounded-full text-5xl"
        style={{ backgroundColor: 'var(--color-surface-raised, #f9fafb)' }}
        aria-hidden="true"
      >
        ⏰
      </div>

      <div className="space-y-3 max-w-xs">
        <p
          className="text-xl font-bold leading-snug"
          style={{ color: 'var(--color-text-primary, #111827)' }}
        >
          Ask a grown-up to set up your timer!
        </p>
        <p
          className="text-base leading-relaxed"
          style={{ color: 'var(--color-text-muted, #6b7280)' }}
        >
          A mom, dad, or another adult can start the timer for you. Find someone to help!
        </p>
      </div>

      <button
        onClick={onReset}
        className="flex items-center gap-2 rounded-2xl px-6 py-3 font-semibold transition-all active:scale-95"
        style={{
          backgroundColor: 'var(--color-surface-raised, #f9fafb)',
          color: 'var(--color-text-muted, #6b7280)',
          border: '2px solid var(--color-border, #e5e7eb)',
        }}
      >
        <RefreshCw size={16} />
        Go back
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Countdown in-progress display
// ---------------------------------------------------------------------------

interface CountdownDisplayProps {
  sessionId: string
  targetMinutes: number
  visualStyle: VisualTimerStyle
  onDone: () => void
  onStop: () => void
}

function CountdownDisplay({
  sessionId,
  targetMinutes,
  visualStyle,
  onDone,
  onStop,
}: CountdownDisplayProps) {
  const { data: activeSessions = [] } = useActiveTimers()
  const ticks = useTimerTick(activeSessions)
  const { stopTimer } = useTimerActions()

  const tick = ticks.get(sessionId)
  const remaining = tick?.remaining ?? targetMinutes * 60
  const totalSeconds = targetMinutes * 60
  const progress = Math.min(1, Math.max(0, 1 - remaining / totalSeconds))
  const isDone = remaining <= 0

  // Fire onDone callback once when the countdown reaches zero
  useEffect(() => {
    if (isDone) {
      stopTimer(sessionId).catch(() => {})
      onDone()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDone])

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-8">
      {/* Visual timer — no raw numbers for kids */}
      <VisualTimer
        style={visualStyle}
        progress={progress}
        size={200}
        showNumbers={false}
      />

      {/* Time remaining (human-friendly label) */}
      <div
        className="rounded-2xl px-6 py-3 text-center"
        style={{
          backgroundColor: 'var(--color-surface-raised, #f9fafb)',
          minWidth: 120,
        }}
      >
        <p
          className="text-sm font-medium"
          style={{ color: 'var(--color-text-muted, #6b7280)' }}
        >
          Time left
        </p>
        <p
          className="text-3xl font-bold tabular-nums"
          style={{ color: 'var(--color-text-primary, #111827)' }}
        >
          {formatRemainingFriendly(Math.max(0, remaining))}
        </p>
      </div>

      {/* Stop button */}
      <button
        onClick={() => {
          stopTimer(sessionId).catch(() => {})
          onStop()
        }}
        className="rounded-2xl px-8 py-3 text-base font-semibold transition-all active:scale-95"
        style={{
          backgroundColor: 'var(--color-surface-raised, #f9fafb)',
          color: 'var(--color-text-muted, #6b7280)',
          border: '2px solid var(--color-border, #e5e7eb)',
        }}
      >
        Stop timer
      </button>
    </div>
  )
}

/** Format remaining seconds as "5:00" or "0:30" */
function formatRemainingFriendly(seconds: number): string {
  const s = Math.ceil(seconds)
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${String(sec).padStart(2, '0')}`
}

// ---------------------------------------------------------------------------
// Celebration screen
// ---------------------------------------------------------------------------

interface CelebrationProps {
  onReset: () => void
}

function Celebration({ onReset }: CelebrationProps) {
  return (
    <div className="flex flex-col items-center gap-6 px-6 py-10 text-center">
      <div
        className="flex h-24 w-24 items-center justify-center rounded-full"
        style={{ backgroundColor: 'var(--color-golden-honey, #f59e0b)', opacity: 0.9 }}
      >
        <PartyPopper size={40} style={{ color: '#fff' }} />
      </div>

      <div className="space-y-3">
        <p
          className="text-3xl font-bold"
          style={{ color: 'var(--color-text-primary, #111827)' }}
        >
          DONE!
        </p>
        <p
          className="text-lg leading-relaxed"
          style={{ color: 'var(--color-text-muted, #6b7280)' }}
        >
          Great job! Your timer is finished.
        </p>
      </div>

      <button
        onClick={onReset}
        className="flex items-center gap-2 rounded-2xl px-8 py-4 text-lg font-bold transition-all active:scale-95"
        style={{
          backgroundColor: 'var(--color-golden-honey, #f59e0b)',
          color: '#fff',
          minHeight: 56,
        }}
      >
        <RefreshCw size={20} />
        Start another timer
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Screen 2 — Mom Quick-Start Countdown
// ---------------------------------------------------------------------------

interface QuickStartProps {
  visualStyle: VisualTimerStyle
  activeSessionId: string | null
  onStart: (minutes: number) => void
  onDone: () => void
  onStop: () => void
  targetMinutes: number | null
}

function QuickStartScreen({
  visualStyle,
  activeSessionId,
  onStart,
  onDone,
  onStop,
  targetMinutes,
}: QuickStartProps) {
  const [customMinutes, setCustomMinutes] = useState('')

  const handleCustomStart = () => {
    const m = parseInt(customMinutes, 10)
    if (!isNaN(m) && m > 0) {
      onStart(m)
      setCustomMinutes('')
    }
  }

  // If a session is active, show the countdown
  if (activeSessionId && targetMinutes !== null) {
    return (
      <CountdownDisplay
        sessionId={activeSessionId}
        targetMinutes={targetMinutes}
        visualStyle={visualStyle}
        onDone={onDone}
        onStop={onStop}
      />
    )
  }

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-8">
      <div className="text-center space-y-1">
        <h2
          className="text-2xl font-bold"
          style={{ color: 'var(--color-text-primary, #111827)' }}
        >
          How long?
        </h2>
        <p
          className="text-sm"
          style={{ color: 'var(--color-text-muted, #6b7280)' }}
        >
          Tap a time to start the timer
        </p>
      </div>

      {/* Preset grid */}
      <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
        {PRESET_MINUTES.map((mins) => (
          <button
            key={mins}
            onClick={() => onStart(mins)}
            className="flex flex-col items-center justify-center rounded-2xl py-4 font-bold transition-all active:scale-95"
            style={{
              minHeight: 80,
              backgroundColor: 'var(--color-golden-honey, #f59e0b)',
              color: '#fff',
              border: 'none',
            }}
          >
            <span className="text-3xl leading-none">{mins}</span>
            <span className="text-xs mt-1 font-medium opacity-90">
              {mins === 1 ? 'minute' : 'minutes'}
            </span>
          </button>
        ))}
      </div>

      {/* Custom duration */}
      <div className="flex items-center gap-2 w-full max-w-xs">
        <input
          type="number"
          min={1}
          max={180}
          placeholder="Custom minutes"
          value={customMinutes}
          onChange={(e) => setCustomMinutes(e.target.value)}
          className="flex-1 rounded-2xl border px-4 py-3 text-base font-medium"
          style={{
            borderColor: 'var(--color-border, #e5e7eb)',
            color: 'var(--color-text-primary, #111827)',
            backgroundColor: 'var(--color-surface, #fff)',
            minHeight: 56,
          }}
          onKeyDown={(e) => { if (e.key === 'Enter') handleCustomStart() }}
        />
        <button
          onClick={handleCustomStart}
          disabled={!customMinutes || parseInt(customMinutes, 10) <= 0}
          className="rounded-2xl px-5 py-3 font-semibold transition-all active:scale-95 disabled:opacity-40"
          style={{
            backgroundColor: 'var(--color-golden-honey, #f59e0b)',
            color: '#fff',
            minHeight: 56,
          }}
        >
          Go!
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component — PlayModeTimer
// ---------------------------------------------------------------------------

type PlayScreen =
  | { name: 'age_gate' }
  | { name: 'under_age' }
  | { name: 'quick_start' }
  | { name: 'done' }

/**
 * PlayModeTimer
 *
 * Full Play-shell timer experience. Pass `memberId` to scope the active timer
 * lookup and the timer config to the correct Play-shell member. Defaults to
 * the authenticated member when omitted.
 */
export interface PlayModeTimerProps {
  memberId?: string
}

export function PlayModeTimer({ memberId }: PlayModeTimerProps) {
  const { data: currentMember } = useFamilyMember()
  const targetMemberId = memberId ?? currentMember?.id

  const { data: config } = useTimerConfig(targetMemberId)
  const { startTimer } = useTimerActions()

  const [screen, setScreen] = useState<PlayScreen>({ name: 'age_gate' })
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [targetMinutes, setTargetMinutes] = useState<number | null>(null)

  const visualStyle: VisualTimerStyle = config?.visual_timer_style ?? 'sand_timer'

  // ---- Age gate handlers --------------------------------------------------

  const handleAgeSelected = useCallback((unlocked: boolean) => {
    if (unlocked) {
      setScreen({ name: 'quick_start' })
    } else {
      setScreen({ name: 'under_age' })
    }
  }, [])

  const handleReset = useCallback(() => {
    setScreen({ name: 'age_gate' })
    setActiveSessionId(null)
    setTargetMinutes(null)
  }, [])

  // ---- Countdown handlers -------------------------------------------------

  const handleStart = useCallback(
    async (minutes: number) => {
      try {
        const session = await startTimer({
          mode: 'countdown',
          countdownTargetMinutes: minutes,
          isStandalone: true,
          standaloneLabel: `${minutes}m Play Timer`,
        })
        setActiveSessionId(session.id)
        setTargetMinutes(minutes)
      } catch (err) {
        console.error('PlayModeTimer: failed to start countdown', err)
      }
    },
    [startTimer]
  )

  const handleDone = useCallback(() => {
    setScreen({ name: 'done' })
    setActiveSessionId(null)
    setTargetMinutes(null)
  }, [])

  const handleStop = useCallback(() => {
    setScreen({ name: 'quick_start' })
    setActiveSessionId(null)
    setTargetMinutes(null)
  }, [])

  // ---- Render -------------------------------------------------------------

  return (
    <div
      className="w-full max-w-sm mx-auto"
      style={{ fontFamily: 'var(--font-family, inherit)' }}
    >
      {screen.name === 'age_gate' && (
        <AgeGate onAgeSelected={handleAgeSelected} />
      )}

      {screen.name === 'under_age' && (
        <UnderAgeMessage onReset={handleReset} />
      )}

      {screen.name === 'quick_start' && (
        <QuickStartScreen
          visualStyle={visualStyle}
          activeSessionId={activeSessionId}
          onStart={handleStart}
          onDone={handleDone}
          onStop={handleStop}
          targetMinutes={targetMinutes}
        />
      )}

      {screen.name === 'done' && (
        <Celebration onReset={handleReset} />
      )}
    </div>
  )
}

export default PlayModeTimer
