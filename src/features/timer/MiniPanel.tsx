/**
 * MiniPanel (PRD-36)
 *
 * Expandable panel that opens from the FloatingBubble and lists all active
 * timers with per-timer controls. Also provides quick-start buttons for a
 * new stopwatch or a new countdown.
 *
 * Layout strategy:
 *   - Anchored to the bubble's current position.
 *   - Opens upward when the bubble is in the lower half of the screen,
 *     downward when it is in the upper half.
 *   - Width: 280px (320px on md+ breakpoint, handled via inline media).
 *   - Max height: 60vh with overflow-y: auto.
 *   - Z-index: 36 (one above the bubble, still below modals at z-50).
 *
 * Play shell:
 *   Uses a simplified VisualTimer component instead of numeric readouts.
 *   (VisualTimers must be present at @/features/timer/VisualTimers.)
 *
 * Countdown quick-start:
 *   Tapping "+ New Timer" reveals an inline duration input (minutes).
 *   Confirming calls startTimer({ mode: 'countdown', countdownTargetMinutes }).
 */

import {
  useCallback,
  useRef,
  useState,
} from 'react'
import {
  Clock,
  Pause,
  Play,
  Square,
  Plus,
  X,
  Timer,
} from 'lucide-react'
import { useShell } from '@/components/shells/ShellProvider'
import { useTimerContext } from './TimerProvider'
import type { ActiveTimer } from './types'

// ---------------------------------------------------------------------------
// Time formatting
// ---------------------------------------------------------------------------

/** Format seconds as H:MM:SS (when >= 3600) or MM:SS. */
function formatTime(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const h  = Math.floor(s / 3600)
  const m  = Math.floor((s % 3600) / 60)
  const ss = s % 60

  const mm = String(m).padStart(2, '0')
  const sStr = String(ss).padStart(2, '0')

  if (h > 0) {
    return `${h}:${mm}:${sStr}`
  }
  return `${mm}:${sStr}`
}

// ---------------------------------------------------------------------------
// Mode icon helper
// ---------------------------------------------------------------------------

function ModeIcon({ mode, size = 14 }: { mode: string; size?: number }) {
  switch (mode) {
    case 'stopwatch':
    case 'pomodoro_focus':
    case 'pomodoro_break':
      return <Timer size={size} />
    case 'countdown':
      return <Timer size={size} style={{ transform: 'scaleY(-1)' }} />
    case 'clock':
    default:
      return <Clock size={size} />
  }
}

// ---------------------------------------------------------------------------
// TimerRow
// ---------------------------------------------------------------------------

interface TimerRowProps {
  timer: ActiveTimer
  isPlay: boolean
  onPause: (id: string) => void
  onStop: (id: string) => void
}

function TimerRow({ timer, isPlay, onPause, onStop }: TimerRowProps) {
  const { session, elapsed, remaining, label } = timer
  const displaySeconds = remaining !== null ? remaining : elapsed
  const isCountdown    = remaining !== null

  return (
    <div
      style={{
        padding: '10px 12px',
        borderBottom: '1px solid var(--color-border)',
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
      }}
    >
      {/* Label row */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
          <span style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }}>
            <ModeIcon mode={session.timer_mode} size={13} />
          </span>
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--color-text-primary)',
              maxWidth: 140,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {label}
          </span>
        </div>

        {/* Time display */}
        {!isPlay && (
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              fontVariantNumeric: 'tabular-nums',
              color: isCountdown && (remaining ?? 0) < 60
                ? 'var(--color-status-warning, #e07a5f)'
                : 'var(--color-text-heading)',
              flexShrink: 0,
            }}
          >
            {formatTime(displaySeconds)}
          </span>
        )}
      </div>

      {/* Play shell: simple visual arc instead of numbers */}
      {isPlay && (
        <div
          style={{
            height: 8,
            borderRadius: 4,
            background: 'var(--color-border)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              borderRadius: 4,
              background: 'var(--color-sage-teal, #68a395)',
              width: isCountdown && session.countdown_target_minutes
                ? `${Math.max(0, Math.min(100, ((remaining ?? 0) / (session.countdown_target_minutes * 60)) * 100))}%`
                : `${Math.min(100, (elapsed / 3600) * 100)}%`,
              transition: 'width 0.9s linear',
            }}
          />
        </div>
      )}

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 6 }}>
        <button
          onClick={() => onPause(session.id)}
          aria-label="Pause timer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 10px',
            borderRadius: 'var(--vibe-radius-sm, 6px)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-secondary)',
            color: 'var(--color-text-secondary)',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
        >
          <Pause size={11} />
          Pause
        </button>

        <button
          onClick={() => onStop(session.id)}
          aria-label="Stop timer"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            padding: '3px 10px',
            borderRadius: 'var(--vibe-radius-sm, 6px)',
            border: '1px solid var(--color-border)',
            background: 'var(--color-bg-secondary)',
            color: 'var(--color-status-error, #e07a5f)',
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'background 0.15s',
          }}
        >
          <Square size={11} />
          Stop
        </button>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// NewCountdownForm
