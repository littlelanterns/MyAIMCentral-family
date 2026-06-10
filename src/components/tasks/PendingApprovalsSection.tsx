/**
 * PendingApprovalsSection — shared approver surface.
 *
 * FO-COMMAND-CENTER (2026-06-10): extracted verbatim from Tasks.tsx so it can
 * relocate to the Family Overview command center (founder vision 2026-06-09)
 * without forking the logic. The Build J mastery fork is load-bearing:
 * `completion_type='mastery_submit'` routes to the mastery hooks (Convention
 * #161), and useApproveMasterySubmission flips completion_type to
 * 'mastery_approved' so the gamification RPC accepts the row (Convention #200).
 *
 * PERMISSIONS-WIRING (founder Decision 9): `canActOnTask` gates actions —
 * view-only grants see the row with no buttons.
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Check, Clock, GraduationCap, X } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { Tooltip } from '@/components/shared'
import {
  useApproveTaskCompletion,
  useRejectTaskCompletion,
  type Task,
} from '@/hooks/useTasks'
import {
  useApproveMasterySubmission,
  useRejectMasterySubmission,
} from '@/hooks/usePractice'

export interface PendingApprovalsSectionProps {
  tasks: Task[]
  familyMembers: { id: string; display_name: string }[]
  approverId: string
  /**
   * PERMISSIONS-WIRING (founder Decision 9): may the viewer approve/reject
   * this task's submission? View-only grants see the row, no action buttons.
   * Defaults to allowed (mom path).
   */
  canActOnTask?: (task: Task) => boolean
}

/**
 * Scope pending-approval tasks to what the viewer may see (PRD-02 read
 * scoping, leak pass 2026-06-09): mom → all; others → own submissions, tasks
 * they created, or tasks assigned to members they hold grants for.
 */
export function filterVisiblePendingApprovals(
  tasks: Task[],
  isEffectiveMom: boolean,
  myId: string | undefined,
  viewableIds: Set<string>,
): Task[] {
  if (isEffectiveMom) return tasks
  if (!myId) return []
  return tasks.filter(
    (t) =>
      t.created_by === myId ||
      t.assignee_id === myId ||
      (!!t.assignee_id && viewableIds.has(t.assignee_id))
  )
}

