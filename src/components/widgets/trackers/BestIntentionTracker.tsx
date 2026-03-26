// PRD-06 + PRD-10: Best Intention tracker widget for dashboard
// Compact card showing a single intention with celebrate button
// Uses existing hooks: useBestIntentions, useTodaysIterations, useLogIteration

import { useState, useRef, useCallback } from 'react'
import { Check, Sparkles } from 'lucide-react'
import type { DashboardWidget } from '@/types/widgets'
import { useBestIntentions, useTodaysIterations, useLogIteration } from '@/hooks/useBestIntentions'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { SparkleOverlay } from '@/components/shared/SparkleOverlay'

interface BestIntentionTrackerProps {
  widget: DashboardWidget
  isCompact?: boolean
}

export function BestIntentionTracker({ widget, isCompact }: BestIntentionTrackerProps) {
  const { data: member } = useFamilyMember()
  const memberId = widget.assigned_member_id ?? member?.id
  const intentionId = (widget.widget_config as Record<string, string>)?.intention_id

  const { data: intentions } = useBestIntentions(memberId)
  // If a specific intention_id is set, use it; otherwise use the first active one
  const intention = intentionId
    ? intentions?.find(i => i.id === intentionId)
    : intentions?.find(i => i.is_active)

  const { data: todayCount = 0 } = useTodaysIterations(intention?.id)
  const logIteration = useLogIteration()

  const [sparkle, setSparkle] = useState<{ x: number; y: number } | null>(null)
  const lastTapRef = useRef(0)
  const btnRef = useRef<HTMLButtonElement>(null)

  const handleCelebrate = useCallback(() => {
    if (!intention || !member) return

    logIteration.mutate({
      intentionId: intention.id,
      familyId: widget.family_id,
      memberId: member.id,
    })

    // Debounce sparkle animation (500ms)
    const now = Date.now()
    if (now - lastTapRef.current >= 500 && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setSparkle({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
    }
    lastTapRef.current = now
  }, [intention, member, widget.family_id, logIteration])

  if (!intention) {
    return (
      <div className="flex items-center justify-center h-full text-sm"
        style={{ color: 'var(--color-text-tertiary)' }}>
        No active intention
      </div>
    )
  }

  if (isCompact) {
    // Small size: just the celebrate button + count
    return (
      <div className="flex items-center gap-2 h-full">
        <button
          ref={btnRef}
          onClick={(e) => { e.stopPropagation(); handleCelebrate() }}
          className="flex items-center justify-center rounded-full transition-transform active:scale-90 shrink-0"
          style={{
            width: 36, height: 36, minWidth: 36,
            backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, transparent)',
            border: '2px solid var(--color-btn-primary-bg)',
            color: 'var(--color-btn-primary-bg)',
          }}
          title="Celebrate"
        >
          <Check size={18} strokeWidth={3} />
        </button>
        {todayCount > 0 && (
          <span className="text-lg font-bold" style={{ color: 'var(--color-btn-primary-bg)' }}>
            {todayCount}
          </span>
        )}
        {sparkle && <SparkleOverlay type="quick_burst" origin={sparkle} onComplete={() => setSparkle(null)} />}
      </div>
    )
  }

  // Medium/Large: statement + celebrate button + today badge
  return (
    <div className="flex flex-col gap-2 h-full" onClick={(e) => e.stopPropagation()}>
      {/* Statement */}
      <p className="text-sm leading-snug line-clamp-3"
        style={{ color: 'var(--color-text-secondary)' }}>
        {intention.statement}
      </p>

      {/* Celebrate row */}
      <div className="flex items-center gap-3 mt-auto">
        <button
          ref={btnRef}
          onClick={handleCelebrate}
          className="flex items-center justify-center rounded-full transition-transform active:scale-90 shrink-0"
          style={{
            width: 44, height: 44, minWidth: 44,
            backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, transparent)',
            border: '2px solid var(--color-btn-primary-bg)',
            color: 'var(--color-btn-primary-bg)',
          }}
          title="Celebrate this intention"
        >
          <Check size={22} strokeWidth={3} />
        </button>

        {todayCount > 0 && (
          <span className="px-2 py-0.5 rounded-full text-xs font-semibold"
            style={{
              background: 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)',
              color: 'var(--color-btn-primary-bg)',
            }}>
            {todayCount} today
          </span>
        )}

        {/* All-time count */}
        <span className="text-xs ml-auto" style={{ color: 'var(--color-text-tertiary)' }}>
          <Sparkles size={10} className="inline mr-0.5" />
          {intention.iteration_count} total
        </span>
      </div>

      {sparkle && <SparkleOverlay type="quick_burst" origin={sparkle} onComplete={() => setSparkle(null)} />}
    </div>
  )
}
