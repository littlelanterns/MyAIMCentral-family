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
    a: Math.floor(Math.random() * 8) + 2, // 2-9
    b: Math.floor(Math.random() * 8) + 2, // 2-9
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
    <div
      className="glitch-reporter-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9995,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(0,0,0,0.4)',
      }}
      onClick={onDismiss}
    >
      <div
        style={{
          backgroundColor: 'var(--color-surface, #fff)',
          borderRadius: 'var(--vibe-radius-card, 12px)',
          padding: '24px',
          maxWidth: '320px',
          width: '90%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--color-text-primary, #333)' }}>
            Quick check!
          </span>
          <button
            onClick={onDismiss}
            style={{
              background: 'none',
              border: 'none',
              padding: '4px',
              cursor: 'pointer',
              color: 'var(--color-text-secondary, #666)',
            }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <p style={{
            fontSize: '20px',
            fontWeight: 600,
            textAlign: 'center',
            marginBottom: '16px',
            color: 'var(--color-text-primary, #333)',
          }}>
            What is {a} + {b}?
          </p>

          <input
            ref={inputRef}
            type="number"
            inputMode="numeric"
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            style={{
              width: '100%',
              padding: '10px 12px',
              fontSize: '18px',
              textAlign: 'center',
              borderRadius: 'var(--vibe-radius-input, 8px)',
              border: '1px solid var(--color-border-default, #ddd)',
              backgroundColor: 'var(--color-bg-secondary, #f5f5f5)',
              color: 'var(--color-text-primary, #333)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
            placeholder="?"
          />

          <button
            type="submit"
            disabled={!answer.trim()}
            style={{
              width: '100%',
              marginTop: '12px',
              padding: '10px',
              fontSize: '16px',
              fontWeight: 600,
              borderRadius: 'var(--vibe-radius-input, 8px)',
              border: 'none',
              backgroundColor: 'var(--color-btn-primary-bg, #4f46e5)',
              color: 'var(--color-btn-primary-text, #fff)',
              cursor: answer.trim() ? 'pointer' : 'not-allowed',
              opacity: answer.trim() ? 1 : 0.5,
            }}
          >
            Go
          </button>
        </form>
      </div>
    </div>
  )
}
