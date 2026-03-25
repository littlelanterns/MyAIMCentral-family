import { useState, useRef, useCallback, useMemo } from 'react'
import { Target, Plus, Pencil, Archive, Heart, HeartOff, Sparkles, Check, RotateCcw, ToggleLeft, ToggleRight } from 'lucide-react'
import { FeatureIcon, BulkAddWithAI, CollapsibleGroup, SparkleOverlay, Badge } from '@/components/shared'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import {
  useBestIntentions,
  useArchivedIntentions,
  useCreateBestIntention,
  useUpdateBestIntention,
  useToggleIntentionActive,
  useToggleIntentionAI,
  useArchiveIntention,
  useRestoreIntention,
  useLogIteration,
  useTodaysIterations,
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
        title="Celebrate this intention"
        aria-label={`Celebrate: ${intention.statement}`}
      >
        <Check size={22} strokeWidth={3} />
      </button>
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
          <p
            className="font-semibold"
            style={{ color: 'var(--color-text-heading)' }}
          >
            {intention.statement}
          </p>
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
            title={
              intention.is_included_in_ai
                ? 'LiLa is using this intention'
                : 'LiLa is not using this intention'
            }
          >
            {intention.is_included_in_ai ? (
              <Heart size={16} fill="currentColor" />
            ) : (
              <HeartOff size={16} />
            )}
          </button>

          {/* Active / Resting toggle */}
          <button
            onClick={() =>
              toggleActive.mutate({
                id: intention.id,
                isActive: !intention.is_active,
              })
            }
            className="p-1.5 rounded"
            style={{ color: 'var(--color-text-secondary)' }}
            title={isActive ? 'Move to Resting' : 'Reactivate'}
          >
            {isActive ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
          </button>

          {/* Edit */}
          <button
            onClick={() => onEdit(intention)}
            className="p-1.5 rounded"
            style={{ color: 'var(--color-text-secondary)' }}
            title="Edit"
          >
            <Pencil size={14} />
          </button>

          {/* Archive */}
          <button
            onClick={() => archiveIntention.mutate(intention.id)}
            className="p-1.5 rounded"
            style={{ color: 'var(--color-text-secondary)' }}
            title="Archive"
          >
            <Archive size={14} />
          </button>
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
        <button
          onClick={() => restoreIntention.mutate(intention.id)}
          className="p-1.5 rounded text-xs flex items-center gap-1"
          style={{ color: 'var(--color-btn-primary-bg)' }}
          title="Restore"
        >
          <RotateCcw size={14} />
        </button>
        <button
          onClick={() => onEdit(intention)}
          className="p-1.5 rounded"
          style={{ color: 'var(--color-text-secondary)' }}
          title="Edit"
        >
          <Pencil size={14} />
        </button>
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
}: {
  initial?: BestIntention | null
  onSave: (data: {
    statement: string
    description: string
    tags: string[]
    tracker_style: TrackerStyle
  }) => void
  onCancel: () => void
  isSaving: boolean
}) {
  const [statement, setStatement] = useState(initial?.statement ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [tagsInput, setTagsInput] = useState(initial?.tags?.join(', ') ?? '')
  const [trackerStyle, setTrackerStyle] = useState<TrackerStyle>(
    initial?.tracker_style ?? 'counter'
  )

  const handleSubmit = () => {
    if (!statement.trim()) return
    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    onSave({ statement: statement.trim(), description: description.trim(), tags, tracker_style: trackerStyle })
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

// ---- Main Page ----

export function BestIntentionsPage() {
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { data: intentions = [], isLoading } = useBestIntentions(member?.id)
  const { data: archivedIntentions = [] } = useArchivedIntentions(member?.id)
  const createIntention = useCreateBestIntention()
  const updateIntention = useUpdateBestIntention()

  const [showCreate, setShowCreate] = useState(false)
  const [showBulkAdd, setShowBulkAdd] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [editing, setEditing] = useState<BestIntention | null>(null)

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
  }) {
    if (!member || !family) return
    await createIntention.mutateAsync({
      family_id: family.id,
      member_id: member.id,
      statement: data.statement,
      description: data.description || undefined,
      tags: data.tags.length > 0 ? data.tags : undefined,
      tracker_style: data.tracker_style,
    })
    resetForm()
  }

  async function handleUpdate(data: {
    statement: string
    description: string
    tags: string[]
    tracker_style: TrackerStyle
  }) {
    if (!editing) return
    await updateIntention.mutateAsync({
      id: editing.id,
      statement: data.statement,
      description: data.description || null,
      tags: data.tags.length > 0 ? data.tags : null,
      tracker_style: data.tracker_style,
    })
    resetForm()
  }

  function handleEdit(intention: BestIntention) {
    setEditing(intention)
    setShowCreate(false)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
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

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBulkAdd(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-btn-primary-bg)',
                border: '1px solid var(--color-border)',
              }}
              title="Bulk add intentions with AI"
            >
              <Sparkles size={14} />
              <span className="hidden sm:inline">Bulk</span>
            </button>
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
        </div>

        {/* AI summary */}
        {intentions.length > 0 && (
          <p
            className="text-xs mt-2"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            LiLa is drawing from {aiCount}/{intentions.length} intentions
          </p>
        )}
      </div>

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
    </div>
  )
}
