/**
 * useViewAsTimeout — inactivity timeout scoped to the View-As modal lifetime.
 *
 * This is a SEPARATE state machine from `useSessionTimeout` (Convention #39,
 * founder decision 3). useSessionTimeout governs the underlying auth session
 * (adult = no timeout, others = 7 days) and is intentionally NOT changed by
 * this build. This hook only governs how long a View-As modal stays open
 * while idle. Mom (or a kid at the hub) wandering off from the modal should
 * not leave another family member's surface open indefinitely.
 *
 * Lifetime: the hook subscribes to activity listeners on mount and tears them
 * down on unmount. Mount it ONLY inside a component that is rendered while the
 * modal is open (e.g. ViewAsTimeoutWarningBanner, which the modal renders only
 * when active) so the timers arm exactly while the modal is visible.
 *
 * Timeline (defaults: 15-min close, 2-min warning lead):
 *   - 13 min idle  → onWarn() fires (banner appears, internal warning lock set)
 *   - 15 min idle  → onTimeout() fires (caller closes the modal)
 *
 * While the warning is showing, passive activity does NOT silently reschedule
 * (which would cancel the close but leave the banner stuck visible). The only
 * resets during the warning window are the explicit resetTimer() call from the
 * "I'm still here" button. Before the warning fires, activity reschedules the
 * timers, throttled to once per 30s like useSessionTimeout.
 *
 * Convention #39 (View As Identity-Scope Architecture).
 */

import { useCallback, useEffect, useRef } from 'react'

const THROTTLE_MS = 30 * 1000

const ACTIVITY_EVENTS: Array<keyof WindowEventMap> = [
  'mousemove',
  'keydown',
  'touchstart',
  'scroll',
]

export interface UseViewAsTimeoutOptions {
  /** Total idle time before onTimeout fires, in ms (e.g. 15 * 60_000). */
  default: number
  /** How far before the timeout onWarn fires, in ms (e.g. 2 * 60_000). */
  warnAt: number
  /** Called once when the warning window begins (default - warnAt idle). */
  onWarn: () => void
  /** Called when the full idle timeout elapses. Caller closes the modal. */
  onTimeout: () => void
}

export interface UseViewAsTimeoutResult {
  /**
   * Resets the idle timers and clears the internal warning lock. Wire this to
   * the warning banner's "I'm still here" button.
   */
  resetTimer: () => void
}

export function useViewAsTimeout(
  { default: timeoutMs, warnAt, onWarn, onTimeout }: UseViewAsTimeoutOptions,
): UseViewAsTimeoutResult {
  const warnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const throttleLockRef = useRef(false)
  // True between onWarn firing and the next explicit resetTimer(). While set,
  // passive activity is ignored so the 2-minute countdown to close proceeds.
  const warningActiveRef = useRef(false)

  // Keep the latest callbacks in refs so re-renders that pass new closures
  // don't force the activity-listener effect to resubscribe.
  const onWarnRef = useRef(onWarn)
  const onTimeoutRef = useRef(onTimeout)
  onWarnRef.current = onWarn
  onTimeoutRef.current = onTimeout

  const clearTimers = useCallback(() => {
    if (warnTimerRef.current) {
      clearTimeout(warnTimerRef.current)
      warnTimerRef.current = null
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current)
      closeTimerRef.current = null
    }
  }, [])

  const schedule = useCallback(() => {
    clearTimers()
    warningActiveRef.current = false

    const warnDelay = timeoutMs - warnAt
    if (warnDelay > 0) {
      warnTimerRef.current = setTimeout(() => {
        warningActiveRef.current = true
        onWarnRef.current()
      }, warnDelay)
    }
    closeTimerRef.current = setTimeout(() => {
      onTimeoutRef.current()
    }, timeoutMs)
  }, [clearTimers, timeoutMs, warnAt])

  const resetTimer = useCallback(() => {
    throttleLockRef.current = false
    schedule()
  }, [schedule])

  const handleActivity = useCallback(() => {
    // During the warning window, only the explicit "I'm still here" button
    // (resetTimer) resets — passive activity must not silently cancel the close.
    if (warningActiveRef.current) return
    if (throttleLockRef.current) return
    throttleLockRef.current = true
    schedule()
    setTimeout(() => {
      throttleLockRef.current = false
    }, THROTTLE_MS)
  }, [schedule])

  useEffect(() => {
    schedule()
    ACTIVITY_EVENTS.forEach((event) => {
      window.addEventListener(event, handleActivity, { passive: true })
    })
    return () => {
      clearTimers()
      ACTIVITY_EVENTS.forEach((event) => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [schedule, handleActivity, clearTimers])

  return { resetTimer }
}
