import { useState, useRef, useCallback, useMemo, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Target, Plus, Pencil, Archive, Heart, HeartOff, Sparkles, Check, RotateCcw, ToggleLeft, ToggleRight, BarChart3, Trash2, LayoutDashboard } from 'lucide-react'
import { FeatureIcon, BulkAddWithAI, CollapsibleGroup, SparkleOverlay, Badge, Tooltip, TrackerAnalyticsView } from '@/components/shared'
import type { TrackerAnalyticsDataSeries } from '@/components/shared'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { useWidgets, useCreateWidget } from '@/hooks/useWidgets'
import { MEMBER_COLORS } from '@/config/member_colors'
import {
  useBestIntentions,
  useArchivedIntentions,
  useCreateBestIntention,
  useUpdateBestIntention,
  useToggleIntentionActive,
  useToggleIntentionAI,
  useArchiveIntention,
  useRestoreIntention,
  useDeleteIntention,
  useLogIteration,
  useTodaysIterations,
  useUpdateIntentionColor,
  useAllIntentionIterations,
  INTENTION_COLORS,
} from '@/hooks/useBestIntentions'
import type { BestIntention } from '@/hooks/useBestIntentions'

// ---- Celebrate Button with today's count & sparkle ----

function CelebrateButton({
  intention,
  familyId,
  memberId,
}: {
  intention: BestIntention
  familyId: string
  memberId: string
}) {
  const logIteration = useLogIteration()
  const { data: todayCount = 0 } = useTodaysIterations(intention.id)
  const [sparkle, setSparkle] = useState<{ x: number; y: number } | null>(null)
  const lastTapRef = useRef(0)
  const btnRef = useRef<HTMLButtonElement>(null)

  const handleCelebrate = useCallback(() => {
    // ALWAYS log the iteration — every tap is an append-only record
    logIteration.mutate({
      intentionId: intention.id,
      familyId,
      memberId,
    })

    // Debounce only the animation to avoid visual spam
    const now = Date.now()
    if (now - lastTapRef.current >= 500 && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect()
      setSparkle({
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
      })
    }
    lastTapRef.current = now
  }, [intention.id, familyId, memberId, logIteration])

  return (
    <div className="flex items-center gap-2">
      <Tooltip content="Celebrate this intention">
      <button
        ref={btnRef}
        onClick={handleCelebrate}
        className="flex items-center justify-center rounded-full transition-transform active:scale-90"
        style={{
          width: 48,
          height: 48,
          minWidth: 48,
          backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, transparent)',
          border: '2px solid var(--color-btn-primary-bg)',
          color: 'var(--color-btn-primary-bg)',
        }}
        aria-label={`Celebrate: ${intention.statement}`}
      >
        <Check size={22} strokeWidth={3} />
      </button>
      </Tooltip>
      {todayCount > 0 && (
        <Badge variant="accent" size="sm">
          &times;{todayCount} today
        </Badge>
      )}
      {sparkle && (
        <SparkleOverlay
          type="quick_burst"
          origin={sparkle}
          onComplete={() => setSparkle(null)}
        />
      )}
    </div>
  )
}

// ---- Color Picker Popover ----

