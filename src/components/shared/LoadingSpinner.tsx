/**
 * LoadingSpinner (PRD-03 Design System)
 *
 * Animated rotating circle using border-top-color = var(--color-btn-primary-bg).
 * prefers-reduced-motion: renders a static icon instead of spinning.
 * Zero hardcoded hex colors.
 */

import { Loader2 } from 'lucide-react'

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizeMap: Record<NonNullable<LoadingSpinnerProps['size']>, number> = {
  sm: 16,
  md: 24,
  lg: 40,
}

export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const px = sizeMap[size]

  return (
    <>
      {/* Animated version — hidden when reduced-motion prefers no animation */}
      <span
        className={`motion-safe:block motion-reduce:hidden inline-block rounded-full ${className}`}
        style={{
          width: px,
          height: px,
          minHeight: 'unset',
          borderWidth: size === 'lg' ? 3 : 2,
          borderStyle: 'solid',
          borderColor: 'var(--color-border, #d4e3d9)',
          borderTopColor: 'var(--color-btn-primary-bg, #68a395)',
          animation: 'spin 0.75s linear infinite',
          flexShrink: 0,
        }}
        role="status"
        aria-label="Loading"
      />

      {/* Static icon for reduced-motion users */}
      <span
        className="motion-safe:hidden motion-reduce:inline-flex items-center justify-center"
        style={{ width: px, height: px, minHeight: 'unset', flexShrink: 0 }}
        role="status"
        aria-label="Loading"
      >
        <Loader2
          size={px}
          style={{ color: 'var(--color-btn-primary-bg, #68a395)' }}
          aria-hidden
        />
      </span>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}
