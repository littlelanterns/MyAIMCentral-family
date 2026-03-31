/**
 * HubMemberAccessSection — PRD-14D Family Hub
 *
 * Grid of family member avatars/names for member access on the Hub.
 * Lock icon on PIN-protected members.
 * Balanced column layout (no single straggler on bottom row).
 * Only visible in 'standalone' context.
 */

import { useMemo } from 'react'
import { Users, Lock } from 'lucide-react'
import { useFamilyMembers } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import type { FamilyMember } from '@/hooks/useFamilyMember'

/**
 * Calculate balanced column count to avoid single stragglers.
 * Prefers 3 columns, falls back to 2 if last row would have 1 item.
 */
function getBalancedCols(count: number): number {
  if (count <= 2) return count || 1
  if (count <= 4) return 2
  if (count % 3 === 1 && count > 3) return 2
  return 3
}

export function HubMemberAccessSection() {
  const { data: family } = useFamily()
  const { data: familyMembers } = useFamilyMembers(family?.id)

  const activeMembers = useMemo(
    () =>
      (familyMembers ?? []).filter(
        (m) => m.is_active && !m.out_of_nest && m.dashboard_enabled !== false
      ),
    [familyMembers]
  )

  if (activeMembers.length === 0) return null

  const cols = getBalancedCols(activeMembers.length)

  const handleMemberTap = (member: FamilyMember) => {
    window.alert(`Member access for ${member.display_name} coming soon`)
  }

  return (
    <div
      className="rounded-lg p-4"
      data-testid="hub-member-access-section"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-center gap-2 mb-1">
        <Users size={16} style={{ color: 'var(--color-text-secondary)' }} />
        <span
          className="text-sm font-semibold"
          style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
        >
          Family Members
        </span>
      </div>

      <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>
        Tap your name to open your space
      </p>

      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {activeMembers.map((member) => {
          const color =
            member.calendar_color || member.assigned_color || member.member_color || 'var(--color-btn-primary-bg)'
          const hasPinOrAuth =
            member.auth_method === 'pin' || member.auth_method === 'visual_password'

          return (
            <button
              key={member.id}
              onClick={() => handleMemberTap(member)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 transition-transform active:scale-95"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: `2px solid ${color}`,
                minHeight: 48,
              }}
              data-testid={`hub-member-${member.id}`}
            >
              <div className="relative shrink-0">
                <span
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                  style={{
                    backgroundColor: color,
                    color: 'var(--color-text-on-primary, #fff)',
                    display: 'flex',
                  }}
                >
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt={member.display_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    member.display_name.charAt(0).toUpperCase()
                  )}
                </span>
                {hasPinOrAuth && (
                  <span
                    className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                    style={{
                      backgroundColor: 'var(--color-bg-card)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <Lock size={8} style={{ color: 'var(--color-text-secondary)' }} />
                  </span>
                )}
              </div>
              <span
                className="text-sm font-medium truncate"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {member.display_name.split(' ')[0]}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
