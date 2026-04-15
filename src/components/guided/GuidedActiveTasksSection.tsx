/**
 * PRD-25: Guided Active Tasks Section ("My Tasks")
 * Two views: Simple List (default) | Now/Next/Optional
 * Task completion triggers celebration animation.
 *
 * Build M Phase 5: Added segment grouping. When segments exist for
 * the member, tasks are grouped under compact SegmentHeader components
 * with progress bars. Unsegmented tasks render in a flat list below.
 * Day-of-week filtering hides segments not scheduled for today.
 */

import { useState, useCallback, useMemo } from 'react'
import { CheckCircle2, Circle, Clock, Star, ChevronDown, ChevronRight, Volume2 } from 'lucide-react'
import { useTasks, useCompleteTask } from '@/hooks/useTasks'
import { useTaskSegments } from '@/hooks/useTaskSegments'
import { useSegmentCompletionStatus } from '@/hooks/useSegmentCompletionStatus'
import { useTaskRandomizerDraws } from '@/hooks/useTaskRandomizerDraws'
import { SegmentHeader } from '@/components/segments/SegmentHeader'
import { isSegmentActiveToday, groupTasksBySegment } from '@/lib/segments/segmentUtils'
import { speak } from '@/utils/speak'
import { RoutineStepChecklist, isSectionActiveToday } from '@/components/tasks/RoutineStepChecklist'
import { useRoutineTemplateSteps } from '@/hooks/useRoutineTemplateSteps'
import { useRoutineStepCompletions, useRoutineStepCompletionsThisWeek } from '@/hooks/useTaskCompletions'
import { todayLocalIso } from '@/utils/dates'
import { filterTasksForToday } from '@/lib/tasks/recurringTaskFilter'
import type { GuidedDashboardPreferences } from '@/types/guided-dashboard'

interface GuidedActiveTasksSectionProps {
  familyId: string
  memberId: string
  preferences: GuidedDashboardPreferences
  readingSupport: boolean
}

