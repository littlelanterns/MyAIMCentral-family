/**
 * BookShelfLibrary — main library view (PRD-23 Session A)
 */
import { useState, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, Grid3X3, List, ChevronDown,
  X, Library, Sparkles, RefreshCw, Tag,
} from 'lucide-react'
import { Button, FeatureGuide } from '@/components/shared'
import { useBookShelf } from '@/hooks/useBookShelf'
import { useBookShelfSettings } from '@/hooks/useBookShelfSettings'
import { useBookShelfCollections } from '@/hooks/useBookShelfCollections'
import { BookCard } from './BookCard'
import { CollectionSidebar } from './CollectionSidebar'
import { MultiSelectBar } from './MultiSelectBar'
import { ContinueBanner } from './ContinueBanner'
import type { BookShelfItem } from '@/types/bookshelf'

// ─── Sort options ───────────────────────────────────────────

const SORT_OPTIONS = [
  { key: 'newest', label: 'Newest' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'name_asc', label: 'Name A-Z' },
  { key: 'name_desc', label: 'Name Z-A' },
  { key: 'has_extractions', label: 'Has Extractions' },
  { key: 'recently_viewed', label: 'Recently Viewed' },
  { key: 'most_annotated', label: 'Most Annotated' },
] as const

function sortBooks(books: BookShelfItem[], sortKey: string): BookShelfItem[] {
  const sorted = [...books]
  switch (sortKey) {
    case 'newest':
      return sorted.sort((a, b) => b.created_at.localeCompare(a.created_at))
    case 'oldest':
      return sorted.sort((a, b) => a.created_at.localeCompare(b.created_at))
    case 'name_asc':
      return sorted.sort((a, b) => a.title.localeCompare(b.title))
    case 'name_desc':
      return sorted.sort((a, b) => b.title.localeCompare(a.title))
    case 'has_extractions':
      return sorted.sort((a, b) => {
        if (a.extraction_status === 'completed' && b.extraction_status !== 'completed') return -1
        if (b.extraction_status === 'completed' && a.extraction_status !== 'completed') return 1
        return b.created_at.localeCompare(a.created_at)
      })
    case 'recently_viewed':
      return sorted.sort((a, b) => {
        if (!a.last_viewed_at && !b.last_viewed_at) return 0
        if (!a.last_viewed_at) return 1
        if (!b.last_viewed_at) return -1
        return b.last_viewed_at.localeCompare(a.last_viewed_at)
      })
    case 'most_annotated':
      // Proxy: books with more tags/genres likely have more annotations
      return sorted.sort((a, b) => (b.tags.length + b.genres.length) - (a.tags.length + a.genres.length))
    default:
      return sorted
  }
}

// ─── Search filter ──────────────────────────────────────────

function matchesSearch(book: BookShelfItem, query: string): boolean {
  const q = query.toLowerCase()
  if (book.title.toLowerCase().includes(q)) return true
  if (book.author?.toLowerCase().includes(q)) return true
  if (book.tags.some(t => t.toLowerCase().includes(q))) return true
  if (book.genres.some(g => g.toLowerCase().includes(q))) return true
  return false
}

// ─── Component ──────────────────────────────────────────────

