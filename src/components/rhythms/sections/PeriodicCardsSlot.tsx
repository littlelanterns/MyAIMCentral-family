/**
 * PRD-18 Section Type: Periodic Cards Slot
 *
 * Renders inline Weekly/Monthly/Quarterly review cards inside the
 * Morning Rhythm modal when the current day matches each periodic
 * rhythm's trigger AND that rhythm is enabled AND there's no
 * completion record for the current period yet.
 *
 * Lives inside the adult/independent morning rhythm at order 8
 * (end of the morning narrative arc, just before the scrollable
 * modal bottom). Phase A's version returned null — Phase B4 wires
 * up the real inline rendering.
 *
 * Each card writes its own rhythm_completions row when marked done.
 * The slot re-queries on completion and the completed card disappears.
 */

import { useMemo } from 'react'
import { useRhythmConfigs, useTodaysRhythmCompletions } from '@/hooks/useRhythms'
import { localWeekIso, localMonthIso, localQuarterIso } from '@/utils/dates'
import { isRhythmActive, type RhythmConfig } from '@/types/rhythms'
import { WeeklyReviewCard } from '../periodic/WeeklyReviewCard'
import { MonthlyReviewCard } from '../periodic/MonthlyReviewCard'
import { QuarterlyInventoryCard } from '../periodic/QuarterlyInventoryCard'

interface Props {
  familyId: string
  memberId: string
}

export function PeriodicCardsSlot({ familyId, memberId }: Props) {
  const { data: configs = [] } = useRhythmConfigs(memberId)
  const { data: _todaysCompletions = [] } = useTodaysRhythmCompletions(memberId)

  // We need period-aware completions, not just "today". Each periodic
  // rhythm has its own period key (week/month/quarter). We query
  // completions for each one individually below.
  const { weeklyConfig, monthlyConfig, quarterlyConfig } = useMemo(() => {
    const find = (key: string) =>
      configs.find(c => c.rhythm_key === key && c.enabled) ?? null
    return {
      weeklyConfig: find('weekly_review'),
      monthlyConfig: find('monthly_review'),
      quarterlyConfig: find('quarterly_inventory'),
    }
  }, [configs])

  const now = new Date()
  const showWeekly =
    !!weeklyConfig && isRhythmActive(weeklyConfig.timing, now)
  const showMonthly =
    !!monthlyConfig && isRhythmActive(monthlyConfig.timing, now)
  // Quarterly Inventory uses lifelantern_staleness trigger — for Phase
  // B we always show it when enabled (the 90-day staleness check comes
  // with PRD-12A). User can still mark it done to hide until next quarter.
  const showQuarterly = !!quarterlyConfig

  return (
    <div className="space-y-4">
      {showWeekly && weeklyConfig && (
        <PeriodicCardWrapper
          config={weeklyConfig}
          familyId={familyId}
          memberId={memberId}
          period={localWeekIso()}
          render={() => (
            <WeeklyReviewCard familyId={familyId} memberId={memberId} />
          )}
        />
      )}
      {showMonthly && monthlyConfig && (
        <PeriodicCardWrapper
          config={monthlyConfig}
          familyId={familyId}
          memberId={memberId}
          period={localMonthIso()}
          render={() => (
            <MonthlyReviewCard familyId={familyId} memberId={memberId} />
          )}
        />
      )}
      {showQuarterly && quarterlyConfig && (
        <PeriodicCardWrapper
          config={quarterlyConfig}
          familyId={familyId}
          memberId={memberId}
          period={localQuarterIso()}
          render={() => (
            <QuarterlyInventoryCard familyId={familyId} memberId={memberId} />
          )}
        />
      )}
    </div>
  )
}

/**
 * Wrapper that hides the card if a completion exists for the current
 * period. Uses a direct supabase query because useRhythmCompletion is
 * scoped to today's daily period — periodic rhythms need their own
 * week/month/quarter period strings.
 */
function PeriodicCardWrapper({
  config,
  familyId,
  memberId,
  period,
  render,
}: {
  config: RhythmConfig
  familyId: string
  memberId: string
  period: string
  render: () => React.ReactNode
}) {
  const { data: completion } = usePeriodicCompletion(
    familyId,
    memberId,
    config.rhythm_key,
    period
  )

  // Hide if already completed for this period
  if (completion?.status === 'completed') return null

  return <>{render()}</>
}

// ─── Period-aware completion query ──────────────────────────

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

function usePeriodicCompletion(
  familyId: string,
  memberId: string,
  rhythmKey: string,
  period: string
) {
  return useQuery({
    queryKey: ['rhythm-completion', memberId, rhythmKey, period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rhythm_completions')
        .select('*')
        .eq('family_id', familyId)
        .eq('member_id', memberId)
        .eq('rhythm_key', rhythmKey)
        .eq('period', period)
        .maybeSingle()
      if (error) throw error
      return data
    },
    enabled: !!familyId && !!memberId,
  })
}
