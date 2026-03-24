/**
 * InnerWorkings Page — PRD-07
 * Adapted from StewardShip's Keel pattern.
 * Self-knowledge entries organized by category tabs.
 * Document upload for personality test extraction.
 */

import { useState, useMemo } from 'react'
import { Brain, Plus, Pencil, Trash2, Eye, EyeOff, Upload, Users } from 'lucide-react'
import { FeatureGuide, FeatureIcon } from '@/components/shared'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import {
  useSelfKnowledge,
  useCreateSelfKnowledge,
  useUpdateSelfKnowledge,
  useDeleteSelfKnowledge,
  useToggleSelfKnowledgeAI,
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
  const toggleAI = useToggleSelfKnowledgeAI()

  const [activeCategory, setActiveCategory] = useState<SelfKnowledgeCategory>('personality')
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<SelfKnowledgeEntry | null>(null)
  const [formContent, setFormContent] = useState('')
  const [formShareDad, setFormShareDad] = useState(false)

  const byCategory = useMemo(() => {
    const map: Record<string, SelfKnowledgeEntry[]> = {}
    for (const cat of SELF_KNOWLEDGE_CATEGORIES) {
      map[cat.value] = entries.filter(e => e.category === cat.value)
    }
    return map
  }, [entries])

  const activeEntries = byCategory[activeCategory] ?? []
  const totalIncluded = entries.filter(e => e.is_included_in_ai).length

  function resetForm() {
    setFormContent('')
    setFormShareDad(false)
    setShowCreate(false)
    setEditing(null)
  }

  async function handleCreate() {
    if (!member || !family || !formContent.trim()) return
    await createEntry.mutateAsync({
      family_id: family.id,
      member_id: member.id,
      category: activeCategory,
      content: formContent.trim(),
      source_type: 'manual',
      share_with_dad: formShareDad,
    })
    resetForm()
  }

  async function handleUpdate() {
    if (!editing || !formContent.trim()) return
    await updateEntry.mutateAsync({
      id: editing.id,
      content: formContent.trim(),
      share_with_dad: formShareDad,
    })
    resetForm()
  }

  async function handleDelete(entry: SelfKnowledgeEntry) {
    if (!member || !confirm('Remove this entry?')) return
    await deleteEntry.mutateAsync({ id: entry.id, memberId: member.id })
  }

  async function handleToggleAI(entry: SelfKnowledgeEntry) {
    if (!member) return
    await toggleAI.mutateAsync({ id: entry.id, memberId: member.id, included: !entry.is_included_in_ai })
  }

  function startEdit(entry: SelfKnowledgeEntry) {
    setEditing(entry)
    setFormContent(entry.content)
    setFormShareDad(entry.share_with_dad)
  }

  const categoryLabel = SELF_KNOWLEDGE_CATEGORIES.find(c => c.value === activeCategory)?.label ?? ''

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <FeatureGuide featureKey="inner_workings" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FeatureIcon featureKey="innerworkings_basic" fallback={<Brain size={28} style={{ color: 'var(--color-btn-primary-bg)' }} />} size={28} />
          <div>
            <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}>
              InnerWorkings
            </h1>
            {entries.length > 0 && (
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                {totalIncluded} of {entries.length} included in AI context
              </p>
            )}
          </div>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
        >
          <Plus size={16} />
          Add
        </button>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {SELF_KNOWLEDGE_CATEGORIES.map(cat => {
          const count = byCategory[cat.value]?.length ?? 0
          const isActive = activeCategory === cat.value
          return (
            <button
              key={cat.value}
              onClick={() => setActiveCategory(cat.value)}
              className="px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-colors flex items-center gap-1.5"
              style={{
                backgroundColor: isActive ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-card)',
                color: isActive ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
                border: `1px solid ${isActive ? 'transparent' : 'var(--color-border)'}`,
              }}
            >
              {cat.label}
              {count > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px]" style={{
                  backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : 'var(--color-bg-secondary)',
                  color: isActive ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
                }}>
                  {count}
                </span>
              )}
            </button>
          )
        })}
      </div>

      {/* Create / Edit Form */}
      {(showCreate || editing) && (
        <div className="p-4 rounded-xl space-y-3" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <h2 className="text-base font-semibold" style={{ color: 'var(--color-text-heading)' }}>
            {editing ? `Edit ${categoryLabel} Entry` : `New ${categoryLabel} Entry`}
          </h2>
          <textarea
            placeholder={`What do you know about your ${categoryLabel.toLowerCase()}?`}
            value={formContent}
            onChange={e => setFormContent(e.target.value)}
            rows={3}
            autoFocus
            className="w-full px-3 py-2 rounded-lg text-sm resize-none"
            style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          />
          <label className="flex items-center gap-2 text-xs cursor-pointer" style={{ color: 'var(--color-text-secondary)' }}>
            <input type="checkbox" checked={formShareDad} onChange={e => setFormShareDad(e.target.checked)} className="rounded" />
            <Users size={14} />
            Share with spouse (helps Cyrano & relationship tools)
          </label>
          <div className="flex gap-2 justify-end">
            <button onClick={resetForm} className="px-3 py-1.5 rounded-lg text-sm" style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
            <button
              onClick={editing ? handleUpdate : handleCreate}
              disabled={!formContent.trim()}
              className="px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
            >
              {editing ? 'Save' : 'Add Entry'}
            </button>
          </div>
        </div>
      )}

      {/* Upload placeholder */}
      {!showCreate && !editing && activeEntries.length === 0 && (
        <button
          onClick={() => alert('Document upload coming soon — for now, add entries manually.')}
          className="w-full flex items-center justify-center gap-2 p-4 rounded-xl text-sm transition-colors"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '2px dashed var(--color-border)', color: 'var(--color-text-secondary)' }}
        >
          <Upload size={18} />
          Upload a personality test or assessment (PDF, image, text)
        </button>
      )}

      {/* Entries */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin w-6 h-6 border-2 rounded-full" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-btn-primary-bg)' }} />
        </div>
      ) : activeEntries.length === 0 && !showCreate && !editing ? (
        <div className="p-8 rounded-xl text-center" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <Brain size={32} className="mx-auto mb-3" style={{ color: 'var(--color-btn-primary-bg)' }} />
          <p className="font-medium" style={{ color: 'var(--color-text-heading)' }}>No {categoryLabel.toLowerCase()} entries yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Add what you know about your {categoryLabel.toLowerCase()} — or upload a personality test for AI extraction.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {activeEntries.map(entry => (
            <div
              key={entry.id}
              className="p-4 rounded-xl transition-all"
              style={{
                backgroundColor: 'var(--color-bg-card)',
                border: `1px solid ${entry.is_included_in_ai ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
                opacity: entry.is_included_in_ai ? 1 : 0.7,
              }}
            >
              <div className="flex items-start gap-3">
                <button
                  onClick={() => handleToggleAI(entry)}
                  className="mt-0.5 p-1 rounded transition-colors flex-shrink-0"
                  title={entry.is_included_in_ai ? 'Included in AI context' : 'Excluded from AI context'}
                  style={{ color: entry.is_included_in_ai ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)' }}
                >
                  {entry.is_included_in_ai ? <Eye size={16} /> : <EyeOff size={16} />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{entry.content}</p>
                  <div className="flex items-center gap-2 mt-1">
                    {entry.source_type !== 'manual' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}>
                        {entry.source_type === 'upload' ? 'From upload' : entry.source_type === 'bulk_add' ? 'Bulk add' : entry.source_type}
                      </span>
                    )}
                    {entry.share_with_dad && (
                      <span className="text-[10px] flex items-center gap-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                        <Users size={10} /> Shared with spouse
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  <button onClick={() => startEdit(entry)} className="p-1.5 rounded hover:opacity-70" style={{ color: 'var(--color-text-secondary)' }}>
                    <Pencil size={14} />
                  </button>
                  <button onClick={() => handleDelete(entry)} className="p-1.5 rounded hover:opacity-70" style={{ color: 'var(--color-text-secondary)' }}>
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
