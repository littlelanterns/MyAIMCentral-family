import { Trophy, ChevronRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { DashboardWidget } from '@/types/widgets'

interface Props {
  widget: DashboardWidget
  isCompact?: boolean
}

export function InfoRecentVictories({ widget: _widget, isCompact: _isCompact }: Props) {
  const navigate = useNavigate()

  return (
    <button
      onClick={() => navigate('/victories')}
      className="w-full h-full flex flex-col text-left p-0"
      style={{ background: 'transparent' }}
    >
      <div className="flex items-center gap-1.5 mb-2">
        <Trophy size={14} style={{ color: 'var(--color-accent)' }} />
        <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
          Victories
        </span>
        <ChevronRight size={12} className="ml-auto" style={{ color: 'var(--color-text-tertiary)' }} />
      </div>
      <div className="flex-1 flex items-center justify-center text-center px-2">
        <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
          Your victories will appear here as you celebrate wins
        </span>
      </div>
    </button>
  )
}
