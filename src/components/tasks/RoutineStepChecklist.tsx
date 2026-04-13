/**
 * PRD-09A: Routine Step Checklist — renders sections + steps for a routine task.
 *
 * Reusable by GuidedActiveTasksSection (child dashboard), TaskCard (adult/teen),
 * and PlayTaskTileGrid (Play shell). Handles:
 *   - Static steps: simple checkbox
 *   - Linked sequential: shows active item from the collection with practice/mastery controls
 *   - Linked randomizer: shows today's drawn item with practice/mastery controls
 *   - Linked task: shows the linked task's current status
 *
 * Uses existing orphan hooks: useRoutineStepCompletions, useCompleteRoutineStep,
 * useUncompleteRoutineStep from useTaskCompletions.ts.
 */

import { useState, useCallback } from 'react'
import {
  Check, Layers, Shuffle, Link2, ExternalLink, ChevronDown, ChevronRight,
  Pencil, Plus, Trash2, X as XIcon,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useRoutineTemplateSteps, type RoutineSection } from '@/hooks/useRoutineTemplateSteps'
import {
  useRoutineStepCompletions,
  useCompleteRoutineStep,
  useUncompleteRoutineStep,
} from '@/hooks/useTaskCompletions'
import { todayLocalIso } from '@/utils/dates'
import type { TaskTemplateStep } from '@/types/tasks'

// ─── Linked content resolvers ───────────────────────────────

