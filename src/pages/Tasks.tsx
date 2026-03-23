import { useState } from 'react'
import { CheckSquare, Plus, Circle, CheckCircle2, Clock, Pause } from 'lucide-react'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useTasks, useCreateTask, useUpdateTask } from '@/hooks/useTasks'
import type { Task, TaskType, TaskStatus, TaskPriority } from '@/hooks/useTasks'

const STATUS_ICONS: Record<TaskStatus, typeof Circle> = {
  pending: Circle,
  in_progress: Clock,
  completed: CheckCircle2,
  cancelled: Circle,
  paused: Pause,
}

const TASK_TYPES: { value: TaskType; label: string }[] = [
  { value: 'task', label: 'Task' },
  { value: 'routine', label: 'Routine' },
  { value: 'opportunity', label: 'Opportunity' },
  { value: 'habit', label: 'Habit' },
]

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: 'now', label: 'Now' },
  { value: 'next', label: 'Next' },
  { value: 'optional', label: 'Optional' },
  { value: 'someday', label: 'Someday' },
]

export function TasksPage() {
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { data: tasks = [], isLoading } = useTasks(family?.id)
  const createTask = useCreateTask()
  const updateTask = useUpdateTask()

  const [showCreate, setShowCreate] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formType, setFormType] = useState<TaskType>('task')
  const [formPriority, setFormPriority] = useState<TaskPriority>('next')
  const [filterStatus, setFilterStatus] = useState<TaskStatus | 'active'>('active')

  async function handleCreate() {
    if (!member || !family || !formTitle.trim()) return
    await createTask.mutateAsync({
      family_id: family.id,
      created_by: member.id,
      title: formTitle.trim(),
      task_type: formType,
      priority: formPriority,
    })
    setFormTitle('')
    setShowCreate(false)
  }

  async function toggleComplete(task: Task) {
    const newStatus: TaskStatus = task.status === 'completed' ? 'pending' : 'completed'
    await updateTask.mutateAsync({ id: task.id, status: newStatus })
  }

  const filtered = filterStatus === 'active'
    ? tasks.filter(t => t.status !== 'completed' && t.status !== 'cancelled')
    : tasks.filter(t => t.status === filterStatus)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CheckSquare size={24} style={{ color: 'var(--color-btn-primary-bg)' }} />
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
          >
            Tasks
          </h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
        >
          <Plus size={16} />
          Add Task
        </button>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {(['active', 'pending', 'in_progress', 'completed'] as const).map(status => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className="px-3 py-1.5 rounded-lg text-sm whitespace-nowrap capitalize"
            style={{
              backgroundColor: filterStatus === status ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-card)',
              color: filterStatus === status ? 'var(--color-btn-primary-text)' : 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Quick Create */}
      {showCreate && (
        <div
          className="p-4 rounded-lg space-y-3"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <input
            type="text"
            placeholder="What needs to be done?"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          />
          <div className="flex gap-2">
            <select
              value={formType}
              onChange={(e) => setFormType(e.target.value as TaskType)}
              className="px-3 py-1.5 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            >
              {TASK_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <select
              value={formPriority}
              onChange={(e) => setFormPriority(e.target.value as TaskPriority)}
              className="px-3 py-1.5 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            >
              {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 rounded-lg text-sm" style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
            <button
              onClick={handleCreate}
              disabled={!formTitle.trim()}
              className="px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
            >
              Create
            </button>
          </div>
        </div>
      )}

      {/* Task List */}
      {isLoading ? (
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="p-8 rounded-lg text-center" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <CheckSquare size={32} className="mx-auto mb-3" style={{ color: 'var(--color-text-secondary)' }} />
          <p style={{ color: 'var(--color-text-secondary)' }}>
            {filterStatus === 'active' ? 'No active tasks. Add one to get started.' : `No ${filterStatus} tasks.`}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => {
            const StatusIcon = STATUS_ICONS[task.status]
            return (
              <div
                key={task.id}
                className="flex items-center gap-3 p-3 rounded-lg cursor-pointer"
                style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
                onClick={() => toggleComplete(task)}
              >
                <StatusIcon
                  size={20}
                  style={{
                    color: task.status === 'completed'
                      ? 'var(--color-status-success)'
                      : 'var(--color-text-secondary)',
                  }}
                />
                <div className="flex-1 min-w-0">
                  <p
                    className={`text-sm ${task.status === 'completed' ? 'line-through' : ''}`}
                    style={{ color: task.status === 'completed' ? 'var(--color-text-secondary)' : 'var(--color-text-primary)' }}
                  >
                    {task.title}
                  </p>
                  <div className="flex gap-2 mt-0.5">
                    {task.priority && (
                      <span className="text-xs capitalize" style={{ color: 'var(--color-text-secondary)' }}>
                        {task.priority}
                      </span>
                    )}
                    {task.task_type !== 'task' && (
                      <span className="text-xs px-1.5 py-0.5 rounded capitalize"
                        style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}>
                        {task.task_type}
                      </span>
                    )}
                    {task.due_date && (
                      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        Due {new Date(task.due_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
