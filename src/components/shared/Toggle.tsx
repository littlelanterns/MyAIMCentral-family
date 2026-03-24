/**
 * Toggle (PRD-03 Design System)
 *
 * Accessible switch component with role="switch" and aria-checked.
 * Two sizes: sm, md.
 * Track: checked = var(--color-btn-primary-bg), unchecked = var(--color-border).
 * Thumb: white circle.
 * Zero hardcoded hex colors — all CSS custom properties.
 */

import { useId } from 'react'

export interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
  size?: 'sm' | 'md'
  className?: string
}

const dimensions = {
  sm: { trackW: 32, trackH: 18, thumbSize: 14, thumbOffset: 2, travelX: 14 },
  md: { trackW: 44, trackH: 24, thumbSize: 20, thumbOffset: 2, travelX: 20 },
}

export function Toggle({
  checked,
  onChange,
  label,
  disabled = false,
  size = 'md',
  className = '',
}: ToggleProps) {
  const id = useId()
  const d = dimensions[size]

  const handleClick = () => {
    if (!disabled) onChange(!checked)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      if (!disabled) onChange(!checked)
    }
  }

  return (
    <div
      className={`flex items-center gap-2.5 ${className}`}
    >
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label || undefined}
        disabled={disabled}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        style={{
          width: d.trackW,
          height: d.trackH,
          minHeight: 'unset',
          borderRadius: d.trackH / 2,
          backgroundColor: checked
            ? 'var(--color-btn-primary-bg)'
            : 'var(--color-border)',
          border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.5 : 1,
          transition: 'background-color var(--vibe-transition, 0.2s ease)',
          position: 'relative',
          flexShrink: 0,
          padding: 0,
          outline: 'none',
        }}
      >
        {/* Thumb */}
        <span
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: d.thumbOffset,
            left: checked ? d.thumbOffset + d.travelX : d.thumbOffset,
            width: d.thumbSize,
            height: d.thumbSize,
            borderRadius: '50%',
            backgroundColor: 'var(--color-bg-card, #ffffff)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            transition: 'left var(--vibe-transition, 0.2s ease)',
          }}
        />
      </button>

      {label && (
        <label
          htmlFor={id}
          onClick={handleClick}
          style={{
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-sm, 0.875rem)',
            cursor: disabled ? 'not-allowed' : 'pointer',
            userSelect: 'none',
            opacity: disabled ? 0.5 : 1,
          }}
        >
          {label}
        </label>
      )}
    </div>
  )
}
