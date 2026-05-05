import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import { RefreshCw } from 'lucide-react'

interface RoutinePickerProps {
  memberId: string
  familyId: string
  value: { routineTaskId: string | null; sectionId: string | null }
  onChange: (val: { routineTaskId: string; sectionId: string }) => void
}

interface RoutineOption {
  id: string
  title: string
  templateId: string
}

export function RoutinePicker({ memberId, familyId, value, onChange }: RoutinePickerProps) {
  const { data: routines = [], isLoading } = useQuery<RoutineOption[]>({
    queryKey: ['member-routines-for-picker', familyId, memberId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('id, title, template_id')
        .eq('family_id', familyId)
        .eq('assignee_id', memberId)
        .eq('task_type', 'routine')
        .is('archived_at', null)
        .neq('status', 'cancelled')

      if (error) throw error
      return (data ?? [])
        .filter((t): t is { id: string; title: string; template_id: string } => !!t.template_id)
        .map(t => ({ id: t.id, title: t.title ?? 'Untitled Routine', templateId: t.template_id }))
    },
    enabled: !!memberId && !!familyId,
    staleTime: 30_000,
  })

  const handleSelect = async (routine: RoutineOption) => {
    const { data: sections } = await supabase
      .from('task_template_sections')
      .select('id')
      .eq('template_id', routine.templateId)
      .order('sort_order', { ascending: true })
      .limit(1)

    const sectionId = sections?.[0]?.id as string | undefined
    if (sectionId) {
      onChange({ routineTaskId: routine.id, sectionId })
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 py-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        <RefreshCw size={12} className="animate-spin" />
        Loading routines...
      </div>
    )
  }

  if (routines.length === 0) {
    return (
      <p className="text-xs py-1" style={{ color: 'var(--color-text-muted)' }}>
        No routines set up for this member yet.
      </p>
    )
  }

  return (
    <select
      value={value.routineTaskId ?? ''}
      onChange={e => {
        const r = routines.find(rt => rt.id === e.target.value)
        if (r) handleSelect(r)
      }}
      className="w-full px-3 py-2 rounded-lg text-sm"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        color: 'var(--color-text-primary)',
      }}
    >
      <option value="">Pick a routine...</option>
      {routines.map(r => (
        <option key={r.id} value={r.id}>{r.title}</option>
      ))}
    </select>
  )
}
