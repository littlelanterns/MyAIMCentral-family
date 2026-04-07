import { useState, useEffect } from 'react'
import { CheckSquare, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'

import type { DashboardWidget } from '@/types/widgets'

interface Props {
  widget: DashboardWidget
  isCompact?: boolean
}

export function InfoUpcomingTasks({ widget, isCompact }: Props) {
  const navigate = useNavigate()
  const [tasks, setTasks] = useState<Array<{ id: string; title: string; due_date: string | null; status: string }>>([])

  useEffect(() => {
    if (!widget.family_id) return
    const memberId = widget.assigned_member_id || widget.family_member_id
    supabase
      .from('tasks')
      .select('id, title, due_date, status')
      .eq('family_id', widget.family_id)
      .eq('assignee_id', memberId)
      .neq('status', 'completed')
      .is('archived_at', null)
      .order('due_date', { ascending: true, nullsFirst: false })
      .limit(isCompact ? 3 : 5)
      .then(({ data }) => { if (data) setTasks(data) })
  }, [widget.family_id, widget.family_member_id, widget.assigned_member_id, isCompact])

  return (
    <button
      onClick={() => navigate('/tasks')}
      className="w-full h-full flex flex-col text-left p-0"
      style={{ background: 'transparent' }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <CheckSquare size={14} style={{ color: 'var(--color-accent)' }} />
        <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
          Upcoming
        </span>
        <ChevronRight size={12} className="ml-auto" style={{ color: 'var(--color-text-tertiary)' }} />
      </div>
      {tasks.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>No upcoming tasks</span>
        </div>
      ) : (
        <div className="space-y-1.5 flex-1">
          {tasks.map(t => (
            <div key={t.id} className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: 'var(--color-accent)' }} />
              <span className="text-xs truncate flex-1" style={{ color: 'var(--color-text-primary)' }}>{t.title}</span>
              {t.due_date && (
                <span className="text-[10px] shrink-0" style={{ color: 'var(--color-text-tertiary)' }}>
                  {new Date(t.due_date + 'T00:00:00').toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </button>
  )
}