function LinkedSequentialContent({ sourceId }: { sourceId: string }) {
  // Lazy-import to avoid circular deps — inline query
  const [data, setData] = useState<{ title: string; resourceUrl?: string } | null>(null)
  const [loaded, setLoaded] = useState(false)

  if (!loaded) {
    setLoaded(true)
    // Fire once — query the active sequential item
    import('@/lib/supabase/client').then(({ supabase }) => {
      supabase
        .from('tasks')
        .select('title, resource_url')
        .eq('sequential_collection_id', sourceId)
        .eq('sequential_is_active', true)
        .limit(1)
        .single()
        .then(({ data: row }) => {
          if (row) setData({ title: row.title, resourceUrl: row.resource_url ?? undefined })
        })
    })
  }

  if (!data) {
    return (
      <span className="text-xs italic" style={{ color: 'var(--color-text-secondary)' }}>
        Loading...
      </span>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <Layers size={10} style={{ color: 'var(--color-text-secondary)' }} />
      <span className="text-xs" style={{ color: 'var(--color-text-primary)' }}>
        {data.title}
      </span>
      {data.resourceUrl && (
        <a
          href={data.resourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="shrink-0"
          onClick={e => e.stopPropagation()}
        >
          <ExternalLink size={10} style={{ color: 'var(--color-text-secondary)' }} />
        </a>
      )}
    </div>
  )
}

function LinkedRandomizerContent({ sourceId, memberId }: { sourceId: string; memberId: string }) {
  const [data, setData] = useState<{ itemName: string } | null>(null)
  const [loaded, setLoaded] = useState(false)

  if (!loaded) {
    setLoaded(true)
    import('@/lib/supabase/client').then(({ supabase }) => {
      const today = todayLocalIso()
      supabase
        .from('randomizer_draws')
        .select('list_items!inner(content)')
        .eq('list_id', sourceId)
        .eq('family_member_id', memberId)
        .eq('routine_instance_date', today)
        .in('status', ['active', 'drawn'])
        .limit(1)
        .single()
        .then(({ data: row }) => {
          const content = (row as unknown as { list_items: { content: string } })?.list_items?.content
          if (content) setData({ itemName: content })
        })
    })
  }

  if (!data) {
    return (
      <span className="text-xs italic" style={{ color: 'var(--color-text-secondary)' }}>
        Drawing...
      </span>
    )
  }

  return (
    <div className="flex items-center gap-1.5">
      <Shuffle size={10} style={{ color: 'var(--color-text-secondary)' }} />
      <span className="text-xs" style={{ color: 'var(--color-text-primary)' }}>
        {data.itemName}
      </span>
    </div>
  )
}

function LinkedTaskContent({ sourceId }: { sourceId: string }) {
  const [data, setData] = useState<{ title: string; status: string } | null>(null)
  const [loaded, setLoaded] = useState(false)

  if (!loaded) {
    setLoaded(true)
    import('@/lib/supabase/client').then(({ supabase }) => {
      supabase
        .from('tasks')
        .select('title, status')
        .eq('id', sourceId)
        .single()
        .then(({ data: row }) => {
          if (row) setData({ title: row.title, status: row.status })
        })
    })
  }

  if (!data) return null

  return (
    <div className="flex items-center gap-1.5">
      <Link2 size={10} style={{ color: 'var(--color-text-secondary)' }} />
      <span className="text-xs" style={{ color: 'var(--color-text-primary)' }}>
        {data.title}
      </span>
    </div>
  )
}

// ─── Step Row ───────────────────────────────────────────────

function StepRow({
  step,
  taskId: _taskId,
  memberId,
  isCompleted,
  onToggle,
  toggling,
}: {
  step: TaskTemplateStep
  taskId: string
  memberId: string
  isCompleted: boolean
  onToggle: () => void
  toggling: boolean
}) {
  const isLinked = step.step_type !== 'static' && step.step_type != null
  const displayName = step.display_name_override || step.title

  return (
    <div
      className="flex items-start gap-2 py-1.5 group"
      style={{ opacity: toggling ? 0.5 : 1 }}
    >
      {/* Checkbox */}
      <button
        onClick={onToggle}
        disabled={toggling}
        className="shrink-0 mt-0.5 flex items-center justify-center rounded transition-colors"
        style={{
          width: '18px',
          height: '18px',
          border: `1.5px solid ${isCompleted ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
          backgroundColor: isCompleted ? 'var(--color-btn-primary-bg)' : 'transparent',
          minHeight: 'unset',
        }}
      >
        {isCompleted && <Check size={12} style={{ color: 'var(--color-btn-primary-text)' }} />}
      </button>

      <div className="flex-1 min-w-0">
        {/* Step title */}
        <span
          className="text-xs leading-snug"
          style={{
            color: isCompleted ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
            textDecoration: isCompleted ? 'line-through' : 'none',
          }}
        >
          {displayName}
        </span>

        {/* Linked content — shows the active item from the source */}
        {isLinked && !isCompleted && (
          <div className="mt-0.5 ml-0.5">
            {step.step_type === 'linked_sequential' && step.linked_source_id && (
              <LinkedSequentialContent sourceId={step.linked_source_id} />
            )}
            {step.step_type === 'linked_randomizer' && step.linked_source_id && (
              <LinkedRandomizerContent sourceId={step.linked_source_id} memberId={memberId} />
            )}
            {step.step_type === 'linked_task' && step.linked_source_id && (
              <LinkedTaskContent sourceId={step.linked_source_id} />
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Section Group ──────────────────────────────────────────

function SectionGroup({
  section,
  taskId,
  memberId,
  completedStepIds,
  onToggleStep,
  togglingStepId,
  canEdit,
  onStepsChanged,
}: {
  section: RoutineSection
  taskId: string
  memberId: string
  completedStepIds: Set<string>
  onToggleStep: (stepId: string, completed: boolean) => void
  togglingStepId: string | null
  canEdit: boolean
  onStepsChanged: () => void
}) {
  const [expanded, setExpanded] = useState(true)
  const [editing, setEditing] = useState(false)
  const [editSteps, setEditSteps] = useState<{ id: string; title: string }[]>([])
  const [saving, setSaving] = useState(false)
  const [newStepTitle, setNewStepTitle] = useState('')
  const completedCount = section.steps.filter(s => completedStepIds.has(s.id)).length
  const totalCount = section.steps.length

  const isActiveToday = isSectionActiveToday(section, completedStepIds)
  if (!isActiveToday) return null

  const startEditing = () => {
    setEditSteps(section.steps.map(s => ({ id: s.id, title: s.display_name_override || s.title })))
    setEditing(true)
    setExpanded(true)
  }

  const saveEdits = async () => {
    setSaving(true)
    try {
      // Update existing steps
      for (const step of editSteps) {
        const original = section.steps.find(s => s.id === step.id)
        if (original && (original.title !== step.title)) {
          await supabase.from('task_template_steps')
            .update({ title: step.title, step_name: step.title })
            .eq('id', step.id)
        }
      }
      // Delete removed steps
      const editIds = new Set(editSteps.map(s => s.id))
      for (const step of section.steps) {
        if (!editIds.has(step.id)) {
          await supabase.from('task_template_steps').delete().eq('id', step.id)
        }
      }
      onStepsChanged()
    } finally {
      setSaving(false)
      setEditing(false)
    }
  }

  const addStep = async () => {
    if (!newStepTitle.trim()) return
    setSaving(true)
    try {
      const maxOrder = Math.max(0, ...section.steps.map(s => s.sort_order ?? 0))
      await supabase.from('task_template_steps').insert({
        section_id: section.id,
        title: newStepTitle.trim(),
        step_name: newStepTitle.trim(),
        sort_order: maxOrder + 1,
      })
      setNewStepTitle('')
      onStepsChanged()
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div className="flex items-center gap-1.5 w-full py-1">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 flex-1 text-left"
          style={{ minHeight: 'unset' }}
        >
          {expanded
            ? <ChevronDown size={12} style={{ color: 'var(--color-text-secondary)' }} />
            : <ChevronRight size={12} style={{ color: 'var(--color-text-secondary)' }} />
          }
          <span
            className="text-[11px] font-medium uppercase tracking-wide"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {section.title}
          </span>
        </button>
        <span
          className="text-[10px]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {completedCount}/{totalCount}
        </span>
        {canEdit && !editing && (
          <button
            onClick={startEditing}
            className="p-0.5 rounded opacity-0 group-hover:opacity-60 hover:opacity-100! transition-opacity"
            style={{ minHeight: 'unset', color: 'var(--color-text-secondary)' }}
            title="Edit steps"
          >
            <Pencil size={11} />
          </button>
        )}
      </div>

      {expanded && !editing && (
        <div className="pl-1">
          {section.steps.map(step => (
            <StepRow
              key={step.id}
              step={step}
              taskId={taskId}
              memberId={memberId}
              isCompleted={completedStepIds.has(step.id)}
              onToggle={() => onToggleStep(step.id, completedStepIds.has(step.id))}
              toggling={togglingStepId === step.id}
            />
          ))}
        </div>
      )}

      {/* Inline edit mode */}
      {expanded && editing && (
        <div className="pl-1 space-y-1 py-1">
          {editSteps.map((step, idx) => (
            <div key={step.id} className="flex items-center gap-1.5">
              <input
                type="text"
                value={step.title}
                onChange={e => {
                  const next = [...editSteps]
                  next[idx] = { ...step, title: e.target.value }
                  setEditSteps(next)
                }}
                className="flex-1 text-xs px-2 py-1 rounded"
                style={{
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-primary)',
                  minHeight: 'unset',
                }}
              />
              <button
                onClick={() => setEditSteps(editSteps.filter((_, i) => i !== idx))}
                className="p-0.5 rounded"
                style={{ minHeight: 'unset', color: 'var(--color-text-secondary)' }}
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
          {/* Add new step inline */}
          <div className="flex items-center gap-1.5 mt-1">
            <input
              type="text"
              value={newStepTitle}
              onChange={e => setNewStepTitle(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter') addStep() }}
              placeholder="Add a step..."
              className="flex-1 text-xs px-2 py-1 rounded"
              style={{
                border: '1px dashed var(--color-border)',
                backgroundColor: 'transparent',
                color: 'var(--color-text-primary)',
                minHeight: 'unset',
              }}
            />
            <button
              onClick={addStep}
              disabled={!newStepTitle.trim()}
              className="p-0.5 rounded"
              style={{ minHeight: 'unset', color: 'var(--color-btn-primary-bg)', opacity: newStepTitle.trim() ? 1 : 0.3 }}
            >
              <Plus size={14} />
            </button>
          </div>
          {/* Save / Cancel */}
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={saveEdits}
              disabled={saving}
              className="text-[11px] font-medium px-2 py-0.5 rounded"
              style={{
                backgroundColor: 'var(--color-btn-primary-bg)',
                color: 'var(--color-btn-primary-text)',
                minHeight: 'unset',
                opacity: saving ? 0.5 : 1,
              }}
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => setEditing(false)}
              className="text-[11px] px-2 py-0.5 rounded"
              style={{ color: 'var(--color-text-secondary)', minHeight: 'unset' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/** Check if a routine section should display today based on its frequency rule */
function isSectionActiveToday(section: RoutineSection, completedStepIds: Set<string>): boolean {
  if (!section.frequency_rule || section.frequency_rule === 'daily') return true

  const today = new Date().getDay() // 0=Sun, 6=Sat
  const days = section.frequency_days?.map(Number) ?? []

  // 'custom' frequency — show on listed days, OR carry forward after the scheduled day if show_until_complete
  if (section.frequency_rule === 'custom' && days.length) {
    const isScheduledToday = days.includes(today)
    if (isScheduledToday) return true

    // show_until_complete: show AFTER the scheduled day(s) until all steps are done.
    // Only carry forward if today is past the latest scheduled day this week.
    if (section.show_until_complete) {
      const allDone = section.steps.every(s => completedStepIds.has(s.id))
      if (allDone) return false

      // Check if today is AFTER any of the scheduled days this week
      // e.g., Monday section (day 1) should carry forward to Tue-Sat (days 2-6)
      // but NOT show on Sunday (day 0) before Monday arrives
      const earliestDay = Math.min(...days)
      return today > earliestDay
    }
    return false
  }

  // Legacy 'specific_days' (shouldn't appear but handle gracefully)
  if (section.frequency_rule === 'specific_days' && days.length) {
    return days.includes(today)
  }

  return true
}

// ─── Main Component ─────────────────────────────────────────

interface RoutineStepChecklistProps {
  taskId: string
  templateId: string
  memberId: string
  /** Compact mode hides section headers when there's only one section */
  compact?: boolean
}

export function RoutineStepChecklist({ taskId, templateId, memberId, compact }: RoutineStepChecklistProps) {
  const { data: sections, isLoading } = useRoutineTemplateSteps(templateId)
  const { data: completions } = useRoutineStepCompletions(taskId, memberId)
  const completeStep = useCompleteRoutineStep()
  const uncompleteStep = useUncompleteRoutineStep()
  const [togglingStepId, setTogglingStepId] = useState<string | null>(null)
  const { data: currentMember } = useFamilyMember()
  const queryClient = useQueryClient()
  const canEdit = currentMember?.role === 'primary_parent' || currentMember?.role === 'additional_adult'
  const refreshSteps = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['routine-template-steps', templateId] })
  }, [queryClient, templateId])

  if (isLoading) {
    return (
      <div className="py-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        Loading steps...
      </div>
    )
  }

  if (!sections?.length) {
    return (
      <div className="py-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        No steps configured
      </div>
    )
  }

  const completedStepIds = new Set(
    (completions ?? []).map(c => c.step_id),
  )

  async function handleToggleStep(stepId: string, isCurrentlyCompleted: boolean) {
    setTogglingStepId(stepId)
    try {
      if (isCurrentlyCompleted) {
        await uncompleteStep.mutateAsync({
          taskId,
          stepId,
          memberId,
        })
      } else {
        await completeStep.mutateAsync({
          task_id: taskId,
          step_id: stepId,
          member_id: memberId,
          period_date: todayLocalIso(),
        })
      }
    } catch (err) {
      console.error('Failed to toggle step:', err)
    } finally {
      setTogglingStepId(null)
    }
  }

  // Filter to sections active today
  const activeSections = sections.filter(s => isSectionActiveToday(s, completedStepIds))
  const showHeaders = !compact || activeSections.length > 1

  if (activeSections.length === 0) {
    return (
      <div className="py-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        No steps for today
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-1">
      {activeSections.map(section => (
        showHeaders ? (
          <SectionGroup
            key={section.id}
            section={section}
            taskId={taskId}
            memberId={memberId}
            completedStepIds={completedStepIds}
            onToggleStep={handleToggleStep}
            togglingStepId={togglingStepId}
            canEdit={!!canEdit}
            onStepsChanged={refreshSteps}
          />
        ) : (
          // Single section, compact mode — just render steps without header
          <div key={section.id}>
            {section.steps.map(step => (
              <StepRow
                key={step.id}
                step={step}
                taskId={taskId}
                memberId={memberId}
                isCompleted={completedStepIds.has(step.id)}
                onToggle={() => handleToggleStep(step.id, completedStepIds.has(step.id))}
                toggling={togglingStepId === step.id}
              />
            ))}
          </div>
        )
      ))}
    </div>
  )
}
