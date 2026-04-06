import { useState, useCallback } from 'react'
import { Bell } from 'lucide-react'
import { Tooltip } from '@/components/shared/Tooltip'
import { BreathingGlow } from '@/components/ui/BreathingGlow'
import { useUnreadNotificationCount, useNotificationRealtime } from '@/hooks/useNotifications'
import { NotificationTray } from './NotificationTray'

/**
 * NotificationBell — PRD-15 Phase B
 *
 * Shell header icon with BreathingGlow when unread notifications exist.
 * Opens NotificationTray dropdown on click.
 * Added to MomShell, AdultShell, IndependentShell. NOT in Guided/Play.
 */
export function NotificationBell() {
  const [trayOpen, setTrayOpen] = useState(false)
  const { data: unreadCount = 0 } = useUnreadNotificationCount()

  // Subscribe to Realtime for instant updates
  useNotificationRealtime()

  const toggleTray = useCallback(() => {
    setTrayOpen((prev) => !prev)
  }, [])

  const closeTray = useCallback(() => {
    setTrayOpen(false)
  }, [])

  return (
    <div style={{ position: 'relative' }}>
      <BreathingGlow active={unreadCount > 0}>
        <Tooltip content={unreadCount > 0 ? `${unreadCount} notification${unreadCount === 1 ? '' : 's'}` : 'Notifications'}>
          <button
            onClick={toggleTray}
            className="p-2 rounded-full hover:scale-110 transition-all duration-200"
            style={{
              background: 'transparent',
              color: 'var(--color-btn-primary-bg, #68a395)',
              minHeight: 'unset',
            }}
            aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
          >
            <Bell size={20} />
          </button>
        </Tooltip>
      </BreathingGlow>

      {trayOpen && <NotificationTray onClose={closeTray} />}
    </div>
  )
}
