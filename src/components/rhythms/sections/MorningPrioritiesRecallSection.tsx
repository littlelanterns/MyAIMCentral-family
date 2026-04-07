/**
 * PRD-18 Section Type #31 (Enhancement 1): Morning Priorities Recall
 *
 * Reads the previous evening's rhythm_completions.metadata.priority_items
 * and shows the 3 focus items (or all if no overflow) reflected back.
 * Framing: "Here's what you wanted to focus on:" — their own words,
 * not a directive.
 *
 * Data source: rhythm_completions.metadata.priority_items. Reads the
 * most recent completed evening rhythm for this member, looks back up
 * to 2 days (handles "forgot to close out last night" edge cases).
 *
 * If the evening was > 2 days ago OR no priority items → warm empty
 * state. No data = no section noise.
 *
 * If overflow occurred (focus_selected=false items exist in addition
 * to the 3 picks), shows "and X more on your list →" link to /tasks.
 */

import { useQuery } from '@tanstack/react-query'
import { Sparkles, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import type { RhythmCompletion, RhythmPriorityItem } from '@/types/rhythms'

interface Props {
  familyId: string
  memberId: string
}

export function MorningPrioritiesRecallSection({ familyId, memberId }: Props) {
  const { data: lastEvening, isLoading } = useQuery({
    queryKey: ['rhythm-last-evening-completion', familyId, memberId],
    queryFn: async (): Promise<RhythmCompletion | null> => {
      const { data, error } = await supabase
        .from('rhythm_completions')
        .select('*')
        .eq('family_id', familyId)
        .eq('member_id', memberId)
        .eq('rhythm_key', 'evening')
        .eq('status', 'completed')
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as RhythmCompletion | null
    },
    enabled: !!familyId && !!memberId,
    // 5-minute stale time — this only updates after closing an evening rhythm
    staleTime: 5 * 60 * 1000,
  })

  if (isLoading) return null

  // Only surface recall if the evening was completed in the last 2 days.
  // Anything older feels stale and risks confusing the user.
  if (!lastEvening || !lastEvening.completed_at) return null
  const completedAt = new Date(lastEvening.completed_at)
  const ageMs = Date.now() - completedAt.getTime()
  const TWO_DAYS_MS = 48 * 60 * 60 * 1000
  if (ageMs > TWO_DAYS_MS) return null

  const priorityItems = (lastEvening.metadata?.priority_items ?? []) as RhythmPriorityItem[]
  if (priorityItems.length === 0) return null

  // Separate focus-selected items from overflow
  const focusItems = priorityItems.filter(item => item.focus_selected !== false)
  const overflowCount = priorityItems.length - focusItems.length
  const displayItems = focusItems.length > 0 ? focusItems : priorityItems.slice(0, 3)

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={18} style={{ color: 'var(--color-accent-deep)' }} />
        <h3
          className="text-sm font-semibold"
          style={{
            color: 'var(--color-text-heading)',
            fontFamily: 'var(--font-heading)',
          }}
        >
          Here's what you wanted to focus on:
        </h3>
      </div>

      <ul className="space-y-2">
        {displayItems.map((item, idx) => (
          <li
            key={`${item.created_task_id ?? item.matched_task_id ?? 'item'}-${idx}`}
            className="text-sm flex items-start gap-2"
            style={{ color: 'var(--color-text-primary)' }}
          >
            <span
              className="inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-semibold flex-shrink-0 mt-0.5"
              style={{
                background: 'color-mix(in srgb, var(--color-accent-deep) 14%, transparent)',
                color: 'var(--color-accent-deep)',
              }}
            >
              {idx + 1}
            </span>
            <span className="flex-1">
              {item.matched_task_title && item.matched_task_id
                ? item.matched_task_title
                : item.text}
            </span>
          </li>
        ))}
      </ul>

      {overflowCount > 0 && (
        <Link
          to="/tasks"
          className="mt-3 inline-flex items-center gap-1 text-xs hover:underline"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          and {overflowCount} more on your list
          <ArrowRight size={12} />
        </Link>
      )}
    </div>
  )
}
