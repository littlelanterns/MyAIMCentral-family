/**
 * Badge (PRD-03 Design System)
 *
 * Six variants: default, success, warning, error, info, accent.
 * Two sizes: sm, md.
 * Rounded-full pill shape.
 * Zero hardcoded hex colors — all CSS custom properties.
 */

import type { ReactNode } from 'react'

export interface BadgeProps {
  variant?: 'default' | 'success' | 'warning' | 'error' | 'info' | 'accent'
  size?: 'sm' | 'md'
  children: ReactNode
  className?: string
}

const sizeClasses: Record<NonNullable<BadgeProps['size']>, string> = {
  sm: 'text-xs px-1.5 py-0.5',
  md: 'text-sm px-2 py-0.5',
}

// Each variant maps to a background and text CSS property pair.
// We use opacity-based backgrounds for status colors to keep them soft.
const variantStyles: Record<
  NonNullable<BadgeProps['variant']>,
  { bg: string; text: string; borderColor?: string }
> = {
  default: {
    bg: 'var(--color-bg-secondary)',
    text: 'var(--color-text-primary)',
  },
  success: {
    bg: 'color-mix(in srgb, var(--color-success) 15%, transparent)',
    text: 'var(--color-success)',
    borderColor: 'color-mix(in srgb, var(--color-success) 30%, transparent)',
  },
  warning: {
    bg: 'color-mix(in srgb, var(--color-warning) 15%, transparent)',
    text: 'var(--color-warning)',
    borderColor: 'color-mix(in srgb, var(--color-warning) 30%, transparent)',
  },
  error: {
    bg: 'color-mix(in srgb, var(--color-error) 15%, transparent)',
    text: 'var(--color-error)',
    borderColor: 'color-mix(in srgb, var(--color-error) 30%, transparent)',
  },
  info: {
    bg: 'color-mix(in srgb, var(--color-info) 15%, transparent)',
    text: 'var(--color-info)',
    borderColor: 'color-mix(in srgb, var(--color-info) 30%, transparent)',
  },
  accent: {
    bg: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
    text: 'var(--color-accent)',
    borderColor: 'color-mix(in srgb, var(--color-accent) 30%, transparent)',
  },
}

export function Badge({
  variant = 'default',
  size = 'md',
  children,
  className = '',
}: BadgeProps) {
  const styles = variantStyles[variant]

  return (
    <span
      className={`inline-flex items-center font-medium rounded-full ${sizeClasses[size]} ${className}`}
      style={{
        backgroundColor: styles.bg,
        color: styles.text,
        border: styles.borderColor ? `1px solid ${styles.borderColor}` : undefined,
        lineHeight: 1.4,
      }}
    >
      {children}
    </span>
  )
}
