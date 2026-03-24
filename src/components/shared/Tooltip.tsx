/**
 * Tooltip — fully theme-adaptive, Portal-rendered
 * PRD-03 Design System compliance: zero hardcoded colors.
 *
 * Behavior:
 *  - Desktop: show on hover (300ms delay), dismiss on mouse-leave (immediate)
 *  - Mobile: show on long-press (~500ms), dismiss on tap-away or after 3s
 *  - Focus: show on focus-visible, dismiss on blur
 *  - Escape: global dismiss
 *  - Only one tooltip visible at a time (global registry)
 *  - Auto-positions (top/bottom/left/right) based on viewport bounds
 *  - CSS triangle arrow pointing toward trigger
 *  - Fade animation (skipped if prefers-reduced-motion)
 *  - Portal-rendered to document.body for correct z-index layering
 */

import {
  useState,
  useRef,
  useCallback,
  useEffect,
  useId,
  type ReactNode,
  type ReactElement,
  cloneElement,
} from 'react'
import { createPortal } from 'react-dom'

// ---------------------------------------------------------------------------
// Global registry — ensures only one tooltip is visible at a time
// ---------------------------------------------------------------------------
type DismissFn = () => void
let activeTooltipDismiss: DismissFn | null = null

function registerTooltip(dismiss: DismissFn): void {
  if (activeTooltipDismiss && activeTooltipDismiss !== dismiss) {
    activeTooltipDismiss()
  }
  activeTooltipDismiss = dismiss
}

