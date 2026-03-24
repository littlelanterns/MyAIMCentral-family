/**
 * Select (PRD-03 Design System)
 *
 * Native select element with custom chevron icon overlay.
 * Matches Input styling: bg, border, focus ring, error state.
 * Optional label and error message.
 * Zero hardcoded hex colors — all CSS custom properties.
 */

import { useId, type ChangeEvent } from 'react'
import { ChevronDown } from 'lucide-react'

export interface SelectOption {
  value: string
  label: string
}

export interface SelectProps {
  value: string
  onChange: (value: string) => void
  options: SelectOption[]
  label?: string
  error?: string
  placeholder?: string
  disabled?: boolean
  required?: boolean
  className?: string
  name?: string
}

export function Select({
  value,
  onChange,
  options,
  label,
  error,
  placeholder,
  disabled = false,
  required = false,
  className = '',
  name,
}: SelectProps) {
  const id = useId()
  const errorId = error ? `${id}-error` : undefined

  const handleChange = (e: ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value)
  }

  const selectStyle: React.CSSProperties = {
    appearance: 'none',
    WebkitAppearance: 'none',
    backgroundColor: 'var(--color-bg-input)',
    color: value ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
    border: `1px solid ${error ? 'var(--color-border-error, var(--color-error))' : 'var(--color-border)'}`,
    borderRadius: 'var(--vibe-radius-input, 8px)',
    outline: 'none',
    width: '100%',
    padding: '0.5rem 2.5rem 0.5rem 0.75rem',
    fontSize: 'var(--font-size-sm, 0.875rem)',
    transition: 'border-color var(--vibe-transition, 0.2s ease), box-shadow var(--vibe-transition, 0.2s ease)',
    minHeight: 'var(--touch-target-min, 44px)',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.55 : 1,
  }

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {label && (
        <label
          htmlFor={id}
          style={{
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-sm, 0.875rem)',
            fontWeight: 500,
          }}
        >
          {label}
          {required && (
            <span
              aria-hidden="true"
              style={{ color: 'var(--color-error)', marginLeft: '0.25rem' }}
            >
              *
            </span>
          )}
        </label>
      )}

      <div className="relative">
        <select
          id={id}
          name={name}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          required={required}
          aria-describedby={errorId}
          aria-invalid={!!error}
          aria-required={required}
          style={selectStyle}
          onFocus={(e) => {
            if (!error) {
              e.currentTarget.style.borderColor = 'var(--color-border-focus)'
              e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-focus-ring, rgba(104, 163, 149, 0.15))'
            } else {
              e.currentTarget.style.borderColor = 'var(--color-border-error, var(--color-error))'
              e.currentTarget.style.boxShadow = '0 0 0 3px var(--color-error-ring, rgba(178, 90, 88, 0.15))'
            }
          }}
          onBlur={(e) => {
            if (!error) {
              e.currentTarget.style.borderColor = 'var(--color-border)'
              e.currentTarget.style.boxShadow = 'none'
            }
          }}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>

        {/* Custom chevron */}
        <span
          aria-hidden="true"
          className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ChevronDown size={16} />
        </span>
      </div>

      {error && (
        <span
          id={errorId}
          role="alert"
          style={{
            color: 'var(--color-error)',
            fontSize: 'var(--font-size-xs, 0.75rem)',
          }}
        >
          {error}
        </span>
      )}
    </div>
  )
}
