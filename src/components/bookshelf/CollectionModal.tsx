/**
 * CollectionModal — create/edit a collection (PRD-23)
 * Uses ModalV2 transient pattern.
 */
import { useState, useEffect } from 'react'
import { ModalV2 } from '@/components/shared'
import type { BookShelfCollection } from '@/types/bookshelf'

interface CollectionModalProps {
  isOpen: boolean
  collection?: BookShelfCollection
  onClose: () => void
  onSave: (name: string, description: string | null) => Promise<void>
}

export function CollectionModal({ isOpen, collection, onClose, onSave }: CollectionModalProps) {
  const [name, setName] = useState(collection?.name ?? '')
  const [description, setDescription] = useState(collection?.description ?? '')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (isOpen) {
      setName(collection?.name ?? '')
      setDescription(collection?.description ?? '')
    }
  }, [isOpen, collection])

  async function handleSave() {
    if (!name.trim()) return
    setSaving(true)
    try {
      await onSave(name.trim(), description.trim() || null)
    } finally {
      setSaving(false)
    }
  }

  return (
    <ModalV2
      isOpen={isOpen}
      onClose={onClose}
      title={collection ? 'Edit Collection' : 'New Collection'}
      type="transient"
      size="sm"
    >
      <div className="p-4 space-y-4">
        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Name
          </label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="e.g. Parenting Favorites"
            className="w-full px-3 py-2 rounded-md text-sm"
            style={{
              backgroundColor: 'var(--color-bg-input)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
            autoFocus
          />
        </div>

        <div>
          <label
            className="block text-sm font-medium mb-1"
            style={{ color: 'var(--color-text-primary)' }}
          >
            Description
            <span className="font-normal ml-1" style={{ color: 'var(--color-text-tertiary)' }}>(optional)</span>
          </label>
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="What is this collection about?"
            rows={2}
            className="w-full px-3 py-2 rounded-md text-sm resize-none"
            style={{
              backgroundColor: 'var(--color-bg-input)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim() || saving}
            className="px-4 py-2 rounded-md text-sm font-medium"
            style={{
              background: 'var(--surface-primary)',
              color: 'var(--color-text-on-primary)',
              opacity: (!name.trim() || saving) ? 0.5 : 1,
            }}
          >
            {saving ? 'Saving...' : collection ? 'Save' : 'Create'}
          </button>
        </div>
      </div>
    </ModalV2>
  )
}
