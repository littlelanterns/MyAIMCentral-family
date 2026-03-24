/**
 * NowNextOptionalView — PRD-09A View 12
 *
 * Three sections:
 * - Now: Required tasks due today.
 * - Next: Required tasks due this week but not today.
 * - Optional: All active opportunities available to this user.
 *
 * This is the view that integrates Opportunities into the daily task experience.
 * Available to Essential tier (mom-only), and all Enhanced+ users.
 * Default for Guided shell.
 */

import { useState } from 'react'
import { ChevronDown, ChevronRight, Clock, Calendar, Star } from 'lucide-react'
import { TaskCard, TaskCardGuided } from '../TaskCard'
import { EmptyState } from '@/components/shared'
import type { Task } from '@/hooks/useTasks'
import type { ShellType } from '@/lib/theme'

interface NowNextOptionalViewProps {
  tasks: Task[]
  onToggle: (task: Task, origin?: { x: number; y: number }) => void
  onEdit?: (task: Task) => void
  onFocusTimer?: (task: Task) => void
  onBreakItDown?: (task: Task) => void
  onDelete?: (task: Task) => void
  isCompleting?: (taskId: string) => boolean
  shell?: ShellType
}

function isToday(dateStr: string | null): boolean {
  if (!dateStr) return false
  const today = new Date().toDateString()
  return new Date(dateStr + 'T00:00:00').toDateString() === today
}

function isThisWeek(dateStr: string | null): boolean {
  if (!dateStr) return false
  const d = new Date(dateStr + 'T00:00:00')
  const now = new Date()
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
  return d > now && d <= weekFromNow
}

function isOpportunity(task: Task): boolean {
  return (
    task.task_type === 'opportunity_repeatable' ||
    task.task_type === 'opportunity_claimable' ||
    task.task_type === 'opportunity_capped'
  )
}

export function NowNextOptionalView({
  tasks,
  onToggle,
  onEdit,
  onFocusTimer,
  onBreakItDown,
  onDelete,
  isCompleting,
  shell = 'mom',
}: NowNextOptionalViewProps) {
  const [showNext, setShowNext] = useState(true)
  const [showOptional, setShowOptional] = useState(true)

  const activeTasks = tasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled')

  const nowTasks = activeTasks.filter(
    (t) => !isOpportunity(t) && (isToday(t.due_date) || t.priority === 'now' || (!t.due_date && t.status !== 'completed'))
  )

  const nextTasks = activeTasks.filter(
    (t) =>
      !isOpportunity(t) &&
      !nowTasks.includes(t) &&
      (isThisWeek(t.due_date) || t.priority === 'next')
  )

  const optionalTasks = activeTasks.filter(
    (t) => isOpportunity(t) || t.priority === 'optional' || t.priority === 'someday'
  )

  const completedTasks = tasks.filter((t) => t.status === 'completed')

  const isGuided = shell === 'guided'
  // Card component: isGuided ? TaskCardGuided : TaskCard (wired inline below)

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<Clock size={36} />}
        title="You're all clear!"
        description="No tasks right now. Enjoy the breathing room."
      />
    )
  }

  return (
    <div className="space-y-5">
      {/* NOW */}
      <Section
        label="Now"
        sublabel="Required today"
        icon={<Clock size={16} style={{ color: 'var(--color-error)' }} />}
        count={nowTasks.length}
        accentColor="var(--color-error)"
        defaultOpen
      >
        {nowTasks.length === 0 ? (
          <p className="text-sm text-center py-3" style={{ color: 'var(--color-text-secondary)', opacity: 0.6 }}>
            Nothing due today.
          </p>
        ) : (
          <div className={isGuided ? 'space-y-3' : 'space-y-2'}>
            {nowTasks.map((task) =>
              isGuided ? (
                <TaskCardGuided
                  key={task.id}
                  task={task}
                  isCompleting={isCompleting?.(task.id)}
                  onToggle={onToggle}
                />
              ) : (
                <TaskCard
                  key={task.id}
                  task={task}
                  isCompleting={isCompleting?.(task.id)}
                  onToggle={onToggle}
                  onEdit={onEdit}
                  onFocusTimer={onFocusTimer}
                  onBreakItDown={onBreakItDown}
                  onDelete={onDelete}
                />
              )
            )}
          </div>
        )}
      </Section>

      {/* NEXT */}
      {!isGuided && (
        <Section
          label="Next"
          sublabel="This week"
          icon={<Calendar size={16} style={{ color: 'var(--color-warning)' }} />}
          count={nextTasks.length}
          accentColor="var(--color-warning)"
          defaultOpen={nextTasks.length > 0}
          collapsed={!showNext}
          onToggleCollapse={() => setShowNext(!showNext)}
        >
          {nextTasks.length === 0 ? (
            <p className="text-sm text-center py-3" style={{ color: 'var(--color-text-secondary)', opacity: 0.6 }}>
              Nothing scheduled this week.
            </p>
          ) : (
            <div className="space-y-2">
              {nextTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isCompleting={isCompleting?.(task.id)}
                  onToggle={onToggle}
                  onEdit={onEdit}
                  onFocusTimer={onFocusTimer}
                  onBreakItDown={onBreakItDown}
                  onDelete={onDelete}
                  compact
                />
              ))}
            </div>
          )}
        </Section>
      )}

      {/* OPTIONAL */}
      <Section
        label="Optional"
        sublabel="Opportunities & bonuses"
        icon={<Star size={16} style={{ color: 'var(--color-accent)' }} />}
        count={optionalTasks.length}
        accentColor="var(--color-accent)"
        defaultOpen={false}
        collapsed={!showOptional}
        onToggleCollapse={() => setShowOptional(!showOptional)}
      >
        {optionalTasks.length === 0 ? (
          <p className="text-sm text-center py-3" style={{ color: 'var(--color-text-secondary)', opacity: 0.6 }}>
            No opportunities available right now.
          </p>
        ) : (
          <div className={isGuided ? 'space-y-3' : 'space-y-2'}>
            {optionalTasks.map((task) =>
              isGuided ? (
                <TaskCardGuided
                  key={task.id}
                  task={task}
                  isCompleting={isCompleting?.(task.id)}
                  onToggle={onToggle}
                />
              ) : (
                <TaskCard
                  key={task.id}
                  task={task}
                  isCompleting={isCompleting?.(task.id)}
                  onToggle={onToggle}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  compact
                />
              )
            )}
          </div>
        )}
      </Section>

      {/* Completed */}
      {completedTasks.length > 0 && !isGuided && (
        <Section
          label="Done Today"
          sublabel=""
          icon={null}
          count={completedTasks.length}
          accentColor="var(--color-success)"
          defaultOpen={false}
        >
          <div className="space-y-2">
            {completedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                isCompleting={isCompleting?.(task.id)}
                onToggle={onToggle}
                compact
              />
            ))}
          </div>
        </Section>
      )}
    </div>
  )
}

