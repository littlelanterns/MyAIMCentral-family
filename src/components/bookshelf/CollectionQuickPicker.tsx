/**
 * CollectionQuickPicker — quick add-to-collection popover (PRD-23)
 * Shows list of collections with checkboxes + "New Collection" option.
 */
import { useState } from 'react'
import { Plus, FolderHeart, X } from 'lucide-react'
import { useBookShelfCollections } from '@/hooks/useBookShelfCollections'
import { CollectionModal } from './CollectionModal'

interface CollectionQuickPickerProps {
  bookIds: string[]
  onClose: () => void
}

export function CollectionQuickPicker({ bookIds, onClose }: CollectionQuickPickerProps) {
  const {
    collections,
    collectionBookIds,
    addBooksToCollection,
    removeBookFromCollection,
    createCollection,
  } = useBookShelfCollections()
  const [showCreate, setShowCreate] = useState(false)

  function isBookInCollection(collectionId: string): boolean {
    const ids = collectionBookIds.get(collectionId) || []
    return bookIds.every(bid => ids.includes(bid))
  }

  function isSomeInCollection(collectionId: string): boolean {
    const ids = collectionBookIds.get(collectionId) || []
    return bookIds.some(bid => ids.includes(bid))
  }

  async function toggleCollection(collectionId: string) {
    if (isBookInCollection(collectionId)) {
      // Remove all selected books from collection
      for (const bid of bookIds) {
        await removeBookFromCollection(collectionId, bid)
      }
    } else {
      await addBooksToCollection(collectionId, bookIds)
    }
  }

  return (
    <>
      <div
        className="rounded-lg shadow-lg p-3 w-64"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            Add to Collection
          </span>
          <button onClick={onClose} style={{ color: 'var(--color-text-tertiary)' }}>
            <X size={14} />
          </button>
        </div>

        {collections.length === 0 ? (
          <p className="text-xs py-2" style={{ color: 'var(--color-text-tertiary)' }}>
            No collections yet
          </p>
        ) : (
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {collections.map(col => {
              const allIn = isBookInCollection(col.id)
              const someIn = isSomeInCollection(col.id)
              return (
                <label
                  key={col.id}
                  className="flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer hover:opacity-90"
                >
                  <input
                    type="checkbox"
                    checked={allIn}
                    ref={el => {
                      if (el) el.indeterminate = someIn && !allIn
                    }}
                    onChange={() => toggleCollection(col.id)}
                    className="w-4 h-4 rounded"
                  />
                  <FolderHeart size={14} style={{ color: 'var(--color-accent)' }} />
                  <span className="text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>
                    {col.name}
                  </span>
                </label>
              )
            })}
          </div>
        )}

        <button
          className="flex items-center gap-2 w-full mt-2 px-2 py-1.5 rounded text-sm hover:opacity-80"
          style={{ color: 'var(--color-accent)' }}
          onClick={() => setShowCreate(true)}
        >
          <Plus size={14} />
          New Collection
        </button>
      </div>

      {showCreate && (
        <CollectionModal
          isOpen
          onClose={() => setShowCreate(false)}
          onSave={async (name, description) => {
            const id = await createCollection(name, description ?? undefined)
            await addBooksToCollection(id, bookIds)
            setShowCreate(false)
          }}
        />
      )}
    </>
  )
}
