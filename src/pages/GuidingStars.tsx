/**
 * GuidingStars Page — PRD-06
 * Values, declarations, scriptures/quotes, and vision statements.
 * Grouped by entry_type with drag-to-reorder, heart/unheart toggles,
 * and soft-archive workflow.
 */

import { useState, useMemo } from 'react'
import {
  Heart,
  HeartOff,
  Plus,
  Pencil,
  Archive,
  ArchiveRestore,
  Sparkles,
  GripVertical,
  Star,
  BookOpen,
  MessageCircle,
  Trash2,
} from 'lucide-react'
import { FeatureGuide, FeatureIcon, ModalV2, BulkAddWithAI, CollapsibleGroup, Tooltip } from '@/components/shared'
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
import declarationsArticle from '../../reference/The-Art-of-Honest-Declarations.md?raw'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import {
  useGuidingStars,
  useArchivedGuidingStars,
  useCreateGuidingStar,
  useUpdateGuidingStar,
  useDeleteGuidingStar,
  useHardDeleteGuidingStar,
  useRestoreGuidingStar,
  useToggleGuidingStarAI,
  useBatchToggleGuidingStarAI,
  useReorderGuidingStars,
  GUIDING_STAR_TYPES,
} from '@/hooks/useGuidingStars'
import type { GuidingStar, GuidingStarEntryType } from '@/hooks/useGuidingStars'

// ---------------------------------------------------------------------------
// Sortable star card
// ---------------------------------------------------------------------------

