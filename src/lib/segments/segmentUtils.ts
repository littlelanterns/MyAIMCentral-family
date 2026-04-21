/**
 * segmentUtils — Build M Phase 5
 *
 * Shared utilities for segment rendering across all shells.
 * Extracted from PlayTaskTileGrid so Guided/Independent/Adult
 * shells can reuse the same grouping logic.
 */

import type { Task } from '@/types/tasks'
import type { TaskSegment } from '@/types/play-dashboard'

/** Check if a segment should be visible today based on its day_filter. */
export function isSegmentActiveToday(segment: TaskSegment): boolean {
  if (!segment.day_filter || segment.day_filter.length === 0) return true
  return segment.day_filter.includes(new Date().getDay())
}

export interface SegmentGroup {
  segment: TaskSegment
  tasks: Task[]
}

/**
 * Group tasks by their task_segment_id.
 *
 * Returns segment groups (in segment sort_order) plus unsegmented tasks.
 *
 * Tasks whose `task_segment_id` points to a segment that exists for the
 * member but is not active today (e.g. a weekday-only "Morning Chores"
 * segment on a Saturday) are HIDDEN — not rebucketed into "Other". Only
 * tasks with `task_segment_id === null` or a segment_id that no longer
 * exists for this member fall through to `unsegmentedTasks`.
 *
 * @param activeSegments  Segments scheduled today (used for rendering groups).
 * @param tasks           Tasks to group.
 * @param allSegments     Optional — full segment list for the member. When
 *                        provided, tasks whose segment is in allSegments but
 *                        not in activeSegments are dropped entirely. When
 *                        omitted, falls back to prior behavior (those tasks
 *                        appear in unsegmentedTasks).
 */
export function groupTasksBySegment(
  activeSegments: TaskSegment[],
  tasks: Task[],
  allSegments?: TaskSegment[],
): { segmentGroups: SegmentGroup[]; unsegmentedTasks: Task[] } {
  const activeSegmentIds = new Set(activeSegments.map(s => s.id))
  const knownSegmentIds = allSegments
    ? new Set(allSegments.map(s => s.id))
    : activeSegmentIds

  const segmentMap = new Map<string, Task[]>()
  for (const seg of activeSegments) {
    segmentMap.set(seg.id, [])
  }

  const unsegmentedTasks: Task[] = []

  for (const task of tasks) {
    if (task.task_segment_id) {
      if (activeSegmentIds.has(task.task_segment_id)) {
        // Task belongs to a segment that's active today — group it.
        segmentMap.get(task.task_segment_id)!.push(task)
      } else if (knownSegmentIds.has(task.task_segment_id)) {
        // Task belongs to a segment that exists but isn't active today.
        // Hide — do not rebucket into "Other".
        continue
      } else {
        // Orphaned segment reference (segment was deleted). Surface in Other.
        unsegmentedTasks.push(task)
      }
    } else {
      unsegmentedTasks.push(task)
    }
  }

  const segmentGroups: SegmentGroup[] = activeSegments
    .map(segment => ({
      segment,
      tasks: segmentMap.get(segment.id) ?? [],
    }))
    .filter(g => g.tasks.length > 0) // hide empty segments

  return { segmentGroups, unsegmentedTasks }
}
