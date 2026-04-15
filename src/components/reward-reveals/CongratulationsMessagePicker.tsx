/**
 * CongratulationsMessagePicker — Dropdown of preset messages + custom text input.
 *
 * Shows {reward} as a highlighted placeholder in preview text. Mom picks
 * a preset or writes her own. Grouped by category (General, Milestone,
 * Streak, Completion, Effort).
 */

import { useState, useMemo } from 'react'
import { MessageSquare, ChevronDown, Edit3 } from 'lucide-react'
import { useCongratulationsMessages } from '@/hooks/useRewardReveals'
import type { CongratulationsMessage } from '@/types/reward-reveals'

const CATEGORY_LABELS: Record<string, string> = {
  general: 'General',
  milestone: 'Milestone',
  streak: 'Streak',
  completion: 'Completion',
  effort: 'Effort',
}

interface CongratulationsMessagePickerProps {
  value: string
  onChange: (text: string) => void
  familyId?: string | null
  /** Current prize name for live {reward} preview */
  prizeName?: string
}

export function CongratulationsMessagePicker({
  value,
  onChange,
  familyId,
  prizeName,
}: CongratulationsMessagePickerProps) {
  const { data: messages = [] } = useCongratulationsMessages(familyId)
  const [isOpen, setIsOpen] = useState(false)
  const [isCustom, setIsCustom] = useState(false)

  const grouped = useMemo(() => {
    const groups: Record<string, CongratulationsMessage[]> = {}
    for (const m of messages) {
      if (!groups[m.category]) groups[m.category] = []
      groups[m.category].push(m)
    }
    return groups
  }, [messages])

  const previewText = useMemo(() => {
    if (!value) return ''
    if (!prizeName) return value.replace(/\{reward\}/gi, '___')
    return value.replace(/\{reward\}/gi, prizeName)
  }, [value, prizeName])

  const handleSelect = (text: string) => {
    onChange(text)
    setIsOpen(false)
    setIsCustom(false)
  }

  const handleCustom = () => {
    setIsCustom(true)
    setIsOpen(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
      <label
        style={{
          display: 'block',
          fontSize: 'var(--font-size-sm)',
          fontWeight: 600,
          color: 'var(--color-text-primary)',
        }}
      >
        Congratulations message
      </label>

      {/* Dropdown trigger */}
      {!isCustom && (
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--vibe-radius-input, 0.5rem)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-card)',
            color: value ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-sm)',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <MessageSquare size={16} style={{ flexShrink: 0 }} />
            {value || 'Pick a message...'}
          </span>
          <ChevronDown
            size={16}
            style={{
              flexShrink: 0,
              transform: isOpen ? 'rotate(180deg)' : 'none',
              transition: 'transform 0.2s',
            }}
          />
        </button>
      )}

      {/* Dropdown panel */}
      {isOpen && (
        <div
          style={{
            maxHeight: '280px',
            overflowY: 'auto',
            borderRadius: 'var(--vibe-radius-card, 0.75rem)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-card)',
          }}
        >
          {Object.entries(grouped).map(([category, msgs]) => (
            <div key={category}>
              <div
                style={{
                  padding: '0.375rem 0.75rem',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 700,
                  color: 'var(--color-text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  backgroundColor: 'var(--color-bg-secondary)',
                  borderBottom: '1px solid var(--color-border)',
                }}
              >
                {CATEGORY_LABELS[category] ?? category}
              </div>
              {msgs.map((msg) => {
                const isSelected = value === msg.message_text
                return (
                  <button
                    key={msg.id}
                    type="button"
                    onClick={() => handleSelect(msg.message_text)}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '0.5rem 0.75rem',
                      textAlign: 'left',
                      fontSize: 'var(--font-size-sm)',
                      color: 'var(--color-text-primary)',
                      backgroundColor: isSelected
                        ? 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, transparent)'
                        : 'transparent',
                      border: 'none',
                      borderBottom: '1px solid var(--color-border)',
                      cursor: 'pointer',
                    }}
                  >
                    <HighlightReward text={msg.message_text} />
                  </button>
                )
              })}
            </div>
          ))}

          {/* Write your own */}
          <button
            type="button"
            onClick={handleCustom}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.625rem 0.75rem',
              textAlign: 'left',
              fontSize: 'var(--font-size-sm)',
              fontWeight: 600,
              color: 'var(--color-btn-primary-bg)',
              backgroundColor: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Edit3 size={14} /> Write your own
          </button>
        </div>
      )}

      {/* Custom text input */}
      {isCustom && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder='Write your message... use {reward} for the reward name'
            rows={2}
            autoFocus
            style={{
              width: '100%',
              padding: '0.5rem 0.75rem',
              borderRadius: 'var(--vibe-radius-input, 0.5rem)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-card)',
              color: 'var(--color-text-primary)',
              fontSize: 'var(--font-size-sm)',
              resize: 'vertical',
            }}
          />
          <button
            type="button"
            onClick={() => {
              setIsCustom(false)
              setIsOpen(false)
            }}
            style={{
              alignSelf: 'flex-start',
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-secondary)',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
            }}
          >
            Back to presets
          </button>
        </div>
      )}

      {/* Live preview */}
      {value && (
        <div
          style={{
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--vibe-radius-input, 0.5rem)',
            backgroundColor: 'var(--color-bg-secondary)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-secondary)',
          }}
        >
          <span
            style={{
              fontSize: 'var(--font-size-xs)',
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.03em',
              marginRight: '0.5rem',
            }}
          >
            Preview:
          </span>
          {previewText}
        </div>
      )}
    </div>
  )
}

/** Highlights {reward} as a styled inline badge */
function HighlightReward({ text }: { text: string }) {
  const parts = text.split(/(\{reward\})/gi)
  return (
    <>
      {parts.map((part, i) =>
        part.toLowerCase() === '{reward}' ? (
          <span
            key={i}
            style={{
              display: 'inline',
              padding: '0.05rem 0.3rem',
              borderRadius: '0.25rem',
              backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)',
              color: 'var(--color-btn-primary-bg)',
              fontWeight: 600,
              fontSize: 'var(--font-size-xs)',
            }}
          >
            {'{reward}'}
          </span>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </>
  )
}
