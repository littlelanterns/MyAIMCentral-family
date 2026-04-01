/**
 * PRD-25: Celebrate Section (stub)
 * Shows Celebrate button — stub until PRD-11 (Victory Recorder) is built.
 */

import { Trophy } from 'lucide-react'
import { PlannedExpansionCard } from '@/components/shared/PlannedExpansionCard'

export function CelebrateSection() {
  return (
    <div className="space-y-3">
      <button
        disabled
        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl text-base font-semibold transition-colors"
        style={{
          backgroundColor: 'color-mix(in srgb, var(--color-accent-warm) 15%, var(--color-bg-card))',
          color: 'var(--color-accent-warm, var(--color-btn-primary-bg))',
          border: '1px solid color-mix(in srgb, var(--color-accent-warm) 30%, transparent)',
          opacity: 0.7,
        }}
      >
        <Trophy size={20} />
        Celebrate!
      </button>
      <PlannedExpansionCard featureKey="victories_basic" />
    </div>
  )
}
