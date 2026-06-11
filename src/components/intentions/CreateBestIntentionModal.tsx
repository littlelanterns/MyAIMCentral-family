/**
 * CreateBestIntentionModal — lightweight Best Intention creation for one
 * member (FO-COMMAND-CENTER, founder ask 2026-06-10: per-section [+ create]
 * on the Family Overview columns).
 *
 * Uses the existing useCreateBestIntention hook (auto-color, counter tracker
 * default). The full editing surface stays on the Guiding Stars page — this
 * is the quick on-ramp.
 */

import { useState } from 'react'
import { Star } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { Button } from '@/components/shared'
import { useCreateBestIntention } from '@/hooks/useBestIntentions'

export function CreateBestIntentionModal({
  familyId,
  memberId,
  memberName,
  onClose,
}: {
  familyId: string
  memberId: string
  memberName: string
  onClose: () => void
}) {
  const [statement, setStatement] = useState('')
  const [description, setDescription] = useState('')
  const createIntention = useCreateBestIntention()

  const handleSave = async () => {
    const trimmed = statement.trim()
    if (!trimmed) return
    await createIntention.mutateAsync({
      family_id: familyId,
      member_id: memberId,
      statement: trimmed,
      description: description.trim() || undefined,
      source: 'manual',
    })
    onClose()
  }

  return (
    <ModalV2
      id={`create-intention-${memberId}`}
      isOpen
      onClose={onClose}
      type="transient"
      size="sm"
      title={`New Best Intention for ${memberName}`}
      icon={Star}
    >
      <div className="space-y-3 py-1">
        <div>
          <label
            className="block text-xs font-medium mb-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Intention
          </label>
          <input
            type="text"
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            placeholder="e.g. Pause before reacting"
            autoFocus
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: 'var(--color-bg-input, var(--color-bg-card))',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          />
        </div>
        <div>
          <label
            className="block text-xs font-medium mb-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Why it matters (optional)
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
            className="w-full px-3 py-2 rounded-lg text-sm resize-vertical"
            style={{
              backgroundColor: 'var(--color-bg-input, var(--color-bg-card))',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
          />
        </div>
        <div className="flex justify-end gap-2 pt-1">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSave}
            disabled={!statement.trim() || createIntention.isPending}
          >
            {createIntention.isPending ? 'Saving…' : 'Create'}
          </Button>
        </div>
      </div>
    </ModalV2>
  )
}
