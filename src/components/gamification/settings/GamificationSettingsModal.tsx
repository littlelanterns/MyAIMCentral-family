/**
 * GamificationSettingsModal — Build M Phase 4
 *
 * Full gamification configuration surface. Opened from FamilyMembers.tsx
 * for any member. Contains 6 collapsible sections:
 *   1. Master Toggles (enabled, sticker book, points per task)
 *   2. Day Segments (CRUD, reorder, task assignment)
 *   3. Creature Earning Mode (4-card picker + per-mode config)
 *   4. Background/Page Earning Mode (3-card picker + per-mode config)
 *   5. Coloring Reveals (active reveals list, add/config/remove)
 *   6. Reset & Advanced (reset sticker book, reset reveals, stats)
 *
 * Zero hardcoded colors — all CSS custom properties.
 */

import { useState, useCallback } from 'react'
import {
  ChevronDown,
  ChevronRight,
  GripVertical,
  Plus,
  Pencil,
  Trash2,
  X,
  Check,
  ListChecks,
  AlertTriangle,
  RotateCcw,
  ImageIcon,
  Palette,
} from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { Toggle } from '@/components/shared'
import {
  useGamificationConfig,
  useUpdateGamificationConfig,
  useUpdateStickerBookEarning,
  useToggleStickerBook,
  useResetStickerBook,
  useResetColoringReveals,
  useDeleteColoringReveal,
} from '@/hooks/useGamificationSettings'
import { useStickerBookState } from '@/hooks/useStickerBookState'
import {
  useTaskSegments,
  useCreateSegment,
  useUpdateSegment,
  useDeleteSegment,
  useReorderSegments,
} from '@/hooks/useTaskSegments'
import { useMemberColoringReveals, useUpdateColoringReveal } from '@/hooks/useColoringReveals'
import { useWidgets } from '@/hooks/useWidgets'
import { useTasks } from '@/hooks/useTasks'
import { useGamificationTheme } from '@/hooks/useGamificationTheme'
import {
  EarningModePickerCards,
  CREATURE_EARNING_MODES,
  PAGE_EARNING_MODES,
  isCreatureEarningMode,
  isPageEarningMode,
} from './EarningModePickerCards'
import { SegmentTaskPickerModal } from './SegmentTaskPickerModal'
import { ColoringImagePickerModal } from './ColoringImagePickerModal'
import { coloringImageUrl } from '@/lib/coloringImageUrl'
import type {
  TaskSegment,
  CreatureEarningMode,
  PageEarningMode,
  LineartPreference,
} from '@/types/play-dashboard'

import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ── Constants ───────────────────────────────────────────────────────

const SUGGESTED_SEGMENT_NAMES = [
  'Morning', 'Afternoon', 'Evening', 'School', 'Jobs',
  'Chores', 'Play Time', 'Outdoor Time', 'Sunday',
]

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// ── Props ───────────────────────────────────────────────────────────

interface GamificationSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  memberId: string
  memberName: string
  familyId: string
}

// ── Main Component ──────────────────────────────────────────────────

