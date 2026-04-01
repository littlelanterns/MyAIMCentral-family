/**
 * HubBestIntentionsSection — PRD-14D Family Hub
 *
 * Lists active family intentions. Tap an intention → member picker grid
 * appears → select who's tallying → tally logs.
 *
 * In 'tab' context (inline dashboard): tap logs for current user directly.
 * In 'standalone' context (Hub page): member picker grid appears.
 */

import { useState, useMemo, useCallback } from 'react'
import { Target, Check } from 'lucide-react'
import { useFamilyBestIntentions, useTodayFamilyIterations, useLogFamilyIntentionTally } from '@/hooks/useFamilyBestIntentions'
import { useFamilyMembers } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import type { FamilyBestIntention } from '@/hooks/useFamilyBestIntentions'
import type { FamilyMember } from '@/hooks/useFamilyMember'

interface HubBestIntentionsSectionProps {
  context: 'standalone' | 'tab'
  currentMemberId?: string
  isMom?: boolean
}

// ─── Member Picker Grid (balanced columns, no stragglers) ────────────────────

function MemberPickerGrid({
  members,
  onSelect,
  onCancel,
}: {
  members: FamilyMember[]
  onSelect: (memberId: string) => void
  onCancel: () => void
}) {
  // Balanced columns: 3 if >=3 members, 2 if 2, 1 if 1
  // If last row would have 1 straggler with 3 cols, use 2 cols instead
  let cols = members.length >= 3 ? 3 : members.length
  if (cols === 3 && members.length % 3 === 1 && members.length > 3) {
    cols = 2 // Avoid single straggler on bottom row
  }

  return (
    <div
      className="rounded-lg p-3 mt-2"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 6%, var(--color-bg-card))',
        border: '1px solid color-mix(in srgb, var(--color-btn-primary-bg) 20%, transparent)',
      }}
    >
      <p className="text-xs font-medium mb-2" style={{ color: 'var(--color-text-heading)' }}>
        Who practiced this?
      </p>
      <div
        className="grid gap-2"
        style={{ gridTemplateColumns: `repeat(${cols}, 1fr)` }}
      >
        {members.map((m) => {
          const color = m.calendar_color || m.assigned_color || m.member_color || 'var(--color-btn-primary-bg)'
          return (
            <button
              key={m.id}
              onClick={() => onSelect(m.id)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 transition-transform active:scale-95"
              style={{
                backgroundColor: 'var(--color-bg-card)',
                border: `2px solid ${color}`,
                minHeight: 44,
              }}
            >
              <span
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                style={{ backgroundColor: color, color: 'var(--color-text-on-primary, #fff)' }}
              >
                {m.display_name.charAt(0)}
              </span>
              <span className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                {m.display_name.split(' ')[0]}
              </span>
            </button>
          )
        })}
      </div>
      <button
        onClick={onCancel}
        className="w-full text-xs mt-2 py-1 rounded"
        style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
      >
        Cancel
      </button>
    </div>
  )
}

// ─── Intention Card ──────────────────────────────────────────────────────────

