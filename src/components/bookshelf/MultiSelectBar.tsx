/**
 * MultiSelectBar — floating action bar when books are selected (PRD-23)
 */
import { useState } from 'react'
import { BookOpen, FolderPlus, X } from 'lucide-react'
import { Button } from '@/components/shared'
import { CollectionQuickPicker } from './CollectionQuickPicker'

interface MultiSelectBarProps {
  count: number
  selectedIds: Set<string>
  onViewExtractions: () => void
  onClear: () => void
}

export function MultiSelectBar({ count, selectedIds, onViewExtractions, onClear }: MultiSelectBarProps) {
  const [showCollectionPicker, setShowCollectionPicker] = useState(false)

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
