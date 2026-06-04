/**
 * ViewAsTimeoutWarningBanner — non-blocking "session ending soon" banner for
 * the View-As modal.
 *
 * Self-contained: it owns the useViewAsTimeout hook and its own showWarning
 * state. ViewAsModal renders this component only inside the modal body (which
 * exists only while a View-As session is active), so the hook's activity
 * listeners and timers arm exactly while the modal is open and tear down when
 * it closes. This keeps the timeout truly scoped to the modal lifetime without
 * arming global timers when no session is active.
 *
 * Behavior (Convention #39, founder Q6):
 *   - At 13 min idle (15-min close minus 2-min lead): the banner appears.
 *   - "I'm still here" resets the idle timer and dismisses the banner.
 *   - At 15 min idle with no interaction: stopViewAs() closes the modal, which
 *     unmounts this component.
 *
 * The banner sits inside the modal's scroll region as a non-blocking strip —
 * it does not trap focus or block the surface behind it.
 */

import { useState } from 'react'
import { Clock } from 'lucide-react'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { useViewAsTimeout } from '@/hooks/useViewAsTimeout'

const TIMEOUT_MS = 15 * 60 * 1000
const WARN_LEAD_MS = 2 * 60 * 1000

export function ViewAsTimeoutWarningBanner() {
  const { stopViewAs } = useViewAs()
  const [showWarning, setShowWarning] = useState(false)

  const { resetTimer } = useViewAsTimeout({
    default: TIMEOUT_MS,
    warnAt: WARN_LEAD_MS,
    onWarn: () => setShowWarning(true),
    onTimeout: () => { void stopViewAs() },
  })

  if (!showWarning) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className="flex items-center justify-between gap-3 px-4 py-2 text-xs font-medium"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-golden-honey, #d6a461) 18%, var(--color-bg-card))',
        color: 'var(--color-text-primary)',
        borderBottom: '1px solid var(--color-golden-honey, #d6a461)',
      }}
    >
      <div className="flex items-center gap-2 min-w-0">
        <Clock size={14} className="shrink-0" style={{ color: 'var(--color-golden-honey, #d6a461)' }} />
        <span className="truncate">View As session will end in 2 minutes. Tap to keep going.</span>
      </div>
      <button
        type="button"
        onClick={() => {
          resetTimer()
          setShowWarning(false)
        }}
        className="shrink-0 px-3 py-1 rounded-full text-xs font-semibold transition-all hover:scale-105 active:scale-95"
        style={{
          backgroundColor: 'var(--surface-primary, var(--color-btn-primary-bg))',
          color: 'var(--color-btn-primary-text)',
          border: '1px solid var(--color-border)',
        }}
      >
        I&apos;m still here
      </button>
    </div>
  )
}
