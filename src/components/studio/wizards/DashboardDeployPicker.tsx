/**
 * DashboardDeployPicker — "Which dashboards should this appear on?"
 *
 * Member pill buttons defaulting to the assigned member(s).
 * Mom can add her own dashboard too. Used in wizard review/deploy steps.
 */

import { useMemo } from 'react'
import { useFamilyMembers, type FamilyMember } from '@/hooks/useFamilyMember'
import { getMemberColor } from '@/lib/memberColors'
import { LayoutDashboard } from 'lucide-react'

interface DashboardDeployPickerProps {
  familyId: string
  selectedMemberIds: string[]
  onChange: (memberIds: string[]) => void
  /** Pre-select these members by default (e.g. assigned members) */
  defaultMemberIds?: string[]
  label?: string
}

export function DashboardDeployPicker({
  familyId,
  selectedMemberIds,
  onChange,
  label = 'Deploy to dashboards',
}: DashboardDeployPickerProps) {
  const { data: members = [] } = useFamilyMembers(familyId)

  const activeMembers = useMemo(
    () => members.filter((m: FamilyMember) => m.is_active && m.dashboard_mode !== 'play'),
    [members],
  )

  const toggleMember = (id: string) => {
    if (selectedMemberIds.includes(id)) {
      onChange(selectedMemberIds.filter((mid) => mid !== id))
    } else {
      onChange([...selectedMemberIds, id])
    }
  }

  const toggleAll = () => {
    if (selectedMemberIds.length === activeMembers.length) {
      onChange([])
    } else {
      onChange(activeMembers.map((m: FamilyMember) => m.id))
    }
  }

  if (activeMembers.length === 0) return null

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <LayoutDashboard size={14} style={{ color: 'var(--color-text-muted)' }} />
        <span
          className="text-xs font-medium"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {label}
        </span>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {/* Everyone pill */}
        <button
          onClick={toggleAll}
          className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
          style={
            selectedMemberIds.length === activeMembers.length
              ? {
                  backgroundColor: 'var(--color-btn-primary-bg)',
                  color: 'var(--color-btn-primary-text)',
                }
              : {
                  backgroundColor: 'transparent',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)',
                }
          }
        >
          Everyone
        </button>

        {activeMembers.map((member: FamilyMember) => {
          const isSelected = selectedMemberIds.includes(member.id)
          const color = getMemberColor(member)

          return (
            <button
              key={member.id}
              onClick={() => toggleMember(member.id)}
              className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
              style={
                isSelected
                  ? {
                      backgroundColor: color,
                      color: '#fff',
                      border: `2px solid ${color}`,
                    }
                  : {
                      backgroundColor: 'transparent',
                      color: 'var(--color-text-secondary)',
                      border: `2px solid ${color}`,
                    }
              }
            >
              {member.display_name.split(' ')[0]}
            </button>
          )
        })}
      </div>

      {selectedMemberIds.length === 0 && (
        <p
          className="text-xs"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Pick at least one dashboard to deploy to.
        </p>
      )}
    </div>
  )
}
