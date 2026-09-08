/**
 * MinimizedPill — Individual pill representing a minimized persistent modal
 *
 * Clicking the pill body restores the modal (removes it from the manager's
 * minimized list — the underlying modal stays mounted the whole time, so
 * removing it there is all that's needed for the overlay to reappear).
 * The small x (and right-click, kept as a power-user shortcut) DISMISS the
 * pill instead — that also tells the still-mounted modal to truly close,
 * so nothing is left running invisibly with no pill left to bring it back.
 */

import { X } from 'lucide-react'
import type { MinimizedModal } from '@/contexts/ModalManagerContext'
import { Tooltip } from './Tooltip'

interface MinimizedPillProps {
  modal: MinimizedModal
  onRestore: (id: string) => void
  onDismiss: (id: string) => void
}

export function MinimizedPill({ modal, onRestore, onDismiss }: MinimizedPillProps) {
  const Icon = modal.icon

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    onDismiss(modal.id)
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        background: 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, var(--color-bg-card))',
        borderRadius: '9999px',
        maxWidth: 200,
        overflow: 'hidden',
      }}
      onContextMenu={handleContextMenu}
    >
      <Tooltip content={`Restore: ${modal.title}`}>
        <button
          onClick={() => onRestore(modal.id)}
          className="btn-inline"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.375rem',
            background: 'transparent',
            border: 'none',
            borderRadius: '9999px 0 0 9999px',
            padding: '6px 8px 6px 12px',
            fontSize: 'var(--font-size-xs, 0.75rem)',
            color: 'var(--color-text-primary)',
            cursor: 'pointer',
            maxWidth: 160,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}
        >
          {Icon && <Icon size={14} />}
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {modal.title.length > 15 ? modal.title.slice(0, 15) + '...' : modal.title}
          </span>
          {modal.hasUnsavedChanges && (
            <span style={{ color: 'var(--color-accent, orange)', fontSize: '0.6rem' }}>●</span>
          )}
        </button>
      </Tooltip>
      <Tooltip content="Dismiss">
        <button
          onClick={() => onDismiss(modal.id)}
          aria-label={`Dismiss ${modal.title}`}
          className="btn-icon"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'transparent',
            border: 'none',
            borderRadius: '0 9999px 9999px 0',
            padding: '6px 10px 6px 4px',
            color: 'var(--color-text-secondary)',
            cursor: 'pointer',
          }}
        >
          <X size={12} />
        </button>
      </Tooltip>
    </div>
  )
}
