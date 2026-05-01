/**
 * BookShelfPage (PRD-23)
 * Shell that routes between Library mode and Reading mode based on URL params.
 * Supports: single book, multi-book, collection, hearted, study guides.
 */
import { useSearchParams, useNavigate } from 'react-router-dom'
import { PermissionGate } from '@/lib/permissions'
import { BookShelfLibrary } from '@/components/bookshelf/BookShelfLibrary'
import { ExtractionBrowser } from '@/components/bookshelf/ExtractionBrowser'
import { StudyGuideLibrary } from '@/components/bookshelf/StudyGuideLibrary'

export function BookShelfPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const bookId = searchParams.get('book')
  const bookLibraryId = searchParams.get('book_library')
  const bookIds = searchParams.get('books')?.split(',').filter(Boolean)
  const collectionId = searchParams.get('collection')
  const showHearted = searchParams.get('hearted') === 'true'
  const showStudyGuides = searchParams.get('study_guides') === 'true'
  const audience = searchParams.get('audience')

  const isReadingMode = !!(bookId || bookLibraryId || (bookIds && bookIds.length > 0) || collectionId || showHearted || audience)

  return (
    <PermissionGate featureKey="bookshelf_basic">
      {showStudyGuides ? (
        <StudyGuideLibrary onBack={() => navigate('/bookshelf')} />
      ) : isReadingMode ? (
        <ExtractionBrowser
          bookId={bookId}
          bookLibraryId={bookLibraryId}
          bookIds={bookIds}
          collectionId={collectionId}
          showHearted={showHearted}
          audience={audience || undefined}
          onBack={() => navigate('/bookshelf')}
        />
      ) : (
        <BookShelfLibrary />
      )}
    </PermissionGate>
  )
}
