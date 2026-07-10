/**
 * PRD-25 Phase B: WriteDrawerMessages — Tab 2
 *
 * Gives Guided kids a direct path to the full Messages page from inside the
 * Write drawer. This is the second discoverability surface for Guided members
 * (the first is the Messages entry in their More menu). Keeping the Write
 * drawer tab around means kids who are already in "write something to my
 * family" mode have the shortest possible path to their inbox.
 *
 * D-GDCX-1 (2026-07, founder-ratified): the redirect-to-/messages pattern is
 * the PERMANENT design, not an interim placeholder awaiting an inline
 * compose surface. An inline drawer compose would duplicate the coached
 * `/messages` surface (Convention #139 before-send coaching) for no gain —
 * this supersedes PRD-25 Screen 2's inline-Messages-tab spec.
 */

import { useNavigate } from 'react-router-dom'
import { MessageCircle, ArrowRight } from 'lucide-react'
import { useUnreadNotificationCount } from '@/hooks/useNotifications'

export function WriteDrawerMessages() {
  const navigate = useNavigate()
  const { data: unreadCount = 0 } = useUnreadNotificationCount()

  return (
    <div className="flex flex-col items-center justify-center py-10 px-6 gap-4">
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
      >
        <MessageCircle size={32} style={{ color: 'var(--color-btn-primary-bg)' }} />
      </div>

      <h3
        className="text-base font-medium text-center"
        style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
      >
        Write to your family
      </h3>

      <p
        className="text-sm text-center leading-relaxed"
        style={{ color: 'var(--color-text-secondary)', maxWidth: '260px' }}
      >
        Send messages to your parents, brothers, and sisters. Tap below to open
        your Messages.
      </p>

      <button
        onClick={() => navigate('/messages')}
        className="flex items-center gap-2 px-5 py-2.5 rounded-full font-medium text-sm transition-all hover:scale-105"
        style={{
          background: 'var(--surface-primary, var(--color-btn-primary-bg))',
          color: 'var(--color-text-on-primary, #fff)',
          border: 'none',
          minHeight: '44px',
        }}
      >
        Open Messages
        <ArrowRight size={16} />
        {unreadCount > 0 && (
          <span
            className="inline-flex items-center justify-center rounded-full text-xs font-bold"
            style={{
              minWidth: '20px',
              height: '20px',
              padding: '0 6px',
              backgroundColor: 'var(--color-bg-primary, #fff)',
              color: 'var(--color-btn-primary-bg)',
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>
    </div>
  )
}
