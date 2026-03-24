/**
 * ByCategoryView — PRD-09A View 7
 *
 * Tasks grouped by life_area_tag.
 * Section headers per category with task count.
 */

import { useState } from 'react'
import { ChevronDown, ChevronRight, Tag } from 'lucide-react'
import { TaskCard } from '../TaskCard'
import { EmptyState } from '@/components/shared'
import type { Task } from '@/hooks/useTasks'

interface ByCategoryViewProps {
  tasks: Task[]
  onToggle: (task: Task, origin?: { x: number; y: number }) => void
  onEdit?: (task: Task) => void
  onFocusTimer?: (task: Task) => void
  onBreakItDown?: (task: Task) => void
  onAssign?: (task: Task) => void
  onDelete?: (task: Task) => void
  isCompleting?: (taskId: string) => boolean
}

const LIFE_AREA_LABELS: Record<string, string> = {
  spiritual: 'Spiritual',
  spouse_marriage: 'Spouse & Marriage',
  family: 'Family',
  career_work: 'Career & Work',
  home: 'Home',
  health_physical: 'Health & Physical',
  social: 'Social',
  financial: 'Financial',
  personal: 'Personal',
  homeschool: 'Homeschool',
  extracurriculars: 'Extracurriculars',
  meal_planning: 'Meal Planning',
  auto_transport: 'Auto & Transport',
  digital_tech: 'Digital & Tech',
  hobbies: 'Hobbies',
  custom: 'Other',
}

const LIFE_AREA_COLORS: Record<string, string> = {
  spiritual: 'var(--color-accent)',
  spouse_marriage: 'var(--color-category-spouse, #E8708C)',
  family: 'var(--color-category-family, #70B8E8)',
  career_work: 'var(--color-category-career, #70C8A0)',
  home: 'var(--color-category-home, #C8A070)',
  health_physical: 'var(--color-category-health, #70E878)',
  social: 'var(--color-category-social, #D870C8)',
  financial: 'var(--color-category-financial, #C8D870)',
  personal: 'var(--color-category-personal, #7890E8)',
  homeschool: 'var(--color-category-homeschool, #E8C870)',
  extracurriculars: 'var(--color-category-extracurricular, #70E8C8)',
  meal_planning: 'var(--color-category-meal, #E89870)',
  auto_transport: 'var(--color-category-transport, #A0A0B8)',
  digital_tech: 'var(--color-category-digital, #78A8E8)',
  hobbies: 'var(--color-category-hobbies, #E878A8)',
  custom: 'var(--color-text-secondary)',
}

export function ByCategoryView({
  tasks,
  onToggle,
  onEdit,
  onFocusTimer,
  onBreakItDown,
  onAssign,
  onDelete,
  isCompleting,
}: ByCategoryViewProps) {
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  // Group tasks by life_area_tag
  const grouped = new Map<string, Task[]>()

  for (const task of tasks) {
    const key = task.life_area_tag ?? 'uncategorized'
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(task)
  }

  if (tasks.length === 0) {
    return (
      <EmptyState
        icon={<Tag size={36} />}
        title="No categorized tasks"
        description="Tag your tasks with life areas to see them grouped here."
      />
    )
  }

  // Sort categories: named categories first, uncategorized last
  const sortedCategories = Array.from(grouped.keys()).sort((a, b) => {
    if (a === 'uncategorized') return 1
    if (b === 'uncategorized') return -1
    const la = LIFE_AREA_LABELS[a] ?? a
    const lb = LIFE_AREA_LABELS[b] ?? b
    return la.localeCompare(lb)
  })

  return (
    <div className="space-y-3">
      {sortedCategories.map((cat) => {
        const catTasks = grouped.get(cat)!
        const isCollapsed = collapsedCategories.has(cat)
        const label = cat === 'uncategorized'
          ? 'Uncategorized'
          : LIFE_AREA_LABELS[cat] ?? cat.replace(/_/g, ' ')
        const color = LIFE_AREA_COLORS[cat] ?? 'var(--color-text-secondary)'
        const activeTasks = catTasks.filter((t) => t.status !== 'completed')
        const completedTasks = catTasks.filter((t) => t.status === 'completed')

        return (
          <div
            key={cat}
            className="rounded-xl overflow-hidden"
            style={{
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--vibe-radius-card, 0.5rem)',
            }}
          >
            {/* Category header */}
            <button
              onClick={() => toggleCategory(cat)}
              className="w-full flex items-center gap-3 px-4 py-3 text-left"
              style={{ backgroundColor: 'var(--color-bg-card)' }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="font-semibold text-sm flex-1" style={{ color: 'var(--color-text-heading)' }}>
                {label}
              </span>
              <span className="text-xs mr-2" style={{ color: 'var(--color-text-secondary)' }}>
                {activeTasks.length} active
                {completedTasks.length > 0 && ` · ${completedTasks.length} done`}
              </span>
              {isCollapsed ? (
                <ChevronRight size={16} style={{ color: 'var(--color-text-secondary)' }} />
              ) : (
                <ChevronDown size={16} style={{ color: 'var(--color-text-secondary)' }} />
              )}
            </button>

            {/* Task list */}
            {!isCollapsed && (
              <div
                className="px-3 pb-3 space-y-2"
                style={{ backgroundColor: 'var(--color-bg-secondary)', paddingTop: '0.5rem' }}
              >
                {activeTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isCompleting={isCompleting?.(task.id)}
                    onToggle={onToggle}
                    onEdit={onEdit}
                    onFocusTimer={onFocusTimer}
                    onBreakItDown={onBreakItDown}
                    onAssign={onAssign}
                    onDelete={onDelete}
                    compact
                  />
                ))}
                {completedTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    isCompleting={isCompleting?.(task.id)}
                    onToggle={onToggle}
                    compact
                  />
                ))}
                {catTasks.length === 0 && (
                  <p className="text-xs text-center py-2" style={{ color: 'var(--color-text-secondary)' }}>
                    No tasks
                  </p>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
