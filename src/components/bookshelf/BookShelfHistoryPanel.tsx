/**
 * BookShelfHistoryPanel (PRD-23)
 * Combined history panel showing recent semantic searches and discussions.
 * Activated by clock icon in the ExtractionBrowser header.
 */
import { useEffect, useCallback } from 'react'
import { X, Search, MessageSquare, ChevronRight, Trash2 } from 'lucide-react'
import { useBookShelfSearchHistory } from '@/hooks/useBookShelfSearchHistory'
import type { BookShelfDiscussion, BookShelfSearchHistoryEntry } from '@/types/bookshelf'

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(dateStr).toLocaleDateString()
}

const AUDIENCE_SHORT: Record<string, string> = {
  personal: 'Personal',
  family: 'Family',
  teen: 'Teen',
  spouse: 'Spouse',
  children: 'Children',
}

interface BookShelfHistoryPanelProps {
  isOpen: boolean
  onClose: () => void
  discussions: BookShelfDiscussion[]
  bookTitleMap: Record<string, string>
  onRerunSearch: (query: string, mode: string) => void
  onContinueDiscussion: (discussion: BookShelfDiscussion) => void
  onDeleteDiscussion: (id: string) => void
}

export function BookShelfHistoryPanel({
  isOpen, onClose, discussions, bookTitleMap,
  onRerunSearch, onContinueDiscussion, onDeleteDiscussion,
}: BookShelfHistoryPanelProps) {
  const { history: searchHistory, deleteEntry: deleteSearchEntry, clearAll: clearSearchHistory } = useBookShelfSearchHistory()

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isOpen, onClose])

  const handleSearchClick = useCallback((entry: BookShelfSearchHistoryEntry) => {
    onRerunSearch(entry.query, entry.mode)
    onClose()
  }, [onRerunSearch, onClose])

  const handleDiscussionClick = useCallback((disc: BookShelfDiscussion) => {
    onContinueDiscussion(disc)
    onClose()
  }, [onContinueDiscussion, onClose])

  if (!isOpen) return null

  const hasContent = searchHistory.length > 0 || discussions.length > 0

  return (
    <div className="absolute right-0 top-full mt-1 z-50 w-80 max-h-96 overflow-y-auto rounded-lg shadow-xl" style={{ backgroundColor: 'var(--color-bg-card, var(--color-surface-primary))', border: '1px solid var(--color-border-default)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between px-3 py-2 border-b border-[var(--color-border-default)]" style={{ backgroundColor: 'var(--color-bg-card, var(--color-surface-primary))' }}>
        <span className="text-xs font-medium text-[var(--color-text-secondary)]">BookShelf History</span>
        <button type="button" onClick={onClose} className="p-0.5 rounded hover:bg-[var(--color-surface-tertiary)]">
          <X size={14} className="text-[var(--color-text-tertiary)]" />
        </button>
      </div>

      {!hasContent && (
        <div className="px-4 py-8 text-center text-xs text-[var(--color-text-tertiary)]">
          No search or discussion history yet.
        </div>
      )}

      {/* Search History */}
      {searchHistory.length > 0 && (
        <div>
          <div className="flex items-center justify-between px-3 py-1.5 bg-[var(--color-surface-secondary)]">
            <span className="flex items-center gap-1 text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
              <Search size={10} /> Recent Searches
            </span>
            <button
              type="button"
              onClick={clearSearchHistory}
              className="text-[10px] text-[var(--color-text-tertiary)] hover:text-[var(--color-error)]"
            >
              Clear
            </button>
          </div>

          {searchHistory.map(entry => (
            <div
              key={entry.id}
              className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--color-surface-secondary)] cursor-pointer border-b border-[var(--color-border-default)] last:border-b-0"
              onClick={() => handleSearchClick(entry)}
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs text-[var(--color-text-primary)] truncate">{entry.query}</div>
                <div className="flex items-center gap-2 text-[10px] text-[var(--color-text-tertiary)]">
                  <span>{entry.result_count} results</span>
                  <span>{entry.mode}</span>
                  <span>{relativeTime(entry.created_at)}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={e => { e.stopPropagation(); deleteSearchEntry(entry.id) }}
                  className="p-0.5 rounded hover:bg-[var(--color-surface-tertiary)]"
                  title="Remove"
                >
                  <X size={10} className="text-[var(--color-text-tertiary)]" />
                </button>
                <ChevronRight size={12} className="text-[var(--color-text-tertiary)]" />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Discussion History */}
      {discussions.length > 0 && (
        <div>
          <div className="px-3 py-1.5 bg-[var(--color-surface-secondary)]">
            <span className="flex items-center gap-1 text-[10px] font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider">
              <MessageSquare size={10} /> Recent Discussions
            </span>
          </div>

          {discussions.slice(0, 10).map(disc => {
            const bookNames = disc.bookshelf_item_ids
              .map(id => bookTitleMap[id] || 'Unknown')
              .join(', ')
            const isLibraryWide = disc.bookshelf_item_ids.length > 3

            return (
              <div
                key={disc.id}
                className="flex items-center gap-2 px-3 py-2 hover:bg-[var(--color-surface-secondary)] cursor-pointer border-b border-[var(--color-border-default)] last:border-b-0"
                onClick={() => handleDiscussionClick(disc)}
              >
                <div className="flex-1 min-w-0">
                  <div className="text-xs text-[var(--color-text-primary)] truncate">
                    {disc.title || 'Untitled discussion'}
                  </div>
                  <div className="text-[10px] text-[var(--color-text-tertiary)] truncate">
                    {isLibraryWide ? 'Library-wide' : bookNames}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-[var(--color-text-tertiary)]">
                    <span>{AUDIENCE_SHORT[disc.audience] || disc.audience}</span>
                    <span>{relativeTime(disc.updated_at)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={e => { e.stopPropagation(); onDeleteDiscussion(disc.id) }}
                    className="p-0.5 rounded hover:bg-[var(--color-surface-tertiary)]"
                    title="Delete"
                  >
                    <Trash2 size={10} className="text-[var(--color-text-tertiary)]" />
                  </button>
                  <ChevronRight size={12} className="text-[var(--color-text-tertiary)]" />
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
