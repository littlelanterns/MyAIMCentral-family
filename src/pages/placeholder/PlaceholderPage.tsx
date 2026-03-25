import type { LucideIcon } from 'lucide-react'
import { FeatureIcon } from '@/components/shared'

interface PlaceholderPageProps {
  title: string
  description: string
  icon: LucideIcon
  prd: string
  featureKey?: string
}

/**
 * Placeholder page for features not yet built.
 * Shows the feature name, description, and which PRD it belongs to.
 * These will be replaced with real implementations in their respective phases.
 */
export function PlaceholderPage({ title, description, icon: Icon, prd, featureKey }: PlaceholderPageProps) {
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
    </div>
  )
}