interface SectionProps {
  label: string
  sublabel: string
  icon: React.ReactNode
  count: number
  accentColor: string
  defaultOpen?: boolean
  collapsed?: boolean
  onToggleCollapse?: () => void
  children: React.ReactNode
}

function Section({
  label,
  sublabel,
  icon,
  count,
  accentColor,
  collapsed,
  onToggleCollapse,
  children,
}: SectionProps) {
  const isCollapsed = collapsed ?? false

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ border: `1.5px solid ${accentColor}`, borderRadius: 'var(--vibe-radius-card, 0.5rem)' }}
    >
      {/* Header */}
      <button
        onClick={onToggleCollapse}
        className="w-full flex items-center gap-2 px-4 py-3 text-left"
        style={{ backgroundColor: 'var(--color-bg-card)' }}
        disabled={!onToggleCollapse}
      >
        {icon}
        <span className="font-semibold text-sm" style={{ color: 'var(--color-text-heading)' }}>
          {label}
        </span>
        {sublabel && (
          <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            — {sublabel}
          </span>
        )}
        <span
          className="ml-auto text-xs px-2 py-0.5 rounded-full"
          style={{ backgroundColor: `color-mix(in srgb, ${accentColor} 15%, transparent)`, color: accentColor }}
        >
          {count}
        </span>
        {onToggleCollapse && (
          isCollapsed ? (
            <ChevronRight size={16} style={{ color: 'var(--color-text-secondary)' }} />
          ) : (
            <ChevronDown size={16} style={{ color: 'var(--color-text-secondary)' }} />
          )
        )}
      </button>

      {/* Content */}
      {!isCollapsed && (
        <div
          className="px-3 pb-3"
          style={{ backgroundColor: 'var(--color-bg-secondary)', paddingTop: '0.5rem' }}
        >
          {children}
        </div>
      )}
    </div>
  )
}
