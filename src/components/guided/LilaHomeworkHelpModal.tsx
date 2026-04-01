/**
 * PRD-25 Phase C: LiLa Homework Help Modal — Stub
 *
 * Permission-gated modal that will connect to PRD-05's
 * guided_homework_help conversation mode when built.
 * For now: warm "coming soon" message.
 */

import { BookOpen } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { Button } from '@/components/shared'

interface LilaHomeworkHelpModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LilaHomeworkHelpModal({ isOpen, onClose }: LilaHomeworkHelpModalProps) {
  return (
    <ModalV2
      id="lila-homework-help"
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="sm"
      title="Homework Help"
    >
      <div className="p-6 text-center space-y-4">
        <div
          className="mx-auto w-16 h-16 rounded-full flex items-center justify-center"
          style={{ backgroundColor: 'var(--color-bg-hover)' }}
        >
          <BookOpen size={32} style={{ color: 'var(--color-btn-primary-bg)' }} />
        </div>
        <p
          className="text-base leading-relaxed"
          style={{ color: 'var(--color-text-primary)' }}
        >
          LiLa&apos;s Homework Help is coming soon! When it&apos;s ready,
          LiLa will help you work through homework problems step by step —
          without giving you the answers.
        </p>
        <Button variant="primary" onClick={onClose}>
          Got it
        </Button>
      </div>
    </ModalV2>
  )
}
