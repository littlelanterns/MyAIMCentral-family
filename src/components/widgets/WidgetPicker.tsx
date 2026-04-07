// PRD-10 Screen 3: Widget Picker — ModalV2 full-height
// 4 Sections: Your Widgets, Create New (by category), Info Widgets, Quick Actions
// Each template card shows icon, name, description, [Customize] button

import { useState, useMemo } from 'react'
import { Search, ChevronDown, ChevronRight, LayoutDashboard, Home } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { ModalV2 } from '@/components/shared'
import type { WidgetStarterConfig } from '@/types/widgets'
import {
  getTrackerMeta, TRACKER_TYPE_REGISTRY,
  INFO_WIDGET_REGISTRY, QUICK_ACTION_REGISTRY,
  HUB_WIDGET_RECOMMENDATIONS,
  type InfoDisplayType, type QuickActionType,
  type HubWidgetRecommendation,
} from '@/types/widgets'

interface WidgetPickerProps {
  isOpen: boolean
  onClose: () => void
  starterConfigs: WidgetStarterConfig[]
  offDashboardWidgets?: { id: string; title: string; template_type: string }[]
  onSelectStarterConfig: (config: WidgetStarterConfig) => void
  onReAddWidget?: (widgetId: string) => void
  onAddInfoWidget?: (type: InfoDisplayType, destination?: 'personal' | 'hub') => void
  onAddQuickAction?: (type: QuickActionType) => void
  onOpenTrackThis?: () => void
  context?: 'personal' | 'hub' // Which dashboard opened the picker
}

// Category display config — Lucide icons, no emoji
const PICKER_CATEGORIES: { key: string; label: string; icon: string; trackerTypes: string[] }[] = [
  { key: 'routine_trackers', label: 'Routine Trackers', icon: 'CalendarDays', trackerTypes: ['streak', 'checklist', 'multi_habit_grid', 'boolean_checkin', 'timer_duration'] },
  { key: 'goal_pursuit', label: 'Goal Pursuit', icon: 'Target', trackerTypes: ['sequential_path', 'countdown', 'snapshot_comparison', 'color_reveal', 'gameboard'] },
  { key: 'progress_visualizers', label: 'Progress Visualizers', icon: 'TrendingUp', trackerTypes: ['tally', 'percentage'] },
  { key: 'reward_allowance', label: 'Reward & Allowance', icon: 'Coins', trackerTypes: ['allowance_calculator'] },
  { key: 'achievement_recognition', label: 'Achievement & Recognition', icon: 'Trophy', trackerTypes: ['achievement_badge', 'xp_level'] },
  { key: 'reflection_insight', label: 'Reflection & Insight', icon: 'Brain', trackerTypes: ['mood_rating'] },
  { key: 'family_social', label: 'Family & Social', icon: 'Users', trackerTypes: ['leaderboard'] },
  { key: 'skill_tracking', label: 'Skill Tracking', icon: 'BookOpen', trackerTypes: ['sequential_path'] },
]

function getLucideIcon(name: string): React.FC<{ size?: number }> | null {
  return (LucideIcons as unknown as Record<string, React.FC<{ size?: number }>>)[name] ?? null
}

