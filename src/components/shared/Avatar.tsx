/**
 * Avatar (PRD-03 Design System)
 *
 * Shows image if src is provided; otherwise shows first letter of name
 * on a colored background.
 * color prop: uses provided color or falls back to var(--color-btn-primary-bg).
 * Three sizes: sm (32px), md (40px), lg (56px).
 * Zero hardcoded hex colors — all CSS custom properties.
 */

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

export function Avatar({
  src,
  name,
  color,
  size = 'md',
  className = '',
}: AvatarProps) {
  const px = sizePx[size]
  const initial = name.trim().charAt(0).toUpperCase() || '?'
  const bgColor = color || 'var(--color-btn-primary-bg)'

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
        color: 'var(--color-btn-primary-text, #ffffff)',
        fontSize: fontSizes[size],
        fontWeight: 600,
      }}
    >
      {initial}
    </span>
  )
}
