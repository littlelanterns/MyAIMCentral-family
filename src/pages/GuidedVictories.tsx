/**
 * PRD-25 Phase C: Guided Victories Page — Stub
 *
 * Warm placeholder for Guided members accessed via bottom nav "Victories".
 * When PRD-11 (Victory Recorder) is built, this becomes the child's
 * victory log with celebration animations and self-reported wins.
 */

import { Trophy } from 'lucide-react'

export function GuidedVictories() {
  return (
    <div className="max-w-md mx-auto px-4 py-8 text-center space-y-6">
      <div
        className="mx-auto w-20 h-20 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-bg-hover)' }}
      >
        <Trophy size={40} style={{ color: 'var(--color-btn-primary-bg)' }} />
      </div>
      <h1
        className="text-xl font-bold"
        style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
      >
        Victories
      </h1>
      <p
        className="text-base leading-relaxed"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Your victories page is coming soon! This is where you&apos;ll see
        all the amazing things you&apos;ve accomplished.
      </p>
      <p
        className="text-sm"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Every task you finish and every intention you celebrate is a victory worth remembering.
      </p>
    </div>
  )
}
