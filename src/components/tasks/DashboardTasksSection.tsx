/**
 * DashboardTasksSection — PRD-09A Screen 7
 *
 * Collapsible section for each member's dashboard with view toggle carousel.
 * Renders the active view below the carousel.
 * Supports all shells with appropriate view filtering.
 */

import { useState, useCallback, useMemo } from 'react'
import { ChevronDown, ChevronRight, CheckSquare } from 'lucide-react'
import { SparkleOverlay } from '@/components/shared'
import { TaskCreationModal } from './TaskCreationModal'
import { supabase } from '@/lib/supabase/client'
import { useQueryClient } from '@tanstack/react-query'
import { ViewCarousel, type TaskViewKey } from './ViewCarousel'
import { SimpleListView } from './views/SimpleListView'
import { EisenhowerView } from './views/EisenhowerView'
import { EatTheFrogView } from './views/EatTheFrogView'
import { OneFiveThreeView } from './views/OneFiveThreeView'
import { ByCategoryView } from './views/ByCategoryView'
import { KanbanView } from './views/KanbanView'
import { NowNextOptionalView } from './views/NowNextOptionalView'
import { PlannedViewStub } from './views/PlannedViewStub'
import { TaskCardGuided } from './TaskCard'
import { TaskCardPlay } from './TaskCardPlay'
import { useTaskCompletion } from './useTaskCompletion'
import { useShell } from '@/components/shells/ShellProvider'
import { useTaskRandomizerDraws } from '@/hooks/useTaskRandomizerDraws'
import { filterTasksForToday } from '@/lib/tasks/recurringTaskFilter'
import type { Task } from '@/hooks/useTasks'

// Default view per shell
const DEFAULT_VIEWS: Record<string, TaskViewKey> = {
  mom: 'simple_list',
  adult: 'simple_list',
  independent: 'simple_list',
  guided: 'now_next_optional',
  play: 'simple_list',
}

interface DashboardTasksSectionProps {
  tasks: Task[]
  memberId: string
  familyId: string
  /** Whether section starts expanded (default: true) */
  defaultExpanded?: boolean
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void
  /** Daily Progress Marking: "Worked on this today" handler */
  onWorkedOnThis?: (task: Task) => void
}

