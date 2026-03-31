/**
 * ExtractionSidebar (PRD-23)
 * Desktop-only (>=768px) sticky sidebar showing the chapter/section tree
 * with item counts. Click to scroll. IntersectionObserver highlights current section.
 *
 * Single-book: flat list of sections with counts.
 * Multi-book: book headers (collapsible) → sections nested. The book you're
 *   currently scrolled into auto-expands; others stay collapsed.
 *
 * Falls back to section_title from extraction items when bookshelf_chapters is empty.
 */
import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Library, ChevronDown, ChevronRight } from 'lucide-react'
import type { BookShelfChapter } from '@/hooks/useExtractionData'
import type { BookShelfItem, BaseExtractionItem, ExtractionTab } from '@/types/bookshelf'
import type { ViewMode } from '@/hooks/useExtractionBrowser'

interface SectionEntry {
  key: string
  title: string
  count: number
  bookId: string
}

interface ExtractionSidebarProps {
  chapters: BookShelfChapter[]
  books: BookShelfItem[]
  isSingleBook: boolean
  allItems: BaseExtractionItem[]
  viewMode: ViewMode
  activeTab: ExtractionTab
}

export function ExtractionSidebar({
  chapters, books, isSingleBook, allItems, viewMode, activeTab,
}: ExtractionSidebarProps) {
  const navigate = useNavigate()
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const [manualExpanded, setManualExpanded] = useState<Set<string>>(new Set())

  // ── Build section entries with counts ────────────────────────────────────

  const sectionEntries = useMemo((): SectionEntry[] => {
    if (viewMode === 'notes') return []

    const countMap = new Map<string, number>()
    for (const item of allItems) {
      const t = item.section_title || 'General'
      countMap.set(t, (countMap.get(t) || 0) + 1)
    }

    if (viewMode === 'chapters') {
      if (chapters.length > 0) {
        return chapters.map(ch => ({
          key: `ch-${ch.chapter_title}`,
          title: ch.chapter_title,
          count: countMap.get(ch.chapter_title) || 0,
          bookId: ch.bookshelf_item_id,
        }))
      }
      const seen = new Map<string, { index: number; bookId: string }>()
      for (const item of allItems) {
        const t = item.section_title || 'General'
        if (!seen.has(t)) seen.set(t, { index: item.section_index ?? 999, bookId: item.bookshelf_item_id })
      }
      return Array.from(seen.entries())
        .sort((a, b) => a[1].index - b[1].index)
        .map(([title, info]) => ({
          key: `ch-${title}`,
          title,
          count: countMap.get(title) || 0,
          bookId: info.bookId,
        }))
    }

    // Tabs view
    const seen = new Map<string, { index: number; bookId: string }>()
    for (const item of allItems) {
      const t = item.section_title || 'General'
      const key = `tab-${activeTab}-${t}`
      if (!seen.has(key)) seen.set(key, { index: item.section_index ?? 999, bookId: item.bookshelf_item_id })
    }
    return Array.from(seen.entries())
      .sort((a, b) => a[1].index - b[1].index)
      .map(([key, info]) => ({
        key,
        title: key.replace(`tab-${activeTab}-`, ''),
        count: countMap.get(key.replace(`tab-${activeTab}-`, '')) || 0,
        bookId: info.bookId,
      }))
  }, [viewMode, activeTab, chapters, allItems])

  // ── Group by book for multi-book ─────────────────────────────────────────

  const sectionsByBook = useMemo(() => {
    if (isSingleBook) return null
    const map = new Map<string, SectionEntry[]>()
    for (const sec of sectionEntries) {
      const arr = map.get(sec.bookId) || []
      arr.push(sec)
      map.set(sec.bookId, arr)
    }
    return map
  }, [sectionEntries, isSingleBook])

  // Determine which book the user is currently scrolled into
  const activeBookId = useMemo(() => {
    if (!activeSectionId) return null
    const entry = sectionEntries.find(s => `section-${s.key}` === activeSectionId)
    return entry?.bookId || null
  }, [activeSectionId, sectionEntries])

  const toggleBook = useCallback((bookId: string) => {
    setManualExpanded(prev => {
      const next = new Set(prev)
      if (next.has(bookId)) next.delete(bookId)
      else next.add(bookId)
      return next
    })
  }, [])

  // A book is expanded if it's the active one OR the user manually toggled it open
  const isBookExpanded = useCallback((bookId: string) => {
    if (manualExpanded.has(bookId)) return true
    return bookId === activeBookId
  }, [manualExpanded, activeBookId])

  // ── IntersectionObserver scroll spy ──────────────────────────────────────

  useEffect(() => {
    if (sectionEntries.length === 0) return

    const observer = new IntersectionObserver(
      entries => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveSectionId(entry.target.id)
        }
      },
      { rootMargin: '-10% 0px -80% 0px' }
    )

    const timer = setTimeout(() => {
      document.querySelectorAll('[id^="section-"]').forEach(el => observer.observe(el))
    }, 300)

    return () => { clearTimeout(timer); observer.disconnect() }
  }, [sectionEntries])

  const scrollToSection = (key: string) => {
    const el = document.getElementById(`section-${key}`)
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  if (sectionEntries.length === 0) return null

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <aside className="hidden md:block w-64 shrink-0 sticky top-4 self-start max-h-[calc(100vh-6rem)] overflow-y-auto pr-3 pb-8">
      <button
        onClick={() => navigate('/bookshelf')}
        className="flex items-center gap-1.5 text-xs text-[var(--color-accent)] hover:underline mb-4"
      >
        <Library size={14} />
        Library
      </button>

      {/* Single-book: flat section list */}
      {isSingleBook && (
        <nav className="space-y-px">
          {sectionEntries.map(sec => (
            <SectionNavItem
              key={sec.key}
              sec={sec}
              isActive={activeSectionId === `section-${sec.key}`}
              onClick={() => scrollToSection(sec.key)}
            />
          ))}
        </nav>
      )}

      {/* Multi-book: collapsible book groups */}
      {!isSingleBook && sectionsByBook && (
        <nav className="space-y-1">
          {Array.from(sectionsByBook.entries()).map(([bookId, secs]) => {
            const book = books.find(b => b.id === bookId)
            const expanded = isBookExpanded(bookId)
            const totalCount = secs.reduce((sum, s) => sum + s.count, 0)

            return (
              <div key={bookId}>
                <button
                  onClick={() => toggleBook(bookId)}
                  className={`w-full text-left text-[13px] leading-snug py-1.5 px-2 rounded-md transition-colors flex items-center gap-1.5
                    ${activeBookId === bookId
                      ? 'text-[var(--color-text-primary)] font-semibold'
                      : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                    }
                  `}
                >
                  {expanded
                    ? <ChevronDown size={14} className="shrink-0 opacity-60" />
                    : <ChevronRight size={14} className="shrink-0 opacity-60" />
                  }
                  <span className="truncate flex-1">{book?.title || 'Unknown'}</span>
                  <span className="shrink-0 text-[11px] tabular-nums text-[var(--color-accent-warm,#c5855a)]">
                    {totalCount}
                  </span>
                </button>

                {expanded && (
                  <div className="ml-4 mt-0.5 space-y-px border-l border-[var(--color-border-subtle)] pl-1">
                    {secs.map(sec => (
                      <SectionNavItem
                        key={sec.key}
                        sec={sec}
                        isActive={activeSectionId === `section-${sec.key}`}
                        onClick={() => scrollToSection(sec.key)}
                      />
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </nav>
      )}
    </aside>
  )
}

function SectionNavItem({
  sec, isActive, onClick,
}: {
  sec: SectionEntry; isActive: boolean; onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={sec.title}
      className={`w-full text-left text-[13px] leading-snug py-1.5 px-2 rounded-md transition-colors flex items-center gap-2
        ${isActive
          ? 'bg-[color-mix(in_srgb,var(--color-accent)_12%,transparent)] text-[var(--color-text-primary)] font-medium'
          : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-surface-tertiary)]'
        }
      `}
    >
      <span className="truncate flex-1">{sec.title}</span>
      {sec.count > 0 && (
        <span className={`shrink-0 text-[11px] tabular-nums min-w-[1.25rem] text-center rounded-full px-1
          ${isActive
            ? 'text-[var(--color-accent)] font-semibold'
            : 'text-[var(--color-accent-warm,#c5855a)]'
          }
        `}>
          {sec.count}
        </span>
      )}
    </button>
  )
}
