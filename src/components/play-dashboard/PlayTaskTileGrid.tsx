/**
 * PlayTaskTileGrid — Build M Phase 2
 *
 * Renders tasks grouped by segment when segments exist. Falls back to
 * the original flat grid when no segments are configured.
 *
 * Each segment section has:
 *   - Section banner: Lucide icon + segment name + progress ("3/4") + checkmark
 *   - Progress bar: visual completion percentage
 *   - Task tiles: PlayTaskTile components in a wrapping flex grid
 *
 * Tasks without a segment go into an "Other" group at the bottom.
 */

import { useMemo } from 'react'
import * as LucideIcons from 'lucide-react'
import { PlayTaskTile } from './PlayTaskTile'
import { MysteryTapTile } from './MysteryTapTile'
import { RedrawButton } from './RedrawButton'
import { usePlayTaskIcons } from '@/hooks/usePlayTaskIcons'
import { useTaskSegments } from '@/hooks/useTaskSegments'
import { useSegmentCompletionStatus } from '@/hooks/useSegmentCompletionStatus'
import { useTaskRandomizerDraws } from '@/hooks/useTaskRandomizerDraws'
import type { Task } from '@/types/tasks'
import type { TaskSegment } from '@/types/play-dashboard'

interface PlayTaskTileGridProps {
  tasks: Task[]
  completingTaskIds: Set<string>
  onTapTask: (task: Task) => void
  /** Member ID for segment queries */
  memberId?: string
  /** Segment IDs that just completed — triggers celebration glow */
  celebratingSegmentIds?: Set<string>
  /** True when an adult (mom/dad) is viewing — enables redraw buttons */
  isAdultViewing?: boolean
}

function getLucideIcon(name: string): React.FC<{ size?: number }> | null {
  return (LucideIcons as unknown as Record<string, React.FC<{ size?: number }>>)[name] ?? null
}

/** Check if a segment should be visible today based on its day_filter. */
function isSegmentActiveToday(segment: TaskSegment): boolean {
  if (!segment.day_filter || segment.day_filter.length === 0) return true
  return segment.day_filter.includes(new Date().getDay())
}

