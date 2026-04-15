/**
 * ColoringImagePickerModal — Build M Phase 4
 *
 * Browse the coloring reveal library and assign an image to a child.
 * Simplified model: each coloring picture is linked to a specific task.
 * Each completion of that task = one reveal step (1:1 mapping).
 *
 * Config: pick image → pick task → pick step count → pick lineart → assign.
 */

import { useState, useMemo } from 'react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { useColoringRevealLibrary, useMemberColoringReveals } from '@/hooks/useColoringReveals'
import { useCreateColoringReveal } from '@/hooks/useGamificationSettings'
import { useTasks } from '@/hooks/useTasks'
import { useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { coloringImageUrl } from '@/lib/coloringImageUrl'
import type {
  ColoringRevealImage,
  RevealStepCount,
  LineartPreference,
} from '@/types/play-dashboard'
import { Check, ImageIcon, Search, Plus } from 'lucide-react'

const STEP_COUNT_OPTIONS: RevealStepCount[] = [5, 10, 15, 20, 30, 50]
const LINEART_OPTIONS: { value: LineartPreference; label: string }[] = [
  { value: 'simple', label: 'Simple' },
  { value: 'medium', label: 'Medium' },
  { value: 'complex', label: 'Complex' },
]
const FILTER_TABS = ['All', 'Animals', 'Scenes'] as const
type FilterTab = (typeof FILTER_TABS)[number]

interface ColoringImagePickerModalProps {
  isOpen: boolean
  onClose: () => void
  themeId: string
  familyId: string
  familyMemberId: string
  memberName: string
}

export function ColoringImagePickerModal({
  isOpen,
  onClose,
  themeId,
  familyId,
  familyMemberId,
  memberName,
}: ColoringImagePickerModalProps) {
  const [filter, setFilter] = useState<FilterTab>('All')
  const [selectedImage, setSelectedImage] = useState<ColoringRevealImage | null>(null)
  const [selectedTaskId, setSelectedTaskId] = useState<string>('')
  const [stepCount, setStepCount] = useState<RevealStepCount>(10)
  const [lineart, setLineart] = useState<LineartPreference>('medium')
  const [taskSearch, setTaskSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [creatingTask, setCreatingTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')

  const { data: library = [] } = useColoringRevealLibrary(themeId)
  const { data: memberReveals = [] } = useMemberColoringReveals(familyMemberId)
  const { data: tasks = [] } = useTasks(familyId, { assigneeId: familyMemberId })

  const createReveal = useCreateColoringReveal()
  const queryClient = useQueryClient()

  async function handleCreateTask() {
    const title = newTaskTitle.trim()
    if (!title) return
    setCreatingTask(true)
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert({
          family_id: familyId,
          created_by: familyMemberId,
          assignee_id: familyMemberId,
          title,
          task_type: 'task',
          status: 'pending',
          source: 'manual',
        })
        .select('id')
        .single()
      if (error) throw error
      setSelectedTaskId(data.id)
      setNewTaskTitle('')
      await queryClient.invalidateQueries({ queryKey: ['tasks'] })
    } catch {
      // error handled by mutation logging
    }
    setCreatingTask(false)
  }

  const assignedImageIds = useMemo(
    () => new Set(memberReveals.map((r) => r.coloring_image_id)),
    [memberReveals],
  )

  const filtered = useMemo(() => {
    if (filter === 'All') return library
    const cat = filter === 'Animals' ? 'animal' : 'scene'
    return library.filter((img) => img.subject_category === cat)
  }, [library, filter])

  const activeTasks = useMemo(() => {
    return tasks.filter(
      (t) => !t.archived_at && t.status !== 'cancelled' && t.status !== 'completed',
    )
  }, [tasks])

  const filteredTasks = useMemo(() => {
    if (!taskSearch.trim()) return activeTasks
    const q = taskSearch.toLowerCase()
    return activeTasks.filter((t) => t.title.toLowerCase().includes(q))
  }, [activeTasks, taskSearch])

  async function handleAssign() {
    if (!selectedImage || !selectedTaskId) return
    setSaving(true)
    try {
      await createReveal.mutateAsync({
        family_id: familyId,
        family_member_id: familyMemberId,
        coloring_image_id: selectedImage.id,
        reveal_step_count: stepCount,
        earning_task_id: selectedTaskId,
        lineart_preference: lineart,
      })
      setSelectedImage(null)
      setSelectedTaskId('')
      setTaskSearch('')
      onClose()
    } catch {
      // mutation error logging handles this
    }
    setSaving(false)
  }

  return (
    <ModalV2
      id="coloring-image-picker"
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="lg"
      title="Choose a Coloring Picture"
    >
      <div className="space-y-4">
        {/* Filter tabs */}
        <div className="flex gap-2">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className="px-4 py-1.5 rounded-full text-sm font-medium transition-colors"
              style={{
                backgroundColor:
                  filter === tab
                    ? 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, var(--color-bg-card))'
                    : 'var(--color-bg-secondary)',
                color:
                  filter === tab
                    ? 'var(--color-btn-primary-bg)'
                    : 'var(--color-text-secondary)',
                border:
                  filter === tab
                    ? '1.5px solid var(--color-btn-primary-bg)'
                    : '1.5px solid transparent',
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Image grid */}
        {!selectedImage ? (
          <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
            {filtered.map((img) => {
              const isAssigned = assignedImageIds.has(img.id)
              return (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => !isAssigned && setSelectedImage(img)}
                  disabled={isAssigned}
                  className="relative rounded-xl overflow-hidden aspect-square transition-transform"
                  style={{
                    border: '2px solid var(--color-border)',
                    opacity: isAssigned ? 0.5 : 1,
                  }}
                >
                  <img
                    src={coloringImageUrl(img.slug, 'color')}
                    alt={img.display_name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {isAssigned && (
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      style={{ backgroundColor: 'color-mix(in srgb, var(--color-bg-primary) 60%, transparent)' }}
                    >
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: 'var(--color-btn-primary-bg)' }}
                      >
                        <Check size={18} style={{ color: 'var(--color-text-on-primary)' }} />
                      </div>
                    </div>
                  )}
                  <div
                    className="absolute bottom-0 left-0 right-0 px-2 py-1 text-xs truncate"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--color-bg-primary) 80%, transparent)',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    {img.display_name}
                  </div>
                  <div
                    className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-md text-[10px] font-medium"
                    style={{
                      backgroundColor: 'color-mix(in srgb, var(--color-bg-primary) 85%, transparent)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    Up to {img.zone_count} segments
                  </div>
                </button>
              )
            })}

            {filtered.length === 0 && (
              <div className="col-span-3 py-12 text-center">
                <ImageIcon size={32} className="mx-auto mb-2" style={{ color: 'var(--color-text-secondary)', opacity: 0.4 }} />
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  No coloring images available.
                </p>
              </div>
            )}
          </div>
        ) : (
          /* Quick config sheet */
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <img
                src={coloringImageUrl(selectedImage.slug, 'color')}
                alt={selectedImage.display_name}
                className="w-20 h-20 rounded-xl object-cover"
              />
              <div>
                <p className="font-medium text-sm" style={{ color: 'var(--color-text-heading)' }}>
                  {selectedImage.display_name}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  Customizable - Up to {selectedImage.zone_count} segments
                </p>
              </div>
            </div>

            {/* Lineart previews */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Lineart preview
              </label>
              <div className="flex gap-3">
                {LINEART_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setLineart(opt.value)}
                    className="flex flex-col items-center gap-1"
                  >
                    <div
                      className="w-16 h-16 rounded-lg overflow-hidden transition-all"
                      style={{
                        border: lineart === opt.value
                          ? '2px solid var(--color-btn-primary-bg)'
                          : '2px solid var(--color-border)',
                      }}
                    >
                      <img
                        src={coloringImageUrl(selectedImage.slug, `lineart_${opt.value}` as 'lineart_simple' | 'lineart_medium' | 'lineart_complex')}
                        alt={`${opt.label} lineart`}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                    <span
                      className="text-[10px] font-medium"
                      style={{
                        color: lineart === opt.value
                          ? 'var(--color-btn-primary-bg)'
                          : 'var(--color-text-secondary)',
                      }}
                    >
                      {opt.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Linked task */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Which task reveals colors? Each time {memberName} completes it, a new section colors in.
              </label>
              <div className="relative mb-2">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-secondary)' }}
                />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  value={taskSearch}
                  onChange={(e) => setTaskSearch(e.target.value)}
                  className="w-full pl-8 pr-3 py-2 rounded-lg text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                />
              </div>
              <div className="max-h-36 overflow-y-auto space-y-1 rounded-lg p-1" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                {filteredTasks.length === 0 && !taskSearch && (
                  <p className="text-center py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    No active tasks for this member.
                  </p>
                )}
                {filteredTasks.length === 0 && taskSearch && (
                  <p className="text-center py-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    No tasks match.
                  </p>
                )}
                {filteredTasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => setSelectedTaskId(task.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-left text-sm transition-colors"
                    style={{
                      backgroundColor:
                        selectedTaskId === task.id
                          ? 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, var(--color-bg-card))'
                          : 'transparent',
                      color:
                        selectedTaskId === task.id
                          ? 'var(--color-btn-primary-bg)'
                          : 'var(--color-text-primary)',
                    }}
                  >
                    {selectedTaskId === task.id && <Check size={14} style={{ flexShrink: 0 }} />}
                    <span className="truncate">{task.title}</span>
                  </button>
                ))}
              </div>

              {/* Inline task creation */}
              <div className="flex items-center gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Or create a new task..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { e.preventDefault(); handleCreateTask() }
                  }}
                  className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                />
                <button
                  type="button"
                  onClick={handleCreateTask}
                  disabled={!newTaskTitle.trim() || creatingTask}
                  className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, var(--color-bg-card))',
                    color: 'var(--color-btn-primary-bg)',
                  }}
                >
                  <Plus size={14} />
                  {creatingTask ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>

            {/* Step count */}
            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                How many completions to reveal the full picture?
              </label>
              <div className="flex gap-2 flex-wrap">
                {STEP_COUNT_OPTIONS.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setStepCount(n)}
                    className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                    style={{
                      backgroundColor:
                        stepCount === n
                          ? 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, var(--color-bg-card))'
                          : 'var(--color-bg-secondary)',
                      color:
                        stepCount === n
                          ? 'var(--color-btn-primary-bg)'
                          : 'var(--color-text-secondary)',
                      border:
                        stepCount === n
                          ? '1.5px solid var(--color-btn-primary-bg)'
                          : '1.5px solid var(--color-border)',
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Lineart preference — selection is done via the visual previews above */}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <button
                onClick={handleAssign}
                disabled={saving || !selectedTaskId}
                className="flex-1 py-2.5 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-sage-teal)' }}
              >
                {saving ? 'Assigning...' : `Assign to ${memberName}`}
              </button>
              <button
                onClick={() => {
                  setSelectedImage(null)
                  setSelectedTaskId('')
                  setTaskSearch('')
                }}
                className="px-4 py-2.5 rounded-lg text-sm"
                style={{ color: 'var(--color-text-secondary)', backgroundColor: 'var(--color-bg-secondary)' }}
              >
                Back
              </button>
            </div>
          </div>
        )}
      </div>
    </ModalV2>
  )
}
