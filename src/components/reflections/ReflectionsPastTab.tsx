import { useState } from 'react'
import { Clock, ChevronDown, Pencil } from 'lucide-react'
import { usePastResponses, useUpdateResponse, REFLECTION_CATEGORIES, type ReflectionCategory } from '@/hooks/useReflections'

interface ReflectionsPastTabProps {
  memberId: string
}

const PAGE_SIZE = 50

export function ReflectionsPastTab({ memberId }: ReflectionsPastTabProps) {
  const [offset, setOffset] = useState(0)
  const { data: responses = [], isLoading } = usePastResponses(memberId, PAGE_SIZE, offset)
  const updateResponse = useUpdateResponse()

  // NEW-EEE (bug 96f2d58e): inline edit of past responses for typo fixing.
  // Minimal scope — the full Reflections revamp is Follow-Up Build G.
  const [editingId, setEditingId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')

  function startEdit(id: string, currentText: string) {
    setEditingId(id)
    setDraft(currentText)
  }

  async function saveEdit(r: GroupedResponses['entries'][0]) {
    const trimmed = draft.trim()
    if (!trimmed || trimmed === r.response_text) {
      setEditingId(null)
      return
    }
    await updateResponse.mutateAsync({
      id: r.id,
      memberId,
      responseText: trimmed,
      journalEntryId: r.journal_entry_id,
      promptText: r.reflection_prompts.prompt_text,
      category: r.reflection_prompts.category as ReflectionCategory,
    })
    setEditingId(null)
  }

  if (isLoading && offset === 0) {
    return <p className="text-sm py-4" style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
  }

  if (responses.length === 0 && offset === 0) {
    return (
      <div
        className="p-8 rounded-lg text-center"
        style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
      >
        <Clock size={32} className="mx-auto mb-3" style={{ color: 'var(--color-text-secondary)' }} />
        <p style={{ color: 'var(--color-text-secondary)' }}>
          No past reflections yet. Answer some questions in the Today tab to see your history here.
        </p>
      </div>
    )
  }

  // Group by date
  const grouped = groupByDate(responses)

  return (
    <div className="space-y-4">
      {grouped.map(({ date, entries }) => (
        <div key={date}>
          <p
            className="text-xs font-medium mb-2 px-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {date}
          </p>
          <div className="space-y-2">
            {entries.map(r => {
              const categoryLabel = REFLECTION_CATEGORIES.find(c => c.value === r.reflection_prompts.category)?.label
              const isEditing = editingId === r.id
              return (
                <div
                  key={r.id}
                  className="p-4 rounded-lg group"
                  style={{
                    backgroundColor: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <div className="flex items-start justify-between gap-2">
                    <p
                      className="text-xs font-medium mb-1 flex-1"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {r.reflection_prompts.prompt_text}
                    </p>
                    {!isEditing && (
                      <button
                        type="button"
                        onClick={() => startEdit(r.id, r.response_text)}
                        aria-label="Edit this reflection"
                        className="p-1 rounded shrink-0 opacity-60 hover:opacity-100 transition-opacity"
                        style={{ color: 'var(--color-text-secondary)', background: 'transparent', border: 'none', minHeight: 'unset', cursor: 'pointer' }}
                      >
                        <Pencil size={13} />
                      </button>
                    )}
                  </div>
                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={draft}
                        onChange={(e) => setDraft(e.target.value)}
                        rows={Math.max(2, Math.min(8, draft.split('\n').length + 1))}
                        autoFocus
                        className="w-full text-sm rounded-lg px-3 py-2 resize-y"
                        style={{
                          backgroundColor: 'var(--color-bg-secondary)',
                          color: 'var(--color-text-primary)',
                          border: '1px solid var(--color-border-focus, var(--color-btn-primary-bg))',
                          outline: 'none',
                        }}
                      />
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => saveEdit(r)}
                          disabled={updateResponse.isPending || !draft.trim()}
                          className="text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-50"
                          style={{
                            background: 'var(--surface-primary, var(--color-btn-primary-bg))',
                            color: 'var(--color-btn-primary-text)',
                            border: 'none',
                            minHeight: 'unset',
                            cursor: 'pointer',
                          }}
                        >
                          {updateResponse.isPending ? 'Saving...' : 'Save'}
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          disabled={updateResponse.isPending}
                          className="text-xs px-3 py-1.5 rounded-lg"
                          style={{
                            background: 'var(--color-bg-secondary)',
                            color: 'var(--color-text-secondary)',
                            border: '1px solid var(--color-border)',
                            minHeight: 'unset',
                            cursor: 'pointer',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p
                      className="text-sm whitespace-pre-wrap"
                      style={{ color: 'var(--color-text-primary)' }}
                    >
                      {r.response_text}
                    </p>
                  )}
                  <div className="flex items-center gap-2 mt-2">
                    {categoryLabel && (
                      <span
                        className="text-xs px-1.5 py-0.5 rounded"
                        style={{
                          backgroundColor: 'var(--color-bg-secondary)',
                          color: 'var(--color-text-secondary)',
                        }}
                      >
                        {categoryLabel}
                      </span>
                    )}
                    <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {new Date(r.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {/* Load more */}
      {responses.length === PAGE_SIZE && (
        <div className="text-center pt-2">
          <button
            onClick={() => setOffset(prev => prev + PAGE_SIZE)}
            className="flex items-center gap-1.5 mx-auto px-4 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
          >
            <ChevronDown size={14} />
            Load More
          </button>
        </div>
      )}
    </div>
  )
}

interface GroupedResponses {
  date: string
  entries: {
    id: string
    response_text: string
    created_at: string
    journal_entry_id: string | null
    reflection_prompts: { prompt_text: string; category: string }
  }[]
}

function groupByDate(responses: {
  id: string
  response_date: string
  response_text: string
  created_at: string
  journal_entry_id: string | null
  reflection_prompts: { prompt_text: string; category: string }
}[]): GroupedResponses[] {
  const groups: Record<string, GroupedResponses['entries']> = {}
  for (const r of responses) {
    const date = new Date(r.response_date + 'T00:00:00').toLocaleDateString(undefined, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    if (!groups[date]) groups[date] = []
    groups[date].push(r)
  }
  return Object.entries(groups).map(([date, entries]) => ({ date, entries }))
}
