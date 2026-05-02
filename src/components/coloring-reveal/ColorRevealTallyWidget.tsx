/**
 * ColorRevealTallyWidget — Build M Phase 5
 *
 * Dashboard widget for 1:1 task-linked coloring reveals.
 * Renders the grayscale→color reveal image with an "I did it!" button.
 * Each tap completes the linked task → gamification RPC fires → reveal advances.
 *
 * Founder decisions #9-#11:
 *   - Each coloring picture is linked to ONE source via earning_source_type/earning_source_id
 *   - Each completion = one reveal step (visual tally counter)
 *   - Widget shows: image + task name + "I did it!" + progress
 *   - When complete: celebration + "Print it!" button
 *
 * Works across all shells where gamification is enabled (Play, Guided,
 * Independent, Adult — decision #7).
 */

import { useState, useCallback } from 'react'
import { Palette, CheckCircle2, Printer, Sparkles } from 'lucide-react'
import { ColorRevealCanvas } from '@/components/play-dashboard/ColorRevealCanvas'
import { useCompleteTask } from '@/hooks/useTasks'
import { useUpdateColoringReveal } from '@/hooks/useColoringReveals'
import { todayLocalIso } from '@/utils/dates'
import type { MemberColoringReveal } from '@/types/play-dashboard'
import type { Task } from '@/types/tasks'

interface ColorRevealTallyWidgetProps {
  reveal: MemberColoringReveal
  /** The linked task (pre-fetched by the parent) */
  linkedTask: Task | undefined
  memberId: string
  /** Shimmer animation when a step just advanced */
  isShimmering?: boolean
  /** Callback after completion so parent can refresh */
  onCompleted?: () => void
}

export function ColorRevealTallyWidget({
  reveal,
  linkedTask,
  memberId,
  isShimmering,
  onCompleted,
}: ColorRevealTallyWidgetProps) {
  const completeTask = useCompleteTask()
  const updateReveal = useUpdateColoringReveal(memberId)
  const [isAnimating, setIsAnimating] = useState(false)

  const slug = reveal.coloring_image?.slug
  const zones = reveal.coloring_image?.color_zones ?? []
  const totalSteps = reveal.reveal_step_count
  const currentStep = reveal.current_step
  const isComplete = reveal.is_complete
  const taskTitle = linkedTask?.title ?? 'Linked task'
  const progressPct = totalSteps > 0 ? Math.round((currentStep / totalSteps) * 100) : 0

  const handleDidIt = useCallback(async () => {
    if (!linkedTask || isAnimating || isComplete) return

    setIsAnimating(true)
    try {
      await completeTask.mutateAsync({
        taskId: linkedTask.id,
        memberId,
        periodDate: todayLocalIso(),
      })
      onCompleted?.()
    } catch {
      // Gamification is additive — task might still have completed
    }
    setTimeout(() => setIsAnimating(false), 800)
  }, [linkedTask, memberId, isAnimating, isComplete, completeTask, onCompleted])

  const handlePrint = useCallback(() => {
    updateReveal.mutate({
      revealId: reveal.id,
      printed_at: new Date().toISOString(),
    })
    // Open print dialog (basic browser print of the colored image)
    window.print()
  }, [reveal.id, updateReveal])

  if (!slug) return null

  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.75rem',
        padding: '1rem',
        borderRadius: 'var(--vibe-radius-card, 1rem)',
        backgroundColor: 'var(--color-bg-card)',
        border: '2px solid var(--color-border)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Palette size={18} style={{ color: 'var(--color-btn-primary-bg)', flexShrink: 0 }} aria-hidden="true" />
        <span
          style={{
            flex: 1,
            fontSize: 'var(--font-size-sm)',
            fontWeight: 700,
            color: 'var(--color-text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {reveal.coloring_image?.display_name ?? 'My Coloring Picture'}
        </span>
        <span
          style={{
            fontSize: 'var(--font-size-xs)',
            fontWeight: 500,
            color: isComplete ? 'var(--color-accent-warm)' : 'var(--color-text-secondary)',
          }}
        >
          {isComplete ? 'Complete!' : `Step ${currentStep}/${totalSteps}`}
        </span>
      </div>

      {/* Image */}
      <ColorRevealCanvas
        slug={slug}
        zones={zones}
        revealedZoneIds={reveal.revealed_zone_ids ?? []}
        className={isShimmering || isAnimating ? 'color-reveal-shimmer' : undefined}
      />

      {/* Progress bar */}
      <div
        style={{
          width: '100%',
          height: '6px',
          borderRadius: '9999px',
          backgroundColor: 'var(--color-bg-secondary)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${progressPct}%`,
            height: '100%',
            borderRadius: '9999px',
            background: isComplete
              ? 'var(--color-accent-warm)'
              : 'var(--surface-primary, var(--color-btn-primary-bg))',
            transition: 'width 0.6s ease-out',
          }}
        />
      </div>

      {/* Task name label */}
      <div
        style={{
          fontSize: 'var(--font-size-xs)',
          color: 'var(--color-text-secondary)',
          textAlign: 'center',
        }}
      >
        {taskTitle}
      </div>

      {/* Action button */}
      {isComplete ? (
        <button
          type="button"
          onClick={handlePrint}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.75rem',
            borderRadius: 'var(--vibe-radius-input, 0.5rem)',
            border: '2px solid var(--color-accent-warm)',
            background: 'color-mix(in srgb, var(--color-accent-warm) 10%, var(--color-bg-card))',
            color: 'var(--color-accent-warm)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 700,
            cursor: 'pointer',
          }}
        >
          <Sparkles size={16} />
          All Done!
          <Printer size={16} />
          Print it!
        </button>
      ) : (
        <button
          type="button"
          onClick={handleDidIt}
          disabled={isAnimating || !linkedTask}
          style={{
            width: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem',
            padding: '0.75rem',
            borderRadius: 'var(--vibe-radius-input, 0.5rem)',
            border: 'none',
            background: isAnimating
              ? 'color-mix(in srgb, var(--color-accent-warm) 20%, var(--color-bg-card))'
              : 'var(--surface-primary, var(--color-btn-primary-bg))',
            color: isAnimating
              ? 'var(--color-accent-warm)'
              : 'var(--color-btn-primary-text, #fff)',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 700,
            cursor: isAnimating || !linkedTask ? 'not-allowed' : 'pointer',
            opacity: !linkedTask ? 0.5 : 1,
            transition: 'all 0.3s ease',
            transform: isAnimating ? 'scale(1.05)' : 'scale(1)',
          }}
        >
          {isAnimating ? (
            <>
              <CheckCircle2 size={18} />
              Great job!
            </>
          ) : (
            <>
              <CheckCircle2 size={18} />
              I did it!
            </>
          )}
        </button>
      )}
    </div>
  )
}
