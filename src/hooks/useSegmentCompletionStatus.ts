/**
 * useSegmentCompletionStatus — Build M Phase 2
 *
 * Pure computation hook (no queries). Given a member's segments and
 * today's tasks, returns a map of completion status per segment.
 * Used by PlayTaskTileGrid for progress bars and by the segment
 * celebration logic.
 */

import { useMemo } from 'react'
import type { Task } from '@/types/tasks'
import type { TaskSegment } from '@/types/play-dashboard'

export interface SegmentStatus {
  total: number
  completed: number
  isComplete: boolean
}

export type SegmentCompletionMap = Record<string, SegmentStatus>

export function useSegmentCompletionStatus(
  segments: TaskSegment[] | undefined,
  tasks: Task[],
): SegmentCompletionMap {
  return useMemo(() => {
    const map: SegmentCompletionMap = {}
    if (!segments || segments.length === 0) return map

    for (const seg of segments) {
      const segTasks = tasks.filter(t => t.task_segment_id === seg.id)
      const completedCount = segTasks.filter(
        t => t.status === 'completed' || t.status === 'pending_approval',
      ).length

      map[seg.id] = {
        total: segTasks.length,
        completed: completedCount,
        isComplete: segTasks.length > 0 && completedCount >= segTasks.length,
      }
    }

    return map
  }, [segments, tasks])
}
