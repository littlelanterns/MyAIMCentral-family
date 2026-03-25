/**
 * Button (PRD-03 Design System)
 *
 * Four variants: primary, secondary, ghost, destructive.
 * Three sizes: sm, md, lg.
 * Loading state: shows LoadingSpinner, disables interactions.
 * Gradient enhancement: primary variant uses --gradient-primary when gradient is enabled.
 * Zero hardcoded hex colors — all CSS custom properties.
 */

import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { LoadingSpinner } from './LoadingSpinner'

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'children'> {
  variant: 'primary' | 'secondary' | 'ghost' | 'destructive'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  fullWidth?: boolean
  children: ReactNode
  className?: string
}

const sizeClasses: Record<NonNullable<ButtonProps['size']>, string> = {
  sm: 'px-3 py-1.5 text-sm',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-3 text-base',
}

const spinnerSizes: Record<NonNullable<ButtonProps['size']>, 'sm' | 'sm' | 'md'> = {
  sm: 'sm',
  md: 'sm',
  lg: 'md',
}

export function Button({
  variant,
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  children,
  className = '',
  type = 'button',
  onClick,
  ...rest
}: ButtonProps) {
  const isDisabled = disabled || loading

  const baseStyle: React.CSSProperties = {
    borderRadius: 'var(--vibe-radius-input, 8px)',
    transition: 'all var(--vibe-transition, 0.2s ease)',
    cursor: isDisabled ? 'not-allowed' : 'pointer',
    opacity: isDisabled ? 0.55 : 1,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    fontWeight: 500,
    border: 'none',
    outline: 'none',
  }

  const variantStyles: Record<ButtonProps['variant'], React.CSSProperties> = {
    primary: {
      background: 'var(--surface-primary, var(--color-btn-primary-bg))',
      color: 'var(--color-btn-primary-text)',
    },
    secondary: {
      backgroundColor: 'var(--color-btn-secondary-bg, transparent)',
      color: 'var(--color-btn-secondary-text)',
      border: '1px solid var(--color-btn-secondary-border)',
    },
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-secondary)',
    },
    destructive: {
      backgroundColor: 'var(--color-error)',
      color: 'var(--color-btn-primary-text, #ffffff)',
    },
  }

  // Primary gets the .btn-primary class so the gradient-on CSS enhancement applies
  const variantClass = variant === 'primary'
    ? 'btn-primary'
    : variant === 'secondary'
    ? 'btn-secondary'
    : ''

  const widthClass = fullWidth ? 'w-full' : ''

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={isDisabled ? undefined : onClick}
      className={`${sizeClasses[size]} ${variantClass} ${widthClass} ${className}`.trim()}
      style={{ ...baseStyle, ...variantStyles[variant] }}
      aria-disabled={isDisabled}
      {...rest}
    >
      {loading && (
        <LoadingSpinner size={spinnerSizes[size]} />
      )}
      {children}
    </button>
  )
}
