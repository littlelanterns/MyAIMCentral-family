/**
 * MathGate — Simple math check for Guided/Play shell users
 *
 * Shows a random addition problem (2-9 range).
 * Correct answer → opens the report modal.
 * Wrong answer → silently dismisses. No error, no retry.
 */

import { useState, useMemo, useRef, useEffect } from 'react'
import { X } from 'lucide-react'

interface MathGateProps {
  onSuccess: () => void
  onDismiss: () => void
}

export function MathGate({ onSuccess, onDismiss }: MathGateProps) {
  const { a, b } = useMemo(() => ({
    a: Math.floor(Math.random() * 8) + 2,
    b: Math.floor(Math.random() * 8) + 2,
  }), [])

  const [answer, setAnswer] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const num = parseInt(answer, 10)
    if (num === a + b) {
      onSuccess()
    } else {
      onDismiss()
    }
  }

  return (
    <div className="glitch-reporter-overlay fixed inset-0 z-9995 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={onDismiss}>
      <div className="w-[90%] max-w-[320px] p-6"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          borderRadius: 'var(--vibe-radius-card)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}>

        <div className="flex justify-between items-center mb-4">
          <span className="text-base font-semibold"
            style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-heading)' }}>
            Quick check!
          </span>
          <button onClick={onDismiss}
            className="p-1 cursor-pointer bg-transparent border-none"
            style={{ color: 'var(--color-text-secondary)' }} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <p className="text-xl font-semibold text-center mb-4"
            style={{ color: 'var(--color-text-primary)' }}>
            What is {a} + {b}?
          </p>

          <input ref={inputRef} type="number" inputMode="numeric"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="w-full text-center text-lg box-border"
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--vibe-radius-input)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-primary)',
              color: 'var(--color-text-primary)',
              outline: 'none',
            }}
            placeholder="?" />

          <button type="submit" disabled={!answer.trim()}
            className="w-full mt-3 py-2.5 font-semibold border-none"
            style={{
              fontSize: 'var(--font-size-base)',
              borderRadius: 'var(--vibe-radius-input)',
              backgroundColor: 'var(--color-btn-primary-bg)',
              color: 'var(--color-text-on-primary)',
              cursor: answer.trim() ? 'pointer' : 'not-allowed',
              opacity: answer.trim() ? 1 : 0.5,
            }}>
            Go
          </button>
        </form>
      </div>
    </div>
  )
}
