/**
 * DraftPrompt — "Save draft before minimizing?" dialog
 *
 * Shown when minimizing a persistent modal with unsaved changes.
 */

import { Button } from './Button'

interface DraftPromptProps {
  onSaveAndMinimize: () => void
  onMinimizeWithoutSaving: () => void
  onCancel: () => void
}

export function DraftPrompt({ onSaveAndMinimize, onMinimizeWithoutSaving, onCancel }: DraftPromptProps) {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 'var(--z-modal-stacked, 60)' as unknown as number,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          borderRadius: 'var(--vibe-radius-modal, 16px)',
          boxShadow: 'var(--shadow-lg)',
          padding: '1.5rem',
          maxWidth: 360,
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
          Save draft before minimizing?
        </h3>
        <p
          style={{
            margin: '0 0 1rem',
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-sm, 0.875rem)',
          }}
        >
          You have unsaved changes that will be lost if not saved.
        </p>
        <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={onCancel} size="sm">
            Cancel
          </Button>
          <Button variant="ghost" onClick={onMinimizeWithoutSaving} size="sm">
            Minimize without saving
          </Button>
          <Button variant="primary" onClick={onSaveAndMinimize} size="sm">
            Save & minimize
          </Button>
        </div>
      </div>
    </div>
  )
}
