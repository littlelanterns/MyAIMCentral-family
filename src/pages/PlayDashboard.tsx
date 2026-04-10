/**
 * PlayDashboard — Build M Sub-phase C
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
 * Sub-phase C wires useCompleteTask to the gamification pipeline RPC
 * (roll_creature_for_completion). The result flows back via the
 * mutation's onSuccess callback, and creature/page unlock events are
 * pushed onto a local FIFO queue that renders as inline placeholder
 * banners (auto-dismissing after 2s).
 *
 * Sub-phase D will replace the inline placeholders with full reveal
 * modals (CreatureRevealModal + PageUnlockRevealModal) that play the
 * Woodland Felt Mossy Chest + Fairy Door videos.
 *
 * NEVER renders emoji or Lucide icons on tiles. All tile imagery comes
 * from platform_assets (category='visual_schedule', variant='B') via
 * usePlayTaskIcons. Header chrome (Star/Flame/Sparkles) is allowed
 * because it's chrome, not tile content.
 */

import { useState, useMemo, useEffect } from 'react'
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
import {
  gamificationDidAwardCreature,
  gamificationDidUnlockPage,
} from '@/types/gamification'

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

  // ── Task completion (Sub-phase C wires gamification RPC) ───────
  const completeTask = useCompleteTask()
  const [completingTaskIds, setCompletingTaskIds] = useState<Set<string>>(
    new Set(),
  )

  // Sub-phase C: real FIFO queue of reveal events. Populated by
  // handleTapTask's onSuccess callback; rendered as inline placeholder
  // banners that auto-dismiss after 2s (Sub-phase D replaces with
  // CreatureRevealModal + PageUnlockRevealModal).
  const [revealQueue, setRevealQueue] = useState<RevealEvent[]>([])

  // Auto-dismiss the head of the queue after 2s so placeholders don't
  // pile up during rapid task completions in demos.
  useEffect(() => {
    if (revealQueue.length === 0) return
    const timer = setTimeout(() => {
      setRevealQueue(q => q.slice(1))
    }, 2000)
    return () => clearTimeout(timer)
  }, [revealQueue])

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
        onSuccess: data => {
          // Sub-phase C: read the gamification pipeline result and push
          // reveal events onto the queue. All RPC branches land here;
          // the type guards filter out the non-award outcomes (disabled,
          // already_processed, skipped_completion_type, roll failed).
          const result = data.gamificationResult
          const newEvents: RevealEvent[] = []

          if (gamificationDidAwardCreature(result)) {
            newEvents.push({
              type: 'creature_awarded',
              creatureId: result.creature.id,
              creatureName: result.creature.display_name,
              rarity: result.creature.rarity,
              stickerPageId: stickerBookState?.active_page_id ?? null,
            })
          }

          if (gamificationDidUnlockPage(result)) {
            newEvents.push({
              type: 'page_unlocked',
              pageId: result.page.id,
              pageName: result.page.display_name,
              sceneName: result.page.scene ?? result.page.display_name,
            })
          }

          if (newEvents.length > 0) {
            setRevealQueue(q => [...q, ...newEvents])
          }
        },
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

  // Sub-phase C placeholder banner — renders the head of the reveal
  // queue inline. Sub-phase D will replace this with full-screen modals
  // that play the Mossy Chest + Fairy Door videos.
  const currentReveal = revealQueue[0] ?? null

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

      {/* Sub-phase C placeholder reveal banner — replaced in Sub-phase D */}
      {currentReveal && (
        <div
          role="status"
          aria-live="polite"
          data-testid="play-reveal-banner"
          data-reveal-type={currentReveal.type}
          style={{
            padding: '1rem 1.25rem',
            borderRadius: 'var(--vibe-radius-card, 1rem)',
            backgroundColor: 'var(--color-bg-card-highlight, var(--color-bg-card))',
            border: '2px solid var(--color-border-accent, var(--color-btn-primary-bg))',
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-lg)',
            fontWeight: 600,
            textAlign: 'center',
            transition: 'opacity 0.2s',
          }}
        >
          {currentReveal.type === 'creature_awarded' ? (
            <>
              <div style={{ fontSize: 'var(--font-size-xl)', marginBottom: '0.25rem' }}>
                New friend! {currentReveal.creatureName}
              </div>
              <div
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                  fontWeight: 400,
                }}
              >
                Rarity: {currentReveal.rarity} • (Sub-phase D reveal modal coming)
              </div>
            </>
          ) : (
            <>
              <div style={{ fontSize: 'var(--font-size-xl)', marginBottom: '0.25rem' }}>
                New page unlocked: {currentReveal.pageName}!
              </div>
              <div
                style={{
                  fontSize: 'var(--font-size-sm)',
                  color: 'var(--color-text-secondary)',
                  fontWeight: 400,
                }}
              >
                (Sub-phase D reveal modal coming)
              </div>
            </>
          )}
        </div>
      )}

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
