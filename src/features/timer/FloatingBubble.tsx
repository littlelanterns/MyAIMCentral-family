/**
 * FloatingBubble (PRD-36)
 *
 * A persistent draggable circle that indicates how many timers are running.
 * Tapping it opens the MiniPanel. Hidden when there are no active timers.
 *
 * Z-index: 35 — sits above QuickTasks (z-30) and below drawers/modals (z-50).
 *
 * Drag behavior:
 *   - Mouse: mousedown → mousemove → mouseup (document-level listeners)
 *   - Touch: touchstart → touchmove → touchend
 *   - On release, snaps to the nearest screen edge with 8px inset.
 *   - Position is client-side only (not persisted to server).
 *
 * Default position: bottom-right.
 *   - Mobile:   right 16px, bottom 80px (clears BottomNav at 56px + 8px gap)
 *   - Desktop:  right 16px, bottom 16px
 */

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { Clock } from 'lucide-react'
import { useShell } from '@/components/shells/ShellProvider'
import { useTimerContext } from './TimerProvider'
import { MiniPanel } from './MiniPanel'

// ---------------------------------------------------------------------------
// Position helpers
// ---------------------------------------------------------------------------

interface Position {
  /** Distance from left edge (px). We store left+top to simplify arithmetic. */
  x: number
  /** Distance from top edge (px). */
  y: number
}

/** Size of the bubble in pixels. */
function bubbleSize(isPlay: boolean, isResting: boolean): number {
  if (isResting) return 36
  return isPlay ? 56 : 48
}

/** Snap the given position to the nearest screen edge with 8px inset. */
function snapToEdge(pos: Position, size: number): Position {
  const vw = window.innerWidth
  const vh = window.innerHeight

  const centerX = pos.x + size / 2
  const centerY = pos.y + size / 2

  const distLeft   = centerX
  const distRight  = vw - centerX
  const distTop    = centerY
  const distBottom = vh - centerY

  const minDist = Math.min(distLeft, distRight, distTop, distBottom)
  const inset = 8

  if (minDist === distLeft)   return { x: inset,                 y: Math.max(inset, Math.min(vh - size - inset, pos.y)) }
  if (minDist === distRight)  return { x: vw - size - inset,     y: Math.max(inset, Math.min(vh - size - inset, pos.y)) }
  if (minDist === distTop)    return { x: Math.max(inset, Math.min(vw - size - inset, pos.x)), y: inset }
  /* distBottom */             return { x: Math.max(inset, Math.min(vw - size - inset, pos.x)), y: vh - size - inset }
}

/** Compute the default (bottom-right) starting position. */
function defaultPosition(size: number, isMobile: boolean): Position {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const bottomClear = isMobile ? 80 : 16   // clear BottomNav on mobile
  return {
    x: vw - size - 16,
    y: vh - size - bottomClear,
  }
}

/** Velocity threshold (px/ms) for swipe-away gesture. */
const SWIPE_VELOCITY_THRESHOLD = 0.8