export function DashboardTasksSection({
  tasks,
  memberId,
  familyId,
  defaultExpanded = true,
  onUpdateTask,
  onWorkedOnThis,
}: DashboardTasksSectionProps) {
  const { shell } = useShell()
  const [isExpanded, setIsExpanded] = useState(defaultExpanded)
  const [activeView, setActiveView] = useState<TaskViewKey>(DEFAULT_VIEWS[shell] ?? 'simple_list')
  const [sparkleOrigin, setSparkleOrigin] = useState<{ x: number; y: number } | null>(null)
  const [editingTask, setEditingTask] = useState<Task | null>(null)

  const todaysTasks = useMemo(() => filterTasksForToday(tasks), [tasks])
  const activeTasks = todaysTasks.filter((t) => t.status !== 'completed' && t.status !== 'cancelled')
  const completedToday = todaysTasks.filter((t) => {
    if (t.status !== 'completed' || !t.completed_at) return false
    const completedDate = new Date(t.completed_at).toDateString()
    return completedDate === new Date().toDateString()
  })

  const { toggle, isCompleting } = useTaskCompletion({
    memberId,
    familyId,
    onSparkle: (origin) => {
      setSparkleOrigin(origin ?? null)
      setTimeout(() => setSparkleOrigin(null), 1000)
    },
  })

  // Fetch today's randomizer draws for tasks with linked_list_id
  const { taskDrawMap } = useTaskRandomizerDraws(tasks, memberId)

  const queryClient = useQueryClient()

  const handleViewChange = useCallback((view: TaskViewKey) => {
    setActiveView(view)
  }, [])

  // Play shell — special rendering
  if (shell === 'play') {
    return (
      <div className="space-y-3">
        {/* Sparkle */}
        {sparkleOrigin && (
          <SparkleOverlay
            type="full_celebration"
            origin={sparkleOrigin}
            onComplete={() => setSparkleOrigin(null)}
          />
        )}

        {/* Play header */}
        <div className="flex items-center gap-2 px-1">
          <CheckSquare size={20} style={{ color: 'var(--color-success, #22c55e)' }} />
          <span className="font-bold text-base" style={{ color: 'var(--color-text-heading)' }}>
            My Tasks ({activeTasks.length})
          </span>
        </div>

        {/* Play tiles */}
        <div className="grid grid-cols-2 gap-3">
          {activeTasks.map((task, i) => (
            <TaskCardPlay
              key={task.id}
              task={task}
              isCompleting={isCompleting(task.id)}
              onToggle={toggle}
              colorIndex={i}
              onWorkedOnThis={task.track_progress ? onWorkedOnThis : undefined}
            />
          ))}
        </div>
      </div>
    )
  }

  // Guided shell — simplified cards, NNO or Simple List only
  if (shell === 'guided') {
    return (
      <div className="space-y-3">
        {sparkleOrigin && (
          <SparkleOverlay
            type="quick_burst"
            origin={sparkleOrigin}
            onComplete={() => setSparkleOrigin(null)}
          />
        )}

        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full flex items-center gap-3 text-left"
          style={{ minHeight: 48 }}
        >
          <CheckSquare size={22} style={{ color: 'var(--color-btn-primary-bg)' }} />
          <span
            className="font-semibold text-base flex-1"
            style={{ color: 'var(--color-text-heading)' }}
          >
            My Tasks ({activeTasks.length})
          </span>
          {isExpanded ? (
            <ChevronDown size={18} style={{ color: 'var(--color-text-secondary)' }} />
          ) : (
            <ChevronRight size={18} style={{ color: 'var(--color-text-secondary)' }} />
          )}
        </button>

        {isExpanded && (
          <div className="space-y-3">
            {activeTasks.map((task) => (
              <TaskCardGuided
                key={task.id}
                task={task}
                isCompleting={isCompleting(task.id)}
                onToggle={toggle}
                onWorkedOnThis={task.track_progress ? onWorkedOnThis : undefined}
              />
            ))}
          </div>
        )}
      </div>
    )
  }

  // Mom / Adult / Independent shells — full view with carousel
  const taskCount = activeTasks.length + completedToday.length
  const PLANNED_VIEWS = new Set(['big_rocks', 'ivy_lee', 'abcde', 'moscow', 'impact_effort', 'by_member'])

  return (
    <div className="space-y-3">
      {/* Sparkle overlay */}
      {sparkleOrigin && (
        <SparkleOverlay
          type="quick_burst"
          origin={sparkleOrigin}
          onComplete={() => setSparkleOrigin(null)}
        />
      )}

      {/* Section header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center gap-2 text-left"
        style={{ minHeight: 'var(--touch-target-min, 44px)' }}
      >
        <CheckSquare size={20} style={{ color: 'var(--color-btn-primary-bg)' }} />
        <span
          className="font-semibold text-base flex-1"
          style={{ color: 'var(--color-text-heading)' }}
        >
          Tasks
        </span>
        {taskCount > 0 && (
          <span
            className="text-sm px-2 py-0.5 rounded-full"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)',
              color: 'var(--color-btn-primary-bg)',
              fontWeight: 500,
            }}
          >
            {activeTasks.length}
            {completedToday.length > 0 && ` / ${completedToday.length} done`}
          </span>
        )}
        {isExpanded ? (
          <ChevronDown size={16} style={{ color: 'var(--color-text-secondary)' }} />
        ) : (
          <ChevronRight size={16} style={{ color: 'var(--color-text-secondary)' }} />
        )}
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="space-y-3">
          {/* View carousel */}
          <ViewCarousel shell={shell} activeView={activeView} onViewChange={handleViewChange} />

          {/* Active view */}
          <ViewRenderer
            viewKey={activeView}
            tasks={tasks}
            onToggle={toggle}
            isCompleting={isCompleting}
            onUpdateTask={onUpdateTask}
            onEdit={setEditingTask}
            shell={shell}
            isPlanned={PLANNED_VIEWS.has(activeView)}
            taskDrawMap={taskDrawMap}
          />
        </div>
      )}

      {/* Edit task modal */}
      {editingTask && (
        <TaskCreationModal
          isOpen={true}
          onClose={() => setEditingTask(null)}
          onSave={async (data) => {
            await supabase
              .from('tasks')
              .update({
                title: data.title,
                description: data.description || null,
                life_area_tag: data.lifeAreaTag || null,
                duration_estimate: data.durationEstimate || null,
                incomplete_action: data.incompleteAction,
                require_approval: data.reward?.requireApproval ?? false,
                victory_flagged: data.reward?.flagAsVictory ?? false,
                counts_for_allowance: data.countsForAllowance ?? false,
                counts_for_homework: data.countsForHomework ?? false,
                counts_for_gamification: data.countsForGamification ?? true,
              })
              .eq('id', editingTask.id)
            queryClient.invalidateQueries({ queryKey: ['tasks'] })
            setEditingTask(null)
          }}
          initialTaskType={editingTask.task_type}
          defaultTitle={editingTask.title}
          defaultDescription={editingTask.description ?? ''}
          editMode
          editTaskValues={{
            incompleteAction: editingTask.incomplete_action ?? undefined,
            lifeAreaTag: editingTask.life_area_tag ?? undefined,
            durationEstimate: editingTask.duration_estimate ?? undefined,
            dueDate: editingTask.due_date ?? undefined,
            requireApproval: editingTask.require_approval ?? undefined,
            victoryFlagged: editingTask.victory_flagged ?? undefined,
            trackProgress: editingTask.track_progress ?? undefined,
            trackDuration: editingTask.track_duration ?? undefined,
            countsForAllowance: editingTask.counts_for_allowance ?? undefined,
            countsForHomework: editingTask.counts_for_homework ?? undefined,
            countsForGamification: editingTask.counts_for_gamification ?? undefined,
          }}
        />
      )}
    </div>
  )
}

