/**
 * InfoFamilyIntention — Personal dashboard widget for Family Best Intentions.
 * Shows "You: X · Family: Y" tally format for today.
 * Reads from family_best_intentions + family_intention_iterations.
 */

import { Heart } from 'lucide-react'
import { useFamilyBestIntentions } from '@/hooks/useFamilyBestIntentions'
import { useTodayFamilyIterations } from '@/hooks/useFamilyBestIntentions'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import type { DashboardWidget } from '@/types/widgets'

interface Props {
  widget: DashboardWidget
  isCompact?: boolean
}

export function InfoFamilyIntention({ widget: _widget, isCompact }: Props) {
  const { data: family } = useFamily()
  const { data: member } = useFamilyMember()
  const { data: intentions = [] } = useFamilyBestIntentions(family?.id)
  const { data: todayIterations = [] } = useTodayFamilyIterations(family?.id)

  const activeIntentions = intentions.filter((i) => i.is_active)

  if (activeIntentions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-1 px-2 text-center">
        <Heart size={16} style={{ color: 'var(--color-text-secondary)', opacity: 0.5 }} />
        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          No family intentions yet
        </span>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 px-2 py-1.5">
      {(isCompact ? activeIntentions.slice(0, 2) : activeIntentions).map((intention) => {
        const myCount = todayIterations.filter(
          (i) => i.intention_id === intention.id && i.member_id === member?.id
        ).length
        const familyCount = todayIterations.filter(
          (i) => i.intention_id === intention.id
        ).length

        return (
          <div key={intention.id} className="flex items-center gap-2">
            <Heart
              size={12}
              className="shrink-0"
              style={{ color: 'var(--color-btn-primary-bg)', fill: myCount > 0 ? 'var(--color-btn-primary-bg)' : 'none' }}
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                {intention.title}
              </p>
              <p className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                You: {myCount} · Family: {familyCount}
              </p>
            </div>
          </div>
        )
      })}
      {isCompact && activeIntentions.length > 2 && (
        <span className="text-[10px] text-center" style={{ color: 'var(--color-text-secondary)' }}>
          +{activeIntentions.length - 2} more
        </span>
      )}
    </div>
  )
}
