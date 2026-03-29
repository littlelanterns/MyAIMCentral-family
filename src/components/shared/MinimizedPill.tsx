/**
 * MinimizedPill — Individual pill representing a minimized persistent modal
 */

import type { MinimizedModal } from '@/contexts/ModalManagerContext'
import { Tooltip } from './Tooltip'

interface MinimizedPillProps {
  modal: MinimizedModal
  onRestore: (id: string) => void
  onClose: (id: string) => void
}

export function MinimizedPill({ modal, onRestore, onClose }: MinimizedPillProps) {
  const Icon = modal.icon

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault()
    onClose(modal.id)
  }

  return (
    <Tooltip content={`Restore: ${modal.title}`}>
    <button
      onClick={() => onRestore(modal.id)}
      onContextMenu={handleContextMenu}
      className="btn-inline"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.375rem',
        background: 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, var(--color-bg-card))',
        border: 'none',
        borderRadius: '9999px',
        padding: '6px 12px',
        fontSize: 'var(--font-size-xs, 0.75rem)',
        color: 'var(--color-text-primary)',
        cursor: 'pointer',
        maxWidth: 180,
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
  )
}
