/**
 * TaskCard — PRD-09A
 *
 * Renders a single task across all adult/independent views.
 * Features:
 * - Animated checkbox with sparkle on completion
 * - Title, description snippet, due date, assignee avatar
 * - Status badges (pending, in_progress, completed, pending_approval)
 * - Type indicator (task/routine/opportunity/habit/sequential)
 * - Life area tag pill
 * - Long-press context menu: Edit, Focus Timer, Break It Down, Assign, Delete
 */

import { useState, useRef, useCallback } from 'react'
import {
  Circle,
  CheckCircle2,
  Clock,
  Pause,
  MoreVertical,
  Edit2,
  Timer,
  Zap,
  UserPlus,
  Trash2,
  CalendarDays,
  Tag,
  Repeat,
  Star,
  Briefcase,
  BookOpen,
  ChevronRight,
  Play,
  Square,
  GripVertical,
  StickyNote,
  Loader2,
  GraduationCap,
  ExternalLink,
  EyeOff,
} from 'lucide-react'
import { Badge } from '@/components/shared'
import { useTimerContext } from '@/features/timer'
import { useCanAccess } from '@/lib/permissions/useCanAccess'
import { supabase } from '@/lib/supabase/client'
import { TaskCompletionExpander } from './TaskCompletionExpander'
import { RoutineStepChecklist, isSectionActiveToday } from './RoutineStepChecklist'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useArchiveTask } from '@/hooks/useTasks'
import { useRoutineTemplateSteps } from '@/hooks/useRoutineTemplateSteps'
import { useRoutineStepCompletions, useRoutineStepCompletionsThisWeek } from '@/hooks/useTaskCompletions'
import type { Task } from '@/hooks/useTasks'

/** Tiny SVG progress ring for routine cards — replaces the completion checkbox */
function RoutineProgressRing({ completed, total }: { completed: number; total: number }) {
  const pct = total > 0 ? completed / total : 0
  const r = 8
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - pct)
  const color = pct >= 1
    ? 'var(--color-success, #22c55e)'
    : pct > 0
    ? 'var(--color-btn-primary-bg)'
    : 'var(--color-text-secondary)'

  return (
    <div className="shrink-0 mt-0.5 flex items-center justify-center" style={{ width: 20, height: 20 }}>
      <svg width="20" height="20" viewBox="0 0 20 20">
        <circle cx="10" cy="10" r={r} fill="none" stroke="var(--color-border)" strokeWidth="2" />
        <circle
          cx="10" cy="10" r={r} fill="none"
          stroke={color} strokeWidth="2"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform="rotate(-90 10 10)"
          style={{ transition: 'stroke-dashoffset 0.3s ease' }}
        />
        {pct >= 1 && (
          <polyline points="6,10.5 9,13.5 14,7.5" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
        )}
      </svg>
    </div>
  )
}

export interface TaskCardProps {
  task: Task
  isCompleting?: boolean
  onToggle: (task: Task, origin?: { x: number; y: number }, extras?: { completionNote?: string | null; photoUrl?: string | null }) => void
  onEdit?: (task: Task) => void
  onFocusTimer?: (task: Task) => void
  onBreakItDown?: (task: Task) => void
  onAssign?: (task: Task) => void
  onDelete?: (task: Task) => void
  /** Show assignee avatar/name — used in By Member view */
  showAssignee?: boolean
  /** Compact layout for list views */
  compact?: boolean
  /** Props from @dnd-kit useSortable for drag handle — renders GripVertical icon */
  dragHandleProps?: Record<string, unknown>
  /** Build J: log a practice session (practice_count or mastery mode) */
  onLogPractice?: (task: Task) => void
  /** Build J: open the mastery submission modal */
  onSubmitMastery?: (task: Task) => void
  /** Today's randomizer draw subtitle (e.g. drawn activity name) */
  drawSubtitle?: string | null
  /** Assignee display name — shown as small colored pill on task card */
  assigneeName?: string | null
  /** Assignee resolved color (hex) */
  assigneeColor?: string | null
}

