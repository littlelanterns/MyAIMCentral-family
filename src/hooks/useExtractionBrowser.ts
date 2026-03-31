/**
 * useExtractionBrowser (PRD-23)
 * Manages UI state for the ExtractionBrowser: tabs, filters, view modes, search.
 * All state persisted to sessionStorage.
 */
import { useState, useCallback, useMemo } from 'react'
import type { ExtractionTab } from '@/types/bookshelf'

const SS_PREFIX = 'bookshelf-'

function ssGet<T>(key: string, fallback: T): T {
  try {
    const raw = sessionStorage.getItem(SS_PREFIX + key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function ssSet(key: string, value: unknown) {
  try {
    sessionStorage.setItem(SS_PREFIX + key, JSON.stringify(value))
  } catch { /* ignore */ }
}

export type ViewMode = 'tabs' | 'chapters' | 'notes'
export type FilterMode = 'all' | 'hearted'

export interface ExtractionBrowserState {
  activeTab: ExtractionTab
  filterMode: FilterMode
  viewMode: ViewMode
  abridged: boolean
  expandedAbridgedSections: Set<string>
  collapsedSections: Set<string>
  searchQuery: string
}

export function useExtractionBrowser() {
  const [activeTab, setActiveTabRaw] = useState<ExtractionTab>(
    () => ssGet<ExtractionTab>('active-tab', 'summaries')
  )
  const [filterMode, setFilterModeRaw] = useState<FilterMode>(
    () => ssGet<FilterMode>('filter-mode', 'all')
  )
  const [viewMode, setViewModeRaw] = useState<ViewMode>(
    () => ssGet<ViewMode>('view-mode', 'tabs')
  )
  const [abridged, setAbridgedRaw] = useState<boolean>(
    () => ssGet<boolean>('abridged', true)
  )
  const [expandedAbridgedSections, setExpandedAbridgedSections] = useState<Set<string>>(new Set())
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set())
  const [searchQuery, setSearchQueryRaw] = useState<string>(
    () => ssGet<string>('search', '')
  )

  const setActiveTab = useCallback((tab: ExtractionTab) => {
    setActiveTabRaw(tab)
    ssSet('active-tab', tab)
  }, [])

  const setFilterMode = useCallback((mode: FilterMode) => {
    setFilterModeRaw(mode)
    ssSet('filter-mode', mode)
  }, [])

  const setViewMode = useCallback((mode: ViewMode) => {
    setViewModeRaw(mode)
    ssSet('view-mode', mode)
  }, [])

  const setAbridged = useCallback((val: boolean) => {
    setAbridgedRaw(val)
    ssSet('abridged', val)
    // Reset per-section state when toggling
    setExpandedAbridgedSections(new Set())
    setCollapsedSections(new Set())
  }, [])

  const setSearchQuery = useCallback((q: string) => {
    setSearchQueryRaw(q)
    ssSet('search', q)
  }, [])

  const toggleSectionExpand = useCallback((sectionKey: string) => {
    setExpandedAbridgedSections(prev => {
      const next = new Set(prev)
      if (next.has(sectionKey)) next.delete(sectionKey)
      else next.add(sectionKey)
      return next
    })
  }, [])

  const toggleSectionCollapse = useCallback((sectionKey: string) => {
    setCollapsedSections(prev => {
      const next = new Set(prev)
      if (next.has(sectionKey)) next.delete(sectionKey)
      else next.add(sectionKey)
      return next
    })
  }, [])

  return useMemo(() => ({
    activeTab, setActiveTab,
    filterMode, setFilterMode,
    viewMode, setViewMode,
    abridged, setAbridged,
    expandedAbridgedSections, toggleSectionExpand,
    collapsedSections, toggleSectionCollapse,
    searchQuery, setSearchQuery,
  }), [
    activeTab, setActiveTab, filterMode, setFilterMode,
    viewMode, setViewMode, abridged, setAbridged,
    expandedAbridgedSections, toggleSectionExpand,
    collapsedSections, toggleSectionCollapse,
    searchQuery, setSearchQuery,
  ])
}
