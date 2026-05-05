import { useTaskSegments } from '@/hooks/useTaskSegments'
import { RefreshCw, Settings } from 'lucide-react'

interface SegmentPickerProps {
  memberId: string
  value: string | null
  onChange: (segmentId: string) => void
}

export function SegmentPicker({ memberId, value, onChange }: SegmentPickerProps) {
  const { data: segments = [], isLoading } = useTaskSegments(memberId)

  if (isLoading) {
    return (
      <div className="flex items-center gap-1.5 py-2 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        <RefreshCw size={12} className="animate-spin" />
        Loading segments...
      </div>
    )
  }

  if (segments.length === 0) {
    return (
      <div className="flex items-center gap-1.5 py-1 text-xs" style={{ color: 'var(--color-text-muted)' }}>
        <Settings size={12} />
        <span>No day segments set up. Create them in Settings {'→'} Gamification.</span>
      </div>
    )
  }

  return (
    <select
      value={value ?? ''}
      onChange={e => onChange(e.target.value)}
      className="w-full px-3 py-2 rounded-lg text-sm"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        color: 'var(--color-text-primary)',
      }}
    >
      <option value="">Pick a segment...</option>
      {segments.map(s => (
        <option key={s.id} value={s.id}>{s.segment_name}</option>
      ))}
    </select>
  )
}