const TASK_TYPE_ICONS: Record<string, typeof Circle> = {
  task: CheckCircle2,
  routine: Repeat,
  opportunity_repeatable: Star,
  opportunity_claimable: Briefcase,
  opportunity_capped: Briefcase,
  habit: Zap,
  sequential: BookOpen,
  opportunity: Star,
}

const TASK_TYPE_LABELS: Record<string, string> = {
  task: 'Task',
  routine: 'Routine',
  opportunity_repeatable: 'Repeatable',
  opportunity_claimable: 'Claimable',
  opportunity_capped: 'Capped',
  habit: 'Habit',
  sequential: 'Sequential',
  opportunity: 'Opportunity',
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'default',
  in_progress: 'info',
  completed: 'success',
  pending_approval: 'warning',
  cancelled: 'error',
  paused: 'default',
}

const PRIORITY_COLORS: Record<string, string> = {
  now: 'error',
  next: 'warning',
  optional: 'info',
  someday: 'default',
}

export function TaskCard({
  task,
  isCompleting = false,
  onToggle,
  onEdit,
  onFocusTimer,
  onBreakItDown,
  onAssign,
  onDelete,
  showAssignee: _showAssignee = false,
  compact = false,
  dragHandleProps,
  onLogPractice: _onLogPractice,
  onSubmitMastery,
  drawSubtitle,
  assigneeName,
  assigneeColor,
}: TaskCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [isPressed, _setIsPressed] = useState(false)
  const [showExpander, setShowExpander] = useState(false)
  const [routineExpanded, setRoutineExpanded] = useState(false)
  const { data: currentMember } = useFamilyMember()
  const archiveTask = useArchiveTask()

  // "Remove from dashboard" — soft-deletes the task so it stops appearing on
  // the assignee's dashboard. Completion history and allowance points already
  // accrued remain in task_completions untouched. Additive, never punitive.
  const handleRemoveFromDashboard = useCallback(() => {
    const confirmText = task.task_type === 'routine'
      ? `Remove "${task.title}" from the dashboard? Points already earned stay — the routine just stops appearing. The template stays so you can redeploy it later.`
      : `Remove "${task.title}" from the dashboard? Points already earned stay — the task just stops appearing.`
    if (!window.confirm(confirmText)) return
    archiveTask.mutate(task.id)
  }, [archiveTask, task.id, task.task_type, task.title])

  // Routine progress — compute today's step completion % for the progress ring
  const isRoutine = task.task_type === 'routine'
  const routineMemberId = isRoutine ? (task.assignee_id ?? currentMember?.id) : undefined
  const { data: routineSections } = useRoutineTemplateSteps(isRoutine ? task.template_id ?? undefined : undefined)
  const { data: routineCompletions } = useRoutineStepCompletions(
    isRoutine ? task.id : undefined,
    routineMemberId,
  )
  const { data: routineWeekCompletions } = useRoutineStepCompletionsThisWeek(
    isRoutine ? task.id : undefined,
    routineMemberId,
  )
  const routineProgress = (() => {
    if (!isRoutine || !routineSections?.length) return { completed: 0, total: 0 }
    const completedIds = new Set((routineCompletions ?? []).map(c => c.step_id))
    const weekIds = new Set((routineWeekCompletions ?? []).map(c => c.step_id))
    const activeSections = routineSections.filter(s => isSectionActiveToday(s, completedIds, weekIds))
    const todaySteps = activeSections.flatMap(s => s.steps)
    const done = todaySteps.filter(s => completedIds.has(s.id)).length
    return { completed: done, total: todaySteps.length }
  })()

  const [pendingOrigin, setPendingOrigin] = useState<{ x: number; y: number } | undefined>()
  const [showNoteInput, setShowNoteInput] = useState(false)
  const [pendingNote, setPendingNote] = useState('')
  const [savingNote, setSavingNote] = useState(false)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const checkboxRef = useRef<HTMLButtonElement | null>(null)

  // Timer integration (PRD-36)
  const timerCtx = useTimerContext()
  const { allowed: canUseClock } = useCanAccess('timer_basic')
  const { allowed: canUsePomodoro } = useCanAccess('timer_advanced')

  const hasTimeTracking = !!(task as unknown as Record<string, unknown>).time_tracking_enabled
  const activeTimerForTask = hasTimeTracking
    ? timerCtx.activeTimers.find((t) => t.session.task_id === task.id)
    : undefined

  const isCompleted = task.status === 'completed'
  const isPendingApproval = task.status === 'pending_approval'
  const isInProgress = task.status === 'in_progress'
  const TypeIcon = TASK_TYPE_ICONS[task.task_type] ?? CheckCircle2

  // Build J: advancement mode derived state (sequential tasks only)
  const isSequential = task.task_type === 'sequential'
  const advancementMode = (task as unknown as { advancement_mode?: string }).advancement_mode ?? 'complete'
  const practiceCount = (task as unknown as { practice_count?: number }).practice_count ?? 0
  const practiceTarget = (task as unknown as { practice_target?: number | null }).practice_target ?? null
  const masteryStatus = (task as unknown as { mastery_status?: string | null }).mastery_status ?? null
  const resourceUrl = (task as unknown as { resource_url?: string | null }).resource_url ?? null

  let advancementSubtitle: string | null = null
  if (isSequential && !isCompleted) {
    if (advancementMode === 'practice_count' && practiceTarget != null) {
      advancementSubtitle = `${practiceCount}/${practiceTarget} practices`
    } else if (advancementMode === 'mastery') {
      if (masteryStatus === 'submitted') {
        advancementSubtitle = `Submitted for mastery — awaiting approval`
      } else if (masteryStatus === 'approved') {
        advancementSubtitle = `Mastered`
      } else {
        advancementSubtitle = `Practiced ${practiceCount} ${practiceCount === 1 ? 'time' : 'times'}`
      }
    }
  }

  const showMasteryButton =
    isSequential &&
    advancementMode === 'mastery' &&
    (masteryStatus === null || masteryStatus === 'practicing' || masteryStatus === 'rejected') &&
    !isCompleted

  // Long-press to open context menu
  const handlePressStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setShowMenu(true)
    }, 500)
  }, [])

  const handlePressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  const handleCheckboxClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation()
    if (isCompleting) return

    const rect = e.currentTarget.getBoundingClientRect()
    const origin = {
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    }

    // If uncompleting, toggle immediately
    if (isCompleted) {
      onToggle(task, origin)
      return
    }

    // For tasks requiring approval, show the expander (note needed for review)
    if (task.require_approval) {
      setPendingOrigin(origin)
      setShowExpander(true)
      return
    }

    // For normal tasks, complete immediately — include any pending note
    onToggle(task, origin, {
      completionNote: pendingNote.trim() || null,
    })
    setPendingNote('')
    setShowNoteInput(false)
  }

  const handleExpanderConfirm = (extras: { completionNote?: string | null; photoUrl?: string | null }) => {
    setShowExpander(false)
    onToggle(task, pendingOrigin, extras)
  }

  const handleExpanderCancel = () => {
    setShowExpander(false)
    setPendingOrigin(undefined)
  }

  const handleNoteToggle = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!showNoteInput && isCompleted && task.completion_note) {
      setPendingNote(task.completion_note)
    }
    setShowNoteInput(!showNoteInput)
  }

  const handleSaveNote = async () => {
    if (!pendingNote.trim()) return
    setSavingNote(true)
    try {
      const { data: latest } = await supabase
        .from('task_completions')
        .select('id')
        .eq('task_id', task.id)
        .order('completed_at', { ascending: false })
        .limit(1)

      if (latest?.[0]) {
        await supabase
          .from('task_completions')
          .update({ completion_note: pendingNote.trim() })
          .eq('id', latest[0].id)
      }
      setShowNoteInput(false)
    } finally {
      setSavingNote(false)
    }
  }

  const handleMenuAction = (action: () => void) => {
    setShowMenu(false)
    action()
  }

  // Routines never render a due date or overdue styling — they are recurring
  // and missed days feed allowance tracking, not guilt. Only one-time tasks
  // with an explicitly-set due_date surface that metadata.
  const showDueDate = !isRoutine && !!task.due_date

  const dueDateFormatted = showDueDate
    ? new Date(task.due_date + 'T00:00:00').toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : null

  const isDueSoon = showDueDate
    ? new Date(task.due_date + 'T00:00:00') <= new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    : false

  const isOverdue = showDueDate
    ? new Date(task.due_date + 'T00:00:00') < new Date(new Date().toDateString())
    : false

  return (
    <div
      className="relative"
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      onMouseLeave={handlePressEnd}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
    >
      <div
        className="flex items-start gap-3 rounded-lg transition-all"
        style={{
          padding: compact ? '0.5rem 0.75rem' : '0.75rem',
          backgroundColor: isCompleted
            ? 'color-mix(in srgb, var(--color-bg-card) 70%, transparent)'
            : 'var(--color-bg-card)',
          border: isPressed
            ? '1px solid var(--color-btn-primary-bg)'
            : '1px solid var(--color-border)',
          opacity: isCompleted ? 0.7 : 1,
          borderRadius: 'var(--vibe-radius-card, 0.5rem)',
        }}
      >
        {/* Drag handle — only rendered when dragHandleProps is provided */}
        {dragHandleProps && (
          <button
            {...dragHandleProps}
            className="shrink-0 mt-0.5 cursor-grab active:cursor-grabbing touch-none"
            style={{
              color: 'var(--color-text-secondary)',
              opacity: 0.4,
              padding: 0,
              background: 'none',
              border: 'none',
            }}
            aria-label="Drag to reorder"
          >
            <GripVertical size={16} />
          </button>
        )}

        {/* Routines get a progress ring instead of a completion checkbox */}
        {isRoutine && task.template_id && (
          <RoutineProgressRing completed={routineProgress.completed} total={routineProgress.total} />
        )}

        {/* Checkbox — hidden for routines (routines auto-complete via step progress) */}
        {!isRoutine && (
          <button
            ref={checkboxRef}
            onClick={handleCheckboxClick}
            disabled={isCompleting}
            className="shrink-0 mt-0.5 transition-all"
            style={{
              width: 20,
              height: 20,
              color: isCompleted
                ? 'var(--color-success, #22c55e)'
                : isInProgress
                ? 'var(--color-info, #3b82f6)'
                : isPendingApproval
                ? 'var(--color-warning, #f59e0b)'
                : 'var(--color-text-secondary)',
              opacity: isCompleting ? 0.5 : 1,
              cursor: isCompleting ? 'wait' : 'pointer',
            }}
            aria-label={isCompleted ? 'Mark incomplete' : 'Mark complete'}
          >
            {isCompleted ? (
              <CheckCircle2 size={20} />
            ) : isInProgress ? (
              <Clock size={20} />
            ) : isPendingApproval ? (
              <Pause size={20} />
            ) : (
              <Circle size={20} />
            )}
          </button>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            {/* Task type icon (small) */}
            <TypeIcon
              size={13}
              style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }}
            />
            {/* Title */}
            <p
              className="text-sm font-medium truncate"
              style={{
                color: isCompleted
                  ? 'var(--color-text-secondary)'
                  : 'var(--color-text-primary)',
                textDecoration: isCompleted ? 'line-through' : 'none',
              }}
            >
              {task.title}
            </p>
          </div>

          {/* Routine step indicator — clickable to expand checklist */}
          {isRoutine && !isCompleted && (
            <button
              onClick={(e) => { e.stopPropagation(); setRoutineExpanded(!routineExpanded) }}
              className="inline-flex items-center gap-1 text-[11px] mt-0.5 font-medium"
              style={{ color: 'var(--color-text-secondary)', background: 'transparent', border: 'none', padding: 0, minHeight: 'unset', cursor: 'pointer' }}
            >
              <Repeat size={10} />
              {routineProgress.total > 0
                ? `${routineProgress.completed}/${routineProgress.total} today`
                : 'Routine'}
              {task.template_id && (routineExpanded
                ? <ChevronRight size={10} style={{ transform: 'rotate(90deg)', transition: 'transform 0.15s' }} />
                : <ChevronRight size={10} style={{ transition: 'transform 0.15s' }} />
              )}
            </button>
          )}

          {/* Routine step checklist — expandable */}
          {task.task_type === 'routine' && routineExpanded && task.template_id && currentMember && (
            <div
              className="mt-1.5 pl-1 border-l-2"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <RoutineStepChecklist
                taskId={task.id}
                templateId={task.template_id}
                memberId={task.assignee_id ?? currentMember.id}
              />
            </div>
          )}

          {/* Randomizer draw subtitle — today's drawn activity */}
          {drawSubtitle && !isCompleted && (
            <span
              className="inline-flex items-center gap-1 text-[11px] mt-0.5 font-medium"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Today: {drawSubtitle}
            </span>
          )}

          {/* Build J: Sequential advancement progress subtitle */}
          {advancementSubtitle && (
            <span
              className="inline-flex items-center gap-1 text-[11px] mt-0.5 font-medium"
              style={{
                color: masteryStatus === 'submitted'
                  ? 'var(--color-warning, #eab308)'
                  : masteryStatus === 'approved'
                  ? 'var(--color-success, #22c55e)'
                  : 'var(--color-text-secondary)',
              }}
            >
              <GraduationCap size={10} />
              {advancementSubtitle}
            </span>
          )}

          {/* Build J: Resource URL link (for curriculum items with embedded links) */}
          {resourceUrl && !isCompleted && (
            <a
              href={resourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              className="inline-flex items-center gap-1 text-[11px] mt-0.5 font-medium underline-offset-2 hover:underline"
              style={{ color: 'var(--color-btn-primary-bg)' }}
            >
              <ExternalLink size={10} />
              Open resource
            </a>
          )}

          {/* Description snippet */}
          {!compact && task.description && (
            <p
              className="text-xs mt-0.5 line-clamp-1"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {task.description}
            </p>
          )}

          {/* Metadata row */}
          <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
            {/* Status badge — only show non-pending */}
            {task.status !== 'pending' && (
              <Badge
                variant={STATUS_COLORS[task.status] as 'default' | 'success' | 'warning' | 'error' | 'info'}
                size="sm"
              >
                {task.status === 'in_progress'
                  ? 'In Progress'
                  : task.status === 'pending_approval'
                  ? 'Awaiting Approval'
                  : task.status}
              </Badge>
            )}

            {/* Priority badge */}
            {task.priority && task.priority !== 'someday' && (
              <Badge
                variant={PRIORITY_COLORS[task.priority] as 'default' | 'error' | 'warning' | 'info'}
                size="sm"
              >
                {task.priority === 'now' ? 'Now' : task.priority === 'next' ? 'Next' : 'Optional'}
              </Badge>
            )}

            {/* Type badge — only show non-task types */}
            {task.task_type !== 'task' && (
              <Badge variant="default" size="sm">
                {TASK_TYPE_LABELS[task.task_type] ?? task.task_type}
              </Badge>
            )}

            {/* Assignee pill — small colored indicator */}
            {assigneeName && assigneeColor && (
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
                style={{
                  backgroundColor: `color-mix(in srgb, ${assigneeColor} 20%, transparent)`,
                  color: assigneeColor,
                  border: `1px solid ${assigneeColor}`,
                }}
              >
                {assigneeName}
              </span>
            )}

            {/* Due date */}
            {dueDateFormatted && (
              <span
                className="flex items-center gap-0.5 text-xs"
                style={{
                  color: isOverdue
                    ? 'var(--color-error)'
                    : isDueSoon
                    ? 'var(--color-warning)'
                    : 'var(--color-text-secondary)',
                }}
              >
                <CalendarDays size={11} />
                {isOverdue ? 'Overdue ' : ''}{dueDateFormatted}
              </span>
            )}

            {/* Life area tag */}
            {task.life_area_tag && (
              <span
                className="flex items-center gap-0.5 text-xs"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                <Tag size={11} />
                {task.life_area_tag.replace(/_/g, ' ')}
              </span>
            )}
          </div>

          {/* Inline timer controls (PRD-36) — only when time_tracking_enabled */}
          {hasTimeTracking && !isCompleted && (
            <TaskTimerControls
              taskId={task.id}
              activeTimer={activeTimerForTask}
              canUseClock={canUseClock}
              canUsePomodoro={canUsePomodoro}
              startTimer={timerCtx.startTimer}
              pauseTimer={timerCtx.pauseTimer}
              stopTimer={timerCtx.stopTimer}
            />
          )}

          {/* Build J: Submit as Mastered button (only for mastery items currently practicing) */}
          {showMasteryButton && onSubmitMastery && (
            <button
              type="button"
              onClick={e => {
                e.stopPropagation()
                onSubmitMastery(task)
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium mt-2 transition-colors"
              style={{
                background: 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, transparent)',
                color: 'var(--color-btn-primary-bg)',
                border: '1px solid var(--color-btn-primary-bg)',
              }}
            >
              <GraduationCap size={12} />
              Submit as Mastered
            </button>
          )}
        </div>

        {/* Note icon */}
        <button
          onClick={handleNoteToggle}
          className="shrink-0 p-1 rounded"
          style={{
            color: (showNoteInput || pendingNote || task.completion_note)
              ? 'var(--color-btn-primary-bg)'
              : 'var(--color-text-secondary)',
            opacity: (showNoteInput || pendingNote || task.completion_note) ? 1 : 0.5,
          }}
          aria-label={showNoteInput ? 'Close note' : 'Add note'}
        >
          <StickyNote size={15} />
        </button>

        {/* Context menu trigger */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowMenu(!showMenu)
          }}
          className="shrink-0 p-1 rounded"
          style={{ color: 'var(--color-text-secondary)' }}
          aria-label="Task options"
        >
          <MoreVertical size={16} />
        </button>
      </div>

      {/* Context Menu */}
      {showMenu && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />
          <div
            className="absolute right-0 top-8 z-50 min-w-[160px] rounded-lg shadow-lg overflow-hidden"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--vibe-radius-card, 0.5rem)',
            }}
          >
            {onEdit && (
              <ContextMenuItem
                icon={<Edit2 size={14} />}
                label="Edit"
                onClick={() => handleMenuAction(() => onEdit(task))}
              />
            )}
            {onFocusTimer && (
              <ContextMenuItem
                icon={<Timer size={14} />}
                label="Focus Timer"
                onClick={() => handleMenuAction(() => onFocusTimer(task))}
              />
            )}
            {onBreakItDown && (
              <ContextMenuItem
                icon={<Zap size={14} />}
                label="Break It Down"
                onClick={() => handleMenuAction(() => onBreakItDown(task))}
              />
            )}
            {onAssign && (
              <ContextMenuItem
                icon={<UserPlus size={14} />}
                label="Assign"
                onClick={() => handleMenuAction(() => onAssign(task))}
              />
            )}
            <div style={{ borderTop: '1px solid var(--color-border)' }} />
            <ContextMenuItem
              icon={<EyeOff size={14} />}
              label="Remove from dashboard"
              onClick={() => handleMenuAction(handleRemoveFromDashboard)}
            />
            {onDelete && (
              <ContextMenuItem
                icon={<Trash2 size={14} />}
                label="Delete"
                onClick={() => handleMenuAction(() => onDelete(task))}
                destructive
              />
            )}
          </div>
        </>
      )}

      {/* Completion Evidence Expander — only for approval-required tasks */}
      {showExpander && !isCompleted && task.require_approval && (
        <TaskCompletionExpander
          taskId={task.id}
          requireApproval
          onConfirm={handleExpanderConfirm}
          onCancel={handleExpanderCancel}
        />
      )}

      {/* Inline note input — toggled via note icon */}
      {showNoteInput && (
        <div
          className="mt-2 rounded-lg"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--vibe-radius-card, 0.5rem)',
            padding: '0.75rem',
          }}
        >
          <textarea
            value={pendingNote}
            onChange={(e) => setPendingNote(e.target.value)}
            placeholder="Add a note..."
            rows={2}
            className="w-full text-sm resize-none"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--vibe-radius-input, 0.375rem)',
              padding: '0.5rem',
              outline: 'none',
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-btn-primary-bg)'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = 'var(--color-border)'
            }}
          />
          <div className="flex items-center justify-end gap-2 mt-2">
            {isCompleted && pendingNote.trim() && (
              <button
                onClick={handleSaveNote}
                disabled={savingNote}
                className="flex items-center gap-1.5 text-xs font-semibold"
                style={{
                  color: 'var(--color-text-on-primary, #fff)',
                  padding: '0.375rem 0.75rem',
                  borderRadius: 'var(--vibe-radius-sm, 4px)',
                  background: 'var(--surface-primary, var(--color-btn-primary-bg))',
                  cursor: savingNote ? 'wait' : 'pointer',
                  border: 'none',
                  opacity: savingNote ? 0.7 : 1,
                }}
              >
                {savingNote && <Loader2 size={12} className="animate-spin" />}
                Save Note
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

interface ContextMenuItemProps {
  icon: React.ReactNode
  label: string
  onClick: () => void
  destructive?: boolean
}

function ContextMenuItem({ icon, label, onClick, destructive = false }: ContextMenuItemProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-left transition-colors"
      style={{
        color: destructive ? 'var(--color-error)' : 'var(--color-text-primary)',
        background: 'transparent',
        cursor: 'pointer',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'var(--color-bg-secondary)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
      }}
    >
      {icon}
      {label}
    </button>
  )
}

// ---------------------------------------------------------------------------
// TaskTimerControls — inline timer pill buttons (PRD-36)
// ---------------------------------------------------------------------------

/** Format seconds as H:MM:SS or MM:SS. */
function formatElapsed(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds))
  const h  = Math.floor(s / 3600)
  const m  = Math.floor((s % 3600) / 60)
  const ss = s % 60
  const mm = String(m).padStart(2, '0')
  const sStr = String(ss).padStart(2, '0')
  return h > 0 ? `${h}:${mm}:${sStr}` : `${mm}:${sStr}`
}

