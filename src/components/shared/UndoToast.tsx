import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, AlertTriangle } from 'lucide-react'

interface UndoToastProps {
  message: string
  /** Optional path to navigate to when tapping the destination link */
  destinationPath?: string
  /**
   * Auto-dismiss duration in milliseconds. When omitted, falls back to
   * 5_000 for success toasts and 10_000 for error toasts.
   */
  duration?: number
  onUndo?: () => void
  onAlsoSendTo?: () => void
  onDismiss: () => void
  /**
   * Toast variant. Default 'success' preserves existing call-site styling
   * (primary accent border + underline). 'error' uses error tokens for
   * the border + icon and slows auto-dismiss to 10s so mom has time to
   * read the message before it vanishes (Worker ROUTINE-SAVE-FIX c2).
   */
  variant?: 'success' | 'error'
}

export function UndoToast({
  message,
  destinationPath,
  duration,
  onUndo,
  onAlsoSendTo,
  onDismiss,
  variant = 'success',
}: UndoToastProps) {
  // Worker ROUTINE-SAVE-FIX (c2): error toasts get more dwell time.
  // Default success duration stays 5s (existing behavior). Error toasts
  // default to 10s — long enough for mom to read "Couldn't save changes"
  // and decide whether to retry without the toast vanishing first.
  const effectiveDuration = duration ?? (variant === 'error' ? 10_000 : 5_000)
  const navigate = useNavigate()
  const [progress, setProgress] = useState(100)
  const startTime = useRef(Date.now())
  const rafRef = useRef<number | undefined>(undefined)
  const onDismissRef = useRef(onDismiss)
  onDismissRef.current = onDismiss

  useEffect(() => {
    const animate = () => {
      const elapsed = Date.now() - startTime.current
      const remaining = Math.max(0, 100 - (elapsed / effectiveDuration) * 100)
      setProgress(remaining)
      if (remaining > 0) {
        rafRef.current = requestAnimationFrame(animate)
      } else {
        onDismissRef.current()
      }
    }
    rafRef.current = requestAnimationFrame(animate)
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [effectiveDuration])

  // Worker ROUTINE-SAVE-FIX (c2): error variant theme tokens.
  // Color tokens use var(--color-error, …) with conservative fallbacks
  // so the toast remains legible on themes that haven't defined the
  // error palette yet. Theme-aware fallbacks per Convention #15.
  const isError = variant === 'error'
  const borderColor = isError
    ? 'var(--color-error, #b91c1c)'
    : 'var(--color-border)'
  const progressColor = isError
    ? 'var(--color-error, #b91c1c)'
    : 'var(--color-btn-primary-bg)'

  return (
    <div
      role={isError ? 'alert' : 'status'}
      aria-live={isError ? 'assertive' : 'polite'}
      className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg max-w-[90vw] animate-fadeIn"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: `1px solid ${borderColor}`,
        color: 'var(--color-text-primary)',
      }}
    >
      {isError && (
        <AlertTriangle
          size={16}
          className="shrink-0"
          style={{ color: 'var(--color-error, #b91c1c)' }}
        />
      )}

      {destinationPath ? (
        <button
          onClick={() => { navigate(destinationPath); onDismiss() }}
          className="text-sm flex-1 min-w-0 truncate text-left underline"
          style={{ color: 'var(--color-btn-primary-bg)', background: 'transparent', minHeight: 'unset' }}
        >
          {message}
        </button>
      ) : (
        <span className="text-sm flex-1 min-w-0 truncate">{message}</span>
      )}

      {onUndo && (
        <button
          onClick={onUndo}
          className="text-xs font-semibold px-2 py-1 rounded shrink-0"
          style={{
            backgroundColor: 'var(--color-btn-primary-bg)',
            color: 'var(--color-btn-primary-text)',
            minHeight: 'unset',
          }}
        >
          Undo
        </button>
      )}

      {onAlsoSendTo && (
        <button
          onClick={onAlsoSendTo}
          className="text-xs px-2 py-1 rounded shrink-0"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text-secondary)',
            minHeight: 'unset',
          }}
        >
          Also send to...
        </button>
      )}

      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        className="shrink-0 p-0.5"
        style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
      >
        <X size={12} />
      </button>

      {/* Progress bar */}
      <div
        className="absolute bottom-0 left-0 h-0.5 rounded-b-xl transition-none"
        style={{
          width: `${progress}%`,
          backgroundColor: progressColor,
        }}
      />
    </div>
  )
}
