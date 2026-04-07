/**
 * MasterySubmissionModal — Build J (PRD-09A/09B Linked Steps)
 *
 * Modal shown when a child taps [Submit as Mastered] on a sequential task
 * or randomizer item with advancement_mode='mastery'. Collects optional
 * evidence (photo URL or text note) when require_mastery_evidence=true.
 * Mastery submission itself always works, but evidence is a nudge to help
 * mom verify when she reviews.
 *
 * The actual submission is handled by useSubmitMastery — this modal just
 * collects the input and calls back.
 *
 * Theme-tokened. No hardcoded colors. Lucide icons only.
 */

import { useState } from 'react'
import { GraduationCap, FileText } from 'lucide-react'
import { ModalV2, Button } from '@/components/shared'

interface MasterySubmissionModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (params: { evidenceUrl: string | null; evidenceNote: string | null }) => void
  itemTitle: string
  /** When true, submission is blocked without evidence */
  requireEvidence: boolean
  /** Practice history count, shown for context */
  practiceCount: number
  /** Whether submission is pending (disables buttons) */
  pending?: boolean
}

export function MasterySubmissionModal({
  isOpen,
  onClose,
  onSubmit,
  itemTitle,
  requireEvidence,
  practiceCount,
  pending = false,
}: MasterySubmissionModalProps) {
  const [evidenceNote, setEvidenceNote] = useState('')
  const [evidenceUrl, setEvidenceUrl] = useState('')

  const canSubmit = !requireEvidence || evidenceNote.trim() || evidenceUrl.trim()

  function handleSubmit() {
    onSubmit({
      evidenceUrl: evidenceUrl.trim() || null,
      evidenceNote: evidenceNote.trim() || null,
    })
    setEvidenceNote('')
    setEvidenceUrl('')
  }

  function handleClose() {
    setEvidenceNote('')
    setEvidenceUrl('')
    onClose()
  }

  return (
    <ModalV2
      id="mastery-submission"
      isOpen={isOpen}
      onClose={handleClose}
      type="transient"
      title="Submit for mastery"
      size="md"
    >
      <div className="flex flex-col gap-4 p-4">
        {/* Item context */}
        <div
          className="flex items-start gap-2 px-3 py-2.5 rounded-lg"
          style={{
            background: 'var(--color-bg-secondary)',
            border: '1px solid var(--color-border)',
          }}
        >
          <GraduationCap
            size={16}
            style={{ color: 'var(--color-btn-primary-bg)', flexShrink: 0, marginTop: 2 }}
          />
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold"
              style={{ color: 'var(--color-text-heading)' }}
            >
              {itemTitle}
            </p>
            <p
              className="text-xs mt-0.5"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Practiced {practiceCount} {practiceCount === 1 ? 'time' : 'times'}
            </p>
          </div>
        </div>

        <p
          className="text-xs"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {requireEvidence
            ? 'Add a note or link so mom can see what you practiced before she approves.'
            : 'You can add a note or link if you want — it helps mom see what you worked on. (Optional)'}
        </p>

        {/* Evidence note */}
        <div>
          <label
            className="text-xs font-medium block mb-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <FileText size={12} className="inline mr-1" />
            Note {requireEvidence ? '(required)' : '(optional)'}
          </label>
          <textarea
            value={evidenceNote}
            onChange={e => setEvidenceNote(e.target.value)}
            rows={3}
            placeholder="What did you work on? How does it feel?"
            className="w-full px-3 py-2 rounded-lg text-sm resize-none"
            style={{
              background: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
          />
        </div>

        {/* Evidence URL (optional — for video/photo links) */}
        <div>
          <label
            className="text-xs font-medium block mb-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Link to a video, photo, or resource (optional)
          </label>
          <input
            type="url"
            value={evidenceUrl}
            onChange={e => setEvidenceUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{
              background: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={handleSubmit}
            disabled={pending || !canSubmit}
            className="flex-1"
          >
            Submit for mastery
          </Button>
          <Button variant="secondary" size="md" onClick={handleClose} disabled={pending}>
            Cancel
          </Button>
        </div>
      </div>
    </ModalV2>
  )
}
