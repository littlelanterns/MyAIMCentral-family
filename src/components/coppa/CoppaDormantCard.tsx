/**
 * PRD-40 Slice 3 — R-8 dormant-block card (founder decision OD-4).
 *
 * While no consent template is lawyer-approved, an under-13 add by a
 * NON-founding family cannot be shown a consent flow (consent captured
 * against unapproved text is not valid consent) and must not fall through
 * to collection. This warm card blocks JUST the under-13 members; the rest
 * of the batch commits normally. Cohort-1 families are all-13+ by
 * invitation, so this should never render in practice — it is the safety
 * net. Founding families are exempt (their under-13 records run through
 * the documented backfill posture, ruling R-9, and their flow access is
 * how the real flow is exercised before approval).
 */

import { Sparkles } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { joinNames } from '@/lib/coppa/consentText'

export interface CoppaDormantCardProps {
  isOpen: boolean
  /** Under-13 names being held back. */
  childNames: string[]
  /** How many other (13+) members will still be added when mom continues. */
  otherCount: number
  onCancel: () => void
  /** Commit the rest of the batch without the under-13 members. */
  onContinueWithoutThem: () => void
}

export function CoppaDormantCard({
  isOpen,
  childNames,
  otherCount,
  onCancel,
  onContinueWithoutThem,
}: CoppaDormantCardProps) {
  const { isViewingAs } = useViewAs()
  if (isViewingAs) return null // R-10
  if (!isOpen) return null

  const names = joinNames(childNames)

  return (
    <ModalV2
      id="coppa-dormant-card"
      isOpen={isOpen}
      onClose={onCancel}
      type="transient"
      size="sm"
      title="Almost ready for the littlest ones"
      icon={Sparkles}
    >
      <div className="density-comfortable space-y-4" data-testid="coppa-dormant-card">
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
          Profiles for kids under 13 are almost ready — we&rsquo;re finishing the legal review
          that protects them. You can add everyone 13 and up now and add {names} the moment it
          opens.
        </p>
        <div className="flex flex-col gap-2 pt-1">
          {otherCount > 0 && (
            <button
              type="button"
              data-testid="coppa-dormant-continue"
              onClick={onContinueWithoutThem}
              className="w-full px-5 py-3 rounded-lg text-sm font-medium"
              style={{
                background: 'var(--surface-primary)',
                color: 'var(--color-text-on-primary)',
                minHeight: 'var(--touch-target-min, 44px)',
              }}
            >
              Add the other {otherCount} member{otherCount !== 1 ? 's' : ''} now
            </button>
          )}
          <button
            type="button"
            onClick={onCancel}
            className="w-full px-5 py-3 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)',
              minHeight: 'var(--touch-target-min, 44px)',
            }}
          >
            Go back to my family list
          </button>
        </div>
      </div>
    </ModalV2>
  )
}
