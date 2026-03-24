/**
 * Input (PRD-03 Design System)
 *
 * Supported types: text, number, date, email, password.
 * Optional label, hint, and error message.
 * Focus state: border-focus + focus-ring CSS properties.
 * Error state: border-error + error-ring.
 * Zero hardcoded hex colors — all CSS custom properties.
 */

import { useId, type ChangeEvent } from 'react'

export interface InputProps {
  type?: 'text' | 'number' | 'date' | 'email' | 'password'
  label?: string
  error?: string
  hint?: string
  value: string | number
  onChange: (e: ChangeEvent<HTMLInputElement>) => void
  placeholder?: string
  disabled?: boolean
  required?: boolean
  className?: string
  name?: string
  autoComplete?: string
  autoFocus?: boolean
  maxLength?: number
  min?: number | string
  max?: number | string
  step?: number | string
}

export function Input({
  type = 'text',
  label,
  error,
  hint,
  value,
  onChange,
  placeholder,
  disabled = false,
  required = false,
  className = '',
  name,
  autoComplete,
  autoFocus,
  maxLength,
  min,
  max,
  step,
}: InputProps) {
  const id = useId()
  const hintId = hint ? `${id}-hint` : undefined
  const errorId = error ? `${id}-error` : undefined
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined

  const inputStyle: React.CSSProperties = {
    backgroundColor: 'var(--color-bg-input)',
    color: 'var(--color-text-primary)',
    border: `1px solid ${error ? 'var(--color-border-error, var(--color-error))' : 'var(--color-border)'}`,
    borderRadius: 'var(--vibe-radius-input, 8px)',
    outline: 'none',
    width: '100%',
    padding: '0.5rem 0.75rem',
    fontSize: 'var(--font-size-sm, 0.875rem)',
    transition: 'border-color var(--vibe-transition, 0.2s ease), box-shadow var(--vibe-transition, 0.2s ease)',
    minHeight: 'var(--touch-target-min, 44px)',
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

      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoComplete={autoComplete}
        autoFocus={autoFocus}
        maxLength={maxLength}
        min={min}
        max={max}
        step={step}
        aria-describedby={describedBy}
        aria-invalid={!!error}
        aria-required={required}
        style={inputStyle}
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
      />

      {hint && !error && (
        <span
          id={hintId}
          style={{
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-xs, 0.75rem)',
          }}
        >
          {hint}
        </span>
      )}

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
