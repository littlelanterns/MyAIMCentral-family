/**
 * PRD-25 + PRD-11 Phase 12C: Celebrate Section for Guided Dashboard
 * Full-width gold gradient button that launches DailyCelebration overlay.
 */

import { useState } from 'react'
import { Trophy } from 'lucide-react'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { DailyCelebration } from '@/components/victories/DailyCelebration'

interface CelebrateSectionProps {
  /** Override member for View As mode */
  overrideMemberId?: string
  overrideMemberName?: string
  overrideFamilyId?: string
}

export function CelebrateSection({ overrideMemberId, overrideMemberName, overrideFamilyId }: CelebrateSectionProps) {
  const [showCelebration, setShowCelebration] = useState(false)
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { viewingAsMember } = useViewAs()

  const displayMember = viewingAsMember ?? member
  const memberId = overrideMemberId ?? displayMember?.id
  const memberName = overrideMemberName ?? displayMember?.display_name ?? 'Friend'
  const familyId = overrideFamilyId ?? family?.id

  if (!memberId || !familyId) return null

  return (
    <>
      <button
        onClick={() => setShowCelebration(true)}
        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-base font-semibold transition-transform active:scale-[0.98]"
        style={{
          background: 'linear-gradient(135deg, var(--color-sparkle-gold, #D4AF37), var(--color-sparkle-gold-light, #E8C547))',
          color: 'white',
          minHeight: 48,
          border: 'none',
          boxShadow: '0 2px 8px color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 30%, transparent)',
        }}
      >
        <Trophy size={20} />
        Celebrate!
      </button>

      {showCelebration && (
        <DailyCelebration
          shell="guided"
          memberId={memberId}
          familyId={familyId}
          memberName={memberName}
          onClose={() => setShowCelebration(false)}
        />
      )}
    </>
  )
}
