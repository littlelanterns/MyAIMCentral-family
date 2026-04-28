import { AlertTriangle } from 'lucide-react'
import { ModalV2, Button } from '@/components/shared'

interface SoftClaimCrossClaimProps {
  isOpen: boolean
  onClose: () => void
  onProceed: () => void
  holderName: string | null
}

export function SoftClaimCrossClaimModal({
  isOpen,
  onClose,
  onProceed,
  holderName,
}: SoftClaimCrossClaimProps) {
  const name = holderName || 'Someone'

  return (
    <ModalV2
      id="soft-claim-cross-claim"
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="sm"
      title="Someone's already working on this"
      icon={AlertTriangle}
    >
      <div className="flex flex-col gap-4 p-4">
        <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
          {name} has been putting in time on this. You can still log your work — it just means you're both working on it now.
        </p>
        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={onProceed} fullWidth>
            Log my work
          </Button>
          <Button variant="secondary" onClick={onClose} fullWidth>
            Never mind
          </Button>
        </div>
      </div>
    </ModalV2>
  )
}

interface SoftClaimDoneBlockedProps {
  isOpen: boolean
  onClose: () => void
  onAskMom: () => void
  holderName: string | null
}

export function SoftClaimDoneBlockedModal({
  isOpen,
  onClose,
  onAskMom,
  holderName,
}: SoftClaimDoneBlockedProps) {
  const name = holderName || 'Someone'

  return (
    <ModalV2
      id="soft-claim-done-blocked"
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="sm"
      title="Hold on"
      icon={AlertTriangle}
    >
      <div className="flex flex-col gap-4 p-4">
        <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
          {name} has been doing the work on this one. Only {name} or mom can mark it done.
        </p>
        <div className="flex items-center gap-2">
          <Button variant="primary" onClick={onAskMom} fullWidth>
            Ask Mom
          </Button>
          <Button variant="secondary" onClick={onClose} fullWidth>
            Got it, never mind
          </Button>
        </div>
      </div>
    </ModalV2>
  )
}
