/**
 * JournalPromptsPage (PRD-23)
 * Personal journal prompt library. Prompts from BookShelf extractions + custom manual prompts.
 */
import { useState, useMemo } from 'react'
import { Plus, Search, X, BookOpen, CheckSquare, Archive, PenLine } from 'lucide-react'
import { useJournalPrompts } from '@/hooks/useJournalPrompts'
import { ModalV2, FeatureGuide } from '@/components/shared'
import type { JournalPrompt } from '@/types/bookshelf'

export function JournalPromptsPage() {
  const { prompts, loading, createPrompt, archivePrompt } = useJournalPrompts()
  const [search, setSearch] = useState('')
  const [bookFilter, setBookFilter] = useState<string | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Unique books from prompts
  const bookFilters = useMemo(() => {
    const books = new Map<string, number>()
    for (const p of prompts) {
      if (p.source_book_title) {
        books.set(p.source_book_title, (books.get(p.source_book_title) || 0) + 1)
      }
    }
    return Array.from(books.entries())
  }, [prompts])

  // Filtered prompts
  const filtered = useMemo(() => {
    let result = prompts
    if (bookFilter) {
      result = result.filter(p => p.source_book_title === bookFilter)
    }
    if (search) {
      const q = search.toLowerCase()
      result = result.filter(p =>
        p.prompt_text.toLowerCase().includes(q) ||
        p.source_book_title?.toLowerCase().includes(q) ||
        p.tags.some(t => t.toLowerCase().includes(q))
      )
    }
    return result
  }, [prompts, bookFilter, search])

  return (
    <div className="density-comfortable max-w-3xl mx-auto">
      <FeatureGuide
        featureKey="bookshelf_basic"
        title="Journal Prompts"
        description="Prompts extracted from your BookShelf books and custom prompts you create. Use these to spark journal entries, reflections, and discussions."
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-lg font-bold text-[var(--color-text-primary)]">Journal Prompts</h1>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--surface-primary)] text-[var(--color-text-on-primary,#fff)] text-sm"
        >
          <Plus size={16} /> Add Custom
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search prompts..."
          className="w-full pl-8 pr-8 py-2 text-sm rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5">
            <X size={14} className="text-[var(--color-text-tertiary)]" />
          </button>
        )}
      </div>

      {/* Book filter chips */}
      {bookFilters.length > 0 && (
        <div className="flex flex-wrap gap-1.5 mb-4">
          <button
            onClick={() => setBookFilter(null)}
            className={`px-2.5 py-1 rounded-full text-xs ${!bookFilter ? 'bg-[var(--surface-primary)] text-[var(--color-text-on-primary,#fff)]' : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]'}`}
          >
            All ({prompts.length})
          </button>
          {bookFilters.map(([title, count]) => (
            <button
              key={title}
              onClick={() => setBookFilter(bookFilter === title ? null : title)}
              className={`px-2.5 py-1 rounded-full text-xs truncate max-w-[200px] ${bookFilter === title ? 'bg-[var(--surface-primary)] text-[var(--color-text-on-primary,#fff)]' : 'bg-[var(--color-surface-secondary)] text-[var(--color-text-secondary)]'}`}
            >
              {title} ({count})
            </button>
          ))}
        </div>
      )}

      {/* Prompts list */}
      {loading ? (
        <div className="text-center py-12 text-[var(--color-text-tertiary)]">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-[var(--color-text-tertiary)]">
          <p className="text-sm">No journal prompts yet</p>
          <p className="text-xs mt-1">Save questions from BookShelf or create your own</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(prompt => (
            <JournalPromptCard
              key={prompt.id}
              prompt={prompt}
              onArchive={archivePrompt}
            />
          ))}
        </div>
      )}

      {/* Create custom prompt modal */}
      <CreatePromptModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSave={createPrompt}
      />
    </div>
  )
}

// ── Prompt Card ────────────────────────────────────────────────────────────

function JournalPromptCard({
  prompt, onArchive,
}: {
  prompt: JournalPrompt
  onArchive: (id: string) => Promise<void>
}) {
  const [archiving, setArchiving] = useState(false)

  return (
    <div className="p-3 rounded-lg bg-[var(--color-surface-secondary)] border border-[var(--color-border-subtle)]">
      <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
        {prompt.prompt_text}
      </p>

      {prompt.source_book_title && (
        <div className="flex items-center gap-1.5 mt-2 text-xs text-[var(--color-text-tertiary)]">
          <BookOpen size={12} />
          <span>From: {prompt.source_book_title}</span>
          {prompt.source_chapter_title && (
            <>
              <span>—</span>
              <span>{prompt.source_chapter_title}</span>
            </>
          )}
        </div>
      )}

      {prompt.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {prompt.tags.map(t => (
            <span key={t} className="text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--color-surface-tertiary)] text-[var(--color-text-tertiary)]">
              {t}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-2">
        <button
          onClick={() => {
            // Open notepad with prompt as context — navigate to notepad page with query param
            window.location.href = `/notepad?prompt=${encodeURIComponent(prompt.prompt_text)}`
          }}
          className="flex items-center gap-1 text-xs text-[var(--color-accent)] hover:underline"
        >
          <PenLine size={12} /> Write About This
        </button>

        <button
          onClick={() => {
            window.location.href = `/tasks?new=1&title=${encodeURIComponent(prompt.prompt_text.slice(0, 60))}&description=${encodeURIComponent(prompt.prompt_text)}&source=bookshelf`
          }}
          className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
        >
          <CheckSquare size={12} /> Send to Tasks
        </button>

        <button
          onClick={async () => {
            setArchiving(true)
            await onArchive(prompt.id)
            setArchiving(false)
          }}
          disabled={archiving}
          className="flex items-center gap-1 text-xs text-[var(--color-text-tertiary)] hover:text-[var(--color-error)] ml-auto"
        >
          <Archive size={12} /> Archive
        </button>
      </div>
    </div>
  )
}

// ── Create Prompt Modal ────────────────────────────────────────────────────

function CreatePromptModal({
  isOpen, onClose, onSave,
}: {
  isOpen: boolean
  onClose: () => void
  onSave: (data: { text: string; tags?: string[] }) => Promise<void>
}) {
  const [text, setText] = useState('')
  const [tags, setTags] = useState('')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!text.trim()) return
    setSaving(true)
    await onSave({
      text: text.trim(),
      tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
    })
    setSaving(false)
    setText('')
    setTags('')
    onClose()
  }

  return (
    <ModalV2
      id="create-journal-prompt"
      isOpen={isOpen}
      onClose={onClose}
      title="Add Custom Prompt"
      type="transient"
      size="md"
    >
      <div className="p-4 space-y-3">
        <div>
          <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">
            Prompt
          </label>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={4}
            placeholder="Write your reflection prompt..."
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] resize-none focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--color-text-secondary)] mb-1 block">
            Tags (comma-separated, optional)
          </label>
          <input
            value={tags}
            onChange={e => setTags(e.target.value)}
            placeholder="e.g., gratitude, growth, family"
            className="w-full px-3 py-2 text-sm rounded-lg border border-[var(--color-border-default)] bg-[var(--color-surface-primary)] text-[var(--color-text-primary)] focus:outline-none focus:ring-1 focus:ring-[var(--color-accent)]"
          />
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm text-[var(--color-text-secondary)]">
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!text.trim() || saving}
            className="px-4 py-2 text-sm rounded-lg bg-[var(--surface-primary)] text-[var(--color-text-on-primary,#fff)] disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </ModalV2>
  )
}
