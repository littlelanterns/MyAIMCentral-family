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
function bubbleSize(isPlay: boolean): number {
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

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FloatingBubble() {
  const { shell } = useShell()
  const { activeTimers, showPanel, setShowPanel } = useTimerContext()

  const isPlay    = shell === 'play'
  const size      = bubbleSize(isPlay)
  const isMobile  = typeof window !== 'undefined' && window.innerWidth < 768

  // Position state — lazily initialised from window dimensions.
  const [pos, setPos] = useState<Position>(() =>
    typeof window !== 'undefined'
      ? defaultPosition(size, isMobile)
      : { x: 0, y: 0 }
  )

  // Dragging state kept in a ref so event handlers don't stale-close over it.
  const dragging = useRef(false)
  const dragStart = useRef<{ pointerX: number; pointerY: number; posX: number; posY: number } | null>(null)
  const moved = useRef(false)

  // Re-snap to edge when window resizes (orientation change, etc.)
  useEffect(() => {
    function onResize() {
      setPos((prev) => snapToEdge(prev, size))
    }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [size])

  // -------------------------------------------------------------------
  // Pointer-based drag (works for mouse and touch via pointer events)
  // -------------------------------------------------------------------

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLButtonElement>) => {
      // Only primary pointer (left-click / single touch)
      if (e.button !== 0 && e.pointerType === 'mouse') return

      e.currentTarget.setPointerCapture(e.pointerId)
      dragging.current = true
      moved.current = false
      dragStart.current = {
        pointerX: e.clientX,
        pointerY: e.clientY,
        posX: pos.x,
        posY: pos.y,
      }
    },
    [pos]
  )

  const onPointerMove = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      if (!dragging.current || !dragStart.current) return

      const dx = e.clientX - dragStart.current.pointerX
      const dy = e.clientY - dragStart.current.pointerY

      // Only start moving after 4px threshold to distinguish tap from drag
      if (Math.abs(dx) < 4 && Math.abs(dy) < 4) return
      moved.current = true

      const vw = window.innerWidth
      const vh = window.innerHeight
      setPos({
        x: Math.max(0, Math.min(vw - size, dragStart.current.posX + dx)),
        y: Math.max(0, Math.min(vh - size, dragStart.current.posY + dy)),
      })
    },
    [size]
  )

  const onPointerUp = useCallback(
    (_e: React.PointerEvent<HTMLButtonElement>) => {
      if (!dragging.current) return
      dragging.current = false

      if (moved.current) {
        // Snap to nearest edge
        setPos((prev) => snapToEdge(prev, size))
      } else {
        // It was a tap — toggle the panel
        setShowPanel(!showPanel)
      }

      dragStart.current = null
    },
    [size, showPanel, setShowPanel]
  )

  // -------------------------------------------------------------------
  // Render — hidden when no active timers
  // -------------------------------------------------------------------

  if (activeTimers.length === 0) return null

  const isRunning = activeTimers.length > 0

  return (
    <>
      {/* The bubble button */}
      <button
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        aria-label={`Timer — ${activeTimers.length} active. Tap to ${showPanel ? 'close' : 'open'} panel.`}
        style={{
          position: 'fixed',
          left: pos.x,
          top: pos.y,
          width: size,
          height: size,
          borderRadius: '50%',
          background: 'var(--color-sage-teal, #68a395)',
          color: '#ffffff',
          border: 'none',
          cursor: dragging.current ? 'grabbing' : 'grab',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 35,
          boxShadow: '0 4px 16px rgba(0,0,0,0.22)',
          touchAction: 'none',   // prevent scroll-hijack during drag
          userSelect: 'none',
          WebkitUserSelect: 'none',
          transition: dragging.current ? 'none' : 'box-shadow 0.2s ease',
          animation: isRunning ? 'timerBubblePulse 2.4s ease-in-out infinite' : 'none',
        }}
      >
        <Clock size={isPlay ? 24 : 20} strokeWidth={2} />

        {/* Badge: active timer count */}
        {activeTimers.length > 0 && (
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
              color: '#ffffff',
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
