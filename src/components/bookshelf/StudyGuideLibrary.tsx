/**
 * StudyGuideLibrary (PRD-23)
 * Shows books that have study guides for the current member.
 * Entry point from Guided/Independent "Study Guides" nav item.
 * View As aware: when mom views as a child, shows that child's study guides.
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, GraduationCap, BookOpen, Loader2, RefreshCw } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useViewAs } from '@/lib/permissions'
import { useBookShelf } from '@/hooks/useBookShelf'
import { StudyGuideModal } from './StudyGuideModal'

interface StudyGuideLibraryProps {
  onBack: () => void
}

interface StudyGuideBook {
  bookshelfItemId: string
  title: string
  author: string | null
  itemCount: number
}

export function StudyGuideLibrary({ onBack }: StudyGuideLibraryProps) {
  const navigate = useNavigate()
  const { data: member } = useFamilyMember()
  const { isViewingAs, viewingAsMember } = useViewAs()
  const { parentBooks } = useBookShelf()
  const [studyGuideBooks, setStudyGuideBooks] = useState<StudyGuideBook[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [showGenerateModal, setShowGenerateModal] = useState(false)
  const [generateBookId, setGenerateBookId] = useState<string | null>(null)

  const effectiveMember = isViewingAs && viewingAsMember ? viewingAsMember : member
  const audienceKey = effectiveMember ? `study_guide_${effectiveMember.id}` : null

  const fetchStudyGuides = useCallback(async () => {
    if (!effectiveMember?.family_id || !audienceKey) return

    const libraryIds = parentBooks
      .map(b => b.book_library_id)
      .filter((id): id is string => !!id)

    if (libraryIds.length === 0) { setLoading(false); return }

    setFetchError(null)

    try {
      const { data, error } = await supabase
        .rpc('count_extractions_by_audience', {
          p_book_library_ids: libraryIds,
          p_audience: audienceKey,
        })

      if (error) throw error
      if (!data) { setLoading(false); return }

      const books: StudyGuideBook[] = []
      for (const row of data as Array<{ book_library_id: string; item_count: number }>) {
        const book = parentBooks.find(b => b.book_library_id === row.book_library_id)
        if (book) {
          books.push({
            bookshelfItemId: book.id,
            title: book.title,
            author: book.author,
            itemCount: row.item_count,
          })
        }
      }
      setStudyGuideBooks(books)
    } catch {
      setFetchError("Couldn't load study guides")
    } finally {
      setLoading(false)
    }
  }, [effectiveMember?.family_id, audienceKey, parentBooks])

  useEffect(() => {
    setLoading(true)
    fetchStudyGuides()
  }, [fetchStudyGuides])

  // Books available for new study guides (extracted but no study guide yet)
  const availableForGeneration = useMemo(() => {
    const hasGuide = new Set(studyGuideBooks.map(b => b.bookshelfItemId))
    return parentBooks.filter(b =>
      b.extraction_status === 'completed' && !hasGuide.has(b.id)
    )
  }, [parentBooks, studyGuideBooks])

  const generateBookTitle = generateBookId
    ? parentBooks.find(b => b.id === generateBookId)?.title || ''
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
          My Study Guides
        </h1>
      </div>

      {fetchError ? (
        <div className="text-center py-16">
          <GraduationCap size={48} className="mx-auto mb-3 text-[var(--color-text-tertiary)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">{fetchError}</p>
          <button
            onClick={() => { setLoading(true); setFetchError(null); fetchStudyGuides() }}
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
      ) : studyGuideBooks.length === 0 && availableForGeneration.length === 0 ? (
        <div className="text-center py-16">
          <GraduationCap size={48} className="mx-auto mb-3 text-[var(--color-text-tertiary)]" />
          <p className="text-sm text-[var(--color-text-secondary)]">No study guides yet</p>
          <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
            Ask mom to generate a study guide from a book in the library
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Existing study guides */}
          {studyGuideBooks.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">
                Your Study Guides
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {studyGuideBooks.map(book => (
                  <button
                    key={book.bookshelfItemId}
                    onClick={() => navigate(`/bookshelf?book=${book.bookshelfItemId}&audience=${audienceKey}`)}
                    className="text-left p-4 rounded-lg border border-[var(--color-border-default)] hover:bg-[var(--color-surface-secondary)] transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <BookOpen size={20} className="text-[var(--color-accent)] mt-0.5 shrink-0" />
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
                          {book.itemCount} items
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Available for generation */}
          {availableForGeneration.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">
                Generate from Library
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {availableForGeneration.map(book => (
                  <button
                    key={book.id}
                    onClick={() => { setGenerateBookId(book.id); setShowGenerateModal(true) }}
                    className="text-left p-4 rounded-lg border border-dashed border-[var(--color-border-default)] hover:bg-[var(--color-surface-secondary)] transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <GraduationCap size={20} className="text-[var(--color-text-tertiary)] mt-0.5 shrink-0" />
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
                          Generate study guide
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
          viewAsTargetId={isViewingAs && viewingAsMember ? viewingAsMember.id : undefined}
          onComplete={() => {
            fetchStudyGuides()
          }}
          onNavigateToGuide={(bookItemId, audKey) => {
            setShowGenerateModal(false)
            setGenerateBookId(null)
            navigate(`/bookshelf?book=${bookItemId}&audience=${audKey}`)
          }}
        />
      )}
    </div>
  )
}
