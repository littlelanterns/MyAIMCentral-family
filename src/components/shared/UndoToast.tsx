import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { X } from 'lucide-react'

interface UndoToastProps {
  message: string
  /** Optional path to navigate to when tapping the destination link */
  destinationPath?: string
  duration?: number
  onUndo?: () => void
  onAlsoSendTo?: () => void
  onDismiss: () => void
}

export function UndoToast({
  message,
  destinationPath,
  duration = 5000,
  onUndo,
  onAlsoSendTo,
  onDismiss,
}: UndoToastProps) {
  const navigate = useNavigate()
  const [progress, setProgress] = useState(100)
  const startTime = useRef(Date.now())
  const rafRef = useRef<number | undefined>(undefined)
  const onDismissRef = useRef(onDismiss)
  onDismissRef.current = onDismiss

  useEffect(() => {
    const animate = () => {
      const elapsed = Date.now() - startTime.current
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100)
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
  }, [duration])

  return (
    <div
      className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2.5 rounded-xl shadow-lg max-w-[90vw] animate-fadeIn"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        color: 'var(--color-text-primary)',
      }}
    >
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
          backgroundColor: 'var(--color-btn-primary-bg)',
        }}
      />
    </div>
  )
}
