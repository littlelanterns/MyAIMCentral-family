import { useState } from 'react'
import { BookOpen, Plus, Pencil, Trash2, Eye, EyeOff, Lock } from 'lucide-react'
import { FeatureIcon } from '@/components/shared'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import {
  useJournalEntries,
  useCreateJournalEntry,
  useUpdateJournalEntry,
  useDeleteJournalEntry,
  JOURNAL_ENTRY_TYPES,
} from '@/hooks/useJournal'
import type { JournalEntry, JournalEntryType, JournalVisibility } from '@/hooks/useJournal'

const VISIBILITY_OPTIONS: { value: JournalVisibility; label: string; icon: typeof Lock }[] = [
  { value: 'private', label: 'Private', icon: Lock },
  { value: 'shared_parents', label: 'Parents Only', icon: EyeOff },
  { value: 'family', label: 'Family', icon: Eye },
]

export function JournalPage() {
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { data: entries = [], isLoading } = useJournalEntries(member?.id)
  const createEntry = useCreateJournalEntry()
  const updateEntry = useUpdateJournalEntry()
  const deleteEntry = useDeleteJournalEntry()

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<JournalEntry | null>(null)
  const [formType, setFormType] = useState<JournalEntryType>('free_write')
  const [formContent, setFormContent] = useState('')
  const [formVisibility, setFormVisibility] = useState<JournalVisibility>('private')
  const [filterType, setFilterType] = useState<JournalEntryType | 'all'>('all')

  function resetForm() {
    setFormType('free_write')
    setFormContent('')
    setFormVisibility('private')
    setShowCreate(false)
    setEditing(null)
  }

  async function handleCreate() {
    if (!member || !family || !formContent.trim()) return
    await createEntry.mutateAsync({
      family_id: family.id,
      member_id: member.id,
      entry_type: formType,
      content: formContent.trim(),
      visibility: formVisibility,
    })
    resetForm()
  }

  async function handleUpdate() {
    if (!editing || !formContent.trim()) return
    await updateEntry.mutateAsync({
      id: editing.id,
      entry_type: formType,
      content: formContent.trim(),
      visibility: formVisibility,
    })
    resetForm()
  }

  async function handleDelete(entry: JournalEntry) {
    if (!member) return
    await deleteEntry.mutateAsync({ id: entry.id, memberId: member.id })
  }

  function startEdit(entry: JournalEntry) {
    setEditing(entry)
    setFormType(entry.entry_type)
    setFormContent(entry.content)
    setFormVisibility(entry.visibility)
  }

  const filtered = filterType === 'all'
    ? entries
    : entries.filter(e => e.entry_type === filterType)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FeatureIcon featureKey="journal" fallback={<BookOpen size={32} style={{ color: 'var(--color-btn-primary-bg)' }} />} size={32} />
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
          >
            Journal
          </h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{
            backgroundColor: 'var(--color-btn-primary-bg)',
            color: 'var(--color-btn-primary-text)',
          }}
        >
          <Plus size={16} />
          New Entry
        </button>
      </div>

      {/* Type Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterType('all')}
          className="px-3 py-1.5 rounded-lg text-sm whitespace-nowrap"
          style={{
            backgroundColor: filterType === 'all' ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-card)',
            color: filterType === 'all' ? 'var(--color-btn-primary-text)' : 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
          }}
        >
          All ({entries.length})
        </button>
        {JOURNAL_ENTRY_TYPES.slice(0, 5).map(type => {
          const count = entries.filter(e => e.entry_type === type.value).length
          if (count === 0 && filterType !== type.value) return null
          return (
            <button
              key={type.value}
              onClick={() => setFilterType(type.value)}
              className="px-3 py-1.5 rounded-lg text-sm whitespace-nowrap"
              style={{
                backgroundColor: filterType === type.value ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-card)',
                color: filterType === type.value ? 'var(--color-btn-primary-text)' : 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
              }}
            >
              {type.label} ({count})
            </button>
          )
        })}
      </div>

      {/* Create / Edit Form */}
      {(showCreate || editing) && (
        <div
          className="p-4 rounded-lg space-y-3"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <h2 className="text-lg font-medium" style={{ color: 'var(--color-text-heading)' }}>
            {editing ? 'Edit Entry' : 'New Journal Entry'}
          </h2>
          <div className="flex gap-3">
            <select
              value={formType}
              onChange={(e) => setFormType(e.target.value as JournalEntryType)}
              className="flex-1 px-3 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            >
              {JOURNAL_ENTRY_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
            <select
              value={formVisibility}
              onChange={(e) => setFormVisibility(e.target.value as JournalVisibility)}
              className="px-3 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
            >
              {VISIBILITY_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <textarea
            placeholder="Write freely..."
            value={formContent}
            onChange={(e) => setFormContent(e.target.value)}
            rows={6}
            className="w-full px-3 py-2 rounded-lg text-sm resize-none"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          />
          <div className="flex gap-2 justify-end">
            <button
              onClick={resetForm}
              className="px-3 py-1.5 rounded-lg text-sm"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Cancel
            </button>
            <button
              onClick={editing ? handleUpdate : handleCreate}
              disabled={!formContent.trim()}
              className="px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{
                backgroundColor: 'var(--color-btn-primary-bg)',
                color: 'var(--color-btn-primary-text)',
              }}
            >
              {editing ? 'Save' : 'Create'}
            </button>
          </div>
        </div>
      )}

      {/* Entries */}
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
              ? 'Your journal awaits. Capture a thought, reflection, or memory.'
              : 'No entries of this type yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => {
            const typeLabel = JOURNAL_ENTRY_TYPES.find(t => t.value === entry.entry_type)?.label ?? entry.entry_type
            const VisIcon = VISIBILITY_OPTIONS.find(v => v.value === entry.visibility)?.icon ?? Lock

            return (
              <div
                key={entry.id}
                className="p-4 rounded-lg"
                style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="px-2 py-0.5 rounded text-xs"
                        style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}
                      >
                        {typeLabel}
                      </span>
                      <VisIcon size={12} style={{ color: 'var(--color-text-secondary)' }} />
                      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {new Date(entry.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap" style={{ color: 'var(--color-text-primary)' }}>
                      {entry.content}
                    </p>
                    {entry.tags.length > 0 && (
                      <div className="flex gap-1 mt-2">
                        {entry.tags.map(tag => (
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
                  </div>
                  <div className="flex gap-1">
                    <button onClick={() => startEdit(entry)} className="p-1.5 rounded" style={{ color: 'var(--color-text-secondary)' }}>
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(entry)} className="p-1.5 rounded" style={{ color: 'var(--color-text-secondary)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