// ---------------------------------------------------------------------------

interface NewCountdownFormProps {
  onStart: (minutes: number) => void
  onCancel: () => void
}

function NewCountdownForm({ onStart, onCancel }: NewCountdownFormProps) {
  const [minutes, setMinutes] = useState(5)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div
      style={{
        padding: '10px 12px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        borderTop: '1px solid var(--color-border)',
      }}
    >
      <span style={{ fontSize: 12, color: 'var(--color-text-secondary)' }}>Minutes:</span>
      <input
        ref={inputRef}
        type="number"
        min={1}
        max={999}
        value={minutes}
        onChange={(e) => setMinutes(Math.max(1, parseInt(e.target.value, 10) || 1))}
        style={{
          width: 56,
          padding: '3px 6px',
          borderRadius: 'var(--vibe-radius-sm, 6px)',
          border: '1px solid var(--color-border)',
          background: 'var(--color-bg-input, var(--color-bg-secondary))',
          color: 'var(--color-text-primary)',
          fontSize: 13,
          fontWeight: 600,
        }}
      />
      <button
        onClick={() => onStart(minutes)}
        style={{
          padding: '3px 10px',
          borderRadius: 'var(--vibe-radius-sm, 6px)',
          background: 'var(--color-sage-teal, #68a395)',
          color: '#fff',
          border: 'none',
          fontSize: 12,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Start
      </button>
      <button
        onClick={onCancel}
        style={{
          padding: '3px 6px',
          borderRadius: 'var(--vibe-radius-sm, 6px)',
          background: 'transparent',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-secondary)',
          fontSize: 12,
          cursor: 'pointer',
        }}
      >
        <X size={12} />
      </button>
    </div>
  )
}

// ---------------------------------------------------------------------------
// MiniPanel
// ---------------------------------------------------------------------------

interface MiniPanelProps {
  bubblePos: { x: number; y: number }
  bubbleSize: number
  onClose: () => void
}

