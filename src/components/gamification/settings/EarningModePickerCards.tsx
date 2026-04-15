/**
 * EarningModePickerCards — Build M Phase 4
 *
 * Reusable radio-style card picker for earning mode selection.
 * Used in 3 places: creature earning config, page earning config,
 * and per-coloring-reveal earning config.
 *
 * Zero hardcoded colors — all CSS custom properties.
 */

import type { LucideIcon } from 'lucide-react'
import { Layers, Hash, CalendarCheck, Sparkles, BookOpen, CheckSquare, Target, Calendar } from 'lucide-react'
import { Check } from 'lucide-react'
import type { CreatureEarningMode, PageEarningMode } from '@/types/play-dashboard'

// ── Mode definitions ────────────────────────────────────────────────

export interface EarningModeOption {
  key: string
  icon: LucideIcon
  title: string
  description: string
  goodFor: string
}

export const CREATURE_EARNING_MODES: EarningModeOption[] = [
  {
    key: 'segment_complete',
    icon: Layers,
    title: 'Segment Complete',
    description:
      'Your child earns a creature each time they finish all the tasks in a section of their day.',
    goodFor: 'Kids who think in chunks and love the satisfaction of completing a set.',
  },
  {
    key: 'every_n_completions',
    icon: Hash,
    title: 'Every N Tasks',
    description:
      'Your child earns a creature every time they check off a certain number of tasks.',
    goodFor: 'Kids who need frequent, predictable wins to stay motivated.',
  },
  {
    key: 'complete_the_day',
    icon: CalendarCheck,
    title: 'Complete the Day',
    description:
      'Your child earns one creature when they finish everything assigned for the day.',
    goodFor: 'Kids who can handle working toward a bigger goal.',
  },
  {
    key: 'random_per_task',
    icon: Sparkles,
    title: 'Random Surprise',
    description:
      "Any task might award a creature. Your child never knows which one!",
    goodFor: "Kids who love surprises and don't get frustrated by chance.",
  },
]

export const PAGE_EARNING_MODES: EarningModeOption[] = [
  {
    key: 'every_n_creatures',
    icon: BookOpen,
    title: 'Every N Creatures',
    description:
      "A new background unlocks as your child's collection grows.",
    goodFor: 'Steady progress — the more creatures they earn, the more pages they unlock.',
  },
  {
    key: 'every_n_completions',
    icon: CheckSquare,
    title: 'Every N Completions',
    description:
      'A new background after a certain number of tasks completed.',
    goodFor: 'Direct connection between effort and new pages — every task counts.',
  },
  {
    key: 'tracker_goal',
    icon: Target,
    title: 'Tracker Goal',
    description:
      'Tie a new background to a specific tracker goal.',
    goodFor: 'When you want backgrounds to celebrate a specific milestone.',
  },
  {
    key: 'every_n_days',
    icon: Calendar,
    title: 'Time-Based',
    description:
      'A new background unlocks automatically every N days.',
    goodFor: 'When you want steady progress on a schedule, regardless of task completion.',
  },
]

// ── Component ───────────────────────────────────────────────────────

interface EarningModePickerCardsProps {
  modes: EarningModeOption[]
  selected: string
  onChange: (key: string) => void
  size?: 'full' | 'compact'
}

export function EarningModePickerCards({
  modes,
  selected,
  onChange,
  size = 'full',
}: EarningModePickerCardsProps) {
  if (size === 'compact') {
    return (
      <div className="flex flex-wrap gap-2">
        {modes.map((mode) => {
          const isSelected = mode.key === selected
          const Icon = mode.icon
          return (
            <button
              key={mode.key}
              type="button"
              onClick={() => onChange(mode.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                backgroundColor: isSelected
                  ? 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, var(--color-bg-card))'
                  : 'var(--color-bg-secondary)',
                color: isSelected ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
                border: isSelected
                  ? '1.5px solid var(--color-btn-primary-bg)'
                  : '1.5px solid var(--color-border)',
              }}
            >
              <Icon size={14} />
              {mode.title}
              {isSelected && <Check size={12} />}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {modes.map((mode) => {
        const isSelected = mode.key === selected
        const Icon = mode.icon
        return (
          <button
            key={mode.key}
            type="button"
            onClick={() => onChange(mode.key)}
            className="relative text-left p-4 rounded-xl transition-all"
            style={{
              backgroundColor: isSelected
                ? 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, var(--color-bg-card))'
                : 'var(--color-bg-card)',
              border: isSelected
                ? '2px solid var(--color-btn-primary-bg)'
                : '2px solid var(--color-border)',
            }}
          >
            {isSelected && (
              <div
                className="absolute top-3 right-3 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ backgroundColor: 'var(--color-btn-primary-bg)' }}
              >
                <Check size={12} style={{ color: 'var(--color-text-on-primary)' }} />
              </div>
            )}
            <div className="flex items-center gap-2 mb-2">
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{
                  backgroundColor: isSelected
                    ? 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)'
                    : 'var(--color-bg-secondary)',
                }}
              >
                <Icon
                  size={18}
                  style={{
                    color: isSelected
                      ? 'var(--color-btn-primary-bg)'
                      : 'var(--color-text-secondary)',
                  }}
                />
              </div>
              <span
                className="font-medium text-sm"
                style={{
                  color: isSelected ? 'var(--color-text-heading)' : 'var(--color-text-primary)',
                }}
              >
                {mode.title}
              </span>
            </div>
            <p className="text-xs leading-relaxed mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              {mode.description}
            </p>
            <p className="text-xs italic" style={{ color: 'var(--color-text-secondary)', opacity: 0.8 }}>
              Good for: {mode.goodFor}
            </p>
          </button>
        )
      })}
    </div>
  )
}

// ── Helpers for type-safe usage ─────────────────────────────────────

export function isCreatureEarningMode(key: string): key is CreatureEarningMode {
  return ['segment_complete', 'every_n_completions', 'complete_the_day', 'random_per_task'].includes(key)
}

export function isPageEarningMode(key: string): key is PageEarningMode {
  return ['tracker_goal', 'every_n_creatures', 'every_n_completions', 'every_n_days'].includes(key)
}
