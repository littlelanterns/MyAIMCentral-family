/**
 * EarningProgressPill — Build M Phase 2
 *
 * Child-facing counter that shows progress toward the next creature
 * reward. Renders differently based on the creature earning mode:
 *
 *   - every_n_completions: "2/3 until next creature!"
 *   - complete_the_day:    "4/12 tasks done today — finish them all!"
 *   - segment_complete:    no global counter (per-segment bars serve this)
 *   - random_per_task:     no counter (surprise IS the feature)
 *
 * Uses Sparkles icon as header chrome (allowed per CLAUDE.md §16).
 */

import { Sparkles } from 'lucide-react'
import type { StickerBookState } from '@/types/play-dashboard'
import type { Task } from '@/types/tasks'

interface EarningProgressPillProps {
  stickerBookState: StickerBookState | null
  tasks: Task[]
}

export function EarningProgressPill({ stickerBookState, tasks }: EarningProgressPillProps) {
  if (!stickerBookState) return null

  const mode = stickerBookState.creature_earning_mode

  if (mode === 'segment_complete' || mode === 'random_per_task') {
    return null
  }

  if (mode === 'every_n_completions') {
    const counter = stickerBookState.creature_earning_counter
    const threshold = stickerBookState.creature_earning_threshold
    const displayCounter = stickerBookState.creature_earning_counter_resets
      ? counter
      : counter % threshold

    return (
      <PillShell>
        <Sparkles size={16} style={{ color: 'var(--color-btn-primary-bg)', flexShrink: 0 }} />
        <span>
          <strong>{displayCounter}/{threshold}</strong> until next creature!
        </span>
      </PillShell>
    )
  }

  if (mode === 'complete_the_day') {
    const total = tasks.length
    const completed = tasks.filter(
      t => t.status === 'completed' || t.status === 'pending_approval',
    ).length
    const allDone = total > 0 && completed >= total

    return (
      <PillShell>
        <Sparkles size={16} style={{ color: 'var(--color-btn-primary-bg)', flexShrink: 0 }} />
        {allDone ? (
          <span>
            <strong>All done!</strong> You earned a creature!
          </span>
        ) : (
          <span>
            <strong>{completed}/{total}</strong> tasks done today — finish them all for a creature!
          </span>
        )}
      </PillShell>
    )
  }

  return null
}

function PillShell({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 0.875rem',
        borderRadius: 'var(--vibe-radius-card, 0.75rem)',
        backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, var(--color-bg-card))',
        border: '1px solid color-mix(in srgb, var(--color-btn-primary-bg) 20%, var(--color-border))',
        fontSize: 'var(--font-size-sm)',
        color: 'var(--color-text-primary)',
      }}
    >
      {children}
    </div>
  )
}
