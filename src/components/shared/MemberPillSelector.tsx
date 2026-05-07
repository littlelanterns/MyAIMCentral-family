// PRD-14C: Shared MemberPillSelector component
// Oval pill buttons in member's calendar_color/assigned_color.
// Selected = solid fill + contrasting text. Deselected = outline + color text.
// Reusable by Family Overview member selection and Calendar Pick Members filter.
//
// Layout: pills wrap into a CSS grid using the no-singleton column algorithm
// from src/lib/utils/gridColumns.ts (5 desktop / 3 tablet / 2 mobile cap).

import { getMemberColor } from '@/lib/memberColors'
import MemberSortToggle from './MemberSortToggle'
import { useResponsiveColumns } from '@/hooks/useResponsiveColumns'

export interface MemberPillItem {
  id: string
  display_name: string
  calendar_color?: string | null
  assigned_color?: string | null
  member_color?: string | null
}

interface MemberPillSelectorProps {
  members: MemberPillItem[]
  selectedIds: string[]
  onToggle: (memberId: string) => void
  className?: string
  showEveryone?: boolean
  onToggleAll?: () => void
  /** Show the Age/A-Z sort toggle. Default true. */
  showSortToggle?: boolean
}

function getColor(m: MemberPillItem): string {
  return m.calendar_color || getMemberColor(m)
}

export default function MemberPillSelector({
  members,
  selectedIds,
  onToggle,
  className = '',
  showEveryone,
  onToggleAll,
  showSortToggle = true,
}: MemberPillSelectorProps) {
  const allSelected = members.length > 0 && selectedIds.length === members.length
  const everyonePill = !!(showEveryone && onToggleAll)
  const totalPills = members.length + (everyonePill ? 1 : 0)
  const { columns } = useResponsiveColumns(totalPills)

  return (
    <div className={`flex items-start gap-2 ${className}`}>
      {showSortToggle && members.length > 2 && (
        <MemberSortToggle className="shrink-0 mt-0.5" />
      )}
      <div
        className="grid gap-2 flex-1 min-w-0"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {everyonePill && (
          <button
            onClick={onToggleAll}
            className="px-3 py-1.5 rounded-full text-sm font-medium transition-all truncate"
            style={
              allSelected
                ? {
                    backgroundColor: 'var(--color-btn-primary-bg)',
                    color: 'var(--color-btn-primary-text, #fff)',
                    border: '2px solid var(--color-btn-primary-bg)',
                  }
                : {
                    backgroundColor: 'transparent',
                    color: 'var(--color-text-primary)',
                    border: '2px solid var(--color-border)',
                  }
            }
          >
            Everyone
          </button>
        )}
        {members.map((m) => {
          const color = getColor(m)
          const isSelected = selectedIds.includes(m.id)

          return (
            <button
              key={m.id}
              onClick={() => onToggle(m.id)}
              data-testid={`member-pill-${m.id}`}
              data-member-name={m.display_name.split(' ')[0]}
              data-selected={isSelected}
              className="px-3 py-1.5 rounded-full text-sm font-medium transition-all truncate"
              style={
                isSelected
                  ? {
                      backgroundColor: color,
                      color: 'var(--color-text-on-primary, #fff)',
                      border: `2px solid ${color}`,
                    }
                  : {
                      backgroundColor: 'transparent',
                      color: color,
                      border: `2px solid ${color}`,
                    }
              }
            >
              {m.display_name.split(' ')[0]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
