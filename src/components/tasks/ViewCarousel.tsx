/**
 * ViewCarousel — PRD-09A Screen 7
 *
 * Horizontally scrollable row of view pills.
 * Auto-sorts by usage frequency (stored in localStorage).
 * Available views filter by shell type.
 */

import { useState, useEffect, useCallback } from 'react'
import { HScrollArrows } from '@/components/shared/HScrollArrows'
import type { ShellType } from '@/lib/theme'

export type TaskViewKey =
  | 'simple_list'
  | 'eisenhower'
  | 'eat_the_frog'
  | 'one_three_five'
  | 'big_rocks'
  | 'ivy_lee'
  | 'by_category'
  | 'abcde'
  | 'kanban'
  | 'moscow'
  | 'impact_effort'
  | 'now_next_optional'
  | 'by_member'

export interface ViewDefinition {
  key: TaskViewKey
  label: string
  tier: 'essential' | 'enhanced'
  description: string
  availableTo: ShellType[]
  isPlanned?: boolean
}

export const VIEW_DEFINITIONS: ViewDefinition[] = [
  {
    key: 'simple_list',
    label: 'Simple List',
    tier: 'essential',
    description: 'Plain checkboxes, drag to reorder.',
    availableTo: ['mom', 'adult', 'independent', 'guided', 'play'],
  },
  {
    key: 'now_next_optional',
    label: 'Now / Next / Optional',
    tier: 'essential',
    description: 'Today, this week, and bonus opportunities.',
    availableTo: ['mom', 'adult', 'independent', 'guided'],
  },
  {
    key: 'by_category',
    label: 'By Category',
    tier: 'essential',
    description: 'Grouped by life area tags.',
    availableTo: ['mom', 'adult', 'independent'],
  },
  {
    key: 'eisenhower',
    label: 'Eisenhower',
    tier: 'enhanced',
    description: 'Urgent × Important 2×2 matrix.',
    availableTo: ['mom', 'adult', 'independent'],
  },
  {
    key: 'eat_the_frog',
    label: 'Eat the Frog',
    tier: 'enhanced',
    description: 'Do the hardest thing first.',
    availableTo: ['mom', 'adult', 'independent'],
  },
  {
    key: 'one_three_five',
    label: '1-3-5 Rule',
    tier: 'enhanced',
    description: '1 big, 3 medium, 5 small tasks.',
    availableTo: ['mom', 'adult', 'independent'],
  },
  {
    key: 'kanban',
    label: 'Kanban',
    tier: 'enhanced',
    description: 'To Do, In Progress, Done columns.',
    availableTo: ['mom', 'adult', 'independent'],
  },
  // Planned views
  {
    key: 'big_rocks',
    label: 'Big Rocks',
    tier: 'enhanced',
    description: 'Major priorities vs. gravel.',
    availableTo: ['mom', 'adult', 'independent'],
    isPlanned: true,
  },
  {
    key: 'ivy_lee',
    label: 'Ivy Lee',
    tier: 'enhanced',
    description: 'Top 6 ranked tasks, one at a time.',
    availableTo: ['mom', 'adult', 'independent'],
    isPlanned: true,
  },
  {
    key: 'abcde',
    label: 'ABCDE Method',
    tier: 'enhanced',
    description: 'Five priority categories A through E.',
    availableTo: ['mom', 'adult', 'independent'],
    isPlanned: true,
  },
  {
    key: 'moscow',
    label: 'MoSCoW',
    tier: 'enhanced',
    description: 'Must, Should, Could, Won\'t.',
    availableTo: ['mom', 'adult', 'independent'],
    isPlanned: true,
  },
  {
    key: 'impact_effort',
    label: 'Impact/Effort',
    tier: 'enhanced',
    description: 'Quick wins vs. major projects.',
    availableTo: ['mom', 'adult', 'independent'],
    isPlanned: true,
  },
  {
    key: 'by_member',
    label: 'By Member',
    tier: 'enhanced',
    description: 'Tasks grouped by family member.',
    availableTo: ['mom'],
    isPlanned: true,
  },
]

const USAGE_STORAGE_KEY = 'task_view_usage'

function getUsageMap(): Record<string, number> {
  try {
    const raw = localStorage.getItem(USAGE_STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function recordUsage(viewKey: string) {
  try {
    const map = getUsageMap()
    map[viewKey] = (map[viewKey] ?? 0) + 1
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(map))
  } catch {
    // ignore
  }
}

interface ViewCarouselProps {
  shell: ShellType
  activeView: TaskViewKey
  onViewChange: (view: TaskViewKey) => void
}

export function ViewCarousel({ shell, activeView, onViewChange }: ViewCarouselProps) {
  const [usageMap, setUsageMap] = useState<Record<string, number>>(getUsageMap)

  // Refresh from storage when component mounts
  useEffect(() => {
    setUsageMap(getUsageMap())
  }, [])

  const handleSelect = useCallback(
    (viewKey: TaskViewKey) => {
      onViewChange(viewKey)
      recordUsage(viewKey)
      setUsageMap(getUsageMap())
    },
    [onViewChange]
  )

  // Filter views for this shell
  const availableViews = VIEW_DEFINITIONS.filter((v) => v.availableTo.includes(shell))

  // Sort by usage frequency (desc), keeping default order as tiebreaker
  const sorted = [...availableViews].sort((a, b) => {
    const ua = usageMap[a.key] ?? 0
    const ub = usageMap[b.key] ?? 0
    return ub - ua
  })

  if (sorted.length === 0) return null

  return (
    <HScrollArrows>
      <div
        className="flex gap-2 overflow-x-auto pb-1"
        data-hscroll
        style={{ scrollbarWidth: 'none' }}
        role="tablist"
        aria-label="Task view options"
      >
        {sorted.map((view) => {
          const isActive = view.key === activeView
          return (
            <button
              key={view.key}
              role="tab"
              aria-selected={isActive}
              onClick={() => handleSelect(view.key)}
              className="shrink-0 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-all"
              style={{
                backgroundColor: isActive
                  ? 'var(--color-btn-primary-bg)'
                  : 'var(--color-bg-card)',
                color: isActive
                  ? 'var(--color-btn-primary-text)'
                  : view.isPlanned
                  ? 'var(--color-text-secondary)'
                  : 'var(--color-text-primary)',
                border: isActive
                  ? '1px solid var(--color-btn-primary-bg)'
                  : '1px solid var(--color-border)',
                fontWeight: isActive ? 600 : 400,
                opacity: view.isPlanned && !isActive ? 0.7 : 1,
              }}
              title={view.description}
            >
              {view.label}
              {view.isPlanned && !isActive && (
                <span className="ml-1 text-xs opacity-60">Soon</span>
              )}
            </button>
          )
        })}
      </div>
    </HScrollArrows>
  )
}
