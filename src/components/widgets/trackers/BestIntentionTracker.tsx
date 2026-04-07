// PRD-06 + PRD-10: Best Intention tracker widget for dashboard
// Shows ALL active intentions with colored dots, today counts, celebrate buttons,
// mini sparklines (7-day trend), and drag-to-reorder (persists sort_order).

import { useState, useRef, useCallback, useMemo } from 'react'
import { Check, GripVertical } from 'lucide-react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { DashboardWidget } from '@/types/widgets'
import {
  useBestIntentions,
  useTodaysIterations,
  useLogIteration,
  useReorderIntentions,
  useAllIntentionIterations,
  INTENTION_COLORS,
} from '@/hooks/useBestIntentions'
import type { BestIntention } from '@/hooks/useBestIntentions'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { SparkleOverlay } from '@/components/shared/SparkleOverlay'
import { todayLocalIso, localIso } from '@/utils/dates'

// ---- Mini Sparkline (7-day trend, pure SVG) ----

function MiniSparkline({
  data,
  color,
  width = 40,
  height = 16,
}: {
  data: number[]
  color: string
  width?: number
  height?: number
}) {
  if (data.length < 2) {
    return (
      <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
        <line
          x1={0} y1={height / 2} x2={width} y2={height / 2}
          stroke={color} strokeWidth={1.5} strokeOpacity={0.3}
        />
      </svg>
    )
  }

  const max = Math.max(...data, 1)
  const padding = 1
  const innerW = width - padding * 2
  const innerH = height - padding * 2

  const points = data.map((v, i) => {
    const x = padding + (i / (data.length - 1)) * innerW
    const y = padding + innerH - (v / max) * innerH
    return `${x},${y}`
  })

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

// ---- Sortable intention row with celebrate ----

function SortableIntentionRow({
  intention,
  familyId,
  compact,
  sparklineData,
}: {
  intention: BestIntention
  familyId: string
  compact: boolean
  sparklineData?: number[]
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: intention.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  const { data: member } = useFamilyMember()
  const { data: todayCount = 0 } = useTodaysIterations(intention.id)
  const logIteration = useLogIteration()

  const [sparkle, setSparkle] = useState<{ x: number; y: number } | null>(null)
  const lastTapRef = useRef(0)
  const btnRef = useRef<HTMLButtonElement>(null)

  const color = intention.color ?? INTENTION_COLORS[0]

  const handleCelebrate = useCallback(() => {
    if (!member) return
    logIteration.mutate({
      intentionId: intention.id,
      familyId,
      memberId: member.id,
    })

    const now = Date.now()
    if (now - lastTapRef.current >= 500 && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setSparkle({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 })
    }
    lastTapRef.current = now
  }, [intention.id, familyId, member, logIteration])

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 min-h-[28px]"
    >
      {/* Drag handle */}
      {!compact && (
        <button
          {...attributes}
          {...listeners}
          className="p-0.5 rounded cursor-grab active:cursor-grabbing shrink-0 touch-none"
          style={{ color: 'var(--color-text-tertiary)' }}
          aria-label="Drag to reorder"
        >
          <GripVertical size={14} />
        </button>
      )}

      {/* Color dot */}
      <span
        className="w-2.5 h-2.5 rounded-full shrink-0"
        style={{ backgroundColor: color }}
      />

      {/* Statement (truncated) */}
      <span
        className="flex-1 text-xs leading-tight truncate"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {intention.statement}
      </span>

      {/* Sparkline — only for non-compact */}
      {!compact && sparklineData && (
        <MiniSparkline data={sparklineData} color={color} />
      )}

      {/* Today count */}
      {todayCount > 0 && (
        <span
          className="text-[10px] font-bold shrink-0 tabular-nums"
          style={{ color }}
        >
          {todayCount}
        </span>
      )}

      {/* Celebrate button */}
      <button
        ref={btnRef}
        onClick={(e) => { e.stopPropagation(); handleCelebrate() }}
        className="flex items-center justify-center rounded-full transition-transform active:scale-90 shrink-0"
        style={{
          width: compact ? 24 : 28,
          height: compact ? 24 : 28,
          minWidth: compact ? 24 : 28,
          backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)`,
          border: `1.5px solid ${color}`,
          color,
        }}
        title="Celebrate"
      >
        <Check size={compact ? 12 : 14} strokeWidth={3} />
      </button>

      {sparkle && (
        <SparkleOverlay type="quick_burst" origin={sparkle} onComplete={() => setSparkle(null)} />
      )}
    </div>
  )
}

// ---- Main Widget ----

interface BestIntentionTrackerProps {
  widget: DashboardWidget
  isCompact?: boolean
}

export function BestIntentionTracker({ widget, isCompact }: BestIntentionTrackerProps) {
  const { data: member } = useFamilyMember()
  const memberId = widget.assigned_member_id ?? member?.id

  const { data: intentions = [] } = useBestIntentions(memberId)
  const reorderIntentions = useReorderIntentions()
  const activeIntentions = useMemo(
    () => intentions.filter((i) => i.is_active),
    [intentions],
  )

  // Drag sensors — activate after 5px movement to allow clicks
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
  )

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = activeIntentions.findIndex((i) => i.id === active.id)
    const newIndex = activeIntentions.findIndex((i) => i.id === over.id)
    if (oldIndex === -1 || newIndex === -1) return

    const reordered = arrayMove(activeIntentions, oldIndex, newIndex)
    reorderIntentions.mutate(
      reordered.map((item, idx) => ({ id: item.id, sort_order: idx })),
    )
  }, [activeIntentions, reorderIntentions])

  // Sparkline data: last 7 days of iterations for all active intentions
  const sevenDaysAgo = useMemo(() => {
    const d = new Date()
    d.setDate(d.getDate() - 6)
    return localIso(d)
  }, [])
  const today = useMemo(() => todayLocalIso(), [])

  const intentionIds = useMemo(
    () => activeIntentions.map((i) => i.id),
    [activeIntentions],
  )

  const { data: recentIterations = [] } = useAllIntentionIterations(
    memberId,
    intentionIds,
    { start: sevenDaysAgo, end: today },
  )

  // Build sparkline data per intention: array of 7 numbers (one per day)
  const sparklineMap = useMemo(() => {
    const map = new Map<string, number[]>()
    const dates: string[] = []
    const cur = new Date(sevenDaysAgo + 'T00:00:00')
    for (let i = 0; i < 7; i++) {
      dates.push(localIso(cur))
      cur.setDate(cur.getDate() + 1)
    }

    const grouped = new Map<string, Map<string, number>>()
    for (const iter of recentIterations) {
      if (!grouped.has(iter.intention_id)) grouped.set(iter.intention_id, new Map())
      const dayMap = grouped.get(iter.intention_id)!
      dayMap.set(iter.day_date, (dayMap.get(iter.day_date) ?? 0) + 1)
    }

    for (const id of intentionIds) {
      const dayMap = grouped.get(id)
      map.set(id, dates.map((d) => dayMap?.get(d) ?? 0))
    }
    return map
  }, [recentIterations, intentionIds, sevenDaysAgo])

  if (activeIntentions.length === 0) {
    return (
      <div
        className="flex items-center justify-center h-full text-xs"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        No active intentions
      </div>
    )
  }

  const compact = isCompact ?? (widget.size === 'small')
  const maxShow = compact ? 3 : activeIntentions.length
  const visible = activeIntentions.slice(0, maxShow)
  const overflowCount = activeIntentions.length - maxShow

  return (
    <div
      className="flex flex-col gap-1.5 h-full overflow-hidden"
      onClick={(e) => e.stopPropagation()}
    >
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext
          items={visible.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {visible.map((intention) => (
            <SortableIntentionRow
              key={intention.id}
              intention={intention}
              familyId={widget.family_id}
              compact={compact}
              sparklineData={compact ? undefined : sparklineMap.get(intention.id)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {overflowCount > 0 && (
        <span
          className="text-[10px] text-center"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          +{overflowCount} more
        </span>
      )}
    </div>
  )
}
