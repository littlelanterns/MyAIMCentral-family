/**
 * Layer 5: ExtractionBrowser (PRD-23)
 * Unified extraction reading mode. Accepts bookIds[]. Single array → single-book mode.
 * Handles tabs, filters, abridged logic, item actions, sidebar, chapter jump.
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { ExtractionHeader } from './ExtractionHeader'
import { ExtractionControls, buildTabs } from './ExtractionControls'
import { ExtractionContent } from './ExtractionContent'
import { ExtractionSidebar } from './ExtractionSidebar'
import { ChapterJumpOverlay } from './ChapterJumpOverlay'
import { BookSelector } from './BookSelector'
import { CollectionChips } from './CollectionChips'
import { SemanticSearchPanel } from './SemanticSearchPanel'
import { BookDiscussionModal } from './BookDiscussionModal'
import { BookShelfHistoryPanel } from './BookShelfHistoryPanel'
import { useExtractionData } from '@/hooks/useExtractionData'
import { useBookDiscussions } from '@/hooks/useBookDiscussions'
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

  // Discussion state
  const {
    discussions, fetchDiscussions, deleteDiscussion,
  } = useBookDiscussions()
  const [showDiscussion, setShowDiscussion] = useState(false)
  const [showHistoryPanel, setShowHistoryPanel] = useState(false)
  const [discussionContinueId, setDiscussionContinueId] = useState<string | undefined>()
  const [searchInitialQuery, setSearchInitialQuery] = useState<string | undefined>()

  // Go Deeper state
  const [goingDeeper, setGoingDeeper] = useState(false)

  // Fetch discussions on mount
  useEffect(() => { fetchDiscussions() }, [fetchDiscussions])

  // Task creation modal
  const [taskModalOpen, setTaskModalOpen] = useState(false)
  const [showSemanticSearch, setShowSemanticSearch] = useState(false)
  const [taskDefaults, setTaskDefaults] = useState<{ title: string; description: string; taskType?: string; sourceTable?: ExtractionTable; sourceItemId?: string }>({ title: '', description: '' })

  const handleOpenTaskCreation = useCallback((title: string, description: string, taskType?: string) => {
    setTaskDefaults({
      title, description, taskType,
      sourceTable: itemActions.applyThisItemId ? undefined : undefined,
      sourceItemId: itemActions.applyThisItemId || undefined,
    })
    setTaskModalOpen(true)
  }, [itemActions.applyThisItemId])

  const handleTaskSave = useCallback(async (_task: CreateTaskData) => {
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

  // Book title map for history panel
  const bookTitleMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const b of allBooks) map[b.id] = b.title
    return map
  }, [allBooks])

  // Go Deeper handler
  const handleGoDeeper = useCallback(async (bookId: string, tab: string, sectionTitle?: string) => {
    if (!member) return
    setGoingDeeper(true)
    try {
      // Get existing items for the tab to prevent duplicates
      const tabItems: { text?: string; declaration_text?: string }[] =
        tab === 'summaries' ? summaries.filter(s => s.bookshelf_item_id === bookId) :
        tab === 'insights' ? insights.filter(s => s.bookshelf_item_id === bookId) :
        tab === 'declarations' ? declarations.filter(s => s.bookshelf_item_id === bookId) :
        tab === 'action_steps' ? actionSteps.filter(s => s.bookshelf_item_id === bookId) :
        questions.filter(s => s.bookshelf_item_id === bookId)

      const existingTexts = tabItems
        .filter(i => !sectionTitle || (i as { section_title?: string | null }).section_title === sectionTitle)
        .map(i => ('declaration_text' in i ? (i as { declaration_text: string }).declaration_text : (i as { text?: string }).text) || '')

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bookshelf-extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await import('@/lib/supabase/client')).supabase.auth.getSession().then(s => s.data.session?.access_token)}`,
        },
        body: JSON.stringify({
          bookshelf_item_id: bookId,
          extraction_type: tab,
          go_deeper: true,
          existing_items: existingTexts,
          section_title: sectionTitle,
          family_id: member.family_id,
          member_id: member.id,
        }),
      })
      if (resp.ok) await refetch()
    } finally {
      setGoingDeeper(false)
    }
  }, [member, summaries, insights, declarations, actionSteps, questions, refetch])

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
        onOpenSemanticSearch={() => setShowSemanticSearch(true)}
        onOpenDiscussion={() => {
          setDiscussionContinueId(undefined)
          setShowDiscussion(true)
        }}
        onOpenHistory={() => setShowHistoryPanel(v => !v)}
        historyOpen={showHistoryPanel}
        onGoDeeper={(bid, tab, section) => handleGoDeeper(bid, tab, section)}
        goingDeeper={goingDeeper}
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

      {/* Semantic Search */}
      <SemanticSearchPanel
        isOpen={showSemanticSearch}
        onClose={() => { setShowSemanticSearch(false); setSearchInitialQuery(undefined) }}
        onNavigateToResult={(bid, tab) => {
          setShowSemanticSearch(false)
          navigate(`/bookshelf?book=${bid}${tab ? `&tab=${tab}` : ''}`)
        }}
        bookIds={resolvedBookIds}
        initialQuery={searchInitialQuery}
      />

      {/* History Panel */}
      {showHistoryPanel && (
        <div className="relative">
          <BookShelfHistoryPanel
            isOpen={showHistoryPanel}
            onClose={() => setShowHistoryPanel(false)}
            discussions={discussions}
            bookTitleMap={bookTitleMap}
            onRerunSearch={(query, _mode) => {
              setShowHistoryPanel(false)
              setSearchInitialQuery(query)
              setShowSemanticSearch(true)
            }}
            onContinueDiscussion={disc => {
              setShowHistoryPanel(false)
              setDiscussionContinueId(disc.id)
              setShowDiscussion(true)
            }}
            onDeleteDiscussion={deleteDiscussion}
          />
        </div>
      )}

      {/* Book Discussion Modal */}
      <BookDiscussionModal
        isOpen={showDiscussion}
        onClose={() => { setShowDiscussion(false); setDiscussionContinueId(undefined); fetchDiscussions() }}
        bookTitles={books.map(b => b.title)}
        bookshelfItemIds={activeBookIds}
        existingDiscussionId={discussionContinueId}
        bookTitleMap={bookTitleMap}
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
