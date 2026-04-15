/**
 * GuidedManagementScreen — PRD-25
 *
 * Mom's modal for managing a Guided child's dashboard configuration.
 * Opened from FamilyMembers settings page.
 *
 * Sections:
 *   1. Section Order & Visibility (drag-to-reorder, eye toggles)
 *   2. Section Settings (calendar default, task view default)
 *   3. Features (reading support, spelling coaching)
 *   4. Best Intentions (CRUD for child's intentions)
 *   5. Reflections (Phase B stub)
 *   6. LiLa Tools (future stubs)
 *
 * Zero hardcoded colors — all CSS custom properties.
 */

import { useState, useCallback } from 'react'
import {
  GripVertical,
  Lock,
  Eye,
  EyeOff,
  Pencil,
  Trash2,
  Plus,
  ChevronDown,
  X,
  Check,
} from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { Toggle } from '@/components/shared'
import { useGuidedDashboardConfig } from '@/hooks/useGuidedDashboardConfig'
import {
  useBestIntentions,
  useCreateBestIntention,
  useArchiveIntention,
  useUpdateBestIntention,
} from '@/hooks/useBestIntentions'
import {
  GUIDED_UNHIDEABLE_SECTIONS,
  type GuidedSectionKey,
} from '@/types/guided-dashboard'

import { DndContext, closestCenter, PointerSensor, useSensor, useSensors } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

// ─── Props ──────────────────────────────────────────────────────────────────

interface GuidedManagementScreenProps {
  isOpen: boolean
  onClose: () => void
  memberId: string
  memberName: string
  familyId: string
}

// ─── Section label map ──────────────────────────────────────────────────────

const SECTION_LABELS: Record<GuidedSectionKey, string> = {
  greeting: 'Greeting',
  best_intentions: 'Best Intentions',
  next_best_thing: 'Next Best Thing',
  calendar: 'Calendar',
  active_tasks: 'My Tasks',
  things_to_talk_about: 'Things to Talk About',
  widget_grid: 'Widgets',
  celebrate: 'Celebrate',
}

// ─── Sortable section row ───────────────────────────────────────────────────

function SortableSectionRow({
  id,
  label,
  isUnhideable,
  visible,
  onToggleVisibility,
}: {
  id: string
  label: string
  isUnhideable: boolean
  visible: boolean
  onToggleVisibility: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id })

  return (
    <div
      ref={setNodeRef}
      className="flex items-center gap-2 py-2 px-3 rounded-lg"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 10 : undefined,
      }}
    >
      <button
        className="cursor-grab active:cursor-grabbing p-0.5 touch-none"
        style={{
          color: 'var(--color-text-muted, var(--color-text-secondary))',
          background: 'transparent',
          minHeight: 'unset',
          border: 'none',
        }}
        {...attributes}
        {...listeners}
      >
        <GripVertical size={14} />
      </button>

      <span className="flex-1 text-sm" style={{ color: 'var(--color-text-primary)' }}>
        {label}
      </span>

      {isUnhideable ? (
        <span
          style={{
            color: 'var(--color-text-muted, var(--color-text-secondary))',
            display: 'flex',
            alignItems: 'center',
          }}
          title="This section cannot be hidden"
        >
          <Lock size={14} />
        </span>
      ) : (
        <button
          onClick={onToggleVisibility}
          className="p-1 rounded"
          style={{
            color: visible ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            background: 'transparent',
            minHeight: 'unset',
            border: 'none',
            cursor: 'pointer',
          }}
          title={visible ? 'Hide section' : 'Show section'}
        >
          {visible ? <Eye size={16} /> : <EyeOff size={16} />}
        </button>
      )}
    </div>
  )
}

// ─── Main component ─────────────────────────────────────────────────────────

