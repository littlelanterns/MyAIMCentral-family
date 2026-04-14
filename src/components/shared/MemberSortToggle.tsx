/**
 * Compact segmented control for switching between member sort modes.
 * Reads/writes the global preference so all member lists stay in sync.
 */

import { useState, useCallback } from 'react'
import { ArrowDownAZ, Users } from 'lucide-react'
import {
  type MemberSortMode,
  getMemberSortPreference,
  setMemberSortPreference,
} from '@/utils/sortFamilyMembers'
import { useQueryClient } from '@tanstack/react-query'

interface MemberSortToggleProps {
  className?: string
}

export default function MemberSortToggle({ className = '' }: MemberSortToggleProps) {
  const [mode, setMode] = useState<MemberSortMode>(getMemberSortPreference)
  const queryClient = useQueryClient()

  const toggle = useCallback(
    (next: MemberSortMode) => {
      if (next === mode) return
      setMode(next)
      setMemberSortPreference(next)
      // Invalidate family-members queries so all lists re-sort
      queryClient.invalidateQueries({ queryKey: ['family-members'] })
    },
    [mode, queryClient],
  )

  const options: { value: MemberSortMode; label: string; icon: typeof Users }[] = [
    { value: 'age', label: 'Age', icon: Users },
    { value: 'alphabetical', label: 'A-Z', icon: ArrowDownAZ },
  ]

  return (
    <div
      className={`inline-flex rounded-full overflow-hidden ${className}`}
      style={{
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-bg-secondary)',
      }}
      role="radiogroup"
      aria-label="Sort members by"
    >
      {options.map(({ value, label, icon: Icon }) => {
        const active = mode === value
        return (
          <button
            key={value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => toggle(value)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.25rem 0.5rem',
              fontSize: 'var(--font-size-xs, 0.75rem)',
              fontWeight: active ? 600 : 400,
              color: active ? 'var(--color-text-on-primary, #fff)' : 'var(--color-text-secondary)',
              backgroundColor: active ? 'var(--color-btn-primary-bg)' : 'transparent',
              border: 'none',
              cursor: 'pointer',
              transition: 'background-color 150ms, color 150ms',
              lineHeight: 1,
            }}
          >
            <Icon size={12} />
            {label}
          </button>
        )
      })}
    </div>
  )
}
