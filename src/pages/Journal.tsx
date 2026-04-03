/**
 * Journal Page — Read-only timeline view (PRD-08 + Founder directive B)
 *
 * The Journal is a beautiful read-only surface. It is NOT a writing surface.
 * - The + button opens Smart Notepad (right drawer)
 * - Tapping an entry opens a read view
 * - "Edit" reopens the entry content in Smart Notepad for editing
 * - All writing/capture happens in Smart Notepad, routed here
 */

import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { BookOpen, Plus, Pencil, Trash2, Eye, EyeOff, Lock, X } from 'lucide-react'
import { FeatureIcon } from '@/components/shared'
import { HScrollArrows } from '@/components/shared/HScrollArrows'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { useNotepadContext } from '@/components/notepad/NotepadContext'
import {
  useJournalEntries,
  useDeleteJournalEntry,
  JOURNAL_ENTRY_TYPES,
} from '@/hooks/useJournal'
import type { JournalEntry, JournalEntryType } from '@/hooks/useJournal'

const VISIBILITY_ICONS: Record<string, typeof Lock> = {
  private: Lock,
  shared_parents: EyeOff,
  family: Eye,
}

export function JournalPage() {
  const { data: member } = useFamilyMember()
  const { data: _family } = useFamily()
  const { isViewingAs, viewingAsMember } = useViewAs()
  const activeMember = isViewingAs && viewingAsMember ? viewingAsMember : member
  const { data: rawEntries = [], isLoading } = useJournalEntries(activeMember?.id)
  // PRD-20: In View As mode, filter out private journal entries
  const entries = isViewingAs
    ? rawEntries.filter((e) => (e as { visibility?: string }).visibility !== 'private')
    : rawEntries
  const deleteEntry = useDeleteJournalEntry()
  const { openNotepad } = useNotepadContext()
  const location = useLocation()

  const [expandedEntry, setExpandedEntry] = useState<JournalEntry | null>(null)

  // Map sub-routes to filter types (PRD-04 journal container routes)
  const routeFilterMap: Record<string, JournalEntryType | 'all'> = {
    '/journal': 'all',
    '/journal/reflections': 'reflection',
    '/journal/commonplace': 'commonplace',
    '/journal/gratitude': 'gratitude',
    '/journal/kid-quips': 'kid_quips',
  }
  const initialFilter = routeFilterMap[location.pathname] || 'all'

  const [filterType, setFilterType] = useState<JournalEntryType | 'all'>(initialFilter)

  useEffect(() => {
    const mapped = routeFilterMap[location.pathname]
    if (mapped !== undefined) setFilterType(mapped)
  }, [location.pathname])

  function handleNewEntry() {
    // + button opens Smart Notepad (Founder directive B)
    openNotepad()
  }

  function handleEditEntry(entry: JournalEntry) {
    // Edit opens entry content in Smart Notepad
    openNotepad({ content: entry.content, title: entry.entry_type })
  }

  async function handleDelete(entry: JournalEntry) {
    if (!member) return
    await deleteEntry.mutateAsync({ id: entry.id, memberId: member.id })
    if (expandedEntry?.id === entry.id) setExpandedEntry(null)
  }

  const filtered = filterType === 'all'
    ? entries
    : entries.filter(e => e.entry_type === filterType)

  // Group by date
  const grouped = groupByDate(filtered)

  return (
    <div className="density-comfortable max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FeatureIcon featureKey="journal" fallback={<BookOpen size={40} style={{ color: 'var(--color-btn-primary-bg)' }} />} size={40} className="!w-10 !h-10 md:!w-36 md:!h-36" assetSize={512} />
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
          >
            Journal
          </h1>
        </div>
        <button
          onClick={handleNewEntry}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{
            background: 'var(--surface-primary, var(--color-btn-primary-bg))',
            color: 'var(--color-btn-primary-text)',
          }}
          title="Open Smart Notepad to write"
        >
          <Plus size={16} />
          New Entry
        </button>
      </div>

      {/* Type Filter with HScrollArrows */}
      <HScrollArrows>
        <div data-hscroll className="flex gap-2 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setFilterType('all')}
            className="px-3 py-1.5 rounded-lg text-sm whitespace-nowrap"
            style={{
              background: filterType === 'all' ? 'var(--surface-primary, var(--color-btn-primary-bg))' : 'var(--color-bg-card)',
              color: filterType === 'all' ? 'var(--color-btn-primary-text)' : 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
          >
            All ({entries.length})
          </button>
          {JOURNAL_ENTRY_TYPES.map(type => {
            const count = entries.filter(e => e.entry_type === type.value).length
            if (count === 0 && filterType !== type.value) return null
            return (
              <button
                key={type.value}
                onClick={() => setFilterType(type.value)}
                className="px-3 py-1.5 rounded-lg text-sm whitespace-nowrap"
                style={{
                  background: filterType === type.value ? 'var(--surface-primary, var(--color-btn-primary-bg))' : 'var(--color-bg-card)',
                  color: filterType === type.value ? 'var(--color-btn-primary-text)' : 'var(--color-text-primary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {type.label} ({count})
              </button>
            )
          })}
        </div>
      </HScrollArrows>

      {/* Expanded Entry Detail — read view with edit button */}
      {expandedEntry && (
        <div
          className="p-4 rounded-lg space-y-3"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span
                className="px-2 py-0.5 rounded text-xs"
                style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}
              >
                {JOURNAL_ENTRY_TYPES.find(t => t.value === expandedEntry.entry_type)?.label ?? expandedEntry.entry_type}
              </span>
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {new Date(expandedEntry.created_at).toLocaleDateString()}
              </span>
            </div>
            <button
              onClick={() => setExpandedEntry(null)}
              className="p-1 rounded"
              style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
            >
              <X size={14} />
            </button>
          </div>
          <div
            className="text-sm whitespace-pre-wrap"
            style={{ color: 'var(--color-text-primary)' }}
            dangerouslySetInnerHTML={{ __html: expandedEntry.content }}
          />
          {expandedEntry.tags.length > 0 && (
            <div className="flex gap-1">
              {expandedEntry.tags.map(tag => (
                <span
                  key={tag}
                  className="px-1.5 py-0.5 rounded text-xs"
                  style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
          <div className="flex gap-2 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <button
              onClick={() => handleEditEntry(expandedEntry)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
              style={{
                background: 'var(--surface-primary, var(--color-btn-primary-bg))',
                color: 'var(--color-btn-primary-text)',
              }}
            >
              <Pencil size={12} />
              Edit in Notepad
            </button>
            <button
              onClick={() => handleDelete(expandedEntry)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs"
              style={{ color: 'var(--color-text-secondary)', background: 'transparent' }}
            >
              <Trash2 size={12} />
              Delete
            </button>
          </div>
        </div>
      )}

      {/* Entries — read-only timeline */}
      {isLoading ? (
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <div
          className="p-8 rounded-lg text-center"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <BookOpen size={32} className="mx-auto mb-3" style={{ color: 'var(--color-text-secondary)' }} />
          <p style={{ color: 'var(--color-text-secondary)' }}>
            {filterType === 'all'
              ? 'Your journal awaits. Tap + to open Smart Notepad and capture a thought.'
              : 'No entries of this type yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(({ date, entries: dayEntries }) => (
            <div key={date}>
              <p
                className="text-xs font-medium mb-2 px-1"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {date}
              </p>
              <div className="space-y-2">
                {dayEntries.map((entry) => {
                  const typeLabel = JOURNAL_ENTRY_TYPES.find(t => t.value === entry.entry_type)?.label ?? entry.entry_type
                  const VisIcon = VISIBILITY_ICONS[entry.visibility] ?? Lock

                  return (
                    <button
                      key={entry.id}
                      onClick={() => setExpandedEntry(entry)}
                      className="w-full text-left p-4 rounded-lg transition-all hover:scale-[1.005]"
                      style={{
                        backgroundColor: 'var(--color-bg-card)',
                        border: expandedEntry?.id === entry.id
                          ? '2px solid var(--color-btn-primary-bg)'
                          : '1px solid var(--color-border)',
                        minHeight: 'unset',
                      }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="px-2 py-0.5 rounded text-xs"
                          style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}
                        >
                          {typeLabel}
                        </span>
                        <VisIcon size={12} style={{ color: 'var(--color-text-secondary)' }} />
                        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          {new Date(entry.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p
                        className="text-sm line-clamp-3"
                        style={{ color: 'var(--color-text-primary)' }}
                      >
                        {entry.content.replace(/<[^>]*>/g, '').slice(0, 200)}
                      </p>
                      {entry.tags.length > 0 && (
                        <div className="flex gap-1 mt-2">
                          {entry.tags.slice(0, 3).map(tag => (
                            <span
                              key={tag}
                              className="px-1.5 py-0.5 rounded text-xs"
                              style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

function groupByDate(entries: JournalEntry[]): { date: string; entries: JournalEntry[] }[] {
  const groups: Record<string, JournalEntry[]> = {}
  for (const entry of entries) {
    const date = new Date(entry.created_at).toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    if (!groups[date]) groups[date] = []
    groups[date].push(entry)
  }
  return Object.entries(groups).map(([date, entries]) => ({ date, entries }))
}
