/**
 * ExtractionContent (PRD-23)
 * Renders extraction items in 3 view modes: Tabs, Chapters, Notes.
 */
import { useMemo, useState, useCallback } from 'react'
import { Plus, X, Check } from 'lucide-react'
import { ExtractionSection, getAbridgedItems } from './ExtractionSection'
import { SummaryItem } from './items/SummaryItem'
import { InsightItem } from './items/InsightItem'
import { DeclarationItem } from './items/DeclarationItem'
import { ActionStepItem } from './items/ActionStepItem'
import { QuestionItem } from './items/QuestionItem'
import { ApplyThisSheet } from './ApplyThisSheet'
import type { ExtractionTab, BookExtraction } from '@/types/bookshelf'
import { TAB_TO_TYPE } from '@/types/bookshelf'
import type { ExtractionType } from '@/lib/extractionActions'
import type { ViewMode, FilterMode } from '@/hooks/useExtractionBrowser'
import type { BookShelfChapter } from '@/hooks/useExtractionData'

interface ExtractionContentProps {
  viewMode: ViewMode
  activeTab: ExtractionTab
  filterMode: FilterMode
  abridged: boolean
  searchQuery: string
  expandedAbridgedSections: Set<string>
  collapsedSections: Set<string>
  onToggleExpand: (key: string) => void
  onToggleCollapse: (key: string) => void
  summaries: BookExtraction[]
  insights: BookExtraction[]
  declarations: BookExtraction[]
  actionSteps: BookExtraction[]
  questions: BookExtraction[]
  chapters: BookShelfChapter[]
  books: { id: string; title: string; book_library_id?: string }[]
  // Item action handlers
  deletingItemIds: Set<string>
  notingItemId: string | null
  applyThisItemId: string | null
  onHeart: (type: ExtractionType, id: string, hearted: boolean) => void
  onNoteToggle: (id: string | null) => void
  onNoteSave: (type: ExtractionType, id: string, note: string) => void
  onDelete: (type: ExtractionType, id: string) => void
  onApplyThisToggle: (id: string | null) => void
  onOpenTaskCreation: (title: string, description: string, taskType?: string) => void
  onSendToGuidingStars: (type: ExtractionType, id: string, text: string) => Promise<unknown>
  onSendToBestIntentions: (id: string, text: string) => Promise<unknown>
  onSendToJournalPrompts: (id: string, text: string, bookTitle: string | null, chapterTitle: string | null) => Promise<unknown>
  onSendToQueue: (type: ExtractionType, id: string, text: string, bookTitle: string | null) => Promise<unknown>
  onSendToSelfKnowledge: (type: ExtractionType, id: string, text: string) => Promise<unknown>
  onCreateCustomInsight?: (bookLibraryId: string, text: string, contentType: string) => Promise<unknown>
  /** Primary book's book_library_id for custom insight creation (single-book mode) */
  primaryBookLibraryId?: string
}

// Text column accessor — declarations use declaration_text, others use text
function getItemText(item: BookExtraction, tab: ExtractionTab): string {
  if (tab === 'declarations') return item.declaration_text || item.text
  return item.text
}

function matchesSearch(item: BookExtraction, tab: ExtractionTab, query: string): boolean {
  if (!query) return true
  const q = query.toLowerCase()
  const text = getItemText(item, tab).toLowerCase()
  if (text.includes(q)) return true
  if (item.user_note?.toLowerCase().includes(q)) return true
  return false
}

function filterItems(
  items: BookExtraction[], tab: ExtractionTab, filterMode: FilterMode, search: string
): BookExtraction[] {
  let filtered = items
  if (filterMode === 'hearted') filtered = filtered.filter(i => i.is_hearted)
  if (search) filtered = filtered.filter(i => matchesSearch(i, tab, search))
  return filtered
}

/** Group items by section_title */
function groupBySection(items: BookExtraction[]): Map<string, BookExtraction[]> {
  const map = new Map<string, BookExtraction[]>()
  for (const item of items) {
    const key = item.section_title || 'General'
    const arr = map.get(key) || []
    arr.push(item)
    map.set(key, arr)
  }
  return map
}

export function ExtractionContent(props: ExtractionContentProps) {
  const { viewMode } = props

  if (viewMode === 'notes') return <NotesView {...props} />
  if (viewMode === 'chapters') return <ChaptersView {...props} />
  return <TabsView {...props} />
}

