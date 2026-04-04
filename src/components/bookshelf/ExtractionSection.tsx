/**
 * ExtractionSection (PRD-23)
 * Renders a group of extraction items with a sticky header, abridged/expand toggle.
 */
import { type ReactNode } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
// Minimal constraint — getAbridgedItems only needs is_key_point and is_hearted

interface ExtractionSectionProps {
  sectionKey: string
  title: string
  itemCount: number
  abridged: boolean
  isExpanded: boolean
  isCollapsed: boolean
  onToggleExpand: (key: string) => void
  onToggleCollapse: (key: string) => void
  children: ReactNode
  hiddenCount: number
}

export function ExtractionSection({
  sectionKey, title, itemCount, abridged, isExpanded, isCollapsed,
  onToggleExpand, onToggleCollapse, children, hiddenCount,
}: ExtractionSectionProps) {
  // In full content mode (not abridged), sections start collapsed
  const showContent = abridged ? true : !isCollapsed

  return (
    <div id={`section-${sectionKey}`} className="mb-4">
      {/* Sticky section header */}
      <div className="sticky top-0 z-10 flex items-center gap-2 py-2 px-1 bg-[var(--color-surface-primary)] border-b border-[var(--color-border-subtle)]">
        {!abridged && (
          <button
            onClick={() => onToggleCollapse(sectionKey)}
            className="p-0.5 rounded hover:bg-[var(--color-surface-tertiary)]"
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
        <h3 className="text-sm font-semibold text-[var(--color-text-primary)] truncate flex-1">
          {title}
        </h3>
        <span className="text-xs text-[var(--color-text-tertiary)] tabular-nums">
          {itemCount}
        </span>
      </div>

      {showContent && (
        <div className="flex flex-col gap-2 mt-2">
          {children}

          {/* Abridged: "See N more" / "Key points only" toggle */}
          {abridged && hiddenCount > 0 && !isExpanded && (
            <button
              onClick={() => onToggleExpand(sectionKey)}
              className="flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline py-1"
            >
              <ChevronDown size={14} />
              See {hiddenCount} more
            </button>
          )}
          {abridged && isExpanded && hiddenCount > 0 && (
            <button
              onClick={() => onToggleExpand(sectionKey)}
              className="flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline py-1"
            >
              <ChevronRight size={14} />
              Key points only
            </button>
          )}
        </div>
      )}
    </div>
  )
}

/** Filter items for abridged display within a section */
export function getAbridgedItems<T extends { is_key_point: boolean; is_hearted: boolean }>(
  items: T[],
  isExpanded: boolean
): { visible: T[]; hiddenCount: number } {
  if (isExpanded) return { visible: items, hiddenCount: 0 }

  const keyOrHearted = items.filter(i => i.is_key_point || i.is_hearted)
  if (keyOrHearted.length > 0) {
    return { visible: keyOrHearted, hiddenCount: items.length - keyOrHearted.length }
  }
  // Fallback: show first 2
  const fallback = items.slice(0, 2)
  return { visible: fallback, hiddenCount: items.length - fallback.length }
}