export function BookShelfLibrary() {
  const navigate = useNavigate()
  const { parentBooks, loading, getPartsForBook } = useBookShelf()
  const { settings, updateSetting } = useBookShelfSettings()
  const { collections, getBookCountForCollection } = useBookShelfCollections()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [showSortDropdown, setShowSortDropdown] = useState(false)
  const [activeTag, setActiveTag] = useState<string | null>(null)

  // Debounced search with tag auto-select (ref-based to prevent timer leaks)
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)
  const handleSearchChange = useCallback((value: string) => {
    setSearchQuery(value)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(() => {
      setDebouncedQuery(value)
      if (value.trim()) {
        const q = value.trim().toLowerCase().replace(/\s+/g, '_')
        const allTags = new Set<string>()
        parentBooks.forEach(b => b.tags.forEach(t => allTags.add(t)))
        const exactMatch = Array.from(allTags).find(
          t => t.toLowerCase() === q || t.toLowerCase() === value.trim().toLowerCase()
        )
        if (exactMatch) {
          setActiveTag(exactMatch)
          setSearchQuery('')
          setDebouncedQuery('')
        }
      }
    }, 300)
  }, [parentBooks])

  // Extract unique tags sorted by frequency, reordered by search relevance
  const availableTags = useMemo(() => {
    const tagCounts = new Map<string, number>()
    for (const book of parentBooks) {
      for (const tag of book.tags) {
        if (tag === 'extracted' || tag === 'not_extracted') continue
        tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1)
      }
    }
    const all = Array.from(tagCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([tag, count]) => ({ tag, count }))

    // When search is active, promote matching tags to the front
    if (debouncedQuery) {
      const q = debouncedQuery.toLowerCase()
      const matching = all.filter(t => t.tag.toLowerCase().includes(q))
      const rest = all.filter(t => !t.tag.toLowerCase().includes(q))
      return [...matching, ...rest]
    }
    return all
  }, [parentBooks, debouncedQuery])

  // Filtered and sorted books
  const displayBooks = useMemo(() => {
    let books = parentBooks
    if (activeTag) {
      books = books.filter(b => b.tags.includes(activeTag))
    }
    if (debouncedQuery) {
      books = books.filter(b => matchesSearch(b, debouncedQuery))
    }
    return sortBooks(books, settings.librarySort)
  }, [parentBooks, activeTag, debouncedQuery, settings.librarySort])

  // Selection handlers
  function toggleSelect(id: string, checked: boolean) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (checked) next.add(id)
      else next.delete(id)
      return next
    })
  }

  function clearSelection() {
    setSelectedIds(new Set())
  }

  function handleBookClick(book: BookShelfItem) {
    // Save to sessionStorage for "Continue Where You Left Off"
    sessionStorage.setItem('bookshelf-last-book-id', book.id)
    sessionStorage.setItem('bookshelf-last-book-title', book.title)
    navigate(`/bookshelf?book=${book.id}`)
  }

  // Render book grid/list
  function renderBooks(books: BookShelfItem[]) {
    if (settings.libraryLayout === 'compact') {
      return (
        <div className="space-y-0">
          {books.map(book => (
            <BookCard
              key={book.id}
              book={book}
              layout="compact"
              selected={selectedIds.has(book.id)}
              onSelect={toggleSelect}
              onClick={handleBookClick}
              parts={getPartsForBook(book.id)}
            />
          ))}
        </div>
      )
    }
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {books.map(book => (
          <BookCard
            key={book.id}
            book={book}
            layout="grid"
            selected={selectedIds.has(book.id)}
            onSelect={toggleSelect}
            onClick={handleBookClick}
            parts={getPartsForBook(book.id)}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="density-compact">
      <div className="flex min-h-0">
        {/* Collection sidebar — desktop only */}
        <div className="hidden md:block w-56 flex-shrink-0">
          <CollectionSidebar
            collections={collections}
            getBookCount={getBookCountForCollection}
            onCollectionClick={id => navigate(`/bookshelf?collection=${id}`)}
          />
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 p-4 md:p-6">
          {/* Header */}
          <div className="flex items-center gap-3 mb-4">
            <Library size={24} style={{ color: 'var(--color-accent)' }} />
            <h1
              className="text-xl font-bold"
              style={{ color: 'var(--color-text-primary)', fontFamily: 'var(--font-heading)' }}
            >
              BookShelf
            </h1>
            <span
              className="text-sm ml-auto"
              style={{ color: 'var(--color-text-tertiary)' }}
            >
              {displayBooks.length === parentBooks.length
                ? `${parentBooks.length} books`
                : `${displayBooks.length} of ${parentBooks.length} books`}
            </span>
          </div>

          {/* Feature guide */}
          <FeatureGuide
            featureKey="bookshelf_basic"
            title="BookShelf"
            description="Your family's book wisdom library. Upload books, extract structured knowledge, and route insights into Guiding Stars, tasks, journal prompts, and LiLa context."
          />

          {/* Continue banner */}
          <ContinueBanner />

          {/* Controls row */}
          <div className="flex flex-wrap items-center gap-2 mb-4">
            {/* Search */}
            <div className="relative flex-1 min-w-48 max-w-md">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--color-text-tertiary)' }}
              />
              <input
                type="text"
                value={searchQuery}
                onChange={e => handleSearchChange(e.target.value)}
                placeholder="Search by title, author, or topic..."
                className="w-full pl-9 pr-8 py-2 rounded-md text-sm"
                style={{
                  backgroundColor: 'var(--color-bg-input)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-primary)',
                }}
              />
              {searchQuery && (
                <button
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => { setSearchQuery(''); setDebouncedQuery('') }}
                  style={{ color: 'var(--color-text-tertiary)' }}
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Sort dropdown */}
            <div className="relative">
              <button
                className="flex items-center gap-1 px-3 py-2 rounded-md text-sm"
                style={{
                  backgroundColor: 'var(--color-bg-input)',
                  border: '1px solid var(--color-border)',
                  color: 'var(--color-text-secondary)',
                }}
                onClick={() => setShowSortDropdown(!showSortDropdown)}
              >
                {SORT_OPTIONS.find(o => o.key === settings.librarySort)?.label || 'Sort'}
                <ChevronDown size={14} />
              </button>
              {showSortDropdown && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSortDropdown(false)} />
                  <div
                    className="absolute right-0 top-full mt-1 z-20 rounded-md shadow-lg py-1 min-w-40"
                    style={{
                      backgroundColor: 'var(--color-bg-card)',
                      border: '1px solid var(--color-border)',
                    }}
                  >
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt.key}
                        className="w-full text-left px-3 py-1.5 text-sm hover:opacity-80"
                        style={{
                          color: settings.librarySort === opt.key ? 'var(--color-accent)' : 'var(--color-text-primary)',
                          fontWeight: settings.librarySort === opt.key ? 600 : 400,
                        }}
                        onClick={() => {
                          updateSetting('librarySort', opt.key)
                          setShowSortDropdown(false)
                        }}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Layout toggle */}
            <div
              className="flex rounded-md overflow-hidden"
              style={{ border: '1px solid var(--color-border)' }}
            >
              <button
                className="p-2"
                style={{
                  backgroundColor: settings.libraryLayout === 'grid' ? 'var(--color-accent)' : 'var(--color-bg-input)',
                  color: settings.libraryLayout === 'grid' ? 'var(--color-text-on-primary)' : 'var(--color-text-secondary)',
                }}
                onClick={() => updateSetting('libraryLayout', 'grid')}
                title="Grid view"
              >
                <Grid3X3 size={16} />
              </button>
              <button
                className="p-2"
                style={{
                  backgroundColor: settings.libraryLayout === 'compact' ? 'var(--color-accent)' : 'var(--color-bg-input)',
                  color: settings.libraryLayout === 'compact' ? 'var(--color-text-on-primary)' : 'var(--color-text-secondary)',
                }}
                onClick={() => updateSetting('libraryLayout', 'compact')}
                title="Compact list"
              >
                <List size={16} />
              </button>
            </div>

          </div>

          {/* Tag filter bar */}
          {availableTags.length > 0 && (
            <div className="relative mb-4 group/tags">
              <div
                className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin"
                style={{ scrollbarColor: 'var(--color-border) transparent' }}
              >
                <button
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                  style={{
                    backgroundColor: !activeTag ? 'var(--color-accent)' : 'var(--color-bg-input)',
                    color: !activeTag ? 'var(--color-text-on-primary)' : 'var(--color-text-secondary)',
                    border: `1px solid ${!activeTag ? 'var(--color-accent)' : 'var(--color-border)'}`,
                  }}
                  onClick={() => setActiveTag(null)}
                >
                  All ({parentBooks.length})
                </button>
                {availableTags.map(({ tag, count }) => {
                  const isActive = activeTag === tag
                  const isSearchMatch = debouncedQuery && tag.toLowerCase().includes(debouncedQuery.toLowerCase())
                  return (
                    <button
                      key={tag}
                      className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors whitespace-nowrap"
                      style={{
                        backgroundColor: isActive
                          ? 'var(--color-accent)'
                          : isSearchMatch
                            ? 'color-mix(in srgb, var(--color-accent) 20%, transparent)'
                            : 'var(--color-bg-input)',
                        color: isActive
                          ? 'var(--color-text-on-primary)'
                          : isSearchMatch
                            ? 'var(--color-accent)'
                            : 'var(--color-text-secondary)',
                        border: `1px solid ${isActive ? 'var(--color-accent)' : isSearchMatch ? 'var(--color-accent)' : 'var(--color-border)'}`,
                      }}
                      onClick={() => {
                        setActiveTag(isActive ? null : tag)
                        if (!isActive) { setSearchQuery(''); setDebouncedQuery('') }
                      }}
                    >
                      {tag.replace(/_/g, ' ')} ({count})
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Action buttons row (stubs) */}
          <div className="flex gap-2 mb-4">
            <Button variant="secondary" size="sm" disabled className="gap-1.5 opacity-50">
              <Sparkles size={14} />
              Search Library
            </Button>
            <Button variant="secondary" size="sm" disabled className="gap-1.5 opacity-50">
              <RefreshCw size={14} />
              Refresh Key Points
            </Button>
          </div>

          {/* Collection panel — mobile only */}
          <div className="md:hidden mb-4">
            <CollectionSidebar
              collections={collections}
              getBookCount={getBookCountForCollection}
              onCollectionClick={id => navigate(`/bookshelf?collection=${id}`)}
              mobile
            />
          </div>

          {/* Loading state */}
          {loading && (
            <div className="text-center py-12" style={{ color: 'var(--color-text-tertiary)' }}>
              Loading library...
            </div>
          )}

          {/* Empty state */}
          {!loading && displayBooks.length === 0 && (
            <div
              className="text-center py-12 rounded-lg"
              style={{
                backgroundColor: 'var(--color-bg-card)',
                border: '1px solid var(--color-border)',
              }}
            >
              <Library size={40} className="mx-auto mb-3" style={{ color: 'var(--color-text-tertiary)' }} />
              <p className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                {debouncedQuery ? `No books match "${debouncedQuery}"` : 'Your BookShelf is empty'}
              </p>
              {debouncedQuery && (
                <Button
                  variant="secondary"
                  size="sm"
                  disabled
                  className="mt-2 opacity-50"
                >
                  Search inside all books for &ldquo;{debouncedQuery}&rdquo;
                </Button>
              )}
            </div>
          )}

          {/* Book grid/list */}
          {!loading && displayBooks.length > 0 && (
            <>
              {activeTag && (
                <p className="text-xs mb-3 flex items-center gap-1.5" style={{ color: 'var(--color-text-tertiary)' }}>
                  <Tag size={12} />
                  Showing {displayBooks.length} books tagged &ldquo;{activeTag.replace(/_/g, ' ')}&rdquo;
                </p>
              )}
              {renderBooks(displayBooks)}
            </>
          )}
        </div>
      </div>

      {/* Multi-select floating bar */}
      {selectedIds.size > 0 && (
        <MultiSelectBar
          count={selectedIds.size}
          onViewExtractions={() => {
            const ids = Array.from(selectedIds).join(',')
            navigate(`/bookshelf?books=${ids}`)
          }}
          onClear={clearSelection}
          selectedIds={selectedIds}
        />
      )}
    </div>
  )
}
