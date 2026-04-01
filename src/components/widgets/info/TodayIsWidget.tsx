// PRD-10 Enhancement: "Today Is..." fun holidays widget
// Shows today's fun/quirky holidays. Tap to see full list with filter tabs.

import { useState } from 'react'
import { PartyPopper, Sparkles, Eye, HelpCircle, Filter } from 'lucide-react'
import type { DashboardWidget, DailyHoliday } from '@/types/widgets'
import { useTodayHolidays } from '@/hooks/useTodayHolidays'
import { ModalV2 } from '@/components/shared'

interface TodayIsWidgetProps {
  widget: DashboardWidget
  isCompact?: boolean
}

type FilterTab = 'all' | 'kid_friendly' | 'silliest' | 'most_obscure' | 'curated'

const FILTER_TABS: { key: FilterTab; label: string; icon: typeof PartyPopper }[] = [
  { key: 'all', label: 'All', icon: Filter },
  { key: 'curated', label: 'Curated', icon: Sparkles },
  { key: 'kid_friendly', label: 'Kid Friendly', icon: PartyPopper },
  { key: 'silliest', label: 'Silliest', icon: PartyPopper },
  { key: 'most_obscure', label: 'Most Obscure', icon: HelpCircle },
]

export function TodayIsWidget({ widget, isCompact }: TodayIsWidgetProps) {
  const [showFullList, setShowFullList] = useState(false)
  const [activeFilter, setActiveFilter] = useState<FilterTab>('curated')
  const { data, isLoading } = useTodayHolidays()

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-2">
        <PartyPopper size={20} style={{ color: 'var(--color-text-tertiary)' }} className="animate-pulse" />
        <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Loading...</div>
      </div>
    )
  }

  const holidays = data?.holidays ?? []
  const topHoliday = data?.curated?.[0] ?? holidays[0]
  const extraCount = Math.max(0, holidays.length - 1)

  // Small (1x1): single holiday + count badge
  if (isCompact || widget.size === 'small') {
    return (
      <button
        onClick={() => setShowFullList(true)}
        className="flex flex-col h-full items-center justify-center gap-1.5 text-center p-2 w-full"
      >
        <PartyPopper size={18} style={{ color: 'var(--color-accent)' }} />
        {topHoliday ? (
          <>
            <div
              className="text-xs font-medium leading-tight line-clamp-2"
              style={{ color: 'var(--color-text-primary)' }}
            >
              {topHoliday.name}
            </div>
            {extraCount > 0 && (
              <div
                className="text-[10px] px-1.5 py-0.5 rounded-full"
                style={{
                  background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
                  color: 'var(--color-accent)',
                }}
              >
                +{extraCount} more
              </div>
            )}
          </>
        ) : (
          <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            No holidays today
          </div>
        )}
        {showFullList && (
          <TodayIsFullList
            data={data}
            activeFilter={activeFilter}
            onFilterChange={setActiveFilter}
            onClose={() => setShowFullList(false)}
          />
        )}
      </button>
    )
  }

  // Medium (2x1): top 2-3 holidays in compact list
  const displayHolidays = data?.curated ?? holidays.slice(0, 3)

  return (
    <>
      <button
        onClick={() => setShowFullList(true)}
        className="flex flex-col h-full w-full text-left p-1 gap-1.5"
      >
        <div className="flex items-center gap-1.5">
          <PartyPopper size={14} style={{ color: 'var(--color-accent)' }} />
          <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
            Today is...
          </span>
        </div>
        <div className="flex-1 space-y-1 min-h-0 overflow-hidden">
          {displayHolidays.length > 0 ? displayHolidays.map(h => (
            <div key={h.id} className="flex items-start gap-1.5">
              <div
                className="w-1 h-1 rounded-full mt-1.5 flex-shrink-0"
                style={{ background: 'var(--color-accent)' }}
              />
              <span
                className="text-xs leading-tight line-clamp-1"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {h.name}
              </span>
            </div>
          )) : (
            <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
              No holidays today
            </div>
          )}
        </div>
        {extraCount > 2 && (
          <div className="text-[10px] font-medium" style={{ color: 'var(--color-accent)' }}>
            +{holidays.length - displayHolidays.length} more
          </div>
        )}
      </button>

      {showFullList && (
        <TodayIsFullList
          data={data}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          onClose={() => setShowFullList(false)}
        />
      )}
    </>
  )
}

// ── Full list modal ────────────────────────────────────────

interface TodayIsFullListProps {
  data: ReturnType<typeof useTodayHolidays>['data']
  activeFilter: FilterTab
  onFilterChange: (tab: FilterTab) => void
  onClose: () => void
}

function TodayIsFullList({ data, activeFilter, onFilterChange, onClose }: TodayIsFullListProps) {
  const holidays = data?.holidays ?? []

  const filteredHolidays: DailyHoliday[] = (() => {
    switch (activeFilter) {
      case 'kid_friendly': return data?.kidFriendly ?? []
      case 'silliest': return data?.silliest ?? []
      case 'most_obscure': return data?.mostObscure ?? []
      case 'curated': return data?.curated ?? []
      case 'all':
      default: return holidays
    }
  })()

  const today = new Date()
  const dateStr = today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <ModalV2
      id="today-is-full-list"
      isOpen={true}
      onClose={onClose}
      type="transient"
      size="md"
      title={`Today Is... (${dateStr})`}
      icon={PartyPopper}
    >
      <div className="p-4 space-y-4">
        {/* Filter tabs */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {FILTER_TABS.map(tab => {
            const isActive = activeFilter === tab.key
            return (
              <button
                key={tab.key}
                onClick={(e) => { e.stopPropagation(); onFilterChange(tab.key) }}
                className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                style={{
                  background: isActive ? 'var(--surface-primary)' : 'var(--color-bg-secondary)',
                  color: isActive ? 'var(--color-text-on-primary)' : 'var(--color-text-secondary)',
                  border: isActive ? 'none' : '1px solid var(--color-border-default)',
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Holiday count */}
        <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          {filteredHolidays.length} {filteredHolidays.length === 1 ? 'holiday' : 'holidays'}
          {activeFilter !== 'all' && ` (${holidays.length} total)`}
        </div>

        {/* Holiday list */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {filteredHolidays.length > 0 ? filteredHolidays.map(h => (
            <HolidayCard key={h.id} holiday={h} />
          )) : (
            <div className="text-center py-8">
              <Eye size={24} style={{ color: 'var(--color-text-tertiary)' }} className="mx-auto mb-2" />
              <div className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                No holidays in this category today
              </div>
            </div>
          )}
        </div>
      </div>
    </ModalV2>
  )
}

// ── Holiday card ───────────────────────────────────────────

function HolidayCard({ holiday }: { holiday: DailyHoliday }) {
  return (
    <div
      className="p-3 rounded-lg"
      style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-default)' }}
    >
      <div className="flex items-start gap-2">
        <PartyPopper size={14} className="mt-0.5 flex-shrink-0" style={{ color: 'var(--color-accent)' }} />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {holiday.name}
          </div>
          {holiday.description && (
            <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              {holiday.description}
            </div>
          )}
          {/* Tags */}
          {holiday.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-1.5">
              {holiday.tags.map(tag => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 rounded text-[10px]"
                  style={{
                    background: 'var(--color-bg-tertiary)',
                    color: 'var(--color-text-tertiary)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
