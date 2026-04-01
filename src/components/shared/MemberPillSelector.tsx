// PRD-14C: Shared MemberPillSelector component
// Oval pill buttons in member's calendar_color/assigned_color.
// Selected = solid fill + contrasting text. Deselected = outline + color text.
// Reusable by Family Overview member selection and Calendar Pick Members filter.

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
}

function getColor(m: MemberPillItem): string {
  return m.calendar_color || m.assigned_color || m.member_color || 'var(--color-btn-primary-bg)'
}

export default function MemberPillSelector({
  members,
  selectedIds,
  onToggle,
  className = '',
}: MemberPillSelectorProps) {
  return (
    <div
      className={`flex gap-2 overflow-x-auto pb-1 ${className}`}
      style={{ scrollbarWidth: 'thin' }}
    >
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
            className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all"
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
  )
}
