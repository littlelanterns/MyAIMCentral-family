/**
 * LimitPrompt — "You have 3 items open — close one to continue?" dialog
 *
 * Shown when attempting to minimize a 4th modal.
 */

import { Button } from './Button'
import type { MinimizedModal } from '@/contexts/ModalManagerContext'

interface LimitPromptProps {
  minimizedModals: MinimizedModal[]
  onCloseItem: (id: string) => void
  onCancel: () => void
}

export function LimitPrompt({ minimizedModals, onCloseItem, onCancel }: LimitPromptProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 'var(--z-modal-stacked, 60)' as unknown as number,
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'var(--color-bg-overlay, rgba(0,0,0,0.5))',
        }}
        onClick={onCancel}
        aria-hidden="true"
      />
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          position: 'relative',
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--vibe-radius-modal, 16px)',
          boxShadow: 'var(--shadow-lg)',
          padding: '1.5rem',
          maxWidth: 400,
          width: '90%',
        }}
      >
        <h3
          style={{
            margin: '0 0 0.75rem',
            color: 'var(--color-text-heading)',
            fontFamily: 'var(--font-heading)',
            fontSize: '1.1rem',
          }}
        >
          Close one to continue
        </h3>
        <p
          style={{
            margin: '0 0 1rem',
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-sm, 0.875rem)',
          }}
        >
          You have 3 items open. Close one to make room:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1rem' }}>
          {minimizedModals.map((m) => (
            <button
              key={m.id}
              onClick={() => onCloseItem(m.id)}
              className="btn-inline"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.5rem 0.75rem',
                background: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                borderRadius: 'var(--vibe-radius-input, 8px)',
                cursor: 'pointer',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-sm, 0.875rem)',
              }}
            >
              <span>{m.title}</span>
              {m.hasUnsavedChanges && (
                <span style={{ color: 'var(--color-accent, orange)', fontSize: '0.7rem' }}>
                  unsaved
                </span>
              )}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onCancel} size="sm">
            Cancel
          </Button>
        </div>
      </div>
    </div>
  )
}
