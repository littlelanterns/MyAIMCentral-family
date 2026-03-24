/**
 * UniversalQueueModal (PRD-17 Screen 1)
 *
 * Tabbed modal container for the Review Queue system.
 * Three tabs: Calendar (pending approvals), Sort (studio_queue items), Requests (family requests).
 * Tab badge counts are queried independently.
 * "All caught up!" global empty state when all tabs have zero items.
 * Default tab: Sort if non-empty, else Calendar, else Requests.
 * Footer: Open messages link + total item count.
 *
 * Zero hardcoded hex colors — all CSS custom properties.
 */

import { useState, useEffect, useMemo } from 'react'
import { createPortal } from 'react-dom'
import {
  X,
  CalendarCheck,
  Layers,
  HandHelping,
  MessageCircle,
  Sparkles,
} from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { CalendarTab } from './CalendarTab'
import { SortTab } from './SortTab'
import { RequestsTab } from './RequestsTab'

// ─── Tab Registry ─────────────────────────────────────────────

type TabKey = 'calendar' | 'sort' | 'requests'

interface TabConfig {
  key: TabKey
  label: string
  icon: React.ReactNode
  component: React.ReactNode
  /** Badge count (0 means no badge) */
  count: number
  /** Lower order = rendered first */
  order: number
}

// ─── Helpers ──────────────────────────────────────────────────

function TabBadge({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 18,
        height: 18,
        padding: '0 5px',
        borderRadius: '9999px',
        backgroundColor: 'var(--color-btn-primary-bg)',
        color: 'var(--color-text-on-primary, #fff)',
        fontSize: 'var(--font-size-xs, 0.75rem)',
        fontWeight: 700,
        lineHeight: 1,
        marginLeft: '0.3rem',
      }}
    >
      {count > 99 ? '99+' : count}
    </span>
  )
}

// ─── AllCaughtUp ──────────────────────────────────────────────

function AllCaughtUp() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '3rem 1.5rem',
        gap: '0.75rem',
        textAlign: 'center',
        flex: 1,
      }}
    >
      <div
        style={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, var(--color-bg-card))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Sparkles size={24} style={{ color: 'var(--color-btn-primary-bg)' }} />
      </div>
      <h3
        style={{
          fontSize: 'var(--font-size-lg, 1.125rem)',
          fontWeight: 700,
          color: 'var(--color-text-heading)',
          margin: 0,
        }}
      >
        All caught up!
      </h3>
      <p
        style={{
          fontSize: 'var(--font-size-sm, 0.875rem)',
          color: 'var(--color-text-secondary)',
          margin: 0,
          maxWidth: 280,
        }}
      >
        Nothing needs your attention right now. Go enjoy your people.
      </p>
    </div>
  )
}

// ─── UniversalQueueModal ──────────────────────────────────────

interface UniversalQueueModalProps {
  isOpen: boolean
  onClose: () => void
  /** Pre-select a specific tab on open */
  defaultTab?: TabKey
  /** Called when user clicks "Open messages" footer link */
  onOpenMessages?: () => void
}