export function PendingApprovalsSection({ tasks, familyMembers, approverId, canActOnTask }: PendingApprovalsSectionProps) {
  const approveCompletion = useApproveTaskCompletion()
  const rejectCompletion = useRejectTaskCompletion()
  // Build J: mastery submissions use dedicated hooks that set mastery_status correctly
  const approveMastery = useApproveMasterySubmission()
  const rejectMastery = useRejectMasterySubmission()
  const [rejectingTaskId, setRejectingTaskId] = useState<string | null>(null)
  const [rejectionNote, setRejectionNote] = useState('')

  // Fetch pending completions for these tasks.
  // Build J: also pull completion_type + mastery_evidence columns so we can fork
  // the rendering and approval logic for mastery submissions.
  const taskIds = tasks.map(t => t.id)
  const { data: pendingCompletions = [] } = useQuery({
    queryKey: ['pending-completions', taskIds],
    queryFn: async () => {
      if (taskIds.length === 0) return []
      const { data, error } = await supabase
        .from('task_completions')
        .select('id, task_id, member_id, completed_at, approval_status, completion_type, mastery_evidence_url, mastery_evidence_note')
        .in('task_id', taskIds)
        .eq('approval_status', 'pending')
      if (error) throw error
      return data ?? []
    },
    enabled: taskIds.length > 0,
  })

  const memberName = (id: string | null | undefined) => {
    if (!id) return 'Unknown'
    return familyMembers.find(m => m.id === id)?.display_name ?? 'Unknown'
  }

  async function handleApprove(task: Task) {
    const completion = pendingCompletions.find(c => c.task_id === task.id)
    if (!completion) return

    // Build J: mastery submissions go through the mastery approval hook which
    // sets mastery_status='approved' + promotes next sequential item.
    if ((completion as { completion_type?: string }).completion_type === 'mastery_submit') {
      await approveMastery.mutateAsync({
        sourceType: 'sequential_task',
        sourceId: task.id,
        approverId,
        completionId: completion.id,
      })
      return
    }

    await approveCompletion.mutateAsync({
      completionId: completion.id,
      taskId: task.id,
      approvedById: approverId,
    })
  }

  async function handleReject(task: Task) {
    const completion = pendingCompletions.find(c => c.task_id === task.id)
    if (!completion) return

    // Build J: mastery rejections reset mastery_status to 'practicing' so the
    // child continues practicing — NOT a permanent rejection.
    if ((completion as { completion_type?: string }).completion_type === 'mastery_submit') {
      await rejectMastery.mutateAsync({
        sourceType: 'sequential_task',
        sourceId: task.id,
        completionId: completion.id,
        rejectionNote: rejectionNote || null,
      })
      setRejectingTaskId(null)
      setRejectionNote('')
      return
    }

    await rejectCompletion.mutateAsync({
      completionId: completion.id,
      taskId: task.id,
      rejectionNote: rejectionNote || null,
    })
    setRejectingTaskId(null)
    setRejectionNote('')
  }

  return (
    <div
      className="rounded-xl overflow-hidden my-3"
      style={{ border: '2px solid var(--color-warning, var(--color-btn-primary-bg))', backgroundColor: 'var(--color-bg-card)' }}
    >
      <div
        className="px-4 py-2.5 flex items-center gap-2"
        style={{ backgroundColor: 'color-mix(in srgb, var(--color-warning, var(--color-btn-primary-bg)) 10%, var(--color-bg-card))', borderBottom: '1px solid var(--color-border)' }}
      >
        <Clock size={16} style={{ color: 'var(--color-warning, var(--color-btn-primary-bg))' }} />
        <span className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
          Pending Approvals ({tasks.length})
        </span>
      </div>
      <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
        {tasks.map((task) => {
          const completion = pendingCompletions.find(c => c.task_id === task.id)
          const completedBy = completion ? memberName(completion.member_id) : null
          const completedAt = completion ? new Date(completion.completed_at).toLocaleDateString() : null
          // Build J: detect mastery submissions for distinct rendering
          const isMasterySubmission = (completion as { completion_type?: string } | undefined)?.completion_type === 'mastery_submit'
          const masteryEvidenceNote = (completion as { mastery_evidence_note?: string | null } | undefined)?.mastery_evidence_note
          const masteryEvidenceUrl = (completion as { mastery_evidence_url?: string | null } | undefined)?.mastery_evidence_url
          const practiceCount = (task as unknown as { practice_count?: number }).practice_count ?? 0

          return (
            <div key={task.id} className="px-4 py-3 flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  {isMasterySubmission && (
                    <GraduationCap
                      size={14}
                      style={{ color: 'var(--color-btn-primary-bg)', flexShrink: 0 }}
                    />
                  )}
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-heading)' }}>
                    {task.title}
                  </p>
                </div>
                <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                  {isMasterySubmission
                    ? `Submitted for mastery by ${completedBy ?? 'Unknown'} · ${practiceCount} practice${practiceCount === 1 ? '' : 's'} logged`
                    : (
                      <>
                        {completedBy && `Completed by ${completedBy}`}
                        {completedAt && ` · ${completedAt}`}
                      </>
                    )}
                </p>
                {isMasterySubmission && masteryEvidenceNote && (
                  <p
                    className="text-xs mt-1 italic"
                    style={{
                      color: 'var(--color-text-primary)',
                      background: 'var(--color-bg-secondary)',
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    "{masteryEvidenceNote}"
                  </p>
                )}
                {isMasterySubmission && masteryEvidenceUrl && (
                  <a
                    href={masteryEvidenceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs mt-1 inline-flex items-center gap-1 underline-offset-2 hover:underline"
                    style={{ color: 'var(--color-btn-primary-bg)' }}
                  >
                    View evidence
                  </a>
                )}
              </div>

              {rejectingTaskId === task.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={rejectionNote}
                    onChange={e => setRejectionNote(e.target.value)}
                    placeholder="Reason (optional)"
                    className="px-2 py-1 rounded text-xs w-36"
                    style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                    autoFocus
                    onKeyDown={e => e.key === 'Enter' && handleReject(task)}
                  />
                  <button
                    onClick={() => handleReject(task)}
                    className="p-1.5 rounded-lg"
                    style={{ backgroundColor: 'var(--color-error, #ef4444)', color: '#fff' }}
                    disabled={rejectCompletion.isPending}
                  >
                    <X size={14} />
                  </button>
                  <button
                    onClick={() => { setRejectingTaskId(null); setRejectionNote('') }}
                    className="text-xs px-2 py-1"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Cancel
                  </button>
                </div>
              ) : canActOnTask && !canActOnTask(task) ? (
                // View-only grant: row visible, actions hidden (Decision 9)
                <span className="text-xs whitespace-nowrap" style={{ color: 'var(--color-text-secondary)' }}>
                  View only
                </span>
              ) : (
                <div className="flex items-center gap-1.5">
                  <Tooltip content="Approve">
                  <button
                    onClick={() => handleApprove(task)}
                    disabled={approveCompletion.isPending}
                    className="p-1.5 rounded-lg"
                    style={{ backgroundColor: 'var(--color-success, #22c55e)', color: '#fff' }}
                  >
                    <Check size={14} />
                  </button>
                  </Tooltip>
                  <Tooltip content="Reject">
                  <button
                    onClick={() => setRejectingTaskId(task.id)}
                    className="p-1.5 rounded-lg"
                    style={{ backgroundColor: 'var(--color-error, #ef4444)', color: '#fff' }}
                  >
                    <X size={14} />
                  </button>
                  </Tooltip>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
