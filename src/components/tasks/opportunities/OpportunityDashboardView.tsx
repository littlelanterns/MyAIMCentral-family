/**
 * PRD-09A Screen 5 (Kid's Dashboard view):
 * Shows opportunities available to the current member.
 * Claimable: [Claim] button. Repeatable: [Do This]. Capped: progress.
 */

import { useState } from 'react'
import { Lock, RefreshCw, Target, Clock, Check } from 'lucide-react'
import { useTasks } from '@/hooks/useTasks'
import { useActiveClaims, useMyActiveClaims } from '@/hooks/useTaskClaims'
import { useClaimTask } from './useClaimTask'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import type { Task } from '@/types/tasks'

interface OpportunityDashboardViewProps {
  familyId: string
}

export function OpportunityDashboardView({ familyId }: OpportunityDashboardViewProps) {
  const { data: member } = useFamilyMember()
  const { data: opportunities = [] } = useTasks({
    familyId,
    taskTypes: ['opportunity_repeatable', 'opportunity_claimable', 'opportunity_capped'],
  })
  const { data: myClaims = [] } = useMyActiveClaims(member?.id)

  if (opportunities.length === 0) return null

  return (
    <div className="flex flex-col gap-2">
      <p
        className="text-xs font-medium uppercase tracking-wider px-1"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Opportunities
      </p>
      {opportunities.map(task => (
        <OpportunityDashboardCard
          key={task.id}
          task={task}
          memberId={member?.id ?? ''}
          isClaimed={myClaims.some(c => c.task_id === task.id)}
        />
      ))}
    </div>
  )
}

function OpportunityDashboardCard({
  task,
  memberId,
  isClaimed,
}: {
  task: Task
  memberId: string
  isClaimed: boolean
}) {
  const { claimTask, isLoading: claiming } = useClaimTask()
  const [completing, setCompleting] = useState(false)

  const isClaimable = task.task_type === 'opportunity_claimable'
  const isRepeatable = task.task_type === 'opportunity_repeatable'
  const isCapped = task.task_type === 'opportunity_capped'

  async function handleClaim() {
    await claimTask({ taskId: task.id, memberId })
  }

  return (
    <div
      className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
      }}
    >
      <span style={{ color: 'var(--color-btn-primary-bg)' }}>
        {isClaimable && <Lock size={18} />}
        {isRepeatable && <RefreshCw size={18} />}
        {isCapped && <Target size={18} />}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
          {task.title}
        </p>
        {isCapped && task.max_completions && (
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {/* completion count would come from task_completions query */}
            0 of {task.max_completions} this week
          </p>
        )}
      </div>

      {/* Action buttons */}
      {isClaimable && !isClaimed && (
        <button
          onClick={handleClaim}
          disabled={claiming}
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{
            background: 'var(--color-btn-primary-bg)',
            color: 'var(--color-btn-primary-text)',
          }}
        >
          Claim
        </button>
      )}

      {isClaimable && isClaimed && (
        <div className="flex items-center gap-1.5">
          <Clock size={14} style={{ color: 'var(--color-accent)' }} />
          <button
            className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
            style={{
              background: 'var(--color-btn-primary-bg)',
              color: 'var(--color-btn-primary-text)',
            }}
          >
            Complete
          </button>
        </div>
      )}

      {isRepeatable && (
        <button
          className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
          style={{
            background: 'var(--color-btn-primary-bg)',
            color: 'var(--color-btn-primary-text)',
          }}
        >
          Do This
        </button>
      )}
    </div>
  )
}