export function GuidedActiveTasksSection({
  familyId,
  memberId,
  preferences,
  readingSupport,
}: GuidedActiveTasksSectionProps) {
  const { data: allTasks = [] } = useTasks(familyId, {
    assigneeId: memberId,
  })

  // Filter recurring tasks to only those scheduled for today
  const todaysTasks = useMemo(() => filterTasksForToday(allTasks), [allTasks])
  // Active tasks = pending + in_progress (what's left to do)
  const today = todayLocalIso()
  const tasks = useMemo(
    () => todaysTasks.filter(t => t.status === 'pending' || t.status === 'in_progress'),
    [todaysTasks],
  )
  // Completed today = tasks completed today, shown as a "done" section
  const completedToday = useMemo(
    () => todaysTasks.filter(t => {
      if (t.status !== 'completed' || !t.completed_at) return false
      const d = new Date(t.completed_at)
      const completedLocal = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      return completedLocal === today
    }),
    [todaysTasks, today],
  )
  const completeTask = useCompleteTask()
  const { data: allSegments } = useTaskSegments(memberId)

  const [viewMode, setViewMode] = useState<'simple_list' | 'now_next_optional'>(
    preferences.guided_task_view_default
  )
  const [celebratingId, setCelebratingId] = useState<string | null>(null)
  // Auto-expand all routines by default
  const [expandedRoutines, setExpandedRoutines] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    tasks.filter(t => t.task_type === 'routine').forEach(t => initial.add(t.id))
    return initial
  })

  const handleComplete = useCallback((taskId: string) => {
    setCelebratingId(taskId)
    completeTask.mutate({ taskId, memberId })
    setTimeout(() => setCelebratingId(null), 800)
  }, [completeTask, memberId])

  const toggleRoutine = (taskId: string) => {
    setExpandedRoutines(prev => {
      const next = new Set(prev)
      if (next.has(taskId)) next.delete(taskId)
      else next.add(taskId)
      return next
    })
  }

  // Filter segments to today
  const activeSegments = useMemo(
    () => (allSegments ?? []).filter(isSegmentActiveToday),
    [allSegments],
  )

  // Segment grouping
  const hasSegments = activeSegments.length > 0
  const { segmentGroups, unsegmentedTasks: unsegmented } = useMemo(
    () => groupTasksBySegment(activeSegments, tasks),
    [activeSegments, tasks],
  )
  const segmentStatus = useSegmentCompletionStatus(activeSegments, tasks)

  // Phase 6: fetch today's randomizer draws for tasks with linked_list_id
  const { taskDrawMap } = useTaskRandomizerDraws(tasks, memberId)

  // Separate tasks and opportunities (for non-segment view)
  const regularTasks = tasks.filter(
    t => !t.task_type?.startsWith('opportunity')
  )
  const opportunities = tasks.filter(
    t => t.task_type?.startsWith('opportunity')
  )

  if (tasks.length === 0 && completedToday.length === 0) {
    return (
      <div
        className="p-4 rounded-xl text-center"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
      >
        <p className="text-sm" style={{ color: 'var(--color-text-tertiary)' }}>
          No tasks for today! Ask your mom if there&rsquo;s anything she&rsquo;d like you to
          work on, or enjoy your free time.
        </p>
      </div>
    )
  }

  // Group tasks for Now/Next/Optional view
  const nowTasks = regularTasks.filter(t => t.priority === 'now' || t.status === 'in_progress')
  const nextTasks = regularTasks.filter(t => t.priority === 'next' && t.status !== 'in_progress')
  const optionalTasks = regularTasks.filter(
    t => !nowTasks.includes(t) && !nextTasks.includes(t)
  )

  const renderTask = (task: (typeof tasks)[0]) => {
    const isCelebrating = celebratingId === task.id
    const isRoutine = task.task_type === 'routine'
    const isExpanded = expandedRoutines.has(task.id) || isRoutine // auto-expand routines
    const requiresApproval = task.require_approval
    const draw = taskDrawMap[task.id]

    return (
      <div key={task.id} className="space-y-0">
        <div
          className="flex items-center gap-3 py-2.5 px-3 rounded-lg transition-all"
          style={{
            backgroundColor: isCelebrating
              ? 'color-mix(in srgb, var(--color-accent-warm) 15%, var(--color-bg-card))'
              : 'transparent',
            transform: isCelebrating ? 'scale(1.02)' : 'scale(1)',
          }}
        >
          {/* Routines get a progress ring, non-routines get a completion circle */}
          {isRoutine ? (
            <GuidedRoutineProgressRing taskId={task.id} templateId={task.template_id} memberId={memberId} />
          ) : (
            <button
              onClick={() => handleComplete(task.id)}
              className="shrink-0"
              style={{
                color: isCelebrating
                  ? 'var(--color-accent-warm, #22c55e)'
                  : 'var(--color-text-tertiary)',
                background: 'transparent',
                padding: 0,
                minHeight: 'unset',
                minWidth: 'unset',
              }}
            >
              {isCelebrating ? (
                <CheckCircle2 size={22} style={{ color: 'var(--color-accent-warm, #22c55e)' }} />
              ) : (
                <Circle size={22} />
              )}
            </button>
          )}

          <div
            className="flex-1 min-w-0 cursor-pointer"
            onClick={() => isRoutine && toggleRoutine(task.id)}
          >
            <div className="flex items-center gap-2">
              <span
                className="text-sm truncate"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {task.title}
              </span>
              {readingSupport && (
                <button
                  onClick={(e) => { e.stopPropagation(); speak(task.title) }}
                  className="reading-support-tts p-0.5 rounded shrink-0"
                  style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
                >
                  <Volume2 size={12} />
                </button>
              )}
            </div>
            {draw && (
              <span className="text-xs truncate block" style={{ color: 'var(--color-text-secondary)' }}>
                Today: {draw.itemName}
              </span>
            )}
            {requiresApproval && task.status === 'pending' && (
              <div className="flex items-center gap-1 mt-0.5">
                <Clock size={10} style={{ color: 'var(--color-text-tertiary)' }} />
                <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                  Waiting for Mom
                </span>
              </div>
            )}
          </div>

          {task.points_override && task.points_override > 0 && (
            <span
              className="flex items-center gap-0.5 text-xs shrink-0"
              style={{ color: 'var(--color-accent-warm, #f59e0b)' }}
            >
              <Star size={12} />
              {task.points_override}
            </span>
          )}

          {isRoutine && (
            <button
              onClick={() => toggleRoutine(task.id)}
              style={{ color: 'var(--color-text-tertiary)', background: 'transparent', padding: 0, minHeight: 'unset' }}
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          )}
        </div>

        {/* Routine step checklist — expandable, with linked content resolution */}
        {isRoutine && isExpanded && task.template_id && (
          <div
            className="ml-10 pl-3 py-1 border-l-2"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <RoutineStepChecklist
              taskId={task.id}
              templateId={task.template_id}
              memberId={memberId}
              compact
            />
          </div>
        )}
      </div>
    )
  }

  // ── Segment-grouped rendering ──────────────────────────────────
  if (hasSegments) {
    // Separate unsegmented into regular + opportunities
    const unsegRegular = unsegmented.filter(t => !t.task_type?.startsWith('opportunity'))
    const unsegOpps = unsegmented.filter(t => t.task_type?.startsWith('opportunity'))

    return (
      <div className="space-y-2">
        {segmentGroups.map(({ segment, tasks: segTasks }) => {
          const status = segmentStatus[segment.id]
          return (
            <SegmentHeader
              key={segment.id}
              name={segment.segment_name}
              iconKey={segment.icon_key}
              completedCount={status?.completed ?? 0}
              totalCount={status?.total ?? segTasks.length}
            >
              <div className="space-y-0.5 mt-1">
                {segTasks.map(renderTask)}
              </div>
            </SegmentHeader>
          )
        })}

        {/* Unsegmented tasks */}
        {unsegRegular.length > 0 && (
          <div className="space-y-0.5">
            {segmentGroups.length > 0 && (
              <div
                className="text-xs font-medium uppercase tracking-wider py-2 px-3"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                Other Tasks
              </div>
            )}
            {unsegRegular.map(renderTask)}
          </div>
        )}

        {/* Opportunities */}
        {unsegOpps.length > 0 && (
          <div className="space-y-0.5">
            <div
              className="text-xs font-medium uppercase tracking-wider py-2 px-3"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              Opportunities
            </div>
            {unsegOpps.map(renderTask)}
          </div>
        )}

        {/* Done today */}
        {completedToday.length > 0 && (
          <div className="space-y-0.5">
            <div
              className="text-xs font-medium uppercase tracking-wider py-2 px-3"
              style={{ color: 'var(--color-success, #22c55e)' }}
            >
              Done today ({completedToday.length})
            </div>
            {completedToday.map(task => (
              <div
                key={task.id}
                className="flex items-center gap-3 py-2.5 px-3 rounded-lg"
                style={{ opacity: 0.6 }}
              >
                <CheckCircle2 size={22} style={{ color: 'var(--color-success, #22c55e)', flexShrink: 0 }} />
                <span
                  className="text-sm"
                  style={{ color: 'var(--color-text-secondary)', textDecoration: 'line-through' }}
                >
                  {task.title}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    )
  }

  // ── Flat rendering (no segments) ───────────────────────────────
  return (
    <div className="space-y-3">
      {/* View mode toggle */}
      <div className="flex gap-1 p-0.5 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        <button
          onClick={() => setViewMode('simple_list')}
          className="flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
          style={{
            backgroundColor: viewMode === 'simple_list' ? 'var(--color-bg-card)' : 'transparent',
            color: viewMode === 'simple_list' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            boxShadow: viewMode === 'simple_list' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
          }}
        >
          Simple List
        </button>
        <button
          onClick={() => setViewMode('now_next_optional')}
          className="flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
          style={{
            backgroundColor: viewMode === 'now_next_optional' ? 'var(--color-bg-card)' : 'transparent',
            color: viewMode === 'now_next_optional' ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
            boxShadow: viewMode === 'now_next_optional' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
          }}
        >
          Now / Next / Optional
        </button>
      </div>

      {/* Task list */}
      {viewMode === 'simple_list' ? (
        <div className="space-y-0.5">
          {regularTasks.map(renderTask)}
          {opportunities.length > 0 && (
            <>
              <div
                className="text-xs font-medium uppercase tracking-wider py-2 px-3 mt-2"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                Opportunities
              </div>
              {opportunities.map(renderTask)}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {nowTasks.length > 0 && (
            <div>
              <h4
                className="text-xs font-medium uppercase tracking-wider px-3 mb-1"
                style={{ color: 'var(--color-accent-warm, var(--color-btn-primary-bg))' }}
              >
                Now
              </h4>
              {nowTasks.map(renderTask)}
            </div>
          )}
          {nextTasks.length > 0 && (
            <div>
              <h4
                className="text-xs font-medium uppercase tracking-wider px-3 mb-1"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Next
              </h4>
              {nextTasks.map(renderTask)}
            </div>
          )}
          {optionalTasks.length > 0 && (
            <div>
              <h4
                className="text-xs font-medium uppercase tracking-wider px-3 mb-1"
                style={{ color: 'var(--color-text-tertiary)' }}
              >
                Optional
              </h4>
              {optionalTasks.map(renderTask)}
            </div>
          )}
          {opportunities.length > 0 && (
            <div>
              <h4
                className="text-xs font-medium uppercase tracking-wider px-3 mb-1"
                style={{ color: 'var(--color-accent-warm, #f59e0b)' }}
              >
                Opportunities
              </h4>
              {opportunities.map(renderTask)}
            </div>
          )}
        </div>
      )}

      {/* Done today */}
      {completedToday.length > 0 && (
        <div className="space-y-0.5">
          <div
            className="text-xs font-medium uppercase tracking-wider py-2 px-3"
            style={{ color: 'var(--color-success, #22c55e)' }}
          >
            Done today ({completedToday.length})
          </div>
          {completedToday.map(task => (
            <div
              key={task.id}
              className="flex items-center gap-3 py-2.5 px-3 rounded-lg"
              style={{ opacity: 0.6 }}
            >
              <CheckCircle2 size={22} style={{ color: 'var(--color-success, #22c55e)', flexShrink: 0 }} />
              <span
                className="text-sm"
                style={{ color: 'var(--color-text-secondary)', textDecoration: 'line-through' }}
              >
                {task.title}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

/** Small progress ring for routine tasks in the Guided dashboard */
function GuidedRoutineProgressRing({
  taskId,
  templateId,
  memberId,
}: {
  taskId: string
  templateId: string | null
  memberId: string
}) {
  const { data: sections } = useRoutineTemplateSteps(templateId ?? undefined)
  const { data: completions } = useRoutineStepCompletions(taskId, memberId)
  const { data: weekCompletions } = useRoutineStepCompletionsThisWeek(taskId, memberId)

  const completedIds = new Set((completions ?? []).map(c => c.step_id))
  const weekIds = new Set((weekCompletions ?? []).map(c => c.step_id))
  const activeSections = (sections ?? []).filter(s => isSectionActiveToday(s, completedIds, weekIds))
  const todaySteps = activeSections.flatMap(s => s.steps)
  const done = todaySteps.filter(s => completedIds.has(s.id)).length
  const total = todaySteps.length

  const pct = total > 0 ? done / total : 0
  const r = 9
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - pct)
  const color = pct >= 1
    ? 'var(--color-success, #22c55e)'
    : pct > 0
    ? 'var(--color-btn-primary-bg)'
    : 'var(--color-text-tertiary)'

  return (
    <div className="shrink-0 flex items-center justify-center" style={{ width: 22, height: 22 }}>
      <svg width="22" height="22" viewBox="0 0 22 22">
        <circle cx="11" cy="11" r={r} fill="none" stroke="var(--color-border)" strokeWidth="2" />
        <circle
          cx="11" cy="11" r={r} fill="none"
          stroke={color} strokeWidth="2"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 11 11)"
          style={{ transition: 'stroke-dashoffset 0.3s ease' }}
        />
      </svg>
    </div>
  )
}
