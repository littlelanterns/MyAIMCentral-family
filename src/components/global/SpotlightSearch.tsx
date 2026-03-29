/**
 * SpotlightSearch — Cmd+K / Ctrl+K global search modal.
 *
 * Transient modal (ModalV2, size md) with search-input-as-header.
 * Searches features (instant), tasks, lists, calendar events,
 * victories, and family members (debounced 200ms).
 *
 * Spec: specs/Remaining-Implementation-Specs.md → Spec 2
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import {
  Search, CheckSquare, Calendar, List, Trophy, Users, X,
} from 'lucide-react'
import {
  useSpotlightSearch,
  type FeatureResult,
  type TaskResult,
  type ListResult,
  type CalendarEventResult,
  type VictoryResult,
  type MemberResult,
  type SearchResult,
} from '@/hooks/useSpotlightSearch'

interface SpotlightSearchProps {
  isOpen: boolean
  onClose: () => void
}

export function SpotlightSearch({ isOpen, onClose }: SpotlightSearchProps) {
  const navigate = useNavigate()
  const { query, search, results, hasResults, clearQuery } = useSpotlightSearch()
  const inputRef = useRef<HTMLInputElement>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)

  // Build flat result list for keyboard navigation
  const flatResults: SearchResult[] = [
    ...results.features,
    ...results.tasks,
    ...results.lists,
    ...results.calendarEvents,
    ...results.victories,
    ...results.members,
  ]

  // Focus input when opened
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50)
    }
    if (isOpen) {
      clearQuery()
      setSelectedIndex(0)
    }
  }, [isOpen, clearQuery])

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0)
  }, [query])

  const handleSelect = useCallback((result: SearchResult) => {
    onClose()
    switch (result.type) {
      case 'feature':
        navigate((result as FeatureResult).route)
        break
      case 'task':
        navigate(`/tasks?highlight=${(result as TaskResult).id}`)
        break
      case 'list':
        navigate(`/lists?open=${(result as ListResult).id}`)
        break
      case 'calendar_event':
        navigate(`/calendar?date=${(result as CalendarEventResult).event_date}`)
        break
      case 'victory':
        navigate(`/victories?highlight=${(result as VictoryResult).id}`)
        break
      case 'member':
        navigate(`/family-context?member=${(result as MemberResult).id}`)
        break
    }
  }, [navigate, onClose])

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, flatResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && flatResults[selectedIndex]) {
      e.preventDefault()
      handleSelect(flatResults[selectedIndex])
    } else if (e.key === 'Escape') {
      if (query) {
        clearQuery()
      } else {
        onClose()
      }
    }
  }, [flatResults, selectedIndex, handleSelect, query, clearQuery, onClose])

  if (!isOpen) return null

  return createPortal(
    <div
      className="fixed inset-0 flex items-start justify-center pt-[15vh]"
      style={{ zIndex: 'var(--z-modal-backdrop, 50)' }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: 'var(--color-bg-overlay, rgba(0,0,0,0.5))' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="relative w-full max-w-[640px] mx-4 rounded-xl overflow-hidden"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
          boxShadow: 'var(--shadow-xl, 0 20px 60px rgba(0,0,0,0.3))',
          zIndex: 'var(--z-modal-content, 55)',
          maxHeight: '70vh',
        }}
      >
        {/* Search input header */}
        <div
          className="flex items-center gap-3 px-4 py-3"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <Search size={18} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => search(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search MyAIM..."
            className="flex-1 text-base bg-transparent outline-none"
            style={{ color: 'var(--color-text-primary)', border: 'none' }}
          />
          {query && (
            <button
              onClick={clearQuery}
              className="flex items-center justify-center rounded-full"
              style={{
                width: '24px',
                height: '24px',
                background: 'var(--color-bg-secondary)',
                color: 'var(--color-text-secondary)',
                border: 'none',
                minHeight: 'unset',
                cursor: 'pointer',
              }}
            >
              <X size={12} />
            </button>
          )}
          <kbd
            className="hidden md:inline-block text-[10px] px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
            }}
          >
            esc
          </kbd>
        </div>

        {/* Results */}
        <div className="overflow-y-auto" style={{ maxHeight: 'calc(70vh - 56px)' }}>
          {!query && (
            <div className="px-4 py-6 text-center">
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Type to search features, tasks, lists, events, and more
              </p>
            </div>
          )}

          {query && !hasResults && !results.isLoading && (
            <div className="px-4 py-6 text-center">
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                No results for "{query}". Try a different search term.
              </p>
            </div>
          )}

          {query && results.isLoading && !hasResults && (
            <div className="px-4 py-6 text-center">
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Searching...
              </p>
            </div>
          )}

          {/* Feature results */}
          {results.features.length > 0 && (
            <ResultSection title="Features">
              {results.features.map((f, i) => {
                const globalIdx = i
                const Icon = f.icon
                return (
                  <ResultRow
                    key={f.key}
                    selected={selectedIndex === globalIdx}
                    onClick={() => handleSelect(f)}
                  >
                    <Icon size={16} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>{f.name}</span>
                      <span className="text-xs ml-2" style={{ color: 'var(--color-text-secondary)' }}>{f.description}</span>
                    </div>
                  </ResultRow>
                )
              })}
            </ResultSection>
          )}

          {/* Task results */}
          {results.tasks.length > 0 && (
            <ResultSection title="Tasks">
              {results.tasks.map((t, i) => {
                const globalIdx = results.features.length + i
                return (
                  <ResultRow
                    key={t.id}
                    selected={selectedIndex === globalIdx}
                    onClick={() => handleSelect(t)}
                  >
                    <CheckSquare size={14} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
                    <div className="flex-1 min-w-0">
                      <span className="text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>{t.title}</span>
                      {t.due_date && (
                        <span className="text-xs ml-2" style={{ color: 'var(--color-text-secondary)' }}>due {t.due_date}</span>
                      )}
                    </div>
                  </ResultRow>
                )
              })}
            </ResultSection>
          )}

          {/* List results */}
          {results.lists.length > 0 && (
            <ResultSection title="Lists">
              {results.lists.map((l, i) => {
                const globalIdx = results.features.length + results.tasks.length + i
                return (
                  <ResultRow
                    key={l.id}
                    selected={selectedIndex === globalIdx}
                    onClick={() => handleSelect(l)}
                  >
                    <List size={14} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
                    <span className="text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>{l.title}</span>
                    <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{l.item_count} items</span>
                  </ResultRow>
                )
              })}
            </ResultSection>
          )}

          {/* Calendar event results */}
          {results.calendarEvents.length > 0 && (
            <ResultSection title="Events">
              {results.calendarEvents.map((e, i) => {
                const globalIdx = results.features.length + results.tasks.length + results.lists.length + i
                return (
                  <ResultRow
                    key={e.id}
                    selected={selectedIndex === globalIdx}
                    onClick={() => handleSelect(e)}
                  >
                    <Calendar size={14} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
                    <span className="text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>{e.title}</span>
                    <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{e.event_date}</span>
                  </ResultRow>
                )
              })}
            </ResultSection>
          )}

          {/* Victory results */}
          {results.victories.length > 0 && (
            <ResultSection title="Victories">
              {results.victories.map((v, i) => {
                const globalIdx = results.features.length + results.tasks.length + results.lists.length + results.calendarEvents.length + i
                return (
                  <ResultRow
                    key={v.id}
                    selected={selectedIndex === globalIdx}
                    onClick={() => handleSelect(v)}
                  >
                    <Trophy size={14} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
                    <span className="text-sm truncate" style={{ color: 'var(--color-text-primary)' }}>{v.title}</span>
                    <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {new Date(v.created_at).toLocaleDateString()}
                    </span>
                  </ResultRow>
                )
              })}
            </ResultSection>
          )}

          {/* Member results */}
          {results.members.length > 0 && (
            <ResultSection title="People">
              {results.members.map((m, i) => {
                const globalIdx = results.features.length + results.tasks.length + results.lists.length + results.calendarEvents.length + results.victories.length + i
                return (
                  <ResultRow
                    key={m.id}
                    selected={selectedIndex === globalIdx}
                    onClick={() => handleSelect(m)}
                  >
                    <Users size={14} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
                    <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{m.display_name}</span>
                    <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>({m.role})</span>
                  </ResultRow>
                )
              })}
            </ResultSection>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}

// ─── Sub-Components ──────────────────────────────────────────

function ResultSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-1">
      <div className="px-4 py-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
          {title}
        </span>
      </div>
      {children}
    </div>
  )
}

function ResultRow({ selected, onClick, children }: { selected: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 px-4 py-2 text-left transition-colors"
      style={{
        backgroundColor: selected ? 'var(--color-bg-secondary)' : 'transparent',
        border: 'none',
        cursor: 'pointer',
        minHeight: 'unset',
      }}
    >
      {children}
    </button>
  )
}

// ─── Global Keyboard Listener ────────────────────────────────

/** Register Cmd+K / Ctrl+K listener. Call from a top-level layout component. */
export function useSpotlightShortcut(onOpen: () => void) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        onOpen()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onOpen])
}
