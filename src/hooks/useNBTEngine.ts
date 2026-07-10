/**
 * PRD-25: Next Best Thing engine
 * Deterministic 8-level priority system for Guided dashboard (Convention #126).
 * Computes suggestions from task/intention data — no database table needed.
 */

import { useState, useMemo, useCallback } from 'react'
import { useTasks } from './useTasks'
import { useBestIntentions } from './useBestIntentions'
import { useFamilyToday } from './useFamilyToday'
import type { NBTSuggestion } from '@/types/guided-dashboard'
import type { Task } from '@/types/tasks'
import type { BestIntention } from './useBestIntentions'
import { todayLocalIso } from '@/utils/dates'
import { filterTasksForToday } from '@/lib/tasks/recurringTaskFilter'

export interface UseNBTEngineReturn {
  suggestions: NBTSuggestion[]
  currentIndex: number
  currentSuggestion: NBTSuggestion | null
  advance: () => void
  isLoading: boolean
  isEmpty: boolean
}

/**
 * Pure priority-computation core, extracted from the hook so the GDCX Slice 1
 * day-scheduling fix (filterTasksForToday) can be pinned with a plain unit
 * test — no React, no mocked hooks, no real-seed-data noise. `now` and
 * `today` are passed in (rather than computed with `new Date()` internally)
 * so tests can exercise a specific point in time deterministically.
 */
export function computeNBTSuggestions(
  tasks: Task[],
  intentions: BestIntention[],
  memberId: string | undefined,
  today: string,
  now: Date = new Date(),
): NBTSuggestion[] {
  if (!memberId) return []

  const todayDate = (() => {
    const [y, m, d] = today.split('-').map(Number)
    return new Date(y, m - 1, d)
  })()
  const currentHour = now.getHours()
  const currentMinutes = currentHour * 60 + now.getMinutes()

  // GDCX Slice 1 root-cause fix: the engine previously suggested tasks
  // regardless of whether they were actually scheduled for today (e.g. an
  // MWF routine suggested on a Tuesday, or a routine whose dtstart hadn't
  // arrived yet). This is the same day-scheduling filter
  // GuidedActiveTasksSection applies to "My Tasks" — NBT's suggestion pool
  // must match what the kid's own task list shows for today, never wider.
  const todaysTasks = filterTasksForToday(tasks, todayDate)
  const result: NBTSuggestion[] = []

    // Priority 1: Overdue tasks
    const overdueTasks = todaysTasks.filter(t => {
      if (!t.due_date) return false
      if (t.due_date < today) return true
      if (t.due_date === today && t.due_time) {
        const [h, m] = t.due_time.split(':').map(Number)
        return h * 60 + m < currentMinutes
      }
      return false
    })
    for (const t of overdueTasks) {
      result.push({
        id: `overdue-${t.id}`,
        type: 'overdue_task',
        title: t.title,
        subtitle: 'Overdue',
        navigateTo: '/tasks',
        entityId: t.id,
        entityType: 'task',
        pointValue: t.points_override ?? undefined,
      })
    }

    // Priority 2: Active routines in progress
    const activeRoutines = todaysTasks.filter(
      t => t.task_type === 'routine' && t.status === 'in_progress'
    )
    for (const t of activeRoutines) {
      result.push({
        id: `routine-${t.id}`,
        type: 'active_routine',
        title: t.title,
        subtitle: 'In progress',
        navigateTo: '/tasks',
        entityId: t.id,
        entityType: 'routine',
        pointValue: t.points_override ?? undefined,
      })
    }

    // Priority 3: Current time-block tasks (±15 min window)
    const timeBlockTasks = todaysTasks.filter(t => {
      if (!t.due_date || t.due_date !== today || !t.due_time) return false
      if (overdueTasks.some(o => o.id === t.id)) return false
      const [h, m] = t.due_time.split(':').map(Number)
      const taskMinutes = h * 60 + m
      return Math.abs(taskMinutes - currentMinutes) <= 15
    })
    for (const t of timeBlockTasks) {
      result.push({
        id: `timeblock-${t.id}`,
        type: 'time_block',
        title: t.title,
        subtitle: `Scheduled for ${t.due_time?.slice(0, 5)}`,
        navigateTo: '/tasks',
        entityId: t.id,
        entityType: 'task',
        pointValue: t.points_override ?? undefined,
      })
    }

    // Priority 4: Mom-prioritized tasks
    const momPriority = todaysTasks.filter(
      t =>
        t.priority === 'now' &&
        !overdueTasks.some(o => o.id === t.id) &&
        !timeBlockTasks.some(tb => tb.id === t.id) &&
        !activeRoutines.some(r => r.id === t.id)
    )
    for (const t of momPriority) {
      result.push({
        id: `priority-${t.id}`,
        type: 'mom_priority',
        title: t.title,
        subtitle: 'Priority',
        navigateTo: '/tasks',
        entityId: t.id,
        entityType: 'task',
        pointValue: t.points_override ?? undefined,
      })
    }

    // Track already-added task IDs
    const addedIds = new Set(result.map(r => r.entityId))

    // Priority 5: Next due task
    const futureDue = todaysTasks
      .filter(t => t.due_date && t.due_date >= today && !addedIds.has(t.id))
      .sort((a, b) => {
        const dateCompare = (a.due_date ?? '').localeCompare(b.due_date ?? '')
        if (dateCompare !== 0) return dateCompare
        return (a.due_time ?? '').localeCompare(b.due_time ?? '')
      })
    for (const t of futureDue) {
      if (addedIds.has(t.id)) continue
      addedIds.add(t.id)
      result.push({
        id: `nextdue-${t.id}`,
        type: 'next_due',
        title: t.title,
        subtitle: t.due_date === today ? `Due today` : `Due ${t.due_date}`,
        navigateTo: '/tasks',
        entityId: t.id,
        entityType: 'task',
        pointValue: t.points_override ?? undefined,
      })
    }

    // Priority 6: Available opportunities
    const opportunities = todaysTasks.filter(
      t =>
        (t.task_type === 'opportunity_repeatable' ||
          t.task_type === 'opportunity_claimable' ||
          t.task_type === 'opportunity_capped') &&
        !addedIds.has(t.id)
    )
    const sortedOpps = [...opportunities].sort(
      (a, b) => (b.points_override ?? 0) - (a.points_override ?? 0)
    )
    for (const t of sortedOpps) {
      addedIds.add(t.id)
      result.push({
        id: `opp-${t.id}`,
        type: 'opportunity',
        title: t.title,
        subtitle: t.points_override ? `Worth ${t.points_override} points` : 'Available',
        navigateTo: '/tasks',
        entityId: t.id,
        entityType: 'opportunity',
        pointValue: t.points_override ?? undefined,
      })
    }

    // Priority 7: Unscheduled tasks
    const unscheduled = todaysTasks.filter(t => !addedIds.has(t.id))
    for (const t of unscheduled) {
      result.push({
        id: `unsched-${t.id}`,
        type: 'unscheduled',
        title: t.title,
        navigateTo: '/tasks',
        entityId: t.id,
        entityType: 'task',
        pointValue: t.points_override ?? undefined,
      })
    }

    // Priority 8: Best Intention reminders
    const activeIntentions = (intentions ?? []).filter(
      i => i.is_active && !i.archived_at
    )
    for (const i of activeIntentions) {
      result.push({
        id: `intention-${i.id}`,
        type: 'best_intention',
        title: i.statement,
        subtitle: 'Remember to practice this!',
        entityId: i.id,
        entityType: 'intention',
      })
    }

  return result
}

