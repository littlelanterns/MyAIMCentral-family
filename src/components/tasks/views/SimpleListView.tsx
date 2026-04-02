/**
 * SimpleListView — PRD-09A View 1
 *
 * Plain checkboxes, drag-to-reorder via @dnd-kit.
 * Default view for all shells.
 */

import { useState, useCallback, useMemo } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { TaskCard } from '../TaskCard'
import { EmptyState } from '@/components/shared'
import { CheckSquare } from 'lucide-react'
import { useUpdateTaskViewMetadata } from '@/hooks/useTasks'
import type { Task } from '@/hooks/useTasks'

interface SimpleListViewProps {
  tasks: Task[]
  onToggle: (task: Task, origin?: { x: number; y: number }) => void
  onEdit?: (task: Task) => void
  onFocusTimer?: (task: Task) => void
  onBreakItDown?: (task: Task) => void
  onAssign?: (task: Task) => void
  onDelete?: (task: Task) => void
  isCompleting?: (taskId: string) => boolean
}

export function SimpleListView({
  tasks,
  onToggle,
  onEdit,
  onFocusTimer,
  onBreakItDown,
  onAssign,
  onDelete,
  isCompleting,
}: SimpleListViewProps) {
  const updateViewMetadata = useUpdateTaskViewMetadata()

  // Separate active vs completed tasks
  const activeTasks = useMemo(
    () =>
      tasks
        .filter((t) => t.status !== 'completed' && t.status !== 'cancelled')
        .sort((a, b) => a.sort_order - b.sort_order),
    [tasks],
  )

  const completedTasks = useMemo(
    () => {
      const todayStr = new Date().toDateString()
      return tasks.filter((t) => {
        if (t.status !== 'completed' && t.status !== 'cancelled') return false
        // Only show tasks completed today on the dashboard
        if (!t.completed_at) return false
        return new Date(t.completed_at).toDateString() === todayStr
      })
    },
    [tasks],
  )

  // Local optimistic order state — IDs only
  const [orderedIds, setOrderedIds] = useState<string[] | null>(null)

  // Derive the display order: use optimistic state if it exists, otherwise from activeTasks
  const displayTasks = useMemo(() => {
    if (!orderedIds) return activeTasks

    // Map IDs back to task objects, filtering out any that no longer exist
    const taskMap = new Map(activeTasks.map((t) => [t.id, t]))
    const ordered = orderedIds
      .map((id) => taskMap.get(id))
      .filter(Boolean) as Task[]

    // Append any new tasks not yet in the ordered list
    const orderedSet = new Set(orderedIds)
    const newTasks = activeTasks.filter((t) => !orderedSet.has(t.id))

    return [...ordered, ...newTasks]
  }, [orderedIds, activeTasks])

  // Reset optimistic state when tasks array reference changes
  // (e.g., after server refetch confirms the reorder)
  const taskIdsKey = activeTasks.map((t) => t.id).join(',')
  const [lastTaskIdsKey, setLastTaskIdsKey] = useState(taskIdsKey)
  if (taskIdsKey !== lastTaskIdsKey) {
    setLastTaskIdsKey(taskIdsKey)
    setOrderedIds(null)
  }

  // Sensor: pointer with distance activation to avoid interfering with clicks
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
  )

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event
      if (!over || active.id === over.id) return

      const currentOrder = displayTasks.map((t) => t.id)
      const oldIndex = currentOrder.indexOf(active.id as string)
      const newIndex = currentOrder.indexOf(over.id as string)

      if (oldIndex === -1 || newIndex === -1) return

      const newOrder = arrayMove(currentOrder, oldIndex, newIndex)

      // Optimistic update
      setOrderedIds(newOrder)

      // Persist sort_order to DB for each reordered task
      newOrder.forEach((id, index) => {
        const task = displayTasks.find((t) => t.id === id)
        if (task && task.sort_order !== index) {
          updateViewMetadata.mutate({
            taskId: id,
            metadata: { sort_order: index },
          })
        }
      })
    },
    [displayTasks, updateViewMetadata],
  )

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<CheckSquare size={36} />}
        title="All clear!"
        description="No tasks here. Add one to get started."
      />
    )
  }

  const sortableIds = displayTasks.map((t) => t.id)

  return (
    <div className="space-y-4">
      {/* Active tasks — draggable */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-2">
            {displayTasks.map((task) => (
              <SortableTaskItem
                key={task.id}
                task={task}
                isCompleting={isCompleting?.(task.id)}
                onToggle={onToggle}
                onEdit={onEdit}
                onFocusTimer={onFocusTimer}
                onBreakItDown={onBreakItDown}
                onAssign={onAssign}
                onDelete={onDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {/* Completed tasks — static, not draggable */}
      {completedTasks.length > 0 && (
        <div className="space-y-2">
          <p
            className="text-xs font-medium uppercase tracking-wide px-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Completed ({completedTasks.length})
          </p>
          {completedTasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              isCompleting={isCompleting?.(task.id)}
              onToggle={onToggle}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ----------------------------------------------------------------
// SortableTaskItem — wraps TaskCard with useSortable
// ----------------------------------------------------------------

interface SortableTaskItemProps {
  task: Task
  isCompleting?: boolean
  onToggle: (task: Task, origin?: { x: number; y: number }) => void
  onEdit?: (task: Task) => void
  onFocusTimer?: (task: Task) => void
  onBreakItDown?: (task: Task) => void
  onAssign?: (task: Task) => void
  onDelete?: (task: Task) => void
}

function SortableTaskItem({
  task,
  isCompleting,
  onToggle,
  onEdit,
  onFocusTimer,
  onBreakItDown,
  onAssign,
  onDelete,
}: SortableTaskItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
    position: 'relative' as const,
  }

  // Combine attributes and listeners into dragHandleProps for the grip icon
  const dragHandleProps = { ...attributes, ...listeners }

  return (
    <div ref={setNodeRef} style={style}>
      <TaskCard
        task={task}
        isCompleting={isCompleting}
        onToggle={onToggle}
        onEdit={onEdit}
        onFocusTimer={onFocusTimer}
        onBreakItDown={onBreakItDown}
        onAssign={onAssign}
        onDelete={onDelete}
        dragHandleProps={dragHandleProps}
      />
    </div>
  )
}
