import { Sparkles } from 'lucide-react'
import type { VaultItem } from '../../hooks/useVaultBrowse'
import { VaultContentCard } from '../VaultContentCard'

interface Props {
  item: VaultItem
  children: VaultItem[]
  memberId: string | null
}

/**
 * Curation detail view (PRD-21A, renamed from tool_collection per PRD-21B).
 * Renders a grid of contained Vault items using the standard VaultContentCard.
 */
export function CurationDetail({ item, children: childItems, memberId }: Props) {
  return (
    <div className="p-4 md:p-6">
      {/* Collection description */}
      {item.full_description && (
        <p className="text-sm mb-4" style={{ color: 'var(--color-text-primary)' }}>
          {item.full_description}
        </p>
      )}

      {/* Item count */}
      <p className="text-xs mb-4" style={{ color: 'var(--color-text-secondary)' }}>
        {childItems.length} item{childItems.length !== 1 ? 's' : ''} in this collection
      </p>

      {childItems.length === 0 ? (
        <div className="text-center py-12">
          <Sparkles size={32} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--color-text-secondary)' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Items are being added to this collection. Check back soon!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {childItems.map(child => (
            <VaultContentCard
              key={child.id}
              item={child}
              memberId={memberId}
            />
          ))}
        </div>
      )}
    </div>
  )
}