interface ViewRendererProps {
  viewKey: TaskViewKey
  tasks: Task[]
  onToggle: (task: Task, origin?: { x: number; y: number }) => void
  isCompleting: (taskId: string) => boolean
  onUpdateTask?: (taskId: string, updates: Partial<Task>) => void
  onEdit?: (task: Task) => void
  shell: string
  isPlanned?: boolean
  taskDrawMap?: Record<string, import('@/hooks/useTaskRandomizerDraws').TaskRandomizerDraw>
}

function ViewRenderer({
  viewKey,
  tasks,
  onToggle,
  isCompleting,
  onUpdateTask,
  onEdit,
  shell,
  isPlanned,
  taskDrawMap,
}: ViewRendererProps) {
  if (isPlanned) {
    return <PlannedViewStub viewKey={viewKey} />
  }

  const commonProps = {
    tasks,
    onToggle,
    isCompleting,
    onUpdateTask,
    onEdit,
    taskDrawMap,
  }

  switch (viewKey) {
    case 'simple_list':
      return <SimpleListView {...commonProps} />
    case 'eisenhower':
      return <EisenhowerView {...commonProps} />
    case 'eat_the_frog':
      return <EatTheFrogView {...commonProps} />
    case 'one_three_five':
      return <OneFiveThreeView {...commonProps} />
    case 'by_category':
      return <ByCategoryView {...commonProps} />
    case 'kanban':
      return <KanbanView {...commonProps} />
    case 'now_next_optional':
      return (
        <NowNextOptionalView
          {...commonProps}
          shell={shell as 'mom' | 'adult' | 'independent' | 'guided' | 'play'}
        />
      )
    default:
      return <SimpleListView {...commonProps} />
  }
}