export function useNBTEngine(
  familyId: string | undefined,
  memberId: string | undefined
): UseNBTEngineReturn {
  const [currentIndex, setCurrentIndex] = useState(0)

  const { data: tasks = [], isLoading: tasksLoading } = useTasks(familyId, {
    assigneeId: memberId,
    status: ['pending', 'in_progress'],
    archived: false,
  })

  const { data: intentions = [], isLoading: intentionsLoading } = useBestIntentions(memberId)
  // GDCX Slice 1 (2026-07): family-timezone-derived "today" per Convention #257,
  // same seeded pattern CLIENT-DATE-REMEDIATION established at every other
  // filterTasksForToday call site (GuidedActiveTasksSection, Tasks, PlayDashboard).
  const { data: todayFamily } = useFamilyToday(memberId)
  const isLoading = tasksLoading || intentionsLoading

  const suggestions = useMemo(
    () => computeNBTSuggestions(tasks, intentions, memberId, todayFamily ?? todayLocalIso()),
    [tasks, intentions, memberId, todayFamily],
  )

  const advance = useCallback(() => {
    setCurrentIndex(prev =>
      suggestions.length > 0 ? (prev + 1) % suggestions.length : 0
    )
  }, [suggestions.length])

  const currentSuggestion = suggestions[currentIndex] ?? null

  return {
    suggestions,
    currentIndex,
    currentSuggestion,
    advance,
    isLoading,
    isEmpty: !isLoading && suggestions.length === 0,
  }
}
