import { ModalV2 } from '@/components/shared/ModalV2'
import { VaultContentCard } from './VaultContentCard'
import type { VaultItem } from '../hooks/useVaultBrowse'

interface Props {
  isOpen: boolean
  onClose: () => void
  categoryTitle: string
  items: VaultItem[]
  memberId: string | null
  onSelectItem?: (item: VaultItem) => void
}

export function VaultCategoryGridModal({
  isOpen,
  onClose,
  categoryTitle,
  items,
  memberId,
  onSelectItem,
}: Props) {
  return (
    <ModalV2
      id={`vault-category-grid-${categoryTitle}`}
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="lg"
      title={categoryTitle}
    >
      {items.length === 0 ? (
        <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
          No items in this category yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {items.map((item) => (
            <VaultContentCard
              key={item.id}
              item={item}
              memberId={memberId}
              onSelect={(selected) => {
                onSelectItem?.(selected)
                onClose()
              }}
            />
          ))}
        </div>
      )}
    </ModalV2>
  )
}
