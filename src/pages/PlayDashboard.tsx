/**
 * PlayDashboard — Build M Phase 3
 *
 * Purpose-built dashboard for Play members (ages 3-7). Replaces the
 * adult Dashboard that was previously rendering inside PlayShell.
 *
 * Layout (top-down on phone):
 *   1. PlayDashboardHeader    — friendly greeting + 3 stat pills
 *   2. EarningProgressPill    — earning mode counter (Phase 2)
 *   3. PlayStickerBookWidget  — active page thumbnail + creature count
 *   4. ColorRevealWidget      — active coloring reveals (Phase 3)
 *   5. PlayTaskTileGrid       — big tap-to-complete tiles, grouped by segment
 *   6. PlayRevealTileStub     — placeholder for future reveal tiles
 *   7. PlayMomMessageStub     — placeholder for mom messages (PRD-15)
 *
 * Phase 3 adds:
 *   - ColorRevealWidget showing grayscale → color progressive reveal
 *   - ColorRevealDetailModal for full-screen view + print flow
 *   - CompletedBookGallery for finished coloring reveals
 *   - Shimmer animation on widget when a reveal advances
 *   - Completion celebration (ConfettiBurst + SparkleOverlay)
 *
 * NEVER renders emoji or Lucide icons on tiles. All tile imagery comes
 * from platform_assets (category='visual_schedule', variant='B') via
 * usePlayTaskIcons. Header chrome (Star/Flame/Sparkles) is allowed
 * because it's chrome, not tile content.
 */

