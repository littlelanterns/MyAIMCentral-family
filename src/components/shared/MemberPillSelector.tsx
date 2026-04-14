// PRD-14C: Shared MemberPillSelector component
// Oval pill buttons in member's calendar_color/assigned_color.
// Selected = solid fill + contrasting text. Deselected = outline + color text.
// Reusable by Family Overview member selection and Calendar Pick Members filter.

import { getMemberColor } from '@/lib/memberColors'
import MemberSortToggle from './MemberSortToggle'

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

  return (
    <div className={`flex items-center gap-2 ${className}`}>
    {showSortToggle && members.length > 2 && (
      <MemberSortToggle className="shrink-0" />
    )}
    <div
      className="flex gap-2 overflow-x-auto pb-1 flex-1"
      style={{ scrollbarWidth: 'thin' }}
    >
      {showEveryone && onToggleAll && (
        <button
          onClick={onToggleAll}
          className="shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
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
            className="shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
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