// ── Tabs View ──────────────────────────────────────────────────────────────

function TabsView(props: ExtractionContentProps) {
  const {
    activeTab, searchQuery,
    expandedAbridgedSections, collapsedSections,
    onToggleExpand, onToggleCollapse,
  } = props

  const items = getItemsForTab(props, activeTab)
  const filtered = filterItems(items, activeTab, props.filterMode, searchQuery)
  const sections = groupBySection(filtered)

  if (filtered.length === 0) {
    return (
      <div>
        {activeTab === 'insights' && props.primaryBookLibraryId && props.onCreateCustomInsight && (
          <AddCustomInsightForm bookLibraryId={props.primaryBookLibraryId} onSave={props.onCreateCustomInsight} />
        )}
        <EmptyTabState tab={activeTab} />
      </div>
    )
  }

  return (
    <div>
      {activeTab === 'insights' && props.primaryBookLibraryId && props.onCreateCustomInsight && (
        <AddCustomInsightForm bookLibraryId={props.primaryBookLibraryId} onSave={props.onCreateCustomInsight} />
      )}
      {Array.from(sections.entries()).map(([sectionTitle, sectionItems]) => {
        const key = `tab-${activeTab}-${sectionTitle}`
        const { visible, hiddenCount } = props.abridged
          ? getAbridgedItems(sectionItems, expandedAbridgedSections.has(key))
          : { visible: sectionItems, hiddenCount: 0 }

        return (
          <ExtractionSection
            key={key}
            sectionKey={key}
            title={sectionTitle}
            itemCount={sectionItems.length}
            abridged={props.abridged}
            isExpanded={expandedAbridgedSections.has(key)}
            isCollapsed={collapsedSections.has(key)}
            onToggleExpand={onToggleExpand}
            onToggleCollapse={onToggleCollapse}
            hiddenCount={hiddenCount}
          >
            {visible.map(item => renderItem(item, activeTab, props))}
          </ExtractionSection>
        )
      })}
    </div>
  )
}

// ── Chapters View ──────────────────────────────────────────────────────────

function ChaptersView(props: ExtractionContentProps) {
  const { chapters, books } = props

  const allTabs: ExtractionTab[] = ['summaries', 'insights', 'declarations', 'action_steps', 'questions']
  const tabLabels: Record<ExtractionTab, string> = {
    summaries: 'Summaries', insights: 'Insights', declarations: 'Declarations',
    action_steps: 'Action Steps', questions: 'Questions',
  }

  // Group chapters by book for multi-book
  const isMultiBook = books.length > 1

  // Build section list from chapters or section_title fallback
  const sectionTitles = useMemo(() => {
    if (chapters.length > 0) {
      return chapters.map(c => c.chapter_title)
    }
    // Fallback: collect unique section_titles across all items
    const titles = new Set<string>()
    for (const tab of allTabs) {
      const items = getItemsForTab(props, tab)
      for (const item of items) {
        titles.add(item.section_title || 'General')
      }
    }
    return Array.from(titles)
  }, [chapters, props])

  return (
    <div>
      {isMultiBook && books.map(book => (
        <div key={book.id} className="mb-6">
          <h2 className="text-base font-bold text-[var(--color-text-primary)] mb-3 px-1">
            {book.title}
          </h2>
          {renderChapterSections(sectionTitles, allTabs, tabLabels, book.id, props)}
        </div>
      ))}
      {!isMultiBook && renderChapterSections(sectionTitles, allTabs, tabLabels, null, props)}
    </div>
  )
}

