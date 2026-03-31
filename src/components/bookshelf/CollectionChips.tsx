/**
 * CollectionChips (PRD-23)
 * Pill buttons for switching between collections in collection view mode.
 */
import { useBookShelfCollections } from '@/hooks/useBookShelfCollections'

interface CollectionChipsProps {
  activeCollectionId: string | null
  onCollectionChange: (id: string) => void
}

export function CollectionChips({ activeCollectionId, onCollectionChange }: CollectionChipsProps) {
  const { collections } = useBookShelfCollections()

  if (collections.length === 0) return null

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 mb-3 scrollbar-thin">
      {collections.map(col => (
        <button
          key={col.id}
          onClick={() => onCollectionChange(col.id)}
          className={`px-3 py-1 rounded-full text-xs whitespace-nowrap shrink-0 transition-colors
            ${activeCollectionId === col.id
              ? 'bg-[var(--surface-primary)] text-[var(--color-text-on-primary,#fff)]'
              : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]'
            }
          `}
        >
          {col.name}
        </button>
      ))}
    </div>
  )
}
