/**
 * BookSelector (PRD-23)
 * Multi-book mode: checkboxes to toggle which books are included.
 */
import type { BookShelfItem } from '@/types/bookshelf'

interface BookSelectorProps {
  books: BookShelfItem[]
  selectedBookIds: Set<string>
  onToggle: (bookId: string) => void
}

export function BookSelector({ books, selectedBookIds, onToggle }: BookSelectorProps) {
  if (books.length <= 1) return null

  return (
    <div className="mb-3 p-2 rounded-lg bg-[var(--color-surface-secondary)]">
      <div className="text-xs font-medium text-[var(--color-text-tertiary)] mb-1.5">
        Books included ({selectedBookIds.size} of {books.length})
      </div>
      <div className="flex flex-wrap gap-1.5">
        {books.map(book => {
          const selected = selectedBookIds.has(book.id)
          return (
            <label
              key={book.id}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs cursor-pointer transition-colors
                ${selected
                  ? 'bg-[color-mix(in_srgb,var(--color-accent)_15%,transparent)] text-[var(--color-accent)]'
                  : 'bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)]'
                }
              `}
            >
              <input
                type="checkbox"
                checked={selected}
                onChange={() => onToggle(book.id)}
                className="sr-only"
              />
              <span className={`w-2 h-2 rounded-full ${selected ? 'bg-[var(--color-accent)]' : 'bg-[var(--color-border-default)]'}`} />
              <span className="truncate max-w-[120px]">{book.title}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
