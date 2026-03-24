import { Clock } from 'lucide-react'

interface SessionWarningProps {
  secondsRemaining: number
  onDismiss: () => void
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${s.toString().padStart(2, '0')}`
}

/**
 * Fixed banner shown 2 minutes before session expiry.
 * Sits at z-index 55 (above the View As banner at z-50, below modals at z-60+).
 * Tapping/clicking dismisses the warning and resets the session timer.
 * Slides in from the top on mount.
 */
export function SessionWarning({ secondsRemaining, onDismiss }: SessionWarningProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      onClick={onDismiss}
      className="fixed top-0 left-0 right-0 z-[55] flex items-center justify-center gap-2 px-4 py-2.5 cursor-pointer select-none animate-slideDown"
      style={{
        backgroundColor: 'var(--color-warning, #d97706)',
        color: '#ffffff',
      }}
    >
      <Clock size={15} className="shrink-0" aria-hidden="true" />
      <span className="text-sm font-medium">
        Session expires in{' '}
        <span className="font-bold tabular-nums">{formatCountdown(secondsRemaining)}</span>
        .{' '}
        <span className="underline underline-offset-2">Tap to stay logged in.</span>
      </span>
    </div>
  )
}