import { useState, useMemo, useCallback, useRef } from 'react'
import { useTasks, useCompleteTask } from '@/hooks/useTasks'
import { useStickerBookState } from '@/hooks/useStickerBookState'
import { useCreaturesForMember } from '@/hooks/useCreaturesForMember'
import { useGamificationTheme } from '@/hooks/useGamificationTheme'
import { useMemberColoringReveals } from '@/hooks/useColoringReveals'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { PlayDashboardHeader } from '@/components/play-dashboard/PlayDashboardHeader'
import { EarningProgressPill } from '@/components/play-dashboard/EarningProgressPill'
import { PlayStickerBookWidget } from '@/components/play-dashboard/PlayStickerBookWidget'
import { ColorRevealWidget } from '@/components/play-dashboard/ColorRevealWidget'
import { ColorRevealTallyWidget } from '@/components/coloring-reveal/ColorRevealTallyWidget'
import { ColorRevealDetailModal } from '@/components/play-dashboard/ColorRevealDetailModal'
import { CompletedBookGallery } from '@/components/play-dashboard/CompletedBookGallery'
import { PlayTaskTileGrid } from '@/components/play-dashboard/PlayTaskTileGrid'
import { PlayRevealTileStub } from '@/components/play-dashboard/PlayRevealTileStub'
import { PlayMomMessageStub } from '@/components/play-dashboard/PlayMomMessageStub'
import { CreatureRevealModal } from '@/components/play-dashboard/CreatureRevealModal'
import { PageUnlockRevealModal } from '@/components/play-dashboard/PageUnlockRevealModal'
import { StickerBookDetailModal } from '@/components/play-dashboard/StickerBookDetailModal'
import { SparkleOverlay } from '@/components/shared/SparkleOverlay'
import { filterTasksForToday } from '@/lib/tasks/recurringTaskFilter'
import type { Task } from '@/types/tasks'
import type { PlayDashboardProps, RevealEvent, MemberColoringReveal } from '@/types/play-dashboard'
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

  // Adults viewing a kid's dashboard can redraw randomizer activities
  const isAdultViewing = ownMember?.role === 'primary_parent' || ownMember?.role === 'additional_adult'

  // ── Data ────────────────────────────────────────────────────────
  const { data: allTasks = [], isLoading: tasksLoading } = useTasks(familyId, {
    assigneeId: memberId,
  })

  // Filter recurring tasks to only those scheduled for today, then to Play types
  const playTasks = useMemo(
    () =>
      filterTasksForToday(allTasks).filter(
        t =>
          t.task_type === 'task' ||
          t.task_type === 'routine' ||
          t.task_type === 'habit',
      ),
    [allTasks],
  )

  const { data: stickerBookState } = useStickerBookState(memberId)
  const { data: creatures = [] } = useCreaturesForMember(memberId)
  const { data: theme } = useGamificationTheme(stickerBookState?.active_theme_id)
  const { data: coloringReveals = [] } = useMemberColoringReveals(memberId)

  // ── Color reveal modal state (Phase 3) ────────────────────────
  const [colorRevealDetailOpen, setColorRevealDetailOpen] = useState<MemberColoringReveal | null>(null)
  const [colorRevealGalleryOpen, setColorRevealGalleryOpen] = useState(false)
  const [colorRevealCelebration, setColorRevealCelebration] = useState(false)
  const [shimmeringRevealIds, setShimmeringRevealIds] = useState<Set<string>>(new Set())

  // ── Sticker book detail modal state (Sub-phase D) ─────────────
  const [stickerBookOpen, setStickerBookOpen] = useState(false)
  const [stickerBookInitialPageId, setStickerBookInitialPageId] = useState<string | null>(null)

  const openStickerBook = useCallback((pageId?: string | null) => {
    setStickerBookInitialPageId(pageId ?? null)
    setStickerBookOpen(true)
  }, [])

  const closeStickerBook = useCallback(() => {
    setStickerBookOpen(false)
    setStickerBookInitialPageId(null)
  }, [])

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

  // FIFO queue of reveal events. Populated by handleTapTask's onSuccess
  // callback. Sub-phase D renders CreatureRevealModal / PageUnlockRevealModal
  // for the head event; advancing the queue is driven by modal dismiss.
  const [revealQueue, setRevealQueue] = useState<RevealEvent[]>([])

  // Advance the queue: remove the head event (called by modal onClose)
  const advanceRevealQueue = useCallback(() => {
    setRevealQueue(q => q.slice(1))
  }, [])

  // ── Segment celebration state (Phase 2) ────────────────────────
  // Tracks segment IDs that just completed — drives glow animation
  // on the segment banner + SparkleOverlay burst.
  const [celebratingSegmentIds, setCelebratingSegmentIds] = useState<Set<string>>(new Set())
  const [sparkleOrigin, setSparkleOrigin] = useState<{ x: number; y: number } | null>(null)
  const [showSegmentSparkle, setShowSegmentSparkle] = useState(false)

  // Track which segments we've already celebrated to avoid re-firing
  const celebratedSegmentsRef = useRef<Set<string>>(new Set())

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
          const result = data.gamificationResult
          const newEvents: RevealEvent[] = []

          // Phase 2: handle segment completion celebration
          if (result?.segment_completed) {
            const segId = result.segment_completed.segment_id

            // Only celebrate once per segment per session
            if (!celebratedSegmentsRef.current.has(segId)) {
              celebratedSegmentsRef.current.add(segId)

              // Add glow animation to the segment banner
              setCelebratingSegmentIds(prev => new Set(prev).add(segId))

              // Fire SparkleOverlay centered on the viewport
              setSparkleOrigin({ x: window.innerWidth / 2, y: window.innerHeight / 3 })
              setShowSegmentSparkle(true)

              // Clear the celebrating state after the glow animation
              setTimeout(() => {
                setCelebratingSegmentIds(prev => {
                  const next = new Set(prev)
                  next.delete(segId)
                  return next
                })
              }, 1200)
            }
          }

          // Phase 3: handle color reveal advancement
          if (result?.coloring_reveals_advanced && result.coloring_reveals_advanced.length > 0) {
            const advancedIds = new Set<string>()
            let anyComplete = false

            for (const cr of result.coloring_reveals_advanced) {
              advancedIds.add(cr.reveal_id)
              if (cr.is_complete) anyComplete = true
            }

            // Trigger shimmer animation on the widget
            setShimmeringRevealIds(advancedIds)
            setTimeout(() => setShimmeringRevealIds(new Set()), 600)

            // If a reveal just completed, open detail modal with celebration
            if (anyComplete) {
              const completedCr = result.coloring_reveals_advanced.find(cr => cr.is_complete)
              if (completedCr) {
                // Find the matching reveal from our local data (will be updated after invalidation)
                const matchingReveal = coloringReveals.find(r => r.id === completedCr.reveal_id)
                if (matchingReveal) {
                  setColorRevealCelebration(true)
                  setColorRevealDetailOpen({
                    ...matchingReveal,
                    is_complete: true,
                    current_step: completedCr.total_steps,
                  })
                }
              }
            }
          }

          if (gamificationDidAwardCreature(result)) {
            newEvents.push({
              type: 'creature_awarded',
              creatureId: result.creature.id,
              creatureName: result.creature.display_name,
              rarity: result.creature.rarity,
              stickerPageId: stickerBookState?.active_page_id ?? null,
              creatureImageUrl: result.creature.image_url ?? null,
              creatureDescription: result.creature.description ?? null,
            })
          }

          if (gamificationDidUnlockPage(result)) {
            newEvents.push({
              type: 'page_unlocked',
              pageId: result.page.id,
              pageName: result.page.display_name,
              sceneName: result.page.scene ?? result.page.display_name,
              pageImageUrl: result.page.image_url ?? null,
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

  // Head of the reveal queue drives the current modal
  const currentReveal = revealQueue[0] ?? null

  // Handler for PageUnlockRevealModal "See my new page!" — dismiss
  // the reveal modal and open the sticker book to the new page.
  const handleViewNewPage = useCallback(() => {
    if (currentReveal?.type === 'page_unlocked') {
      openStickerBook(currentReveal.pageId)
    }
    advanceRevealQueue()
  }, [currentReveal, openStickerBook, advanceRevealQueue])

  const handleSegmentSparkleComplete = useCallback(() => {
    setShowSegmentSparkle(false)
    setSparkleOrigin(null)
  }, [])

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

      <EarningProgressPill
        stickerBookState={stickerBookState ?? null}
        tasks={playTasks}
      />

      <PlayStickerBookWidget
        state={stickerBookState ?? null}
        creatureCount={creatures.length}
        hasNewActivity={revealQueue.length > 0}
        onOpen={() => openStickerBook()}
      />

      {/* Task-linked coloring reveals — "I did it!" tally widgets */}
      {coloringReveals
        .filter(r => r.earning_task_id && !r.is_complete && r.is_active)
        .map(reveal => (
          <ColorRevealTallyWidget
            key={reveal.id}
            reveal={reveal}
            linkedTask={allTasks.find(t => t.id === reveal.earning_task_id)}
            memberId={memberId}
            isShimmering={shimmeringRevealIds.has(reveal.id)}
          />
        ))
      }

      {/* Non-task-linked coloring reveals — original gallery widget */}
      <ColorRevealWidget
        reveals={coloringReveals.filter(r => !r.earning_task_id)}
        onOpenReveal={reveal => {
          setColorRevealCelebration(false)
          setColorRevealDetailOpen(reveal)
        }}
        onOpenGallery={() => setColorRevealGalleryOpen(true)}
        shimmeringRevealIds={shimmeringRevealIds}
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
          memberId={memberId}
          celebratingSegmentIds={celebratingSegmentIds}
          isAdultViewing={isAdultViewing}
        />
      )}

      <PlayRevealTileStub />
      <PlayMomMessageStub />

      {/* ── Segment celebration sparkle (Phase 2) ─────────────────── */}
      {showSegmentSparkle && sparkleOrigin && (
        <SparkleOverlay
          type="quick_burst"
          origin={sparkleOrigin}
          onComplete={handleSegmentSparkleComplete}
        />
      )}

      {/* ── Reveal modals (Sub-phase D) ──────────────────────────── */}
      {currentReveal?.type === 'creature_awarded' && (
        <CreatureRevealModal
          creatureName={currentReveal.creatureName}
          rarity={currentReveal.rarity}
          creatureImageUrl={currentReveal.creatureImageUrl}
          creatureDescription={currentReveal.creatureDescription}
          videoUrl={theme?.creature_reveal_video_url ?? null}
          onClose={advanceRevealQueue}
        />
      )}

      {currentReveal?.type === 'page_unlocked' && (
        <PageUnlockRevealModal
          pageName={currentReveal.pageName}
          sceneName={currentReveal.sceneName}
          pageImageUrl={currentReveal.pageImageUrl}
          videoUrl={theme?.page_reveal_video_url ?? null}
          onClose={advanceRevealQueue}
          onViewPage={handleViewNewPage}
        />
      )}

      {/* ── Sticker Book Detail Modal ────────────────────────────── */}
      {stickerBookOpen && stickerBookState && (
        <StickerBookDetailModal
          state={stickerBookState}
          memberId={memberId}
          onClose={closeStickerBook}
          initialPageId={stickerBookInitialPageId}
        />
      )}

      {/* ── Color Reveal Detail Modal (Phase 3) ─────────────────── */}
      {colorRevealDetailOpen && (
        <ColorRevealDetailModal
          reveal={colorRevealDetailOpen}
          onClose={() => {
            setColorRevealDetailOpen(null)
            setColorRevealCelebration(false)
          }}
          showCompletionCelebration={colorRevealCelebration}
        />
      )}

      {/* ── Completed Book Gallery (Phase 3) ─────────────────────── */}
      {colorRevealGalleryOpen && (
        <CompletedBookGallery
          reveals={coloringReveals}
          onClose={() => setColorRevealGalleryOpen(false)}
          onOpenReveal={reveal => {
            setColorRevealGalleryOpen(false)
            setColorRevealCelebration(false)
            setColorRevealDetailOpen(reveal)
          }}
        />
      )}
    </div>
  )
}
