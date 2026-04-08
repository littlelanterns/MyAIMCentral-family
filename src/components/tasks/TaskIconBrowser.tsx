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

import { useState } from 'react'
import { ImageIcon } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { useTaskIconBrowseSearch } from '@/hooks/useTaskIconBrowseSearch'
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

  return (
    <ModalV2
      id="task-icon-browser"
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="lg"
      title="Browse all icons"
      subtitle="Paper craft icons from the visual schedule library"
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
              : 'No icons match yet. Try a different word — like the noun ("teeth", "lunch", "bath").'}
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
                    gap: '0.25rem',
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
                    alt={icon.display_name}
                    style={{
                      width: '64px',
                      height: '64px',
                      objectFit: 'contain',
                      pointerEvents: 'none',
                    }}
                    loading="lazy"
                  />
                  <span
                    style={{
                      fontSize: '0.6875rem',
                      color: 'var(--color-text-secondary)',
                      textAlign: 'center',
                      lineHeight: 1.2,
                      maxWidth: '100%',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {icon.display_name}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>
    </ModalV2>
  )
}