/** Long press duration in ms. */
const LONG_PRESS_MS = 500

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FloatingBubble() {
  const { shell } = useShell()
  const { activeTimers, showPanel, setShowPanel } = useTimerContext()

  const isPlay    = shell === 'play'
  const isResting = activeTimers.length === 0
  const size      = bubbleSize(isPlay, isResting)
  const isMobile  = typeof window !== 'undefined' && window.innerWidth < 768

  // Position state — lazily initialised from window dimensions.
  const [pos, setPos] = useState<Position>(() =>
    typeof window !== 'undefined'
      ? defaultPosition(size, isMobile)
      : { x: 0, y: 0 }
  )

  // Swipe-away hidden state: when true, show tiny restore dot instead of bubble.
  const [hidden, setHidden] = useState(false)

  // Dragging state kept in a ref so event handlers don't stale-close over it.
  const dragging = useRef(false)
  const dragStart = useRef<{ pointerX: number; pointerY: number; posX: number; posY: number; time: number } | null>(null)
  const moved = useRef(false)

  // Long press timer ref
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTriggered = useRef(false)

  // Re-snap to edge when window resizes (orientation change, etc.)
  useEffect(() => {
    function onResize() {
      setPos((prev) => snapToEdge(prev, size))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [size])

  // When timers become active again, restore bubble if it was swiped away.
  useEffect(() => {
    if (activeTimers.length > 0 && hidden) {
      setHidden(false)
    }
  }, [activeTimers.length, hidden])

  // -------------------------------------------------------------------
  // Pointer-based drag (works for mouse and touch via pointer events)
  // -------------------------------------------------------------------

  const clearLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      // Only primary pointer (left-click / single touch)
      if (e.button !== 0 && e.pointerType === 'mouse') return

      e.currentTarget.setPointerCapture(e.pointerId)
      dragging.current = true
      moved.current = false
      longPressTriggered.current = false
      dragStart.current = {
        pointerX: e.clientX,
        pointerY: e.clientY,
        posX: pos.x,
        posY: pos.y,
        time: Date.now(),
      }

      // Start long press timer
      clearLongPress()
      longPressTimer.current = setTimeout(() => {
        if (!moved.current) {
          longPressTriggered.current = true
          setShowPanel(true)
        }
      }, LONG_PRESS_MS)
    },
    [pos, clearLongPress, setShowPanel]
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!dragging.current || !dragStart.current) return

      const dx = e.clientX - dragStart.current.pointerX
      const dy = e.clientY - dragStart.current.pointerY

      // Only start moving after 4px threshold to distinguish tap from drag
      if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return
      moved.current = true
      clearLongPress()

      const vw = window.innerWidth
      const vh = window.innerHeight
      setPos({
        x: Math.max(-size / 2, Math.min(vw - size / 2, dragStart.current.posX + dx)),
        y: Math.max(-size / 2, Math.min(vh - size / 2, dragStart.current.posY + dy)),
      })
    },
    [size, clearLongPress]
  )

  const onPointerUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!dragging.current) return
      dragging.current = false
      clearLongPress()

      if (moved.current && dragStart.current) {
        // Check for swipe-away: fast velocity or past screen edge
        const dt = Math.max(1, Date.now() - dragStart.current.time)
        const dx = e.clientX - dragStart.current.pointerX
        const dy = e.clientY - dragStart.current.pointerY
        const dist = Math.sqrt(dx * dx + dy * dy)
        const velocity = dist / dt

        const vw = window.innerWidth
        const vh = window.innerHeight
        const currentX = dragStart.current.posX + dx
        const currentY = dragStart.current.posY + dy
        const pastEdge = currentX < -size / 4 || currentX > vw - size / 4 ||
                         currentY < -size / 4 || currentY > vh - size / 4

        if (velocity > SWIPE_VELOCITY_THRESHOLD || pastEdge) {
          // Swipe away — hide the bubble
          setHidden(true)
          // Reset position for when it comes back
          setPos(defaultPosition(size, isMobile))
        } else {
          // Normal drag — snap to nearest edge
          setPos((prev) => snapToEdge(prev, size))
        }
      } else if (!longPressTriggered.current) {
        // It was a tap (not long press) — toggle the panel
        setShowPanel(!showPanel)
      }

      dragStart.current = null
    },
    [size, isMobile, showPanel, setShowPanel, clearLongPress]
  )

  // -------------------------------------------------------------------
  // Render — swiped-away restore dot
  // -------------------------------------------------------------------

  if (hidden) {
    return (
      <button
        onClick={() => setHidden(false)}
        aria-label="Restore timer bubble"
        style={{
          position: 'fixed',
          right: 4,
          bottom: isMobile ? 72 : 12,
          width: 12,
          height: 12,
          borderRadius: '50%',
          background: 'var(--color-sage-teal, #68a395)',
          border: 'none',
          opacity: 0.6,
          cursor: 'pointer',
          zIndex: 35,
          padding: 0,
          touchAction: 'none',
        }}
      />
    )
  }

  // -------------------------------------------------------------------
  // Render — resting state (no active timers) or active state
  // -------------------------------------------------------------------

  const isRunning = activeTimers.length > 0

  return (
    <>
      {/* The bubble button */}
      <button
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        aria-label={
          isResting
            ? 'Timer — no timers running. Tap to start a timer.'
            : `Timer — ${activeTimers.length} active. Tap to ${showPanel ? 'close' : 'open'} panel.`
        }
        style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y,
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'var(--color-sage-teal, #68a395)',
          color: 'var(--color-text-on-primary, #fff)',
          border: 'none',
          cursor: dragging.current ? 'grabbing' : 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 35,
          boxShadow: isResting ? '0 2px 8px rgba(0,0,0,0.12)' : '0 4px 16px rgba(0,0,0,0.22)',
          opacity: isResting ? 0.5 : 1,
          touchAction: 'none',   // prevent scroll-hijack during drag
          userSelect: 'none',
          WebkitUserSelect: 'none',
          transition: dragging.current ? 'none' : 'box-shadow 0.2s ease, opacity 0.2s ease, width 0.2s ease, height 0.2s ease',
          animation: isRunning ? 'timerBubblePulse 2.4s ease-in-out infinite' : 'none',
        }}
      >
        <Clock size={isResting ? 16 : isPlay ? 24 : 20} strokeWidth={2} />

        {/* Badge: active timer count — only when timers are running */}
        {isRunning && (
          <span
            aria-hidden
            style={{
              position: 'absolute',
              top: -4,
              right: -4,
              minWidth: 18,
              height: 18,
              borderRadius: 9,
              background: 'var(--color-golden, #d4a017)',
              color: 'var(--color-text-on-primary, #fff)',
              fontSize: 10,
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              paddingInline: 4,
              border: '2px solid var(--color-bg-primary, #fff)',
              lineHeight: 1,
            }}
          >
            {activeTimers.length}
          </span>
        )}
      </button>

      {/* MiniPanel — anchored near the bubble */}
      {showPanel && (
        <MiniPanel
          bubblePos={pos}
          bubbleSize={size}
          onClose={() => setShowPanel(false)}
        />
      )}

      {/* Pulse keyframe — injected once */}
      <style>{`
        @keyframes timerBubblePulse {
          0%   { box-shadow: 0 4px 16px rgba(0,0,0,0.22), 0 0 0 0   rgba(104,163,149,0.55); }
          50%  { box-shadow: 0 4px 16px rgba(0,0,0,0.22), 0 0 0 10px rgba(104,163,149,0);    }
          100% { box-shadow: 0 4px 16px rgba(0,0,0,0.22), 0 0 0 0   rgba(104,163,149,0);     }
        }
      `}</style>
    </>
  )
}
