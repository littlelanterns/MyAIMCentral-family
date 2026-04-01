/**
 * PRD-25 Phase B: WriteDrawerMessages — Tab 2 (stub)
 * Friendly "Coming soon" placeholder until PRD-15 messaging is built.
 */

import { MessageCircle } from 'lucide-react'

export function WriteDrawerMessages() {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-6 gap-4">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
      >
        <MessageCircle size={32} style={{ color: 'var(--color-text-secondary)' }} />
      </div>
      <h3
        className="text-base font-medium"
        style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
      >
        Messages are coming soon!
      </h3>
      <p className="text-sm text-center leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
        When messaging is ready, you'll be able to write to your family here.
      </p>
    </div>
  )
}
