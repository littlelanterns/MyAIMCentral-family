import type { ReactNode, MouseEvent, CSSProperties } from 'react'
import { Tooltip } from './Tooltip'

export interface IconButtonProps {
  icon: ReactNode
  onClick?: (e: MouseEvent<HTMLButtonElement>) => void
  size?: 'sm' | 'md' | 'lg'
  variant?: 'ghost' | 'filled' | 'outline'
  label: string
  disabled?: boolean
  className?: string
}

const sizeMap = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-12 h-12',
}

export function IconButton({
  icon,
  onClick,
  size = 'md',
  variant = 'ghost',
  label,
  disabled = false,
  className = '',
}: IconButtonProps) {
  const variantStyles: Record<string, CSSProperties> = {
    ghost: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-secondary)',
      border: 'none',
    },
    filled: {
      background: 'var(--surface-primary, var(--color-btn-primary-bg))',
      color: 'var(--color-btn-primary-text)',
      border: 'none',
    },
    outline: {
      backgroundColor: 'transparent',
      color: 'var(--color-text-primary)',
      border: '1px solid var(--color-border)',
    },
  }

  return (
    <Tooltip content={label}>
    <button
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center rounded-lg transition-all ${sizeMap[size]} ${className}`}
      style={{
        ...variantStyles[variant],
        borderRadius: 'var(--vibe-radius-input, 8px)',
        opacity: disabled ? 0.5 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      aria-label={label}
    >
      {icon}
    </button>
    </Tooltip>
  )
}
