/**
 * Card (PRD-03 Design System)
 *
 * Three variants: raised, flat, interactive.
 * Four padding options: none, sm, md, lg.
 * Interactive variant adds hover shadow lift + scale and cursor-pointer.
 * Zero hardcoded hex colors — all CSS custom properties.
 */

import type { ReactNode, MouseEvent } from 'react'

export interface CardProps {
  variant?: 'raised' | 'flat' | 'interactive'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  children: ReactNode
  className?: string
  onClick?: (e: MouseEvent<HTMLDivElement>) => void
}

const paddingClasses: Record<NonNullable<CardProps['padding']>, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

export function Card({
  variant = 'raised',
  padding = 'md',
  children,
  className = '',
  onClick,
}: CardProps) {
  const isInteractive = variant === 'interactive' || !!onClick

  const baseStyle: React.CSSProperties = {
    borderRadius: 'var(--vibe-radius-card, 12px)',
    transition: 'box-shadow var(--vibe-transition, 0.2s ease), transform var(--vibe-transition, 0.2s ease)',
  }

  const variantStyles: Record<NonNullable<CardProps['variant']>, React.CSSProperties> = {
    raised: {
      backgroundColor: 'var(--color-bg-card)',
      boxShadow: 'var(--shadow-md)',
      border: '1px solid var(--color-border)',
    },
    flat: {
      backgroundColor: 'var(--color-bg-secondary)',
      boxShadow: 'none',
      border: 'none',
    },
    interactive: {
      backgroundColor: 'var(--color-bg-card)',
      boxShadow: 'var(--shadow-md)',
      border: '1px solid var(--color-border)',
      cursor: 'pointer',
    },
  }

  const resolvedVariant = isInteractive && variant !== 'flat' ? 'interactive' : variant

  return (
    <div
      role={isInteractive ? 'button' : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        isInteractive && onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault()
                onClick(e as unknown as MouseEvent<HTMLDivElement>)
              }
            }
          : undefined
      }
      className={[
        paddingClasses[padding],
        isInteractive ? 'card-hover' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ ...baseStyle, ...variantStyles[resolvedVariant] }}
    >
      {children}
    </div>
  )
}