function SortableStarCard({
  star,
  onEdit,
  onArchive,
  onToggleAI,
}: {
  star: GuidingStar
  onEdit: (star: GuidingStar) => void
  onArchive: (star: GuidingStar) => void
  onToggleAI: (star: GuidingStar) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: star.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : star.is_included_in_ai ? 1 : 0.65,
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-2 p-3 rounded-lg mb-1.5 transition-colors"
      {...attributes}
    >
      {/* Drag handle */}
      <button
        {...listeners}
        className="mt-1 p-1 rounded cursor-grab active:cursor-grabbing shrink-0 touch-none"
        style={{ color: 'var(--color-text-secondary)' }}
        aria-label="Drag to reorder"
      >
        <GripVertical size={16} />
      </button>

      {/* Heart toggle */}
      <Tooltip content={
          star.is_included_in_ai
            ? 'Included in AI context — click to exclude'
            : 'Excluded from AI context — click to include'
        }>
      <button
        onClick={() => onToggleAI(star)}
        className="mt-0.5 p-1 rounded transition-colors shrink-0"
        style={{
          color: star.is_included_in_ai
            ? 'var(--color-btn-primary-bg)'
            : 'var(--color-text-secondary)',
        }}
      >
        {star.is_included_in_ai ? (
          <Heart size={16} fill="currentColor" />
        ) : (
          <HeartOff size={16} />
        )}
      </button>
      </Tooltip>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className="font-medium text-sm"
          style={{ color: 'var(--color-text-heading)' }}
        >
          {star.content}
        </p>
        {star.description && (
          <p
            className="mt-0.5 text-xs"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {star.description}
          </p>
        )}
        {star.category && (
          <span
            className="inline-block mt-1 px-2 py-0.5 rounded text-[10px]"
            style={{
              backgroundColor:
                'color-mix(in srgb, var(--color-btn-primary-bg) 10%, transparent)',
              color: 'var(--color-btn-primary-bg)',
            }}
          >
            {star.category}
          </span>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-0.5 shrink-0">
        <Tooltip content="Edit">
        <button
          onClick={() => onEdit(star)}
          className="p-1.5 rounded hover:opacity-70"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <Pencil size={14} />
        </button>
        </Tooltip>
        <Tooltip content="Archive">
        <button
          onClick={() => onArchive(star)}
          className="p-1.5 rounded hover:opacity-70"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <Archive size={14} />
        </button>
        </Tooltip>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main page
// ---------------------------------------------------------------------------

export function GuidingStarsPage() {
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { isViewingAs, viewingAsMember } = useViewAs()
  const activeMember = isViewingAs && viewingAsMember ? viewingAsMember : member
  const { data: stars = [], isLoading } = useGuidingStars(activeMember?.id)
  const { data: archivedStars = [] } = useArchivedGuidingStars(activeMember?.id)
  const createStar = useCreateGuidingStar()
  const updateStar = useUpdateGuidingStar()
  const deleteStar = useDeleteGuidingStar()
  const hardDeleteStar = useHardDeleteGuidingStar()
  const restoreStar = useRestoreGuidingStar()
  const toggleAI = useToggleGuidingStarAI()
  const batchToggleAI = useBatchToggleGuidingStarAI()
  const reorderStars = useReorderGuidingStars()

  // Form state
  const [showCreate, setShowCreate] = useState(false)
  const [showBulkAdd, setShowBulkAdd] = useState(false)
  const [editingStar, setEditingStar] = useState<GuidingStar | null>(null)
  const [formContent, setFormContent] = useState('')
  const [formEntryType, setFormEntryType] = useState<GuidingStarEntryType>('value')
  const [formCategory, setFormCategory] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [showInspiration, setShowInspiration] = useState(false)
  const [showArchived, setShowArchived] = useState(false)
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  // Group stars by entry_type
  const grouped = useMemo(() => {
    const map: Record<GuidingStarEntryType, GuidingStar[]> = {
      value: [],
      declaration: [],
      scripture_quote: [],
      vision: [],
    }
    for (const s of stars) {
      const t = s.entry_type || 'value'
      if (map[t]) map[t].push(s)
      else map.value.push(s)
    }
    return map
  }, [stars])

  const includedCount = stars.filter((s) => s.is_included_in_ai).length

  // -----------------------------------------------------------------------
  // Helpers
  // -----------------------------------------------------------------------

  function resetForm() {
    setFormContent('')
    setFormEntryType('value')
    setFormCategory('')
    setFormDescription('')
    setShowCreate(false)
    setEditingStar(null)
  }

  async function handleCreate() {
    if (!member || !family || !formContent.trim()) return
    await createStar.mutateAsync({
      family_id: family.id,
      member_id: member.id,
      content: formContent.trim(),
      entry_type: formEntryType,
      category: formCategory.trim() || undefined,
      description: formDescription.trim() || undefined,
    })
    resetForm()
  }

  async function handleUpdate() {
    if (!editingStar || !formContent.trim()) return
    await updateStar.mutateAsync({
      id: editingStar.id,
      content: formContent.trim(),
      entry_type: formEntryType,
      category: formCategory.trim() || null,
      description: formDescription.trim() || null,
    })
    resetForm()
  }

  async function handleArchive(star: GuidingStar) {
    if (!member) return
    await deleteStar.mutateAsync({ id: star.id, memberId: member.id })
  }

  async function handleRestore(star: GuidingStar) {
    if (!member) return
    await restoreStar.mutateAsync({ id: star.id, memberId: member.id })
  }

  async function handleToggleAI(star: GuidingStar) {
    if (!member) return
    await toggleAI.mutateAsync({
      id: star.id,
      memberId: member.id,
      included: !star.is_included_in_ai,
    })
  }

  async function handleBatchToggle(entryType: GuidingStarEntryType, included: boolean) {
    if (!member) return
    await batchToggleAI.mutateAsync({
      memberId: member.id,
      entryType,
      included,
    })
  }

  function startEdit(star: GuidingStar) {
    setEditingStar(star)
    setFormContent(star.content)
    setFormEntryType(star.entry_type || 'value')
    setFormCategory(star.category ?? '')
    setFormDescription(star.description ?? '')
  }

  function handleDragEnd(entryType: GuidingStarEntryType) {
    return (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id || !member) return

      const group = grouped[entryType]
      const oldIndex = group.findIndex((s) => s.id === active.id)
      const newIndex = group.findIndex((s) => s.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return

      const reordered = arrayMove(group, oldIndex, newIndex)
      reorderStars.mutate({
        memberId: member.id,
        orderedIds: reordered.map((s) => s.id),
      })
    }
  }

  // -----------------------------------------------------------------------
  // Render
  // -----------------------------------------------------------------------

  return (
    <div className="density-comfortable max-w-3xl mx-auto space-y-6">
      <FeatureGuide featureKey="guiding_stars" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FeatureIcon
            featureKey="guiding_stars"
            fallback={
              <Star
                size={40}
                style={{ color: 'var(--color-btn-primary-bg)' }}
              />
            }
            size={40}
            className="w-10! h-10! md:w-36! md:h-36!"
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
              Guiding Stars
            </h1>
            <p
              className="text-xs"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Who you are choosing to be.
            </p>
            {stars.length > 0 && (
              <p
                className="text-[10px] mt-0.5"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                LiLa is drawing from {includedCount} of {stars.length} stars
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <Tooltip content="Craft with LiLa">
          <button
            onClick={() => {
              // STUB: Craft with LiLa — PRD-06
              // eslint-disable-next-line no-alert
              alert('Coming soon — Craft with LiLa will help you discover your guiding stars.')
            }}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-btn-primary-bg)',
              border: '1px solid var(--color-border)',
            }}
          >
            <MessageCircle size={14} />
            <span className="hidden sm:inline">Craft</span>
          </button>
          </Tooltip>
          <Tooltip content="Bulk add guiding stars with AI">
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
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: 'var(--color-btn-primary-bg)',
              color: 'var(--color-btn-primary-text)',
            }}
          >
            <Plus size={16} />
            Add
          </button>
        </div>
      </div>

      {/* Bulk Add */}
      {showBulkAdd && member && family && (
        <BulkAddWithAI
          title="Bulk Add Guiding Stars"
          placeholder={
            'Paste or type multiple guiding stars, one per line. E.g.:\nI lead with kindness in every interaction\nFamily meals together matter more than perfection\nGrowth over comfort — always learning'
          }
          hint="AI will parse and categorize each entry as a Value, Declaration, Scripture/Quote, or Vision."
          categories={GUIDING_STAR_TYPES.map((t) => ({
            value: t.value,
            label: t.label,
          }))}
          parsePrompt='Parse the following text into individual guiding star entries. Each should be a meaningful value, declaration, scripture/quote, or vision. Categorize each with one of: value, declaration, scripture_quote, vision. Return JSON: [{"text": "entry text", "category": "value"}, ...].'
          onSave={async (parsed) => {
            for (const item of parsed.filter((i) => i.selected)) {
              await createStar.mutateAsync({
                family_id: family.id,
                member_id: member.id,
                content: item.text,
                entry_type: (item.category as GuidingStarEntryType) || 'value',
              })
            }
          }}
          onClose={() => setShowBulkAdd(false)}
        />
      )}

      {/* Create / Edit Form */}
      {(showCreate || editingStar) && (
        <div
          className="p-4 rounded-xl space-y-3"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
          }}
        >
          <h2
            className="text-base font-semibold"
            style={{ color: 'var(--color-text-heading)' }}
          >
            {editingStar ? 'Edit Guiding Star' : 'New Guiding Star'}
          </h2>

          <textarea
            placeholder="What guides you? A value, declaration, scripture, or vision statement..."
            value={formContent}
            onChange={(e) => setFormContent(e.target.value)}
            rows={3}
            autoFocus
            className="w-full px-3 py-2 rounded-lg text-sm resize-none"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />

          {/* Entry type chips */}
          <div>
            <label
              className="block text-xs mb-1.5 font-medium"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Type
            </label>
            <div className="flex gap-2 flex-wrap">
              {GUIDING_STAR_TYPES.map((t) => (
                <button
                  key={t.value}
                  onClick={() => setFormEntryType(t.value)}
                  className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
                  style={{
                    backgroundColor:
                      formEntryType === t.value
                        ? 'var(--color-btn-primary-bg)'
                        : 'var(--color-bg-secondary)',
                    color:
                      formEntryType === t.value
                        ? 'var(--color-btn-primary-text)'
                        : 'var(--color-text-secondary)',
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Optional description */}
          <textarea
            placeholder="Why does this matter to you? (optional)"
            value={formDescription}
            onChange={(e) => setFormDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg text-sm resize-none"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />

          {/* Optional category tag */}
          <input
            type="text"
            placeholder="Category tag (optional, e.g. Faith, Motherhood, Career)"
            value={formCategory}
            onChange={(e) => setFormCategory(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />

          {/* Inspiration link */}
          <button
            onClick={() => setShowInspiration(true)}
            className="flex items-center gap-1.5 text-xs transition-colors hover:opacity-80"
            style={{ color: 'var(--color-btn-primary-bg)' }}
          >
            <BookOpen size={14} />
            For inspiration, read &ldquo;The Art of Honest Declarations&rdquo;
          </button>

          <div className="flex gap-2 justify-end">
            <button
              onClick={resetForm}
              className="px-3 py-1.5 rounded-lg text-sm"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Cancel
            </button>
            <button
              onClick={editingStar ? handleUpdate : handleCreate}
              disabled={!formContent.trim()}
              className="px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{
                backgroundColor: 'var(--color-btn-primary-bg)',
                color: 'var(--color-btn-primary-text)',
              }}
            >
              {editingStar ? 'Save' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* Star groups */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div
            className="animate-spin w-6 h-6 border-2 rounded-full"
            style={{
              borderColor: 'var(--color-border)',
              borderTopColor: 'var(--color-btn-primary-bg)',
            }}
          />
        </div>
      ) : stars.length === 0 ? (
        /* Empty state */
        <div
          className="p-8 rounded-xl text-center space-y-4"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
          }}
        >
          <Star
            size={36}
            className="mx-auto"
            style={{ color: 'var(--color-btn-primary-bg)' }}
          />
          <div>
            <p
              className="font-medium"
              style={{ color: 'var(--color-text-heading)' }}
            >
              Your Guiding Stars
            </p>
            <p
              className="text-sm mt-2 max-w-md mx-auto"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Your Guiding Stars are the values, commitments, and vision that
              define who you&apos;re choosing to be. They anchor everything LiLa
              does for you — every suggestion, every reflection, every
              celebration connects back to what matters most.
            </p>
          </div>
          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: 'var(--color-btn-primary-bg)',
                color: 'var(--color-btn-primary-text)',
              }}
            >
              <Plus size={16} />
              Write My First Star
            </button>
            <button
              onClick={() => {
                // STUB: Craft with LiLa — PRD-06
                // eslint-disable-next-line no-alert
                alert(
                  'Coming soon — Craft with LiLa will help you discover your guiding stars.'
                )
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-btn-primary-bg)',
                border: '1px solid var(--color-border)',
              }}
            >
              <MessageCircle size={16} />
              Let LiLa Help Me Discover Mine
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {GUIDING_STAR_TYPES.map((typeInfo) => {
            const group = grouped[typeInfo.value]
            const heartedCount = group.filter((s) => s.is_included_in_ai).length

            return (
              <CollapsibleGroup
                key={typeInfo.value}
                label={typeInfo.label}
                count={group.length}
                heartedCount={heartedCount}
                defaultOpen={group.length > 0}
                onToggleAll={(included) =>
                  handleBatchToggle(typeInfo.value, included)
                }
              >
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={handleDragEnd(typeInfo.value)}
                >
                  <SortableContext
                    items={group.map((s) => s.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    {group.map((star) => (
                      <SortableStarCard
                        key={star.id}
                        star={star}
                        onEdit={startEdit}
                        onArchive={handleArchive}
                        onToggleAI={handleToggleAI}
                      />
                    ))}
                  </SortableContext>
                </DndContext>
              </CollapsibleGroup>
            )
          })}
        </div>
      )}

      {/* Archived section */}
      {archivedStars.length > 0 && (
        <div>
          <button
            onClick={() => setShowArchived((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <Archive size={14} />
            {showArchived ? 'Hide' : 'View'} Archived ({archivedStars.length})
          </button>

          {showArchived && (
            <div className="mt-3 space-y-1.5">
              {archivedStars.map((star) => (
                <div
                  key={star.id}
                  className="flex items-start gap-3 p-3 rounded-lg"
                  style={{
                    backgroundColor: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                    opacity: 0.6,
                  }}
                >
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-sm"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {star.content}
                    </p>
                    {star.description && (
                      <p
                        className="text-xs mt-0.5"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {star.description}
                      </p>
                    )}
                    <span
                      className="inline-block mt-1 text-[10px]"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {GUIDING_STAR_TYPES.find(
                        (t) => t.value === star.entry_type
                      )?.label ?? 'Value'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                  <Tooltip content="Restore">
                  <button
                    onClick={() => handleRestore(star)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                    style={{
                      color: 'var(--color-btn-primary-bg)',
                      backgroundColor: 'var(--color-bg-secondary)',
                    }}
                  >
                    <ArchiveRestore size={12} />
                    Restore
                  </button>
                  </Tooltip>
                  <Tooltip content="Permanently delete">
                  <button
                    onClick={() => setConfirmDeleteId(star.id)}
                    className="flex items-center gap-1 px-2 py-1 rounded text-xs font-medium"
                    style={{
                      color: 'var(--color-status-error, #dc2626)',
                      backgroundColor: 'var(--color-bg-secondary)',
                    }}
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                  </Tooltip>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Permanent Delete Confirmation */}
      <ModalV2
        id="guiding-stars-hard-delete-confirm"
        isOpen={confirmDeleteId !== null}
        onClose={() => setConfirmDeleteId(null)}
        type="transient"
        title="Permanently Delete?"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
            This will permanently delete this guiding star. It cannot be undone.
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={() => setConfirmDeleteId(null)}
              className="px-3 py-1.5 rounded text-sm"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
              }}
            >
              Cancel
            </button>
            <button
              onClick={async () => {
                if (!confirmDeleteId || !member?.id) return
                await hardDeleteStar.mutateAsync({ id: confirmDeleteId, memberId: member.id })
                setConfirmDeleteId(null)
              }}
              disabled={hardDeleteStar.isPending}
              className="px-3 py-1.5 rounded text-sm font-medium"
              style={{
                backgroundColor: 'var(--color-status-error, #dc2626)',
                color: 'var(--color-text-on-primary, #fff)',
                opacity: hardDeleteStar.isPending ? 0.6 : 1,
              }}
            >
              {hardDeleteStar.isPending ? 'Deleting...' : 'Delete Forever'}
            </button>
          </div>
        </div>
      </ModalV2>

      {/* Inspiration Article Modal */}
      <ModalV2
        id="guiding-stars-inspiration"
        isOpen={showInspiration}
        onClose={() => setShowInspiration(false)}
        type="transient"
        title="The Art of Honest Declarations"
        size="lg"
      >
        <div
          className="prose prose-sm max-w-none overflow-y-auto"
          style={{
            maxHeight: '70vh',
            color: 'var(--color-text-primary)',
            lineHeight: 1.7,
          }}
        >
          {declarationsArticle.split('\n').map((line, i) => {
            if (line.startsWith('# '))
              return (
                <h1
                  key={i}
                  style={{
                    color: 'var(--color-text-heading)',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.25rem',
                    marginTop: '1.5rem',
                  }}
                >
                  {line.slice(2)}
                </h1>
              )
            if (line.startsWith('## '))
              return (
                <h2
                  key={i}
                  style={{
                    color: 'var(--color-text-heading)',
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.1rem',
                    marginTop: '1.25rem',
                  }}
                >
                  {line.slice(3)}
                </h2>
              )
            if (line.startsWith('### '))
              return (
                <h3
                  key={i}
                  style={{
                    color: 'var(--color-text-heading)',
                    fontSize: '1rem',
                    marginTop: '1rem',
                  }}
                >
                  {line.slice(4)}
                </h3>
              )
            if (line.startsWith('---'))
              return (
                <hr
                  key={i}
                  style={{
                    borderColor: 'var(--color-border)',
                    margin: '1rem 0',
                  }}
                />
              )
            if (line.startsWith('*') && line.endsWith('*'))
              return (
                <p
                  key={i}
                  style={{
                    fontStyle: 'italic',
                    color: 'var(--color-text-secondary)',
                  }}
                >
                  {line.slice(1, -1)}
                </p>
              )
            if (line.startsWith('> '))
              return (
                <blockquote
                  key={i}
                  style={{
                    borderLeft: '3px solid var(--color-btn-primary-bg)',
                    paddingLeft: '0.75rem',
                    color: 'var(--color-text-secondary)',
                    fontStyle: 'italic',
                    margin: '0.75rem 0',
                  }}
                >
                  {line.slice(2)}
                </blockquote>
              )
            if (line.trim() === '') return <br key={i} />
            return (
              <p key={i} style={{ margin: '0.5rem 0' }}>
                {line}
              </p>
            )
          })}
        </div>
      </ModalV2>
    </div>
  )
}
