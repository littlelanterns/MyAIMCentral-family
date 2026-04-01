/**
 * PRD-25 Phase C: Guided Progress Page — Stub
 *
 * Warm placeholder for Guided members accessed via bottom nav "Progress".
 * When PRD-24 (Gamification) is built, this becomes the child's
 * achievement history, streak records, and reward catalog.
 */

import { BarChart3 } from 'lucide-react'

export function GuidedProgress() {
  return (
    <div className="max-w-md mx-auto px-4 py-8 text-center space-y-6">
      <div
        className="mx-auto w-20 h-20 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-bg-hover)' }}
      >
        <BarChart3 size={40} style={{ color: 'var(--color-btn-primary-bg)' }} />
      </div>
      <h1
        className="text-xl font-bold"
        style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
      >
        My Progress
      </h1>
      <p
        className="text-base leading-relaxed"
        style={{ color: 'var(--color-text-primary)' }}
      >
        Your progress page is coming soon! This is where you&apos;ll see
        your streaks, achievements, and how far you&apos;ve come.
      </p>
      <p
        className="text-sm"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Keep doing your best — every day counts!
      </p>
    </div>
  )
}
