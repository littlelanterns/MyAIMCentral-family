import { useEffect, useRef, useCallback, useMemo, useState } from 'react'
import {
  MessageSquare,
  Calendar,
  CheckSquare,
  ShieldAlert,
  Sparkles,
  Send,
  X,
  Check,
  Settings2,
} from 'lucide-react'
import {
  useNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDismissNotification,
} from '@/hooks/useNotifications'
import { NotificationPreferencesPanel } from './NotificationPreferencesPanel'
import type { Notification, NotificationCategory } from '@/types/messaging'

const CATEGORY_ICONS: Record<NotificationCategory, typeof MessageSquare> = {
  messages: MessageSquare,
  requests: Send,
  calendar: Calendar,
  tasks: CheckSquare,
  safety: ShieldAlert,
  lila: Sparkles,
}

const CATEGORY_LABELS: Record<NotificationCategory, string> = {
  messages: 'Messages',
  requests: 'Requests',
  calendar: 'Calendar',
  tasks: 'Tasks',
  safety: 'Safety',
  lila: 'LiLa',
}

function formatTimeAgo(dateStr: string): string {
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diffMs = now - then
  const diffMin = Math.floor(diffMs / 60_000)
  if (diffMin < 1) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDays = Math.floor(diffHr / 24)
  if (diffDays === 1) return 'yesterday'
  return `${diffDays}d ago`
}

/**
 * Flood collapsing: 3+ notifications from same source_type within 5 minutes → summary.
 */
function collapseFloods(notifications: Notification[]): (Notification | { collapsed: true; count: number; representative: Notification })[] {
  const result: (Notification | { collapsed: true; count: number; representative: Notification })[] = []
  const grouped = new Map<string, Notification[]>()

  // Group by source_type + 5-minute windows
  for (const n of notifications) {
    const key = `${n.notification_type}:${n.source_type ?? 'none'}`
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(n)
  }

  for (const [, group] of grouped) {
    if (group.length < 3) {
      result.push(...group)
      continue
    }

    // Check if they're within 5 minutes of each other
    const sorted = group.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    let currentBatch: Notification[] = [sorted[0]]

    for (let i = 1; i < sorted.length; i++) {
      const prevTime = new Date(sorted[i - 1].created_at).getTime()
      const currTime = new Date(sorted[i].created_at).getTime()
      if (prevTime - currTime <= 5 * 60_000) {
        currentBatch.push(sorted[i])
      } else {
        if (currentBatch.length >= 3) {
          result.push({ collapsed: true, count: currentBatch.length, representative: currentBatch[0] })
        } else {
          result.push(...currentBatch)
        }
        currentBatch = [sorted[i]]
      }
    }

    if (currentBatch.length >= 3) {
      result.push({ collapsed: true, count: currentBatch.length, representative: currentBatch[0] })
    } else {
      result.push(...currentBatch)
    }
  }

  // Sort by priority then time
  return result.sort((a, b) => {
    const aNotif = 'collapsed' in a ? a.representative : a
    const bNotif = 'collapsed' in b ? b.representative : b
    // Safety first
    if (aNotif.priority === 'high' && bNotif.priority !== 'high') return -1
    if (bNotif.priority === 'high' && aNotif.priority !== 'high') return 1
    return new Date(bNotif.created_at).getTime() - new Date(aNotif.created_at).getTime()
  })
}

interface NotificationTrayProps {
  onClose: () => void
}

