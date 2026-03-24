/**
 * PRD-09A Screen 5: Opportunity / Job Board View
 * Mom's management view — grouped by sub-type (shared, repeatable, individual).
 * Kids see OpportunityDashboardView on their dashboard.
 */

import { Plus, RefreshCw, Lock, Trophy, Target } from 'lucide-react'
import { useTasks } from '@/hooks/useTasks'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { FeatureGuide } from '@/components/shared/FeatureGuide'
import { OpportunityCard } from './OpportunityCard'
import type { Task } from '@/types/tasks'

interface OpportunityBoardProps {
  familyId: string
  onCreateOpportunity: () => void
}

export function OpportunityBoard({ familyId, onCreateOpportunity }: OpportunityBoardProps) {
  const { data: _member } = useFamilyMember()
  const { data: allTasks = [] } = useTasks(familyId, { taskType: ['opportunity_repeatable', 'opportunity_claimable', 'opportunity_capped'] })

  const claimable = allTasks.filter(t => t.task_type === 'opportunity_claimable')
  const repeatable = allTasks.filter(t => t.task_type === 'opportunity_repeatable')
  const capped = allTasks.filter(t => t.task_type === 'opportunity_capped')

  return (
    <div className="flex flex-col gap-4 p-4">
      <FeatureGuide featureKey="tasks_opportunities" />

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-heading)' }}>
          Opportunities
        </h2>
        <button
          onClick={onCreateOpportunity}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          style={{
            background: 'var(--color-btn-primary-bg)',
            color: 'var(--color-btn-primary-text)',
          }}
        >
          <Plus size={16} />
          Create
        </button>
      </div>

      {allTasks.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-12">
          <Trophy size={32} style={{ color: 'var(--color-btn-primary-bg)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
            No opportunities yet
          </p>
          <p className="text-xs text-center" style={{ color: 'var(--color-text-secondary)' }}>
            Create optional tasks your kids can claim for extra rewards.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {claimable.length > 0 && (
            <OpportunityGroup
              title="Shared Job Board"
              icon={<Lock size={16} />}
              tasks={claimable}
              familyId={familyId}
            />
          )}
          {repeatable.length > 0 && (
            <OpportunityGroup
              title="Repeatable Tasks"
              icon={<RefreshCw size={16} />}
              tasks={repeatable}
              familyId={familyId}
            />
          )}
          {capped.length > 0 && (
            <OpportunityGroup
              title="Individual Opportunities"
              icon={<Target size={16} />}
              tasks={capped}
              familyId={familyId}
            />
          )}
        </div>
      )}
    </div>
  )
}

function OpportunityGroup({
  title,
  icon,
  tasks,
  familyId: _familyId,
}: {
  title: string
  icon: React.ReactNode
  tasks: Task[]
  familyId: string
}) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        border: '1px solid var(--color-border)',
        background: 'var(--color-bg-card)',
      }}
    >
      <div
        className="flex items-center gap-2 px-4 py-3"
        style={{
          borderBottom: '1px solid var(--color-border)',
          background: 'color-mix(in srgb, var(--color-bg-secondary) 50%, var(--color-bg-card))',
        }}
      >
        <span style={{ color: 'var(--color-btn-primary-bg)' }}>{icon}</span>
        <span className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
          {title}
        </span>
        <span
          className="ml-auto text-xs px-2 py-0.5 rounded-full"
          style={{
            background: 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, transparent)',
            color: 'var(--color-btn-primary-bg)',
          }}
        >
          {tasks.length}
        </span>
      </div>
      <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
        {tasks.map(task => (
          <OpportunityCard key={task.id} task={task} />
        ))}
      </div>
    </div>
  )
}
