/**
 * useSwipeGesture — Lightweight touch gesture detection (PRD-04)
 *
 * Detects horizontal and vertical swipe gestures on a ref'd element.
 * Used for: notepad swipe-right dismiss, LiLa drawer swipe-up/down,
 * sidebar left-edge swipe-open.
 *
 * No external dependencies — pure touchstart/touchmove/touchend.
 */

import { useRef, useEffect, useCallback } from 'react'

interface SwipeConfig {
  /** Minimum distance (px) to trigger a swipe. Default: 50 */
  threshold?: number
  /** Only fire on mobile (< 768px). Default: true */
  mobileOnly?: boolean
  onSwipeLeft?: () => void
  onSwipeRight?: () => void
  onSwipeUp?: () => void
  onSwipeDown?: () => void
  /** Whether the gesture is enabled. Default: true */
  enabled?: boolean
}

/**
 * Attach to a ref element to detect swipe gestures.
 * Returns a ref to attach to the target element.
 */
export function useSwipeGesture<T extends HTMLElement>(config: SwipeConfig) {
  const ref = useRef<T>(null)
  const touchStart = useRef<{ x: number; y: number; time: number } | null>(null)
  const configRef = useRef(config)
  configRef.current = config

  const handleTouchStart = useCallback((e: TouchEvent) => {
    touchStart.current = {
      x: e.touches[0].clientX,
      y: e.touches[0].clientY,
      time: Date.now(),
    }
  }, [])

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!touchStart.current) return
    const cfg = configRef.current
    const threshold = cfg.threshold ?? 50

    const dx = e.changedTouches[0].clientX - touchStart.current.x
    const dy = e.changedTouches[0].clientY - touchStart.current.y
    const elapsed = Date.now() - touchStart.current.time

    touchStart.current = null

    // Ignore slow drags (> 500ms)
    if (elapsed > 500) return

    const absDx = Math.abs(dx)
    const absDy = Math.abs(dy)

    // Determine dominant axis
    if (absDx > absDy && absDx >= threshold) {
      // Horizontal swipe
      if (dx > 0) cfg.onSwipeRight?.()
      else cfg.onSwipeLeft?.()
    } else if (absDy > absDx && absDy >= threshold) {
      // Vertical swipe
      if (dy > 0) cfg.onSwipeDown?.()
      else cfg.onSwipeUp?.()
    }
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (config.enabled === false) return
    if (config.mobileOnly !== false && window.innerWidth >= 768) return

    el.addEventListener('touchstart', handleTouchStart, { passive: true })
    el.addEventListener('touchend', handleTouchEnd, { passive: true })

    return () => {
      el.removeEventListener('touchstart', handleTouchStart)
      el.removeEventListener('touchend', handleTouchEnd)
    }
  }, [config.enabled, config.mobileOnly, handleTouchStart, handleTouchEnd])

  return ref
}

/**
 * useEdgeSwipe — Detects swipes starting from the left edge of the viewport.
 * Used for sidebar open gesture on mobile/tablet.
 */
export function useEdgeSwipe(config: {
  /** Edge zone width in px. Default: 20 */
  edgeWidth?: number
  /** Minimum swipe distance. Default: 50 */
  threshold?: number
  onSwipeFromEdge: () => void
  enabled?: boolean
}) {
  const touchStart = useRef<{ x: number; y: number } | null>(null)
  const configRef = useRef(config)
  configRef.current = config

  useEffect(() => {
    if (config.enabled === false) return
    // Only on mobile/tablet
    if (window.innerWidth >= 1024) return

    const edgeWidth = config.edgeWidth ?? 20
    const threshold = config.threshold ?? 50

    function onTouchStart(e: TouchEvent) {
      const x = e.touches[0].clientX
      if (x <= edgeWidth) {
        touchStart.current = { x, y: e.touches[0].clientY }
      }
    }

    function onTouchEnd(e: TouchEvent) {
      if (!touchStart.current) return
      const dx = e.changedTouches[0].clientX - touchStart.current.x
      const dy = Math.abs(e.changedTouches[0].clientY - touchStart.current.y)
      touchStart.current = null

      // Must be predominantly horizontal and exceed threshold
      if (dx >= threshold && dx > dy) {
        configRef.current.onSwipeFromEdge()
      }
    }

    document.addEventListener('touchstart', onTouchStart, { passive: true })
    document.addEventListener('touchend', onTouchEnd, { passive: true })

    return () => {
      document.removeEventListener('touchstart', onTouchStart)
      document.removeEventListener('touchend', onTouchEnd)
    }
  }, [config.enabled])
}
