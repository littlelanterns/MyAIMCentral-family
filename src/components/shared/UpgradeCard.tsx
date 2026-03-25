import { Sparkles } from 'lucide-react'

export interface UpgradeCardProps {
  featureName: string
  requiredTier?: string
  onUpgrade?: () => void
}

export function UpgradeCard({ featureName, requiredTier = 'Enhanced', onUpgrade }: UpgradeCardProps) {
  return (
    <div
      className="p-4 flex flex-col items-center gap-3 text-center"
      style={{
        backgroundColor: 'var(--color-bg-secondary)',
        borderRadius: 'var(--vibe-radius-card, 12px)',
        border: '1px solid var(--color-border)',
      }}
    >
      <Sparkles size={28} style={{ color: 'var(--color-accent)' }} />
      <div>
        <p className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
          {featureName}
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
          Available with the {requiredTier} plan
        </p>
      </div>
      {onUpgrade && (
        <button
          onClick={onUpgrade}
          className="px-4 py-2 text-sm font-medium rounded-lg"
          style={{
            background: 'var(--surface-primary, var(--color-btn-primary-bg))',
            color: 'var(--color-btn-primary-text)',
            borderRadius: 'var(--vibe-radius-input, 8px)',
          }}
        >
          Upgrade
        </button>
      )}
    </div>
  )
}
