/**
 * Family Feeds — Stub page with PlannedExpansionCard
 * Route: /feeds
 */

import { Rss } from 'lucide-react'
import { PlannedExpansionCard } from '@/components/shared/PlannedExpansionCard'
import { FeatureIcon } from '@/components/shared'

export function FamilyFeedsStub() {
  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <FeatureIcon featureKey="family_feeds" fallback={<Rss size={40} style={{ color: 'var(--color-btn-primary-bg)' }} />} size={40} />
        <h1
          className="text-2xl font-bold"
          style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
        >
          Family Feeds
        </h1>
      </div>
      <PlannedExpansionCard featureKey="family_feeds" />
    </div>
  )
}
