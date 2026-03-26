import { Lock, Sparkles } from 'lucide-react'
import { Modal } from '@/components/shared/Modal'
import type { VaultItem } from '../hooks/useVaultBrowse'

interface Props {
  open: boolean
  onClose: () => void
  item: VaultItem | null
}

/**
 * Shown when tapping locked (tier-gated) content (PRD-21A Screen 3).
 * Displays: hook title + thumbnail + short description + upgrade CTA.
 */
export function UpgradeModal({ open, onClose, item }: Props) {
  if (!item) return null

  return (
    <Modal open={open} onClose={onClose} size="sm">
      <div className="p-5 text-center">
        {/* Thumbnail */}
        {item.thumbnail_url ? (
          <div className="relative w-full aspect-video rounded-lg overflow-hidden mb-4" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            <img src={item.thumbnail_url} alt="" className="w-full h-full object-cover opacity-60" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Lock size={32} style={{ color: 'var(--color-text-secondary)' }} />
            </div>
          </div>
        ) : (
          <div className="w-full aspect-video rounded-lg flex items-center justify-center mb-4" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            <Lock size={32} style={{ color: 'var(--color-text-secondary)' }} />
          </div>
        )}

        {/* Hook title */}
        <h3 className="text-lg font-bold" style={{ color: 'var(--color-text-heading)' }}>
          {item.display_title}
        </h3>

        {/* Short description */}
        <p className="text-sm mt-2" style={{ color: 'var(--color-text-secondary)' }}>
          {item.short_description}
        </p>

        {/* Tier message */}
        <div className="mt-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
          <Sparkles size={16} className="mx-auto mb-1" style={{ color: 'var(--color-btn-primary-bg)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            This content is available on a higher plan
          </p>
          <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Upgrade to unlock this and many more tutorials, tools, and prompts.
          </p>
        </div>

        {/* Actions */}
        <div className="flex gap-3 mt-5 justify-center">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Maybe Later
          </button>
          <button
            onClick={() => {
              // TODO: navigate to pricing/plans page when built
              onClose()
            }}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{
              backgroundColor: 'var(--color-btn-primary-bg)',
              color: 'var(--color-btn-primary-text)',
            }}
          >
            See Plans
          </button>
        </div>
      </div>
    </Modal>
  )
}
