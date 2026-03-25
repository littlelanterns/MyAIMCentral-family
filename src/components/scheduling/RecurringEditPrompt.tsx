/**
 * RecurringEditPrompt (PRD-35)
 *
 * When editing an existing recurring schedule, shows a prompt asking:
 *   - Edit this occurrence only
 *   - Edit this and all future occurrences
 *   - Edit entire series
 *
 * Applies to ALL recurring patterns, not just custody.
 *
 * Usage:
 *   <RecurringEditPrompt
 *     isOpen={showEditPrompt}
 *     onSelect={(mode) => handleRecurringEdit(mode)}
 *     onCancel={() => setShowEditPrompt(false)}
 *   />
 */

import { Calendar, ChevronRight } from 'lucide-react'

export type RecurringEditMode = 'this_only' | 'this_and_future' | 'entire_series'

interface RecurringEditPromptProps {
  isOpen: boolean
  onSelect: (mode: RecurringEditMode) => void
  onCancel: () => void
}

const OPTIONS: { mode: RecurringEditMode; label: string; description: string }[] = [
  {
    mode: 'this_only',
    label: 'Only this time',
    description: 'Change just this one occurrence. The rest stay the same.',
  },
  {
    mode: 'this_and_future',
    label: 'This and all future',
    description: 'Change this occurrence and everything after it.',
  },
  {
    mode: 'entire_series',
    label: 'The entire schedule',
    description: 'Change every occurrence — past, present, and future.',
  },
]

export function RecurringEditPrompt({ isOpen, onSelect, onCancel }: RecurringEditPromptProps) {
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 50,
          backgroundColor: 'rgba(0, 0, 0, 0.4)',
        }}
        onClick={onCancel}
        aria-hidden
      />

      {/* Modal */}
      <div
        role="dialog"
        aria-label="Edit repeating schedule"
        style={{
          position: 'fixed',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          zIndex: 51,
          width: 'min(360px, calc(100vw - 32px))',
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--vibe-radius-card, 12px)',
          boxShadow: '0 12px 40px rgba(0,0,0,0.2)',
          overflow: 'hidden',
          animation: 'recurringEditFadeIn 150ms ease-out',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px 12px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <Calendar size={18} style={{ color: 'var(--color-sage-teal, #68a395)' }} />
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: 'var(--color-text-heading)',
            }}
          >
            This repeats
          </span>
        </div>

        <p
          style={{
            padding: '12px 20px 4px',
            fontSize: 13,
            color: 'var(--color-text-secondary)',
            lineHeight: 1.4,
          }}
        >
          What would you like to change?
        </p>

        {/* Options */}
        <div style={{ padding: '8px 12px 12px' }}>
          {OPTIONS.map((opt) => (
            <button
              key={opt.mode}
              onClick={() => onSelect(opt.mode)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                width: '100%',
                padding: '12px',
                borderRadius: 'var(--vibe-radius-sm, 8px)',
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-bg-secondary)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    marginBottom: 2,
                  }}
                >
                  {opt.label}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--color-text-secondary)',
                    lineHeight: 1.3,
                  }}
                >
                  {opt.description}
                </div>
              </div>
              <ChevronRight
                size={16}
                style={{ color: 'var(--color-text-secondary)', flexShrink: 0, marginLeft: 8 }}
              />
            </button>
          ))}
        </div>

        {/* Cancel */}
        <div
          style={{
            padding: '0 12px 12px',
          }}
        >
          <button
            onClick={onCancel}
            style={{
              width: '100%',
              padding: '8px',
              borderRadius: 'var(--vibe-radius-sm, 8px)',
              border: '1px solid var(--color-border)',
              background: 'transparent',
              color: 'var(--color-text-secondary)',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'background 0.15s',
            }}
          >
            Cancel
          </button>
        </div>
      </div>

      <style>{`
        @keyframes recurringEditFadeIn {
          from { opacity: 0; transform: translate(-50%, -50%) scale(0.96); }
          to   { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
      `}</style>
    </>
  )
}
