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
} from 'lucide-react'
import { Badge } from '@/components/shared'
import { useTimerContext } from '@/features/timer'
import { useCanAccess } from '@/lib/permissions/useCanAccess'
import { TaskCompletionExpander } from './TaskCompletionExpander'
import type { Task } from '@/hooks/useTasks'

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
}: TaskCardProps) {
  const [showMenu, setShowMenu] = useState(false)
  const [isPressed, _setIsPressed] = useState(false)
  const [showExpander, setShowExpander] = useState(false)
  const [pendingOrigin, setPendingOrigin] = useState<{ x: number; y: number } | undefined>()
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

    // For tasks requiring approval, always show the expander
    if (task.require_approval) {
      setPendingOrigin(origin)
      setShowExpander(true)
      return
    }

    // For normal tasks, show the expander for optional details
    setPendingOrigin(origin)
    setShowExpander(true)
  }

  const handleExpanderConfirm = (extras: { completionNote?: string | null; photoUrl?: string | null }) => {
    setShowExpander(false)
    onToggle(task, pendingOrigin, extras)
  }

  const handleExpanderCancel = () => {
    setShowExpander(false)
    setPendingOrigin(undefined)
  }

  const handleMenuAction = (action: () => void) => {
    setShowMenu(false)
    action()
  }

  const dueDateFormatted = task.due_date
    ? new Date(task.due_date + 'T00:00:00').toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      })
    : null

  const isDueSoon = task.due_date
    ? new Date(task.due_date + 'T00:00:00') <= new Date(Date.now() + 2 * 24 * 60 * 60 * 1000)
    : false

  const isOverdue = task.due_date
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
            className="flex-shrink-0 mt-0.5 cursor-grab active:cursor-grabbing touch-none"
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

        {/* Checkbox */}
        <button
          ref={checkboxRef}
          onClick={handleCheckboxClick}
          disabled={isCompleting}
          className="flex-shrink-0 mt-0.5 transition-all"
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

          {/* Routine step indicator — shows when task_type is routine */}
          {task.task_type === 'routine' && !isCompleted && (
            <span
              className="inline-flex items-center gap-1 text-[11px] mt-0.5 font-medium"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <Repeat size={10} />
              Routine
              {task.template_id && ' — check steps'}
            </span>
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
        </div>

        {/* Context menu trigger */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setShowMenu(!showMenu)
          }}
          className="flex-shrink-0 p-1 rounded"
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
            {onEdit && (
              <div style={{ borderTop: '1px solid var(--color-border)' }} />
            )}
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

      {/* Completion Evidence Expander — PRD-09A photo + note */}
      {showExpander && !isCompleted && (
        <TaskCompletionExpander
          taskId={task.id}
          requireApproval={!!task.require_approval}
          onConfirm={handleExpanderConfirm}
          onCancel={handleExpanderCancel}
        />
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
          className="ml-auto flex-shrink-0"
          style={{ color: 'var(--color-text-secondary)' }}
        />
      )}
    </button>
  )
}
