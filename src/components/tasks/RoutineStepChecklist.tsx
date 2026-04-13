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

import { useState } from 'react'
import {
  Check, Circle, Layers, Shuffle, Link2, ExternalLink, ChevronDown, ChevronRight,
} from 'lucide-react'
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
  taskId,
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
}: {
  section: RoutineSection
  taskId: string
  memberId: string
  completedStepIds: Set<string>
  onToggleStep: (stepId: string, completed: boolean) => void
  togglingStepId: string | null
}) {
  const [expanded, setExpanded] = useState(true)
  const completedCount = section.steps.filter(s => completedStepIds.has(s.id)).length
  const totalCount = section.steps.length

  // Check if this section should show today based on frequency_rule + frequency_days
  const isActiveToday = isSectionActiveToday(section)
  if (!isActiveToday) return null

  return (
    <div>
      {/* Section header — only show if more than one section */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 w-full py-1 text-left"
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
        <span
          className="text-[10px] ml-auto"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {completedCount}/{totalCount}
        </span>
      </button>

      {expanded && (
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
    </div>
  )
}

/** Check if a routine section should display today based on its frequency rule */
function isSectionActiveToday(section: RoutineSection): boolean {
  if (!section.frequency_rule || section.frequency_rule === 'daily') return true

  const today = new Date().getDay() // 0=Sun, 6=Sat
  const days = section.frequency_days

  if (section.frequency_rule === 'specific_days' && days?.length) {
    return days.includes(today)
  }

  // show_until_complete: always show (weekly/monthly sections that persist until done)
  if (section.frequency_rule === 'show_until_complete') return true

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
  const activeSections = sections.filter(isSectionActiveToday)
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
