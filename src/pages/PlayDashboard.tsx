/**
 * PlayDashboard — Build M Sub-phase B
 *
 * Purpose-built dashboard for Play members (ages 3-7). Replaces the
 * adult Dashboard that was previously rendering inside PlayShell.
 *
 * Layout (top-down on phone):
 *   1. PlayDashboardHeader   — friendly greeting + 3 stat pills
 *   2. PlayStickerBookWidget — active page thumbnail + creature count
 *   3. PlayTaskTileGrid      — big tap-to-complete tiles, paper-craft icons
 *   4. PlayRevealTileStub    — placeholder for future reveal tiles
 *   5. PlayMomMessageStub    — placeholder for mom messages (PRD-15)
 *
 * Sub-phase B uses useCompleteTask UNMODIFIED — Sub-phase C wires the
 * gamification RPC into the completion flow. The local modal queue
 * here is in place but never receives events until Sub-phase D pushes
 * creature/page reveals onto it.
 *
 * NEVER renders emoji or Lucide icons on tiles. All tile imagery comes
 * from platform_assets (category='visual_schedule', variant='B') via
 * usePlayTaskIcons. Header chrome (Star/Flame/Sparkles) is allowed
 * because it's chrome, not tile content.
 */

import { useState, useMemo } from 'react'
import { useTasks, useCompleteTask } from '@/hooks/useTasks'
import { useStickerBookState } from '@/hooks/useStickerBookState'
import { useCreaturesForMember } from '@/hooks/useCreaturesForMember'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { PlayDashboardHeader } from '@/components/play-dashboard/PlayDashboardHeader'
import { PlayStickerBookWidget } from '@/components/play-dashboard/PlayStickerBookWidget'
import { PlayTaskTileGrid } from '@/components/play-dashboard/PlayTaskTileGrid'
import { PlayRevealTileStub } from '@/components/play-dashboard/PlayRevealTileStub'
import { PlayMomMessageStub } from '@/components/play-dashboard/PlayMomMessageStub'
import type { Task } from '@/types/tasks'
import type { PlayDashboardProps, RevealEvent } from '@/types/play-dashboard'

export function PlayDashboard({ memberId, familyId, isViewAsOverlay }: PlayDashboardProps) {
  const { viewingAsMember } = useViewAs()
  const { data: ownMember } = useFamilyMember()

  // When inside View As, prefer the viewed member; otherwise the
  // member resolved by useFamilyMember (the logged-in user).
  const displayMember =
    isViewAsOverlay && viewingAsMember ? viewingAsMember : ownMember

  // ── Data ────────────────────────────────────────────────────────
  const { data: allTasks = [], isLoading: tasksLoading } = useTasks(familyId, {
    assigneeId: memberId,
  })

  // Filter to active task types Play kids actually see
  const playTasks = useMemo(
    () =>
      allTasks.filter(
        t =>
          t.task_type === 'task' ||
          t.task_type === 'routine' ||
          t.task_type === 'habit',
      ),
    [allTasks],
  )

  const { data: stickerBookState } = useStickerBookState(memberId)
  const { data: creatures = [] } = useCreaturesForMember(memberId)

  // ── Gamification stats (read from family_members; written by Sub-phase C) ──
  const memberData = displayMember as Record<string, unknown> | undefined
  const points = (memberData?.gamification_points as number) ?? 0
  const streak = (memberData?.current_streak as number) ?? 0
  const memberName = (memberData?.display_name as string) ?? 'Friend'

  // ── Task completion (Sub-phase B uses unmodified hook) ─────────
  const completeTask = useCompleteTask()
  const [completingTaskIds, setCompletingTaskIds] = useState<Set<string>>(
    new Set(),
  )

  // Sub-phase D will push events onto this queue from completeTask.onSuccess
  const [, setRevealQueue] = useState<RevealEvent[]>([])
  // Suppress unused-import warning during Sub-phase B; queue infra is in
  // place so Sub-phase D can wire pushes without re-architecting.
  void setRevealQueue

  function handleTapTask(task: Task) {
    if (completingTaskIds.has(task.id)) return
    setCompletingTaskIds(prev => new Set(prev).add(task.id))

    completeTask.mutate(
      {
        taskId: task.id,
        memberId,
        requireApproval: task.require_approval,
      },
      {
        onSettled: () => {
          setCompletingTaskIds(prev => {
            const next = new Set(prev)
            next.delete(task.id)
            return next
          })
        },
      },
    )
  }

  // ── Render ──────────────────────────────────────────────────────
  return (
    <div
      className="density-comfortable max-w-2xl mx-auto"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        padding: '0.5rem 0 2rem 0',
      }}
    >
      <PlayDashboardHeader
        memberName={memberName}
        points={points}
        streak={streak}
        creatureCount={creatures.length}
        currencyName="stars"
      />

      <PlayStickerBookWidget
        state={stickerBookState ?? null}
        creatureCount={creatures.length}
        hasNewActivity={false}
      />

      {tasksLoading ? (
        <div
          style={{
            padding: '2rem 1rem',
            textAlign: 'center',
            borderRadius: 'var(--vibe-radius-card, 1rem)',
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-secondary)',
            fontSize: 'var(--font-size-sm)',
          }}
        >
          Loading your tasks…
        </div>
      ) : (
        <PlayTaskTileGrid
          tasks={playTasks}
          completingTaskIds={completingTaskIds}
          onTapTask={handleTapTask}
        />
      )}

      <PlayRevealTileStub />
      <PlayMomMessageStub />
    </div>
  )
}
