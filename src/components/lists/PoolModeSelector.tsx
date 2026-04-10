/**
 * PoolModeSelector — Shared vs Individual pool toggle for Randomizer lists
 *
 * Convention 118: Any/Each pattern adapted for lists.
 * 'individual' = each person tracked separately
 * 'shared' = one completion counts for all
 *
 * Includes eligible member selector using colored pill buttons (Convention 119).
 */

import { Users } from 'lucide-react'
import type { PoolMode } from '@/types/lists'
import type { FamilyMember } from '@/hooks/useFamilyMember'
import { getMemberColor } from '@/lib/memberColors'

interface PoolModeSelectorProps {
  poolMode: PoolMode
  eligibleMembers: string[] | null
  allMembers: FamilyMember[]
  onPoolModeChange: (mode: PoolMode) => void
  onEligibleMembersChange: (members: string[] | null) => void
}

export function PoolModeSelector({
  poolMode,
  eligibleMembers,
  allMembers,
  onPoolModeChange,
  onEligibleMembersChange,
}: PoolModeSelectorProps) {
  const effectiveEligible = eligibleMembers ?? allMembers.map(m => m.id)
  const allSelected = effectiveEligible.length === allMembers.length

  function toggleMember(id: string) {
    if (effectiveEligible.includes(id)) {
      const next = effectiveEligible.filter(m => m !== id)
      onEligibleMembersChange(next.length === 0 ? null : next)
    } else {
      const next = [...effectiveEligible, id]
      onEligibleMembersChange(next.length === allMembers.length ? null : next)
    }
  }

  function toggleAll() {
    if (allSelected) {
      onEligibleMembersChange([])
    } else {
      onEligibleMembersChange(null) // null = all
    }
  }

  return (
    <div
      className="rounded-lg p-3 space-y-3"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-center gap-2">
        <Users size={14} style={{ color: 'var(--color-text-heading)' }} />
        <span className="text-xs font-medium" style={{ color: 'var(--color-text-heading)' }}>
          Pool Mode
        </span>
      </div>

      {/* Mode toggle */}
      <div className="space-y-1.5">
        {([
          { value: 'individual' as PoolMode, label: 'Individual', desc: 'each person tracked separately' },
          { value: 'shared' as PoolMode, label: 'Shared', desc: 'one completion counts for everyone' },
        ]).map(opt => (
          <label
            key={opt.value}
            className="flex items-start gap-2 px-2 py-1.5 rounded-lg cursor-pointer transition-colors"
            style={{
              backgroundColor: poolMode === opt.value
                ? 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, var(--color-bg-card))'
                : 'transparent',
              border: `1px solid ${poolMode === opt.value ? 'var(--color-btn-primary-bg)' : 'transparent'}`,
            }}
          >
            <input
              type="radio"
              name="pool-mode"
              value={opt.value}
              checked={poolMode === opt.value}
              onChange={() => onPoolModeChange(opt.value)}
              className="mt-0.5"
              style={{ accentColor: 'var(--color-btn-primary-bg)' }}
            />
            <div>
              <span className="text-xs font-medium" style={{ color: 'var(--color-text-heading)' }}>
                {opt.label}
              </span>
              <span className="text-[11px] ml-1" style={{ color: 'var(--color-text-secondary)' }}>
                — {opt.desc}
              </span>
            </div>
          </label>
        ))}
      </div>

      {/* Eligible members */}
      <div className="space-y-1.5">
        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          Eligible members:
        </span>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={toggleAll}
            className="px-3 py-1 rounded-full text-xs font-medium transition-all"
            style={{
              backgroundColor: allSelected ? 'var(--color-btn-primary-bg)' : 'transparent',
              color: allSelected ? 'var(--color-btn-primary-text, #fff)' : 'var(--color-text-secondary)',
              border: `1.5px solid ${allSelected ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
              cursor: 'pointer',
            }}
          >
            Everyone
          </button>
          {allMembers.map(member => {
            const selected = effectiveEligible.includes(member.id)
            const color = getMemberColor(member)

            return (
              <button
                key={member.id}
                type="button"
                onClick={() => toggleMember(member.id)}
                className="px-3 py-1 rounded-full text-xs font-medium transition-all"
                style={{
                  backgroundColor: selected ? color : 'transparent',
                  color: selected ? '#fff' : color,
                  border: `1.5px solid ${color}`,
                  cursor: 'pointer',
                }}
              >
                {member.display_name.split(' ')[0]}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
