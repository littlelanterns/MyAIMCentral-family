/**
 * RecurringItemBrowser — Browse all recurring/streakable items in the family.
 *
 * Queries 6 sources per addendum Hole #2 decision:
 * 1. Recurring standalone tasks
 * 2. Whole routines (task_templates WHERE task_type='routine')
 * 3. Individual routine steps (via task_template_sections → task_template_steps)
 * 4. Checklist widgets (dashboard_widgets WHERE template_type='checklist')
 * 5. Active Best Intentions
 * 6. Active homeschool subjects
 *
 * Groups by category. Used by the Streak Wizard.
 */

import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import {
  Search,
  RotateCcw,
  BookOpen,
  Heart,
  CheckSquare,
  ListChecks,
  GraduationCap,
  ChevronDown,
  ChevronRight,
} from 'lucide-react'

export interface RecurringItem {
  id: string
  sourceType: 'recurring_task' | 'routine' | 'routine_step' | 'checklist_widget' | 'best_intention' | 'homeschool_subject'
  title: string
  assigneeId?: string | null
  assigneeName?: string | null
  frequency?: string | null
  parentName?: string | null // For routine steps: which routine
}

interface RecurringItemBrowserProps {
  familyId: string
  onSelect: (item: RecurringItem) => void
  selectedId?: string | null
}

type GroupKey = 'routines' | 'school' | 'habits' | 'best_intentions' | 'checklists' | 'custom'

const GROUP_META: Record<GroupKey, { label: string; icon: typeof RotateCcw }> = {
  routines: { label: 'Routines', icon: RotateCcw },
  school: { label: 'School', icon: GraduationCap },
  habits: { label: 'Habits & Tasks', icon: CheckSquare },
  best_intentions: { label: 'Best Intentions', icon: Heart },
  checklists: { label: 'Checklists', icon: ListChecks },
  custom: { label: 'Other', icon: BookOpen },
}

function categorizeItem(item: RecurringItem): GroupKey {
  switch (item.sourceType) {
    case 'routine':
    case 'routine_step':
      return 'routines'
    case 'homeschool_subject':
      return 'school'
    case 'best_intention':
      return 'best_intentions'
    case 'checklist_widget':
      return 'checklists'
    case 'recurring_task':
      return 'habits'
    default:
      return 'custom'
  }
}

