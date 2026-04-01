/**
 * PRD-25 Phase C: LiLa Communication Coach Modal — Stub
 *
 * Permission-gated modal that will connect to PRD-05 + PRD-21's
 * guided_communication_coach conversation mode when built.
 * For now: warm "coming soon" message.
 */

import { MessageCircle } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { Button } from '@/components/shared'

interface LilaCommunicationCoachModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LilaCommunicationCoachModal({ isOpen, onClose }: LilaCommunicationCoachModalProps) {
  return (
    <ModalV2
      id="lila-communication-coach"
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="sm"
      title="Communication Coach"
    >
      <div className="p-6 text-center space-y-4">
        <div
          className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-bg-hover)' }}
        >
          <MessageCircle size={32} style={{ color: 'var(--color-btn-primary-bg)' }} />
        </div>
        <p
          className="text-base leading-relaxed"
          style={{ color: 'var(--color-text-primary)' }}
        >
          LiLa&apos;s Communication Coach is coming soon! When it&apos;s ready,
          LiLa will help you figure out how to talk to your family about
          things that are on your mind.
        </p>
        <Button variant="primary" onClick={onClose}>
          Got it
        </Button>
      </div>
    </ModalV2>
  )
}