function unregisterTooltip(dismiss: DismissFn): void {
  if (activeTooltipDismiss === dismiss) {
    activeTooltipDismiss = null
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
export interface TooltipProps {
  content: string | ReactNode
  children: ReactElement
  position?: 'top' | 'bottom' | 'left' | 'right' | 'auto'
  delay?: number
  maxWidth?: number
  disabled?: boolean
}

type ResolvedPosition = 'top' | 'bottom' | 'left' | 'right'

interface TooltipCoords {
  top: number
  left: number
  position: ResolvedPosition
}

// ---------------------------------------------------------------------------
// Arrow sizing constants (px)
// ---------------------------------------------------------------------------
const ARROW_SIZE = 6
const TOOLTIP_OFFSET = ARROW_SIZE + 4 // gap between arrow tip and trigger edge

// ---------------------------------------------------------------------------
// Position calculation
// ---------------------------------------------------------------------------
function calcPosition(
  triggerRect: DOMRect,
  tooltipWidth: number,
  tooltipHeight: number,
  preferred: TooltipProps['position'],
): TooltipCoords {
  const vw = window.innerWidth
  const vh = window.innerHeight
  const scrollX = window.scrollX
  const scrollY = window.scrollY

  // Candidate positions ordered by preference
  const order: ResolvedPosition[] =
    preferred === 'auto' || preferred === undefined
      ? ['top', 'bottom', 'right', 'left']
      : [preferred as ResolvedPosition, 'top', 'bottom', 'right', 'left']

  // For each candidate, compute placement and test viewport fit
  for (const pos of order) {
    const coords = coordsForPosition(
      pos,
      triggerRect,
      tooltipWidth,
      tooltipHeight,
      scrollX,
      scrollY,
    )
    const fitsH = coords.left >= scrollX && coords.left + tooltipWidth <= scrollX + vw
    const fitsV = coords.top >= scrollY && coords.top + tooltipHeight <= scrollY + vh
    if (fitsH && fitsV) {
      return { ...coords, position: pos }
    }
  }

  // Fallback: top, clamped to viewport
  const fallback = coordsForPosition(
    'top',
    triggerRect,
    tooltipWidth,
    tooltipHeight,
    scrollX,
    scrollY,
  )
  fallback.left = Math.max(
    scrollX + 8,
    Math.min(fallback.left, scrollX + vw - tooltipWidth - 8),
  )
  fallback.top = Math.max(
    scrollY + 8,
    Math.min(fallback.top, scrollY + vh - tooltipHeight - 8),
  )
  return { ...fallback, position: 'top' }
}

function coordsForPosition(
  pos: ResolvedPosition,
  rect: DOMRect,
  tw: number,
  th: number,
  scrollX: number,
  scrollY: number,
): { top: number; left: number } {
  switch (pos) {
    case 'top':
      return {
        top: rect.top + scrollY - th - TOOLTIP_OFFSET,
        left: rect.left + scrollX + rect.width / 2 - tw / 2,
      }
    case 'bottom':
      return {
        top: rect.bottom + scrollY + TOOLTIP_OFFSET,
        left: rect.left + scrollX + rect.width / 2 - tw / 2,
      }
    case 'left':
      return {
        top: rect.top + scrollY + rect.height / 2 - th / 2,
        left: rect.left + scrollX - tw - TOOLTIP_OFFSET,
      }
    case 'right':
      return {
        top: rect.top + scrollY + rect.height / 2 - th / 2,
        left: rect.right + scrollX + TOOLTIP_OFFSET,
      }
  }
}

// ---------------------------------------------------------------------------
// Arrow styles per position
// ---------------------------------------------------------------------------
function arrowStyles(position: ResolvedPosition): React.CSSProperties {
  const base: React.CSSProperties = {
    position: 'absolute',
    width: 0,
    height: 0,
    border: `${ARROW_SIZE}px solid transparent`,
    pointerEvents: 'none',
  }

  switch (position) {
    case 'top':
      return {
        ...base,
        bottom: -ARROW_SIZE * 2,
        left: '50%',
        transform: 'translateX(-50%)',
        borderTopColor: 'var(--color-accent-deep)',
        borderBottom: 'none',
      }
    case 'bottom':
      return {
        ...base,
        top: -ARROW_SIZE * 2,
        left: '50%',
        transform: 'translateX(-50%)',
        borderBottomColor: 'var(--color-accent-deep)',
        borderTop: 'none',
      }
    case 'left':
      return {
        ...base,
        right: -ARROW_SIZE * 2,
        top: '50%',
        transform: 'translateY(-50%)',
        borderLeftColor: 'var(--color-accent-deep)',
        borderRight: 'none',
      }
    case 'right':
      return {
        ...base,
        left: -ARROW_SIZE * 2,
        top: '50%',
        transform: 'translateY(-50%)',
        borderRightColor: 'var(--color-accent-deep)',
        borderLeft: 'none',
      }
  }
}

// ---------------------------------------------------------------------------
// Tooltip bubble (rendered via portal)
// ---------------------------------------------------------------------------
interface BubbleProps {
  id: string
  content: string | ReactNode
  coords: TooltipCoords
  maxWidth: number
  visible: boolean
}

function TooltipBubble({ id, content, coords, maxWidth, visible }: BubbleProps) {
  // Reduced-motion check (static — no re-render needed for this)
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

  const bubbleStyle: React.CSSProperties = {
    position: 'absolute',
    top: coords.top,
    left: coords.left,
    zIndex: 9999,
    maxWidth,
    padding: '6px 10px',
    backgroundColor: 'var(--color-accent-deep)',
    color: 'var(--color-text-on-primary)',
    border: '0.5px solid var(--color-border-default)',
    borderRadius: 'var(--vibe-radius-input)',
    boxShadow: 'var(--shadow-sm)',
    fontFamily: 'var(--font-body)',
    fontSize: 'var(--font-size-xs, 0.75rem)',
    lineHeight: '1.4',
    wordWrap: 'break-word',
    whiteSpace: typeof content === 'string' ? 'normal' : undefined,
    pointerEvents: 'none',
    // Fade animation
    opacity: reducedMotion ? 1 : visible ? 1 : 0,
    transition: reducedMotion ? 'none' : 'opacity 150ms ease',
    willChange: 'opacity',
  }

  return createPortal(
    <div id={id} role="tooltip" style={bubbleStyle}>
      {content}
      <span style={arrowStyles(coords.position)} aria-hidden="true" />
    </div>,
    document.body,
  )
}

// ---------------------------------------------------------------------------
// Main Tooltip component
// ---------------------------------------------------------------------------
export function Tooltip({
  content,
  children,
  position = 'auto',
  delay = 300,
  maxWidth = 250,
  disabled = false,
}: TooltipProps) {
  const tooltipId = useId()
  const [visible, setVisible] = useState(false)
  const [mounted, setMounted] = useState(false) // controls portal existence
  const [coords, setCoords] = useState<TooltipCoords>({
    top: 0,
    left: 0,
    position: 'top',
  })

  const triggerRef = useRef<HTMLElement>(null)
  const tooltipRef = useRef<HTMLDivElement>(null)
  const showTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Stable dismiss function — registered in global registry
  const dismiss = useCallback(() => {
    setVisible(false)
    // Unmount after fade
    hideTimerRef.current = setTimeout(() => setMounted(false), 160)
  }, [])

  const show = useCallback(() => {
    if (disabled) return

    // Cancel any pending hide
    if (hideTimerRef.current) {
      clearTimeout(hideTimerRef.current)
      hideTimerRef.current = null
    }

    // Calculate position relative to trigger
    if (!triggerRef.current) return
    const triggerRect = triggerRef.current.getBoundingClientRect()

    // Mount the portal first at (0,0) so we can measure it
    setMounted(true)
    // We'll position after mount via useEffect below; pass an initial best-guess
    const estimated = calcPosition(triggerRect, maxWidth, 36, position)
    setCoords(estimated)

    registerTooltip(dismiss)

    showTimerRef.current = setTimeout(() => {
      setVisible(true)
    }, 16) // one frame — ensures portal is in DOM before we fade in
  }, [disabled, maxWidth, position, dismiss])

  // Recompute exact position after the tooltip bubble is in the DOM
  useEffect(() => {
    if (!mounted || !triggerRef.current) return

    // Use rAF to read layout after paint
    const raf = requestAnimationFrame(() => {
      if (!triggerRef.current) return
      const triggerRect = triggerRef.current.getBoundingClientRect()
      // Read actual bubble height from DOM if possible (portal renders to body)
      const bubbleEl = document.getElementById(tooltipId)
      const bh = bubbleEl ? bubbleEl.offsetHeight : 36
      const bw = bubbleEl ? bubbleEl.offsetWidth : maxWidth

      const exact = calcPosition(triggerRect, bw, bh, position)
      setCoords(exact)
    })

    return () => cancelAnimationFrame(raf)
  }, [mounted, tooltipId, maxWidth, position])

  const hide = useCallback(() => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current)
      showTimerRef.current = null
    }
    unregisterTooltip(dismiss)
    dismiss()
  }, [dismiss])

  // Escape key dismissal
  useEffect(() => {
    if (!visible) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hide()
    }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [visible, hide])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (showTimerRef.current) clearTimeout(showTimerRef.current)
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current)
      if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current)
      unregisterTooltip(dismiss)
    }
  }, [dismiss])

  // ---------------------------------------------------------------------------
  // Event handlers
  // ---------------------------------------------------------------------------

  // Desktop: hover
  const handleMouseEnter = useCallback(() => {
    if (showTimerRef.current) clearTimeout(showTimerRef.current)
    showTimerRef.current = setTimeout(show, delay)
  }, [show, delay])

  const handleMouseLeave = useCallback(() => {
    if (showTimerRef.current) {
      clearTimeout(showTimerRef.current)
      showTimerRef.current = null
    }
    hide()
  }, [hide])

  // Keyboard: focus / blur
  const handleFocus = useCallback(() => {
    show()
  }, [show])

  const handleBlur = useCallback(() => {
    hide()
  }, [hide])

  // Mobile: long-press
  const handleTouchStart = useCallback(() => {
    longPressTimerRef.current = setTimeout(() => {
      show()
      // Auto-dismiss after 3s
      hideTimerRef.current = setTimeout(hide, 3000)
    }, 500)
  }, [show, hide])

  const handleTouchEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current)
      longPressTimerRef.current = null
    }
    // If tooltip isn't visible yet (didn't complete long-press), nothing to do.
    // Tap-away is handled by the global registry (another tooltip opening) or
    // by the 3s auto-dismiss above.
  }, [])

  const handleTouchCancel = handleTouchEnd

  // ---------------------------------------------------------------------------
  // Clone child with injected props
  // ---------------------------------------------------------------------------
  const child = cloneElement(children, {
    ref: triggerRef,
    'aria-describedby': visible ? tooltipId : undefined,
    onMouseEnter: handleMouseEnter,
    onMouseLeave: handleMouseLeave,
    onFocus: handleFocus,
    onBlur: handleBlur,
    onTouchStart: handleTouchStart,
    onTouchEnd: handleTouchEnd,
    onTouchCancel: handleTouchCancel,
  } as React.HTMLAttributes<HTMLElement> & { ref: React.Ref<HTMLElement> })

  return (
    <>
      {child}
      {mounted && (
        <TooltipBubble
          id={tooltipId}
          content={content}
          coords={coords}
          maxWidth={maxWidth}
          visible={visible}
        />
      )}
    </>
  )
}
