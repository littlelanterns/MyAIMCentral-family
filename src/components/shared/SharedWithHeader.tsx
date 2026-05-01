import { Users } from 'lucide-react'
import { getMemberColor } from '@/lib/memberColors'

interface SharedMember {
  id: string
  display_name: string
  assigned_color?: string | null
  member_color?: string | null
}

interface SharedWithHeaderProps {
  members: SharedMember[]
  currentMemberId?: string
}

export function SharedWithHeader({ members, currentMemberId }: SharedWithHeaderProps) {
  if (members.length === 0) return null

  const others = currentMemberId
    ? members.filter(m => m.id !== currentMemberId)
    : members

  if (others.length === 0) return null

  return (
    <div
      className="flex items-center gap-1.5 px-1 py-1 mb-1"
    >
      <Users size={12} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
      <span className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
        Shared with{' '}
        {others.map((m, i) => (
          <span key={m.id}>
            <span
              className="font-medium"
              style={{ color: getMemberColor(m) }}
            >
              {m.display_name}
            </span>
            {i < others.length - 1 && ', '}
          </span>
        ))}
      </span>
    </div>
  )
}
