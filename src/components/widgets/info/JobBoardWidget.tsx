// PRD-10 Enhancement: Job Board widget for Family Hub
// Shows opportunity tasks that kids can claim. Read-only on Hub — no claim action.

import { useQuery } from '@tanstack/react-query'
import { ClipboardList, Lock } from 'lucide-react'
import type { DashboardWidget } from '@/types/widgets'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'

interface JobBoardWidgetProps {
  widget: DashboardWidget
  isCompact?: boolean
}

interface OpportunityTask {
  id: string
  title: string
  task_type: string
  status: string
  points_override: number | null
  assignee_id: string | null
  task_rewards: { reward_type: string; reward_value: Record<string, unknown> }[]
  task_claims: { member_id: string; status: string; member: { display_name: string; assigned_color: string | null } | null }[]
}

export function JobBoardWidget({ widget, isCompact }: JobBoardWidgetProps) {
  const { data: currentMember } = useFamilyMember()
  const familyId = currentMember?.family_id

  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ['hub-job-board', familyId],
    queryFn: async () => {
      if (!familyId) return []
      const { data, error } = await supabase
        .from('tasks')
        .select(`
          id, title, task_type, status, points_override, assignee_id,
          task_rewards (reward_type, reward_value),
          task_claims (member_id, status, member:family_members!task_claims_member_id_fkey(display_name, assigned_color))
        `)
        .eq('family_id', familyId)
        .in('task_type', ['opportunity_repeatable', 'opportunity_claimable', 'opportunity_capped'])
        .is('archived_at', null)
        .in('status', ['pending', 'in_progress'])
        .order('sort_order', { ascending: true })
        .limit(10)

      if (error) throw error
      return (data ?? []) as unknown as OpportunityTask[]
    },
    enabled: !!familyId,
    staleTime: 1000 * 60 * 5,
  })

  if (isLoading) {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-2">
        <ClipboardList size={20} style={{ color: 'var(--color-text-tertiary)' }} className="animate-pulse" />
        <div className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Loading...</div>
      </div>
    )
  }

  // Small (1x1)
  if (isCompact || widget.size === 'small') {
    return (
      <div className="flex flex-col h-full items-center justify-center gap-1.5 text-center p-2">
        <ClipboardList size={18} style={{ color: 'var(--color-accent)' }} />
        <div className="text-xs font-medium" style={{ color: 'var(--color-text-primary)' }}>
          Job Board
        </div>
        <div
          className="text-[10px] px-1.5 py-0.5 rounded-full"
          style={{
            background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
            color: 'var(--color-accent)',
          }}
        >
          {opportunities.length} {opportunities.length === 1 ? 'job' : 'jobs'}
        </div>
      </div>
    )
  }

  // Medium / Large
  return (
    <div className="flex flex-col h-full w-full text-left p-1 gap-1.5">
      <div className="flex items-center gap-1.5">
        <ClipboardList size={14} style={{ color: 'var(--color-accent)' }} />
        <span className="text-xs font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          Job Board
        </span>
        <span className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
          {opportunities.length} available
        </span>
      </div>

      <div className="flex-1 space-y-1 min-h-0 overflow-hidden">
        {opportunities.length > 0 ? opportunities.slice(0, widget.size === 'large' ? 6 : 3).map(job => (
          <JobRow key={job.id} job={job} />
        )) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-xs text-center" style={{ color: 'var(--color-text-tertiary)' }}>
              No jobs available right now
            </div>
          </div>
        )}
      </div>

      {opportunities.length > (widget.size === 'large' ? 6 : 3) && (
        <div className="text-[10px] font-medium" style={{ color: 'var(--color-accent)' }}>
          +{opportunities.length - (widget.size === 'large' ? 6 : 3)} more
        </div>
      )}

      <div className="text-[10px] text-center" style={{ color: 'var(--color-text-tertiary)' }}>
        Log in to claim a job
      </div>
    </div>
  )
}

function JobRow({ job }: { job: OpportunityTask }) {
  const activeClaim = job.task_claims?.find(c => c.status === 'claimed')
  const reward = job.task_rewards?.[0]

  let rewardDisplay: string | null = null
  if (reward) {
    if (reward.reward_type === 'money') {
      const amount = (reward.reward_value as { amount?: number })?.amount
      rewardDisplay = amount != null ? `$${amount}` : null
    } else if (reward.reward_type === 'points') {
      const amount = (reward.reward_value as { amount?: number })?.amount
      rewardDisplay = amount != null ? `${amount} pts` : null
    }
  }
  if (!rewardDisplay && job.points_override) {
    rewardDisplay = `${job.points_override} pts`
  }

  return (
    <div
      className="flex items-center gap-2 px-2 py-1.5 rounded-md"
      style={{
        background: activeClaim
          ? 'color-mix(in srgb, var(--color-border-default) 50%, transparent)'
          : 'var(--color-bg-secondary)',
      }}
    >
      <div className="flex-1 min-w-0">
        <div
          className="text-xs font-medium truncate"
          style={{ color: activeClaim ? 'var(--color-text-tertiary)' : 'var(--color-text-primary)' }}
        >
          {job.title}
        </div>
      </div>

      {/* Claimed indicator */}
      {activeClaim && activeClaim.member && (
        <div className="flex items-center gap-1 shrink-0">
          <Lock size={10} style={{ color: 'var(--color-text-tertiary)' }} />
          <span
            className="text-[10px] font-medium"
            style={{ color: activeClaim.member.assigned_color ?? 'var(--color-text-secondary)' }}
          >
            {activeClaim.member.display_name}
          </span>
        </div>
      )}

      {/* Available badge */}
      {!activeClaim && (
        <span
          className="text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
          style={{
            background: 'color-mix(in srgb, var(--color-accent) 15%, transparent)',
            color: 'var(--color-accent)',
          }}
        >
          Available
        </span>
      )}

      {/* Reward */}
      {rewardDisplay && (
        <span className="text-[10px] font-medium shrink-0" style={{ color: 'var(--color-accent-deep)' }}>
          {rewardDisplay}
        </span>
      )}
    </div>
  )
}
