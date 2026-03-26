import { useState } from 'react'
import { Plus, Search, Copy, Pencil, Trash2, Sparkles } from 'lucide-react'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { FeatureGuide } from '@/components/shared/FeatureGuide'
import { useSavedPrompts } from '../hooks/useSavedPrompts'

export function PersonalPromptLibraryPage() {
  const { data: member } = useFamilyMember()
  const {
    prompts,
    loading,
    createPrompt,
    updatePrompt,
    deletePrompt,
    copyPrompt,
  } = useSavedPrompts(member?.id ?? null)

  const [search, setSearch] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editText, setEditText] = useState('')
  const [editTags, setEditTags] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newText, setNewText] = useState('')
  const [newTags, setNewTags] = useState('')

  const filtered = prompts.filter(p =>
    p.title.toLowerCase().includes(search.toLowerCase()) ||
    p.tags.some((t: string) => t.toLowerCase().includes(search.toLowerCase()))
  )

  const startEdit = (p: any) => {
    setEditingId(p.id)
    setEditTitle(p.title)
    setEditText(p.prompt_text)
    setEditTags(p.tags.join(', '))
  }

  const saveEdit = async () => {
    if (!editingId) return
    await updatePrompt(editingId, {
      title: editTitle,
      prompt_text: editText,
      tags: editTags.split(',').map((t: string) => t.trim()).filter(Boolean),
    })
    setEditingId(null)
  }

  const handleCreate = async () => {
    if (!newTitle.trim() || !newText.trim()) return
    await createPrompt({
      title: newTitle.trim(),
      prompt_text: newText.trim(),
      tags: newTags.split(',').map((t: string) => t.trim()).filter(Boolean),
    })
    setNewTitle('')
    setNewText('')
    setNewTags('')
    setShowCreate(false)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 pb-20">
      <FeatureGuide featureKey="vault_prompt_library" />

      <div className="pt-6 pb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-heading)' }}>
            My Prompts
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Your saved and personalized prompts
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
          style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
        >
          <Plus size={16} />
          New Prompt
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-secondary)' }} />
        <input
          type="text"
          placeholder="Search prompts..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2 rounded-lg border text-sm"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-primary)',
          }}
        />
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="mb-4 p-4 rounded-lg border" style={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}>
          <input
            placeholder="Prompt title"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            className="w-full px-3 py-2 rounded border mb-2 text-sm"
            style={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          />
          <textarea
            placeholder="Prompt text..."
            value={newText}
            onChange={e => setNewText(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 rounded border mb-2 text-sm"
            style={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          />
          <input
            placeholder="Tags (comma-separated)"
            value={newTags}
            onChange={e => setNewTags(e.target.value)}
            className="w-full px-3 py-2 rounded border mb-3 text-sm"
            style={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 rounded text-sm" style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
            <button onClick={handleCreate} className="px-3 py-1.5 rounded text-sm font-medium" style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}>Save</button>
          </div>
        </div>
      )}

      {/* Prompt list */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--color-bg-secondary)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16">
          <Sparkles size={40} className="mx-auto mb-3 opacity-30" style={{ color: 'var(--color-text-secondary)' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {prompts.length === 0 ? 'Save prompts from the AI Vault or create your own.' : 'No prompts match your search.'}
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(p => (
            <div
              key={p.id}
              className="rounded-lg border overflow-hidden"
              style={{ backgroundColor: 'var(--color-bg-card)', borderColor: 'var(--color-border)' }}
            >
              {editingId === p.id ? (
                <div className="p-3 space-y-2">
                  <input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="w-full px-2 py-1 rounded border text-sm" style={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
                  <textarea value={editText} onChange={e => setEditText(e.target.value)} rows={4} className="w-full px-2 py-1 rounded border text-sm" style={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
                  <input value={editTags} onChange={e => setEditTags(e.target.value)} placeholder="Tags" className="w-full px-2 py-1 rounded border text-sm" style={{ backgroundColor: 'var(--color-bg-primary)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }} />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setEditingId(null)} className="px-2 py-1 text-xs" style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
                    <button onClick={saveEdit} className="px-2 py-1 text-xs font-medium rounded" style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}>Save</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                  className="w-full text-left p-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>{p.title}</p>
                      <p className="text-xs mt-0.5 truncate" style={{ color: 'var(--color-text-secondary)' }}>
                        {p.is_lila_optimized ? 'LiLa Optimized' : p.source_vault_item_id ? 'From Vault' : 'Created by me'}
                        {p.tags.length > 0 && ` · ${p.tags.join(', ')}`}
                      </p>
                    </div>
                  </div>
                  {expandedId === p.id && (
                    <div className="mt-3">
                      <pre className="text-xs whitespace-pre-wrap p-3 rounded" style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}>
                        {p.prompt_text}
                      </pre>
                      <div className="flex gap-2 mt-3">
                        <button onClick={e => { e.stopPropagation(); copyPrompt(p) }} className="flex items-center gap-1 px-2 py-1 rounded text-xs" style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}>
                          <Copy size={12} /> Copy
                        </button>
                        <button onClick={e => { e.stopPropagation(); startEdit(p) }} className="flex items-center gap-1 px-2 py-1 rounded text-xs" style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}>
                          <Pencil size={12} /> Edit
                        </button>
                        <button onClick={e => { e.stopPropagation(); if (confirm('Delete this prompt?')) deletePrompt(p.id) }} className="flex items-center gap-1 px-2 py-1 rounded text-xs" style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}>
                          <Trash2 size={12} /> Delete
                        </button>
                      </div>
                    </div>
                  )}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
