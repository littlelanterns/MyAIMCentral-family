import { useState, useEffect } from 'react'
import { Calendar, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import type { DashboardWidget } from '@/types/widgets'

interface Props {
  widget: DashboardWidget
  isCompact?: boolean
}

export function InfoCalendarToday({ widget, isCompact }: Props) {
  const navigate = useNavigate()
  const [events, setEvents] = useState<Array<{ id: string; title: string; start_time: string | null; is_all_day: boolean }>>([])

  useEffect(() => {
    if (!widget.family_id) return
    const today = new Date().toISOString().split('T')[0]
    supabase
      .from('calendar_events')
      .select('id, title, start_time, is_all_day')
      .eq('family_id', widget.family_id)
      .eq('event_date', today)
      .eq('status', 'approved')
      .order('start_time', { ascending: true, nullsFirst: false })
      .limit(isCompact ? 3 : 5)
      .then(({ data }) => { if (data) setEvents(data) })
  }, [widget.family_id, isCompact])

  function formatTime(time: string | null, allDay: boolean): string {
    if (allDay || !time) return 'All day'
    const [h, m] = time.split(':')
    const hour = parseInt(h, 10)
    const ampm = hour >= 12 ? 'PM' : 'AM'
    const h12 = hour % 12 || 12
    return `${h12}:${m} ${ampm}`
  }

  return (
    <button
      onClick={() => navigate('/calendar')}
      className="w-full h-full flex flex-col text-left p-0"
      style={{ background: 'transparent' }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Calendar size={14} style={{ color: 'var(--color-accent)' }} />
        <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
          Today
        </span>
        <ChevronRight size={12} className="ml-auto" style={{ color: 'var(--color-text-tertiary)' }} />
      </div>
      {events.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>Nothing scheduled</span>
        </div>
      ) : (
        <div className="space-y-1.5 flex-1">
          {events.map(ev => (
            <div key={ev.id} className="flex items-center gap-2">
              <span className="text-[10px] w-12 shrink-0 font-medium" style={{ color: 'var(--color-text-tertiary)' }}>
                {formatTime(ev.start_time, ev.is_all_day)}
              </span>
              <span className="text-xs truncate flex-1" style={{ color: 'var(--color-text-primary)' }}>{ev.title}</span>
            </div>
          ))}
        </div>
      )}
    </button>
  )
}
