import { useState, useEffect } from 'react'
import { CheckCircle, AlertTriangle, XCircle, Info, X } from 'lucide-react'
import type { ReactNode } from 'react'

export type ToastVariant = 'success' | 'warning' | 'error' | 'info'

export interface ToastProps {
  variant?: ToastVariant
  message: string | ReactNode
  duration?: number
  onClose?: () => void
  visible?: boolean
}

const icons: Record<ToastVariant, typeof CheckCircle> = {
  success: CheckCircle,
  warning: AlertTriangle,
  error: XCircle,
  info: Info,
}

const colorVars: Record<ToastVariant, string> = {
  success: 'var(--color-success, #4b7c66)',
  warning: 'var(--color-warning, #b99c34)',
  error: 'var(--color-error, #b25a58)',
  info: 'var(--color-info, #68a395)',
}

export function Toast({ variant = 'info', message, duration = 4000, onClose, visible = true }: ToastProps) {
  const [show, setShow] = useState(visible)

  useEffect(() => {
    setShow(visible)
  }, [visible])

  useEffect(() => {
    if (show && duration > 0) {
      const timer = setTimeout(() => {
        setShow(false)
        onClose?.()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [show, duration, onClose])

  if (!show) return null

  const Icon = icons[variant]
  const accentColor = colorVars[variant]

  return (
    <div
      className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg max-w-sm w-[calc(100%-2rem)] animate-slide-up"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderLeft: `4px solid ${accentColor}`,
        boxShadow: 'var(--shadow-lg)',
      }}
    >
      <Icon size={18} style={{ color: accentColor, flexShrink: 0 }} />
      <span className="text-sm flex-1" style={{ color: 'var(--color-text-primary)' }}>
        {message}
      </span>
      {onClose && (
        <button onClick={() => { setShow(false); onClose() }} className="p-1" style={{ color: 'var(--color-text-secondary)' }}>
          <X size={14} />
        </button>
      )}
    </div>
  )
}