export function PlayTaskTileGrid({
  tasks,
  completingTaskIds,
  onTapTask,
  memberId,
  celebratingSegmentIds,
  isAdultViewing,
}: PlayTaskTileGridProps) {
  // Resolve icon URLs in one batch (no N+1)
  const { iconUrls } = usePlayTaskIcons(tasks)

  // Fetch today's randomizer draws for tasks with linked_list_id
  const { taskDrawMap } = useTaskRandomizerDraws(tasks, memberId)

  // Load segments for this member
  const { data: allSegments } = useTaskSegments(memberId)

  // Filter segments visible today
  const activeSegments = useMemo(
    () => (allSegments ?? []).filter(isSegmentActiveToday),
    [allSegments],
  )

  // Compute completion status per segment
  const completionMap = useSegmentCompletionStatus(activeSegments, tasks)

  const hasSegments = activeSegments.length > 0

  // Group tasks by segment
  const { segmentGroups, unsegmentedTasks } = useMemo(() => {
    if (!hasSegments) return { segmentGroups: [] as Array<{ segment: TaskSegment; tasks: Task[] }>, unsegmentedTasks: tasks }

    const grouped: Array<{ segment: TaskSegment; tasks: Task[] }> = activeSegments.map(seg => ({
      segment: seg,
      tasks: [],
    }))

    const segmentIndexMap = new Map<string, number>()
    activeSegments.forEach((seg, idx) => segmentIndexMap.set(seg.id, idx))

    const unseg: Task[] = []

    for (const task of tasks) {
      if (task.task_segment_id && segmentIndexMap.has(task.task_segment_id)) {
        grouped[segmentIndexMap.get(task.task_segment_id)!].tasks.push(task)
      } else {
        unseg.push(task)
      }
    }

    return { segmentGroups: grouped, unsegmentedTasks: unseg }
  }, [hasSegments, activeSegments, tasks])

  if (tasks.length === 0) {
    return (
      <div
        style={{
          padding: '2rem 1rem',
          textAlign: 'center',
          borderRadius: 'var(--vibe-radius-card, 1rem)',
          backgroundColor: 'var(--color-bg-card)',
          border: '1px dashed var(--color-border)',
          color: 'var(--color-text-secondary)',
          fontSize: 'var(--font-size-sm)',
        }}
      >
        No tasks for today. Take it easy!
      </div>
    )
  }

  // ── Flat grid (no segments configured) ───────────────────────────
  if (!hasSegments) {
    return <FlatGrid tasks={tasks} iconUrls={iconUrls} completingTaskIds={completingTaskIds} onTapTask={onTapTask} taskDrawMap={taskDrawMap} isAdultViewing={isAdultViewing} memberId={memberId} />
  }

  // ── Grouped grid ─────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {segmentGroups.map(({ segment, tasks: segTasks }) => {
        // Skip empty segments (tasks may be filtered or none assigned)
        if (segTasks.length === 0) return null
        const status = completionMap[segment.id]
        const isCelebrating = celebratingSegmentIds?.has(segment.id) ?? false

        return (
          <SegmentSection
            key={segment.id}
            segment={segment}
            tasks={segTasks}
            iconUrls={iconUrls}
            completingTaskIds={completingTaskIds}
            onTapTask={onTapTask}
            total={status?.total ?? 0}
            completed={status?.completed ?? 0}
            isComplete={status?.isComplete ?? false}
            isCelebrating={isCelebrating}
            taskDrawMap={taskDrawMap}
            isAdultViewing={isAdultViewing}
            memberId={memberId}
          />
        )
      })}

      {unsegmentedTasks.length > 0 && (
        <section>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              padding: '0.5rem 0.75rem',
              marginBottom: '0.5rem',
            }}
          >
            <span
              style={{
                fontSize: 'var(--font-size-base)',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
              }}
            >
              Other
            </span>
            <span
              style={{
                fontSize: 'var(--font-size-xs)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {unsegmentedTasks.filter(t => t.status === 'completed' || t.status === 'pending_approval').length}
              /{unsegmentedTasks.length}
            </span>
          </div>
          <div className="play-tile-grid">
            {unsegmentedTasks.map(task => {
              const draw = taskDrawMap[task.id]
              const isCompleted = task.status === 'completed' || task.status === 'pending_approval'
              return (
                <div key={task.id} className="flex flex-col gap-1">
                  <PlayTaskTile
                    task={task}
                    iconUrl={iconUrls[task.id] ?? null}
                    isCompleting={completingTaskIds.has(task.id)}
                    onTap={onTapTask}
                    subtitle={draw ? draw.itemName : undefined}
                  />
                  {draw && isAdultViewing && memberId && !isCompleted && (
                    <div className="flex justify-center">
                      <RedrawButton drawId={draw.drawId} listId={draw.listId} memberId={memberId} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      <TileGridStyles />
    </div>
  )
}

// ── Segment Section ──────────────────────────────────────────────────

interface SegmentSectionProps {
  segment: TaskSegment
  tasks: Task[]
  iconUrls: Record<string, string | null>
  completingTaskIds: Set<string>
  onTapTask: (task: Task) => void
  total: number
  completed: number
  isComplete: boolean
  isCelebrating: boolean
  taskDrawMap: Record<string, import('@/hooks/useTaskRandomizerDraws').TaskRandomizerDraw>
  isAdultViewing?: boolean
  memberId?: string
}

function SegmentSection({
  segment,
  tasks,
  iconUrls,
  completingTaskIds,
  onTapTask,
  total,
  completed,
  isComplete,
  isCelebrating,
  taskDrawMap,
  isAdultViewing,
  memberId,
}: SegmentSectionProps) {
  const Icon = segment.icon_key ? getLucideIcon(segment.icon_key) : null
  const progressPct = total > 0 ? Math.round((completed / total) * 100) : 0

  return (
    <section>
      {/* Segment banner */}
      <div
        className={isCelebrating ? 'segment-banner segment-banner--celebrating' : 'segment-banner'}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.625rem 0.75rem',
          borderRadius: 'var(--vibe-radius-card, 0.75rem) var(--vibe-radius-card, 0.75rem) 0 0',
          backgroundColor: isComplete
            ? 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, var(--color-bg-card))'
            : 'var(--color-bg-card)',
          borderTop: '1px solid var(--color-border)',
          borderLeft: '1px solid var(--color-border)',
          borderRight: '1px solid var(--color-border)',
          transition: 'background-color 0.3s ease',
        }}
      >
        {Icon && (
          <span style={{ color: 'var(--color-btn-primary-bg)', display: 'inline-flex', flexShrink: 0 }}>
            <Icon size={20} />
          </span>
        )}

        <span
          style={{
            fontSize: 'var(--font-size-base)',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
            flex: 1,
          }}
        >
          {segment.segment_name}
        </span>

        <span
          style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 500,
            color: isComplete ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
          }}
        >
          {completed}/{total}
        </span>

        {isComplete && (
          <span
            style={{
              width: 20,
              height: 20,
              borderRadius: '9999px',
              backgroundColor: 'var(--color-btn-primary-bg)',
              color: 'var(--color-btn-primary-text, #fff)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 12,
              fontWeight: 700,
              flexShrink: 0,
            }}
          >
            ✓
          </span>
        )}
      </div>

      {/* Progress bar */}
      <div
        style={{
          height: 4,
          backgroundColor: 'var(--color-bg-secondary)',
          borderLeft: '1px solid var(--color-border)',
          borderRight: '1px solid var(--color-border)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${progressPct}%`,
            backgroundColor: 'var(--color-btn-primary-bg)',
            transition: 'width 0.4s ease',
            borderRadius: progressPct >= 100 ? 0 : '0 2px 2px 0',
          }}
        />
      </div>

      {/* Task tiles */}
      <div
        style={{
          padding: '0.75rem',
          borderRadius: '0 0 var(--vibe-radius-card, 0.75rem) var(--vibe-radius-card, 0.75rem)',
          backgroundColor: 'var(--color-bg-card)',
          borderBottom: '1px solid var(--color-border)',
          borderLeft: '1px solid var(--color-border)',
          borderRight: '1px solid var(--color-border)',
        }}
      >
        <div className="play-tile-grid">
          {tasks.map(task => {
            const draw = taskDrawMap[task.id]
            const isRandomizerLinked = !!task.linked_list_id && !!draw
            const showRedraw = isRandomizerLinked && isAdultViewing && memberId
            const isCompleted = task.status === 'completed' || task.status === 'pending_approval'

            // Mystery tap: sparkly reveal card for randomizer-linked tasks
            if (isRandomizerLinked && segment.randomizer_reveal_style === 'mystery_tap') {
              return (
                <div key={task.id} className="flex flex-col gap-1">
                  <MysteryTapTile
                    task={task}
                    iconUrl={iconUrls[task.id] ?? null}
                    isCompleting={completingTaskIds.has(task.id)}
                    onTap={onTapTask}
                    drawnItemName={draw.itemName}
                  />
                  {showRedraw && !isCompleted && (
                    <div className="flex justify-center">
                      <RedrawButton drawId={draw.drawId} listId={draw.listId} memberId={memberId!} />
                    </div>
                  )}
                </div>
              )
            }

            // Show upfront: normal tile with drawn item name as subtitle
            return (
              <div key={task.id} className="flex flex-col gap-1">
                <PlayTaskTile
                  task={task}
                  iconUrl={iconUrls[task.id] ?? null}
                  isCompleting={completingTaskIds.has(task.id)}
                  onTap={onTapTask}
                  subtitle={isRandomizerLinked ? draw.itemName : undefined}
                />
                {showRedraw && !isCompleted && (
                  <div className="flex justify-center">
                    <RedrawButton drawId={draw.drawId} listId={draw.listId} memberId={memberId!} />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

// ── Flat grid (backward compat when no segments exist) ───────────────

function FlatGrid({
  tasks,
  iconUrls,
  completingTaskIds,
  onTapTask,
  taskDrawMap,
  isAdultViewing,
  memberId,
}: {
  tasks: Task[]
  iconUrls: Record<string, string | null>
  completingTaskIds: Set<string>
  onTapTask: (task: Task) => void
  taskDrawMap: Record<string, import('@/hooks/useTaskRandomizerDraws').TaskRandomizerDraw>
  isAdultViewing?: boolean
  memberId?: string
}) {
  const pending = tasks.filter(t => t.status !== 'completed' && t.status !== 'pending_approval')
  const completed = tasks.filter(t => t.status === 'completed' || t.status === 'pending_approval')

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {pending.length > 0 && (
        <section>
          <h2
            style={{
              margin: '0 0 0.5rem 0',
              fontSize: 'var(--font-size-base)',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
            }}
          >
            What's next
          </h2>
          <div className="play-tile-grid">
            {pending.map(task => {
              const draw = taskDrawMap[task.id]
              return (
                <div key={task.id} className="flex flex-col gap-1">
                  <PlayTaskTile
                    task={task}
                    iconUrl={iconUrls[task.id] ?? null}
                    isCompleting={completingTaskIds.has(task.id)}
                    onTap={onTapTask}
                    subtitle={draw ? draw.itemName : undefined}
                  />
                  {draw && isAdultViewing && memberId && (
                    <div className="flex justify-center">
                      <RedrawButton drawId={draw.drawId} listId={draw.listId} memberId={memberId} />
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section>
          <h2
            style={{
              margin: '0 0 0.5rem 0',
              fontSize: 'var(--font-size-base)',
              fontWeight: 600,
              color: 'var(--color-text-primary)',
            }}
          >
            Done today
          </h2>
          <div className="play-tile-grid">
            {completed.map(task => {
              const draw = taskDrawMap[task.id]
              return (
                <PlayTaskTile
                  key={task.id}
                  task={task}
                  iconUrl={iconUrls[task.id] ?? null}
                  isCompleting={false}
                  onTap={onTapTask}
                  subtitle={draw ? draw.itemName : undefined}
                />
              )
            })}
          </div>
        </section>
      )}

      <TileGridStyles />
    </div>
  )
}

// ── Shared CSS ────────────────────────────────────────────────────────

function TileGridStyles() {
  return (
    <style>{`
      .play-tile-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0.75rem;
      }
      @media (min-width: 640px) {
        .play-tile-grid {
          grid-template-columns: repeat(3, minmax(0, 1fr));
        }
      }
      @media (min-width: 1024px) {
        .play-tile-grid {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }
      }
      .segment-banner--celebrating {
        animation: segmentCelebrationGlow 1s ease-out forwards;
      }
      @keyframes segmentCelebrationGlow {
        0% { box-shadow: 0 0 0 0 color-mix(in srgb, var(--color-btn-primary-bg) 50%, transparent); }
        50% { box-shadow: 0 0 16px 4px color-mix(in srgb, var(--color-btn-primary-bg) 40%, transparent); }
        100% { box-shadow: 0 0 0 0 transparent; }
      }
      @media (prefers-reduced-motion: reduce) {
        .segment-banner--celebrating {
          animation: none;
        }
      }
    `}</style>
  )
}
