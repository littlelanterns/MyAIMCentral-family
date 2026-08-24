/**
 * PRD-40 Slice 3 — Screen 7: Additional-Child Acknowledgment.
 *
 * Shown when mom adds an under-13 child and ALREADY holds an active parent
 * verification. No new charge — a lightweight per-child acknowledgment
 * against the same disclosure text (expandable inline for re-reading).
 * When a batch contains multiple under-13 children, the parent surface
 * shows this modal once per child, sequentially, then commits all rows
 * together at the end (PRD Screen 7 interactions).
 */

import { useState, useEffect } from 'react'
import { ShieldCheck, ChevronDown, ChevronUp } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { ConsentSectionBody } from '@/lib/coppa/consentText'
import type { CoppaConsentTemplate } from '@/lib/coppa/useCoppaGate'

export interface CoppaAcknowledgeModalProps {
  isOpen: boolean
  childName: string
  /** e.g. "March 15, 2026" — from parent_verifications.verified_at */
  verifiedAtLabel: string
  template: CoppaConsentTemplate
  /** Which child this is in the batch, for multi-child sequences. */
  progress?: { current: number; total: number }
  onCancel: () => void
  onAcknowledge: () => void
}

const REVIEW_SECTIONS = [
  { key: 'what_we_collect', label: 'Review what’s collected' },
  { key: 'how_lila_uses', label: 'Review how LiLa uses it' },
  { key: 'who_sees_it', label: 'Review who sees it' },
  { key: 'your_rights', label: 'Review your rights' },
] as const

export function CoppaAcknowledgeModal({
  isOpen,
  childName,
  verifiedAtLabel,
  template,
  progress,
  onCancel,
  onAcknowledge,
}: CoppaAcknowledgeModalProps) {
  const { isViewingAs } = useViewAs()
  const [acked, setAcked] = useState(false)
  const [expanded, setExpanded] = useState<string | null>(null)

  useEffect(() => {
    if (isOpen) {
      setAcked(false)
      setExpanded(null)
    }
  }, [isOpen, childName])

  if (isViewingAs) return null // R-10 — never inside View-As scope
  if (!isOpen) return null

  const sectionText: Record<string, string> = {
    what_we_collect: template.section_what_we_collect,
    how_lila_uses: template.section_how_lila_uses,
    who_sees_it: template.section_who_sees_it,
    your_rights: template.section_your_rights,
  }

  return (
    <ModalV2
      id="coppa-acknowledge"
      isOpen={isOpen}
      onClose={onCancel}
      type="transient"
      size="md"
      title={`Adding ${childName} (under 13)`}
      icon={ShieldCheck}
      batchProgress={progress && progress.total > 1 ? progress : undefined}
    >
      <div className="density-comfortable space-y-4" data-testid="coppa-acknowledge-modal">
        {progress && progress.total > 1 && (
          // The transient ModalHeader ignores batchProgress — render the
          // multi-child sequence cue in the body instead.
          <p className="font-medium" style={{ color: 'var(--color-text-secondary)', fontSize: 'var(--font-size-sm)' }}>
            Child {progress.current} of {progress.total}
          </p>
        )}
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>
          You verified your parental consent on {verifiedAtLabel}. Adding {childName} means the
          same data practices apply to them.
        </p>

        <div className="space-y-2">
          {REVIEW_SECTIONS.map((s) => {
            const isOpen = expanded === s.key
            return (
              <div key={s.key}>
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : s.key)}
                  className="flex items-center gap-1.5 text-sm font-medium"
                  style={{ color: 'var(--color-btn-primary-bg)', minHeight: '28px' }}
                >
                  {s.label} {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {isOpen && (
                  <div
                    className="mt-2 rounded-xl p-4 overflow-y-auto"
                    style={{
                      maxHeight: '38vh',
                      backgroundColor: 'color-mix(in srgb, var(--color-bg-card) 90%, transparent)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    <ConsentSectionBody text={sectionText[s.key]} childNames={[childName]} />
                  </div>
                )}
              </div>
            )
          })}
        </div>

        <label
          className="flex items-start gap-3 p-3 rounded-lg cursor-pointer"
          style={{ backgroundColor: 'var(--color-bg-secondary)' }}
        >
          <input
            type="checkbox"
            data-testid="coppa-acknowledge-check"
            checked={acked}
            onChange={(e) => setAcked(e.target.checked)}
            className="mt-0.5 w-4 h-4"
            style={{ accentColor: 'var(--color-btn-primary-bg)' }}
          />
          <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
            I acknowledge and consent to the collection and use of {childName}&rsquo;s
            information as described.
          </span>
        </label>

        <div className="flex items-center justify-between gap-3 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-secondary)',
              minHeight: 'var(--touch-target-min, 44px)',
            }}
          >
            &larr; Cancel
          </button>
          <button
            type="button"
            data-testid="coppa-acknowledge-continue"
            onClick={onAcknowledge}
            disabled={!acked}
            className="px-5 py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
            style={{
              background: 'var(--surface-primary)',
              color: 'var(--color-text-on-primary)',
              minHeight: 'var(--touch-target-min, 44px)',
            }}
          >
            Acknowledge &amp; Continue &rarr;
          </button>
        </div>
      </div>
    </ModalV2>
  )
}
