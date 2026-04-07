/**
 * PRD-18 Section Type #32 (Enhancement 8): On the Horizon
 *
 * Forward-looking awareness section. Surfaces tasks and calendar events
 * with due dates approaching in the next 7 days (configurable 3-14),
 * capped at 3-5 items, nearest first. Executive function training
 * disguised as a morning section.
 *
 * Data sources:
 *   - tasks where assignee_id=memberId, due_date BETWEEN tomorrow
 *     AND (today + lookahead_days), status IN ('pending','in_progress'),
 *     archived_at IS NULL
 *   - calendar_events where event_date in the same range AND the
 *     member is an attendee. Excludes recurring events where the
 *     parent recurrence started outside the lookahead window.
 *
 * Per item, shows:
 *   - icon (task vs event)
 *   - title + "in X days"
 *   - [Break this into steps] → opens TaskBreaker modal (tasks only)
 *   - [Schedule time] → opens EventCreationModal prefilled (tasks only)
 *
 * Items already in progress (parent_task_id IS NOT NULL on a child
 * OR task_breaker_level IS NOT NULL) show a subtle "In progress"
 * indicator instead of the action buttons.
 *
 * Empty state: warm "Nothing on the horizon — you're ahead of schedule"
 * (NOT hidden). The presence of the section teaches the user it exists
 * and reinforces the "you're on top of things" positive frame on slow weeks.
 */

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { Telescope, CheckSquare, Calendar, ArrowRight, ChevronDown, ChevronUp, Layers } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { todayLocalIso, localIsoDaysFromToday } from '@/utils/dates'
import { DEFAULT_ON_THE_HORIZON_CONFIG, type OnTheHorizonConfig } from '@/types/rhythms'
import { TaskBreakerModalFromHorizon } from './TaskBreakerModalFromHorizon'

interface Props {
  familyId: string
  memberId: string
  config?: OnTheHorizonConfig
}

type HorizonItemKind = 'task' | 'event'

interface HorizonItem {
  kind: HorizonItemKind
  id: string
  title: string
  date: string // YYYY-MM-DD
  daysUntil: number
  lifeAreaTag?: string | null
  description?: string | null
  hasSubtasks: boolean
}

