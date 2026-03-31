/**
 * CollectionSidebar — desktop sidebar / mobile collapsible panel (PRD-23)
 */
import { useState } from 'react'
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight, FolderHeart } from 'lucide-react'
import { useBookShelfCollections } from '@/hooks/useBookShelfCollections'
import { CollectionModal } from './CollectionModal'
import type { BookShelfCollection } from '@/types/bookshelf'

interface CollectionSidebarProps {
  collections: BookShelfCollection[]
  getBookCount: (id: string) => number
  onCollectionClick: (id: string) => void
  mobile?: boolean
}

export function CollectionSidebar({
  collections,
  getBookCount,
  onCollectionClick,
  mobile,
}: CollectionSidebarProps) {
  const { createCollection, updateCollection, deleteCollection } = useBookShelfCollections()
  const [expanded, setExpanded] = useState(!mobile)
  const [editingCollection, setEditingCollection] = useState<BookShelfCollection | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  const content = (
    <>
      <div className="flex items-center justify-between mb-2">
        <h3
          className="text-xs font-semibold uppercase tracking-wide"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          Collections
        </h3>
        <button
          className="p-1 rounded hover:opacity-80"
          style={{ color: 'var(--color-accent)' }}
          onClick={() => setShowCreateModal(true)}
          title="New collection"
        >
          <Plus size={14} />
        </button>
      </div>

      {collections.length === 0 ? (
        <p className="text-xs py-2" style={{ color: 'var(--color-text-tertiary)' }}>
          No collections yet
        </p>
      ) : (
        <div className="space-y-0.5">
          {collections.map(col => (
            <div
              key={col.id}
              className="group flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:opacity-90 transition-colors"
              style={{ color: 'var(--color-text-secondary)' }}
              onClick={() => onCollectionClick(col.id)}
            >
              <FolderHeart size={14} style={{ color: 'var(--color-accent)', flexShrink: 0 }} />
              <span className="text-sm truncate flex-1">{col.name}</span>
              <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                {getBookCount(col.id)}
              </span>
              {/* Inline actions */}
              <div className="hidden group-hover:flex gap-0.5" onClick={e => e.stopPropagation()}>
                <button
                  className="p-0.5 rounded hover:opacity-70"
                  style={{ color: 'var(--color-text-tertiary)' }}
                  onClick={() => setEditingCollection(col)}
                  title="Edit"
                >
                  <Pencil size={12} />
                </button>
                <button
                  className="p-0.5 rounded hover:opacity-70"
                  style={{ color: 'var(--color-status-error)' }}
                  onClick={() => deleteCollection(col.id)}
                  title="Delete"
                >
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit modal */}
      {(showCreateModal || editingCollection) && (
        <CollectionModal
          isOpen
          collection={editingCollection ?? undefined}
          onClose={() => {
            setShowCreateModal(false)
            setEditingCollection(null)
          }}
          onSave={async (name, description) => {
            if (editingCollection) {
              await updateCollection(editingCollection.id, { name, description })
            } else {
              await createCollection(name, description)
            }
            setShowCreateModal(false)
            setEditingCollection(null)
          }}
        />
      )}
    </>
  )

  // Mobile: collapsible panel
  if (mobile) {
    return (
      <div
        className="rounded-lg px-3 py-2"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
        }}
      >
        <button
          className="flex items-center gap-2 w-full text-left"
          onClick={() => setExpanded(!expanded)}
        >
          {expanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            Collections ({collections.length})
          </span>
        </button>
        {expanded && <div className="mt-2">{content}</div>}
      </div>
    )
  }

  // Desktop: sticky sidebar
  return (
    <div
      className="sticky top-0 h-screen overflow-y-auto p-3"
      style={{ borderRight: '1px solid var(--color-border)' }}
    >
      {content}
    </div>
  )
}
