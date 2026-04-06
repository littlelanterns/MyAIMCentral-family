import {
  MessageSquare,
  Send,
  Calendar,
  CheckSquare,
  ShieldAlert,
  Sparkles,
  X,
  Lock,
} from 'lucide-react'
import { useNotificationPreferences, useToggleNotificationPref } from '@/hooks/useNotificationPreferences'
import type { NotificationCategory } from '@/types/messaging'

const CATEGORIES: {
  key: NotificationCategory
  label: string
  description: string
  icon: typeof MessageSquare
  locked?: boolean
}[] = [
  { key: 'messages', label: 'Messages', description: 'New messages and replies', icon: MessageSquare },
  { key: 'requests', label: 'Requests', description: 'Incoming requests from family', icon: Send },
  { key: 'calendar', label: 'Calendar', description: 'Event approvals and reminders', icon: Calendar },
  { key: 'tasks', label: 'Tasks', description: 'Task approvals and completions', icon: CheckSquare },
  { key: 'safety', label: 'Safety Alerts', description: 'Always enabled for your family\'s safety', icon: ShieldAlert, locked: true },
  { key: 'lila', label: 'LiLa', description: 'AI assistant suggestions', icon: Sparkles },
]

interface NotificationPreferencesPanelProps {
  onClose: () => void
}

export function NotificationPreferencesPanel({ onClose }: NotificationPreferencesPanelProps) {
  const { data: prefs = [], isLoading } = useNotificationPreferences()
  const togglePref = useToggleNotificationPref()

  const getPref = (category: NotificationCategory) =>
    prefs.find((p) => p.category === category)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onClick={onClose}
    >
      <div
        className="rounded-lg overflow-hidden w-full max-w-sm mx-4"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-default)',
          boxShadow: 'var(--shadow-lg)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ borderBottom: '1px solid var(--color-border-default)' }}
        >
          <h3 className="font-semibold text-sm" style={{ color: 'var(--color-text-primary)' }}>
            Notification Preferences
          </h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Category rows */}
        <div className="px-4 py-2 max-h-96 overflow-y-auto">
          {isLoading ? (
            <p className="py-4 text-center text-sm" style={{ color: 'var(--color-text-muted)' }}>
              Loading...
            </p>
          ) : (
            CATEGORIES.map(({ key, label, description, icon: Icon, locked }) => {
              const pref = getPref(key)
              const inAppEnabled = pref?.in_app_enabled ?? true

              return (
                <div
                  key={key}
                  className="flex items-center gap-3 py-3"
                  style={{ borderBottom: '1px solid var(--color-border-default)' }}
                >
                  <div
                    className="p-1.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: locked
                        ? 'color-mix(in srgb, var(--color-status-error, #ef4444) 10%, transparent)'
                        : 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, transparent)',
                      color: locked
                        ? 'var(--color-status-error, #ef4444)'
                        : 'var(--color-btn-primary-bg)',
                    }}
                  >
                    <Icon size={16} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                        {label}
                      </p>
                      {locked && <Lock size={12} style={{ color: 'var(--color-text-muted)' }} />}
                    </div>
                    <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                      {description}
                    </p>
                  </div>

                  {/* In-app toggle */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                      In-App
                    </span>
                    <button
                      onClick={() => {
                        if (locked || !pref) return
                        togglePref.mutate({
                          prefId: pref.id,
                          category: key,
                          field: 'in_app_enabled',
                          value: !inAppEnabled,
                        })
                      }}
                      disabled={locked}
                      className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${locked ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                      style={{
                        backgroundColor: inAppEnabled
                          ? 'var(--color-btn-primary-bg)'
                          : 'var(--color-bg-tertiary, #d1d5db)',
                      }}
                    >
                      <span
                        className="absolute top-0.5 w-4 h-4 rounded-full transition-transform duration-200"
                        style={{
                          backgroundColor: 'var(--color-bg-card)',
                          transform: inAppEnabled ? 'translateX(22px)' : 'translateX(2px)',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                        }}
                      />
                    </button>
                  </div>

                  {/* Push column — visible but disabled */}
                  <div className="flex flex-col items-center gap-1 shrink-0 opacity-40">
                    <span className="text-[10px]" style={{ color: 'var(--color-text-muted)' }}>
                      Push
                    </span>
                    <div
                      className="w-10 h-5 rounded-full relative cursor-not-allowed"
                      style={{ backgroundColor: 'var(--color-bg-tertiary, #d1d5db)' }}
                      title="Push notifications coming soon"
                    >
                      <span
                        className="absolute top-0.5 w-4 h-4 rounded-full"
                        style={{
                          backgroundColor: 'var(--color-bg-card)',
                          transform: 'translateX(2px)',
                          boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            })
          )}

          {/* DND toggle */}
          {!isLoading && prefs.length > 0 && (
            <div className="py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                    Do Not Disturb
                  </p>
                  <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
                    Mute all except safety alerts
                  </p>
                </div>
                <button
                  onClick={() => {
                    const currentDnd = prefs[0]?.do_not_disturb ?? false
                    // Toggle DND on all non-safety categories
                    for (const pref of prefs) {
                      if (pref.category !== 'safety') {
                        togglePref.mutate({
                          prefId: pref.id,
                          category: pref.category as NotificationCategory,
                          field: 'do_not_disturb',
                          value: !currentDnd,
                        })
                      }
                    }
                  }}
                  className="w-10 h-5 rounded-full relative cursor-pointer transition-colors duration-200"
                  style={{
                    backgroundColor: (prefs[0]?.do_not_disturb ?? false)
                      ? 'var(--color-btn-primary-bg)'
                      : 'var(--color-bg-tertiary, #d1d5db)',
                  }}
                >
                  <span
                    className="absolute top-0.5 w-4 h-4 rounded-full transition-transform duration-200"
                    style={{
                      backgroundColor: 'var(--color-bg-card)',
                      transform: (prefs[0]?.do_not_disturb ?? false) ? 'translateX(22px)' : 'translateX(2px)',
                      boxShadow: '0 1px 2px rgba(0,0,0,0.15)',
                    }}
                  />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