export function OnTheHorizonSection({ familyId, memberId, config }: Props) {
  const lookaheadDays = clamp(
    config?.lookahead_days ?? DEFAULT_ON_THE_HORIZON_CONFIG.lookahead_days,
    3,
    14
  )
  const maxItems = clamp(
    config?.max_items ?? DEFAULT_ON_THE_HORIZON_CONFIG.max_items,
    3,
    10
  )

  // Query range: strictly after today (today's items are in Task Preview)
  // through today + lookaheadDays
  const startDate = localIsoDaysFromToday(1) // tomorrow
  const endDate = localIsoDaysFromToday(lookaheadDays)
  const today = todayLocalIso()

  const { data: horizonData, isLoading } = useQuery({
    queryKey: ['on-the-horizon', familyId, memberId, lookaheadDays],
    queryFn: async () => {
      // ─── Tasks ───
      const { data: tasks, error: tasksError } = await supabase
        .from('tasks')
        .select('id, title, description, due_date, status, task_breaker_level, life_area_tag, parent_task_id')
        .eq('family_id', familyId)
        .eq('assignee_id', memberId)
        .in('status', ['pending', 'in_progress'])
        .is('archived_at', null)
        .gte('due_date', startDate)
        .lte('due_date', endDate)
        .order('due_date', { ascending: true })
        .limit(15)

      if (tasksError) throw tasksError

      // Which tasks already have subtasks?
      const taskIds = (tasks ?? []).map(t => t.id)
      let taskIdsWithSubtasks = new Set<string>()
      if (taskIds.length > 0) {
        const { data: subtaskRows } = await supabase
          .from('tasks')
          .select('parent_task_id')
          .in('parent_task_id', taskIds)
          .is('archived_at', null)
        taskIdsWithSubtasks = new Set(
          (subtaskRows ?? [])
            .map(r => r.parent_task_id as string | null)
            .filter((x): x is string => x !== null)
        )
      }

      // ─── Calendar events ───
      // Member's attended events in the lookahead window.
      // event_attendees → event_id join. We query event_attendees first
      // because members can be attendees without being the creator.
      const { data: attended, error: attendedError } = await supabase
        .from('event_attendees')
        .select('event_id')
        .eq('family_member_id', memberId)

      if (attendedError) throw attendedError

      const attendedIds = (attended ?? []).map(a => a.event_id as string)

      let events: Array<{
        id: string
        title: string
        description: string | null
        event_date: string
        recurrence_rule: string | null
      }> = []

      if (attendedIds.length > 0) {
        const { data: eventRows, error: eventsError } = await supabase
          .from('calendar_events')
          .select('id, title, description, event_date, recurrence_rule')
          .in('id', attendedIds)
          .eq('family_id', familyId)
          .gte('event_date', startDate)
          .lte('event_date', endDate)
          .order('event_date', { ascending: true })
          .limit(15)

        if (eventsError) throw eventsError
        events = (eventRows ?? []) as typeof events
      }

      // Merge + sort + cap
      const taskItems: HorizonItem[] = (tasks ?? [])
        .filter(t => t.due_date !== null)
        .map(t => ({
          kind: 'task' as const,
          id: t.id,
          title: t.title ?? '(untitled task)',
          description: t.description,
          date: t.due_date as string,
          daysUntil: daysBetween(today, t.due_date as string),
          lifeAreaTag: t.life_area_tag,
          hasSubtasks:
            taskIdsWithSubtasks.has(t.id) || !!t.task_breaker_level,
        }))

      const eventItems: HorizonItem[] = events
        // Exclude events with recurrence rules — their "preparation" isn't
        // about this specific instance; routine recurring items shouldn't
        // dominate the horizon view.
        .filter(e => !e.recurrence_rule)
        .map(e => ({
          kind: 'event' as const,
          id: e.id,
          title: e.title ?? '(untitled event)',
          description: e.description,
          date: e.event_date,
          daysUntil: daysBetween(today, e.event_date),
          hasSubtasks: false,
        }))

      const merged = [...taskItems, ...eventItems].sort(
        (a, b) => a.daysUntil - b.daysUntil
      )

      return {
        items: merged.slice(0, maxItems),
        totalCount: merged.length,
      }
    },
    enabled: !!familyId && !!memberId,
    staleTime: 60_000,
  })

  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [taskBreakerFor, setTaskBreakerFor] = useState<{
    id: string
    title: string
    description: string | null
    lifeAreaTag: string | null
  } | null>(null)

  if (isLoading) return null

  const items = horizonData?.items ?? []
  const totalCount = horizonData?.totalCount ?? 0
  const overflow = totalCount - items.length

  return (
    <>
      <div
        className="rounded-xl p-5"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Telescope size={18} style={{ color: 'var(--color-accent-deep)' }} />
          <h3
            className="text-sm font-semibold"
            style={{
              color: 'var(--color-text-heading)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            On the Horizon
          </h3>
        </div>

        {items.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Nothing on the horizon in the next {lookaheadDays} days. You're ahead of
            schedule.
          </p>
        ) : (
          <ul className="space-y-2">
            {items.map(item => (
              <HorizonItemRow
                key={`${item.kind}-${item.id}`}
                item={item}
                expanded={expandedId === `${item.kind}-${item.id}`}
                onToggleExpand={() =>
                  setExpandedId(cur =>
                    cur === `${item.kind}-${item.id}` ? null : `${item.kind}-${item.id}`
                  )
                }
                onBreakDown={() =>
                  setTaskBreakerFor({
                    id: item.id,
                    title: item.title,
                    description: item.description ?? null,
                    lifeAreaTag: item.lifeAreaTag ?? null,
                  })
                }
              />
            ))}
          </ul>
        )}

        {overflow > 0 && (
          <Link
            to="/tasks"
            className="mt-3 inline-flex items-center gap-1 text-xs hover:underline"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            and {overflow} more this week
            <ArrowRight size={12} />
          </Link>
        )}
      </div>

      {taskBreakerFor && (
        <TaskBreakerModalFromHorizon
          parentTaskId={taskBreakerFor.id}
          parentTitle={taskBreakerFor.title}
          parentDescription={taskBreakerFor.description ?? undefined}
          lifeAreaTag={taskBreakerFor.lifeAreaTag ?? undefined}
          familyId={familyId}
          memberId={memberId}
          onClose={() => setTaskBreakerFor(null)}
        />
      )}
    </>
  )
}

// ─── Row component ───────────────────────────────────────────

interface RowProps {
  item: HorizonItem
  expanded: boolean
  onToggleExpand: () => void
  onBreakDown: () => void
}

function HorizonItemRow({ item, expanded, onToggleExpand, onBreakDown }: RowProps) {
  const Icon = item.kind === 'task' ? CheckSquare : Calendar
  const daysLabel =
    item.daysUntil <= 1 ? 'tomorrow' : `in ${item.daysUntil} days`

  return (
    <li
      className="rounded-lg"
      style={{
        background: 'color-mix(in srgb, var(--color-accent-deep) 4%, transparent)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <button
        type="button"
        onClick={onToggleExpand}
        className="w-full flex items-center gap-2 p-3 text-left"
      >
        <Icon
          size={16}
          style={{ color: 'var(--color-accent-deep)', flexShrink: 0 }}
        />
        <div className="flex-1 min-w-0">
          <p
            className="text-sm font-medium truncate"
            style={{ color: 'var(--color-text-primary)' }}
          >
            {item.title}
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {daysLabel}
            {item.hasSubtasks && (
              <span className="inline-flex items-center gap-1 ml-2">
                <Layers size={11} />
                In progress
              </span>
            )}
          </p>
        </div>
        {expanded ? (
          <ChevronUp size={14} style={{ color: 'var(--color-text-secondary)' }} />
        ) : (
          <ChevronDown size={14} style={{ color: 'var(--color-text-secondary)' }} />
        )}
      </button>

      {expanded && item.kind === 'task' && !item.hasSubtasks && (
        <div
          className="px-3 pb-3 pt-1 flex flex-wrap gap-2"
          style={{ borderTop: '1px solid var(--color-border-subtle)' }}
        >
          <button
            type="button"
            onClick={onBreakDown}
            className="text-xs font-semibold rounded-md px-3 py-1.5"
            style={{
              background: 'var(--surface-primary, var(--color-btn-primary-bg))',
              color: 'var(--color-btn-primary-text)',
            }}
          >
            Break into steps
          </button>
          <Link
            to={`/tasks?task=${item.id}`}
            className="text-xs rounded-md px-3 py-1.5"
            style={{
              color: 'var(--color-text-primary)',
              backgroundColor: 'var(--color-bg-secondary)',
            }}
          >
            Open task
          </Link>
        </div>
      )}

      {expanded && item.kind === 'task' && item.hasSubtasks && (
        <div
          className="px-3 pb-3 pt-1"
          style={{ borderTop: '1px solid var(--color-border-subtle)' }}
        >
          <Link
            to={`/tasks?task=${item.id}`}
            className="text-xs rounded-md px-3 py-1.5 inline-block"
            style={{
              color: 'var(--color-text-primary)',
              backgroundColor: 'var(--color-bg-secondary)',
            }}
          >
            View subtasks
          </Link>
        </div>
      )}

      {expanded && item.kind === 'event' && (
        <div
          className="px-3 pb-3 pt-1"
          style={{ borderTop: '1px solid var(--color-border-subtle)' }}
        >
          <Link
            to="/calendar"
            className="text-xs rounded-md px-3 py-1.5 inline-block"
            style={{
              color: 'var(--color-text-primary)',
              backgroundColor: 'var(--color-bg-secondary)',
            }}
          >
            Open in calendar
          </Link>
        </div>
      )}
    </li>
  )
}

// ─── Helpers ───────────────────────────────────────────────

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/** Whole days between two YYYY-MM-DD strings. Positive if b is after a. */
function daysBetween(a: string, b: string): number {
  const da = new Date(a + 'T00:00:00')
  const db = new Date(b + 'T00:00:00')
  return Math.round((db.getTime() - da.getTime()) / (24 * 60 * 60 * 1000))
}
