import { useEffect, useRef, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'

/**
 * Inactivity timeout durations per dashboard_mode.
 * primary_parent and additional_adult use 'adult'.
 * special_adult uses 'adult' (shift-scoped access, not session-scoped).
 * Members without a dashboard_mode default to 'adult'.
 *
 * Adults: no inactivity timeout (sign out manually).
 * Teens/Guided/Play: 7 days of inactivity before sign-out.
 */
const SESSION_DURATIONS: Record<string, number> = {
  adult: 0,                          // 0 = no timeout, stay signed in until manual sign-out
  independent: 7 * 24 * 60 * 60 * 1000, // 7 days
  guided: 7 * 24 * 60 * 60 * 1000,      // 7 days
  play: 7 * 24 * 60 * 60 * 1000,        // 7 days
}

/**
 * PINR (2026-07-09) — E2E test seam, DEV-only. Vite dead-code-eliminates
 * `import.meta.env.DEV` branches from production builds, so this cannot
 * exist in a shipped bundle — no behavioral change for real users.
 * Lets pin-relock-stickiness.spec.ts simulate a session timeout in seconds
 * instead of waiting up to 7 real days. Per-dashboard-mode, sessionStorage
 * only (never persists across tabs/devices, never touches localStorage).
 */
function getTestTimeoutOverrideMs(mode: string): number | null {
  if (!import.meta.env.DEV) return null
  try {
    const raw = sessionStorage.getItem(`__pinr_e2e_timeout_override_ms_${mode}`)
    if (!raw) return null
    const parsed = Number(raw)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null
  } catch {
    return null
  }
}

const WARNING_LEAD_MS = 2 * 60 * 1000    // Show warning 2 minutes before expiry
const THROTTLE_MS = 30 * 1000            // Throttle activity resets to once per 30 seconds
const COUNTDOWN_INTERVAL_MS = 1000       // Update countdown every second

export interface SessionTimeoutState {
  showWarning: boolean
  secondsRemaining: number
  dismissWarning: () => void
}

/**
 * Manages inactivity-based session timeouts per dashboard_mode.
 * Tracks mouse, keyboard, touch, and scroll activity.
 * Shows a warning 2 minutes before expiry.
 * On expiry: signs out and redirects to /auth/family-login.
 *
 * Must be called inside a component that has access to the authenticated
 * family member (i.e., inside ProtectedRoute > ShellProvider).
 */
export function useSessionTimeout(): SessionTimeoutState {
  const { data: member } = useFamilyMember()
  const navigate = useNavigate()

  const [showWarning, setShowWarning] = useState(false)
  const [secondsRemaining, setSecondsRemaining] = useState(0)

  // Refs so event handlers always see current values without re-registering
  const memberRef = useRef(member)
  memberRef.current = member
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const warningTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const lastActivityRef = useRef<number>(Date.now())
  const throttleLockRef = useRef<boolean>(false)

  // Derive the session duration from the current member's dashboard_mode.
  // primary_parent has role 'primary_parent' — always adult duration.
  const getTimeoutMs = useCallback((): number => {
    if (!member) return SESSION_DURATIONS.adult
    if (member.role === 'primary_parent') return SESSION_DURATIONS.adult
    const mode = member.dashboard_mode ?? 'adult'
    const testOverride = getTestTimeoutOverrideMs(mode)
    if (testOverride !== null) return testOverride
    return SESSION_DURATIONS[mode] ?? SESSION_DURATIONS.adult
  }, [member])

  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
    if (warningTimeoutRef.current) {
      clearTimeout(warningTimeoutRef.current)
      warningTimeoutRef.current = null
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
      countdownIntervalRef.current = null
    }
  }, [])

  const startCountdown = useCallback((msRemaining: number) => {
    setSecondsRemaining(Math.ceil(msRemaining / 1000))
    setShowWarning(true)

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
    }

    countdownIntervalRef.current = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current)
            countdownIntervalRef.current = null
          }
          return 0
        }
        return prev - 1
      })
    }, COUNTDOWN_INTERVAL_MS)
  }, [])

  const scheduleTimeout = useCallback(() => {
    clearAllTimers()
    setShowWarning(false)

    const timeoutMs = getTimeoutMs()

    // 0 = no timeout, stay signed in indefinitely
    if (timeoutMs === 0) return

    const warningAt = timeoutMs - WARNING_LEAD_MS

    // Only show a warning if the session is long enough for a 2-minute lead
    if (warningAt > 0) {
      warningTimeoutRef.current = setTimeout(() => {
        startCountdown(WARNING_LEAD_MS)
      }, warningAt)
    }

    timeoutRef.current = setTimeout(async () => {
      clearAllTimers()
      setShowWarning(false)
      // PINR (2026-07-09): capture which member timed out BEFORE signing
      // out — this member's own session is what's ending, scoped to the
      // main client only (the family-shadow session on familyDeviceClient,
      // a separate client/storage key, is untouched). FamilyLogin.tsx uses
      // resumeMemberId to check for a resumable family layer and, if one
      // exists, relock at just this member's own PIN/picture gate instead
      // of the full family-name + password door. Read via ref (not a
      // `member` closure/dependency) so scheduleTimeout's identity doesn't
      // churn on every React Query background refetch of `member`.
      const timedOutMemberId = memberRef.current?.id ?? null
      // Navigate FIRST, sign out SECOND (2026-07-09 fix — pre-existing race,
      // found while building PINR, present for every prior session-timeout
      // path too, not just PINR's). /dashboard is wrapped in AuthGuard,
      // which has its own `if (!user) return <Navigate to="/" replace />`.
      // signOut() fires onAuthStateChange synchronously-ish, and if
      // AuthGuard is STILL MOUNTED when that lands, its redirect to "/" can
      // win the race against this navigate() call, silently dropping the
      // resumeMemberId state and dumping the user on the marketing landing
      // page instead of the family-login door. Navigating to /auth/family-
      // login FIRST unmounts AuthGuard (that route carries no auth guard)
      // before signOut()'s auth-state event has anywhere left to redirect.
      navigate('/auth/family-login', {
        replace: true,
        state: { reason: 'session_expired', resumeMemberId: timedOutMemberId },
      })
      await supabase.auth.signOut()
    }, timeoutMs)
  }, [clearAllTimers, getTimeoutMs, navigate, startCountdown])

  // Dismiss the warning and reset the session timer (counts as activity)
  const dismissWarning = useCallback(() => {
    scheduleTimeout()
  }, [scheduleTimeout])

  // Handle any user activity — throttled to once per 30 seconds
  const handleActivity = useCallback(() => {
    const now = Date.now()

    // If the warning is visible, any activity dismisses it and resets the timer
    if (showWarning) {
      lastActivityRef.current = now
      throttleLockRef.current = false
      scheduleTimeout()
      return
    }

    if (throttleLockRef.current) return

    throttleLockRef.current = true
    lastActivityRef.current = now
    scheduleTimeout()

    setTimeout(() => {
      throttleLockRef.current = false
    }, THROTTLE_MS)
  }, [showWarning, scheduleTimeout])

  // Register activity listeners and start the initial timer when member loads
  useEffect(() => {
    if (!member) return

    scheduleTimeout()

    const events: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keypress',
      'touchstart',
      'scroll',
    ]

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    return () => {
      clearAllTimers()
      events.forEach(event => {
        window.removeEventListener(event, handleActivity)
      })
    }
    // Re-register when member loads or when dashboard_mode changes (e.g., view-as switch)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [member?.id, member?.dashboard_mode, member?.role])

  // When the warning becomes visible, re-register activity handlers immediately
  // so the throttle doesn't block dismissal via mouse move during the warning window
  useEffect(() => {
    if (!showWarning) return

    const events: Array<keyof WindowEventMap> = [
      'mousemove',
      'mousedown',
      'keypress',
      'touchstart',
      'scroll',
    ]

    events.forEach(event => {
      window.addEventListener(event, handleActivity, { passive: true })
    })

    return () => {
      events.forEach(event => {
        window.removeEventListener(event, handleActivity)
      })
    }
  }, [showWarning, handleActivity])

  return { showWarning, secondsRemaining, dismissWarning }
}
