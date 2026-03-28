/**
 * MinimizedPillBar — Floating bar showing minimized persistent modals
 *
 * Fixed at bottom of screen, above mobile bottom nav.
 * Shows pill for each minimized modal with restore-on-click.
 */

import { useModalManager } from '@/contexts/ModalManagerContext'
import { MinimizedPill } from './MinimizedPill'

export function MinimizedPillBar() {
  const { minimizedModals, restore, close } = useModalManager()

  if (minimizedModals.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 'var(--z-pill-bar, 40)' as unknown as number,
        display: 'flex',
        gap: '0.5rem',
        padding: '4px 8px',
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        borderRadius: '9999px',
        boxShadow: 'var(--shadow-lg, 0 8px 32px rgba(0,0,0,0.15))',
        maxWidth: 'min(90vw, 500px)',
      }}
    >
      {minimizedModals.map((modal) => (
        <MinimizedPill
          key={modal.id}
          modal={modal}
          onRestore={restore}
          onClose={close}
        />
      ))}
    </div>
  )
}
