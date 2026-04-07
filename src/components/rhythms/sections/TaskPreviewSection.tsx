/**
 * PRD-18 Section Type #3: Task Preview
 *
 * Static snapshot of today's tasks for the rhythm member. Tappable to
 * navigate to /tasks. Shows up to 5 tasks; "+N more" link if there are
 * more. Auto-hides if no tasks today.
 *
 * Phase A simplification: shows tasks where due_date == today AND
 * assignee_id == memberId AND status IN ('pending','in_progress').
 * Future Phase B will integrate with the user's preferred task view.
 */

import { CheckSquare, ChevronRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTasks } from '@/hooks/useTasks'

interface Props {
  familyId: string
  memberId: string
  /** Maximum tasks to show inline. Default 5. */
  maxItems?: number
}

function todayIso(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function TaskPreviewSection({ familyId, memberId, maxItems = 5 }: Props) {
  const today = todayIso()
  const { data: tasks = [], isLoading } = useTasks(familyId, {
    assigneeId: memberId,
    status: ['pending', 'in_progress'],
    dueDateStart: today,
    dueDateEnd: today,
  })

  if (isLoading) return null

  // Empty state — keep visible to remind user it exists, but warm framing
  if (tasks.length === 0) {
    return (
      <Link
        to="/tasks"
        className="block rounded-xl p-5 transition-colors hover:bg-opacity-50"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <CheckSquare size={18} style={{ color: 'var(--color-accent-deep)' }} />
          <h3
            className="text-sm font-semibold"
            style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
          >
            Today's Tasks
          </h3>
        </div>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Nothing scheduled yet. Enjoy the open space, or add something if inspiration strikes.
        </p>
      </Link>
    )
  }

  const visible = tasks.slice(0, maxItems)
  const overflow = tasks.length - visible.length

  return (
    <Link
      to="/tasks"
      className="block rounded-xl p-5 transition-colors hover:bg-opacity-50"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <CheckSquare size={18} style={{ color: 'var(--color-accent-deep)' }} />
          <h3
            className="text-sm font-semibold"
            style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
          >
            Today's Tasks
          </h3>
        </div>
        <ChevronRight size={16} style={{ color: 'var(--color-text-secondary)' }} />
      </div>

      <ul className="space-y-1.5">
        {visible.map(task => (
          <li
            key={task.id}
            className="flex items-center gap-2 text-sm"
            style={{ color: 'var(--color-text-primary)' }}
          >
            <span
              className="inline-block w-1.5 h-1.5 rounded-full flex-shrink-0"
              style={{ backgroundColor: 'var(--color-accent-deep)' }}
            />
            <span className="truncate">{task.title}</span>
          </li>
        ))}
      </ul>

      {overflow > 0 && (
        <p
          className="mt-2 text-xs"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          and {overflow} more
        </p>
      )}
    </Link>
  )
}
