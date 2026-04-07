/**
 * ModalFooter — Sticky footer for modal actions
 */

import type { ReactNode } from 'react'

interface ModalFooterProps {
  children: ReactNode
}

export function ModalFooter({ children }: ModalFooterProps) {
  return (
    <div
      className="shrink-0"
      style={{
        padding: '0.75rem 1.25rem',
        borderTop: '1px solid var(--color-border)',
        background: 'var(--color-bg-card)',
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '0.5rem',
      }}
    >
      {children}
    </div>
  )
}
