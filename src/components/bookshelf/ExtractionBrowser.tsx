/**
 * Layer 5: ExtractionBrowser (PRD-23)
 * Unified extraction reading mode. Accepts bookIds[]. Single array → single-book mode.
 * Handles tabs, filters, abridged logic, item actions, sidebar, chapter jump.
 */
import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Loader2, Sparkles } from 'lucide-react'
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
import { StudyGuideModal } from './StudyGuideModal'
import { useExtractionData } from '@/hooks/useExtractionData'
import { useBookDiscussions } from '@/hooks/useBookDiscussions'
import { useExtractionBrowser } from '@/hooks/useExtractionBrowser'
import { useExtractionItemActions } from '@/hooks/useExtractionItemActions'
import { useBookShelf } from '@/hooks/useBookShelf'
import { useBookShelfCollections } from '@/hooks/useBookShelfCollections'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { TaskCreationModal } from '@/components/tasks/TaskCreationModal'
import type { ExtractionTab, BookExtraction } from '@/types/bookshelf'
import type { CreateTaskData } from '@/components/tasks/TaskCreationModal'
import type { ExtractionType } from '@/types/bookshelf'

interface ExtractionBrowserProps {
  bookId?: string | null
  bookIds?: string[]
  collectionId?: string | null
  showHearted?: boolean
  /** Filter extractions to a specific audience (e.g. 'study_guide_{memberId}') */
  audience?: string
  onBack: () => void
}

