/**
 * Avatar (PRD-03 Design System)
 *
 * Shows image if src is provided; otherwise shows initials
 * on a colored background using the member's assigned color.
 * color prop: uses provided hex color with proper contrast text,
 * or falls back to var(--color-btn-primary-bg).
 * Three sizes: sm (32px), md (40px), lg (56px).
 * Zero grey placeholders — always member color + initials.
 */

import { getContrastText } from '@/config/member_colors'

export interface AvatarProps {
  src?: string | null
  name: string
  color?: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

const sizePx: Record<NonNullable<AvatarProps['size']>, number> = {
  sm: 32,
  md: 40,
  lg: 56,
}

const fontSizes: Record<NonNullable<AvatarProps['size']>, string> = {
  sm: '0.75rem',
  md: '0.9rem',
  lg: '1.25rem',
}

/** Get 1-2 letter initials from a display name */
export function getInitials(displayName: string): string {
  const parts = displayName.trim().split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  }
  return displayName.slice(0, 2).toUpperCase() || '?'
}

export function Avatar({
  src,
  name,
  color,
  size = 'md',
  className = '',
}: AvatarProps) {
  const px = sizePx[size]
  const initials = getInitials(name)
  const bgColor = color || 'var(--color-btn-primary-bg)'
  // Use contrast-aware text color when a hex color is provided
  const textColor = color && color.startsWith('#')
    ? getContrastText(color)
    : 'var(--color-btn-primary-text, #ffffff)'

  const baseStyle: React.CSSProperties = {
    width: px,
    height: px,
    minHeight: 'unset',
    borderRadius: '50%',
    flexShrink: 0,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    userSelect: 'none',
  }

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={className}
        style={{ ...baseStyle, objectFit: 'cover' }}
        draggable={false}
      />
    )
  }

  return (
    <span
      aria-label={name}
      role="img"
      className={className}
      style={{
        ...baseStyle,
        backgroundColor: bgColor,
        color: textColor,
        fontSize: fontSizes[size],
        fontWeight: 600,
        letterSpacing: '0.02em',
      }}
    >
      {initials}
    </span>
  )
}
