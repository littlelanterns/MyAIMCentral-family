/**
 * HubFamilyGoalsSection — FAMILY-GOALS-PRIZES Build Item 5
 *
 * New Hub section: active goals (title, prize name/image, Mode A family
 * progress bar OR Mode B per-member mini-progress with member colors) +
 * a ≤48h celebration banner for a just-completed goal. Hidden entirely when
 * no active/recent goals exist (PRD-14D empty-section pattern); mom sees a
 * warm empty state inviting creation via Hub Settings. NOT collapsible
 * (PRD-14D Decision #18) — always renders in full when visible.
 */

import { PartyPopper, Sparkles, Trophy } from 'lucide-react'
import { useFamily } from '@/hooks/useFamily'
import { useFamilyMembers } from '@/hooks/useFamilyMember'
import { useActiveFamilyGoals, useFamilyGoals, useFamilyGoalProgress } from '@/hooks/useFamilyGoals'
import { PlatformAssetImage } from '@/components/shared/PlatformAssetImage'
import { getMemberColor } from '@/lib/memberColors'
import type { FamilyGoal } from '@/types/family-goals'

const RECENT_COMPLETION_WINDOW_MS = 48 * 60 * 60 * 1000

export function HubFamilyGoalsSection({ isMom }: { isMom: boolean }) {
  const { data: family } = useFamily()
  const { data: activeGoals } = useActiveFamilyGoals(family?.id)
  const { data: allGoals } = useFamilyGoals(family?.id)
  const { data: members = [] } = useFamilyMembers(family?.id)

  const recentlyCompleted = (allGoals ?? []).filter((g) => {
    if (g.status !== 'completed' || !g.completed_at) return false
    return Date.now() - new Date(g.completed_at).getTime() <= RECENT_COMPLETION_WINDOW_MS
  })

  const nothingToShow = (activeGoals ?? []).length === 0 && recentlyCompleted.length === 0

  if (nothingToShow) {
    if (!isMom) return null
    return (
      <div
        className="rounded-lg p-4 text-center"
        data-testid="hub-family-goals-empty"
        style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
      >
        <Sparkles size={24} className="mx-auto mb-2" style={{ color: 'var(--color-text-secondary)' }} />
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Family Goals let your whole family work toward a prize together.
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          Create one in Hub Settings!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-3" data-testid="hub-family-goals-section">
      <div className="flex items-center gap-2">
        <Sparkles size={16} style={{ color: 'var(--color-text-secondary)' }} />
        <span
          className="text-sm font-semibold"
          style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
        >
          Family Goals
        </span>
      </div>

      {recentlyCompleted.map((goal) => (
        <div
          key={`celebration-${goal.id}`}
          data-testid={`hub-family-goal-celebration-${goal.id}`}
          className="rounded-lg p-3 flex items-center gap-3"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, var(--color-bg-card))',
            border: '1px solid color-mix(in srgb, var(--color-btn-primary-bg) 30%, transparent)',
          }}
        >
          <PartyPopper size={20} style={{ color: 'var(--color-btn-primary-bg)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
            You did it! {goal.prize_name} earned!
          </p>
        </div>
      ))}

      <div className="space-y-2">
        {(activeGoals ?? []).map((goal) => (
          <HubFamilyGoalCard key={goal.id} goal={goal} members={members} />
        ))}
      </div>
    </div>
  )
}

function HubFamilyGoalCard({
  goal,
  members,
}: {
  goal: FamilyGoal
  members: { id: string; display_name: string; calendar_color?: string | null; assigned_color?: string | null; member_color?: string | null }[]
}) {
  const { data: progress } = useFamilyGoalProgress(goal.id)
  const isEachMember = goal.earning_mode === 'each_member'

  return (
    <div
      className="rounded-lg p-3"
      data-testid={`hub-family-goal-card-${goal.id}`}
      style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
    >
      <div className="flex items-center gap-3">
        <GoalThumbSmall goal={goal} />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
            {goal.title}
          </p>
          <p className="text-xs truncate" style={{ color: 'var(--color-text-secondary)' }}>
            {goal.prize_name}
          </p>
        </div>
      </div>

      {goal.progress_visible && (
        <div className="mt-2">
          {isEachMember ? (
            <div className="flex flex-wrap gap-1.5">
              {goal.participating_member_ids.map((memberId) => {
                const member = members.find((m) => m.id === memberId)
                const count = progress?.perMember.find((p) => p.memberId === memberId)?.count ?? 0
                const color = member ? getMemberColor(member) : 'var(--color-accent)'
                const met = count >= goal.target_count
                return (
                  <span
                    key={memberId}
                    className="text-xs px-2 py-1 rounded-full font-medium"
                    style={{
                      backgroundColor: met ? color : 'transparent',
                      color: met ? 'var(--color-text-on-primary, #fff)' : color,
                      border: `1.5px solid ${color}`,
                    }}
                  >
                    {member?.display_name.split(' ')[0] ?? 'Member'} {count}/{goal.target_count}
                  </span>
                )
              })}
            </div>
          ) : (
            <div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${Math.min(100, Math.round(((progress?.total ?? goal.current_progress) / goal.target_count) * 100))}%`,
                    backgroundColor: 'var(--color-btn-primary-bg)',
                  }}
                />
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                {progress?.total ?? goal.current_progress} / {goal.target_count}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function GoalThumbSmall({ goal }: { goal: FamilyGoal }) {
  if (goal.prize_image_url) {
    return <img src={goal.prize_image_url} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
  }
  if (goal.prize_asset_key) {
    return (
      <PlatformAssetImage
        assetKey={goal.prize_asset_key}
        size={32}
        assetSize={128}
        variant="B"
        fallback={
          <div className="w-8 h-8 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            <Trophy size={14} className="opacity-50" />
          </div>
        }
      />
    )
  }
  return (
    <div className="w-8 h-8 rounded flex items-center justify-center shrink-0" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
      <Trophy size={14} className="opacity-50" />
    </div>
  )
}