const timerPillStyle: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 4,
  padding: '2px 8px',
  borderRadius: 'var(--vibe-radius-sm, 6px)',
  border: '1px solid var(--color-border)',
  background: 'var(--color-bg-secondary)',
  fontSize: 11,
  fontWeight: 600,
  cursor: 'pointer',
  transition: 'background 0.15s, border-color 0.15s',
  lineHeight: 1.4,
}

interface TaskTimerControlsProps {
  taskId: string
  activeTimer: import('@/features/timer').ActiveTimer | undefined
  canUseClock: boolean
  canUsePomodoro: boolean
  startTimer: (opts: import('@/features/timer').StartTimerOptions) => Promise<unknown>
  pauseTimer: (sessionId: string) => Promise<void>
  stopTimer: (sessionId: string) => Promise<void>
}

function TaskTimerControls({
  taskId,
  activeTimer,
  canUseClock,
  canUsePomodoro,
  startTimer,
  pauseTimer,
  stopTimer,
}: TaskTimerControlsProps) {
  const handleClockIn = (e: React.MouseEvent) => {
    e.stopPropagation()
    startTimer({ mode: 'clock', taskId }).catch(console.error)
  }

  const handlePomodoro = (e: React.MouseEvent) => {
    e.stopPropagation()
    startTimer({ mode: 'pomodoro_focus', taskId }).catch(console.error)
  }

  const handlePause = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (activeTimer) pauseTimer(activeTimer.session.id).catch(console.error)
  }

  const handleDone = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (activeTimer) stopTimer(activeTimer.session.id).catch(console.error)
  }

  // Timer IS running for this task
  if (activeTimer) {
    return (
      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        {/* Elapsed time display */}
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            fontVariantNumeric: 'tabular-nums',
            color: 'var(--color-text-heading)',
            marginRight: 2,
          }}
        >
          {formatElapsed(activeTimer.elapsed)}
        </span>
        <button
          onClick={handlePause}
          style={{ ...timerPillStyle, color: 'var(--color-text-secondary)' }}
          aria-label="Pause timer"
        >
          <Pause size={10} />
          Pause
        </button>
        <button
          onClick={handleDone}
          style={{ ...timerPillStyle, color: 'var(--color-status-error, #e07a5f)' }}
          aria-label="Stop timer"
        >
          <Square size={10} />
          Done
        </button>
      </div>
    )
  }

  // No timer running — show start buttons
  const showClock = canUseClock
  const showPomodoro = canUsePomodoro

  if (!showClock && !showPomodoro) return null

  return (
    <div className="flex items-center gap-1.5 mt-2">
      {showClock && (
        <button
          onClick={handleClockIn}
          style={{ ...timerPillStyle, color: 'var(--color-text-secondary)' }}
          aria-label="Clock in"
        >
          <Play size={10} />
          Clock In
        </button>
      )}
      {showPomodoro && (
        <button
          onClick={handlePomodoro}
          style={{ ...timerPillStyle, color: 'var(--color-text-secondary)' }}
          aria-label="Start pomodoro"
        >
          <Timer size={10} />
          Pomodoro
        </button>
      )}
    </div>
  )
}