export function NotificationTray({ onClose }: NotificationTrayProps) {
  const { data: notifications = [], isLoading } = useNotifications()
  const markRead = useMarkNotificationRead()
  const markAllRead = useMarkAllNotificationsRead()
  const dismiss = useDismissNotification()
  const trayRef = useRef<HTMLDivElement>(null)
  const [showPrefs, setShowPrefs] = useState(false)

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (trayRef.current && !trayRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [onClose])

  // Close on Escape
  useEffect(() => {
    function handleEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleEsc)
    return () => document.removeEventListener('keydown', handleEsc)
  }, [onClose])

  const collapsed = useMemo(() => collapseFloods(notifications), [notifications])

  const unreadCount = notifications.filter((n) => !n.is_read).length

  const handleNotificationClick = useCallback(
    (notification: Notification) => {
      if (!notification.is_read) {
        markRead.mutate(notification.id)
      }
      if (notification.action_url) {
        onClose()
        window.location.href = notification.action_url
      }
    },
    [markRead, onClose]
  )

  return (
    <div
      ref={trayRef}
      className="absolute right-0 top-full mt-2 z-50 rounded-lg overflow-hidden"
      style={{
        width: 'min(360px, calc(100vw - 24px))',
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-default)',
        boxShadow: 'var(--shadow-lg, 0 10px 15px -3px rgba(0,0,0,0.1))',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={{ borderBottom: '1px solid var(--color-border-default)' }}
      >
        <h3
          className="font-semibold text-sm"
          style={{ color: 'var(--color-text-primary)' }}
        >
          Notifications
          {unreadCount > 0 && (
            <span
              className="ml-2 text-xs px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)',
                color: 'var(--color-btn-primary-bg)',
              }}
            >
              {unreadCount}
            </span>
          )}
        </h3>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              onClick={() => markAllRead.mutate()}
              className="p-1.5 rounded text-xs hover:opacity-80 transition-opacity"
              style={{ color: 'var(--color-btn-primary-bg)' }}
              title="Mark all as read"
            >
              <Check size={16} />
            </button>
          )}
          <button
            onClick={() => setShowPrefs(true)}
            className="p-1.5 rounded hover:opacity-80 transition-opacity"
            style={{ color: 'var(--color-text-secondary)' }}
            title="Notification settings"
          >
            <Settings2 size={16} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:opacity-80 transition-opacity"
            style={{ color: 'var(--color-text-secondary)' }}
            title="Close"
          >
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-y-auto">
        {isLoading ? (
          <div
            className="p-6 text-center text-sm"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Loading...
          </div>
        ) : collapsed.length === 0 ? (
          <div
            className="p-6 text-center text-sm"
            style={{ color: 'var(--color-text-muted)' }}
          >
            All caught up! No notifications.
          </div>
        ) : (
          collapsed.map((item, idx) => {
            if ('collapsed' in item) {
              const n = item.representative
              const Icon = CATEGORY_ICONS[n.category as NotificationCategory] ?? MessageSquare
              return (
                <div
                  key={`collapsed-${idx}`}
                  className="px-4 py-3 flex items-start gap-3"
                  style={{
                    borderBottom: '1px solid var(--color-border-default)',
                    backgroundColor: 'var(--color-bg-card)',
                  }}
                >
                  <div
                    className="mt-0.5 p-1.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, transparent)',
                      color: 'var(--color-btn-primary-bg)',
                    }}
                  >
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                      {item.count} {CATEGORY_LABELS[n.category as NotificationCategory] ?? 'notifications'}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                      {formatTimeAgo(n.created_at)}
                    </p>
                  </div>
                </div>
              )
            }

            const n = item
            const Icon = CATEGORY_ICONS[n.category as NotificationCategory] ?? MessageSquare
            const isSafety = n.priority === 'high'

            return (
              <div
                key={n.id}
                className="px-4 py-3 flex items-start gap-3 cursor-pointer hover:opacity-90 transition-opacity"
                style={{
                  borderBottom: '1px solid var(--color-border-default)',
                  backgroundColor: isSafety
                    ? 'color-mix(in srgb, var(--color-status-error, #ef4444) 8%, var(--color-bg-card))'
                    : n.is_read
                      ? 'var(--color-bg-card)'
                      : 'color-mix(in srgb, var(--color-btn-primary-bg) 5%, var(--color-bg-card))',
                }}
                onClick={() => handleNotificationClick(n)}
              >
                <div
                  className="mt-0.5 p-1.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: isSafety
                      ? 'color-mix(in srgb, var(--color-status-error, #ef4444) 15%, transparent)'
                      : 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, transparent)',
                    color: isSafety
                      ? 'var(--color-status-error, #ef4444)'
                      : 'var(--color-btn-primary-bg)',
                  }}
                >
                  <Icon size={14} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-sm truncate ${n.is_read ? '' : 'font-semibold'}`}
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {n.title}
                    </p>
                    {!n.is_read && (
                      <span
                        className="w-2 h-2 rounded-full shrink-0"
                        style={{ backgroundColor: 'var(--color-btn-primary-bg)' }}
                      />
                    )}
                  </div>
                  {n.body && (
                    <p
                      className="text-xs mt-0.5 line-clamp-2"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {n.body}
                    </p>
                  )}
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
                    {formatTimeAgo(n.created_at)}
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    dismiss.mutate(n.id)
                  }}
                  className="p-1 rounded hover:opacity-70 transition-opacity shrink-0"
                  style={{ color: 'var(--color-text-muted)' }}
                  title="Dismiss"
                >
                  <X size={14} />
                </button>
              </div>
            )
          })
        )}
      </div>

      {showPrefs && (
        <NotificationPreferencesPanel onClose={() => setShowPrefs(false)} />
      )}
    </div>
  )
}
