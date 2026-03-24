/**
 * EmptyState (PRD-03 Design System)
 *
 * Centered layout with optional icon, title, description, and action slot.
 * Used for zero-data states across all features.
 * Zero hardcoded hex colors — all CSS custom properties.
 */

import type { ReactNode } from 'react'

export interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center gap-3 py-12 px-6 ${className}`}
    >
      {icon && (
        <div
          style={{ color: 'var(--color-text-secondary)' }}
          className="flex items-center justify-center"
          aria-hidden="true"
        >
          {icon}
        </div>
      )}

      <h3
        className="text-base font-semibold"
        style={{ color: 'var(--color-text-heading)', margin: 0 }}
      >
        {title}
      </h3>

      {description && (
        <p
          className="text-sm max-w-xs"
          style={{ color: 'var(--color-text-secondary)', margin: 0, lineHeight: 1.6 }}
        >
          {description}
        </p>
      )}

      {action && (
        <div className="mt-2">
          {action}
        </div>
      )}
    </div>
  )
}
