import { useState, useEffect } from 'react'
import { BarChart3 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import type { DashboardWidget } from '@/types/widgets'

interface Props {
  widget: DashboardWidget
  isCompact?: boolean
}

interface Stats {
  tasksCompleted: number
  totalTasks: number
  activeWidgets: number
}

export function InfoQuickStats({ widget }: Props) {
  const [stats, setStats] = useState<Stats>({ tasksCompleted: 0, totalTasks: 0, activeWidgets: 0 })

  useEffect(() => {
    if (!widget.family_id) return
    const memberId = widget.assigned_member_id || widget.family_member_id

    Promise.all([
      supabase
        .from('tasks')
        .select('id, status', { count: 'exact', head: false })
        .eq('family_id', widget.family_id)
        .eq('assignee_id', memberId)
        .is('archived_at', null),
      supabase
        .from('dashboard_widgets')
        .select('id', { count: 'exact', head: true })
        .eq('family_id', widget.family_id)
        .eq('family_member_id', memberId)
        .eq('is_on_dashboard', true)
        .is('archived_at', null),
    ]).then(([tasksRes, widgetsRes]) => {
      const allTasks = tasksRes.data ?? []
      const completed = allTasks.filter(t => t.status === 'completed').length
      setStats({
        tasksCompleted: completed,
        totalTasks: allTasks.length,
        activeWidgets: widgetsRes.count ?? 0,
      })
    })
  }, [widget.family_id, widget.family_member_id, widget.assigned_member_id])

  const pct = stats.totalTasks > 0 ? Math.round((stats.tasksCompleted / stats.totalTasks) * 100) : 0

  return (
    <div className="w-full h-full flex flex-col items-center justify-center gap-2">
      <BarChart3 size={16} style={{ color: 'var(--color-accent)' }} />
      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-center">
        <div>
          <div className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{pct}%</div>
          <div className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>Tasks done</div>
        </div>
        <div>
          <div className="text-lg font-bold" style={{ color: 'var(--color-text-primary)' }}>{stats.activeWidgets}</div>
          <div className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>Trackers</div>
        </div>
      </div>
    </div>
  )
}
