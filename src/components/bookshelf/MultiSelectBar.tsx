/**
 * MultiSelectBar — floating action bar when books are selected (PRD-23)
 */
import { useState } from 'react'
import { BookOpen, FolderPlus, Trash2, X } from 'lucide-react'
import { Button } from '@/components/shared'
import { CollectionQuickPicker } from './CollectionQuickPicker'

interface MultiSelectBarProps {
  count: number
  selectedIds: Set<string>
  onViewExtractions: () => void
  onArchiveSelected?: () => void
  onClear: () => void
}

export function MultiSelectBar({ count, selectedIds, onViewExtractions, onArchiveSelected, onClear }: MultiSelectBarProps) {
  const [showCollectionPicker, setShowCollectionPicker] = useState(false)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)

  return (
    <div
      className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      }}
    >
      <span className="text-sm font-medium mr-1" style={{ color: 'var(--color-text-primary)' }}>
        {count} selected
      </span>

      <Button variant="primary" size="sm" onClick={onViewExtractions} className="gap-1.5">
        <BookOpen size={14} />
        View Extractions
      </Button>

      <div className="relative">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowCollectionPicker(!showCollectionPicker)}
          className="gap-1.5"
        >
          <FolderPlus size={14} />
          Add to Collection
        </Button>
        {showCollectionPicker && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setShowCollectionPicker(false)} />
            <div className="absolute bottom-full mb-2 right-0 z-20">
              <CollectionQuickPicker
                bookIds={Array.from(selectedIds)}
                onClose={() => setShowCollectionPicker(false)}
              />
            </div>
          </>
        )}
      </div>

      {onArchiveSelected && (
        showArchiveConfirm ? (
          <div className="flex items-center gap-1.5 text-xs">
            <span style={{ color: 'var(--color-text-tertiary)' }}>Remove {count}?</span>
            <button
              onClick={() => {
                onArchiveSelected()
                setShowArchiveConfirm(false)
              }}
              className="px-2 py-0.5 rounded text-white hover:opacity-90"
              style={{ backgroundColor: 'var(--color-error)' }}
            >
              Remove
            </button>
            <button
              onClick={() => setShowArchiveConfirm(false)}
              className="px-2 py-0.5 rounded hover:opacity-70"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <Button variant="secondary" size="sm" onClick={() => setShowArchiveConfirm(true)} className="gap-1.5">
            <Trash2 size={14} />
            Remove
          </Button>
        )
      )}

      <button
        onClick={onClear}
        className="p-1.5 rounded-md hover:opacity-70"
        style={{ color: 'var(--color-text-tertiary)' }}
        title="Clear selection"
      >
        <X size={16} />
      </button>
    </div>
  )
}
