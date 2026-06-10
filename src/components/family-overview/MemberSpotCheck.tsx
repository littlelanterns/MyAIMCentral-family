/**
 * MemberSpotCheck — per-member deep view inside the Family Overview command
 * center (FO-COMMAND-CENTER, founder vision 2026-06-09).
 *
 * "The tab set she likes" relocated from the Tasks page: My Tasks / Routines /
 * Opportunities / Sequential, scoped to ONE member. Tap a member's column
 * header on Family Overview → this modal. Editing opens the full
 * TaskCreationModal inline (founder Q4: "no page hopping").
 *
 * Completion attribution: marking complete here credits the SPOT-CHECKED
 * member (mom checking on the kid's behalf, PRD-14C Screen 2). No unmark from
 * this view (PRD-14C Decision 8 — unmark cascade stays on the full surfaces).
 */

import { useMemo, useState } from 'react'
import { CheckSquare, RefreshCw, Star, BookOpen, Plus } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { Tabs, Button, EmptyState, SparkleOverlay } from '@/components/shared'
import type { TabItem } from '@/components/shared'
import { TaskCard } from '@/components/tasks/TaskCard'
import { useTaskCompletion } from '@/components/tasks/useTaskCompletion'
import { useTasks, type Task } from '@/hooks/useTasks'
import { useTaskEditor } from '@/hooks/useTaskEditor'
import { TaskEditModal } from '@/components/tasks/TaskEditModal'
import { SequentialCollectionView } from '@/components/tasks/sequential/SequentialCollectionView'
import { SequentialCreatorModal } from '@/components/tasks/sequential/SequentialCreatorModal'
import { getMemberColor } from '@/lib/memberColors'
import type { FamilyMember } from '@/hooks/useFamilyMember'

type SpotCheckTab = 'tasks' | 'routines' | 'opportunities' | 'sequential'

export interface MemberSpotCheckProps {
  member: FamilyMember
  familyId: string
  /** The authenticated viewer (mom, or granted adult in Phase 4) */
  viewerId: string
  viewerIsPrimaryParent: boolean
  /** PERMISSIONS-WIRING Decision 9: false = view-only (no complete/edit) */
  canAct: boolean
  onClose: () => void
}

export function MemberSpotCheck({
  member,
  familyId,
  viewerId,
  viewerIsPrimaryParent,
  canAct,
  onClose,
}: MemberSpotCheckProps) {
  const [activeTab, setActiveTab] = useState<SpotCheckTab>('tasks')
  const [sparkleOrigin, setSparkleOrigin] = useState<{ x: number; y: number } | null>(null)
  const [sequentialCreatorOpen, setSequentialCreatorOpen] = useState(false)
  const { data: allTasks = [] } = useTasks(familyId)
  const editor = useTaskEditor()

  const color = member.calendar_color || getMemberColor(member)

  // Completion credits the spot-checked member (PRD-14C Screen 2)
  const { toggle, isCompleting } = useTaskCompletion({
    memberId: member.id,
    familyId,
    isPrimaryParent: viewerIsPrimaryParent,
    onSparkle: (origin) => {
      setSparkleOrigin(origin ?? null)
      setTimeout(() => setSparkleOrigin(null), 1000)
    },
  })

  // PRD-14C Decision 8: no unmark from the overview surfaces
  const handleToggle = (task: Task, origin?: { x: number; y: number }) => {
    if (!canAct) return
    if (task.status === 'completed') return
    toggle(task, origin)
  }

  const memberTasks = useMemo(
    () =>
      allTasks.filter(
        (t) =>
          t.assignee_id === member.id &&
          !t.archived_at &&
          t.status !== 'cancelled'
      ),
    [allTasks, member.id]
  )

  const tabTasks = useMemo(() => {
    switch (activeTab) {
      case 'tasks':
        return memberTasks.filter((t) => t.task_type === 'task' || t.task_type === 'habit')
      case 'routines':
        return memberTasks.filter((t) => t.task_type === 'routine')
      case 'opportunities':
        return memberTasks.filter((t) => t.task_type.startsWith('opportunity'))
      default:
        return []
    }
  }, [memberTasks, activeTab])

  const tabs: TabItem[] = [
    { key: 'tasks', label: 'My Tasks', icon: <CheckSquare size={15} /> },
    { key: 'routines', label: 'Routines', icon: <RefreshCw size={15} /> },
    { key: 'opportunities', label: 'Opportunities', icon: <Star size={15} /> },
    { key: 'sequential', label: 'Sequential', icon: <BookOpen size={15} /> },
  ]

  const firstName = member.display_name.split(' ')[0]

  return (
    <>
      <ModalV2
        id={`member-spot-check-${member.id}`}
        isOpen
        onClose={onClose}
        type="transient"
        size="xl"
        title={`${firstName}'s Items`}
      >
        <div className="density-compact" data-testid="member-spot-check">
          {sparkleOrigin && (
            <SparkleOverlay
              type="quick_burst"
              origin={sparkleOrigin}
              onComplete={() => setSparkleOrigin(null)}
            />
          )}

          {/* Member identity strip */}
          <div
            className="flex items-center gap-2 pb-3"
            style={{ borderBottom: `3px solid ${color}` }}
          >
            <span
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
              style={{ backgroundColor: color, color: 'var(--color-text-on-primary, #fff)' }}
            >
              {member.display_name.charAt(0)}
            </span>
            <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
              {member.display_name}
            </span>
            {!canAct && (
              <span className="ml-auto text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                View only
              </span>
            )}
          </div>

          <Tabs tabs={tabs} activeKey={activeTab} onChange={(key) => setActiveTab(key as SpotCheckTab)} />

          <div className="pt-3 min-h-60">
            {activeTab === 'sequential' ? (
              <div className="space-y-3">
                {/* FO-COMMAND-CENTER Q8: relocated Sequential [+ Create] entry
                    point (Convention #150 amendment — was Tasks → Sequential tab) */}
                {viewerIsPrimaryParent && (
                  <div className="flex justify-end">
                    <Button variant="secondary" size="sm" onClick={() => setSequentialCreatorOpen(true)}>
                      <Plus size={14} />
                      New Sequential Collection
                    </Button>
                  </div>
                )}
                <SequentialCollectionView
                  familyId={familyId}
                  onCreateCollection={() => setSequentialCreatorOpen(true)}
                  filterMemberId={member.id}
                />
              </div>
            ) : tabTasks.length === 0 ? (
              <EmptyState
                icon={<CheckSquare size={32} />}
                title={`Nothing here for ${firstName}`}
                description={
                  activeTab === 'routines'
                    ? 'No routines deployed to this member yet.'
                    : activeTab === 'opportunities'
                      ? 'No opportunities assigned to this member.'
                      : 'No tasks assigned to this member right now.'
                }
              />
            ) : (
              <div className="space-y-2">
                {tabTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isCompleting={isCompleting(task.id)}
                    onToggle={handleToggle}
                    onEdit={canAct ? (t) => editor.openEditTask(t) : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      </ModalV2>

      {/* Inline full edit modal (founder Q4 — no page hopping) */}
      <TaskEditModal editor={editor} />

      {/* Relocated sequential creation entry point (Q8) */}
      {sequentialCreatorOpen && (
        <SequentialCreatorModal
          isOpen={sequentialCreatorOpen}
          onClose={() => setSequentialCreatorOpen(false)}
          familyId={familyId}
          createdBy={viewerId}
        />
      )}
    </>
  )
}
