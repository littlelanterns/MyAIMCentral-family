import { Trophy, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { useRecentVictories } from '@/hooks/useVictories'
import type { DashboardWidget } from '@/types/widgets'

interface Props {
  widget: DashboardWidget
  isCompact?: boolean
}

function timeAgo(dateStr: string): string {
  const d = new Date(dateStr)
  const now = new Date()
  const diffMin = Math.floor((now.getTime() - d.getTime()) / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function InfoRecentVictories({ widget, isCompact: _isCompact }: Props) {
  const navigate = useNavigate()
  const { data: member } = useFamilyMember()
  const { viewingAsMember } = useViewAs()
  const memberId = viewingAsMember?.id ?? widget.family_member_id ?? member?.id
  const { data: victories = [] } = useRecentVictories(memberId, 3)

  return (
    <button
      onClick={() => navigate('/victories')}
      className="w-full h-full flex flex-col text-left p-0"
      style={{ background: 'transparent' }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Trophy size={14} style={{ color: 'var(--color-sparkle-gold, #D4AF37)' }} />
        <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
          Victories
        </span>
        <ChevronRight size={12} className="ml-auto" style={{ color: 'var(--color-text-tertiary)' }} />
      </div>
      {victories.length === 0 ? (
        <div className="flex-1 flex items-center justify-center text-center px-2">
          <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
            Your victories will appear here as you celebrate wins
          </span>
        </div>
      ) : (
        <div className="flex-1 space-y-1.5 overflow-hidden">
          {victories.map(v => (
            <div
              key={v.id}
              className="flex items-start gap-1.5"
              style={{ borderLeft: '2px solid var(--color-sparkle-gold, #D4AF37)', paddingLeft: 6 }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-xs truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {v.description}
                </p>
                <span className="text-[10px]" style={{ color: 'var(--color-text-tertiary)' }}>
                  {timeAgo(v.created_at)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </button>
  )
}
