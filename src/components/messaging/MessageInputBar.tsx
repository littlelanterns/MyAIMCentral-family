/**
 * MessageInputBar — PRD-15 Screen 3
 *
 * Text input + Send button at the bottom of a chat thread.
 * LiLa button placeholder on left (Phase E).
 */

import { useState, useRef, useCallback } from 'react'
import { Send } from 'lucide-react'

interface MessageInputBarProps {
  onSend: (content: string) => void
  disabled?: boolean
  placeholder?: string
}

export function MessageInputBar({ onSend, disabled, placeholder }: MessageInputBarProps) {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed) return
    onSend(trimmed)
    setText('')
    // Refocus input
    inputRef.current?.focus()
  }, [text, onSend])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [handleSend])

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-end',
        gap: '0.5rem',
        padding: '0.75rem 1rem',
        borderTop: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-bg-primary)',
      }}
    >
      {/* Phase E: LiLa "Ask LiLa & Send" button goes here on the left */}

      <textarea
        ref={inputRef}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder ?? 'Type a message...'}
        disabled={disabled}
        rows={1}
        style={{
          flex: 1,
          resize: 'none',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--vibe-radius-input, 8px)',
          padding: '0.5rem 0.75rem',
          fontSize: '0.875rem',
          color: 'var(--color-text-primary)',
          backgroundColor: 'var(--color-bg-secondary)',
          fontFamily: 'inherit',
          lineHeight: '1.4',
          maxHeight: '120px',
          overflow: 'auto',
        }}
      />

      <button
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        aria-label="Send message"
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          border: 'none',
          backgroundColor: text.trim()
            ? 'var(--color-btn-primary-bg)'
            : 'var(--color-bg-tertiary)',
          color: text.trim()
            ? 'var(--color-text-on-primary, #fff)'
            : 'var(--color-text-muted)',
          cursor: text.trim() ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          transition: 'background-color 150ms',
        }}
      >
        <Send size={16} />
      </button>
    </div>
  )
}