export function GamificationSettingsModal({
  isOpen,
  onClose,
  memberId,
  memberName,
  familyId,
}: GamificationSettingsModalProps) {
  // ── Data ──
  const { data: config } = useGamificationConfig(memberId)
  const { data: stickerState } = useStickerBookState(memberId)
  const { data: segments = [] } = useTaskSegments(memberId)
  const { data: coloringReveals = [] } = useMemberColoringReveals(memberId)
  const { data: widgets = [] } = useWidgets(familyId, memberId)
  const { data: memberTasks = [] } = useTasks(familyId, { assigneeId: memberId })
  const { data: theme } = useGamificationTheme(stickerState?.active_theme_id)

  // ── Mutations ──
  const updateConfig = useUpdateGamificationConfig()
  const updateEarning = useUpdateStickerBookEarning()
  const toggleStickerBook = useToggleStickerBook()
  const resetStickerBook = useResetStickerBook()
  const resetColoring = useResetColoringReveals()
  const createSegment = useCreateSegment()
  const updateSegment = useUpdateSegment()
  const deleteSegment = useDeleteSegment()
  const reorderSegments = useReorderSegments()
  const deleteReveal = useDeleteColoringReveal()
  const updateReveal = useUpdateColoringReveal(memberId)

  // ── Section collapse state ──
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['toggles']))
  const toggleSection = (key: string) => {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  // ── Sub-modal state ──
  const [taskPickerSegment, setTaskPickerSegment] = useState<TaskSegment | null>(null)
  const [showColoringPicker, setShowColoringPicker] = useState(false)
  const [confirmReset, setConfirmReset] = useState<'sticker' | 'coloring' | null>(null)
  const [confirmDeleteSegment, setConfirmDeleteSegment] = useState<string | null>(null)
  const [confirmDeleteReveal, setConfirmDeleteReveal] = useState<string | null>(null)

  // ── Segment editing ──
  const [editingSegmentId, setEditingSegmentId] = useState<string | null>(null)
  const [newSegmentName, setNewSegmentName] = useState('')
  const [showNewSegment, setShowNewSegment] = useState(false)

  const gamificationEnabled = config?.enabled ?? false
  // Read sticker book state even when "disabled" so the settings show current values
  const stickerEnabled = stickerState?.is_enabled ?? false

  // ── DnD for segments ──
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      const oldIndex = segments.findIndex((s) => s.id === active.id)
      const newIndex = segments.findIndex((s) => s.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return

      const reordered = [...segments]
      const [moved] = reordered.splice(oldIndex, 1)
      reordered.splice(newIndex, 0, moved)

      reorderSegments.mutate({
        family_member_id: memberId,
        orderedIds: reordered.map((s) => s.id),
      })
    },
    [segments, reorderSegments, memberId],
  )

  // ── Helpers ──
  function handleCreateSegment(name: string) {
    createSegment.mutate({
      family_id: familyId,
      family_member_id: memberId,
      segment_name: name,
      sort_order: segments.length,
    })
    setShowNewSegment(false)
    setNewSegmentName('')
  }

  return (
    <ModalV2
      id={`gamification-settings-${memberId}`}
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="lg"
      title={`${memberName}'s Gamification`}
      subtitle="Configure earning, segments, and coloring reveals"
    >
      <div className="space-y-2">
        {/* ═══════════ Section 1: Master Toggles ═══════════ */}
        <CollapsibleSection
          title="Master Toggles"
          sectionKey="toggles"
          isOpen={openSections.has('toggles')}
          onToggle={toggleSection}
        >
          <div className="space-y-4">
            <ToggleRow
              label="Enable Gamification"
              description="Points, creatures, and sticker book for this member"
              checked={gamificationEnabled}
              onChange={(v) =>
                updateConfig.mutate({ familyMemberId: memberId, familyId, enabled: v })
              }
            />

            {gamificationEnabled && (
              <>
                <ToggleRow
                  label="Enable Sticker Book"
                  description="Creature collection with pages and backgrounds"
                  checked={stickerEnabled}
                  onChange={(v) =>
                    toggleStickerBook.mutate({ familyMemberId: memberId, isEnabled: v })
                  }
                />

                <div>
                  <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Points per task
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={config?.base_points_per_task ?? 1}
                    onChange={(e) =>
                      updateConfig.mutate({
                        familyMemberId: memberId,
                        familyId,
                        base_points_per_task: Math.max(1, parseInt(e.target.value) || 1),
                      })
                    }
                    className="w-24 px-3 py-2 rounded-lg text-sm outline-none"
                    style={{
                      backgroundColor: 'var(--color-bg-primary)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                    }}
                  />
                </div>

                {/* Theme info */}
                {theme && (
                  <div
                    className="p-3 rounded-lg"
                    style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
                  >
                    <label className="block text-xs font-medium mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                      Active theme
                    </label>
                    <div className="flex items-center gap-3">
                      {theme.thumbnail_image_url && (
                        <img
                          src={theme.thumbnail_image_url}
                          alt={theme.display_name}
                          className="w-10 h-10 rounded-lg object-cover"
                        />
                      )}
                      <div>
                        <p className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
                          {theme.display_name}
                        </p>
                        {theme.description && (
                          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                            {theme.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-4 mt-2">
                      <ThemeStatBadge
                        label="Creatures"
                        value={stickerState?.creatures_earned_total ?? 0}
                        suffix="earned"
                      />
                      <ThemeStatBadge
                        label="Pages"
                        value={stickerState?.pages_unlocked_total ?? 0}
                        suffix="unlocked"
                      />
                    </div>
                    <p className="text-[10px] mt-2 italic" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>
                      More themes coming soon
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </CollapsibleSection>

        {/* ═══════════ Section 2: Day Segments ═══════════ */}
        <CollapsibleSection
          title="Day Segments"
          sectionKey="segments"
          isOpen={openSections.has('segments')}
          onToggle={toggleSection}
          disabled={!gamificationEnabled}
        >
          <div className="space-y-3">
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              Organize tasks into sections of the day. Drag to reorder.
            </p>

            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={segments.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                <div className="space-y-1.5">
                  {segments.map((seg) => (
                    <SortableSegmentRow
                      key={seg.id}
                      segment={seg}
                      isEditing={editingSegmentId === seg.id}
                      onToggleEdit={() => setEditingSegmentId(editingSegmentId === seg.id ? null : seg.id)}
                      onUpdate={(updates) =>
                        updateSegment.mutate({ id: seg.id, family_member_id: memberId, ...updates })
                      }
                      onDelete={() => setConfirmDeleteSegment(seg.id)}
                      onOpenTaskPicker={() => setTaskPickerSegment(seg)}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>

            {/* New segment */}
            {showNewSegment ? (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {SUGGESTED_SEGMENT_NAMES.filter(
                    (name) => !segments.some((s) => s.segment_name.toLowerCase() === name.toLowerCase()),
                  ).map((name) => (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setNewSegmentName(name)}
                      className="px-3 py-1 rounded-full text-xs transition-colors"
                      style={{
                        backgroundColor:
                          newSegmentName === name
                            ? 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, var(--color-bg-card))'
                            : 'var(--color-bg-secondary)',
                        color:
                          newSegmentName === name
                            ? 'var(--color-btn-primary-bg)'
                            : 'var(--color-text-secondary)',
                      }}
                    >
                      {name}
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Segment name"
                    value={newSegmentName}
                    onChange={(e) => setNewSegmentName(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                    style={{
                      backgroundColor: 'var(--color-bg-primary)',
                      border: '1px solid var(--color-border)',
                      color: 'var(--color-text-primary)',
                    }}
                    autoFocus
                  />
                  <button
                    onClick={() => newSegmentName.trim() && handleCreateSegment(newSegmentName.trim())}
                    disabled={!newSegmentName.trim()}
                    className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                    style={{ backgroundColor: 'var(--color-sage-teal)', color: 'var(--color-text-on-primary, #fff)' }}
                  >
                    <Check size={16} />
                  </button>
                  <button
                    onClick={() => { setShowNewSegment(false); setNewSegmentName('') }}
                    className="px-3 py-2 rounded-lg text-sm"
                    style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg-secondary)' }}
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowNewSegment(true)}
                className="flex items-center gap-1.5 text-sm font-medium"
                style={{ color: 'var(--color-btn-primary-bg)' }}
              >
                <Plus size={16} />
                Add Segment
              </button>
            )}
          </div>
        </CollapsibleSection>

        {/* ═══════════ Section 3: Creature Earning Mode ═══════════ */}
        <CollapsibleSection
          title={`How ${memberName} Earns Creatures`}
          sectionKey="creature_earning"
          isOpen={openSections.has('creature_earning')}
          onToggle={toggleSection}
          disabled={!gamificationEnabled}
        >
          <div className="space-y-4">
            <EarningModePickerCards
              modes={CREATURE_EARNING_MODES}
              selected={stickerState?.creature_earning_mode ?? 'random_per_task'}
              onChange={(key) => {
                if (isCreatureEarningMode(key)) {
                  updateEarning.mutate({ familyMemberId: memberId, creature_earning_mode: key })
                }
              }}
            />

            {/* Per-mode config */}
            <CreatureEarningConfig
              mode={stickerState?.creature_earning_mode ?? 'random_per_task'}
              threshold={stickerState?.creature_earning_threshold ?? 3}
              counterResets={stickerState?.creature_earning_counter_resets ?? true}
              segmentIds={stickerState?.creature_earning_segment_ids ?? []}
              rollChance={stickerState?.creature_roll_chance_per_task ?? 40}
              segments={segments}
              onUpdate={(updates) => updateEarning.mutate({ familyMemberId: memberId, ...updates })}
            />
          </div>
        </CollapsibleSection>

        {/* ═══════════ Section 4: Page/Background Earning Mode ═══════════ */}
        <CollapsibleSection
          title={`How ${memberName} Unlocks New Backgrounds`}
          sectionKey="page_earning"
          isOpen={openSections.has('page_earning')}
          onToggle={toggleSection}
          disabled={!gamificationEnabled}
        >
          <div className="space-y-4">
            <EarningModePickerCards
              modes={PAGE_EARNING_MODES}
              selected={stickerState?.page_earning_mode ?? 'every_n_creatures'}
              onChange={(key) => {
                if (isPageEarningMode(key)) {
                  updateEarning.mutate({ familyMemberId: memberId, page_earning_mode: key })
                }
              }}
            />

            <PageEarningConfig
              mode={stickerState?.page_earning_mode ?? 'every_n_creatures'}
              pageUnlockInterval={stickerState?.page_unlock_interval ?? 7}
              completionThreshold={stickerState?.page_earning_completion_threshold ?? 20}
              trackerWidgetId={stickerState?.page_earning_tracker_widget_id ?? null}
              trackerThreshold={stickerState?.page_earning_tracker_threshold ?? 5}
              widgets={widgets}
              onUpdate={(updates) => updateEarning.mutate({ familyMemberId: memberId, ...updates })}
            />
          </div>
        </CollapsibleSection>

        {/* ═══════════ Section 5: Coloring Reveals ═══════════ */}
        <CollapsibleSection
          title="Coloring Reveals"
          sectionKey="coloring"
          isOpen={openSections.has('coloring')}
          onToggle={toggleSection}
          disabled={!gamificationEnabled}
          icon={<Palette size={16} />}
        >
          <div className="space-y-3">
            {coloringReveals.length === 0 ? (
              <p className="text-xs py-2" style={{ color: 'var(--color-text-secondary)' }}>
                No coloring pictures assigned yet.
              </p>
            ) : (
              <div className="space-y-2">
                {coloringReveals.map((reveal) => (
                  <ColoringRevealRow
                    key={reveal.id}
                    reveal={reveal}
                    linkedTaskName={memberTasks.find((t) => t.id === reveal.earning_task_id)?.title ?? null}
                    onUpdateLineart={(pref) =>
                      updateReveal.mutate({ revealId: reveal.id, lineart_preference: pref })
                    }
                    onDelete={() => setConfirmDeleteReveal(reveal.id)}
                  />
                ))}
              </div>
            )}

            <button
              onClick={() => setShowColoringPicker(true)}
              className="flex items-center gap-1.5 text-sm font-medium"
              style={{ color: 'var(--color-btn-primary-bg)' }}
            >
              <Plus size={16} />
              Add Coloring Picture
            </button>
          </div>
        </CollapsibleSection>

        {/* ═══════════ Section 6: Reset & Advanced ═══════════ */}
        <CollapsibleSection
          title="Reset & Advanced"
          sectionKey="reset"
          isOpen={openSections.has('reset')}
          onToggle={toggleSection}
          disabled={!gamificationEnabled}
          icon={<RotateCcw size={16} />}
        >
          <div className="space-y-4">
            {/* Stats (read-only) */}
            <div
              className="grid grid-cols-2 gap-3 p-3 rounded-lg"
              style={{ backgroundColor: 'var(--color-bg-secondary)' }}
            >
              <StatItem label="Creatures earned" value={stickerState?.creatures_earned_total ?? 0} />
              <StatItem label="Pages unlocked" value={stickerState?.pages_unlocked_total ?? 0} />
              <StatItem label="Coloring reveals" value={coloringReveals.filter((r) => r.is_complete).length} />
              <StatItem label="Active reveals" value={coloringReveals.filter((r) => !r.is_complete).length} />
            </div>

            {/* Reset buttons */}
            <div className="space-y-2">
              <button
                onClick={() => setConfirmReset('sticker')}
                className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg w-full"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-error, #ef4444) 8%, var(--color-bg-card))',
                  color: 'var(--color-error, #ef4444)',
                  border: '1px solid color-mix(in srgb, var(--color-error, #ef4444) 20%, transparent)',
                }}
              >
                <RotateCcw size={14} />
                Reset Sticker Book
              </button>
              <button
                onClick={() => setConfirmReset('coloring')}
                className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg w-full"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-error, #ef4444) 8%, var(--color-bg-card))',
                  color: 'var(--color-error, #ef4444)',
                  border: '1px solid color-mix(in srgb, var(--color-error, #ef4444) 20%, transparent)',
                }}
              >
                <RotateCcw size={14} />
                Reset Coloring Reveals
              </button>
            </div>
          </div>
        </CollapsibleSection>
      </div>

      {/* ═══════════ Sub-Modals ═══════════ */}

      {/* Task picker */}
      {taskPickerSegment && (
        <SegmentTaskPickerModal
          isOpen
          onClose={() => setTaskPickerSegment(null)}
          segment={taskPickerSegment}
          familyId={familyId}
          memberId={memberId}
          allSegments={segments}
        />
      )}

      {/* Coloring image picker */}
      {showColoringPicker && stickerState && (
        <ColoringImagePickerModal
          isOpen
          onClose={() => setShowColoringPicker(false)}
          themeId={stickerState.active_theme_id}
          familyId={familyId}
          familyMemberId={memberId}
          memberName={memberName}
        />
      )}

      {/* Confirm reset sticker book */}
      {confirmReset === 'sticker' && (
        <ConfirmDialog
          title="Reset Sticker Book"
          message={`This will clear all creatures and reset to the first page for ${memberName}. Are you sure?`}
          onConfirm={() => {
            resetStickerBook.mutate({ familyMemberId: memberId })
            setConfirmReset(null)
          }}
          onCancel={() => setConfirmReset(null)}
        />
      )}

      {/* Confirm reset coloring */}
      {confirmReset === 'coloring' && (
        <ConfirmDialog
          title="Reset Coloring Reveals"
          message={`This will reset all active coloring reveals to step 0 for ${memberName}. Progress won't be deleted — just rewound.`}
          onConfirm={() => {
            resetColoring.mutate({ familyMemberId: memberId })
            setConfirmReset(null)
          }}
          onCancel={() => setConfirmReset(null)}
        />
      )}

      {/* Confirm delete segment */}
      {confirmDeleteSegment && (
        <ConfirmDialog
          title="Delete Segment"
          message="This will remove the segment and unassign any tasks in it. This cannot be undone."
          onConfirm={() => {
            deleteSegment.mutate({ id: confirmDeleteSegment, family_member_id: memberId })
            setConfirmDeleteSegment(null)
          }}
          onCancel={() => setConfirmDeleteSegment(null)}
        />
      )}

      {/* Confirm delete reveal */}
      {confirmDeleteReveal && (
        <ConfirmDialog
          title="Remove Coloring Picture"
          message="This will remove the coloring picture assignment. Any progress will be lost."
          onConfirm={() => {
            deleteReveal.mutate({ revealId: confirmDeleteReveal, familyMemberId: memberId })
            setConfirmDeleteReveal(null)
          }}
          onCancel={() => setConfirmDeleteReveal(null)}
        />
      )}
    </ModalV2>
  )
}

// ── Collapsible Section Wrapper ─────────────────────────────────────

function CollapsibleSection({
  title,
  sectionKey,
  isOpen,
  onToggle,
  disabled,
  icon,
  children,
}: {
  title: string
  sectionKey: string
  isOpen: boolean
  onToggle: (key: string) => void
  disabled?: boolean
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        opacity: disabled ? 0.5 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
      }}
    >
      <button
        type="button"
        onClick={() => onToggle(sectionKey)}
        className="w-full flex items-center gap-2 px-4 py-3 text-left"
      >
        {isOpen ? (
          <ChevronDown size={16} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
        ) : (
          <ChevronRight size={16} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
        )}
        {icon && <span style={{ color: 'var(--color-text-secondary)' }}>{icon}</span>}
        <span className="font-medium text-sm" style={{ color: 'var(--color-text-heading)' }}>
          {title}
        </span>
      </button>
      {isOpen && (
        <div className="px-4 pb-4 pt-1">
          {children}
        </div>
      )}
    </div>
  )
}

// ── Toggle Row ──────────────────────────────────────────────────────

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description?: string
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          {label}
        </p>
        {description && (
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {description}
          </p>
        )}
      </div>
      <Toggle checked={checked} onChange={onChange} size="sm" />
    </div>
  )
}

// ── Sortable Segment Row ────────────────────────────────────────────

function SortableSegmentRow({
  segment,
  isEditing,
  onToggleEdit,
  onUpdate,
  onDelete,
  onOpenTaskPicker,
}: {
  segment: TaskSegment
  isEditing: boolean
  onToggleEdit: () => void
  onUpdate: (updates: Partial<TaskSegment>) => void
  onDelete: () => void
  onOpenTaskPicker: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: segment.id,
  })
  const [editName, setEditName] = useState(segment.segment_name)
  const [editDays, setEditDays] = useState<number[]>(segment.day_filter ?? [])
  const [editCreature, setEditCreature] = useState(segment.creature_earning_enabled)
  const [editCelebration, setEditCelebration] = useState(segment.segment_complete_celebration)
  const [editRevealStyle, setEditRevealStyle] = useState<'show_upfront' | 'mystery_tap'>(segment.randomizer_reveal_style)

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : undefined,
    opacity: isDragging ? 0.8 : 1,
  }

  const dayDisplay = segment.day_filter?.length
    ? segment.day_filter.map((d) => DAY_NAMES[d]).join(', ')
    : 'Every day'

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="rounded-lg"
      {...attributes}
    >
      <div
        className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div {...listeners} className="cursor-grab touch-none" style={{ color: 'var(--color-text-secondary)' }}>
          <GripVertical size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
            {segment.segment_name}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {dayDisplay}
            {segment.creature_earning_enabled && ' | Earns creatures'}
          </p>
        </div>
        <button
          onClick={onOpenTaskPicker}
          className="p-1.5 rounded-lg"
          style={{ color: 'var(--color-text-secondary)' }}
          title="Assign tasks"
        >
          <ListChecks size={14} />
        </button>
        <button
          onClick={onToggleEdit}
          className="p-1.5 rounded-lg"
          style={{ color: 'var(--color-text-secondary)' }}
          title="Edit"
        >
          <Pencil size={14} />
        </button>
      </div>

      {isEditing && (
        <div
          className="mt-1 p-3 space-y-3 rounded-lg"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <div>
            <label className="block text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm outline-none"
              style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            />
          </div>

          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Active on days
            </label>
            <div className="flex gap-1.5">
              {DAY_NAMES.map((name, idx) => {
                const isActive = editDays.length === 0 || editDays.includes(idx)
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      if (editDays.length === 0) {
                        // Switch from "all days" to specific days: remove this one
                        setEditDays([0, 1, 2, 3, 4, 5, 6].filter((d) => d !== idx))
                      } else if (editDays.includes(idx)) {
                        const next = editDays.filter((d) => d !== idx)
                        setEditDays(next.length === 0 ? [] : next)
                      } else {
                        const next = [...editDays, idx].sort()
                        setEditDays(next.length === 7 ? [] : next)
                      }
                    }}
                    className="w-9 h-9 rounded-full text-xs font-medium transition-all"
                    style={{
                      backgroundColor: isActive
                        ? 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, var(--color-bg-card))'
                        : 'var(--color-bg-secondary)',
                      color: isActive ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
                      border: isActive ? '1.5px solid var(--color-btn-primary-bg)' : '1.5px solid var(--color-border)',
                    }}
                  >
                    {name}
                  </button>
                )
              })}
            </div>
          </div>

          <ToggleRow
            label="Earns creatures"
            checked={editCreature}
            onChange={setEditCreature}
          />

          <ToggleRow
            label="Celebration on complete"
            checked={editCelebration}
            onChange={setEditCelebration}
          />

          <div>
            <label className="block text-xs mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              Randomizer reveal style
            </label>
            <div className="flex gap-1.5">
              {([
                { value: 'mystery_tap' as const, label: 'Mystery tap' },
                { value: 'show_upfront' as const, label: 'Show upfront' },
              ]).map(opt => {
                const isActive = editRevealStyle === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setEditRevealStyle(opt.value)}
                    className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                    style={{
                      backgroundColor: isActive
                        ? 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, var(--color-bg-card))'
                        : 'var(--color-bg-secondary)',
                      color: isActive ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
                      border: isActive ? '1.5px solid var(--color-btn-primary-bg)' : '1.5px solid var(--color-border)',
                    }}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-tertiary, var(--color-text-secondary))' }}>
              {editRevealStyle === 'mystery_tap'
                ? 'Sparkly tile — child taps to see the activity'
                : 'Activity is visible when the dashboard loads'}
            </p>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={() => {
                onUpdate({
                  segment_name: editName.trim() || segment.segment_name,
                  day_filter: editDays.length === 0 || editDays.length === 7 ? null : editDays,
                  creature_earning_enabled: editCreature,
                  segment_complete_celebration: editCelebration,
                  randomizer_reveal_style: editRevealStyle,
                })
                onToggleEdit()
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{ backgroundColor: 'var(--color-sage-teal)', color: 'var(--color-text-on-primary, #fff)' }}
            >
              Save
            </button>
            <button
              onClick={onToggleEdit}
              className="px-3 py-1.5 rounded-lg text-xs"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Cancel
            </button>
            <button
              onClick={onDelete}
              className="ml-auto p-1.5 rounded-lg"
              style={{ color: 'var(--color-error, #ef4444)' }}
              title="Delete segment"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Creature Earning Config ─────────────────────────────────────────

function CreatureEarningConfig({
  mode,
  threshold,
  counterResets,
  segmentIds,
  rollChance,
  segments,
  onUpdate,
}: {
  mode: CreatureEarningMode
  threshold: number
  counterResets: boolean
  segmentIds: string[]
  rollChance: number
  segments: TaskSegment[]
  onUpdate: (updates: Record<string, unknown>) => void
}) {
  if (mode === 'segment_complete') {
    return (
      <div
        className="p-3 rounded-lg space-y-2"
        style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
      >
        <p className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          Which segments earn creatures? (empty = all)
        </p>
        {segments.length === 0 ? (
          <p className="text-xs italic" style={{ color: 'var(--color-text-secondary)' }}>
            Create segments first in the Day Segments section above.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {segments.map((seg) => {
              const isSelected = segmentIds.length === 0 || segmentIds.includes(seg.id)
              return (
                <button
                  key={seg.id}
                  type="button"
                  onClick={() => {
                    if (segmentIds.length === 0) {
                      // All selected → deselect this one
                      onUpdate({
                        creature_earning_segment_ids: segments
                          .filter((s) => s.id !== seg.id)
                          .map((s) => s.id),
                      })
                    } else if (segmentIds.includes(seg.id)) {
                      const next = segmentIds.filter((id) => id !== seg.id)
                      onUpdate({ creature_earning_segment_ids: next })
                    } else {
                      const next = [...segmentIds, seg.id]
                      // If all selected, clear to empty (= all)
                      onUpdate({
                        creature_earning_segment_ids:
                          next.length === segments.length ? [] : next,
                      })
                    }
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    backgroundColor: isSelected
                      ? 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, var(--color-bg-card))'
                      : 'var(--color-bg-card)',
                    color: isSelected ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
                    border: isSelected
                      ? '1.5px solid var(--color-btn-primary-bg)'
                      : '1.5px solid var(--color-border)',
                  }}
                >
                  {seg.segment_name}
                </button>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  if (mode === 'every_n_completions') {
    return (
      <div
        className="p-3 rounded-lg space-y-3"
        style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
      >
        <div>
          <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            How many tasks per creature?
          </label>
          <input
            type="number"
            min={1}
            max={50}
            value={threshold}
            onChange={(e) =>
              onUpdate({ creature_earning_threshold: Math.max(1, parseInt(e.target.value) || 1) })
            }
            className="w-24 px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>
        <ToggleRow
          label="Reset counter after each creature?"
          checked={counterResets}
          onChange={(v) => onUpdate({ creature_earning_counter_resets: v })}
        />
      </div>
    )
  }

  if (mode === 'random_per_task') {
    return (
      <div
        className="p-3 rounded-lg space-y-2"
        style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
      >
        <label className="block text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
          Chance per task: {rollChance}%
        </label>
        <input
          type="range"
          min={5}
          max={100}
          step={5}
          value={rollChance}
          onChange={(e) => onUpdate({ creature_roll_chance_per_task: parseInt(e.target.value) })}
          className="w-full"
        />
        <div className="flex justify-between text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
          <span>5%</span>
          <span>100%</span>
        </div>
      </div>
    )
  }

  // complete_the_day — no additional config
  return (
    <div
      className="p-3 rounded-lg"
      style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
    >
      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        One creature when all tasks for the day are complete. No additional configuration needed.
      </p>
    </div>
  )
}

// ── Page Earning Config ─────────────────────────────────────────────

function PageEarningConfig({
  mode,
  pageUnlockInterval,
  completionThreshold,
  trackerWidgetId,
  trackerThreshold,
  widgets,
  onUpdate,
}: {
  mode: PageEarningMode
  pageUnlockInterval: number
  completionThreshold: number
  trackerWidgetId: string | null
  trackerThreshold: number
  widgets: Array<{ id: string; title: string | null; template_type: string | null }>
  onUpdate: (updates: Record<string, unknown>) => void
}) {
  if (mode === 'every_n_creatures') {
    return (
      <div
        className="p-3 rounded-lg"
        style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
      >
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          How many creatures per background?
        </label>
        <input
          type="number"
          min={1}
          max={100}
          value={pageUnlockInterval}
          onChange={(e) =>
            onUpdate({ page_unlock_interval: Math.max(1, parseInt(e.target.value) || 1) })
          }
          className="w-24 px-3 py-2 rounded-lg text-sm outline-none"
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />
      </div>
    )
  }

  if (mode === 'every_n_completions') {
    return (
      <div
        className="p-3 rounded-lg"
        style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
      >
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          How many tasks per background?
        </label>
        <input
          type="number"
          min={1}
          max={200}
          value={completionThreshold}
          onChange={(e) =>
            onUpdate({
              page_earning_completion_threshold: Math.max(1, parseInt(e.target.value) || 1),
            })
          }
          className="w-24 px-3 py-2 rounded-lg text-sm outline-none"
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />
      </div>
    )
  }

  if (mode === 'every_n_days') {
    return (
      <div
        className="p-3 rounded-lg"
        style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
      >
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          Unlock a new background every how many days?
        </label>
        <input
          type="number"
          min={1}
          max={365}
          value={pageUnlockInterval}
          onChange={(e) =>
            onUpdate({ page_unlock_interval: Math.max(1, parseInt(e.target.value) || 1) })
          }
          className="w-24 px-3 py-2 rounded-lg text-sm outline-none"
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />
        <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-secondary)', opacity: 0.8 }}>
          A new page unlocks automatically on a timer, regardless of task completion.
        </p>
      </div>
    )
  }

  // tracker_goal
  return (
    <div
      className="p-3 rounded-lg space-y-3"
      style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
    >
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          Which tracker?
        </label>
        <select
          value={trackerWidgetId ?? ''}
          onChange={(e) =>
            onUpdate({ page_earning_tracker_widget_id: e.target.value || null })
          }
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        >
          <option value="">Select a tracker...</option>
          {widgets.map((w) => (
            <option key={w.id} value={w.id}>
              {w.title || w.template_type || 'Untitled Widget'}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          Data points needed
        </label>
        <input
          type="number"
          min={1}
          max={500}
          value={trackerThreshold}
          onChange={(e) =>
            onUpdate({
              page_earning_tracker_threshold: Math.max(1, parseInt(e.target.value) || 1),
            })
          }
          className="w-24 px-3 py-2 rounded-lg text-sm outline-none"
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            border: '1px solid var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />
      </div>
    </div>
  )
}

// ── Coloring Reveal Row ─────────────────────────────────────────────

function ColoringRevealRow({
  reveal,
  linkedTaskName,
  onUpdateLineart,
  onDelete,
}: {
  reveal: import('@/types/play-dashboard').MemberColoringReveal
  linkedTaskName: string | null
  onUpdateLineart: (pref: LineartPreference) => void
  onDelete: () => void
}) {
  const image = reveal.coloring_image
  const slug = image?.slug ?? ''
  const displayName = image?.display_name ?? 'Unknown'

  return (
    <div
      className="flex items-center gap-3 p-3 rounded-lg"
      style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
    >
      {slug ? (
        <img
          src={coloringImageUrl(slug, reveal.is_complete ? 'color' : 'grayscale')}
          alt={displayName}
          className="w-12 h-12 rounded-lg object-cover shrink-0"
        />
      ) : (
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: 'var(--color-bg-primary)' }}
        >
          <ImageIcon size={20} style={{ color: 'var(--color-text-secondary)' }} />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
          {displayName}
        </p>
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          Step {reveal.current_step}/{reveal.reveal_step_count}
          {reveal.is_complete && ' — Complete!'}
          {linkedTaskName && ` | ${linkedTaskName}`}
          {!linkedTaskName && reveal.earning_task_id && ' | Task not found'}
          {!linkedTaskName && !reveal.earning_task_id && ' | No task linked'}
        </p>

        {/* Lineart preference picker */}
        <div className="flex gap-1.5 mt-1.5">
          {(['simple', 'medium', 'complex'] as LineartPreference[]).map((pref) => (
            <button
              key={pref}
              type="button"
              onClick={() => onUpdateLineart(pref)}
              className="px-2 py-0.5 rounded text-[10px] transition-all"
              style={{
                backgroundColor:
                  reveal.lineart_preference === pref
                    ? 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, var(--color-bg-card))'
                    : 'var(--color-bg-card)',
                color:
                  reveal.lineart_preference === pref
                    ? 'var(--color-btn-primary-bg)'
                    : 'var(--color-text-secondary)',
                border:
                  reveal.lineart_preference === pref
                    ? '1px solid var(--color-btn-primary-bg)'
                    : '1px solid var(--color-border)',
              }}
            >
              {pref}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={onDelete}
        className="p-1.5 rounded-lg shrink-0"
        style={{ color: 'var(--color-error, #ef4444)' }}
        title="Remove"
      >
        <Trash2 size={14} />
      </button>
    </div>
  )
}

// ── Stat Item ───────────────────────────────────────────────────────

function StatItem({ label, value }: { label: string; value: number }) {
  return (
    <div className="text-center">
      <p className="text-lg font-bold" style={{ color: 'var(--color-text-heading)' }}>
        {value}
      </p>
      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </p>
    </div>
  )
}

function ThemeStatBadge({ label, value, suffix }: { label: string; value: number; suffix: string }) {
  return (
    <div
      className="px-2.5 py-1.5 rounded-lg text-xs"
      style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}
    >
      <span className="font-medium" style={{ color: 'var(--color-text-heading)' }}>{value}</span>{' '}
      <span style={{ color: 'var(--color-text-secondary)' }}>{label} {suffix}</span>
    </div>
  )
}

// ── Confirmation Dialog ─────────────────────────────────────────────

function ConfirmDialog({
  title,
  message,
  onConfirm,
  onCancel,
}: {
  title: string
  message: string
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40" onClick={onCancel}>
      <div
        className="w-full max-w-sm mx-4 p-6 rounded-2xl space-y-4"
        style={{ backgroundColor: 'var(--color-bg-card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2">
          <AlertTriangle size={20} style={{ color: 'var(--color-error, #ef4444)' }} />
          <h3 className="font-bold text-sm" style={{ color: 'var(--color-text-heading)' }}>
            {title}
          </h3>
        </div>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {message}
        </p>
        <div className="flex gap-2">
          <button
            onClick={onConfirm}
            className="flex-1 py-2 rounded-lg text-sm font-medium"
            style={{ backgroundColor: 'var(--color-error, #ef4444)', color: 'var(--color-text-on-primary, #fff)' }}
          >
            Confirm
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-2 rounded-lg text-sm"
            style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}
