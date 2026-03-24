/**
 * AssignmentSelector (PRD-09A Section 3)
 *
 * Family member multi-select with individual/shared copy options.
 * Includes "Whole Family" checkbox and rotation config for routines.
 * Zero hardcoded hex colors — all CSS custom properties.
 */

import { Users } from 'lucide-react'
import { Avatar, Toggle } from '@/components/shared'
import type { FamilyMember } from '@/hooks/useFamilyMember'

export interface MemberAssignment {
  memberId: string
  copyMode: 'individual' | 'shared'
}

interface AssignmentSelectorProps {
  familyMembers: FamilyMember[]
  assignments: MemberAssignment[]
  onAssignmentsChange: (assignments: MemberAssignment[]) => void
  wholeFamily: boolean
  onWholeFamilyChange: (v: boolean) => void
  /** Show rotation option for routines */
  showRotation?: boolean
  rotationEnabled?: boolean
  onRotationChange?: (v: boolean) => void
  rotationFrequency?: string
  onRotationFrequencyChange?: (v: string) => void
}

export function AssignmentSelector({
  familyMembers,
  assignments,
  onAssignmentsChange,
  wholeFamily,
  onWholeFamilyChange,
  showRotation = false,
  rotationEnabled = false,
  onRotationChange,
  rotationFrequency = 'weekly',
  onRotationFrequencyChange,
}: AssignmentSelectorProps) {
  const assignedIds = new Set(assignments.map((a) => a.memberId))

  const toggleMember = (memberId: string) => {
    if (assignedIds.has(memberId)) {
      onAssignmentsChange(assignments.filter((a) => a.memberId !== memberId))
    } else {
      onAssignmentsChange([...assignments, { memberId, copyMode: 'individual' }])
    }
  }

  const setCopyMode = (memberId: string, copyMode: 'individual' | 'shared') => {
    onAssignmentsChange(
      assignments.map((a) => (a.memberId === memberId ? { ...a, copyMode } : a))
    )
  }

  const activeMembers = familyMembers.filter((m) => m.is_active && !m.out_of_nest)

  return (
    <div className="space-y-3">
      {/* Whole Family shortcut */}
      <label
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.625rem',
          padding: '0.625rem 0.75rem',
          borderRadius: 'var(--vibe-radius-input, 8px)',
          border: `1px solid ${wholeFamily ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
          backgroundColor: wholeFamily
            ? 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, var(--color-bg-card))'
            : 'var(--color-bg-secondary)',
          cursor: 'pointer',
        }}
      >
        <input
          type="checkbox"
          checked={wholeFamily}
          onChange={(e) => onWholeFamilyChange(e.target.checked)}
          style={{ accentColor: 'var(--color-btn-primary-bg)', width: 16, height: 16 }}
        />
        <Users size={16} style={{ color: 'var(--color-btn-primary-bg)' }} />
        <span
          style={{
            fontSize: 'var(--font-size-sm, 0.875rem)',
            fontWeight: 600,
            color: 'var(--color-text-heading)',
          }}
        >
          Whole Family
        </span>
      </label>

      {/* Individual member list */}
      {!wholeFamily && (
        <div className="space-y-2">
          {activeMembers.map((member) => {
            const isSelected = assignedIds.has(member.id)
            const assignment = assignments.find((a) => a.memberId === member.id)
            return (
              <div
                key={member.id}
                style={{
                  borderRadius: 'var(--vibe-radius-input, 8px)',
                  border: `1px solid ${isSelected ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
                  overflow: 'hidden',
                }}
              >
                {/* Member row */}
                <label
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.625rem',
                    padding: '0.625rem 0.75rem',
                    cursor: 'pointer',
                    backgroundColor: isSelected
                      ? 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, var(--color-bg-card))'
                      : 'var(--color-bg-card)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleMember(member.id)}
                    style={{ accentColor: 'var(--color-btn-primary-bg)', width: 16, height: 16 }}
                  />
                  <Avatar
                    name={member.display_name}
                    color={member.member_color ?? undefined}
                    size="sm"
                  />
                  <div className="flex-1">
                    <div style={{ fontSize: 'var(--font-size-sm, 0.875rem)', fontWeight: 500, color: 'var(--color-text-heading)' }}>
                      {member.display_name}
                    </div>
                    <div style={{ fontSize: 'var(--font-size-xs, 0.75rem)', color: 'var(--color-text-secondary)' }}>
                      {member.role === 'primary_parent' ? 'Mom' : member.role === 'additional_adult' ? 'Adult' : 'Child'}
                    </div>
                  </div>
                </label>

                {/* Copy mode picker for selected members */}
                {isSelected && assignment && (
                  <div
                    style={{
                      display: 'flex',
                      gap: '0.5rem',
                      padding: '0.5rem 0.75rem',
                      borderTop: '1px solid var(--color-border)',
                      backgroundColor: 'var(--color-bg-secondary)',
                    }}
                  >
                    {(['individual', 'shared'] as const).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => setCopyMode(member.id, mode)}
                        style={{
                          padding: '0.25rem 0.625rem',
                          borderRadius: '9999px',
                          fontSize: 'var(--font-size-xs, 0.75rem)',
                          fontWeight: assignment.copyMode === mode ? 600 : 400,
                          border: `1px solid ${assignment.copyMode === mode ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
                          backgroundColor: assignment.copyMode === mode
                            ? 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, var(--color-bg-card))'
                            : 'var(--color-bg-card)',
                          color: assignment.copyMode === mode ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        {mode === 'individual' ? 'Individual copy' : 'Shared'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Rotation config for routines */}
      {showRotation && (assignments.length > 1 || wholeFamily) && (
        <div
          style={{
            padding: '0.75rem',
            borderRadius: 'var(--vibe-radius-input, 8px)',
            backgroundColor: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
          }}
        >
          <Toggle
            checked={rotationEnabled}
            onChange={(v) => onRotationChange?.(v)}
            label="Rotate assignment on a schedule"
          />
          {rotationEnabled && (
            <div className="mt-3">
              <select
                value={rotationFrequency}
                onChange={(e) => onRotationFrequencyChange?.(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  border: '1px solid var(--color-border)',
                  borderRadius: 'var(--vibe-radius-input, 8px)',
                  backgroundColor: 'var(--color-bg-input)',
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--font-size-sm, 0.875rem)',
                  minHeight: '44px',
                  cursor: 'pointer',
                }}
              >
                <option value="weekly">Rotate weekly</option>
                <option value="biweekly">Rotate every 2 weeks</option>
                <option value="monthly">Rotate monthly</option>
                <option value="custom">Custom rotation</option>
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