/**
 * TaskCardGuided — Simplified card for Guided shell.
 * Larger text, bigger tap target, expandable checklist.
 */
export function TaskCardGuided({
  task,
  isCompleting = false,
  onToggle,
}: Pick<TaskCardProps, 'task' | 'isCompleting' | 'onToggle'>) {
  const isCompleted = task.status === 'completed'

  return (
    <button
      onClick={(e) => {
        if (isCompleting) return
        const rect = e.currentTarget.getBoundingClientRect()
        onToggle(task, {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        })
      }}
      disabled={isCompleting}
      className="w-full flex items-center gap-4 rounded-xl text-left transition-all"
      style={{
        padding: '1rem',
        backgroundColor: isCompleted
          ? 'color-mix(in srgb, var(--color-success, #22c55e) 10%, var(--color-bg-card))'
          : 'var(--color-bg-card)',
        border: isCompleted
          ? '1.5px solid var(--color-success, #22c55e)'
          : '1.5px solid var(--color-border)',
        borderRadius: 'var(--vibe-radius-card, 0.75rem)',
        minHeight: 'var(--touch-target-min, 48px)',
        opacity: isCompleting ? 0.6 : 1,
        cursor: isCompleting ? 'wait' : 'pointer',
      }}
    >
      {/* Big checkbox */}
      <span
        style={{
          color: isCompleted ? 'var(--color-success, #22c55e)' : 'var(--color-text-secondary)',
          flexShrink: 0,
        }}
      >
        {isCompleted ? <CheckCircle2 size={28} /> : <Circle size={28} />}
      </span>

      {/* Text */}
      <span
        className="font-medium"
        style={{
          fontSize: '1rem',
          color: isCompleted ? 'var(--color-text-secondary)' : 'var(--color-text-primary)',
          textDecoration: isCompleted ? 'line-through' : 'none',
        }}
      >
        {task.title}
      </span>

      {!isCompleted && (
        <ChevronRight
          size={16}
          className="ml-auto shrink-0"
          style={{ color: 'var(--color-text-secondary)' }}
        />
      )}
    </button>
  )
}
