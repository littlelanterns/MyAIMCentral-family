/**
 * AgendaSectionEditorModal — PRD-16 Phase B (Screen 5)
 *
 * Drag-to-reorder agenda sections, edit title/prompt, archive defaults,
 * restore archived, add custom sections. Auto-seeds built-in defaults
 * on first access for a meeting type.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { GripVertical, Plus, Pencil, Archive, ArchiveRestore, Check, X, Loader2 } from 'lucide-react'
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
import { ModalV2 } from '@/components/shared/ModalV2'
import {
  useMeetingTemplateSections,
  useUpsertMeetingTemplateSection,
  useSeedDefaultSections,
} from '@/hooks/useMeetings'
import type { MeetingType, MeetingTemplateSection } from '@/types/meetings'
import { MEETING_TYPE_LABELS, BUILT_IN_AGENDAS } from '@/types/meetings'
import { supabase } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'

interface AgendaSectionEditorModalProps {
  isOpen: boolean
  onClose: () => void
  meetingType: MeetingType
  templateId?: string
  childName?: string
  familyId: string
}

// ── Sortable Section Row ───────────────────────────────────
function SortableSectionRow({
  section,
  onEdit,
  onArchive,
}: {
  section: MeetingTemplateSection
  onEdit: (section: MeetingTemplateSection) => void
  onArchive: (section: MeetingTemplateSection) => void
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: section.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : undefined,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-2 p-3 rounded-lg"
      {...attributes}
    >
      <button
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-1 touch-none"
        style={{ color: 'var(--color-text-tertiary)' }}
      >
        <GripVertical size={16} />
      </button>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
          {section.section_name}
          {section.is_default && (
            <span className="ml-2 text-xs px-1.5 py-0.5 rounded" style={{ background: 'var(--color-surface-tertiary)', color: 'var(--color-text-tertiary)' }}>
              built-in
            </span>
          )}
        </p>
        {section.prompt_text && (
          <p className="text-xs truncate mt-0.5" style={{ color: 'var(--color-text-tertiary)' }}>
            {section.prompt_text}
          </p>
        )}
      </div>

      <button
        onClick={() => onEdit(section)}
        className="p-1.5 rounded-md hover:opacity-80"
        style={{ color: 'var(--color-text-secondary)' }}
        title="Edit"
      >
        <Pencil size={14} />
      </button>
      <button
        onClick={() => onArchive(section)}
        className="p-1.5 rounded-md hover:opacity-80"
        style={{ color: 'var(--color-text-tertiary)' }}
        title="Archive"
      >
        <Archive size={14} />
      </button>
    </div>
  )
}

// ── Inline Section Editor ──────────────────────────────────
function SectionEditForm({
  section,
  onSave,
  onCancel,
}: {
  section: MeetingTemplateSection | null
  onSave: (name: string, prompt: string) => void
  onCancel: () => void
}) {
  const [name, setName] = useState(section?.section_name ?? '')
  const [prompt, setPrompt] = useState(section?.prompt_text ?? '')

  useEffect(() => {
    setName(section?.section_name ?? '')
    setPrompt(section?.prompt_text ?? '')
  }, [section])

  return (
    <div className="p-3 rounded-lg space-y-3" style={{ background: 'var(--color-surface-tertiary)', border: '1px solid var(--color-border-default)' }}>
      <div>
        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
          Section Name
        </label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="e.g. Action Items"
          className="w-full text-sm px-3 py-2 rounded-md"
          style={{ background: 'var(--color-surface-primary)', border: '1px solid var(--color-border-default)', color: 'var(--color-text-primary)' }}
          autoFocus
        />
      </div>
      <div>
        <label className="text-xs font-medium mb-1 block" style={{ color: 'var(--color-text-secondary)' }}>
          LiLa Prompt (what LiLa asks during this section)
        </label>
        <textarea
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder="Guide the conversation around this topic..."
          rows={3}
          className="w-full text-sm px-3 py-2 rounded-md resize-none"
          style={{ background: 'var(--color-surface-primary)', border: '1px solid var(--color-border-default)', color: 'var(--color-text-primary)' }}
        />
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-1.5 text-sm rounded-md" style={{ color: 'var(--color-text-secondary)' }}>
          <X size={14} className="inline mr-1" /> Cancel
        </button>
        <button
          onClick={() => onSave(name.trim(), prompt.trim())}
          disabled={!name.trim()}
          className="btn-primary px-3 py-1.5 text-sm rounded-md flex items-center gap-1"
        >
          <Check size={14} /> Save
        </button>
      </div>
    </div>
  )
}

// ── Main Modal ─────────────────────────────────────────────
export function AgendaSectionEditorModal({
  isOpen,
  onClose,
  meetingType,
  templateId,
  childName,
  familyId,
}: AgendaSectionEditorModalProps) {
  const queryClient = useQueryClient()
  const { data: sections = [], isLoading } = useMeetingTemplateSections(familyId, meetingType, templateId)
  const upsertSection = useUpsertMeetingTemplateSection()
  const seedDefaults = useSeedDefaultSections()

  const [localSections, setLocalSections] = useState<MeetingTemplateSection[]>([])
  const [editingSection, setEditingSection] = useState<MeetingTemplateSection | null>(null)
  const [isAddingNew, setIsAddingNew] = useState(false)
  const [archivedSections, setArchivedSections] = useState<MeetingTemplateSection[]>([])
  const [showArchived, setShowArchived] = useState(false)
  const seedingRef = useRef(false)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const label = childName
    ? `${MEETING_TYPE_LABELS[meetingType]}: ${childName}`
    : MEETING_TYPE_LABELS[meetingType] ?? 'Custom Meeting'

  // Auto-seed defaults on first access if no sections exist.
  // Uses a ref guard to prevent double-firing in strict mode.
  useEffect(() => {
    if (isLoading || seedingRef.current) return
    if (sections.length > 0) return

    const builtIn = BUILT_IN_AGENDAS[meetingType]
    if (!builtIn) return

    seedingRef.current = true
    seedDefaults.mutate(
      { family_id: familyId, meeting_type: meetingType, sections: builtIn },
    )
  }, [isLoading, sections.length, meetingType, familyId, seedDefaults])

  // Sync remote → local when sections change
  useEffect(() => {
    setLocalSections(sections.filter(s => !s.is_archived))
    setArchivedSections(sections.filter(s => s.is_archived))
  }, [sections])

  // Load archived sections separately (the query filters by is_archived=false)
  useEffect(() => {
    if (!isOpen || !familyId || !meetingType) return
    const loadArchived = async () => {
      let query = supabase
        .from('meeting_template_sections')
        .select('*')
        .eq('family_id', familyId)
        .eq('meeting_type', meetingType)
        .eq('is_archived', true)
        .order('sort_order', { ascending: true })

      if (templateId) {
        query = query.eq('template_id', templateId)
      } else {
        query = query.is('template_id', null)
      }

      const { data } = await query
      if (data) setArchivedSections(data as MeetingTemplateSection[])
    }
    loadArchived()
  }, [isOpen, familyId, meetingType, templateId, sections])

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const oldIndex = localSections.findIndex(s => s.id === active.id)
      const newIndex = localSections.findIndex(s => s.id === over.id)
      if (oldIndex === -1 || newIndex === -1) return

      const reordered = arrayMove(localSections, oldIndex, newIndex)
      setLocalSections(reordered)

      // Persist sort_order updates
      const updates = reordered.map((s, i) => ({
        ...s,
        sort_order: i,
      }))

      for (const section of updates) {
        if (section.sort_order !== localSections.find(s => s.id === section.id)?.sort_order) {
          await upsertSection.mutateAsync({
            id: section.id,
            family_id: section.family_id,
            meeting_type: section.meeting_type,
            template_id: section.template_id,
            section_name: section.section_name,
            prompt_text: section.prompt_text,
            sort_order: section.sort_order,
            is_default: section.is_default,
            is_archived: section.is_archived,
          })
        }
      }
    },
    [localSections, upsertSection],
  )

  const handleEditSave = async (name: string, prompt: string) => {
    if (!editingSection) return
    await upsertSection.mutateAsync({
      id: editingSection.id,
      family_id: editingSection.family_id,
      meeting_type: editingSection.meeting_type,
      template_id: editingSection.template_id,
      section_name: name,
      prompt_text: prompt || null,
      sort_order: editingSection.sort_order,
      is_default: editingSection.is_default,
      is_archived: editingSection.is_archived,
    })
    setEditingSection(null)
  }

  const handleAddNew = async (name: string, prompt: string) => {
    const nextOrder = localSections.length > 0
      ? Math.max(...localSections.map(s => s.sort_order)) + 1
      : 0
    await upsertSection.mutateAsync({
      family_id: familyId,
      meeting_type: meetingType,
      template_id: templateId ?? null,
      section_name: name,
      prompt_text: prompt || null,
      sort_order: nextOrder,
      is_default: false,
      is_archived: false,
    })
    setIsAddingNew(false)
  }

  const handleArchive = async (section: MeetingTemplateSection) => {
    await upsertSection.mutateAsync({
      id: section.id,
      family_id: section.family_id,
      meeting_type: section.meeting_type,
      template_id: section.template_id,
      section_name: section.section_name,
      prompt_text: section.prompt_text,
      sort_order: section.sort_order,
      is_default: section.is_default,
      is_archived: true,
    })
    queryClient.invalidateQueries({ queryKey: ['meeting-template-sections', familyId, meetingType] })
  }

  const handleRestore = async (section: MeetingTemplateSection) => {
    const nextOrder = localSections.length > 0
      ? Math.max(...localSections.map(s => s.sort_order)) + 1
      : 0
    await upsertSection.mutateAsync({
      id: section.id,
      family_id: section.family_id,
      meeting_type: section.meeting_type,
      template_id: section.template_id,
      section_name: section.section_name,
      prompt_text: section.prompt_text,
      sort_order: nextOrder,
      is_default: section.is_default,
      is_archived: false,
    })
    queryClient.invalidateQueries({ queryKey: ['meeting-template-sections', familyId, meetingType] })
  }

  return (
    <ModalV2
      id="agenda-section-editor"
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="md"
      title={`Agenda Sections: ${label}`}
      subtitle="Drag to reorder. Sections guide LiLa through the meeting conversation."
    >
      <div className="space-y-4 p-1">
        {isLoading || seedDefaults.isPending ? (
          <div className="flex items-center justify-center py-8 gap-2" style={{ color: 'var(--color-text-tertiary)' }}>
            <Loader2 size={18} className="animate-spin" />
            <span className="text-sm">Loading sections...</span>
          </div>
        ) : (
          <>
            {/* Active sections — drag-to-reorder */}
            {localSections.length === 0 && !isAddingNew ? (
              <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-tertiary)' }}>
                No agenda sections yet. Add one to get started.
              </p>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={localSections.map(s => s.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-1">
                    {localSections.map(section => (
                      editingSection?.id === section.id ? (
                        <SectionEditForm
                          key={section.id}
                          section={editingSection}
                          onSave={handleEditSave}
                          onCancel={() => setEditingSection(null)}
                        />
                      ) : (
                        <SortableSectionRow
                          key={section.id}
                          section={section}
                          onEdit={setEditingSection}
                          onArchive={handleArchive}
                        />
                      )
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            )}

            {/* Add new section */}
            {isAddingNew ? (
              <SectionEditForm
                section={null}
                onSave={handleAddNew}
                onCancel={() => setIsAddingNew(false)}
              />
            ) : (
              <button
                onClick={() => setIsAddingNew(true)}
                className="flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md w-full justify-center"
                style={{ border: '1px dashed var(--color-border-default)', color: 'var(--color-text-secondary)' }}
              >
                <Plus size={16} /> Add Custom Section
              </button>
            )}

            {/* Archived sections */}
            {archivedSections.length > 0 && (
              <div>
                <button
                  onClick={() => setShowArchived(!showArchived)}
                  className="text-xs font-medium flex items-center gap-1"
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  <ArchiveRestore size={12} />
                  {showArchived ? 'Hide' : 'Show'} {archivedSections.length} archived section{archivedSections.length !== 1 ? 's' : ''}
                </button>
                {showArchived && (
                  <div className="mt-2 space-y-1">
                    {archivedSections.map(section => (
                      <div
                        key={section.id}
                        className="flex items-center gap-2 p-3 rounded-lg opacity-60"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate" style={{ color: 'var(--color-text-secondary)' }}>
                            {section.section_name}
                          </p>
                        </div>
                        <button
                          onClick={() => handleRestore(section)}
                          className="px-2 py-1 text-xs rounded-md flex items-center gap-1"
                          style={{ background: 'var(--color-surface-tertiary)', color: 'var(--color-text-secondary)' }}
                        >
                          <ArchiveRestore size={12} /> Restore
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </ModalV2>
  )
}
