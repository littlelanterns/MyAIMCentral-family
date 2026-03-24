import { useState } from 'react'
import { Heart, Plus, Pencil, Trash2 } from 'lucide-react'
import { FeatureIcon } from '@/components/shared'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import {
  useSelfKnowledge,
  useCreateSelfKnowledge,
  useUpdateSelfKnowledge,
  useDeleteSelfKnowledge,
  SELF_KNOWLEDGE_CATEGORIES,
} from '@/hooks/useSelfKnowledge'
import type { SelfKnowledgeEntry, SelfKnowledgeCategory } from '@/hooks/useSelfKnowledge'

export function InnerWorkingsPage() {
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { data: entries = [], isLoading } = useSelfKnowledge(member?.id)
  const createEntry = useCreateSelfKnowledge()
  const updateEntry = useUpdateSelfKnowledge()
  const deleteEntry = useDeleteSelfKnowledge()

  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<SelfKnowledgeEntry | null>(null)
  const [formCategory, setFormCategory] = useState<SelfKnowledgeCategory>('personality')
  const [formContent, setFormContent] = useState('')
  const [activeTab, setActiveTab] = useState<SelfKnowledgeCategory | 'all'>('all')

  function resetForm() {
    setFormContent('')
    setFormCategory('personality')
    setShowCreate(false)
    setEditing(null)
  }

  async function handleCreate() {
    if (!member || !family || !formContent.trim()) return
    await createEntry.mutateAsync({
      family_id: family.id,
      member_id: member.id,
      category: formCategory,
      content: formContent.trim(),
    })
    resetForm()
  }

  async function handleUpdate() {
    if (!editing || !formContent.trim()) return
    await updateEntry.mutateAsync({
      id: editing.id,
      category: formCategory,
      content: formContent.trim(),
    })
    resetForm()
  }

  async function handleDelete(entry: SelfKnowledgeEntry) {
    if (!member) return
    await deleteEntry.mutateAsync({ id: entry.id, memberId: member.id })
  }

  function startEdit(entry: SelfKnowledgeEntry) {
    setEditing(entry)
    setFormCategory(entry.category)
    setFormContent(entry.content)
  }

  const filtered = activeTab === 'all'
    ? entries
    : entries.filter(e => e.category === activeTab)

  // Group by category for display (available when category grouping view is implemented)
  void SELF_KNOWLEDGE_CATEGORIES.map(cat => ({
    ...cat,
    entries: entries.filter(e => e.category === cat.value),
  }))

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FeatureIcon featureKey="my_foundation" fallback={<Heart size={32} style={{ color: 'var(--color-btn-primary-bg)' }} />} size={32} />
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
          >
            InnerWorkings
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
          Add Entry
        </button>
      </div>

      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        Self-knowledge and growth. Understanding yourself is the foundation for everything else.
      </p>

      {/* STUB: Self-Discovery with LiLa — wires to PRD-07 self_discovery mode */}
      {/* STUB: Upload document for extraction — wires to PRD-07 upload */}

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setActiveTab('all')}
          className="px-3 py-1.5 rounded-lg text-sm whitespace-nowrap"
          style={{
            backgroundColor: activeTab === 'all' ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-card)',
            color: activeTab === 'all' ? 'var(--color-btn-primary-text)' : 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
          }}
        >
          All ({entries.length})
        </button>
        {SELF_KNOWLEDGE_CATEGORIES.map(cat => {
          const count = entries.filter(e => e.category === cat.value).length
          return (
            <button
              key={cat.value}
              onClick={() => setActiveTab(cat.value)}
              className="px-3 py-1.5 rounded-lg text-sm whitespace-nowrap"
              style={{
                backgroundColor: activeTab === cat.value ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-card)',
                color: activeTab === cat.value ? 'var(--color-btn-primary-text)' : 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
              }}
            >
              {cat.label} ({count})
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
          <h2
            className="text-lg font-medium"
            style={{ color: 'var(--color-text-heading)' }}
          >
            {editing ? 'Edit Entry' : 'New Self-Knowledge Entry'}
          </h2>
          <select
            value={formCategory}
            onChange={(e) => setFormCategory(e.target.value as SelfKnowledgeCategory)}
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
            }}
          >
            {SELF_KNOWLEDGE_CATEGORIES.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
          <textarea
            placeholder="What do you know about yourself?"
            value={formContent}
            onChange={(e) => setFormContent(e.target.value)}
            rows={4}
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

      {/* Entry List */}
      {isLoading ? (
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <div
          className="p-8 rounded-lg text-center"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <Heart size={32} className="mx-auto mb-3" style={{ color: 'var(--color-text-secondary)' }} />
          <p style={{ color: 'var(--color-text-secondary)' }}>
            {activeTab === 'all'
              ? 'Start building your self-knowledge. Every insight strengthens your foundation.'
              : `No entries in ${SELF_KNOWLEDGE_CATEGORIES.find(c => c.value === activeTab)?.label} yet.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((entry) => (
            <div
              key={entry.id}
              className="p-4 rounded-lg"
              style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <span
                    className="inline-block mb-1 px-2 py-0.5 rounded text-xs"
                    style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}
                  >
                    {SELF_KNOWLEDGE_CATEGORIES.find(c => c.value === entry.category)?.label}
                  </span>
                  <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                    {entry.content}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => startEdit(entry)}
                    className="p-1.5 rounded"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    <Pencil size={14} />
                  </button>
                  <button
                    onClick={() => handleDelete(entry)}
                    className="p-1.5 rounded"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
