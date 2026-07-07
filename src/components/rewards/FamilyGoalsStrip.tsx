/**
 * FamilyGoalsStrip — FAMILY-GOALS-PRIZES Build Item 4
 *
 * Prize Board → Prizes tab: active family goals with progress bars + prize
 * preview + [Manage Family Goals] door. Hidden entirely when no goals exist
 * EXCEPT a quiet [+ Family goal] affordance for mom (spec: "Hidden when no
 * goals exist EXCEPT a quiet [+ Family goal] affordance for mom").
 */

import { Gift, Settings2, Sparkles, Plus } from 'lucide-react'
import { useActiveFamilyGoals, useFamilyGoalProgress } from '@/hooks/useFamilyGoals'
import { PlatformAssetImage } from '@/components/shared/PlatformAssetImage'
import type { FamilyGoal } from '@/types/family-goals'

export function FamilyGoalsStrip({
  familyId,
  isMom,
  onManage,
}: {
  familyId: string
  isMom: boolean
  onManage: () => void
}) {
  const { data: goals = [], isLoading } = useActiveFamilyGoals(familyId)

  if (isLoading) return null

  if (goals.length === 0) {
    if (!isMom) return null
    return (
      <button
        type="button"
        data-testid="family-goal-quiet-create"
        onClick={onManage}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px dashed var(--color-border-default)',
          color: 'var(--color-text-secondary)',
        }}
      >
        <Plus size={16} />
        + Family goal
      </button>
    )
  }

  return (
    <div
      data-testid="family-goals-strip"
      className="rounded-xl p-4 space-y-3"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 6%, var(--color-bg-card))',
        border: '1px solid color-mix(in srgb, var(--color-btn-primary-bg) 20%, transparent)',
      }}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles size={16} style={{ color: 'var(--color-btn-primary-bg)' }} />
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
            Family Goals
          </span>
        </div>
        {isMom && (
          <button
            type="button"
            data-testid="family-goal-manage-button"
            onClick={onManage}
            className="flex items-center gap-1 text-xs font-medium px-2.5 py-1.5 rounded-lg"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border-default)',
            }}
          >
            <Settings2 size={12} />
            Manage
          </button>
        )}
      </div>

      <div className="space-y-2">
        {goals.map((goal) => (
          <FamilyGoalStripRow key={goal.id} goal={goal} />
        ))}
      </div>
    </div>
  )
}

function FamilyGoalStripRow({ goal }: { goal: FamilyGoal }) {
  const { data: progress } = useFamilyGoalProgress(goal.id)
  const total = progress?.total ?? goal.current_progress

  const isEachMember = goal.earning_mode === 'each_member'
  const membersMet = isEachMember
    ? (progress?.perMember ?? []).filter((m) => m.count >= goal.target_count).length
    : 0

  const pct = isEachMember
    ? goal.participating_member_ids.length > 0
      ? Math.min(100, Math.round((membersMet / goal.participating_member_ids.length) * 100))
      : 0
    : Math.min(100, Math.round((total / goal.target_count) * 100))

  return (
    <div
      data-testid={`family-goal-strip-row-${goal.id}`}
      className="flex items-center gap-3 p-2.5 rounded-lg"
      style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border-default)' }}
    >
      <FamilyGoalPrizeThumb goal={goal} />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
          {goal.title}
        </p>
        <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
          {goal.prize_name}
        </p>

        {goal.progress_visible && (
          <div className="mt-1.5">
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ backgroundColor: 'var(--color-bg-secondary)' }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${pct}%`, backgroundColor: 'var(--color-btn-primary-bg)' }}
              />
            </div>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              {isEachMember
                ? `${membersMet}/${goal.participating_member_ids.length} members at ${goal.target_count}`
                : `${total} / ${goal.target_count}`}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}

function FamilyGoalPrizeThumb({ goal }: { goal: FamilyGoal }) {
  if (goal.prize_image_url) {
    return <img src={goal.prize_image_url} alt="" className="w-9 h-9 rounded object-cover shrink-0" />
  }
  if (goal.prize_asset_key) {
    return (
      <PlatformAssetImage
        assetKey={goal.prize_asset_key}
        size={36}
        assetSize={128}
        variant="B"
        fallback={
          <div className="w-9 h-9 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            <Gift size={16} className="opacity-50" />
          </div>
        }
      />
    )
  }
  return (
    <div className="w-9 h-9 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
      <Gift size={16} className="opacity-50" />
    </div>
  )
}
