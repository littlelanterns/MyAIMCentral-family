/**
 * TaskIconPicker — Build M Sub-phase B
 *
 * Inline icon picker rendered inside TaskCreationModal whenever any
 * selected assignee is a Play member. Shows up to 8 auto-suggested
 * paper-craft thumbnails based on the live task title (debounced
 * embedding refine kicks in after 500ms via useTaskIconSuggestions).
 *
 * Mom can:
 *   • Tap a thumbnail to select that icon (stored on the task)
 *   • Tap "Browse all" to open the full-screen TaskIconBrowser
 *   • Clear the selection by tapping the currently selected thumbnail
 *
 * If mom never interacts with the picker, the top auto-match is
 * assigned at save time inside TaskCreationModal's onSave handler.
 *
 * Hides itself when assigneeIsPlayMember = false.
 */

import { useState } from 'react'
import { Search, X } from 'lucide-react'
import { useTaskIconSuggestions } from '@/hooks/useTaskIconSuggestions'
import { TaskIconBrowser } from './TaskIconBrowser'
import type { TaskIconPickerProps, TaskIconSuggestion } from '@/types/play-dashboard'

export function TaskIconPicker({
  currentIcon,
  taskTitle,
  category,
  onChange,
  assigneeIsPlayMember,
}: TaskIconPickerProps) {
  const [browserOpen, setBrowserOpen] = useState(false)
  const { results, isLoading, isRefining, hasEmbeddingResults } =
    useTaskIconSuggestions(taskTitle, category, assigneeIsPlayMember)

  // Hide entirely when no Play assignee selected
  if (!assigneeIsPlayMember) return null

  function handleSelect(icon: TaskIconSuggestion) {
    if (currentIcon?.asset_key === icon.asset_key && currentIcon?.variant === icon.variant) {
      // Tap-to-deselect
      onChange(null)
    } else {
      onChange(icon)
    }
  }

  const showBlankState = taskTitle.trim().length < 3

  return (
    <div
      style={{
        padding: '0.75rem',
        borderRadius: 'var(--vibe-radius-card, 0.75rem)',
        backgroundColor: 'var(--color-bg-secondary)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '0.5rem',
        }}
      >
        <div
          style={{
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            color: 'var(--color-text-primary)',
          }}
        >
          Pick an icon for this task
          {hasEmbeddingResults && (
            <span
              style={{
                marginLeft: '0.5rem',
                fontSize: '0.6875rem',
                fontWeight: 500,
                color: 'var(--color-text-secondary)',
              }}
              aria-label="Smart match active"
            >
              ✨ smart match
            </span>
          )}
          {isRefining && !hasEmbeddingResults && (
            <span
              style={{
                marginLeft: '0.5rem',
                fontSize: '0.6875rem',
                fontWeight: 500,
                color: 'var(--color-text-secondary)',
              }}
              aria-label="Refining suggestions"
            >
              refining…
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setBrowserOpen(true)}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.25rem',
            padding: '0.25rem 0.625rem',
            borderRadius: '9999px',
            fontSize: 'var(--font-size-xs)',
            fontWeight: 500,
            color: 'var(--color-btn-primary-bg)',
            backgroundColor: 'transparent',
            border: '1px solid var(--color-btn-primary-bg)',
            cursor: 'pointer',
          }}
        >
          <Search size={12} />
          Browse all
        </button>
      </div>

      {showBlankState ? (
        <p
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-secondary)',
            margin: 0,
            padding: '0.5rem 0',
          }}
        >
          Type the task name to see suggested icons.
        </p>
      ) : isLoading && results.length === 0 ? (
        <div
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-secondary)',
            padding: '0.5rem 0',
          }}
        >
          Finding icons…
        </div>
      ) : results.length === 0 ? (
        <p
          style={{
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-secondary)',
            margin: 0,
            padding: '0.5rem 0',
          }}
        >
          No matches yet. Tap <strong>Browse all</strong> to pick one manually.
        </p>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))',
            gap: '0.5rem',
          }}
        >
          {results.map(icon => {
            const isSelected =
              currentIcon?.asset_key === icon.asset_key &&
              currentIcon?.variant === icon.variant
            return (
              <button
                key={`${icon.asset_key}::${icon.variant}`}
                type="button"
                onClick={() => handleSelect(icon)}
                aria-label={icon.display_name}
                aria-pressed={isSelected}
                style={{
                  position: 'relative',
                  aspectRatio: '1',
                  padding: '0.25rem',
                  borderRadius: 'var(--vibe-radius-input, 0.5rem)',
                  backgroundColor: 'var(--color-bg-card)',
                  border: isSelected
                    ? '2px solid var(--color-btn-primary-bg)'
                    : '1px solid var(--color-border)',
                  cursor: 'pointer',
                  overflow: 'hidden',
                  transition: 'transform 0.15s ease',
                }}
              >
                <img
                  src={icon.size_128_url}
                  alt={icon.display_name}
                  style={{
                    width: '100%',
                    height: '100%',
                    objectFit: 'contain',
                    pointerEvents: 'none',
                  }}
                  loading="lazy"
                />
                {isSelected && (
                  <span
                    style={{
                      position: 'absolute',
                      top: 2,
                      right: 2,
                      width: 16,
                      height: 16,
                      borderRadius: '9999px',
                      backgroundColor: 'var(--color-btn-primary-bg)',
                      color: 'var(--color-btn-primary-text, #fff)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 10,
                      fontWeight: 700,
                    }}
                    aria-hidden="true"
                  >
                    ✓
                  </span>
                )}
              </button>
            )
          })}
        </div>
      )}

      {currentIcon && (
        <div
          style={{
            marginTop: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 'var(--font-size-xs)',
            color: 'var(--color-text-secondary)',
          }}
        >
          <span>
            Selected: <strong>{currentIcon.display_name}</strong>
          </span>
          <button
            type="button"
            onClick={() => onChange(null)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.125rem 0.5rem',
              borderRadius: '9999px',
              fontSize: '0.6875rem',
              color: 'var(--color-text-secondary)',
              backgroundColor: 'transparent',
              border: '1px solid var(--color-border)',
              cursor: 'pointer',
            }}
          >
            <X size={10} />
            Clear
          </button>
        </div>
      )}

      <TaskIconBrowser
        isOpen={browserOpen}
        onClose={() => setBrowserOpen(false)}
        currentSelection={currentIcon}
        initialQuery={taskTitle}
        onSelect={icon => {
          onChange(icon)
          setBrowserOpen(false)
        }}
      />
    </div>
  )
}
