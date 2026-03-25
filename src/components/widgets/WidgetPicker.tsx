// PRD-10 Screen 3: Widget Picker — Add Widget modal
// Sections: Your Widgets, Create New (by category), Info Widgets, Quick Actions
// Each template card shows thumbnail preview, name, description, [Customize] button

import type React from 'react'
import { useState, useMemo } from 'react'
import { X, Search, ChevronDown, ChevronRight } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import type { WidgetStarterConfig } from '@/types/widgets'
import { getTrackerMeta } from '@/types/widgets'

interface WidgetPickerProps {
  isOpen: boolean
  onClose: () => void
  starterConfigs: WidgetStarterConfig[]
  offDashboardWidgets?: { id: string; title: string; template_type: string }[]
  onSelectStarterConfig: (config: WidgetStarterConfig) => void
  onReAddWidget?: (widgetId: string) => void
}

// Category display config — Lucide icons, no emoji
const CATEGORY_DISPLAY: Record<string, { label: string; icon: string }> = {
  'Daily Life & Routines': { label: 'Daily Life & Routines', icon: 'CalendarDays' },
  'Learning & School': { label: 'Learning & School', icon: 'BookOpen' },
  'Chores & Responsibility': { label: 'Chores & Responsibility', icon: 'CheckCircle2' },
  'Special Needs & Therapy': { label: 'Special Needs & Therapy', icon: 'Heart' },
  'Family & Multiplayer': { label: 'Family & Multiplayer', icon: 'Users' },
  'Personal Wellbeing': { label: 'Personal Wellbeing', icon: 'Smile' },
  // PRD-10 template library categories
  'routine_trackers': { label: 'Routine Trackers', icon: 'CalendarDays' },
  'goal_pursuit': { label: 'Goal Pursuit', icon: 'Target' },
  'progress_visualizers': { label: 'Progress Visualizers', icon: 'TrendingUp' },
  'reward_allowance': { label: 'Reward & Allowance', icon: 'Coins' },
  'achievement_recognition': { label: 'Achievement & Recognition', icon: 'Trophy' },
  'reflection_insight': { label: 'Reflection & Insight', icon: 'Eye' },
  'family_social': { label: 'Family & Social', icon: 'Users' },
  'skill_tracking': { label: 'Skill Tracking', icon: 'BookOpen' },
}

export function WidgetPicker({
  isOpen,
  onClose,
  starterConfigs,
  offDashboardWidgets = [],
  onSelectStarterConfig,
  onReAddWidget,
}: WidgetPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // Group starter configs by category
  const configsByCategory = useMemo(() => {
    const groups: Record<string, WidgetStarterConfig[]> = {}
    for (const config of starterConfigs) {
      const cat = config.category ?? 'Other'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(config)
    }
    return groups
  }, [starterConfigs])

  // Also include Phase A tracker types not in starter configs
  // phaseATypes reserved for Phase B expansion
  // const phaseATypes = TRACKER_TYPE_REGISTRY.filter(t => t.phaseA)

  // Filter by search
  const filteredConfigs = useMemo(() => {
    if (!searchQuery.trim()) return configsByCategory
    const q = searchQuery.toLowerCase()
    const filtered: Record<string, WidgetStarterConfig[]> = {}
    for (const [cat, configs] of Object.entries(configsByCategory)) {
      const matching = configs.filter(
        c => c.config_name.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q)
      )
      if (matching.length > 0) filtered[cat] = matching
    }
    return filtered
  }, [configsByCategory, searchQuery])

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-stretch justify-end">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />

      {/* Panel */}
      <div
        className="relative w-full max-w-md h-full overflow-y-auto"
        style={{ background: 'var(--color-bg-primary)' }}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 px-4 py-3 border-b" style={{ background: 'var(--color-bg-primary)', borderColor: 'var(--color-border-default)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>
              Add Widget
            </h2>
            <button onClick={onClose} className="p-1 rounded-lg" style={{ color: 'var(--color-text-secondary)' }}>
              <X size={20} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-tertiary)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search trackers..."
              className="w-full pl-9 pr-3 py-2 rounded-lg text-sm"
              style={{
                background: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border-default)',
              }}
            />
          </div>
        </div>

        <div className="p-4 space-y-6">
          {/* Section 1: Your Widgets (off-dashboard, quick re-add) */}
          {offDashboardWidgets.length > 0 && (
            <section>
              <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
                Your Widgets
              </h3>
              <div className="space-y-1">
                {offDashboardWidgets.map(w => (
                  <button
                    key={w.id}
                    onClick={() => onReAddWidget?.(w.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors hover:opacity-80"
                    style={{ background: 'var(--color-bg-secondary)' }}
                  >
                    <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                      {w.title}
                    </span>
                    <span className="text-xs ml-auto" style={{ color: 'var(--color-text-tertiary)' }}>
                      Re-add
                    </span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {/* Section 2: Create New — starter configs by category */}
          <section>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              Create New
            </h3>

            {Object.entries(filteredConfigs).map(([category, configs]) => {
              const catDisplay = CATEGORY_DISPLAY[category] ?? { label: category, icon: 'Box' }
              const isExpanded = expandedCategories.has(category) || searchQuery.trim().length > 0
              const IconComponent = (LucideIcons as unknown as Record<string, React.FC<{ size?: number }>>)[catDisplay.icon]

              return (
                <div key={category} className="mb-2">
                  {/* Category header */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {IconComponent && <IconComponent size={16} />}
                    <span className="text-sm font-medium flex-1 text-left">{catDisplay.label}</span>
                    <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                      {configs.length}
                    </span>
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>

                  {/* Config cards */}
                  {isExpanded && (
                    <div className="space-y-2 pl-2 mt-1">
                      {configs.map(config => (
                        <StarterConfigCard
                          key={config.id}
                          config={config}
                          onSelect={() => onSelectStarterConfig(config)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}

            {Object.keys(filteredConfigs).length === 0 && searchQuery.trim() && (
              <div className="text-center py-4 text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
                No trackers match "{searchQuery}"
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  )
}

// ── Starter Config Card ─────────────────────────────────────

function StarterConfigCard({
  config,
  onSelect,
}: {
  config: WidgetStarterConfig
  onSelect: () => void
}) {
  const meta = getTrackerMeta(config.tracker_type)
  const IconComponent = meta?.icon
    ? (LucideIcons as unknown as Record<string, React.FC<{ size?: number }>>)[meta.icon]
    : null

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg"
      style={{
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border-default)',
      }}
    >
      {/* Icon */}
      <div
        className="flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-accent)' }}
      >
        {IconComponent ? <IconComponent size={16} /> : <LucideIcons.Box size={16} />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          {config.config_name}
        </div>
        {config.description && (
          <div className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>
            {config.description}
          </div>
        )}
      </div>

      {/* Customize button */}
      <button
        onClick={onSelect}
        className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        style={{ background: 'var(--surface-primary)', color: 'var(--color-text-on-primary)' }}
      >
        Customize
      </button>
    </div>
  )
}
