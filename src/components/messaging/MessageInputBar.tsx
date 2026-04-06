/**
 * MessageInputBar — PRD-15 Screen 3 + Phase E
 *
 * Text input + Send button at the bottom of a chat thread.
 * LiLa "Ask LiLa & Send" button on LEFT side (avoids accidental taps near Send).
 * Coaching intercept: when coaching is enabled, Send triggers coaching check
 * before the message actually sends.
 */

import { useState, useRef, useCallback } from 'react'
import { Send, Sparkles } from 'lucide-react'

interface MessageInputBarProps {
  onSend: (content: string) => void
  onSendWithLila?: (content: string) => void
  onCoachingIntercept?: (content: string) => Promise<boolean>
  showLilaButton?: boolean
  coachingEnabled?: boolean
  disabled?: boolean
  placeholder?: string
  lilaStreaming?: boolean
}

export function MessageInputBar({
  onSend,
  onSendWithLila,
  onCoachingIntercept,
  showLilaButton,
  coachingEnabled,
  disabled,
  placeholder,
  lilaStreaming,
}: MessageInputBarProps) {
  const [text, setText] = useState('')
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = useCallback(async () => {
    const trimmed = text.trim()
    if (!trimmed) return

    // If coaching is enabled, intercept before sending
    if (coachingEnabled && onCoachingIntercept) {
      const shouldSend = await onCoachingIntercept(trimmed)
      if (!shouldSend) {
        // User chose to edit — keep text in input, refocus
        inputRef.current?.focus()
        return
      }
    }

    onSend(trimmed)
    setText('')
    inputRef.current?.focus()
  }, [text, onSend, coachingEnabled, onCoachingIntercept])

  const handleLilaSend = useCallback(() => {
    const trimmed = text.trim()
    if (!trimmed || !onSendWithLila) return
    onSendWithLila(trimmed)
    setText('')
    inputRef.current?.focus()
  }, [text, onSendWithLila])

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
      {/* LiLa "Ask LiLa & Send" button — LEFT side per PRD-15 convention */}
      {showLilaButton && onSendWithLila && (
        <button
          onClick={handleLilaSend}
          disabled={disabled || lilaStreaming || !text.trim()}
          aria-label="Ask LiLa & Send"
          title="Ask LiLa & Send"
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            border: 'none',
            backgroundColor: text.trim() && !lilaStreaming
              ? 'var(--color-btn-primary-bg)'
              : 'var(--color-bg-tertiary)',
            color: text.trim() && !lilaStreaming
              ? 'var(--color-text-on-primary, #fff)'
              : 'var(--color-text-muted)',
            cursor: text.trim() && !lilaStreaming ? 'pointer' : 'default',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            transition: 'background-color 150ms',
          }}
        >
          <Sparkles size={13} />
        </button>
      )}

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
