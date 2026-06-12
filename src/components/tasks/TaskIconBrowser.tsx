/**
 * TaskIconBrowser — Build M Sub-phase B
 *
 * Full-screen ModalV2 for browsing the entire visual_schedule library
 * when the inline TaskIconPicker auto-suggestions don't include what
 * mom is looking for.
 *
 * Behavior:
 *   - Empty query → show ALL variant-B visual_schedule icons sorted by
 *     display_name. True "browse all" — no short-circuit.
 *   - Typed query → union of (ILIKE on display_name/description) +
 *     (JSONB tag contains) + (embedding search at threshold 0.3),
 *     deduped with literal matches ranked first.
 *
 * Uses `useTaskIconBrowseSearch` — a separate hook from the inline
 * auto-suggest (useTaskIconSuggestions). The auto-suggest is
 * precision-focused; this browse surface is recall-focused.
 */

import { useEffect, useState } from 'react'
import { ImageIcon } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { useTaskIconBrowseSearch } from '@/hooks/useTaskIconBrowseSearch'
import { useAssetMissLogger } from '@/hooks/useAssetMissLogger'
import type { TaskIconSuggestion } from '@/types/play-dashboard'

interface TaskIconBrowserProps {
  isOpen: boolean
  onClose: () => void
  currentSelection: TaskIconSuggestion | null
  initialQuery: string
  onSelect: (icon: TaskIconSuggestion) => void
}

export function TaskIconBrowser({
  isOpen,
  onClose,
  currentSelection,
  initialQuery,
  onSelect,
}: TaskIconBrowserProps) {
  const [query, setQuery] = useState(initialQuery)
  const { results, isLoading, isFetching } = useTaskIconBrowseSearch(query, isOpen)
  const trimmed = query.trim()
  const logMiss = useAssetMissLogger()

  // Founder (2026-06-12): record searches we have no image for, so the
  // asset pipeline knows what to add next
  const isMiss = isOpen && !isLoading && !isFetching && trimmed.length >= 3 && results.length === 0
  useEffect(() => {
    if (isMiss) logMiss(trimmed, 'icon_browse', null)
  }, [isMiss, trimmed, logMiss])

  return (
    <ModalV2
      id="task-icon-browser"
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="lg"
      title="Browse all icons"
      subtitle="Paper craft images from the family library"
      icon={ImageIcon}
    >
      <div
        className="density-comfortable"
        style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}
      >
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search for an icon, or leave blank to browse all…"
          autoFocus
          style={{
            width: '100%',
            padding: '0.625rem 0.875rem',
            borderRadius: 'var(--vibe-radius-input, 0.5rem)',
            border: '1px solid var(--color-border)',
            backgroundColor: 'var(--color-bg-card)',
            color: 'var(--color-text-primary)',
            fontSize: 'var(--font-size-sm)',
          }}
        />

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-secondary)',
          }}
        >
          <span>
            {isLoading
              ? 'Loading…'
              : trimmed.length === 0
                ? `Browsing all ${results.length} icon${results.length === 1 ? '' : 's'}`
                : results.length === 0
                  ? 'No matches'
                  : `${results.length} match${results.length === 1 ? '' : 'es'}`}
          </span>
          {isFetching && !isLoading && <span>refreshing…</span>}
        </div>

        {results.length === 0 && !isLoading ? (
          <div
            style={{
              padding: '2rem 1rem',
              textAlign: 'center',
              color: 'var(--color-text-secondary)',
              fontSize: 'var(--font-size-sm)',
            }}
          >
            {trimmed.length === 0
              ? 'No icons in the library yet.'
              : "We don't have an image for that yet — we've made a note to add one! Try a different word, like the noun (\"teeth\", \"lunch\", \"bath\")."}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(96px, 1fr))',
              gap: '0.75rem',
              maxHeight: '60vh',
              overflowY: 'auto',
              padding: '0.25rem',
            }}
          >
            {results.map(icon => {
              const isSelected =
                currentSelection?.asset_key === icon.asset_key &&
                currentSelection?.variant === icon.variant
              return (
                /* Founder (2026-06-12): no visible titles — the image should
                   speak for itself, not be limited by our naming. Name stays
                   on aria-label (screen readers) only. */
                <button
                  key={`${icon.asset_key}::${icon.variant}`}
                  type="button"
                  onClick={() => onSelect(icon)}
                  aria-label={icon.display_name}
                  aria-pressed={isSelected}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    padding: '0.5rem',
                    borderRadius: 'var(--vibe-radius-card, 0.75rem)',
                    backgroundColor: 'var(--color-bg-card)',
                    border: isSelected
                      ? '2px solid var(--color-btn-primary-bg)'
                      : '1px solid var(--color-border)',
                    cursor: 'pointer',
                    transition: 'transform 0.15s ease',
                  }}
                >
                  <img
                    src={icon.size_128_url}
                    alt=""
                    style={{
                      width: '72px',
                      height: '72px',
                      objectFit: 'contain',
                      pointerEvents: 'none',
                    }}
                    loading="lazy"
                  />
                </button>
              )
            })}
          </div>
        )}
      </div>
    </ModalV2>
  )
}
