/**
 * ChapterJumpOverlay (PRD-23)
 * Mobile-only (<768px) FAB + bottom sheet for section navigation.
 * Uses bookshelf_chapters or falls back to section_title from extraction items.
 */
import { useState, useMemo } from 'react'
import { List, X, ArrowUp } from 'lucide-react'
import type { BookShelfChapter } from '@/hooks/useExtractionData'
import type { BookExtraction, ExtractionTab } from '@/types/bookshelf'
import type { ViewMode } from '@/hooks/useExtractionBrowser'

interface ChapterJumpOverlayProps {
  chapters: BookShelfChapter[]
  bookTitle?: string
  allItems: Pick<BookExtraction, 'section_title' | 'section_index'>[]
  viewMode: ViewMode
  activeTab: ExtractionTab
}

interface NavEntry {
  key: string
  title: string
}

export function ChapterJumpOverlay({
  chapters, bookTitle, allItems, viewMode, activeTab,
}: ChapterJumpOverlayProps) {
  const [open, setOpen] = useState(false)

  // Build nav entries matching what ExtractionContent renders
  const entries = useMemo((): NavEntry[] => {
    if (viewMode === 'notes') return []

    if (viewMode === 'chapters') {
      // Chapters from DB or fallback from section_title
      if (chapters.length > 0) {
        return chapters.map(ch => ({
          key: `ch-${ch.chapter_title}`,
          title: ch.chapter_title,
        }))
      }
      const seen = new Map<string, number>()
      for (const item of allItems) {
        const t = item.section_title || 'General'
        if (!seen.has(t)) seen.set(t, item.section_index ?? 999)
      }
      return Array.from(seen.entries())
        .sort((a, b) => a[1] - b[1])
        .map(([title]) => ({ key: `ch-${title}`, title }))
    }

    // Tabs view — sections within active tab
    const seen = new Map<string, number>()
    for (const item of allItems) {
      const t = item.section_title || 'General'
      const key = `tab-${activeTab}-${t}`
      if (!seen.has(key)) seen.set(key, item.section_index ?? 999)
    }
    return Array.from(seen.entries())
      .sort((a, b) => a[1] - b[1])
      .map(([key]) => ({
        key,
        title: key.replace(`tab-${activeTab}-`, ''),
      }))
  }, [chapters, allItems, viewMode, activeTab])

  if (entries.length < 3) return null

  const scrollToSection = (sectionKey: string) => {
    const el = document.getElementById(`section-${sectionKey}`)
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    setOpen(false)
  }

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    setOpen(false)
  }

  return (
    <>
      {/* FAB — mobile only */}
      <button
        onClick={() => setOpen(true)}
        className="md:hidden fixed bottom-20 left-4 z-30 w-10 h-10 rounded-full bg-[var(--surface-primary)] text-[var(--color-text-on-primary,#fff)] shadow-lg flex items-center justify-center"
      >
        <List size={20} />
      </button>

      {/* Bottom sheet */}
      {open && (
        <>
          <div
            className="md:hidden fixed inset-0 bg-black/30 z-40"
            onClick={() => setOpen(false)}
          />
          <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 rounded-t-2xl max-h-[60vh] overflow-y-auto shadow-xl" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
            <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--color-border)', backgroundColor: 'var(--color-bg-secondary)' }}>
              <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
                {bookTitle || 'Sections'}
              </h3>
              <button onClick={() => setOpen(false)} className="p-1" style={{ background: 'none', border: 'none', cursor: 'pointer', minHeight: 'unset' }}>
                <X size={18} style={{ color: 'var(--color-text-secondary)' }} />
              </button>
            </div>

            <nav className="px-2 py-2 space-y-0.5">
              {entries.map(entry => (
                <button
                  key={entry.key}
                  onClick={() => scrollToSection(entry.key)}
                  className="w-full text-left text-sm py-2 px-3 rounded-lg truncate"
                  style={{ color: 'var(--color-text-secondary)', background: 'none', border: 'none', cursor: 'pointer', minHeight: 'unset' }}
                >
                  {entry.title}
                </button>
              ))}

              <button
                onClick={scrollToTop}
                className="w-full text-left text-sm py-2 px-3 rounded-lg flex items-center gap-2"
                style={{ color: 'var(--color-accent)', background: 'none', border: 'none', cursor: 'pointer', minHeight: 'unset' }}
              >
                <ArrowUp size={14} />
                Back to top
              </button>
            </nav>
          </div>
        </>
      )}
    </>
  )
}
