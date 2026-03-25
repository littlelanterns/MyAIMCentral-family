import { Lock } from 'lucide-react'
import type { ReactNode } from 'react'

export interface LockedOverlayProps {
  children: ReactNode
  message?: string
}

export function LockedOverlay({ children, message = 'This feature is locked' }: LockedOverlayProps) {
  return (
    <div className="relative">
      {children}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
          borderRadius: 'var(--vibe-radius-card, 12px)',
          backdropFilter: 'blur(2px)',
        }}
      >
        <Lock size={24} style={{ color: 'var(--color-text-on-primary, #fff)' }} />
        <span className="text-sm font-medium" style={{ color: 'var(--color-text-on-primary, #fff)' }}>
          {message}
        </span>
      </div>
    </div>
  )
}
