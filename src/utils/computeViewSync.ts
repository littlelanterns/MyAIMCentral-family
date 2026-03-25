/**
 * computeViewSync — PRD-09A cross-view metadata sync
 *
 * Pure function: given a task's current view fields and explicit user updates,
 * returns SUGGESTED updates for other view fields that are currently empty.
 *
 * Key rule: suggest, never force — only fills null/undefined fields,
 * never overwrites existing explicit values.
 */

import type { Task } from '@/types/tasks'

type ViewFields = Pick<
  Task,
  | 'eisenhower_quadrant'
  | 'frog_rank'
  | 'importance_level'
  | 'big_rock'
  | 'ivy_lee_rank'
  | 'abcde_category'
  | 'moscow_category'
  | 'impact_effort'
>

export function computeViewSync(
  task: Partial<ViewFields>,
  updates: Partial<ViewFields>,
): Partial<ViewFields> {
  const sync: Partial<ViewFields> = {}

  // Helper: only suggest if field is null/undefined AND not in explicit updates
  const suggest = <K extends keyof ViewFields>(field: K, value: ViewFields[K]) => {
    if (task[field] == null && !(field in updates)) {
      sync[field] = value
    }
  }

  // Eisenhower → other views
  if ('eisenhower_quadrant' in updates) {
    if (updates.eisenhower_quadrant === 'do_now') {
      suggest('importance_level', 'critical_1')
      if (!task.big_rock && !('big_rock' in updates)) sync.big_rock = true
      suggest('abcde_category', 'a')
      suggest('moscow_category', 'must')
    } else if (updates.eisenhower_quadrant === 'schedule') {
      suggest('importance_level', 'important_3')
      suggest('moscow_category', 'should')
    } else if (updates.eisenhower_quadrant === 'delegate') {
      suggest('abcde_category', 'd')
    } else if (updates.eisenhower_quadrant === 'eliminate') {
      suggest('abcde_category', 'e')
      suggest('moscow_category', 'wont')
      if (task.big_rock && !('big_rock' in updates)) sync.big_rock = false
    }
  }

  // Importance level → other views
  if ('importance_level' in updates) {
    if (updates.importance_level === 'critical_1') {
      suggest('eisenhower_quadrant', 'do_now')
      if (!task.big_rock && !('big_rock' in updates)) sync.big_rock = true
      suggest('abcde_category', 'a')
    } else if (updates.importance_level === 'important_3') {
      suggest('eisenhower_quadrant', 'schedule')
    }
  }

  // Big rock → other views
  if ('big_rock' in updates) {
    if (updates.big_rock === true) {
      suggest('importance_level', 'critical_1')
      suggest('eisenhower_quadrant', 'do_now')
    }
  }

  // Frog rank → other views
  if ('frog_rank' in updates) {
    if (updates.frog_rank === 1) {
      suggest('eisenhower_quadrant', 'do_now')
      suggest('importance_level', 'critical_1')
      if (!task.big_rock && !('big_rock' in updates)) sync.big_rock = true
    }
  }

  // Ivy Lee rank → importance
  if ('ivy_lee_rank' in updates && typeof updates.ivy_lee_rank === 'number') {
    if (updates.ivy_lee_rank <= 2) {
      suggest('importance_level', 'critical_1')
    } else if (updates.ivy_lee_rank <= 4) {
      suggest('importance_level', 'important_3')
    }
  }

  // ABCDE → other views
  if ('abcde_category' in updates) {
    if (updates.abcde_category === 'a') {
      suggest('eisenhower_quadrant', 'do_now')
      suggest('importance_level', 'critical_1')
    } else if (updates.abcde_category === 'd') {
      suggest('eisenhower_quadrant', 'delegate')
    } else if (updates.abcde_category === 'e') {
      suggest('eisenhower_quadrant', 'eliminate')
    }
  }

  // MoSCoW → other views
  if ('moscow_category' in updates) {
    if (updates.moscow_category === 'must') {
      suggest('eisenhower_quadrant', 'do_now')
      suggest('abcde_category', 'a')
    } else if (updates.moscow_category === 'wont') {
      suggest('eisenhower_quadrant', 'eliminate')
      suggest('abcde_category', 'e')
    }
  }

  return sync
}
