/**
 * RecordVictoryModal — quick manual victory recording for one member
 * (FO-COMMAND-CENTER, founder ask 2026-06-10: "as they do things throughout
 * the day, I'll want to record those things as victories for them").
 *
 * Uses the existing useCreateVictory hook (source='manual'). Celebration
 * only — never punishment (CLAUDE.md core principle). The full recording
 * surface with tags, mom's picks, and AIR stays on the Victories page.
 */

import { useState } from 'react'
import { Trophy } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { ModalV2 } from '@/components/shared/ModalV2'
import { Button } from '@/components/shared'
import { useCreateVictory } from '@/hooks/useVictories'
import type { VictoryImportance, MemberType } from '@/types/victories'

const IMPORTANCE_OPTIONS: Array<{ value: VictoryImportance; label: string }> = [
  { value: 'small_win', label: 'Small win' },
  { value: 'standard', label: 'Victory' },
  { value: 'big_win', label: 'Big win' },
  { value: 'major_achievement', label: 'Major achievement' },
]

/** Map a member's dashboard_mode onto the victories member_type enum. */
function toMemberType(dashboardMode: string | null | undefined): MemberType {
  if (dashboardMode === 'play') return 'play'
  if (dashboardMode === 'guided') return 'guided'
  if (dashboardMode === 'independent') return 'teen'
  return 'adult'
}

export function RecordVictoryModal({
  familyId,
  memberId,
  memberName,
  memberDashboardMode,
  onClose,
}: {
  familyId: string
  memberId: string
  memberName: string
  memberDashboardMode?: string | null
  onClose: () => void
}) {
  const [description, setDescription] = useState('')
  const [importance, setImportance] = useState<VictoryImportance>('standard')
  const createVictory = useCreateVictory()
  const queryClient = useQueryClient()

  const handleSave = async () => {
    const trimmed = description.trim()
    if (!trimmed) return
    await createVictory.mutateAsync({
      family_id: familyId,
      family_member_id: memberId,
      description: trimmed,
      member_type: toMemberType(memberDashboardMode),
      importance,
      source: 'manual',
    })
    // Family Overview victories section reads its own key
    queryClient.invalidateQueries({ queryKey: ['fo-victories'] })
    onClose()
  }

  return (
    <ModalV2
      id={`record-victory-${memberId}`}
      isOpen
      onClose={onClose}
      type="transient"
      size="sm"
      title={`Victory for ${memberName}`}
      icon={Trophy}
    >
      <div className="space-y-3 py-1">
        <div>
          <label
            className="block text-xs font-medium mb-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            What did they do?
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={`e.g. ${memberName} helped a sibling without being asked`}
            rows={2}
            autoFocus
            className="w-full px-3 py-2 rounded-lg text-sm resize-vertical"
            style={{
              backgroundColor: 'var(--color-bg-input, var(--color-bg-card))',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
          />
        </div>
        <div>
          <label
            className="block text-xs font-medium mb-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            How big?
          </label>
          <div className="flex flex-wrap gap-1.5">
            {IMPORTANCE_OPTIONS.map(({ value, label }) => {
              const active = importance === value
              return (
                <button
                  key={value}
                  onClick={() => setImportance(value)}
                  className="text-xs px-2.5 py-1 rounded-full whitespace-nowrap"
                  style={{
                    backgroundColor: active ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-card)',
                    color: active ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
                    border: '1px solid var(--color-border)',
                  }}
                  aria-pressed={active}
                >
                  {label}
                </button>
              )
            })}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={!description.trim() || createVictory.isPending}
          >
            {createVictory.isPending ? 'Recording…' : 'Record Victory'}
          </Button>
        </div>
      </div>
    </ModalV2>
  )
}
