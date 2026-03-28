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
  /** Card size — controls padding and body text scale.
   *  sm: compact (Studio templates, vault browse, queue items)
   *  md: standard (dashboard widgets, task cards, list items)
   *  lg: spacious (form sections, detail views, modal content) */
  size?: 'sm' | 'md' | 'lg'
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

/** Size-based padding when `size` is used instead of explicit `padding` */
const sizePadding: Record<NonNullable<CardProps['size']>, string> = {
  sm: '0.75rem',
  md: '1rem',
  lg: '1.5rem',
}

/** Size-based body font size */
const sizeFontSize: Record<NonNullable<CardProps['size']>, string> = {
  sm: 'var(--font-size-xs, 0.75rem)',
  md: 'var(--font-size-sm, 0.875rem)',
  lg: 'var(--font-size-base, 1rem)',
}

export function Card({
  variant = 'raised',
  padding = 'md',
  size,
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

  // When `size` is provided, use size-based padding/font instead of Tailwind padding classes
  const sizeStyles: React.CSSProperties = size
    ? { padding: sizePadding[size], fontSize: sizeFontSize[size] }
    : {}

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
        size ? '' : paddingClasses[padding],
        isInteractive ? 'card-hover' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      style={{ ...baseStyle, ...variantStyles[resolvedVariant], ...sizeStyles }}
    >
      {children}
    </div>
  )
}
