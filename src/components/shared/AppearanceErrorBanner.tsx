import { AlertTriangle, X } from 'lucide-react'

interface AppearanceErrorBannerProps {
  message: string
  onDismiss: () => void
}

/**
 * Fixed banner shown when a theme/layout preference write fails to persist
 * (FDWA — silent failure is the bug class this exists to kill). Same visual
 * language as SessionWarning: z-55, theme tokens, slide-in from the top.
 * Unlike SessionWarning this is explicit-dismiss-only (a tap anywhere could
 * be misread as "retry" — there's no retry action here, just visibility).
 */
export function AppearanceErrorBanner({ message, onDismiss }: AppearanceErrorBannerProps) {
  return (
    <div
      role="alert"
      aria-live="assertive"
      aria-atomic="true"
      className="fixed top-0 left-0 right-0 z-[55] flex items-center justify-center gap-2 px-4 py-2.5 animate-slideDown"
      style={{
        backgroundColor: 'var(--color-error, #dc2626)',
        color: 'var(--color-text-on-primary, #fff)',
      }}
    >
      <AlertTriangle size={15} className="shrink-0" aria-hidden="true" />
      <span className="text-sm font-medium">{message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="ml-2 shrink-0 rounded p-0.5 hover:bg-black/10"
        aria-label="Dismiss"
      >
        <X size={14} aria-hidden="true" />
      </button>
    </div>
  )
}