function IntentionCard({
  intention,
  totalToday,
  isExpanded,
  onTap,
  members,
  onSelectMember,
  onCancel,
}: {
  intention: FamilyBestIntention
  totalToday: number
  isExpanded: boolean
  onTap: () => void
  members: FamilyMember[]
  onSelectMember: (memberId: string) => void
  onCancel: () => void
}) {
  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: isExpanded
          ? '2px solid var(--color-btn-primary-bg)'
          : '1px solid var(--color-border)',
      }}
    >
      {/* Tappable intention header */}
      <button
        onClick={onTap}
        className="w-full flex items-center gap-3 p-3 text-left transition-colors"
        style={{ minHeight: 48 }}
        data-testid={`intention-tap-${intention.id}`}
      >
        <span
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, transparent)',
          }}
        >
          <Target size={18} style={{ color: 'var(--color-btn-primary-bg)' }} />
        </span>
        <div className="flex-1 min-w-0">
          <span
            className="text-sm font-medium block"
            style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-heading)' }}
          >
            {intention.title}
          </span>
          {intention.description && (
            <span className="text-xs block truncate" style={{ color: 'var(--color-text-secondary)' }}>
              {intention.description}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Check size={14} style={{ color: 'var(--color-btn-primary-bg)' }} />
          <span
            className="text-sm font-bold"
            style={{ color: 'var(--color-btn-primary-bg)' }}
          >
            {totalToday}
          </span>
        </div>
      </button>

      {/* Expanded: member picker grid */}
      {isExpanded && (
        <div className="px-3 pb-3">
          <MemberPickerGrid
            members={members}
            onSelect={onSelectMember}
            onCancel={onCancel}
          />
        </div>
      )}
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────────────

export function HubBestIntentionsSection({
  context: _context,
  currentMemberId: _currentMemberId,
  isMom = false,
}: HubBestIntentionsSectionProps) {
  const { data: family } = useFamily()
  const { data: familyMembers } = useFamilyMembers(family?.id)
  const { data: intentions } = useFamilyBestIntentions(family?.id)
  const { data: iterations } = useTodayFamilyIterations(family?.id)
  const logTally = useLogFamilyIntentionTally()

  const [expandedIntentionId, setExpandedIntentionId] = useState<string | null>(null)

  const activeMembers = useMemo(
    () => (familyMembers ?? []).filter((m) => m.is_active && !m.out_of_nest),
    [familyMembers]
  )

  const handleTap = useCallback((intentionId: string) => {
    // Always show member picker — Hub is a shared family surface
    // Even in tab context, mom may be logging for a child
    setExpandedIntentionId(prev => prev === intentionId ? null : intentionId)
  }, [])

  const handleSelectMember = useCallback((intentionId: string, memberId: string) => {
    if (!family?.id) return
    logTally.mutate({
      familyId: family.id,
      intentionId,
      memberId,
    })
    setExpandedIntentionId(null)
  }, [family?.id, logTally])

  // Totals per intention
  const intentionTotals = useMemo(() => {
    const map = new Map<string, number>()
    for (const iter of iterations ?? []) {
      map.set(iter.intention_id, (map.get(iter.intention_id) ?? 0) + 1)
    }
    return map
  }, [iterations])

  // Participating members for an intention
  const getParticipatingMembers = useCallback((intention: FamilyBestIntention) => {
    if (intention.participating_member_ids.length === 0) return activeMembers
    const ids = new Set(intention.participating_member_ids)
    return activeMembers.filter((m) => ids.has(m.id))
  }, [activeMembers])

  // Empty state
  if (!intentions || intentions.length === 0) {
    if (isMom) {
      return (
        <div
          className="rounded-lg p-4 text-center"
          data-testid="hub-intentions-empty"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            border: '1px solid var(--color-border)',
          }}
        >
          <Target size={24} className="mx-auto mb-2" style={{ color: 'var(--color-text-secondary)' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            No family intentions yet.
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Create one in Hub Settings!
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <div className="space-y-3" data-testid="hub-intentions-section">
      {/* Section header */}
      <div className="flex items-center gap-2">
        <Target size={16} style={{ color: 'var(--color-text-secondary)' }} />
        <span
          className="text-sm font-semibold"
          style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
        >
          Family Intentions
        </span>
      </div>

      {/* Intention cards */}
      <div className="space-y-2">
        {intentions.map((intention) => (
          <IntentionCard
            key={intention.id}
            intention={intention}
            totalToday={intentionTotals.get(intention.id) ?? 0}
            isExpanded={expandedIntentionId === intention.id}
            onTap={() => handleTap(intention.id)}
            members={getParticipatingMembers(intention)}
            onSelectMember={(memberId) => handleSelectMember(intention.id, memberId)}
            onCancel={() => setExpandedIntentionId(null)}
          />
        ))}
      </div>
    </div>
  )
}
