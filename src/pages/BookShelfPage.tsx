/**
 * BookShelfPage (PRD-23)
 * Shell that routes between Library mode and Reading mode based on URL params.
 * Session B: Reading mode renders ExtractionBrowser.
 */
import { useSearchParams, useNavigate } from 'react-router-dom'
import { PermissionGate } from '@/lib/permissions'
import { BookShelfLibrary } from '@/components/bookshelf/BookShelfLibrary'
import { ExtractionBrowser } from '@/components/bookshelf/ExtractionBrowser'

export function BookShelfPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const bookId = searchParams.get('book')
  const bookIds = searchParams.get('books')?.split(',').filter(Boolean)
  const collectionId = searchParams.get('collection')
  const showHearted = searchParams.get('hearted') === 'true'

  const isReadingMode = !!(bookId || (bookIds && bookIds.length > 0) || collectionId || showHearted)

  return (
    <PermissionGate featureKey="bookshelf_basic">
      {isReadingMode ? (
        <ExtractionBrowser
          bookId={bookId}
          bookIds={bookIds}
          collectionId={collectionId}
          showHearted={showHearted}
          onBack={() => navigate('/bookshelf')}
        />
      ) : (
        <BookShelfLibrary />
      )}
    </PermissionGate>
  )
}
