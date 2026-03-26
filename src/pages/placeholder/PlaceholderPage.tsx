import type { LucideIcon } from 'lucide-react'
import { FeatureIcon } from '@/components/shared'
import { PlannedExpansionCard } from '@/components/shared/PlannedExpansionCard'
import { FEATURE_EXPANSION_REGISTRY } from '@/config/feature_expansion_registry'

interface PlaceholderPageProps {
  title: string
  description: string
  icon: LucideIcon
  prd: string
  featureKey?: string
}

/**
 * Placeholder page for features not yet built.
 * Uses PlannedExpansionCard when the feature key exists in the registry.
 * Falls back to a simple display if not.
 */
export function PlaceholderPage({ title, description, icon: Icon, prd, featureKey }: PlaceholderPageProps) {
  const hasExpansionCard = featureKey && FEATURE_EXPANSION_REGISTRY[featureKey]

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        {featureKey ? (
          <FeatureIcon featureKey={featureKey} fallback={<Icon size={40} style={{ color: 'var(--color-btn-primary-bg)' }} />} size={40} />
        ) : (
          <Icon size={24} style={{ color: 'var(--color-btn-primary-bg)' }} />
        )}
        <h1
          className="text-2xl font-bold"
          style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
        >
          {title}
        </h1>
      </div>

      {hasExpansionCard ? (
        <PlannedExpansionCard featureKey={featureKey!} />
      ) : (
        <div
          className="p-8 rounded-lg text-center space-y-3"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          {featureKey ? (
            <div className="mx-auto w-fit">
              <FeatureIcon featureKey={featureKey} fallback={<Icon size={56} style={{ color: 'var(--color-text-secondary)', opacity: 0.5 }} />} size={56} />
            </div>
          ) : (
            <Icon size={48} className="mx-auto" style={{ color: 'var(--color-text-secondary)', opacity: 0.5 }} />
          )}
          <p style={{ color: 'var(--color-text-primary)' }}>{description}</p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Coming in {prd}
          </p>
        </div>
      )}
    </div>
  )
}