function renderChapterSections(
  sectionTitles: string[],
  allTabs: ExtractionTab[],
  tabLabels: Record<ExtractionTab, string>,
  bookIdFilter: string | null,
  props: ExtractionContentProps
) {
  const { filterMode, abridged, searchQuery, expandedAbridgedSections, collapsedSections, onToggleExpand, onToggleCollapse } = props

  return sectionTitles.map(section => {
    const chapterKey = `ch-${section}`
    let hasItems = false

    const typeGroups = allTabs.map(tab => {
      let items = getItemsForTab(props, tab)
      items = items.filter(i => (i.section_title || 'General') === section)
      if (bookIdFilter) {
        const filterBook = props.books.find(b => b.id === bookIdFilter)
        if (filterBook?.book_library_id) items = items.filter(i => i.book_library_id === filterBook.book_library_id)
      }
      const filtered = filterItems(items, tab, filterMode, searchQuery)
      if (filtered.length > 0) hasItems = true

      const key = `${chapterKey}-${tab}`
      const { visible, hiddenCount } = abridged
        ? getAbridgedItems(filtered, expandedAbridgedSections.has(key))
        : { visible: filtered, hiddenCount: 0 }

      return { tab, filtered, visible, hiddenCount, key }
    })

    if (!hasItems) return null

    return (
      <ExtractionSection
        key={chapterKey}
        sectionKey={chapterKey}
        title={section}
        itemCount={typeGroups.reduce((s, g) => s + g.filtered.length, 0)}
        abridged={abridged}
        isExpanded={false}
        isCollapsed={collapsedSections.has(chapterKey)}
        onToggleExpand={onToggleExpand}
        onToggleCollapse={onToggleCollapse}
        hiddenCount={0}
      >
        {typeGroups.map(({ tab, visible, hiddenCount, key, filtered }) => {
          if (filtered.length === 0) return null
          return (
            <div key={key} className="mb-3">
              <div className="text-xs font-medium text-[var(--color-text-tertiary)] uppercase tracking-wider mb-1.5 px-1">
                {tabLabels[tab]} ({filtered.length})
              </div>
              {visible.map(item => renderItem(item, tab, props))}
              {abridged && hiddenCount > 0 && !expandedAbridgedSections.has(key) && (
                <button
                  onClick={() => onToggleExpand(key)}
                  className="text-xs text-[var(--color-accent)] hover:underline py-1"
                >
                  See {hiddenCount} more
                </button>
              )}
              {abridged && expandedAbridgedSections.has(key) && hiddenCount > 0 && (
                <button
                  onClick={() => onToggleExpand(key)}
                  className="text-xs text-[var(--color-accent)] hover:underline py-1"
                >
                  Key points only
                </button>
              )}
            </div>
          )
        })}
      </ExtractionSection>
    )
  })
}

// ── Notes View ─────────────────────────────────────────────────────────────

function NotesView(props: ExtractionContentProps) {
  const { filterMode, searchQuery } = props
  const allTabs: ExtractionTab[] = ['summaries', 'insights', 'declarations', 'action_steps', 'questions']
  const tabLabels: Record<ExtractionTab, string> = {
    summaries: 'Summary', insights: 'Insight', declarations: 'Declaration',
    action_steps: 'Action Step', questions: 'Question',
  }

  const notedItems: { item: BookExtraction; tab: ExtractionTab }[] = []
  for (const tab of allTabs) {
    const items = getItemsForTab(props, tab)
    for (const item of filterItems(items, tab, filterMode, searchQuery)) {
      if (item.user_note) notedItems.push({ item, tab })
    }
  }

  if (notedItems.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--color-text-tertiary)]">
        <p className="text-sm">No notes yet</p>
        <p className="text-xs mt-1">Use the note icon on any extraction to add your thoughts</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {notedItems.map(({ item, tab }) => (
        <div key={item.id}>
          <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1">
            {tabLabels[tab]}
          </div>
          {renderItem(item, tab, props)}
        </div>
      ))}
    </div>
  )
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function getItemsForTab(props: ExtractionContentProps, tab: ExtractionTab): BookExtraction[] {
  switch (tab) {
    case 'summaries': return props.summaries
    case 'insights': return props.insights
    case 'declarations': return props.declarations
    case 'action_steps': return props.actionSteps
    case 'questions': return props.questions
  }
}

function getBookTitle(item: BookExtraction, books: { id: string; title: string; book_library_id?: string }[]): string | null {
  return books.find(b => b.book_library_id === item.book_library_id)?.title || null
}