export function GuidedManagementScreen({
  isOpen,
  onClose,
  memberId,
  memberName,
  familyId,
}: GuidedManagementScreenProps) {
  // ─── Hooks ────────────────────────────────────────────────────────────────
  const {
    preferences,
    sections,
    updatePreference,
    handleReorderSections,
    handleToggleVisibility,
  } = useGuidedDashboardConfig(familyId, memberId)

  const { data: intentions, isLoading: intentionsLoading } = useBestIntentions(memberId)
  const createIntention = useCreateBestIntention()
  const archiveIntention = useArchiveIntention()
  const updateIntention = useUpdateBestIntention()

  // ─── Local state ──────────────────────────────────────────────────────────
  const [showIntentionForm, setShowIntentionForm] = useState(false)
  const [intentionStatement, setIntentionStatement] = useState('')
  const [editingIntentionId, setEditingIntentionId] = useState<string | null>(null)
  const [editingStatement, setEditingStatement] = useState('')

  // ─── DnD sensors ──────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return
      handleReorderSections(active.id as GuidedSectionKey, over.id as GuidedSectionKey)
    },
    [handleReorderSections]
  )

  // ─── Intention handlers ───────────────────────────────────────────────────

  const handleCreateIntention = useCallback(async () => {
    if (!intentionStatement.trim()) return
    await createIntention.mutateAsync({
      family_id: familyId,
      member_id: memberId,
      statement: intentionStatement.trim(),
      source: 'manual',
    })
    setIntentionStatement('')
    setShowIntentionForm(false)
  }, [familyId, memberId, intentionStatement, createIntention])

  const handleArchiveIntention = useCallback(
    async (id: string) => {
      await archiveIntention.mutateAsync(id)
    },
    [archiveIntention]
  )

  const startEditIntention = useCallback((id: string, statement: string) => {
    setEditingIntentionId(id)
    setEditingStatement(statement)
  }, [])

  const saveEditIntention = useCallback(async () => {
    if (!editingIntentionId || !editingStatement.trim()) return
    await updateIntention.mutateAsync({
      id: editingIntentionId,
      statement: editingStatement.trim(),
    })
    setEditingIntentionId(null)
    setEditingStatement('')
  }, [editingIntentionId, editingStatement, updateIntention])

  const cancelEditIntention = useCallback(() => {
    setEditingIntentionId(null)
    setEditingStatement('')
  }, [])

  // ─── Active (non-archived) intentions ─────────────────────────────────────
  const activeIntentions = (intentions ?? []).filter((i) => i.is_active)

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <ModalV2
      id={`guided-management-${memberId}`}
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="md"
      title={`${memberName}'s Dashboard`}
      subtitle="Configure guided dashboard experience"
    >
      <div className="density-compact flex flex-col gap-6">
        {/* ── 1. SECTIONS ──────────────────────────────────────────── */}
        <SectionGroup title="SECTIONS">
          <p
            className="text-xs mb-2"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Drag to reorder. Locked sections cannot be hidden.
          </p>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sections.map((s) => s.key)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col gap-1.5">
                {sections.map((section) => {
                  const isUnhideable = GUIDED_UNHIDEABLE_SECTIONS.includes(section.key)
                  return (
                    <SortableSectionRow
                      key={section.key}
                      id={section.key}
                      label={SECTION_LABELS[section.key] ?? section.key}
                      isUnhideable={isUnhideable}
                      visible={section.visible}
                      onToggleVisibility={() => handleToggleVisibility(section.key)}
                    />
                  )
                })}
              </div>
            </SortableContext>
          </DndContext>
        </SectionGroup>

        {/* ── 2. SECTION SETTINGS ──────────────────────────────────── */}
        <SectionGroup title="SECTION SETTINGS">
          <div className="flex flex-col gap-3">
            {/* Calendar default view */}
            <SettingDropdown
              label="Calendar default view"
              value={preferences.guided_calendar_view_default}
              onChange={(val) => updatePreference('guided_calendar_view_default', val as 'day' | 'week')}
              options={[
                { value: 'day', label: 'Day' },
                { value: 'week', label: 'Week' },
              ]}
              description="Default calendar view when child opens Calendar section"
            />

            {/* Task view default */}
            <SettingDropdown
              label="My Tasks default view"
              value={preferences.guided_task_view_default}
              onChange={(val) =>
                updatePreference(
                  'guided_task_view_default',
                  val as 'simple_list' | 'now_next_optional'
                )
              }
              options={[
                { value: 'simple_list', label: 'Simple List' },
                { value: 'now_next_optional', label: 'Now-Next-Optional' },
              ]}
              description="How tasks are organized on the child's dashboard"
            />
          </div>
        </SectionGroup>

        {/* ── 3. FEATURES ──────────────────────────────────────────── */}
        <SectionGroup title="FEATURES">
          <div className="flex flex-col gap-4">
            <FeatureToggle
              label="Reading Support"
              description="Adds read-aloud icons, larger text, and icon labels"
              checked={preferences.reading_support_enabled}
              onChange={(val) => updatePreference('reading_support_enabled', val)}
            />
            <FeatureToggle
              label="Spelling Coaching"
              description="Brief teaching explanations with spell check corrections"
              checked={preferences.spelling_coaching_enabled}
              onChange={(val) => updatePreference('spelling_coaching_enabled', val)}
            />
          </div>
        </SectionGroup>

        {/* ── 4. BEST INTENTIONS ───────────────────────────────────── */}
        <SectionGroup title="BEST INTENTIONS">
          <div className="flex flex-col gap-3">
            {/* Allow child to create own */}
            <FeatureToggle
              label={`Allow ${memberName} to create own`}
              description="Child can add their own Best Intentions from their dashboard"
              checked={preferences.child_can_create_best_intentions}
              onChange={(val) => updatePreference('child_can_create_best_intentions', val)}
            />

            {/* Active intentions list */}
            <div className="flex flex-col gap-1.5 mt-1">
              {intentionsLoading && (
                <p
                  className="text-sm py-2"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Loading...
                </p>
              )}
              {!intentionsLoading && activeIntentions.length === 0 && (
                <p
                  className="text-sm py-2"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  No active intentions yet.
                </p>
              )}
              {activeIntentions.map((intention) => (
                <div
                  key={intention.id}
                  className="flex items-center gap-2 py-2 px-3 rounded-lg"
                  style={{ backgroundColor: 'var(--color-bg-secondary)' }}
                >
                  {editingIntentionId === intention.id ? (
                    /* Inline edit mode */
                    <div className="flex-1 flex items-center gap-2">
                      <input
                        type="text"
                        value={editingStatement}
                        onChange={(e) => setEditingStatement(e.target.value)}
                        className="flex-1 px-2 py-1 rounded text-sm"
                        style={{
                          backgroundColor: 'var(--color-bg-primary)',
                          color: 'var(--color-text-primary)',
                          border: '1px solid var(--color-border)',
                          outline: 'none',
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveEditIntention()
                          if (e.key === 'Escape') cancelEditIntention()
                        }}
                        autoFocus
                      />
                      <button
                        onClick={saveEditIntention}
                        style={{
                          color: 'var(--color-btn-primary-bg)',
                          background: 'transparent',
                          minHeight: 'unset',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                        title="Save"
                      >
                        <Check size={16} />
                      </button>
                      <button
                        onClick={cancelEditIntention}
                        style={{
                          color: 'var(--color-text-secondary)',
                          background: 'transparent',
                          minHeight: 'unset',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                        title="Cancel"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ) : (
                    /* Display mode */
                    <>
                      <span
                        className="flex-1 text-sm"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {intention.statement}
                      </span>
                      <button
                        onClick={() => startEditIntention(intention.id, intention.statement)}
                        className="p-1 rounded"
                        style={{
                          color: 'var(--color-text-secondary)',
                          background: 'transparent',
                          minHeight: 'unset',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                        title="Edit intention"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => handleArchiveIntention(intention.id)}
                        className="p-1 rounded"
                        style={{
                          color: 'var(--color-text-secondary)',
                          background: 'transparent',
                          minHeight: 'unset',
                          border: 'none',
                          cursor: 'pointer',
                        }}
                        title="Archive intention"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Add intention form */}
            {showIntentionForm ? (
              <div className="flex flex-col gap-2 mt-1">
                <input
                  type="text"
                  value={intentionStatement}
                  onChange={(e) => setIntentionStatement(e.target.value)}
                  placeholder="Enter intention statement..."
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    color: 'var(--color-text-primary)',
                    border: '1px solid var(--color-border)',
                    outline: 'none',
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateIntention()
                    if (e.key === 'Escape') {
                      setShowIntentionForm(false)
                      setIntentionStatement('')
                    }
                  }}
                  autoFocus
                />
                <div className="flex gap-2 justify-end">
                  <button
                    onClick={() => {
                      setShowIntentionForm(false)
                      setIntentionStatement('')
                    }}
                    className="px-3 py-1.5 rounded-lg text-sm"
                    style={{
                      color: 'var(--color-text-secondary)',
                      background: 'transparent',
                      border: '1px solid var(--color-border)',
                      cursor: 'pointer',
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateIntention}
                    disabled={!intentionStatement.trim() || createIntention.isPending}
                    className="px-3 py-1.5 rounded-lg text-sm"
                    style={{
                      color: 'var(--color-text-on-primary)',
                      background: 'var(--color-btn-primary-bg)',
                      border: 'none',
                      cursor: intentionStatement.trim() ? 'pointer' : 'not-allowed',
                      opacity: intentionStatement.trim() ? 1 : 0.5,
                    }}
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowIntentionForm(true)}
                className="flex items-center gap-1.5 text-sm mt-1"
                style={{
                  color: 'var(--color-btn-primary-bg)',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  minHeight: 'unset',
                  padding: '4px 0',
                }}
              >
                <Plus size={14} />
                Add Intention for {memberName}
              </button>
            )}
          </div>
        </SectionGroup>

        {/* ── 5. REFLECTIONS ───────────────────────────────────────── */}
        <SectionGroup title="REFLECTIONS">
          <div className="flex flex-col gap-4">
            <FeatureToggle
              label="In Write drawer"
              description="Adds a Reflections tab to the Write drawer"
              checked={preferences.reflections_in_drawer}
              onChange={(val) => updatePreference('reflections_in_drawer', val)}
            />
            <FeatureToggle
              label="In evening celebration"
              description="Adds a reflection step to the DailyCelebration sequence"
              checked={preferences.reflections_in_celebration}
              onChange={(val) => updatePreference('reflections_in_celebration', val)}
            />
            {(preferences.reflections_in_drawer || preferences.reflections_in_celebration) && (
              <SettingDropdown
                label="Prompts per day"
                value={String(preferences.reflection_daily_count)}
                onChange={(val) => updatePreference('reflection_daily_count', Number(val))}
                options={[
                  { value: '1', label: '1' },
                  { value: '3', label: '3' },
                  { value: '5', label: '5' },
                  { value: '10', label: '10' },
                  { value: '32', label: 'All' },
                ]}
                description="How many reflection prompts appear each day"
              />
            )}
          </div>
        </SectionGroup>

        {/* ── 6. LILA TOOLS ─────────────────────────── */}
        <SectionGroup title="LILA TOOLS">
          <div className="flex flex-col gap-4">
            <FeatureToggle
              label="Homework Help"
              description={`LiLa helps ${memberName} think through homework problems step by step — without giving answers.`}
              checked={preferences.lila_homework_enabled}
              onChange={(val) => updatePreference('lila_homework_enabled', val)}
            />
            <FeatureToggle
              label="Communication Coach"
              description={`LiLa helps ${memberName} figure out how to talk to family about things on their mind.`}
              checked={preferences.lila_communication_coach_enabled}
              onChange={(val) => updatePreference('lila_communication_coach_enabled', val)}
            />
          </div>
        </SectionGroup>
      </div>
    </ModalV2>
  )
}

// ─── Helper components ──────────────────────────────────────────────────────

/** Labeled group wrapper */
function SectionGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3
        className="text-xs font-semibold uppercase tracking-wider mb-2"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {title}
      </h3>
      {children}
    </div>
  )
}

/** Feature toggle with label + description */
function FeatureToggle({
  label,
  description,
  checked,
  onChange,
  disabled = false,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (val: boolean) => void
  disabled?: boolean
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-1">
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          {label}
        </p>
        <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
          {description}
        </p>
      </div>
      <div className="pt-0.5">
        <Toggle
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          size="sm"
        />
      </div>
    </div>
  )
}

/** Dropdown select for section settings */
function SettingDropdown({
  label,
  value,
  onChange,
  options,
  description,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<{ value: string; label: string }>
  description?: string
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex-1">
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
          {label}
        </p>
        {description && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {description}
          </p>
        )}
      </div>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none text-sm px-3 py-1.5 pr-7 rounded-lg"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            outline: 'none',
            cursor: 'pointer',
          }}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={14}
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            pointerEvents: 'none',
            color: 'var(--color-text-secondary)',
          }}
        />
      </div>
    </div>
  )
}