export function UniversalQueueModal({
  isOpen,
  onClose,
  defaultTab,
  onOpenMessages,
}: UniversalQueueModalProps) {
  const { data: currentMember } = useFamilyMember()

  // ── Badge counts ───────────────────────────────────────────

  // Sort tab: studio_queue items unprocessed + undismissed
  const { data: sortCount = 0 } = useQuery({
    queryKey: ['queue-badge-sort', currentMember?.family_id],
    queryFn: async () => {
      if (!currentMember?.family_id) return 0
      const { count, error } = await supabase
        .from('studio_queue')
        .select('id', { count: 'exact', head: true })
        .eq('family_id', currentMember.family_id)
        .is('processed_at', null)
        .is('dismissed_at', null)
      if (error) return 0
      return count ?? 0
    },
    enabled: !!currentMember?.family_id && isOpen,
    refetchInterval: 30_000,
  })

  // Calendar tab: pending calendar events (stub: returns 0 until PRD-14B wires it)
  const { data: calendarCount = 0 } = useQuery({
    queryKey: ['queue-badge-calendar', currentMember?.family_id],
    queryFn: async () => {
      if (!currentMember?.family_id) return 0
      const { count, error } = await supabase
        .from('calendar_events')
        .select('id', { count: 'exact', head: true })
        .eq('family_id', currentMember.family_id)
        .eq('status', 'pending')
      if (error) return 0
      return count ?? 0
    },
    enabled: !!currentMember?.family_id && isOpen,
    refetchInterval: 30_000,
  })

  // Requests tab: pending family_requests (stub: returns 0 until PRD-15 wires it)
  const { data: requestsCount = 0 } = useQuery({
    queryKey: ['queue-badge-requests', currentMember?.family_id],
    queryFn: async () => {
      if (!currentMember?.family_id) return 0
      const { count, error } = await supabase
        .from('family_requests')
        .select('id', { count: 'exact', head: true })
        .eq('family_id', currentMember.family_id)
        .eq('status', 'pending')
      if (error) return 0
      return count ?? 0
    },
    enabled: !!currentMember?.family_id && isOpen,
    refetchInterval: 30_000,
  })

  const totalCount = sortCount + calendarCount + requestsCount
  const allEmpty = totalCount === 0

  // ── Default tab logic ──────────────────────────────────────
  // Sort first (if non-empty), else Calendar, else Requests; all empty → "All caught up!"

  const computedDefault = useMemo<TabKey>(() => {
    if (defaultTab) return defaultTab
    if (sortCount > 0) return 'sort'
    if (calendarCount > 0) return 'calendar'
    if (requestsCount > 0) return 'requests'
    return 'sort'
  }, [defaultTab, sortCount, calendarCount, requestsCount])

  const [activeTab, setActiveTab] = useState<TabKey>(computedDefault)

  // Re-evaluate default when modal opens or counts change
  useEffect(() => {
    if (isOpen) {
      setActiveTab(computedDefault)
    }
  }, [isOpen, computedDefault])

  // ── Tab configs ────────────────────────────────────────────

  const tabs: TabConfig[] = [
    {
      key: 'sort',
      label: 'Sort',
      icon: <Layers size={15} />,
      component: <SortTab />,
      count: sortCount,
      order: 1,
    },
    {
      key: 'calendar',
      label: 'Calendar',
      icon: <CalendarCheck size={15} />,
      component: <CalendarTab />,
      count: calendarCount,
      order: 2,
    },
    {
      key: 'requests',
      label: 'Requests',
      icon: <HandHelping size={15} />,
      component: <RequestsTab />,
      count: requestsCount,
      order: 3,
    },
  ].sort((a, b) => a.order - b.order)

  // ── Escape key ─────────────────────────────────────────────

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  // ── Body scroll lock ───────────────────────────────────────

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  const activeTabConfig = tabs.find((t) => t.key === activeTab)

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Review queue"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '0',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.45)',
        }}
        aria-hidden="true"
      />

      {/* Modal panel */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          maxWidth: 560,
          height: '100dvh',
          maxHeight: '100dvh',
          backgroundColor: 'var(--color-bg-primary)',
          overflow: 'hidden',
          // Desktop: centered with margin and max-height
        }}
        className="md:my-8 md:rounded-xl md:max-h-[88vh] md:h-auto md:min-h-[500px]"
      >
        {/* ── Gradient Header ──────────────────────────────── */}
        <div
          style={{
            background:
              'linear-gradient(135deg, var(--color-btn-primary-bg) 0%, color-mix(in srgb, var(--color-btn-primary-bg) 70%, var(--color-accent, var(--color-btn-primary-hover, var(--color-btn-primary-bg)))) 100%)',
            padding: '1rem 1rem 0',
            flexShrink: 0,
          }}
        >
          {/* Title row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '0.75rem',
            }}
          >
            <h2
              style={{
                fontSize: 'var(--font-size-lg, 1.125rem)',
                fontWeight: 700,
                color: 'var(--color-text-on-primary, #fff)',
                margin: 0,
              }}
            >
              Review queue
            </h2>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: 'none',
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'var(--color-text-on-primary, #fff)',
                cursor: 'pointer',
                transition: 'background-color 0.15s',
                flexShrink: 0,
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Tab bar */}
          <div
            role="tablist"
            aria-label="Queue sections"
            style={{
              display: 'flex',
              gap: '0.25rem',
            }}
          >
            {tabs.map((tab) => {
              const isActive = activeTab === tab.key
              return (
                <button
                  key={tab.key}
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`queue-tab-panel-${tab.key}`}
                  id={`queue-tab-${tab.key}`}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    padding: '0.5rem 0.75rem',
                    border: 'none',
                    borderRadius: 'var(--vibe-radius-input, 8px) var(--vibe-radius-input, 8px) 0 0',
                    cursor: 'pointer',
                    fontSize: 'var(--font-size-sm, 0.875rem)',
                    fontWeight: isActive ? 600 : 400,
                    transition: 'background-color 0.15s, color 0.15s',
                    backgroundColor: isActive
                      ? 'var(--color-bg-primary)'
                      : 'rgba(255,255,255,0.12)',
                    color: isActive
                      ? 'var(--color-btn-primary-bg)'
                      : 'var(--color-text-on-primary, #fff)',
                    position: 'relative',
                    // Active underline indicator
                    boxShadow: isActive
                      ? 'inset 0 -2px 0 var(--color-btn-primary-bg)'
                      : 'none',
                  }}
                >
                  {tab.icon}
                  {tab.label}
                  <TabBadge count={tab.count} />
                </button>
              )
            })}
          </div>
        </div>

        {/* ── Tab Content ──────────────────────────────────── */}
        <div
          id={`queue-tab-panel-${activeTab}`}
          role="tabpanel"
          aria-labelledby={`queue-tab-${activeTab}`}
          style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {allEmpty ? (
            <AllCaughtUp />
          ) : (
            activeTabConfig?.component ?? null
          )}
        </div>

        {/* ── Footer ───────────────────────────────────────── */}
        <div
          style={{
            flexShrink: 0,
            borderTop: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-primary)',
            padding: '0.625rem 1rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {/* Left: Open messages link */}
          <button
            type="button"
            onClick={() => {
              onClose()
              onOpenMessages?.()
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.375rem',
              background: 'none',
              border: 'none',
              padding: '0.25rem 0',
              cursor: 'pointer',
              color: 'var(--color-btn-primary-bg)',
              fontSize: 'var(--font-size-sm, 0.875rem)',
              fontWeight: 500,
            }}
          >
            <MessageCircle size={15} />
            Open messages
          </button>

          {/* Right: total count */}
          {totalCount > 0 && (
            <span
              style={{
                fontSize: 'var(--font-size-xs, 0.75rem)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {totalCount} item{totalCount !== 1 ? 's' : ''} waiting
            </span>
          )}
        </div>
      </div>
    </div>,
    document.body
  )
}
