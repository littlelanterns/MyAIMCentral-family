/**
 * PRD-09A Screen 5: Individual opportunity card for the management view.
 */

import { RefreshCw, Lock, Target, Clock, User } from 'lucide-react'
import { useActiveClaims } from '@/hooks/useTaskClaims'
import type { Task } from '@/types/tasks'

interface OpportunityCardProps {
  task: Task
}

export function OpportunityCard({ task }: OpportunityCardProps) {
  const { data: activeClaims = [] } = useActiveClaims(
    task.task_type === 'opportunity_claimable' ? task.id : undefined
  )

  const activeClaim = activeClaims[0]
  const isClaimable = task.task_type === 'opportunity_claimable'
  const isRepeatable = task.task_type === 'opportunity_repeatable'
  const isCapped = task.task_type === 'opportunity_capped'

  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <span
        className="mt-0.5 shrink-0"
        style={{ color: 'var(--color-btn-primary-bg)' }}
      >
        {isClaimable && <Lock size={16} />}
        {isRepeatable && <RefreshCw size={16} />}
        {isCapped && <Target size={16} />}
      </span>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
          {task.title}
        </p>

        <div className="flex flex-wrap items-center gap-2 mt-1">
          {/* Reward info */}
          {task.task_type && (
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{
                background: 'color-mix(in srgb, var(--color-accent) 12%, transparent)',
                color: 'var(--color-accent)',
              }}
            >
              {isClaimable ? 'Claimable' : isRepeatable ? 'Repeatable' : 'Capped'}
            </span>
          )}

          {/* Max completions */}
          {task.max_completions && (
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Max {task.max_completions}
            </span>
          )}

          {/* Claim lock info */}
          {isClaimable && task.claim_lock_duration && (
            <span className="text-xs flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
              <Clock size={12} />
              {task.claim_lock_duration} {task.claim_lock_unit} lock
            </span>
          )}
        </div>

        {/* Active claim status */}
        {isClaimable && activeClaim && (
          <div
            className="flex items-center gap-1.5 mt-2 text-xs px-2 py-1 rounded"
            style={{
              background: 'color-mix(in srgb, var(--color-accent) 8%, transparent)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <User size={12} />
            Claimed — in progress
          </div>
        )}

        {isClaimable && !activeClaim && (
          <div
            className="text-xs mt-2 px-2 py-1 rounded"
            style={{
              background: 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, transparent)',
              color: 'var(--color-btn-primary-bg)',
            }}
          >
            Available
          </div>
        )}
      </div>
    </div>
  )
}
