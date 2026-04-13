/**
 * RandomizerResultCard (PRD-09B)
 *
 * Shown after a draw completes. Presents the drawn item with:
 *   - Item name (large)
 *   - Category badge
 *   - Notes (if any)
 *   - [Assign to...] — opens member picker, creates task on confirm
 *   - [Re-draw]      — goes back to the draw state
 *
 * Zero hardcoded hex colors. Lucide icons only. Mobile-first.
 */

import { useState } from 'react'
import { ArrowRight, RotateCcw, Check, User } from 'lucide-react'
import { Button } from '@/components/shared/Button'
import { getMemberColor } from '@/lib/memberColors'
import type { FamilyMember } from '@/hooks/useFamilyMember'

// ─── List item shape (randomizer fields) ─────────────────────────

export interface RandomizerItem {
  id: string
  item_name: string
  notes: string | null
  category: string | null
  is_repeatable: boolean
  reward_amount?: number | null
}

// ─── Props ────────────────────────────────────────────────────────

interface RandomizerResultCardProps {
  item: RandomizerItem
  eligibleMembers: FamilyMember[]
  onAssign: (item: RandomizerItem, memberId: string) => Promise<void>
  onRedraw: () => void
  assigning: boolean
}

// ─── Component ───────────────────────────────────────────────────

export function RandomizerResultCard({
  item,
  eligibleMembers,
  onAssign,
  onRedraw,
  assigning,
}: RandomizerResultCardProps) {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [assigned, setAssigned] = useState(false)

  async function handleAssignConfirm() {
    if (!selectedMemberId) return
    await onAssign(item, selectedMemberId)
    setAssigned(true)
  }

  if (assigned) {
    const member = eligibleMembers.find(m => m.id === selectedMemberId)
    return (
      <div
        className="flex flex-col items-center gap-3 p-5 rounded-2xl"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, var(--color-bg-card))',
          border: '1px solid var(--color-btn-primary-bg)',
        }}
      >
        <Check size={32} aria-hidden style={{ color: 'var(--color-btn-primary-bg)' }} />
        <p className="text-sm font-semibold text-center" style={{ color: 'var(--color-text-heading)' }}>
          "{item.item_name}" assigned to {member?.display_name ?? 'member'}
        </p>
        <Button variant="secondary" size="sm" onClick={onRedraw}>
          <RotateCcw size={14} aria-hidden />
          Draw again
        </Button>
      </div>
    )
  }

  return (
    <div
      className="flex flex-col gap-4 p-5 rounded-2xl"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        boxShadow: 'var(--shadow-md)',
      }}
    >
      {/* Category badge */}
      {item.category && (
        <span
          className="self-start px-2.5 py-0.5 rounded-full text-xs font-medium capitalize"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-accent, var(--color-btn-primary-bg)) 15%, var(--color-bg-card))',
            color: 'var(--color-accent, var(--color-btn-primary-bg))',
          }}
        >
          {item.category}
        </span>
      )}

      {/* Item name */}
      <p
        className="text-xl font-bold"
        style={{ color: 'var(--color-text-heading)' }}
      >
        {item.item_name}
      </p>

      {/* Notes */}
      {item.notes && (
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {item.notes}
        </p>
      )}

      {/* Reward amount */}
      {item.reward_amount != null && item.reward_amount > 0 && (
        <p className="text-sm font-semibold" style={{ color: 'var(--color-btn-primary-bg)' }}>
          ${item.reward_amount} reward
        </p>
      )}

      {/* One-time badge */}
      {!item.is_repeatable && (
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          One-time item — will be removed from the draw pool after assignment.
        </p>
      )}

      {/* Member picker (inline) */}
      {pickerOpen ? (
        <div className="flex flex-col gap-2">
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
            Assign to:
          </p>
          <div className="flex flex-col gap-1.5">
            {eligibleMembers.map(member => (
              <button
                key={member.id}
                type="button"
                onClick={() => setSelectedMemberId(member.id)}
                className="flex items-center gap-2.5 p-2.5 rounded-lg transition-all text-left"
                style={{
                  border: `1px solid ${selectedMemberId === member.id ? getMemberColor(member) : 'var(--color-border)'}`,
                  borderLeft: selectedMemberId === member.id ? `3px solid ${getMemberColor(member)}` : undefined,
                  backgroundColor:
                    selectedMemberId === member.id
                      ? `color-mix(in srgb, ${getMemberColor(member)} 10%, var(--color-bg-card))`
                      : 'var(--color-bg-card)',
                  cursor: 'pointer',
                }}
                aria-pressed={selectedMemberId === member.id}
              >
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold shrink-0"
                  style={{
                    backgroundColor: getMemberColor(member),
                    color: '#fff',
                  }}
                >
                  {member.display_name.charAt(0).toUpperCase()}
                </div>
                <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                  {member.display_name}
                </span>
                {selectedMemberId === member.id && (
                  <Check size={14} aria-hidden style={{ color: 'var(--color-btn-primary-bg)', marginLeft: 'auto' }} />
                )}
              </button>
            ))}
          </div>

          <div className="flex gap-2 mt-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setPickerOpen(false)
                setSelectedMemberId(null)
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={!selectedMemberId}
              loading={assigning}
              onClick={handleAssignConfirm}
              className="flex-1"
            >
              <Check size={14} aria-hidden />
              Confirm
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={onRedraw}
          >
            <RotateCcw size={14} aria-hidden />
            Re-draw
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setPickerOpen(true)}
            className="flex-1"
          >
            <User size={14} aria-hidden />
            Assign to
            <ArrowRight size={14} aria-hidden />
          </Button>
        </div>
      )}
    </div>
  )
}
