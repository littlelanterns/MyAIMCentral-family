/**
 * PRD-09A: Task Breaker AI — Text + Image Mode
 * Calls the task-breaker Edge Function to decompose a task into subtasks.
 * Text mode: Haiku, Enhanced tier. Image mode: Sonnet vision, Full Magic tier.
 * Three detail levels: quick (3-5), detailed (5-10), granular (10-20).
 * Human-in-the-Mix: user reviews, edits, reorders, removes before applying.
 */

import { useState, useRef } from 'react'
import {
  Zap, ChevronDown, ChevronUp, X, Loader2, Check, Camera, ImageIcon, Trash2,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { useCanAccess } from '@/lib/permissions/useCanAccess'
import type { TaskBreakerLevel } from '@/types/tasks'

interface TaskBreakerProps {
  taskTitle: string
  taskDescription?: string
  lifeAreaTag?: string
  /** Pre-existing image URL from the task (e.g. task.image_url) */
  existingImageUrl?: string
  onApply: (subtasks: BrokenTask[]) => void
  onCancel: () => void
}

export interface BrokenTask {
  title: string
  description?: string
  suggestedAssigneeId?: string
  suggestedAssigneeName?: string
  sortOrder: number
}

const DETAIL_LEVELS: { key: TaskBreakerLevel; label: string; description: string }[] = [
  { key: 'quick', label: 'Quick', description: '3\u20135 high-level steps' },
  { key: 'detailed', label: 'Detailed', description: '5\u201310 steps with descriptions' },
  { key: 'granular', label: 'Granular', description: '10\u201320 micro-steps' },
]

export function TaskBreaker({ taskTitle, taskDescription, lifeAreaTag, existingImageUrl, onApply, onCancel }: TaskBreakerProps) {
  const { data: member } = useFamilyMember()
  const { data: familyMembers } = useFamilyMembers(member?.family_id)
  const { allowed: canUseImageMode } = useCanAccess('tasks_task_breaker_image')
  const [level, setLevel] = useState<TaskBreakerLevel>('detailed')
  const [subtasks, setSubtasks] = useState<BrokenTask[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Image mode state
  const [imageBase64, setImageBase64] = useState<string | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(existingImageUrl ?? null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file.')
      return
    }

    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      setError('Image must be under 10MB.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      setImageBase64(result) // data URI with mime prefix
      setImagePreview(result)
      setError(null)
    }
    reader.readAsDataURL(file)
  }

  function clearImage() {
    setImageBase64(null)
    setImagePreview(existingImageUrl ?? null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const hasImage = !!imageBase64

  async function handleBreakDown() {
    setLoading(true)
    setError(null)

    try {
      const activeMembers = (familyMembers ?? []).filter(m => m.is_active)

      // Fetch active task counts per member for load-balancing suggestions
      let activeTaskCounts: Record<string, number> = {}
      if (activeMembers.length > 0 && member?.family_id) {
        const { data: taskRows } = await supabase
          .from('tasks')
          .select('assignee_id')
          .eq('family_id', member.family_id)
          .in('status', ['pending', 'in_progress'])
          .not('assignee_id', 'is', null)

        if (taskRows) {
          activeTaskCounts = taskRows.reduce<Record<string, number>>((acc, row) => {
            const id = row.assignee_id as string
            acc[id] = (acc[id] || 0) + 1
            return acc
          }, {})
        }
      }

      // For image mode, extract raw base64 from the data URI
      let imagePayload: string | undefined
      let imageMime: string | undefined
      if (imageBase64) {
        const match = imageBase64.match(/^data:([^;]+);base64,(.+)$/)
        if (match) {
          imageMime = match[1]
          imagePayload = match[2]
        } else {
          imagePayload = imageBase64
        }
      }

      const { data, error: fnError } = await supabase.functions.invoke('task-breaker', {
        body: {
          task_title: taskTitle,
          task_description: taskDescription || undefined,
          detail_level: level,
          family_members: activeMembers.map(m => ({
            id: m.id,
            display_name: m.display_name,
            dashboard_mode: m.dashboard_mode,
          })),
          life_area_tag: lifeAreaTag || undefined,
          active_task_count_by_member: activeTaskCounts,
          family_id: member?.family_id,
          member_id: member?.id,
          image_base64: imagePayload,
          image_mime_type: imageMime,
        },
      })

      if (fnError) throw fnError

      // Build member name lookup for display
      const memberNameMap = new Map(activeMembers.map(m => [m.id, m.display_name]))

      const items: BrokenTask[] = Array.isArray(data?.subtasks)
        ? data.subtasks.map((item: {
            title?: string
            description?: string
            suggested_assignee_id?: string
            sort_order?: number
          }, idx: number) => ({
            title: item.title ?? '',
            description: item.description || undefined,
            suggestedAssigneeId: item.suggested_assignee_id || undefined,
            suggestedAssigneeName: item.suggested_assignee_id
              ? memberNameMap.get(item.suggested_assignee_id) || undefined
              : undefined,
            sortOrder: item.sort_order ?? idx + 1,
          }))
        : []

      if (items.length === 0) {
        setError('No subtasks were generated. Try a different detail level or add more description.')
      } else {
        setSubtasks(items)
      }
    } catch (err) {
      setError('Failed to break down task. Please try again.')
      console.error('Task Breaker error:', err)
    } finally {
      setLoading(false)
    }
  }

  function removeSubtask(idx: number) {
    setSubtasks(prev => prev.filter((_, i) => i !== idx))
  }

  function moveSubtask(idx: number, direction: 'up' | 'down') {
    setSubtasks(prev => {
      const arr = [...prev]
      const targetIdx = direction === 'up' ? idx - 1 : idx + 1
      if (targetIdx < 0 || targetIdx >= arr.length) return arr
      ;[arr[idx], arr[targetIdx]] = [arr[targetIdx], arr[idx]]
      return arr
    })
  }

  function editSubtask(idx: number, title: string) {
    setSubtasks(prev => prev.map((s, i) => (i === idx ? { ...s, title } : s)))
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <div className="flex items-center gap-2">
        <Zap size={18} style={{ color: 'var(--color-btn-primary-bg)' }} />
        <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-heading)' }}>
          Task Breaker
        </h3>
      </div>

      {/* Task being broken */}
      <div
        className="px-3 py-2 rounded-lg text-sm"
        style={{
          background: 'var(--color-bg-secondary)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
        }}
      >
        {taskTitle}
      </div>

      {/* Image upload — visible when image mode is available and no results yet */}
      {canUseImageMode && subtasks.length === 0 && (
        <div>
          <label className="text-xs font-medium block mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Photo (optional — snap what needs to be done)
          </label>
          {imagePreview ? (
            <div className="relative inline-block">
              <img
                src={imagePreview}
                alt="Task photo"
                className="w-full max-h-40 object-cover rounded-lg"
                style={{ border: '1px solid var(--color-border)' }}
              />
              <button
                onClick={clearImage}
                className="absolute top-1.5 right-1.5 p-1 rounded-full"
                style={{ background: 'var(--color-bg-primary)', border: '1px solid var(--color-border)' }}
                title="Remove photo"
              >
                <Trash2 size={14} style={{ color: 'var(--color-text-secondary)' }} />
              </button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                style={{
                  background: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <Camera size={14} />
                Take Photo
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs"
                style={{
                  background: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <ImageIcon size={14} />
                Upload
              </button>
            </div>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleImageSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Detail level selector */}
      {subtasks.length === 0 && (
        <>
          <div>
            <label className="text-xs font-medium block mb-2" style={{ color: 'var(--color-text-secondary)' }}>
              Detail Level
            </label>
            <div className="flex gap-2">
              {DETAIL_LEVELS.map(d => (
                <button
                  key={d.key}
                  onClick={() => setLevel(d.key)}
                  className="flex-1 flex flex-col items-center gap-1 px-3 py-2.5 rounded-lg text-xs transition-colors"
                  style={{
                    background: level === d.key
                      ? 'var(--color-btn-primary-bg)'
                      : 'var(--color-bg-secondary)',
                    color: level === d.key
                      ? 'var(--color-btn-primary-text)'
                      : 'var(--color-text-primary)',
                    border: `1px solid ${level === d.key ? 'transparent' : 'var(--color-border)'}`,
                  }}
                >
                  <span className="font-medium">{d.label}</span>
                  <span
                    className="text-[10px]"
                    style={{
                      color: level === d.key ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
                      opacity: level === d.key ? 0.9 : 1,
                    }}
                  >
                    {d.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleBreakDown}
            disabled={loading}
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{
              background: 'var(--gradient-primary, var(--color-btn-primary-bg))',
              color: 'var(--color-btn-primary-text)',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                {hasImage ? 'Analyzing photo...' : 'Breaking down...'}
              </>
            ) : (
              <>
                {hasImage ? <Camera size={16} /> : <Zap size={16} />}
                {hasImage ? 'Break Down Photo' : 'Break It Down'}
              </>
            )}
          </button>

          {error && (
            <p className="text-xs text-center" style={{ color: 'var(--color-error, #e55)' }}>
              {error}
            </p>
          )}
        </>
      )}

      {/* Results: editable subtask list */}
      {subtasks.length > 0 && (
        <>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {subtasks.length} steps generated. Edit, reorder, or remove before applying.
          </p>

          <div className="flex flex-col gap-1.5">
            {subtasks.map((st, idx) => (
              <div
                key={idx}
                className="flex items-center gap-2 px-2 py-2 rounded-lg group"
                style={{
                  background: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div className="flex flex-col gap-0.5">
                  <button
                    onClick={() => moveSubtask(idx, 'up')}
                    disabled={idx === 0}
                    className="p-0.5 disabled:opacity-20"
                  >
                    <ChevronUp size={12} style={{ color: 'var(--color-text-secondary)' }} />
                  </button>
                  <button
                    onClick={() => moveSubtask(idx, 'down')}
                    disabled={idx === subtasks.length - 1}
                    className="p-0.5 disabled:opacity-20"
                  >
                    <ChevronDown size={12} style={{ color: 'var(--color-text-secondary)' }} />
                  </button>
                </div>

                <span className="text-xs w-5 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                  {idx + 1}
                </span>

                <div className="flex-1 min-w-0">
                  <input
                    type="text"
                    value={st.title}
                    onChange={e => editSubtask(idx, e.target.value)}
                    className="w-full text-sm bg-transparent border-none outline-none"
                    style={{ color: 'var(--color-text-primary)' }}
                  />
                  {st.suggestedAssigneeName && (
                    <span className="text-[10px] block" style={{ color: 'var(--color-text-secondary)' }}>
                      Suggested: {st.suggestedAssigneeName}
                    </span>
                  )}
                </div>

                <button
                  onClick={() => removeSubtask(idx)}
                  className="p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X size={14} style={{ color: 'var(--color-text-secondary)' }} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={() => onApply(subtasks)}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium"
              style={{
                background: 'var(--color-btn-primary-bg)',
                color: 'var(--color-btn-primary-text)',
              }}
            >
              <Check size={16} />
              Apply {subtasks.length} Steps
            </button>
            <button
              onClick={() => setSubtasks([])}
              className="px-4 py-2.5 rounded-xl text-sm"
              style={{
                background: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
              }}
            >
              Retry
            </button>
          </div>
        </>
      )}

      <button
        onClick={onCancel}
        className="text-sm py-1"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Cancel
      </button>
    </div>
  )
}