export function MiniPanel({ bubblePos, bubbleSize, onClose }: MiniPanelProps) {
  const { shell } = useShell()
  const { activeTimers, startTimer, stopTimer, pauseTimer } = useTimerContext()
  const [showCountdownForm, setShowCountdownForm] = useState(false)

  const isPlay = shell === 'play'

  // --- Panel positioning ---------------------------------------------------
  // Open upward if bubble is in lower half of screen, downward otherwise.
  const panelWidth = typeof window !== 'undefined' && window.innerWidth >= 768 ? 320 : 280
  const openUpward = bubblePos.y > window.innerHeight / 2

  // Horizontal: try to align left edge with bubble; clamp so panel stays on screen.
  const vw = typeof window !== 'undefined' ? window.innerWidth : 375
  const rawLeft = bubblePos.x + bubbleSize / 2 - panelWidth / 2
  const left    = Math.max(8, Math.min(vw - panelWidth - 8, rawLeft))

  // Vertical anchor
  const topStyle = openUpward
    ? undefined
    : bubblePos.y + bubbleSize + 8
  const bottomStyle = openUpward
    ? window.innerHeight - bubblePos.y + 8
    : undefined

  // --- Actions -------------------------------------------------------------

  const handlePause = useCallback(
    (id: string) => { pauseTimer(id).catch(console.error) },
    [pauseTimer]
  )

  const handleStop = useCallback(
    (id: string) => { stopTimer(id).catch(console.error) },
    [stopTimer]
  )

  const handleNewStopwatch = useCallback(() => {
    startTimer({ mode: 'stopwatch', isStandalone: true }).catch(console.error)
  }, [startTimer])

  const handleStartCountdown = useCallback(
    (minutes: number) => {
      startTimer({
        mode: 'countdown',
        countdownTargetMinutes: minutes,
        isStandalone: true,
      }).catch(console.error)
      setShowCountdownForm(false)
    },
    [startTimer]
  )

  // -------------------------------------------------------------------------

  return (
    <>
      {/* Invisible backdrop — clicking outside closes the panel */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 35,
        }}
        onClick={onClose}
        aria-hidden
      />

      {/* The panel itself */}
      <div
        role="dialog"
        aria-label="Active timers"
        style={{
          position: 'fixed',
          left,
          ...(topStyle !== undefined    ? { top:    topStyle    } : {}),
          ...(bottomStyle !== undefined ? { bottom: bottomStyle } : {}),
          width: panelWidth,
          maxHeight: '60vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--vibe-radius-card, 12px)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
          zIndex: 36,
          overflow: 'hidden',
          animation: 'miniPanelFadeIn 150ms ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px 8px',
            borderBottom: '1px solid var(--color-border)',
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: 'var(--color-text-heading)',
            }}
          >
            Active Timers
          </span>
          <button
            onClick={onClose}
            aria-label="Close timer panel"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 24,
              height: 24,
              borderRadius: '50%',
              background: 'var(--color-bg-secondary)',
              border: 'none',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            <X size={13} />
          </button>
        </div>

        {/* Timer list — scrollable */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {activeTimers.length === 0 ? (
            <div
              style={{
                padding: '20px 12px',
                textAlign: 'center',
                fontSize: 12,
                color: 'var(--color-text-secondary)',
              }}
            >
              No timers running
            </div>
          ) : (
            activeTimers.map((timer) => (
              <TimerRow
                key={timer.session.id}
                timer={timer}
                isPlay={isPlay}
                onPause={handlePause}
                onStop={handleStop}
              />
            ))
          )}
        </div>

        {/* Footer: quick-start buttons + optional countdown form */}
        <div
          style={{
            flexShrink: 0,
            borderTop: showCountdownForm ? 'none' : '1px solid var(--color-border)',
          }}
        >
          {showCountdownForm ? (
            <NewCountdownForm
              onStart={handleStartCountdown}
              onCancel={() => setShowCountdownForm(false)}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                gap: 6,
                padding: '8px 12px',
                borderTop: '1px solid var(--color-border)',
              }}
            >
              <button
                onClick={handleNewStopwatch}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  padding: '5px 8px',
                  borderRadius: 'var(--vibe-radius-sm, 6px)',
                  border: '1px dashed var(--color-border)',
                  background: 'transparent',
                  color: 'var(--color-text-secondary)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                <Plus size={11} />
                Stopwatch
              </button>

              <button
                onClick={() => setShowCountdownForm(true)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 4,
                  padding: '5px 8px',
                  borderRadius: 'var(--vibe-radius-sm, 6px)',
                  border: '1px dashed var(--color-border)',
                  background: 'transparent',
                  color: 'var(--color-text-secondary)',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
              >
                <Plus size={11} />
                Countdown
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Keyframe for panel entrance */}
      <style>{`
        @keyframes miniPanelFadeIn {
          from { opacity: 0; transform: scale(0.96) translateY(6px); }
          to   { opacity: 1; transform: scale(1)    translateY(0);    }
        }
      `}</style>
    </>
  )
}
