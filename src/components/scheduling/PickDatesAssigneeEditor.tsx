import { useMemo } from 'react'
import { RotateCcw } from 'lucide-react'
import type { SchedulerAction } from './types'
import { getMemberColor } from '@/lib/memberColors'

interface FamilyMember {
  id: string
  display_name: string
  assigned_color?: string | null
  member_color?: string | null
}

interface PickDatesAssigneeEditorProps {
  paintedDates: string[]
  assigneeMap: Record<string, string[]>
  members: FamilyMember[]
  instantiationMode: 'per_assignee_instance' | 'shared_anyone_completes'
  dispatch: React.Dispatch<SchedulerAction>
}

export function PickDatesAssigneeEditor({
  paintedDates,
  assigneeMap,
  members,
  instantiationMode,
  dispatch,
}: PickDatesAssigneeEditorProps) {
  if (members.length < 2 || paintedDates.length === 0) return null

  const hasCustomAssignments = Object.keys(assigneeMap).length > 0

  return (
    <div className="space-y-3">
      {/* Instantiation mode selector */}
      <div>
        <div
          className="text-xs font-medium mb-1.5 uppercase tracking-wider"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Who does this?
        </div>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_INSTANTIATION_MODE', mode: 'per_assignee_instance' })}
            className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-center"
            style={{
              backgroundColor: instantiationMode === 'per_assignee_instance'
                ? 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, transparent)'
                : 'transparent',
              border: instantiationMode === 'per_assignee_instance'
                ? '1.5px solid var(--color-btn-primary-bg)'
                : '1.5px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          >
            Each kid does their own
          </button>
          <button
            type="button"
            onClick={() => dispatch({ type: 'SET_INSTANTIATION_MODE', mode: 'shared_anyone_completes' })}
            className="flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-center"
            style={{
              backgroundColor: instantiationMode === 'shared_anyone_completes'
                ? 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, transparent)'
                : 'transparent',
              border: instantiationMode === 'shared_anyone_completes'
                ? '1.5px solid var(--color-btn-primary-bg)'
                : '1.5px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          >
            Shared &mdash; anyone completes
          </button>
        </div>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          {instantiationMode === 'per_assignee_instance'
            ? 'Each person assigned to a date completes it independently.'
            : 'One person completes it for everyone on that date.'}
        </p>
      </div>

      {/* Per-date assignee picker */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <div
            className="text-xs font-medium uppercase tracking-wider"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Assign per date
            <span className="normal-case tracking-normal font-normal ml-1">(optional)</span>
          </div>
          {hasCustomAssignments && (
            <button
              type="button"
              onClick={() => dispatch({ type: 'SET_ASSIGNEE_MAP', map: {} })}
              className="flex items-center gap-1 text-xs"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <RotateCcw size={12} /> Reset to everyone
            </button>
          )}
        </div>

        {!hasCustomAssignments && (
          <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Everyone is assigned to every date. Tap a name to assign specific people to specific dates.
          </p>
        )}

        <div className="space-y-1.5">
          {paintedDates.map(dateIso => (
            <DateAssigneeRow
              key={dateIso}
              dateIso={dateIso}
              members={members}
              assignedIds={assigneeMap[dateIso] ?? null}
              dispatch={dispatch}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

function DateAssigneeRow({
  dateIso,
  members,
  assignedIds,
  dispatch,
}: {
  dateIso: string
  members: FamilyMember[]
  assignedIds: string[] | null
  dispatch: React.Dispatch<SchedulerAction>
}) {
  const dateObj = useMemo(() => new Date(dateIso + 'T00:00:00'), [dateIso])
  const label = dateObj.toLocaleDateString('default', { weekday: 'short', month: 'short', day: 'numeric' })

  const allAssigned = assignedIds === null

  function toggleMember(memberId: string) {
    if (allAssigned) {
      const others = members.filter(m => m.id !== memberId).map(m => m.id)
      dispatch({ type: 'SET_DATE_ASSIGNEES', date: dateIso, memberIds: others })
    } else {
      const isSelected = assignedIds.includes(memberId)
      if (isSelected) {
        const next = assignedIds.filter(id => id !== memberId)
        dispatch({ type: 'SET_DATE_ASSIGNEES', date: dateIso, memberIds: next })
      } else {
        const next = [...assignedIds, memberId]
        if (next.length === members.length) {
          dispatch({ type: 'SET_DATE_ASSIGNEES', date: dateIso, memberIds: [] })
        } else {
          dispatch({ type: 'SET_DATE_ASSIGNEES', date: dateIso, memberIds: next })
        }
      }
    }
  }

  return (
    <div
      className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg"
      style={{ backgroundColor: 'var(--color-bg-secondary)' }}
    >
      <span
        className="text-xs font-medium shrink-0 w-24"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {label}
      </span>
      <div className="flex flex-wrap gap-1 flex-1">
        {members.map(m => {
          const color = getMemberColor(m)
          const selected = allAssigned || (assignedIds?.includes(m.id) ?? false)
          return (
            <button
              key={m.id}
              type="button"
              onClick={() => toggleMember(m.id)}
              className="rounded-full text-xs font-semibold transition-all duration-150"
              style={{
                padding: '0.25rem 0.5rem',
                backgroundColor: selected ? color : 'transparent',
                color: selected ? 'var(--color-text-on-primary, #fff)' : 'var(--color-text-primary)',
                border: `2px solid ${color}`,
                opacity: selected ? 1 : 0.5,
                lineHeight: 1.2,
              }}
            >
              {m.display_name.split(' ')[0]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