export function RecurringItemBrowser({
  familyId,
  onSelect,
  selectedId,
}: RecurringItemBrowserProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [expandedGroups, setExpandedGroups] = useState<Set<GroupKey>>(
    new Set(['routines', 'habits', 'best_intentions', 'school']),
  )

  // Query all 6 sources in parallel
  const { data: items = [], isLoading } = useQuery({
    queryKey: ['recurring-items-browser', familyId],
    queryFn: async () => {
      const results: RecurringItem[] = []

      // 1. Recurring standalone tasks
      const { data: recurringTasks } = await supabase
        .from('tasks')
        .select('id, title, assignee_id, recurrence_rule')
        .eq('family_id', familyId)
        .not('recurrence_rule', 'is', null)
        .in('status', ['pending', 'in_progress'])
        .is('archived_at', null)
        .limit(100)

      if (recurringTasks) {
        for (const t of recurringTasks) {
          results.push({
            id: t.id,
            sourceType: 'recurring_task',
            title: t.title,
            assigneeId: t.assignee_id,
            frequency: t.recurrence_rule,
          })
        }
      }

      // 2. Whole routines
      const { data: routines } = await supabase
        .from('task_templates')
        .select('id, title, created_by')
        .eq('family_id', familyId)
        .eq('task_type', 'routine')
        .is('archived_at', null)
        .limit(50)

      if (routines) {
        for (const r of routines) {
          results.push({
            id: r.id,
            sourceType: 'routine',
            title: r.title,
            assigneeId: r.created_by,
          })
        }
      }

      // 3. Individual routine steps (via sections)
      const { data: sections } = await supabase
        .from('task_template_sections')
        .select('id, title, template_id, task_template_steps(id, title)')
        .in(
          'template_id',
          (routines ?? []).map((r) => r.id),
        )
        .limit(200)

      if (sections) {
        for (const section of sections) {
          const steps = (section as Record<string, unknown>).task_template_steps as
            | Array<{ id: string; title: string }>
            | undefined
          if (steps) {
            const routine = routines?.find((r) => r.id === section.template_id)
            for (const step of steps) {
              results.push({
                id: step.id,
                sourceType: 'routine_step',
                title: step.title,
                parentName: routine?.title ?? section.title,
              })
            }
          }
        }
      }

      // 4. Checklist widgets
      const { data: checklists } = await supabase
        .from('dashboard_widgets')
        .select('id, title, family_member_id')
        .eq('family_id', familyId)
        .eq('template_type', 'checklist')
        .eq('is_active', true)
        .is('archived_at', null)
        .limit(50)

      if (checklists) {
        for (const c of checklists) {
          results.push({
            id: c.id,
            sourceType: 'checklist_widget',
            title: c.title ?? 'Checklist',
            assigneeId: c.family_member_id,
          })
        }
      }

      // 5. Active Best Intentions
      const { data: intentions } = await supabase
        .from('best_intentions')
        .select('id, statement, member_id')
        .eq('family_id', familyId)
        .eq('is_active', true)
        .is('archived_at', null)
        .limit(50)

      if (intentions) {
        for (const i of intentions) {
          results.push({
            id: i.id,
            sourceType: 'best_intention',
            title: i.statement,
            assigneeId: i.member_id,
          })
        }
      }

      // 6. Homeschool subjects
      const { data: subjects } = await supabase
        .from('homeschool_subjects')
        .select('id, name')
        .eq('family_id', familyId)
        .eq('is_active', true)
        .limit(50)

      if (subjects) {
        for (const s of subjects) {
          results.push({
            id: s.id,
            sourceType: 'homeschool_subject',
            title: s.name,
          })
        }
      }

      return results
    },
    staleTime: 30_000,
  })

  // Filter by search
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return items
    const q = searchQuery.toLowerCase()
    return items.filter(
      (item) =>
        item.title.toLowerCase().includes(q) ||
        item.parentName?.toLowerCase().includes(q),
    )
  }, [items, searchQuery])

  // Group items
  const grouped = useMemo(() => {
    const groups: Record<GroupKey, RecurringItem[]> = {
      routines: [],
      school: [],
      habits: [],
      best_intentions: [],
      checklists: [],
      custom: [],
    }
    for (const item of filtered) {
      const key = categorizeItem(item)
      groups[key].push(item)
    }
    return groups
  }, [filtered])

  const toggleGroup = (key: GroupKey) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }

  const groupOrder: GroupKey[] = ['routines', 'school', 'habits', 'best_intentions', 'checklists', 'custom']

  return (
    <div className="space-y-3">
      {/* Search */}
      <div className="relative">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2"
          style={{ color: 'var(--color-text-muted)' }}
        />
        <input
          type="text"
          placeholder="Search recurring items..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-8 pr-3 py-2 rounded-lg text-sm outline-none"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
          }}
        />
      </div>

      {isLoading ? (
        <div
          className="text-center py-6 text-sm"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Loading items...
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="text-center py-6 text-sm"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {searchQuery
            ? 'No items match your search.'
            : 'No recurring items found. Create a routine or task first, then come back.'}
        </div>
      ) : (
        <div className="space-y-1 max-h-72 overflow-y-auto">
          {groupOrder.map((groupKey) => {
            const groupItems = grouped[groupKey]
            if (groupItems.length === 0) return null

            const meta = GROUP_META[groupKey]
            const Icon = meta.icon
            const isExpanded = expandedGroups.has(groupKey)

            return (
              <div key={groupKey}>
                <button
                  onClick={() => toggleGroup(groupKey)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 rounded text-sm font-medium transition-colors"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  <Icon size={14} />
                  <span>{meta.label}</span>
                  <span
                    className="text-xs ml-auto"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {groupItems.length}
                  </span>
                </button>

                {isExpanded && (
                  <div className="ml-4 space-y-0.5">
                    {groupItems.map((item) => (
                      <button
                        key={`${item.sourceType}-${item.id}`}
                        onClick={() => onSelect(item)}
                        className="w-full text-left px-3 py-2 rounded-lg text-sm transition-colors"
                        style={{
                          backgroundColor:
                            selectedId === item.id
                              ? 'var(--color-bg-tertiary)'
                              : 'transparent',
                          color: 'var(--color-text-primary)',
                          border:
                            selectedId === item.id
                              ? '1px solid var(--color-btn-primary-bg)'
                              : '1px solid transparent',
                        }}
                      >
                        <div className="font-medium truncate">{item.title}</div>
                        {item.parentName && (
                          <div
                            className="text-xs mt-0.5 truncate"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            in {item.parentName}
                          </div>
                        )}
                        {item.frequency && (
                          <div
                            className="text-xs mt-0.5"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            {item.frequency}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
