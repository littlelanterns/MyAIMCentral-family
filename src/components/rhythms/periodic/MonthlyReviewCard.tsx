/**
 * PRD-18 Screen 5: Monthly Review Card
 *
 * Renders inline inside the Morning Rhythm modal on day 1 of the
 * month when the monthly rhythm is enabled (default: OFF — user opts in).
 *
 * Sections:
 *   1. Month at a Glance — task completions, victories, intention
 *      iterations, streaks for the full calendar month
 *   2. Highlight Reel — top 5 victories from the month
 *   3. Reports Link — stub until Reports page ships
 *   4. Monthly Review Deep Dive — stub until PRD-16 ships
 *
 * Completion: writes rhythm_completions for rhythm_key='monthly_review',
 * period=this_month_iso. Hides from PeriodicCardsSlot for the rest of
 * the month after completion.
 */

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { CalendarDays, Trophy, Sparkles, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useVictories } from '@/hooks/useVictories'
import { useCompleteRhythm } from '@/hooks/useRhythms'
import { localMonthIso } from '@/utils/dates'

interface Props {
  familyId: string
  memberId: string
  onComplete?: () => void
}

export function MonthlyReviewCard({ familyId, memberId, onComplete }: Props) {
  const completeRhythm = useCompleteRhythm()

  const monthStart = useMemo(() => {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0)
  }, [])
  const monthLabel = useMemo(
    () => monthStart.toLocaleString(undefined, { month: 'long', year: 'numeric' }),
    [monthStart]
  )

  // Month stats
  const { data: stats } = useQuery({
    queryKey: ['monthly-stats', familyId, memberId, localMonthIso(monthStart)],
    queryFn: async () => {
      const monthStartTs = monthStart.toISOString()

      const { count: tasksCompleted } = await supabase
        .from('tasks')
        .select('id', { count: 'exact', head: true })
        .eq('family_id', familyId)
        .eq('assignee_id', memberId)
        .eq('status', 'completed')
        .gte('completed_at', monthStartTs)

      const { count: victoryCount } = await supabase
        .from('victories')
        .select('id', { count: 'exact', head: true })
        .eq('family_id', familyId)
        .eq('family_member_id', memberId)
        .gte('created_at', monthStartTs)
        .is('archived_at', null)

      const { count: intentionIterations } = await supabase
        .from('intention_iterations')
        .select('id', { count: 'exact', head: true })
        .eq('family_id', familyId)
        .eq('member_id', memberId)
        .gte('created_at', monthStartTs)

      return {
        tasksCompleted: tasksCompleted ?? 0,
        victoryCount: victoryCount ?? 0,
        intentionIterations: intentionIterations ?? 0,
      }
    },
    enabled: !!familyId && !!memberId,
    staleTime: 5 * 60 * 1000,
  })

  // Highlight reel — reuse useVictories with this_month
  const { data: monthVictories = [] } = useVictories(memberId, {
    period: 'this_month',
  })

  const highlightReel = useMemo(() => {
    const importanceRank: Record<string, number> = {
      major_achievement: 3,
      big_win: 2,
      standard: 1,
      small_win: 0,
    }
    const sorted = [...monthVictories].sort((a, b) => {
      if (a.is_moms_pick !== b.is_moms_pick) return a.is_moms_pick ? -1 : 1
      const aImp = importanceRank[a.importance] ?? 0
      const bImp = importanceRank[b.importance] ?? 0
      if (aImp !== bImp) return bImp - aImp
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    })
    return sorted.slice(0, 5)
  }, [monthVictories])

  const handleMarkDone = async () => {
    await completeRhythm.mutateAsync({
      familyId,
      memberId,
      rhythmKey: 'monthly_review',
      period: localMonthIso(),
      metadata: {},
    })
    onComplete?.()
  }

  const isComplete = completeRhythm.isSuccess

  return (
    <div
      className="rounded-xl p-5 space-y-4"
      style={{
        background: 'color-mix(in srgb, var(--color-accent-deep) 6%, transparent)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <div className="flex items-center gap-2">
        <CalendarDays size={20} style={{ color: 'var(--color-accent-deep)' }} />
        <h2
          className="text-base font-semibold"
          style={{
            color: 'var(--color-text-heading)',
            fontFamily: 'var(--font-heading)',
          }}
        >
          Monthly Review
        </h2>
        <span
          className="text-xs ml-auto"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {monthLabel}
        </span>
      </div>

      {/* Month at a Glance */}
      {stats && (
        <div className="grid grid-cols-3 gap-2">
          <StatTile label="Tasks done" value={stats.tasksCompleted} />
          <StatTile label="Victories" value={stats.victoryCount} />
          <StatTile label="Intention taps" value={stats.intentionIterations} />
        </div>
      )}

      {/* Highlight Reel */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Trophy size={14} style={{ color: 'var(--color-accent-deep)' }} />
          <h3
            className="text-sm font-semibold"
            style={{ color: 'var(--color-text-heading)' }}
          >
            Highlight reel
          </h3>
        </div>
        {highlightReel.length === 0 ? (
          <p className="text-xs italic" style={{ color: 'var(--color-text-secondary)' }}>
            No victories logged this month yet.
          </p>
        ) : (
          <ul className="space-y-1">
            {highlightReel.map(v => (
              <li
                key={v.id}
                className="text-xs flex items-start gap-2"
                style={{ color: 'var(--color-text-primary)' }}
              >
                <Sparkles
                  size={10}
                  style={{
                    color: 'var(--color-accent-deep)',
                    marginTop: 4,
                  }}
                  className="shrink-0"
                />
                <span>{v.description}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Stub sections */}
      <div
        className="rounded-md p-2 text-xs"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px dashed var(--color-border-subtle)',
          color: 'var(--color-text-secondary)',
        }}
      >
        View full monthly report — Reports page coming soon.
      </div>
      <div
        className="rounded-md p-2 text-xs"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px dashed var(--color-border-subtle)',
          color: 'var(--color-text-secondary)',
        }}
      >
        Want to do a full monthly review? Meeting-based review coming with Meetings.
      </div>

      <div className="flex items-center justify-end">
        <button
          type="button"
          onClick={handleMarkDone}
          disabled={completeRhythm.isPending || isComplete}
          className="text-sm font-semibold rounded-md px-4 py-2 disabled:opacity-50"
          style={{
            background: 'var(--surface-primary, var(--color-btn-primary-bg))',
            color: 'var(--color-btn-primary-text)',
          }}
        >
          {isComplete ? (
            <span className="inline-flex items-center gap-1">
              <Check size={14} />
              Marked done
            </span>
          ) : completeRhythm.isPending ? (
            'Saving…'
          ) : (
            'Mark monthly review done'
          )}
        </button>
      </div>
    </div>
  )
}

function StatTile({ label, value }: { label: string; value: number }) {
  return (
    <div
      className="rounded-md p-2 text-center"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <p
        className="text-xl font-bold"
        style={{
          color: 'var(--color-accent-deep)',
          fontFamily: 'var(--font-heading)',
        }}
      >
        {value}
      </p>
      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </p>
    </div>
  )
}
