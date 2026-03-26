import { Search, X } from 'lucide-react'

interface Filters {
  contentType: string | null
  difficulty: string | null
  bookmarksOnly: boolean
}

interface Props {
  query: string
  onQueryChange: (q: string) => void
  filters: Filters
  onFiltersChange: (f: Filters) => void
}

const CONTENT_TYPES = [
  { value: 'tutorial', label: 'Tutorials' },
  { value: 'ai_tool', label: 'AI Tools' },
  { value: 'prompt_pack', label: 'Prompts' },
  { value: 'workflow', label: 'Workflows' },
  { value: 'skill', label: 'Skills' },
  { value: 'curation', label: 'Curations' },
]

const DIFFICULTIES = [
  { value: 'beginner', label: 'Beginner' },
  { value: 'intermediate', label: 'Intermediate' },
  { value: 'advanced', label: 'Advanced' },
]

export function VaultSearchBar({ query, onQueryChange, filters, onFiltersChange }: Props) {
  const toggleContentType = (val: string) => {
    onFiltersChange({
      ...filters,
      contentType: filters.contentType === val ? null : val,
    })
  }

  const toggleDifficulty = (val: string) => {
    onFiltersChange({
      ...filters,
      difficulty: filters.difficulty === val ? null : val,
    })
  }

  const toggleBookmarks = () => {
    onFiltersChange({ ...filters, bookmarksOnly: !filters.bookmarksOnly })
  }

  const hasFilters = query.length > 0 || filters.contentType || filters.difficulty || filters.bookmarksOnly

  return (
    <div className="sticky top-0 z-20 pb-3 -mx-4 px-4 pt-2" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      {/* Search input */}
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-secondary)' }} />
        <input
          type="text"
          placeholder="Search tutorials, tools, prompts..."
          value={query}
          onChange={e => onQueryChange(e.target.value)}
          className="w-full pl-9 pr-8 py-2.5 rounded-lg border text-sm"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />
        {query && (
          <button
            onClick={() => onQueryChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-full"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Filter chips */}
      <div className="flex flex-wrap gap-2 mt-2">
        {CONTENT_TYPES.map(ct => (
          <button
            key={ct.value}
            onClick={() => toggleContentType(ct.value)}
            className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
            style={{
              backgroundColor: filters.contentType === ct.value ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-secondary)',
              color: filters.contentType === ct.value ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
              border: `1px solid ${filters.contentType === ct.value ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
            }}
          >
            {ct.label}
          </button>
        ))}

        <span className="w-px self-stretch" style={{ backgroundColor: 'var(--color-border)' }} />

        {DIFFICULTIES.map(d => (
          <button
            key={d.value}
            onClick={() => toggleDifficulty(d.value)}
            className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
            style={{
              backgroundColor: filters.difficulty === d.value ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-secondary)',
              color: filters.difficulty === d.value ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
              border: `1px solid ${filters.difficulty === d.value ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
            }}
          >
            {d.label}
          </button>
        ))}

        <span className="w-px self-stretch" style={{ backgroundColor: 'var(--color-border)' }} />

        <button
          onClick={toggleBookmarks}
          className="px-2.5 py-1 rounded-full text-xs font-medium transition-colors"
          style={{
            backgroundColor: filters.bookmarksOnly ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-secondary)',
            color: filters.bookmarksOnly ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
            border: `1px solid ${filters.bookmarksOnly ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
          }}
        >
          Bookmarks
        </button>

        {hasFilters && (
          <button
            onClick={() => {
              onQueryChange('')
              onFiltersChange({ contentType: null, difficulty: null, bookmarksOnly: false })
            }}
            className="px-2 py-1 text-xs"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Clear all
          </button>
        )}
      </div>
    </div>
  )
}
