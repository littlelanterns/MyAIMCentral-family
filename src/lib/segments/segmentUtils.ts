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
 * Returns segment groups (in segment sort_order) plus unsegmented tasks.
 */
export function groupTasksBySegment(
  segments: TaskSegment[],
  tasks: Task[],
): { segmentGroups: SegmentGroup[]; unsegmentedTasks: Task[] } {
  const segmentMap = new Map<string, Task[]>()
  for (const seg of segments) {
    segmentMap.set(seg.id, [])
  }

  const unsegmentedTasks: Task[] = []

  for (const task of tasks) {
    if (task.task_segment_id && segmentMap.has(task.task_segment_id)) {
      segmentMap.get(task.task_segment_id)!.push(task)
    } else {
      unsegmentedTasks.push(task)
    }
  }

  const segmentGroups: SegmentGroup[] = segments
    .map(segment => ({
      segment,
      tasks: segmentMap.get(segment.id) ?? [],
    }))
    .filter(g => g.tasks.length > 0) // hide empty segments

  return { segmentGroups, unsegmentedTasks }
}