export function WidgetPicker({
  isOpen,
  onClose,
  starterConfigs,
  offDashboardWidgets = [],
  onSelectStarterConfig,
  onReAddWidget,
  onAddInfoWidget,
  onAddQuickAction,
  onOpenTrackThis,
  context: _context,
}: WidgetPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())

  // Group starter configs by category — fall back to tracker type registry categories
  const configsByCategory = useMemo(() => {
    const groups: Record<string, WidgetStarterConfig[]> = {}
    for (const config of starterConfigs) {
      const cat = config.category ?? 'Other'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(config)
    }
    return groups
  }, [starterConfigs])

  // Build category entries: merge starter configs with registry types
  const categoryEntries = useMemo(() => {
    const q = searchQuery.toLowerCase()
    return PICKER_CATEGORIES.map(cat => {
      // Get starter configs for this category
      const configs = configsByCategory[cat.key] ?? []
      // Get tracker types for this category that have NO starter config yet
      const coveredTypes = new Set(configs.map(c => c.tracker_type))
      const registryEntries = TRACKER_TYPE_REGISTRY
        .filter(t => cat.trackerTypes.includes(t.type) && !coveredTypes.has(t.type))
      // Apply search filter
      const filteredConfigs = q
        ? configs.filter(c => c.config_name.toLowerCase().includes(q) || c.description?.toLowerCase().includes(q))
        : configs
      const filteredRegistry = q
        ? registryEntries.filter(t => t.label.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))
        : registryEntries
      return { ...cat, configs: filteredConfigs, registryEntries: filteredRegistry }
    }).filter(c => c.configs.length > 0 || c.registryEntries.length > 0)
  }, [configsByCategory, searchQuery])

  // Filter info widgets by search
  const filteredInfoWidgets = useMemo(() => {
    if (!searchQuery.trim()) return INFO_WIDGET_REGISTRY
    const q = searchQuery.toLowerCase()
    return INFO_WIDGET_REGISTRY.filter(w => w.label.toLowerCase().includes(q) || w.description.toLowerCase().includes(q))
  }, [searchQuery])

  // Filter quick actions by search
  const filteredQuickActions = useMemo(() => {
    if (!searchQuery.trim()) return QUICK_ACTION_REGISTRY
    const q = searchQuery.toLowerCase()
    return QUICK_ACTION_REGISTRY.filter(a => a.label.toLowerCase().includes(q) || a.description.toLowerCase().includes(q))
  }, [searchQuery])

  const toggleCategory = (cat: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  return (
    <ModalV2
      id="widget-picker"
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="lg"
      title="Add Widget"
      icon={LayoutDashboard}
    >
      <div className="p-4 space-y-6">
        {/* Search */}
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-tertiary)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search widgets and trackers..."
            className="w-full pl-9 pr-3 py-2 rounded-lg text-sm"
            style={{
              background: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border-default)',
            }}
          />
        </div>

        {/* Section 1: Your Widgets (off-dashboard, quick re-add) */}
        {offDashboardWidgets.length > 0 && !searchQuery.trim() && (
          <section>
            <h3 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text-primary)' }}>
              Your Widgets
            </h3>
            <div className="space-y-1">
              {offDashboardWidgets.map(w => {
                const meta = getTrackerMeta(w.template_type)
                const Icon = meta?.icon ? getLucideIcon(meta.icon) : null
                return (
                  <button
                    key={w.id}
                    onClick={() => onReAddWidget?.(w.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left transition-colors hover:opacity-80"
                    style={{ background: 'var(--color-bg-secondary)' }}
                  >
                    {Icon && <Icon size={14} />}
                    <span className="text-sm flex-1" style={{ color: 'var(--color-text-primary)' }}>{w.title}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-accent)' }}>
                      Re-add
                    </span>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* Section: Great for Family Hub */}
        {!searchQuery.trim() && (
          <section>
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-1.5" style={{ color: 'var(--color-text-primary)' }}>
              <Home size={14} style={{ color: 'var(--color-accent)' }} />
              Great for Family Hub
            </h3>
            <div className="space-y-2">
              {HUB_WIDGET_RECOMMENDATIONS.map(rec => (
                <HubRecommendationCard
                  key={rec.templateType}
                  recommendation={rec}
                  onSelect={() => {
                    if (rec.kind === 'info_display') {
                      onAddInfoWidget?.(rec.templateType as InfoDisplayType, 'hub')
                    } else {
                      // For tracker types (countdown, tally), create synthetic starter config
                      const meta = getTrackerMeta(rec.templateType)
                      if (meta) {
                        const syntheticConfig: WidgetStarterConfig = {
                          id: `hub-${meta.type}`,
                          tracker_type: meta.type,
                          visual_variant: meta.defaultVariant,
                          config_name: rec.label,
                          description: rec.hubDescription,
                          category: meta.category,
                          default_config: {},
                          is_example: false,
                          sort_order: 0,
                          created_at: new Date().toISOString(),
                          updated_at: new Date().toISOString(),
                        }
                        onSelectStarterConfig(syntheticConfig)
                      }
                    }
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Section 2: Create New — starter configs + registry types by category */}
        {categoryEntries.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              Create New
            </h3>
            {categoryEntries.map(cat => {
              const isExpanded = expandedCategories.has(cat.key) || searchQuery.trim().length > 0
              const Icon = getLucideIcon(cat.icon)
              const totalCount = cat.configs.length + cat.registryEntries.length

              return (
                <div key={cat.key} className="mb-2">
                  <button
                    onClick={() => toggleCategory(cat.key)}
                    className="w-full flex items-center gap-2 px-2 py-2 rounded-lg transition-colors"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {Icon && <Icon size={16} />}
                    <span className="text-sm font-medium flex-1 text-left">{cat.label}</span>
                    <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>{totalCount}</span>
                    {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  </button>

                  {isExpanded && (
                    <div className="space-y-2 pl-2 mt-1">
                      {/* Starter configs */}
                      {cat.configs.map(config => (
                        <StarterConfigCard key={config.id} config={config} onSelect={() => onSelectStarterConfig(config)} />
                      ))}
                      {/* Registry types without starter configs */}
                      {cat.registryEntries.map(meta => (
                        <RegistryTypeCard
                          key={meta.type}
                          meta={meta}
                          onSelect={() => {
                            // Create a synthetic starter config from registry
                            const syntheticConfig: WidgetStarterConfig = {
                              id: `registry-${meta.type}`,
                              tracker_type: meta.type,
                              visual_variant: meta.defaultVariant,
                              config_name: meta.label,
                              description: meta.description,
                              category: meta.category,
                              default_config: {},
                              is_example: false,
                              sort_order: 0,
                              created_at: new Date().toISOString(),
                              updated_at: new Date().toISOString(),
                            }
                            onSelectStarterConfig(syntheticConfig)
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </section>
        )}

        {/* Section 3: Info Widgets */}
        {filteredInfoWidgets.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              Info Widgets
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {filteredInfoWidgets.map(iw => {
                const Icon = getLucideIcon(iw.icon)
                return (
                  <button
                    key={iw.type}
                    onClick={() => onAddInfoWidget?.(iw.type)}
                    className="flex flex-col items-center gap-2 p-3 rounded-lg text-center transition-colors hover:opacity-80"
                    style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-default)' }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-accent)' }}
                    >
                      {Icon ? <Icon size={16} /> : <LucideIcons.Box size={16} />}
                    </div>
                    <span className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>{iw.label}</span>
                    <span className="text-[10px] line-clamp-2" style={{ color: 'var(--color-text-tertiary)' }}>{iw.description}</span>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* Section 4: Quick Actions */}
        {filteredQuickActions.length > 0 && (
          <section>
            <h3 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-primary)' }}>
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {filteredQuickActions.map(qa => {
                const Icon = getLucideIcon(qa.icon)
                return (
                  <button
                    key={qa.type}
                    onClick={() => {
                      if (qa.type === 'action_track_this') {
                        onOpenTrackThis?.()
                      } else {
                        onAddQuickAction?.(qa.type)
                      }
                    }}
                    className="flex items-center gap-2 p-3 rounded-lg transition-colors hover:opacity-80"
                    style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-default)' }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: 'var(--surface-primary)', color: 'var(--color-text-on-primary)' }}
                    >
                      {Icon ? <Icon size={16} /> : <LucideIcons.Box size={16} />}
                    </div>
                    <div className="text-left min-w-0">
                      <span className="text-xs font-medium block" style={{ color: 'var(--color-text-primary)' }}>{qa.label}</span>
                      <span className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>{qa.description}</span>
                    </div>
                  </button>
                )
              })}
            </div>
          </section>
        )}

        {/* Not sure what to track? */}
        {!searchQuery.trim() && (
          <section className="text-center pb-4">
            <button
              onClick={() => onOpenTrackThis?.()}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
              style={{ background: 'var(--surface-primary)', color: 'var(--color-text-on-primary)' }}
            >
              <LucideIcons.Sparkles size={16} />
              Not sure? Try "Track This"
            </button>
            <p className="text-xs mt-2" style={{ color: 'var(--color-text-tertiary)' }}>
              Tell us what you want to track and we'll suggest the best widget
            </p>
          </section>
        )}

        {/* No results */}
        {searchQuery.trim() && categoryEntries.length === 0 && filteredInfoWidgets.length === 0 && filteredQuickActions.length === 0 && (
          <div className="text-center py-8">
            <LucideIcons.SearchX size={32} style={{ color: 'var(--color-text-tertiary)' }} className="mx-auto mb-2" />
            <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
              No widgets match "{searchQuery}"
            </p>
          </div>
        )}
      </div>
    </ModalV2>
  )
}

// ── Starter Config Card ─────────────────────────────────────

function StarterConfigCard({ config, onSelect }: { config: WidgetStarterConfig; onSelect: () => void }) {
  const meta = getTrackerMeta(config.tracker_type)
  const Icon = meta?.icon ? getLucideIcon(meta.icon) : null

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg"
      style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-default)' }}
    >
      <div
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-accent)' }}
      >
        {Icon ? <Icon size={16} /> : <LucideIcons.Box size={16} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{config.config_name}</div>
        {config.description && (
          <div className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>{config.description}</div>
        )}
      </div>
      <button
        onClick={onSelect}
        className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        style={{ background: 'var(--surface-primary)', color: 'var(--color-text-on-primary)' }}
      >
        Customize
      </button>
    </div>
  )
}

// ── Hub Recommendation Card ────────────────────────────────

function HubRecommendationCard({ recommendation, onSelect }: { recommendation: HubWidgetRecommendation; onSelect: () => void }) {
  const Icon = getLucideIcon(recommendation.icon)

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg"
      style={{
        background: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border-default)',
      }}
    >
      <div
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)', color: 'var(--color-accent)' }}
      >
        {Icon ? <Icon size={16} /> : <LucideIcons.Box size={16} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{recommendation.label}</div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{recommendation.hubDescription}</div>
      </div>
      <button
        onClick={onSelect}
        className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        style={{ background: 'var(--surface-primary)', color: 'var(--color-text-on-primary)' }}
      >
        Add
      </button>
    </div>
  )
}

// ── Registry Type Card (for tracker types without starter configs) ──

function RegistryTypeCard({ meta, onSelect }: { meta: { type: string; label: string; description: string; icon: string }; onSelect: () => void }) {
  const Icon = getLucideIcon(meta.icon)

  return (
    <div
      className="flex items-start gap-3 p-3 rounded-lg"
      style={{ background: 'var(--color-bg-secondary)', border: '1px solid var(--color-border-default)' }}
    >
      <div
        className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center"
        style={{ background: 'var(--color-bg-tertiary)', color: 'var(--color-accent)' }}
      >
        {Icon ? <Icon size={16} /> : <LucideIcons.Box size={16} />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{meta.label}</div>
        <div className="text-xs mt-0.5 line-clamp-2" style={{ color: 'var(--color-text-secondary)' }}>{meta.description}</div>
      </div>
      <button
        onClick={onSelect}
        className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
        style={{ background: 'var(--surface-primary)', color: 'var(--color-text-on-primary)' }}
      >
        Customize
      </button>
    </div>
  )
}