function renderItem(item: BookExtraction, tab: ExtractionTab, props: ExtractionContentProps) {
  const { deletingItemIds, notingItemId, applyThisItemId, books } = props
  const bookTitle = getBookTitle(item, books)
  const extractionType = TAB_TO_TYPE[tab]

  const applyThis = applyThisItemId === item.id ? (
    <ApplyThisSheet
      itemId={item.id}
      itemText={getItemText(item, tab)}
      extractionType={extractionType}
      bookTitle={bookTitle}
      chapterTitle={item.section_title}
      onSendToGuidingStars={props.onSendToGuidingStars}
      onSendToBestIntentions={props.onSendToBestIntentions}
      onSendToJournalPrompts={props.onSendToJournalPrompts}
      onSendToQueue={props.onSendToQueue}
      onSendToSelfKnowledge={props.onSendToSelfKnowledge}
      onOpenTaskCreation={props.onOpenTaskCreation}
      onClose={() => props.onApplyThisToggle(null)}
    />
  ) : undefined

  const shared = {
    isDeleting: deletingItemIds.has(item.id),
    isNoting: notingItemId === item.id,
    showApplyThis: applyThisItemId === item.id,
    onHeart: props.onHeart,
    onNoteToggle: props.onNoteToggle,
    onNoteSave: props.onNoteSave,
    onDelete: props.onDelete,
    onApplyThisToggle: props.onApplyThisToggle,
    applyThisContent: applyThis,
  }

  switch (tab) {
    case 'summaries':
      return <SummaryItem key={item.id} item={item} {...shared} />
    case 'insights':
      return <InsightItem key={item.id} item={item} {...shared} />
    case 'declarations':
      return <DeclarationItem key={item.id} item={item} {...shared} />
    case 'action_steps':
      return <ActionStepItem key={item.id} item={item} {...shared} />
    case 'questions':
      return <QuestionItem key={item.id} item={item} {...shared} />
  }
}

function EmptyTabState({ tab }: { tab: ExtractionTab }) {
  const labels: Record<ExtractionTab, string> = {
    summaries: 'summaries', insights: 'insights', declarations: 'declarations',
    action_steps: 'action steps', questions: 'questions',
  }
  return (
    <div className="text-center py-12 text-[var(--color-text-tertiary)]">
      <p className="text-sm">No {labels[tab]} found</p>
      <p className="text-xs mt-1">Try changing your filters or search</p>
    </div>
  )
}

const INSIGHT_CONTENT_TYPES = [
  { value: 'principle', label: 'Principle' },
  { value: 'framework', label: 'Framework' },
  { value: 'mental_model', label: 'Mental Model' },
  { value: 'process', label: 'Process' },
  { value: 'strategy', label: 'Strategy' },
  { value: 'concept', label: 'Concept' },
  { value: 'system', label: 'System' },
  { value: 'tool_set', label: 'Tool Set' },
]

function AddCustomInsightForm({ bookLibraryId, onSave }: {
  bookLibraryId: string
  onSave: (bookLibraryId: string, text: string, contentType: string) => Promise<unknown>
}) {
  const [open, setOpen] = useState(false)
  const [text, setText] = useState('')
  const [contentType, setContentType] = useState('principle')
  const [saving, setSaving] = useState(false)

  const handleSave = useCallback(async () => {
    if (!text.trim()) return
    setSaving(true)
    try {
      await onSave(bookLibraryId, text.trim(), contentType)
      setText('')
      setContentType('principle')
      setOpen(false)
    } finally {
      setSaving(false)
    }
  }, [bookLibraryId, text, contentType, onSave])

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 text-xs text-[var(--color-accent)] hover:underline mb-3"
      >
        <Plus size={14} />
        Add your own insight
      </button>
    )
  }

  return (
    <div className="mb-3 p-3 rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-secondary)]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-[var(--color-text-secondary)]">Add Custom Insight</span>
        <button onClick={() => setOpen(false)} className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]">
          <X size={14} />
        </button>
      </div>
      <textarea
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Type your insight, principle, or framework..."
        className="w-full p-2 text-sm rounded border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] resize-none"
        rows={3}
        autoFocus
      />
      <div className="flex items-center gap-2 mt-2">
        <select
          value={contentType}
          onChange={e => setContentType(e.target.value)}
          className="text-xs px-2 py-1 rounded border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)]"
        >
          {INSIGHT_CONTENT_TYPES.map(t => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
        <div className="flex-1" />
        <button
          onClick={handleSave}
          disabled={!text.trim() || saving}
          className="flex items-center gap-1 px-3 py-1 text-xs rounded bg-[var(--color-accent)] text-white disabled:opacity-50"
        >
          <Check size={12} />
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>
    </div>
  )
}