export function ExtractionBrowser({
  bookId, bookIds: propBookIds, collectionId, showHearted, audience, onBack,
}: ExtractionBrowserProps) {
  const navigate = useNavigate()
  const { data: member } = useFamilyMember()
  const { books: allBooks, updateBookTitle, updateBookAuthor, updateBookFolder, updateBookGenres, updateBookTags, updateLastViewedAt } = useBookShelf()
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
  } = useExtractionData(activeBookIds, audience)

  // Browser state (tabs, filters, etc.)
  const browserState = useExtractionBrowser()

  // Force hearted filter when in hearted aggregation mode
  useEffect(() => {
    if (showHearted && browserState.filterMode !== 'hearted') {
      browserState.setFilterMode('hearted')
    }
  }, [showHearted]) // eslint-disable-line react-hooks/exhaustive-deps

  // For display: when viewing a parent, treat it as a single-book view with the parent's info
  const primaryBook = useMemo(() => {
    if (books.length === 0) return undefined
    return books.find(b => !b.parent_bookshelf_item_id) || books[0]
  }, [books])

  // Update last_viewed_at for single book
  useEffect(() => {
    if (bookId) updateLastViewedAt(bookId)
  }, [bookId])

  // Load archive folders for folder picker
  const [archiveFolders, setArchiveFolders] = useState<Array<{ id: string; folder_name: string }>>([])
  useEffect(() => {
    if (!member?.family_id) return
    import('@/lib/supabase/client').then(({ supabase }) => {
      supabase
        .from('archive_folders')
        .select('id, folder_name')
        .eq('family_id', member.family_id)
        .order('folder_name')
        .then(({ data }) => {
          if (data) setArchiveFolders(data as Array<{ id: string; folder_name: string }>)
        })
    })
  }, [member?.family_id])

  // Save to sessionStorage for "Continue Where You Left Off" — scoped by member ID
  useEffect(() => {
    if (primaryBook && member?.id) {
      try {
        const prefix = `bookshelf-${member.id}-`
        sessionStorage.setItem(`${prefix}last-book-id`, primaryBook.id)
        sessionStorage.setItem(`${prefix}last-book-title`, primaryBook.title)
      } catch { /* */ }
    }
  }, [primaryBook, member?.id])

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
  const [showStudyGuide, setShowStudyGuide] = useState(false)
  const [taskDefaults, setTaskDefaults] = useState<{ title: string; description: string; taskType?: string; sourceType?: ExtractionType; sourceItemId?: string }>({ title: '', description: '' })

  const handleOpenTaskCreation = useCallback((title: string, description: string, taskType?: string) => {
    setTaskDefaults({
      title, description, taskType,
      sourceType: itemActions.applyThisItemId ? undefined : undefined,
      sourceItemId: itemActions.applyThisItemId || undefined,
    })
    setTaskModalOpen(true)
  }, [itemActions.applyThisItemId])

  const handleTaskSave = useCallback(async (_task: CreateTaskData) => {
    // The parent page handles actual task saving. Here we just track the source.
    if (taskDefaults.sourceItemId && taskDefaults.sourceType) {
      // This would be handled by the task save callback
    }
    setTaskModalOpen(false)
  }, [taskDefaults])

  // Filter counts for tabs (respecting current filter + search)
  const filterForCounts = useCallback((items: BookExtraction[], tab: ExtractionTab) => {
    let filtered = items
    if (browserState.filterMode === 'hearted') filtered = filtered.filter(i => i.is_hearted)
    if (browserState.searchQuery) {
      const q = browserState.searchQuery.toLowerCase()
      filtered = filtered.filter(i => {
        const text = tab === 'declarations' ? i.declaration_text : i.text
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

  // Multi-part siblings — works for both parent view and child part view
  const siblingBooks = useMemo(() => {
    if (books.length === 0) return undefined
    // Case 1: Viewing a child part — show all siblings (parts with same parent)
    if (books.length === 1 && books[0].parent_bookshelf_item_id) {
      return allBooks
        .filter(b => b.parent_bookshelf_item_id === books[0].parent_bookshelf_item_id)
        .sort((a, b) => (a.part_number || 0) - (b.part_number || 0))
    }
    // Case 2: Viewing a parent — books array includes parent + children from useExtractionData
    const parentBook = books.find(b => !b.parent_bookshelf_item_id)
    if (parentBook) {
      const children = books.filter(b => b.parent_bookshelf_item_id === parentBook.id)
      if (children.length > 0) {
        return children.sort((a, b) => (a.part_number || 0) - (b.part_number || 0))
      }
    }
    return undefined
  }, [books, allBooks])

  const isSingleBook = books.length === 1 || (books.length > 1 && books.some(b => !b.parent_bookshelf_item_id))

  // Book title map for history panel
  const bookTitleMap = useMemo(() => {
    const map: Record<string, string> = {}
    for (const b of allBooks) map[b.id] = b.title
    return map
  }, [allBooks])

  // Read discovered_sections from the book (if previously saved) — needed by Go Deeper + Continue Extraction
  const discoveredSections = useMemo(() => {
    if (!primaryBook) return null
    const ds = (primaryBook as { discovered_sections?: unknown }).discovered_sections
    if (!ds || !Array.isArray(ds)) return null
    return ds as Array<{ title?: string; start_char: number; end_char: number }>
  }, [primaryBook])

  // Go Deeper handler
  // Map UI tab names to Edge Function extraction_type values
  const tabToExtractionType: Record<string, string> = {
    summaries: 'summary_section',
    insights: 'insights_section',
    declarations: 'declarations_section',
    action_steps: 'action_steps_section',
    questions: 'questions_section',
  }

  const handleGoDeeper = useCallback(async (bookId: string, tab: string, sectionTitle?: string) => {
    if (!member) return
    setGoingDeeper(true)
    try {
      const targetBook = books.find(b => b.id === bookId)
      const targetLibId = targetBook?.book_library_id
      const tabItems: BookExtraction[] =
        tab === 'summaries' ? summaries.filter(s => s.book_library_id === targetLibId) :
        tab === 'insights' ? insights.filter(s => s.book_library_id === targetLibId) :
        tab === 'declarations' ? declarations.filter(s => s.book_library_id === targetLibId) :
        tab === 'action_steps' ? actionSteps.filter(s => s.book_library_id === targetLibId) :
        questions.filter(s => s.book_library_id === targetLibId)

      const existingTexts = tabItems
        .filter(i => !sectionTitle || (i as { section_title?: string | null }).section_title === sectionTitle)
        .map(i => ('declaration_text' in i ? (i as { declaration_text: string }).declaration_text : (i as { text?: string }).text) || '')

      // Resolve section boundaries from discovered_sections
      const ds = (targetBook as { discovered_sections?: unknown } | undefined)?.discovered_sections
      const discoveredArr = (ds && Array.isArray(ds) ? ds : discoveredSections || []) as Array<{ title?: string; start_char: number; end_char: number }>
      const matchedSection = sectionTitle
        ? discoveredArr.find(s => s.title === sectionTitle)
        : discoveredArr[0] // fallback to first section if no title specified

      const { supabase } = await import('@/lib/supabase/client')
      const accessToken = (await supabase.auth.getSession()).data.session?.access_token

      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bookshelf-extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          bookshelf_item_id: bookId,
          extraction_type: tabToExtractionType[tab] || 'summary_section',
          go_deeper: true,
          existing_items: existingTexts,
          section_title: sectionTitle,
          section_start: matchedSection?.start_char,
          section_end: matchedSection?.end_char,
          family_id: member.family_id,
          member_id: member.id,
        }),
      })
      if (resp.ok) {
        await refetch()
      } else {
        const errData = await resp.json().catch(() => ({}))
        const msg = (errData as { error?: string }).error || `Go Deeper failed (${resp.status})`
        console.error('[Go Deeper]', msg)
        // Show a brief error in extractProgress so user sees feedback
        setExtractProgress(msg)
        setTimeout(() => setExtractProgress(''), 5000)
      }
    } catch (err) {
      console.error('[Go Deeper] Error:', err)
      setExtractProgress(`Go Deeper failed: ${(err as Error).message}`)
      setTimeout(() => setExtractProgress(''), 5000)
    } finally {
      setGoingDeeper(false)
    }
  }, [member, books, summaries, insights, declarations, actionSteps, questions, refetch, discoveredSections])

  // ── Full / continue extraction trigger ──────────────────────────────
  const [extracting, setExtracting] = useState(false)
  const [extractProgress, setExtractProgress] = useState('')
  const extractAbortRef = useRef(false)

  const totalExtractions = summaries.length + insights.length + declarations.length + actionSteps.length + questions.length

  // Determine which sections have already been extracted (by section_title)
  const extractedSectionTitles = useMemo(() => {
    const titles = new Set<string>()
    for (const item of [...summaries, ...insights, ...declarations, ...actionSteps, ...questions]) {
      const st = (item as { section_title?: string | null }).section_title
      if (st) titles.add(st)
    }
    return titles
  }, [summaries, insights, declarations, actionSteps, questions])

  // Count unextracted sections
  const contentSections = useMemo(() => {
    if (!discoveredSections) return null
    return discoveredSections.filter(s => !s.title?.startsWith('[NON-CONTENT]'))
  }, [discoveredSections])

  const unextractedSections = useMemo(() => {
    if (!contentSections) return null
    return contentSections.filter(s => !extractedSectionTitles.has(s.title || ''))
  }, [contentSections, extractedSectionTitles])

  const needsExtraction = isSingleBook && primaryBook && totalExtractions === 0 && !loading
  const hasPartialExtraction = isSingleBook && primaryBook && totalExtractions > 0
    && unextractedSections && unextractedSections.length > 0 && !loading

  const handleFullExtraction = useCallback(async (sectionsToExtract?: Array<{ title?: string; start_char: number; end_char: number }>) => {
    if (!primaryBook || !member) return
    setExtracting(true)
    extractAbortRef.current = false
    try {
      const { supabase } = await import('@/lib/supabase/client')
      const accessToken = (await supabase.auth.getSession()).data.session?.access_token
      const baseUrl = import.meta.env.VITE_SUPABASE_URL
      const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${accessToken}` }

      let sections = sectionsToExtract

      if (!sections) {
        // Step 1: Discover sections
        setExtractProgress('Discovering sections...')
        const discResp = await fetch(`${baseUrl}/functions/v1/bookshelf-extract`, {
          method: 'POST', headers,
          body: JSON.stringify({
            bookshelf_item_id: primaryBook.id, family_id: member.family_id,
            member_id: member.id, extraction_type: 'discover_sections',
          }),
        })
        if (!discResp.ok) throw new Error('Section discovery failed')
        const discData = await discResp.json()
        const allSections = (discData.sections || []) as Array<{ title?: string; start_char: number; end_char: number }>

        // Save discovered sections to DB for future resume
        supabase
          .from('bookshelf_items')
          .update({ discovered_sections: allSections })
          .eq('id', primaryBook.id)
          .then(() => {}) // fire-and-forget

        sections = allSections.filter((s) => !s.title?.startsWith('[NON-CONTENT]'))
      }

      if (sections.length === 0) {
        setExtractProgress('No extractable sections found.')
        return
      }

      // Filter out already-extracted sections (for continue mode)
      const remaining = sections.filter(s => !extractedSectionTitles.has(s.title || ''))
      const skipped = sections.length - remaining.length

      if (remaining.length === 0) {
        setExtractProgress('All sections already extracted!')
        await refetch()
        return
      }

      if (skipped > 0) {
        setExtractProgress(`Skipping ${skipped} already-extracted sections...`)
      }

      // Step 2: Extract each remaining section
      for (let i = 0; i < remaining.length; i++) {
        if (extractAbortRef.current) break
        const s = remaining[i]
        setExtractProgress(`Extracting section ${i + 1} of ${remaining.length}: ${(s.title || 'Untitled').substring(0, 40)}...`)

        try {
          await fetch(`${baseUrl}/functions/v1/bookshelf-extract`, {
            method: 'POST', headers,
            body: JSON.stringify({
              bookshelf_item_id: primaryBook.id, family_id: member.family_id,
              member_id: member.id, extraction_type: 'combined_section',
              section_start: s.start_char, section_end: s.end_char, section_title: s.title,
            }),
          })
        } catch {
          // Non-fatal — continue with remaining sections
        }
      }

      setExtractProgress('Done! Loading extractions...')
      await refetch()
    } catch (err) {
      setExtractProgress(`Extraction failed: ${(err as Error).message}`)
    } finally {
      setExtracting(false)
    }
  }, [primaryBook, member, refetch, extractedSectionTitles])

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
        books={primaryBook ? [primaryBook] : books}
        collectionName={collectionName}
        showHearted={!!showHearted}
        onBack={onBack}
        onTitleChange={(bid, title) => updateBookTitle(bid, title)}
        onAuthorChange={(bid, author) => updateBookAuthor(bid, author)}
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
        activeTab={browserState.activeTab}
        onOpenStudyGuide={isSingleBook && primaryBook ? () => setShowStudyGuide(true) : undefined}
        onFolderChange={(bid, fid) => updateBookFolder(bid, fid)}
        archiveFolders={archiveFolders}
        onGenresChange={(bid, genres) => updateBookGenres(bid, genres)}
        onTagsChange={(bid, tags) => updateBookTags(bid, tags)}
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

      {/* Extraction progress indicator */}
      {extracting && (
        <div className="text-center py-8 px-4">
          <div className="space-y-3">
            <Loader2 size={32} className="animate-spin text-[var(--color-accent)] mx-auto" />
            <p className="text-sm text-[var(--color-text-secondary)]">{extractProgress}</p>
            <button
              onClick={() => { extractAbortRef.current = true }}
              className="text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)]"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Empty state: no extractions at all */}
      {needsExtraction && !extracting && (
        <div className="text-center py-12 px-4">
          <div className="space-y-4">
            <Sparkles size={32} className="text-[var(--color-accent)] mx-auto" />
            <div>
              <p className="text-base font-medium text-[var(--color-text-primary)]">
                Ready to extract
              </p>
              <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                AI will read this book and extract summaries, insights, declarations,
                action steps, and questions — with versions for adults, teens, and kids.
              </p>
            </div>
            <button
              onClick={() => handleFullExtraction()}
              className="px-6 py-2.5 rounded-lg bg-[var(--color-btn-primary-bg)] text-[var(--color-btn-primary-text,#fff)] text-sm font-medium"
            >
              <Sparkles size={14} className="inline mr-1.5" />
              Extract This Book
            </button>
          </div>
        </div>
      )}

      {/* Go Deeper / extraction error message (auto-dismisses after 5s) */}
      {!extracting && extractProgress && (
        <div className="px-4 py-2 mb-2 text-sm text-[var(--color-error)] bg-[color-mix(in_srgb,var(--color-error)_8%,transparent)] rounded-lg">
          {extractProgress}
        </div>
      )}

      {/* Partial extraction: some sections done, some remaining */}
      {hasPartialExtraction && !extracting && (
        <div className="flex items-center justify-between px-4 py-3 mb-2 rounded-lg bg-[color-mix(in_srgb,var(--color-accent)_8%,transparent)] border border-[var(--color-border-default)]">
          <div className="text-sm text-[var(--color-text-secondary)]">
            <span className="font-medium text-[var(--color-text-primary)]">
              {extractedSectionTitles.size} of {contentSections?.length ?? '?'} sections
            </span>
            {' '}extracted — {unextractedSections?.length} remaining
          </div>
          <button
            onClick={() => handleFullExtraction(unextractedSections ?? undefined)}
            className="px-4 py-1.5 rounded-lg bg-[var(--color-btn-primary-bg)] text-[var(--color-btn-primary-text,#fff)] text-xs font-medium"
          >
            <Sparkles size={12} className="inline mr-1" />
            Continue Extraction
          </button>
        </div>
      )}

      {totalExtractions > 0 && !extracting && (
      <div className="flex gap-6">
        <ExtractionSidebar
          chapters={chapters}
          books={books}
          isSingleBook={isSingleBook}
          allItems={browserState.viewMode === 'tabs'
            ? ({
                summaries, insights,
                declarations,
                action_steps: actionSteps,
                questions,
              }[browserState.activeTab] || summaries) as BookExtraction[]
            : [...summaries, ...insights, ...declarations, ...actionSteps, ...questions]
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
            books={books.map(b => ({ id: b.id, title: b.title, book_library_id: b.book_library_id || undefined }))}
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
            onSendToQueue={itemActions.handleSendToQueue}
            onSendToSelfKnowledge={itemActions.handleSendToSelfKnowledge}
            onCreateCustomInsight={isSingleBook ? itemActions.handleCreateCustomInsight : undefined}
            primaryBookLibraryId={isSingleBook ? primaryBook?.book_library_id || undefined : undefined}
          />
        </div>
      </div>
      )}

      <ChapterJumpOverlay
        chapters={chapters}
        bookTitle={isSingleBook ? primaryBook?.title : undefined}
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
        bookTitles={primaryBook ? [primaryBook.title] : books.map(b => b.title)}
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

      {/* Study Guide Modal */}
      {primaryBook && (
        <StudyGuideModal
          isOpen={showStudyGuide}
          onClose={() => setShowStudyGuide(false)}
          bookshelfItemId={primaryBook.id}
          bookTitle={primaryBook.title}
          onComplete={refetch}
        />
      )}
    </div>
  )
}
