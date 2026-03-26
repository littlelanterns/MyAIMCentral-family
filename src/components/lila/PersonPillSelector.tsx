/**
 * PersonPillSelector — PRD-21
 *
 * Horizontal row of member avatar pills for tool conversation modals.
 * Supports single-select (Love Languages, Cyrano) and multi-select (Higgins).
 * Shows member calendar_color fill with first name.
 */

import { useMemo } from 'react'
import type { ReactNode } from 'react'

interface FamilyMember {
  id: string
  display_name: string
  role: string
  member_color?: string | null
  assigned_color?: string | null
  calendar_color?: string | null
  relationship?: string | null
  dashboard_mode?: string | null
}

interface PersonPillSelectorProps {
  members: FamilyMember[]
  /** Current user's member ID — excluded from the list */
  currentMemberId: string
  selectedIds: string[]
  onToggle: (memberId: string) => void
  /** Single-select mode deselects others. Multi allows multiple. */
  multiSelect?: boolean
  /** For Cyrano: auto-selects partner and disables other selections */
  partnerOnly?: boolean
  /** Optional label above the pills */
  label?: ReactNode
}

export function PersonPillSelector({
  members,
  currentMemberId,
  selectedIds,
  onToggle,
  multiSelect: _multiSelect = false,
  partnerOnly = false,
  label,
}: PersonPillSelectorProps) {
  const selectableMembers = useMemo(() => {
    let list = members.filter(m => m.id !== currentMemberId)

    if (partnerOnly) {
      // Cyrano: only show spouse/partner (additional_adult role)
      list = list.filter(m => m.role === 'additional_adult')
    }

    return list
  }, [members, currentMemberId, partnerOnly])

  if (selectableMembers.length === 0 && partnerOnly) {
    return (
      <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          Cyrano works with your spouse or partner. Once your partner is set up in the family, you'll be able to use this tool.
        </p>
      </div>
    )
  }

  if (selectableMembers.length === 0) return null

  return (
    <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
      {label && (
        <p className="text-xs mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
          {label}
        </p>
      )}
      <div className="flex flex-wrap gap-1.5">
        {selectableMembers.map(fm => {
          const isSelected = selectedIds.includes(fm.id)
          const pillColor = fm.calendar_color || fm.assigned_color || fm.member_color || 'var(--color-btn-primary-bg)'

          return (
            <button
              key={fm.id}
              onClick={() => onToggle(fm.id)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={{
                backgroundColor: isSelected ? pillColor : 'transparent',
                color: isSelected ? '#fff' : 'var(--color-text-primary)',
                border: `1.5px solid ${isSelected ? pillColor : 'var(--color-border)'}`,
              }}
            >
              {fm.display_name.split(' ')[0]}
            </button>
          )
        })}
      </div>
    </div>
  )
}
