/**
 * Layer 5: ExtractionBrowser (PRD-23)
 * Unified extraction reading mode. Accepts bookIds[]. Single array → single-book mode.
 * Handles tabs, filters, abridged logic, item actions, sidebar, chapter jump.
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { ExtractionHeader } from './ExtractionHeader'
import { ExtractionControls, buildTabs } from './ExtractionControls'
import { ExtractionContent } from './ExtractionContent'
import { ExtractionSidebar } from './ExtractionSidebar'
import { ChapterJumpOverlay } from './ChapterJumpOverlay'
import { BookSelector } from './BookSelector'
import { CollectionChips } from './CollectionChips'
import { useExtractionData } from '@/hooks/useExtractionData'
import { useExtractionBrowser } from '@/hooks/useExtractionBrowser'
import { useExtractionItemActions } from '@/hooks/useExtractionItemActions'
import { useBookShelf } from '@/hooks/useBookShelf'
import { useBookShelfCollections } from '@/hooks/useBookShelfCollections'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { TaskCreationModal } from '@/components/tasks/TaskCreationModal'
import type { ExtractionTab, BaseExtractionItem } from '@/types/bookshelf'
import type { CreateTaskData } from '@/components/tasks/TaskCreationModal'
import type { ExtractionTable } from '@/lib/extractionActions'

interface ExtractionBrowserProps {
  bookId?: string | null
  bookIds?: string[]
  collectionId?: string | null
  showHearted?: boolean
  onBack: () => void
}

export function ExtractionBrowser({
  bookId, bookIds: propBookIds, collectionId, showHearted, onBack,
}: ExtractionBrowserProps) {
  const navigate = useNavigate()
  const [, setSearchParams] = useSearchParams()
  const { data: member } = useFamilyMember()
  const { books: allBooks, updateBookTitle, updateBookAuthor, updateLastViewedAt } = useBookShelf()
  const { getBookIdsForCollection, collections } = useBookShelfCollections()

  // Resolve book IDs from props
  const resolvedBookIds = useMemo(() => {
    if (bookId) return [bookId]
    if (propBookIds && propBookIds.length > 0) return propBookIds
    if (collectionId) return getBookIdsForCollection(collectionId)
    if (showHearted) {
      // All books — will be filtered by hearted items in content
      return allBooks.map(b => b.id)
    }
    return []
  }, [bookId, propBookIds, collectionId, showHearted, allBooks, getBookIdsForCollection])

  // Multi-book selector state
  const [selectedBookIds, setSelectedBookIds] = useState<Set<string>>(new Set(resolvedBookIds))
  useEffect(() => {
    setSelectedBookIds(new Set(resolvedBookIds))
  }, [resolvedBookIds.join(',')])

  const activeBookIds = useMemo(
    () => resolvedBookIds.filter(id => selectedBookIds.has(id)),
    [resolvedBookIds, selectedBookIds]
  )

  // Fetch data
  const {
    summaries, insights, declarations, actionSteps, questions,
    chapters, books, loading, error, refetch,
  } = useExtractionData(activeBookIds)

  // Browser state (tabs, filters, etc.)
  const browserState = useExtractionBrowser()

  // Update last_viewed_at for single book
  useEffect(() => {
    if (bookId) updateLastViewedAt(bookId)
  }, [bookId])

  // Save to sessionStorage for "Continue Where You Left Off"
  useEffect(() => {
    if (books.length === 1) {
      try {
        sessionStorage.setItem('bookshelf-last-book-id', books[0].id)
        sessionStorage.setItem('bookshelf-last-book-title', books[0].title)
      } catch { /* */ }
    }
  }, [books])

  // Item actions
  const itemActions = useExtractionItemActions(
    member?.family_id || '',
    member?.id || '',
    { onItemUpdated: refetch }
  )

  // Task creation modal
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [taskDefaults, setTaskDefaults] = useState<{ title: string; description: string; taskType?: string; sourceTable?: ExtractionTable; sourceItemId?: string }>({ title: '', description: '' })

  const handleOpenTaskCreation = useCallback((title: string, description: string, taskType?: string) => {
    setTaskDefaults({
      title, description, taskType,
      sourceTable: itemActions.applyThisItemId ? undefined : undefined,
      sourceItemId: itemActions.applyThisItemId || undefined,
    })
    setTaskModalOpen(true)
  }, [itemActions.applyThisItemId])

  const handleTaskSave = useCallback(async (task: CreateTaskData) => {
    // The parent page handles actual task saving. Here we just track the source.
    if (taskDefaults.sourceItemId && taskDefaults.sourceTable) {
      // This would be handled by the task save callback
    }
    setTaskModalOpen(false)
  }, [taskDefaults])

  // Filter counts for tabs (respecting current filter + search)
  const filterForCounts = useCallback((items: { is_hearted: boolean; user_note?: string | null; text?: string; declaration_text?: string }[], tab: ExtractionTab) => {
    let filtered = items
    if (browserState.filterMode === 'hearted') filtered = filtered.filter(i => i.is_hearted)
    if (browserState.searchQuery) {
      const q = browserState.searchQuery.toLowerCase()
      filtered = filtered.filter(i => {
        const text = tab === 'declarations' ? (i as { declaration_text?: string }).declaration_text : (i as { text?: string }).text
        return (text || '').toLowerCase().includes(q) || (i.user_note || '').toLowerCase().includes(q)
      })
    }
    return filtered
  }, [browserState.filterMode, browserState.searchQuery])

  const tabs = useMemo(() => buildTabs(
    filterForCounts(summaries, 'summaries').length,
    filterForCounts(insights, 'insights').length,
    filterForCounts(declarations, 'declarations').length,
    filterForCounts(actionSteps, 'action_steps').length,
    filterForCounts(questions, 'questions').length,
  ), [summaries, insights, declarations, actionSteps, questions, filterForCounts])

  // Collection info
  const collectionName = collectionId
    ? collections.find(c => c.id === collectionId)?.name
    : undefined

  // Multi-part siblings
  const siblingBooks = useMemo(() => {
    if (books.length !== 1 || !books[0].parent_bookshelf_item_id) return undefined
    return allBooks
      .filter(b => b.parent_bookshelf_item_id === books[0].parent_bookshelf_item_id)
      .sort((a, b) => (a.part_number || 0) - (b.part_number || 0))
  }, [books, allBooks])

  const isSingleBook = books.length === 1

  // Key points refresh
  const [refreshingKeyPoints, setRefreshingKeyPoints] = useState(false)
  const handleRefreshKeyPoints = useCallback(async (bid: string) => {
    setRefreshingKeyPoints(true)
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bookshelf-key-points`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await import('@/lib/supabase/client')).supabase.auth.getSession().then(s => s.data.session?.access_token)}`,
        },
        body: JSON.stringify({ bookshelf_item_id: bid, member_id: member?.id }),
      })
      if (resp.ok) await refetch()
    } finally {
      setRefreshingKeyPoints(false)
    }
  }, [member?.id, refetch])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 size={32} className="animate-spin text-[var(--color-accent)]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-sm text-[var(--color-error)]">{error}</p>
        <button onClick={refetch} className="mt-2 text-sm text-[var(--color-accent)] hover:underline">
          Try again
        </button>
      </div>
    )
  }

  return (
    <div className="density-comfortable">
      <ExtractionHeader
        books={books}
        collectionName={collectionName}
        showHearted={!!showHearted}
        onBack={onBack}
        onTitleChange={(bid, title) => updateBookTitle(bid, title)}
        onAuthorChange={(bid, author) => updateBookAuthor(bid, author)}
        onRefreshKeyPoints={handleRefreshKeyPoints}
        refreshingKeyPoints={refreshingKeyPoints}
        siblingBooks={siblingBooks}
        onNavigateToBook={bid => navigate(`/bookshelf?book=${bid}`)}
      />

      {collectionId && (
        <CollectionChips
          activeCollectionId={collectionId}
          onCollectionChange={id => navigate(`/bookshelf?collection=${id}`)}
        />
      )}

      {resolvedBookIds.length > 1 && (
        <BookSelector
          books={allBooks.filter(b => resolvedBookIds.includes(b.id))}
          selectedBookIds={selectedBookIds}
          onToggle={id => {
            setSelectedBookIds(prev => {
              const next = new Set(prev)
              if (next.has(id)) next.delete(id)
              else next.add(id)
              return next
            })
          }}
        />
      )}

      <ExtractionControls
        activeTab={browserState.activeTab}
        onTabChange={browserState.setActiveTab}
        filterMode={browserState.filterMode}
        onFilterModeChange={browserState.setFilterMode}
        viewMode={browserState.viewMode}
        onViewModeChange={browserState.setViewMode}
        abridged={browserState.abridged}
        onAbridgedChange={browserState.setAbridged}
        searchQuery={browserState.searchQuery}
        onSearchChange={browserState.setSearchQuery}
        tabs={tabs}
        isSingleBook={isSingleBook}
      />

      <div className="flex gap-6">
        <ExtractionSidebar
          chapters={chapters}
          books={books}
          isSingleBook={isSingleBook}
          allItems={browserState.viewMode === 'tabs'
            ? ({
                summaries, insights,
                declarations: declarations as unknown as BaseExtractionItem[],
                action_steps: actionSteps,
                questions,
              }[browserState.activeTab] || summaries) as BaseExtractionItem[]
            : [...summaries, ...insights, ...declarations as unknown as BaseExtractionItem[], ...actionSteps, ...questions]
          }
          viewMode={browserState.viewMode}
          activeTab={browserState.activeTab}
        />

        <div className="flex-1 min-w-0">
          <ExtractionContent
            viewMode={browserState.viewMode}
            activeTab={browserState.activeTab}
            filterMode={browserState.filterMode}
            abridged={browserState.abridged}
            searchQuery={browserState.searchQuery}
            expandedAbridgedSections={browserState.expandedAbridgedSections}
            collapsedSections={browserState.collapsedSections}
            onToggleExpand={browserState.toggleSectionExpand}
            onToggleCollapse={browserState.toggleSectionCollapse}
            summaries={summaries}
            insights={insights}
            declarations={declarations}
            actionSteps={actionSteps}
            questions={questions}
            chapters={chapters}
            books={books.map(b => ({ id: b.id, title: b.title }))}
            deletingItemIds={itemActions.deletingItemIds}
            notingItemId={itemActions.notingItemId}
            applyThisItemId={itemActions.applyThisItemId}
            onHeart={itemActions.handleHeart}
            onNoteToggle={itemActions.setNotingItemId}
            onNoteSave={itemActions.handleNoteSave}
            onDelete={itemActions.handleDelete}
            onApplyThisToggle={itemActions.setApplyThisItemId}
            onOpenTaskCreation={handleOpenTaskCreation}
            onSendToGuidingStars={itemActions.handleSendToGuidingStars}
            onSendToBestIntentions={itemActions.handleSendToBestIntentions}
            onSendToJournalPrompts={itemActions.handleSendToJournalPrompts}
          />
        </div>
      </div>

      <ChapterJumpOverlay
        chapters={chapters}
        bookTitle={isSingleBook ? books[0]?.title : undefined}
        allItems={[...summaries, ...insights, ...declarations, ...actionSteps, ...questions]}
        viewMode={browserState.viewMode}
        activeTab={browserState.activeTab}
      />

      {/* Task Creation Modal */}
      <TaskCreationModal
        isOpen={taskModalOpen}
        onClose={() => setTaskModalOpen(false)}
        onSave={handleTaskSave}
        mode="full"
        defaultTitle={taskDefaults.title}
        defaultDescription={taskDefaults.description}
        initialTaskType={taskDefaults.taskType}
        sourceReferenceId={taskDefaults.sourceItemId}
      />
    </div>
  )
}