function IntentionColorPicker({
  intentionId,
  currentColor,
}: {
  intentionId: string
  currentColor: string | null
}) {
  const [open, setOpen] = useState(false)
  const updateColor = useUpdateIntentionColor()
  const fallback = INTENTION_COLORS[0]
  const active = currentColor ?? fallback

  return (
    <div className="relative">
      <Tooltip content="Change color">
        <button
          onClick={() => setOpen((v) => !v)}
          className="w-4 h-4 rounded-full shrink-0 border border-transparent hover:ring-2 hover:ring-offset-1 transition-shadow"
          style={{
            backgroundColor: active,
            outlineColor: active,
          }}
          aria-label="Pick color"
        />
      </Tooltip>
      {open && (
        <div
          className="absolute z-30 left-0 top-6 p-2 rounded-lg shadow-lg"
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border)',
            width: 200,
          }}
        >
          <div className="flex flex-wrap gap-1">
            {MEMBER_COLORS.map((c) => (
              <button
                key={c.hex}
                onClick={() => {
                  updateColor.mutate({ id: intentionId, color: c.hex })
                  setOpen(false)
                }}
                className="w-5 h-5 rounded-full transition-transform hover:scale-125"
                style={{
                  backgroundColor: c.hex,
                  outline: c.hex === active ? '2px solid var(--color-text-primary)' : 'none',
                  outlineOffset: '2px',
                }}
                title={c.name}
                aria-label={c.name}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

// ---- Intention Card (active or resting) ----

function IntentionCard({
  intention,
  familyId,
  memberId,
  isActive,
  onEdit,
}: {
  intention: BestIntention
  familyId: string
  memberId: string
  isActive: boolean
  onEdit: (i: BestIntention) => void
}) {
  const toggleActive = useToggleIntentionActive()
  const toggleAI = useToggleIntentionAI()
  const archiveIntention = useArchiveIntention()
  const deleteIntention = useDeleteIntention()

  return (
    <div
      className="p-4 rounded-lg"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        opacity: isActive ? 1 : 0.7,
      }}
    >
      <div className="flex items-start gap-3">
        {/* Celebrate button - only for active */}
        {isActive && (
          <CelebrateButton
            intention={intention}
            familyId={familyId}
            memberId={memberId}
          />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <IntentionColorPicker intentionId={intention.id} currentColor={intention.color} />
            <p
              className="font-semibold"
              style={{ color: 'var(--color-text-heading)' }}
            >
              {intention.statement}
            </p>
          </div>
          {intention.description && (
            <p
              className="text-sm mt-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {intention.description}
            </p>
          )}

          {/* Tags */}
          {intention.tags && intention.tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {intention.tags.map((tag) => (
                <span
                  key={tag}
                  className="text-xs px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Stats row */}
          <div
            className="flex items-center gap-3 mt-2 text-xs"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <span>
              <RotateCcw size={12} className="inline mr-1" />
              {intention.iteration_count} iterations
            </span>
            <span>{intention.celebration_count} celebrations</span>
            {isActive && (
              <span className="text-[10px] italic">
                {intention.tracker_style === 'counter'
                  ? 'counter'
                  : intention.tracker_style === 'bar_graph'
                    ? 'bar graph'
                    : 'streak'}
              </span>
            )}
          </div>
        </div>

        {/* Actions column */}
        <div className="flex flex-col items-end gap-1.5 shrink-0">
          {/* AI toggle */}
          <Tooltip content={
              intention.is_included_in_ai
                ? 'LiLa is using this intention'
                : 'LiLa is not using this intention'
            }>
          <button
            onClick={() =>
              toggleAI.mutate({
                id: intention.id,
                isIncluded: !intention.is_included_in_ai,
              })
            }
            className="p-1.5 rounded transition-colors"
            style={{
              color: intention.is_included_in_ai
                ? 'var(--color-btn-primary-bg)'
                : 'var(--color-text-secondary)',
            }}
          >
            {intention.is_included_in_ai ? (
              <Heart size={16} fill="currentColor" />
            ) : (
              <HeartOff size={16} />
            )}
          </button>
          </Tooltip>

          {/* Active / Resting toggle */}
          <Tooltip content={isActive ? 'Move to Resting' : 'Reactivate'}>
          <button
            onClick={() =>
              toggleActive.mutate({
                id: intention.id,
                isActive: !intention.is_active,
              })
            }
            className="p-1.5 rounded"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
          </button>
          </Tooltip>

          {/* Edit */}
          <Tooltip content="Edit">
          <button
            onClick={() => onEdit(intention)}
            className="p-1.5 rounded"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <Pencil size={14} />
          </button>
          </Tooltip>

          {/* Archive */}
          <Tooltip content="Archive">
          <button
            onClick={() => archiveIntention.mutate(intention.id)}
            className="p-1.5 rounded"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <Archive size={14} />
          </button>
          </Tooltip>

          {/* Delete */}
          <Tooltip content="Delete permanently">
          <button
            onClick={() => {
              if (confirm('Permanently delete this intention and all its iterations? This cannot be undone.')) {
                deleteIntention.mutate({ id: intention.id, memberId })
              }
            }}
            className="p-1.5 rounded transition-colors hover:text-red-500"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <Trash2 size={14} />
          </button>
          </Tooltip>
        </div>
      </div>
    </div>
  )
}

// ---- Archived Intention Card ----

function ArchivedIntentionCard({
  intention,
  onEdit,
}: {
  intention: BestIntention
  onEdit: (i: BestIntention) => void
}) {
  const restoreIntention = useRestoreIntention()
  const deleteIntention = useDeleteIntention()

  return (
    <div
      className="p-3 rounded-lg flex items-center justify-between gap-3"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        opacity: 0.6,
      }}
    >
      <p className="text-sm flex-1 min-w-0 truncate" style={{ color: 'var(--color-text-secondary)' }}>
        {intention.statement}
      </p>
      <div className="flex items-center gap-1 shrink-0">
        <Tooltip content="Restore">
        <button
          onClick={() => restoreIntention.mutate(intention.id)}
          className="p-1.5 rounded text-xs flex items-center gap-1"
          style={{ color: 'var(--color-btn-primary-bg)' }}
        >
          <RotateCcw size={14} />
        </button>
        </Tooltip>
        <Tooltip content="Edit">
        <button
          onClick={() => onEdit(intention)}
          className="p-1.5 rounded"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <Pencil size={14} />
        </button>
        </Tooltip>
        <Tooltip content="Delete permanently">
        <button
          onClick={() => {
            if (confirm('Permanently delete this intention and all its iterations? This cannot be undone.')) {
              deleteIntention.mutate({ id: intention.id, memberId: intention.member_id })
            }
          }}
          className="p-1.5 rounded transition-colors hover:text-red-500"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <Trash2 size={14} />
        </button>
        </Tooltip>
      </div>
    </div>
  )
}

// ---- Create / Edit Form ----

type TrackerStyle = 'counter' | 'bar_graph' | 'streak'

function IntentionForm({
  initial,
  onSave,
  onCancel,
  isSaving,
  familyId,
  currentMemberId,
}: {
  initial?: BestIntention | null
  onSave: (data: {
    statement: string
    description: string
    tags: string[]
    tracker_style: TrackerStyle
    related_member_ids: string[]
  }) => void
  onCancel: () => void
  isSaving: boolean
  familyId?: string
  currentMemberId?: string
}) {
  const [statement, setStatement] = useState(initial?.statement ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [tagsInput, setTagsInput] = useState(initial?.tags?.join(', ') ?? '')
  const [trackerStyle, setTrackerStyle] = useState<TrackerStyle>(
    initial?.tracker_style ?? 'counter'
  )
  const [relatedMemberIds, setRelatedMemberIds] = useState<string[]>(
    initial?.related_member_ids ?? []
  )
  const { data: allMembers = [] } = useFamilyMembers(familyId)
  // Exclude self from the picker
  const otherMembers = allMembers.filter((m) => m.id !== currentMemberId)

  function toggleMember(id: string) {
    setRelatedMemberIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  const handleSubmit = () => {
    if (!statement.trim()) return
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    onSave({ statement: statement.trim(), description: description.trim(), tags, tracker_style: trackerStyle, related_member_ids: relatedMemberIds })
  }

  return (
    <div
      className="p-4 rounded-lg space-y-3"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Statement */}
      <div>
        <label
          className="block text-sm font-medium mb-1"
          style={{ color: 'var(--color-text-heading)' }}
        >
          What do you want to be more mindful of?
        </label>
        <input
          type="text"
          placeholder="I intend to..."
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          autoFocus
          className="w-full px-3 py-2 rounded-lg text-sm"
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />
      </div>

      {/* Description */}
      <div>
        <label
          className="block text-sm mb-1"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Description (optional)
        </label>
        <textarea
          placeholder="Why this matters to you..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full px-3 py-2 rounded-lg text-sm resize-none"
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />
      </div>

      {/* Tags */}
      <div>
        <label
          className="block text-sm mb-1"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Tags (optional, comma-separated)
        </label>
        <input
          type="text"
          placeholder="parenting, patience, self-care"
          value={tagsInput}
          onChange={(e) => setTagsInput(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm"
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />
      </div>

      {/* Related members */}
      {otherMembers.length > 0 && (
        <div>
          <label
            className="block text-sm mb-1.5"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Related to (optional)
          </label>
          <div className="flex flex-wrap gap-1.5">
            {otherMembers.map((m) => {
              const selected = relatedMemberIds.includes(m.id)
              const color = m.assigned_color ?? m.member_color ?? 'var(--color-btn-primary-bg)'
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMember(m.id)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: selected ? color : 'transparent',
                    color: selected ? 'var(--color-text-on-primary, #fff)' : 'var(--color-text-primary)',
                    border: `2px solid ${color}`,
                  }}
                >
                  {m.display_name.split(' ')[0]}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Tracker style */}
      <div>
        <label
          className="block text-sm mb-1.5"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Tracker style
        </label>
        <div className="flex gap-2">
          {([
            { value: 'counter' as const, label: 'Counter', enhanced: false },
            { value: 'bar_graph' as const, label: 'Bar Graph', enhanced: true },
            { value: 'streak' as const, label: 'Streak', enhanced: true },
          ]).map((opt) => (
            <button
              key={opt.value}
              onClick={() => setTrackerStyle(opt.value)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors"
              style={{
                backgroundColor:
                  trackerStyle === opt.value
                    ? 'var(--color-btn-primary-bg)'
                    : 'var(--color-bg-secondary)',
                color:
                  trackerStyle === opt.value
                    ? 'var(--color-btn-primary-text)'
                    : 'var(--color-text-primary)',
                border:
                  trackerStyle === opt.value
                    ? '1px solid var(--color-btn-primary-bg)'
                    : '1px solid var(--color-border)',
              }}
            >
              {opt.label}
              {opt.enhanced && (
                <Badge variant="accent" size="sm">
                  Enhanced
                </Badge>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 justify-end pt-1">
        <button
          onClick={onCancel}
          className="px-3 py-1.5 rounded-lg text-sm"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          disabled={!statement.trim() || isSaving}
          className="px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
          style={{
            backgroundColor: 'var(--color-btn-primary-bg)',
            color: 'var(--color-btn-primary-text)',
          }}
        >
          {initial ? 'Save' : 'Create'}
        </button>
      </div>
    </div>
  )
}

// ---- Analytics Tab Content ----

function AnalyticsTabContent({
  intentions,
  memberId,
}: {
  intentions: BestIntention[]
  memberId: string
}) {
  const activeIntentions = useMemo(
    () => intentions.filter((i) => i.is_active),
    [intentions],
  )

  const [timeFrame, setTimeFrame] = useState<'day' | 'week' | 'month' | 'custom'>('week')
  const [chartType, setChartType] = useState<'bar' | 'line' | 'both'>('bar')
  const [hiddenSeries, setHiddenSeries] = useState<Set<string>>(new Set())

  // Compute date range based on time frame
  const dateRange = useMemo(() => {
    const end = new Date()
    const start = new Date()
    if (timeFrame === 'day') {
      start.setDate(end.getDate() - 1)
    } else if (timeFrame === 'week') {
      start.setDate(end.getDate() - 6)
    } else {
      start.setDate(end.getDate() - 29)
    }
    return {
      start: start.toISOString().split('T')[0],
      end: end.toISOString().split('T')[0],
    }
  }, [timeFrame])

  const intentionIds = useMemo(
    () => activeIntentions.map((i) => i.id),
    [activeIntentions],
  )

  const { data: allIterations = [] } = useAllIntentionIterations(
    memberId,
    intentionIds,
    dateRange,
  )

  // Build data series from iterations
  const dataSeries: TrackerAnalyticsDataSeries[] = useMemo(() => {
    // Generate all dates in the range
    const dates: string[] = []
    const cur = new Date(dateRange.start + 'T00:00:00')
    const endD = new Date(dateRange.end + 'T00:00:00')
    while (cur <= endD) {
      dates.push(cur.toISOString().split('T')[0])
      cur.setDate(cur.getDate() + 1)
    }

    // Group iterations by intention_id + day_date
    const grouped = new Map<string, Map<string, number>>()
    for (const iter of allIterations) {
      if (!grouped.has(iter.intention_id)) {
        grouped.set(iter.intention_id, new Map())
      }
      const dayMap = grouped.get(iter.intention_id)!
      dayMap.set(iter.day_date, (dayMap.get(iter.day_date) ?? 0) + 1)
    }

    return activeIntentions
      .filter((i) => !hiddenSeries.has(i.id))
      .map((intention, idx) => {
        const dayMap = grouped.get(intention.id)
        return {
          id: intention.id,
          label:
            intention.statement.length > 30
              ? intention.statement.slice(0, 30) + '...'
              : intention.statement,
          color: intention.color ?? INTENTION_COLORS[idx % INTENTION_COLORS.length],
          dataPoints: dates.map((d) => ({
            date: d,
            value: dayMap?.get(d) ?? 0,
          })),
        }
      })
  }, [activeIntentions, allIterations, dateRange, hiddenSeries])

  // Legend with toggle
  const toggleSeries = useCallback((id: string) => {
    setHiddenSeries((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }, [])

  if (activeIntentions.length === 0) {
    return (
      <div
        className="p-8 rounded-lg text-center space-y-3"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
        }}
      >
        <BarChart3 size={32} style={{ color: 'var(--color-text-secondary)' }} className="mx-auto" />
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Create active intentions to see analytics here.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Interactive legend — toggle intentions on/off */}
      <div className="flex flex-wrap gap-2">
        {activeIntentions.map((intention, idx) => {
          const color = intention.color ?? INTENTION_COLORS[idx % INTENTION_COLORS.length]
          const hidden = hiddenSeries.has(intention.id)
          return (
            <button
              key={intention.id}
              onClick={() => toggleSeries(intention.id)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-opacity"
              style={{
                backgroundColor: hidden
                  ? 'var(--color-bg-secondary)'
                  : `color-mix(in srgb, ${color} 18%, transparent)`,
                color: hidden ? 'var(--color-text-secondary)' : color,
                border: `1.5px solid ${hidden ? 'var(--color-border)' : color}`,
                opacity: hidden ? 0.5 : 1,
              }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: color, opacity: hidden ? 0.3 : 1 }}
              />
              {intention.statement.length > 25
                ? intention.statement.slice(0, 25) + '...'
                : intention.statement}
            </button>
          )
        })}
      </div>

      {/* Chart */}
      <TrackerAnalyticsView
        dataSeries={dataSeries}
        timeFrame={timeFrame}
        onTimeFrameChange={setTimeFrame}
        chartType={chartType}
        onChartTypeChange={setChartType}
        showAverage
        showTotal
      />
    </div>
  )
}

// ---- Main Page ----

type PageTab = 'intentions' | 'analytics'

export function BestIntentionsPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { isViewingAs, viewingAsMember } = useViewAs()
  const activeMember = isViewingAs && viewingAsMember ? viewingAsMember : member
  const { data: intentions = [], isLoading } = useBestIntentions(activeMember?.id)
  const { data: archivedIntentions = [] } = useArchivedIntentions(activeMember?.id)
  const createIntention = useCreateBestIntention()
  const updateIntention = useUpdateBestIntention()
  const createWidget = useCreateWidget()

  // Check if Best Intentions widget already on dashboard
  const { data: widgets = [] } = useWidgets(family?.id, activeMember?.id)
  const hasWidgetOnDashboard = useMemo(
    () => widgets.some((w) => w.template_type === 'info_best_intentions' || w.template_type === 'best_intention'),
    [widgets],
  )

  const [activeTab, setActiveTab] = useState<PageTab>('intentions')
  const [showCreate, setShowCreate] = useState(false)
  const [showBulkAdd, setShowBulkAdd] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [editing, setEditing] = useState<BestIntention | null>(null)
  const [createError, setCreateError] = useState<string | null>(null)

  // ?new=1 URL param → auto-open create form
  useEffect(() => {
    if (searchParams.get('new') === '1' && activeMember && family) {
      setShowCreate(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, member, family, setSearchParams])

  // Split active vs resting
  const activeIntentions = useMemo(
    () => intentions.filter((i) => i.is_active),
    [intentions]
  )
  const restingIntentions = useMemo(
    () => intentions.filter((i) => !i.is_active),
    [intentions]
  )

  // AI summary
  const aiCount = useMemo(
    () => intentions.filter((i) => i.is_included_in_ai).length,
    [intentions]
  )

  function resetForm() {
    setShowCreate(false)
    setEditing(null)
  }

  async function handleCreate(data: {
    statement: string
    description: string
    tags: string[]
    tracker_style: TrackerStyle
    related_member_ids: string[]
  }) {
    if (!activeMember || !family) {
      setCreateError('Still loading your profile. Please try again in a moment.')
      return
    }
    setCreateError(null)
    try {
      await createIntention.mutateAsync({
        family_id: family.id,
        member_id: activeMember.id,
        statement: data.statement,
        description: data.description || undefined,
        tags: data.tags.length > 0 ? data.tags : undefined,
        tracker_style: data.tracker_style,
        related_member_ids: data.related_member_ids.length > 0 ? data.related_member_ids : undefined,
      })
      resetForm()
    } catch (err: unknown) {
      console.error('Failed to create intention:', err)
      const msg = err instanceof Error
        ? err.message
        : typeof err === 'object' && err !== null && 'message' in err
          ? String((err as { message: unknown }).message)
          : 'Unknown error'
      setCreateError(`Failed to create intention: ${msg}`)
    }
  }

  async function handleUpdate(data: {
    statement: string
    description: string
    tags: string[]
    tracker_style: TrackerStyle
    related_member_ids: string[]
  }) {
    if (!editing) return
    setCreateError(null)
    try {
      await updateIntention.mutateAsync({
        id: editing.id,
        statement: data.statement,
        description: data.description || null,
        tags: data.tags.length > 0 ? data.tags : null,
        tracker_style: data.tracker_style,
        related_member_ids: data.related_member_ids.length > 0 ? data.related_member_ids : null,
      })
      resetForm()
    } catch (err) {
      console.error('Failed to update intention:', err)
      setCreateError(
        err instanceof Error ? err.message : 'Failed to save changes. Please try again.',
      )
    }
  }

  function handleEdit(intention: BestIntention) {
    setEditing(intention)
    setShowCreate(false)
  }

  return (
    <div className="density-comfortable max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FeatureIcon
              featureKey="best_intentions"
              fallback={
                <Target
                  size={40}
                  style={{ color: 'var(--color-btn-primary-bg)' }}
                />
              }
              size={40}
              className="!w-10 !h-10 md:!w-36 md:!h-36"
              assetSize={512}
            />
            <div>
              <h1
                className="text-2xl font-bold"
                style={{
                  color: 'var(--color-text-heading)',
                  fontFamily: 'var(--font-heading)',
                }}
              >
                BestIntentions
              </h1>
              <p
                className="text-sm"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                What you&apos;re actively practicing.
              </p>
            </div>
          </div>

          {/* Action buttons — only on intentions tab */}
          {activeTab === 'intentions' && (
            <div className="flex items-center gap-2">
              <Tooltip content="Bulk add intentions with AI">
              <button
                onClick={() => setShowBulkAdd(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-btn-primary-bg)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <Sparkles size={14} />
                <span className="hidden sm:inline">Bulk</span>
              </button>
              </Tooltip>
              <button
                onClick={() => {
                  setShowCreate(true)
                  setEditing(null)
                }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: 'var(--color-btn-primary-bg)',
                  color: 'var(--color-btn-primary-text)',
                }}
              >
                <Plus size={16} /> Add Intention
              </button>
            </div>
          )}
        </div>

        {/* AI summary + Add to Dashboard */}
        <div className="flex items-center justify-between mt-2">
          {intentions.length > 0 && (
            <p
              className="text-xs"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              LiLa is drawing from {aiCount}/{intentions.length} intentions
            </p>
          )}
          {!hasWidgetOnDashboard && intentions.length > 0 && (
            <Tooltip content="Show all active intentions as a widget on your dashboard">
            <button
              onClick={() => {
                if (!family?.id || !member?.id) return
                createWidget.mutate({
                  family_id: family.id,
                  family_member_id: member.id,
                  template_type: 'info_best_intentions',
                  title: 'Best Intentions',
                  size: 'medium',
                })
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-btn-primary-bg)',
                border: '1px solid var(--color-border)',
              }}
            >
              <LayoutDashboard size={14} />
              Add to Dashboard
            </button>
            </Tooltip>
          )}
          {hasWidgetOnDashboard && (
            <span
              className="flex items-center gap-1 text-xs"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              <LayoutDashboard size={12} />
              On your dashboard
            </span>
          )}
        </div>
      </div>

      {/* Error feedback */}
      {createError && (
        <div
          className="p-3 rounded-lg text-sm"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-accent-deep, #8e3e3c) 12%, transparent)',
            color: 'var(--color-accent-deep, #8e3e3c)',
            border: '1px solid color-mix(in srgb, var(--color-accent-deep, #8e3e3c) 30%, transparent)',
          }}
        >
          {createError}
        </div>
      )}

      {/* Tab switcher */}
      <div className="flex gap-1">
        {([
          { value: 'intentions' as const, label: 'My Intentions', icon: Target },
          { value: 'analytics' as const, label: 'Analytics', icon: BarChart3 },
        ]).map((tab) => {
          const isActive = activeTab === tab.value
          return (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: isActive ? 'var(--surface-primary)' : 'var(--color-bg-secondary)',
                color: isActive ? 'var(--color-text-on-primary)' : 'var(--color-text-secondary)',
                border: isActive ? 'none' : '1px solid var(--color-border-default)',
              }}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Analytics Tab */}
      {activeTab === 'analytics' && member && (
        <AnalyticsTabContent intentions={intentions} memberId={member.id} />
      )}

      {/* Intentions Tab */}
      {activeTab === 'intentions' && (
        <>
          {/* Bulk Add */}
          {showBulkAdd && member && family && (
            <BulkAddWithAI
              title="Bulk Add Intentions"
              placeholder={
                'Paste or type multiple intentions, one per line. E.g.:\nI intend to be more present with my kids\nI intend to move my body every morning\nI intend to respond instead of react'
              }
              hint="AI will parse your text into individual intention statements."
              parsePrompt='Parse the following text into individual intention statements. Each should be a clear, personal statement (often starting with "I intend to..." but not required). Return a JSON array of strings: ["intention1", "intention2", ...].'
              onSave={async (parsed) => {
                for (const item of parsed.filter((i) => i.selected)) {
                  await createIntention.mutateAsync({
                    family_id: family.id,
                    member_id: member.id,
                    statement: item.text,
                  })
                }
              }}
              onClose={() => setShowBulkAdd(false)}
            />
          )}

          {/* Create / Edit Form */}
          {(showCreate || editing) && (
            <IntentionForm
              initial={editing}
              onSave={editing ? handleUpdate : handleCreate}
              onCancel={resetForm}
              isSaving={createIntention.isPending || updateIntention.isPending}
              familyId={family?.id}
              currentMemberId={member?.id}
            />
          )}

          {/* Loading */}
          {isLoading ? (
            <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
          ) : intentions.length === 0 && !showCreate ? (
            /* Empty state */
            <div
              className="p-8 rounded-lg text-center space-y-4"
              style={{
                backgroundColor: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
              }}
            >
              <Target
                size={40}
                className="mx-auto"
                style={{ color: 'var(--color-text-secondary)' }}
              />
              <div>
                <p
                  className="text-sm"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Best Intentions are the things you want to be more mindful of
                  &mdash; not goals to complete, but ways of being you want to
                  practice.
                </p>
              </div>
              <button
                onClick={() => setShowCreate(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                style={{
                  backgroundColor: 'var(--color-btn-primary-bg)',
                  color: 'var(--color-btn-primary-text)',
                }}
              >
                <Plus size={16} /> Add My First Intention
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Active Intentions */}
              {activeIntentions.length > 0 && (
                <div className="space-y-3">
                  <h2
                    className="text-sm font-semibold uppercase tracking-wide"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    Active ({activeIntentions.length})
                  </h2>
                  {activeIntentions.map((intention) => (
                    <IntentionCard
                      key={intention.id}
                      intention={intention}
                      familyId={family?.id ?? ''}
                      memberId={member?.id ?? ''}
                      isActive
                      onEdit={handleEdit}
                    />
                  ))}
                </div>
              )}

              {/* Resting Intentions */}
              {restingIntentions.length > 0 && (
                <CollapsibleGroup
                  label="Resting"
                  count={restingIntentions.length}
                  defaultOpen={false}
                  description="Intentions you're not actively tracking right now"
                >
                  <div className="space-y-2">
                    {restingIntentions.map((intention) => (
                      <IntentionCard
                        key={intention.id}
                        intention={intention}
                        familyId={family?.id ?? ''}
                        memberId={member?.id ?? ''}
                        isActive={false}
                        onEdit={handleEdit}
                      />
                    ))}
                  </div>
                </CollapsibleGroup>
              )}

              {/* Archived */}
              {archivedIntentions.length > 0 && (
                <div>
                  <button
                    onClick={() => setShowArchived((v) => !v)}
                    className="text-xs font-medium flex items-center gap-1"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    <Archive size={12} />
                    {showArchived ? 'Hide' : 'View'} Archived (
                    {archivedIntentions.length})
                  </button>
                  {showArchived && (
                    <div className="mt-2 space-y-2">
                      {archivedIntentions.map((intention) => (
                        <ArchivedIntentionCard
                          key={intention.id}
                          intention={intention}
                          onEdit={handleEdit}
                        />
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
