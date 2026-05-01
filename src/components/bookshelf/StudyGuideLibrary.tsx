/**
 * StudyGuideLibrary (PRD-23 — Reworked)
 * Shows all extracted books with a "generate or view" interface.
 * No per-child scoping — study guides are family-wide.
 * Books with guided_text/independent_text populated show "View" buttons.
 * Books without show a "Generate Study Guide" button.
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, GraduationCap, BookOpen, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useBookShelf } from '@/hooks/useBookShelf'
import { StudyGuideModal } from './StudyGuideModal'

interface StudyGuideLibraryProps {
  onBack: () => void
}

interface StudyGuideBookStatus {
  bookshelfItemId: string
  title: string
  author: string | null
  hasYouthText: boolean
  youthItemCount: number
}

export function StudyGuideLibrary({ onBack }: StudyGuideLibraryProps) {
  const navigate = useNavigate()
  const { data: member } = useFamilyMember()
  const { parentBooks } = useBookShelf()
  const [bookStatuses, setBookStatuses] = useState<StudyGuideBookStatus[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [generateBookId, setGenerateBookId] = useState<string | null>(null)

  const extractedBooks = useMemo(
    () => parentBooks.filter(b => b.extraction_status === 'completed'),
    [parentBooks],
  )

  const fetchYouthTextStatus = useCallback(async () => {
    if (!member?.family_id || extractedBooks.length === 0) {
      setLoading(false)
      return
    }

    const libraryIds = extractedBooks
      .map(b => b.book_library_id)
      .filter((id): id is string => !!id)

    if (libraryIds.length === 0) { setLoading(false); return }
    setFetchError(null)

    try {
      const { data, error } = await supabase
        .rpc('count_extractions_by_audience', {
          p_book_library_ids: libraryIds,
          p_audience: 'original',
        })

      if (error) throw error

      // Build a map of book_library_id → total count for reference
      const totalMap = new Map<string, number>()
      for (const row of (data || []) as Array<{ book_library_id: string; item_count: number }>) {
        totalMap.set(row.book_library_id, row.item_count)
      }

      // Check which books have guided_text populated
      // Use a lightweight query: for each book, check if at least one extraction has guided_text
      const { data: youthData, error: youthErr } = await supabase
        .rpc('count_youth_text_by_book', {
          p_book_library_ids: libraryIds,
        })

      const youthMap = new Map<string, number>()
      if (!youthErr && youthData) {
        for (const row of youthData as Array<{ book_library_id: string; item_count: number }>) {
          youthMap.set(row.book_library_id, row.item_count)
        }
      }

      const statuses: StudyGuideBookStatus[] = extractedBooks.map(book => {
        const youthCount = book.book_library_id ? (youthMap.get(book.book_library_id) || 0) : 0
        return {
          bookshelfItemId: book.id,
          title: book.title,
          author: book.author,
          hasYouthText: youthCount > 0,
          youthItemCount: youthCount,
        }
      })

      setBookStatuses(statuses)
    } catch {
      setFetchError("Couldn't load study guide status")
    } finally {
      setLoading(false)
    }
  }, [member?.family_id, extractedBooks])

  useEffect(() => {
    setLoading(true)
    fetchYouthTextStatus()
  }, [fetchYouthTextStatus])

  const booksWithGuides = useMemo(() => bookStatuses.filter(b => b.hasYouthText), [bookStatuses])
  const booksWithoutGuides = useMemo(() => bookStatuses.filter(b => !b.hasYouthText), [bookStatuses])

  const generateBookTitle = generateBookId
    ? extractedBooks.find(b => b.id === generateBookId)?.title || ''
    : ''

  return (
    <div className="density-comfortable p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={onBack} className="p-1 rounded hover:bg-[var(--color-surface-tertiary)]">
          <ArrowLeft size={20} className="text-[var(--color-text-secondary)]" />
        </button>
        <GraduationCap size={24} className="text-[var(--color-accent)]" />
        <h1 className="text-xl font-bold text-[var(--color-text-primary)]">
          Study Guides
        </h1>
      </div>

      <p className="text-sm text-[var(--color-text-secondary)] mb-6">
        Study guides create Teen and Kid reading levels from your books.
        Toggle between Adult, Teen, and Kid versions when browsing any book.
      </p>

      {fetchError ? (
        <div className="text-center py-16">
          <GraduationCap size={48} className="mx-auto mb-3 text-[var(--color-text-tertiary)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">{fetchError}</p>
          <button
            onClick={() => { setLoading(true); setFetchError(null); fetchYouthTextStatus() }}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-lg border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]"
          >
            <RefreshCw size={14} />
            Tap to retry
          </button>
        </div>
      ) : loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-[var(--color-accent)]" />
        </div>
      ) : extractedBooks.length === 0 ? (
        <div className="text-center py-16">
          <GraduationCap size={48} className="mx-auto mb-3 text-[var(--color-text-tertiary)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">No extracted books yet</p>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
            Upload a book and extract it first — study guides are generated from the extracted content.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Books with study guides ready */}
          {booksWithGuides.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">
                Ready to View
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {booksWithGuides.map(book => (
                  <div
                    key={book.bookshelfItemId}
                    className="p-4 rounded-lg border border-[var(--color-border-default)] hover:bg-[var(--color-surface-secondary)] transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <BookOpen size={20} className="text-[var(--color-accent)] mt-0.5 shrink-0" />
                      <div className="min-w-0 flex-1">
                        <div className="font-medium text-sm text-[var(--color-text-primary)] truncate">
                          {book.title}
                        </div>
                        {book.author && (
                          <div className="text-xs text-[var(--color-text-tertiary)] truncate">
                            {book.author}
                          </div>
                        )}
                        <div className="text-xs text-[var(--color-accent)] mt-1">
                          {book.youthItemCount} items adapted
                        </div>
                        <div className="flex gap-2 mt-2">
                          <button
                            onClick={() => navigate(`/bookshelf?book=${book.bookshelfItemId}&audience=independent`)}
                            className="px-2.5 py-1 text-xs rounded-md border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]"
                          >
                            View Teen
                          </button>
                          <button
                            onClick={() => navigate(`/bookshelf?book=${book.bookshelfItemId}&audience=guided`)}
                            className="px-2.5 py-1 text-xs rounded-md border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]"
                          >
                            View Kid
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Books needing study guide generation */}
          {booksWithoutGuides.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">
                Generate Study Guide
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {booksWithoutGuides.map(book => (
                  <button
                    key={book.bookshelfItemId}
                    onClick={() => { setGenerateBookId(book.bookshelfItemId); setShowGenerateModal(true) }}
                    className="text-left p-4 rounded-lg border border-dashed border-[var(--color-border-default)] hover:bg-[var(--color-surface-secondary)] transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <Sparkles size={20} className="text-[var(--color-text-tertiary)] mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-[var(--color-text-primary)] truncate">
                          {book.title}
                        </div>
                        {book.author && (
                          <div className="text-xs text-[var(--color-text-tertiary)] truncate">
                            {book.author}
                          </div>
                        )}
                        <div className="text-xs text-[var(--color-accent)] mt-1">
                          Generate Teen + Kid versions
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Study Guide Modal */}
      {generateBookId && (
        <StudyGuideModal
          isOpen={showGenerateModal}
          onClose={() => { setShowGenerateModal(false); setGenerateBookId(null) }}
          bookshelfItemId={generateBookId}
          bookTitle={generateBookTitle}
          onComplete={() => {
            setShowGenerateModal(false)
            setGenerateBookId(null)
            fetchYouthTextStatus()
          }}
          onNavigateToGuide={(bookItemId, audience) => {
            setShowGenerateModal(false)
            setGenerateBookId(null)
            navigate(`/bookshelf?book=${bookItemId}&audience=${audience}`)
          }}
        />
      )}
    </div>
  )
}
