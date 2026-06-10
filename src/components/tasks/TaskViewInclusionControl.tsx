/**
 * TaskViewInclusionControl — "what counts as a task" for the prioritization
 * views (FO-COMMAND-CENTER, founder Q2 hybrid decision 2026-06-10):
 *
 * - Option B DEFAULT: a persisted per-member preference
 *   (`dashboard_configs.preferences.task_view_inclusion`) decides which task
 *   types are included in the views by default.
 * - Option A OVERRIDE: tappable pills change the mix for the current session
 *   only ("click on the day to view by that capability"). A "Save as default"
 *   action promotes the current mix to the persisted default.
 *
 * Sequential items in views show ONLY the next item to be done (founder Q2);
 * the type-filter helper enforces that here so every view host gets it.
 */

import { useMemo, useState, useCallback } from 'react'
import { Check, RefreshCw, Star, BookOpen, CheckSquare } from 'lucide-react'
import {
  useDashboardConfig,
  useUpdateDashboardConfig,
} from '@/hooks/useDashboardConfig'
import type { Task } from '@/hooks/useTasks'

export interface TaskTypeInclusion {
  routines: boolean
  opportunities: boolean
  sequential: boolean
}

/** Default default: views show plain tasks/habits only (current behavior). */
export const DEFAULT_INCLUSION: TaskTypeInclusion = {
  routines: false,
  opportunities: false,
  sequential: false,
}

/**
 * Apply the inclusion mix to a task list. Plain tasks + habits always count.
 * Sequential inclusion surfaces ONLY the next active, uncompleted item per
 * collection (founder Q2: "just show the next one to be done").
 */
export function applyTaskTypeInclusion(tasks: Task[], inclusion: TaskTypeInclusion): Task[] {
  return tasks.filter((t) => {
    if (t.task_type === 'task' || t.task_type === 'habit') return true
    if (t.task_type === 'routine') return inclusion.routines
    if (t.task_type.startsWith('opportunity')) return inclusion.opportunities
    if (t.task_type === 'sequential') {
      return inclusion.sequential && !!t.sequential_is_active && t.status !== 'completed'
    }
    return true
  })
}

export function useTaskViewInclusion(familyId: string | undefined, memberId: string | undefined) {
  const { data: config } = useDashboardConfig(familyId, memberId)
  const updateConfig = useUpdateDashboardConfig()

  const savedDefault = useMemo<TaskTypeInclusion>(() => {
    const raw = (config?.preferences as Record<string, unknown> | null)?.task_view_inclusion as
      | Partial<TaskTypeInclusion>
      | undefined
    return { ...DEFAULT_INCLUSION, ...(raw ?? {}) }
  }, [config?.preferences])

  // Option A: session-only override (null = follow the saved default)
  const [sessionOverride, setSessionOverride] = useState<TaskTypeInclusion | null>(null)

  const effective = sessionOverride ?? savedDefault

  const togglType = useCallback(
    (key: keyof TaskTypeInclusion) => {
      const base = sessionOverride ?? savedDefault
      setSessionOverride({ ...base, [key]: !base[key] })
    },
    [sessionOverride, savedDefault]
  )

  const saveAsDefault = useCallback(() => {
    if (!familyId || !memberId || !sessionOverride) return
    updateConfig.mutate({
      familyId,
      memberId,
      preferences: {
        ...((config?.preferences as Record<string, unknown>) ?? {}),
        task_view_inclusion: sessionOverride,
      },
    })
    setSessionOverride(null) // saved default now carries the value
  }, [familyId, memberId, sessionOverride, config?.preferences, updateConfig])

  const isOverridden = sessionOverride !== null &&
    (sessionOverride.routines !== savedDefault.routines ||
      sessionOverride.opportunities !== savedDefault.opportunities ||
      sessionOverride.sequential !== savedDefault.sequential)

  return { effective, savedDefault, isOverridden, togglType, saveAsDefault }
}

const PILLS: Array<{ key: keyof TaskTypeInclusion | 'tasks'; label: string; icon: React.ReactNode }> = [
  { key: 'tasks', label: 'Tasks', icon: <CheckSquare size={12} /> },
  { key: 'routines', label: 'Routines', icon: <RefreshCw size={12} /> },
  { key: 'opportunities', label: 'Opportunities', icon: <Star size={12} /> },
  { key: 'sequential', label: 'Sequential', icon: <BookOpen size={12} /> },
]

export function TaskViewInclusionPills({
  inclusion,
  isOverridden,
  onToggle,
  onSaveDefault,
}: {
  inclusion: TaskTypeInclusion
  isOverridden: boolean
  onToggle: (key: keyof TaskTypeInclusion) => void
  onSaveDefault: () => void
}) {
  return (
    <div className="flex items-center gap-1.5 flex-wrap" data-testid="task-view-inclusion">
      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        Include:
      </span>
      {PILLS.map(({ key, label, icon }) => {
        const isTasksPill = key === 'tasks'
        const active = isTasksPill || inclusion[key as keyof TaskTypeInclusion]
        return (
          <button
            key={key}
            onClick={isTasksPill ? undefined : () => onToggle(key as keyof TaskTypeInclusion)}
            disabled={isTasksPill}
            data-testid={`inclusion-pill-${key}`}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-full whitespace-nowrap"
            style={{
              backgroundColor: active ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-card)',
              color: active ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
              opacity: isTasksPill ? 0.85 : 1,
              cursor: isTasksPill ? 'default' : 'pointer',
            }}
            aria-pressed={active}
            title={isTasksPill ? 'Tasks are always included' : `Toggle ${label.toLowerCase()} in your views`}
          >
            {icon}
            {label}
          </button>
        )
      })}
      {isOverridden && (
        <button
          onClick={onSaveDefault}
          data-testid="inclusion-save-default"
          className="flex items-center gap-1 text-xs px-2 py-1 rounded-full"
          style={{ color: 'var(--color-btn-primary-bg)' }}
          title="Make this mix your everyday default"
        >
          <Check size={12} />
          Save as default
        </button>
      )}
    </div>
  )
}
