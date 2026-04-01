/**
 * ExtractionControls (PRD-23)
 * Tab bar, All/Hearted toggle, Abridged/Full toggle, view mode switch, search.
 */
import { useState, useEffect, useRef } from 'react'
import {
  FileText, Lightbulb, Flame, Zap, HelpCircle,
  Heart, Layers, BookOpen, StickyNote, Search, X, Eye, EyeOff,
} from 'lucide-react'
import type { ExtractionTab } from '@/types/bookshelf'
import type { ViewMode, FilterMode } from '@/hooks/useExtractionBrowser'

interface TabInfo {
  key: ExtractionTab
  label: string
  icon: React.ElementType
  count: number
}

interface ExtractionControlsProps {
  activeTab: ExtractionTab
  onTabChange: (tab: ExtractionTab) => void
  filterMode: FilterMode
  onFilterModeChange: (mode: FilterMode) => void
  viewMode: ViewMode
  onViewModeChange: (mode: ViewMode) => void
  abridged: boolean
  onAbridgedChange: (val: boolean) => void
  searchQuery: string
  onSearchChange: (q: string) => void
  tabs: TabInfo[]
  isSingleBook: boolean
}

export function ExtractionControls({
  activeTab, onTabChange, filterMode, onFilterModeChange,
  viewMode, onViewModeChange, abridged, onAbridgedChange,
  searchQuery, onSearchChange, tabs, isSingleBook,
}: ExtractionControlsProps) {
  const [searchOpen, setSearchOpen] = useState(!!searchQuery)
  const [searchDraft, setSearchDraft] = useState(searchQuery)
  const searchRef = useRef<HTMLInputElement>(null)
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined)

  useEffect(() => {
    if (searchOpen && searchRef.current) searchRef.current.focus()
  }, [searchOpen])

  useEffect(() => {
    debounceRef.current = setTimeout(() => onSearchChange(searchDraft), 300)
    return () => clearTimeout(debounceRef.current)
  }, [searchDraft])

  const VIEW_MODES: { key: ViewMode; icon: React.ElementType; label: string }[] = [
    { key: 'tabs', icon: Layers, label: 'Tabs' },
    { key: 'chapters', icon: BookOpen, label: 'Chapters' },
    { key: 'notes', icon: StickyNote, label: 'Notes' },
  ]

  return (
    <div className="space-y-2 mb-4">
      {/* Tab bar — horizontally scrollable */}
      {viewMode === 'tabs' && (
        <div className="flex overflow-x-auto gap-1 pb-1 -mx-1 px-1 scrollbar-thin">
          {tabs.map(tab => {
            const Icon = tab.icon
            const isActive = activeTab === tab.key
            return (
              <button
                key={tab.key}
                onClick={() => onTabChange(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full whitespace-nowrap text-sm transition-colors shrink-0
                  ${isActive
                    ? 'bg-[var(--surface-primary)] text-[var(--color-text-on-primary,#fff)] font-medium'
                    : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]'
                  }
                `}
              >
                <Icon size={14} />
                {tab.label}
                <span className={`text-xs tabular-nums ${isActive ? 'opacity-80' : 'opacity-60'}`}>
                  {tab.count}
                </span>
              </button>
            )
          })}
        </div>
      )}

      {/* Controls row */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* All / Hearted toggle */}
        <div className="flex rounded-lg overflow-hidden border border-[var(--color-border-default)]">
          <button
            onClick={() => onFilterModeChange('all')}
            className={`px-2.5 py-1 text-xs ${filterMode === 'all' ? 'bg-[var(--surface-primary)] text-[var(--color-text-on-primary,#fff)]' : 'text-[var(--color-text-secondary)]'}`}
          >
            All
          </button>
          <button
            onClick={() => onFilterModeChange('hearted')}
            className={`px-2.5 py-1 text-xs flex items-center gap-1 ${filterMode === 'hearted' ? 'bg-[var(--surface-primary)] text-[var(--color-text-on-primary,#fff)]' : 'text-[var(--color-text-secondary)]'}`}
          >
            <Heart size={12} /> Hearted
          </button>
        </div>

        {/* Abridged / Full */}
        <button
          onClick={() => onAbridgedChange(!abridged)}
          className="flex items-center gap-1 px-2.5 py-1 text-xs rounded-lg border border-[var(--color-border-default)] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-tertiary)]"
          title={abridged ? 'Show all content' : 'Show key points only'}
        >
          {abridged ? <Eye size={12} /> : <EyeOff size={12} />}
          {abridged ? 'Abridged' : 'Full'}
        </button>

        {/* View mode */}
        <div className="flex rounded-lg overflow-hidden border border-[var(--color-border-default)]">
          {VIEW_MODES.map(vm => {
            const Icon = vm.icon
            return (
              <button
                key={vm.key}
                onClick={() => onViewModeChange(vm.key)}
                className={`p-1.5 ${viewMode === vm.key ? 'bg-[var(--surface-primary)] text-[var(--color-text-on-primary,#fff)]' : 'text-[var(--color-text-secondary)]'}`}
                title={vm.label}
              >
                <Icon size={14} />
              </button>
            )
          })}
        </div>

        {/* Search toggle */}
        <button
          onClick={() => {
            if (searchOpen && searchDraft) {
              setSearchDraft('')
              onSearchChange('')
            }
            setSearchOpen(!searchOpen)
          }}
          className="p-1.5 rounded-lg hover:bg-[var(--color-surface-tertiary)] ml-auto"
        >
          {searchOpen ? <X size={16} /> : <Search size={16} />}
        </button>
      </div>

      {/* Search bar */}
      {searchOpen && (
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
          <input
            ref={searchRef}
            value={searchDraft}
            onChange={e => setSearchDraft(e.target.value)}
            placeholder={isSingleBook ? 'Search this book...' : 'Search extractions...'}
            className="w-full pl-8 pr-8 py-1.5 text-sm rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
          {searchDraft && (
            <button
              onClick={() => { setSearchDraft(''); onSearchChange('') }}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5"
            >
              <X size={14} className="text-[var(--color-text-tertiary)]" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/** Build tab info from item counts */
export function buildTabs(
  summaryCount: number,
  insightCount: number,
  declarationCount: number,
  actionStepCount: number,
  questionCount: number
): { key: ExtractionTab; label: string; icon: React.ElementType; count: number }[] {
  return [
    { key: 'summaries', label: 'Summaries', icon: FileText, count: summaryCount },
    { key: 'insights', label: 'Insights', icon: Lightbulb, count: insightCount },
    { key: 'declarations', label: 'Declarations', icon: Flame, count: declarationCount },
    { key: 'action_steps', label: 'Action Steps', icon: Zap, count: actionStepCount },
    { key: 'questions', label: 'Questions', icon: HelpCircle, count: questionCount },
  ]
}
