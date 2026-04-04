/**
 * SemanticSearchPanel (PRD-23)
 * Full-screen modal overlay for semantic search across books.
 * Three modes: Any / Together / Separate. Two scopes: Chunks / Extractions / Both.
 */
import { useState, useCallback } from 'react'
import { Search, X, BookOpen, FileText, Layers, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useBookShelfSearchHistory } from '@/hooks/useBookShelfSearchHistory'

interface SemanticSearchPanelProps {
  isOpen: boolean
  onClose: () => void
  onNavigateToResult: (bookId: string, tab?: string) => void
  bookIds?: string[]
  /** Pre-fill query from external trigger (e.g. history re-run) */
  initialQuery?: string
}

type SearchMode = 'any' | 'together' | 'separate'
type SearchScope = 'chunks' | 'extractions' | 'both'

interface SearchResult {
  id: string
  table_name: string
  bookshelf_item_id: string
  book_title: string
  content_type: string
  item_text: string
  section_title: string | null
  similarity: number
}

interface GroupedResults {
  term: string
  results: SearchResult[]
}

export function SemanticSearchPanel({ isOpen, onClose, onNavigateToResult, bookIds, initialQuery }: SemanticSearchPanelProps) {
  const { data: member } = useFamilyMember()
  const { saveSearch } = useBookShelfSearchHistory()
  const [query, setQuery] = useState(initialQuery || '')
  const [mode, setMode] = useState<SearchMode>('any')
  const [scope, setScope] = useState<SearchScope>('both')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<SearchResult[]>([])
  const [groupedResults, setGroupedResults] = useState<GroupedResults[]>([])
  const [error, setError] = useState<string | null>(null)

  const handleSearch = useCallback(async () => {
    if (!query.trim() || !member) return

    setSearching(true)
    setError(null)
    setResults([])
    setGroupedResults([])

    try {
      if (mode === 'separate') {
        // Split and search each term independently
        const terms = query.split(/[,;\n]+/).map(t => t.trim()).filter(Boolean)
        const grouped: GroupedResults[] = []

        for (const term of terms) {
          const { data, error: fetchError } = await supabase.functions.invoke('bookshelf-search', {
            body: {
              query: term,
              scope,
              family_id: member.family_id,
              member_id: member.id,
              book_ids: bookIds,
              limit: 10,
            },
          })
          if (fetchError) throw fetchError
          grouped.push({ term, results: data?.results || [] })
        }
        setGroupedResults(grouped)
        const totalResults = grouped.reduce((sum, g) => sum + g.results.length, 0)
        saveSearch(query.trim(), mode, scope, totalResults)
      } else {
        // 'any' splits but merges; 'together' sends whole query
        const searchQuery = mode === 'together' ? query : query
        const { data, error: fetchError } = await supabase.functions.invoke('bookshelf-search', {
          body: {
            query: searchQuery,
            scope,
            family_id: member.family_id,
            member_id: member.id,
            book_ids: bookIds,
            limit: 20,
          },
        })
        if (fetchError) throw fetchError
        const resultList = data?.results || []
        setResults(resultList)
        saveSearch(query.trim(), mode, scope, resultList.length)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setSearching(false)
    }
  }, [query, mode, scope, member, bookIds])

  if (!isOpen) return null

  const TABLE_TO_TAB: Record<string, string> = {
    // New platform extraction types
    summary: 'summaries',
    insight: 'insights',
    declaration: 'declarations',
    action_step: 'action_steps',
    question: 'questions',
    // Old table names (backward compat with edge function results)
    bookshelf_summaries: 'summaries',
    bookshelf_insights: 'insights',
    bookshelf_declarations: 'declarations',
    bookshelf_action_steps: 'action_steps',
    bookshelf_questions: 'questions',
    bookshelf_chunks: 'summaries',
  }

  const renderResult = (result: SearchResult) => (
    <button
      key={result.id}
      onClick={() => {
        onNavigateToResult(result.bookshelf_item_id, TABLE_TO_TAB[result.table_name])
        onClose()
      }}
      className="w-full text-left p-3 rounded-lg bg-[var(--color-surface-secondary)] hover:bg-[var(--color-surface-tertiary)] transition-colors"
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)]">
          {result.content_type || result.table_name.replace('bookshelf_', '')}
        </span>
        <span className="text-[10px] text-[var(--color-accent)] tabular-nums">
          {Math.round(result.similarity * 100)}% match
        </span>
      </div>
      <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
        {result.item_text}
      </p>
      <div className="flex items-center gap-2 mt-1.5 text-xs text-[var(--color-text-tertiary)]">
        <span className="truncate">{result.book_title}</span>
        {result.section_title && (
          <>
            <span>·</span>
            <span className="truncate">{result.section_title}</span>
          </>
        )}
      </div>
    </button>
  )

  return (
    <>
      <div className="fixed inset-0 z-50" style={{ backgroundColor: 'color-mix(in srgb, var(--color-bg-page) 80%, transparent)' }} onClick={onClose} />
      <div
        className="fixed z-50 overflow-hidden flex flex-col rounded-xl shadow-2xl"
        style={{
          inset: '2rem',
          backgroundColor: 'var(--color-bg-card, var(--color-surface-primary))',
          border: '1px solid var(--color-border-default)',
        }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-4 border-b border-[var(--color-border-subtle)]">
          <Search size={20} className="text-[var(--color-text-tertiary)] shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSearch() }}
            placeholder={bookIds && bookIds.length === 1 ? 'Search inside this book...' : bookIds && bookIds.length > 1 ? `Search across ${bookIds.length} books...` : 'Search across your book library...'}
            className="flex-1 text-sm bg-transparent text-[var(--color-text-primary)] focus:outline-none"
          />
          <button onClick={onClose} className="p-1">
            <X size={18} className="text-[var(--color-text-tertiary)]" />
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3 px-4 py-2 border-b border-[var(--color-border-subtle)] flex-wrap">
          {/* Mode pills */}
          <div className="flex rounded-lg overflow-hidden border border-[var(--color-border-default)]">
            {([['any', 'Any of these'], ['together', 'All together'], ['separate', 'Show each']] as [SearchMode, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setMode(key)}
                className={`px-2.5 py-1 text-xs ${mode === key ? 'bg-[var(--surface-primary)] text-[var(--color-text-on-primary,#fff)]' : 'text-[var(--color-text-secondary)]'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Scope pills */}
          <div className="flex rounded-lg overflow-hidden border border-[var(--color-border-default)]">
            {([['chunks', BookOpen, 'Passages'], ['extractions', FileText, 'Extractions'], ['both', Layers, 'Both']] as [SearchScope, React.ElementType, string][]).map(([key, Icon, label]) => (
              <button
                key={key}
                onClick={() => setScope(key)}
                className={`px-2.5 py-1 text-xs flex items-center gap-1 ${scope === key ? 'bg-[var(--surface-primary)] text-[var(--color-text-on-primary,#fff)]' : 'text-[var(--color-text-secondary)]'}`}
              >
                <Icon size={12} />{label}
              </button>
            ))}
          </div>

          <button
            onClick={handleSearch}
            disabled={!query.trim() || searching}
            className="ml-auto px-4 py-1.5 rounded-lg bg-[var(--surface-primary)] text-[var(--color-text-on-primary,#fff)] text-xs font-medium disabled:opacity-50"
          >
            {searching ? <Loader2 size={14} className="animate-spin" /> : 'Search'}
          </button>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto p-4">
          {searching && (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={24} className="animate-spin text-[var(--color-accent)]" />
            </div>
          )}

          {error && (
            <div className="text-center py-8 text-sm text-[var(--color-error)]">{error}</div>
          )}

          {!searching && !error && results.length === 0 && groupedResults.length === 0 && query && (
            <div className="text-center py-12 text-[var(--color-text-tertiary)]">
              <p className="text-sm">No results found</p>
              <p className="text-xs mt-1">Try different keywords or a broader search</p>
            </div>
          )}

          {/* Flat results (any / together mode) */}
          {results.length > 0 && (
            <div className="space-y-2">
              {results.map(renderResult)}
            </div>
          )}

          {/* Grouped results (separate mode) */}
          {groupedResults.map(group => (
            <div key={group.term} className="mb-6">
              <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                &ldquo;{group.term}&rdquo;
                <span className="ml-2 text-xs font-normal text-[var(--color-text-tertiary)]">
                  {group.results.length} results
                </span>
              </h3>
              <div className="space-y-2">
                {group.results.map(renderResult)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  )
}
