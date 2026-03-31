// PRD-14C: Pending Items Bar
// Compact horizontal bar showing badge counts for Universal Queue tabs.
// "All clear" when all counts are zero — never hidden.

import React, { useState } from 'react'
import { Check, CalendarCheck, Layers, HandHelping } from 'lucide-react'
import { usePendingCounts } from '@/hooks/usePendingCounts'
import { UniversalQueueModal } from '@/components/queue/UniversalQueueModal'

interface PendingItemsBarProps {
  familyId: string | undefined
}

type QueueTab = 'calendar' | 'sort' | 'requests'

const badges: Array<{ key: QueueTab; label: string; icon: React.ReactNode; countKey: 'calendar' | 'sort' | 'requests' }> = [
  { key: 'calendar', label: 'Calendar', icon: <CalendarCheck size={14} />, countKey: 'calendar' },
  { key: 'sort', label: 'Tasks', icon: <Layers size={14} />, countKey: 'sort' },
  { key: 'requests', label: 'Requests', icon: <HandHelping size={14} />, countKey: 'requests' },
]

export default function PendingItemsBar({ familyId }: PendingItemsBarProps) {
  const counts = usePendingCounts(familyId)
  const [queueOpen, setQueueOpen] = useState(false)
  const [queueTab, setQueueTab] = useState<QueueTab>('sort')

  const openTab = (tab: QueueTab) => {
    setQueueTab(tab)
    setQueueOpen(true)
  }

  return (
    <>
      <div
        className="flex items-center gap-3 px-4 py-2 rounded-lg"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-bg-card) 80%, var(--color-bg-page))',
          border: '1px solid var(--color-border-default)',
        }}
      >
        {counts.total === 0 ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            <Check size={16} style={{ color: 'var(--color-success, var(--color-btn-primary-bg))' }} />
            <span>All clear</span>
          </div>
        ) : (
          <>
            <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
              Pending:
            </span>
            {badges.map(({ key, label, icon, countKey }) => {
              const count = counts[countKey]
              if (count === 0) return null
              return (
                <button
                  key={key}
                  onClick={() => openTab(key)}
                  className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, transparent)',
                    color: 'var(--color-btn-primary-bg)',
                  }}
                >
                  {icon}
                  <span>{label} ({count})</span>
                </button>
              )
            })}
          </>
        )}
      </div>

      <UniversalQueueModal
        isOpen={queueOpen}
        onClose={() => setQueueOpen(false)}
        defaultTab={queueTab}
      />
    </>
  )
}
