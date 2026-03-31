/**
 * ExtractionHeader (PRD-23)
 * Back button, title (editable for single-book), book info collapsible section.
 */
import { useState } from 'react'
import { ArrowLeft, ChevronDown, ChevronRight, RefreshCw } from 'lucide-react'
import type { BookShelfItem } from '@/types/bookshelf'

interface ExtractionHeaderProps {
  books: BookShelfItem[]
  collectionName?: string
  showHearted: boolean
  onBack: () => void
  onTitleChange?: (bookId: string, title: string) => void
  onAuthorChange?: (bookId: string, author: string) => void
  onRefreshKeyPoints?: (bookId: string) => void
  refreshingKeyPoints?: boolean
  /** For multi-part navigation */
  siblingBooks?: BookShelfItem[]
  onNavigateToBook?: (bookId: string) => void
}

export function ExtractionHeader({
  books, collectionName, showHearted, onBack,
  onTitleChange, onAuthorChange, onRefreshKeyPoints, refreshingKeyPoints,
  siblingBooks, onNavigateToBook,
}: ExtractionHeaderProps) {
  const isSingleBook = books.length === 1
  const book = isSingleBook ? books[0] : null
  const [showInfo, setShowInfo] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [editingAuthor, setEditingAuthor] = useState(false)
  const [titleDraft, setTitleDraft] = useState(book?.title || '')
  const [authorDraft, setAuthorDraft] = useState(book?.author || '')

  const handleTitleSave = () => {
    if (book && onTitleChange && titleDraft.trim() && titleDraft !== book.title) {
      onTitleChange(book.id, titleDraft.trim())
    }
    setEditingTitle(false)
  }

  const handleAuthorSave = () => {
    if (book && onAuthorChange) {
      onAuthorChange(book.id, authorDraft.trim())
    }
    setEditingAuthor(false)
  }

  return (
    <div className="mb-4">
      {/* Top row: back + title */}
      <div className="flex items-start gap-2">
        <button
          onClick={onBack}
          className="p-1.5 rounded-lg hover:bg-[var(--color-surface-tertiary)] mt-0.5 shrink-0"
        >
          <ArrowLeft size={20} className="text-[var(--color-text-secondary)]" />
        </button>

        <div className="flex-1 min-w-0">
          {isSingleBook && book ? (
            <>
              {/* Editable title */}
              {editingTitle ? (
                <input
                  autoFocus
                  value={titleDraft}
                  onChange={e => setTitleDraft(e.target.value)}
                  onBlur={handleTitleSave}
                  onKeyDown={e => { if (e.key === 'Enter') handleTitleSave(); if (e.key === 'Escape') setEditingTitle(false) }}
                  className="text-lg font-bold w-full bg-transparent border-b border-[var(--color-border-default)] text-[var(--color-text-primary)] focus:outline-none"
                />
              ) : (
                <h1
                  onClick={() => { setTitleDraft(book.title); setEditingTitle(true) }}
                  className="text-lg font-bold text-[var(--color-text-primary)] cursor-text hover:underline decoration-dotted"
                >
                  {book.title}
                </h1>
              )}

              {/* Editable author */}
              <div className="flex items-center gap-2 mt-0.5">
                {editingAuthor ? (
                  <input
                    autoFocus
                    value={authorDraft}
                    onChange={e => setAuthorDraft(e.target.value)}
                    onBlur={handleAuthorSave}
                    onKeyDown={e => { if (e.key === 'Enter') handleAuthorSave(); if (e.key === 'Escape') setEditingAuthor(false) }}
                    placeholder="Author"
                    className="text-sm bg-transparent border-b border-[var(--color-border-default)] text-[var(--color-text-secondary)] focus:outline-none"
                  />
                ) : (
                  <span
                    onClick={() => { setAuthorDraft(book.author || ''); setEditingAuthor(true) }}
                    className="text-sm text-[var(--color-text-secondary)] cursor-text hover:underline decoration-dotted"
                  >
                    {book.author || 'Add author'}
                  </span>
                )}

                {/* File type badge */}
                <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)]">
                  {book.file_type}
                </span>

                {/* Status badge */}
                {book.extraction_status === 'completed' && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[color-mix(in_srgb,var(--color-success)_15%,transparent)] text-[var(--color-success)]">
                    Extracted
                  </span>
                )}
              </div>

              {/* Multi-part navigation */}
              {siblingBooks && siblingBooks.length > 1 && book.part_number && (
                <div className="flex items-center gap-2 mt-2 text-xs text-[var(--color-text-tertiary)]">
                  <span>Part {book.part_number} of {book.part_count || siblingBooks.length}</span>
                  {book.part_number > 1 && (
                    <button
                      onClick={() => {
                        const prev = siblingBooks.find(s => s.part_number === (book.part_number! - 1))
                        if (prev && onNavigateToBook) onNavigateToBook(prev.id)
                      }}
                      className="text-[var(--color-accent)] hover:underline"
                    >
                      Previous
                    </button>
                  )}
                  {book.part_number < (book.part_count || siblingBooks.length) && (
                    <button
                      onClick={() => {
                        const next = siblingBooks.find(s => s.part_number === (book.part_number! + 1))
                        if (next && onNavigateToBook) onNavigateToBook(next.id)
                      }}
                      className="text-[var(--color-accent)] hover:underline"
                    >
                      Next
                    </button>
                  )}
                </div>
              )}

              {/* Book info collapsible + Refresh Key Points */}
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => setShowInfo(!showInfo)}
                  className="flex items-center gap-1 text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
                >
                  {showInfo ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                  Book Info
                </button>

                {onRefreshKeyPoints && (
                  <button
                    onClick={() => onRefreshKeyPoints(book.id)}
                    disabled={refreshingKeyPoints}
                    className="flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={refreshingKeyPoints ? 'animate-spin' : ''} />
                    Refresh Key Points
                  </button>
                )}
              </div>

              {showInfo && (
                <div className="mt-2 p-3 rounded-lg bg-[var(--color-surface-secondary)] text-sm space-y-2">
                  {book.ai_summary && (
                    <div>
                      <div className="text-xs font-medium text-[var(--color-text-tertiary)] mb-0.5">Summary</div>
                      <p className="text-[var(--color-text-secondary)] text-xs leading-relaxed">{book.ai_summary}</p>
                    </div>
                  )}
                  {book.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {book.tags.map(t => (
                        <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)]">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                  {book.genres.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {book.genres.map(g => (
                        <span key={g} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)]">
                          {g}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="text-xs text-[var(--color-text-tertiary)]">
                    Added {new Date(book.created_at).toLocaleDateString()}
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Multi-book header */
            <div>
              <h1 className="text-lg font-bold text-[var(--color-text-primary)]">
                {showHearted
                  ? 'Hearted Extractions'
                  : collectionName
                    ? collectionName
                    : `Extractions from ${books.length} books`
                }
              </h1>
              <p className="text-sm text-[var(--color-text-tertiary)] mt-0.5">
                {books.length} books
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
