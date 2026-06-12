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

import { useEffect, useState } from 'react'
import { Search, Sparkles, X, ChevronDown, ChevronUp } from 'lucide-react'
import {
  useTaskIconSuggestions,
  REWARD_ASSET_CATEGORIES,
  GOOD_MATCH_SIMILARITY,
} from '@/hooks/useTaskIconSuggestions'
import { useAssetMissLogger } from '@/hooks/useAssetMissLogger'
import { TaskIconBrowser } from './TaskIconBrowser'
import type { TaskIconPickerProps, TaskIconSuggestion } from '@/types/play-dashboard'

/** Inline strip shows this many; "View more" expands to the full semantic-ordered list */
const INLINE_SUGGESTION_COUNT = 8

export function TaskIconPicker({
  currentIcon,
  taskTitle,
  category,
  onChange,
  assigneeIsPlayMember,
}: TaskIconPickerProps) {
  const [browserOpen, setBrowserOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)
  // Founder direction (2026-06-12): task icons also draw from tool icons +
  // sign-in pictures, same pool as reward images
  const { results, isLoading, isRefining, hasEmbeddingResults, topSimilarity, isSettled } =
    useTaskIconSuggestions(taskTitle, category, assigneeIsPlayMember, REWARD_ASSET_CATEGORIES)
  const logMiss = useAssetMissLogger()

  // Weak-match: the library has nothing great for this term — say so honestly
  // and record the term so the founder can add the missing image later.
  const isWeakMatch =
    isSettled && (results.length === 0 || (topSimilarity !== null && topSimilarity < GOOD_MATCH_SIMILARITY))
  useEffect(() => {
    if (assigneeIsPlayMember && isWeakMatch) {
      logMiss(taskTitle, 'task_icon', topSimilarity)
    }
  }, [assigneeIsPlayMember, isWeakMatch, taskTitle, topSimilarity, logMiss])

  // Hide entirely when no Play assignee selected
  if (!assigneeIsPlayMember) return null

  const visibleResults = showAll ? results : results.slice(0, INLINE_SUGGESTION_COUNT)

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
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.2rem',
              }}
              aria-label="Smart match active"
            >
              <Sparkles size={11} style={{ color: 'var(--color-btn-primary-bg)' }} />
              smart match
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
          We don't have an image for that yet — we've made a note to add one!
          Tap <strong>Browse all</strong> to pick one manually.
        </p>
      ) : (
        <>
        {isWeakMatch && (
          <p
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-secondary)',
              margin: '0 0 0.5rem 0',
            }}
          >
            We don't have that exact image yet (we've made a note to add one) —
            here's the closest we have:
          </p>
        )}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(64px, 1fr))',
            gap: '0.5rem',
          }}
        >
          {visibleResults.map(icon => {
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
        {/* View more — expands to the full list, already in semantic-match order */}
        {results.length > INLINE_SUGGESTION_COUNT && (
          <button
            type="button"
            onClick={() => setShowAll(!showAll)}
            style={{
              marginTop: '0.5rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.25rem 0.625rem',
              borderRadius: '9999px',
              fontSize: 'var(--font-size-xs)',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              backgroundColor: 'transparent',
              border: '1px solid var(--color-border)',
              cursor: 'pointer',
            }}
          >
            {showAll ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            {showAll ? 'Show fewer' : `View more (${results.length - INLINE_SUGGESTION_COUNT})`}
          </button>
        )}
        </>
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
