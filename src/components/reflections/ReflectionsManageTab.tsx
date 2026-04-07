import { useState } from 'react'
import {
  ChevronDown, ChevronUp, Archive, ArchiveRestore, Trash2,
  Pencil, Plus, RotateCcw, Check, X,
} from 'lucide-react'
import {
  useReflectionPrompts,
  useArchivedPrompts,
  useAddCustomPrompt,
  useUpdatePrompt,
  useArchivePrompt,
  useRestorePrompt,
  useDeletePrompt,
  useRestoreOriginalWording,
  REFLECTION_CATEGORIES,
} from '@/hooks/useReflections'
import type { ReflectionPrompt, ReflectionCategory } from '@/hooks/useReflections'

interface ReflectionsManageTabProps {
  familyId: string
  memberId: string
}

export function ReflectionsManageTab({ familyId, memberId }: ReflectionsManageTabProps) {
  const { data: prompts = [] } = useReflectionPrompts(familyId, memberId)
  const { data: archived = [] } = useArchivedPrompts(memberId)
  const addCustom = useAddCustomPrompt()
  const updatePrompt = useUpdatePrompt()
  const archivePrompt = useArchivePrompt()
  const restorePrompt = useRestorePrompt()
  const deletePrompt = useDeletePrompt()
  const restoreOriginal = useRestoreOriginalWording()

  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)
  const [addingCustom, setAddingCustom] = useState(false)
  const [newPromptText, setNewPromptText] = useState('')
  const [newPromptCategory, setNewPromptCategory] = useState<ReflectionCategory>('custom')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')

  // Group prompts by category
  const grouped = new Map<string, ReflectionPrompt[]>()
  for (const p of prompts) {
    const existing = grouped.get(p.category) || []
    existing.push(p)
    grouped.set(p.category, existing)
  }

  function toggleCategory(cat: string) {
    setExpandedCategory(prev => prev === cat ? null : cat)
  }

  async function handleArchive(prompt: ReflectionPrompt) {
    await archivePrompt.mutateAsync({ id: prompt.id, memberId })
  }

  async function handleRestore(prompt: ReflectionPrompt) {
    await restorePrompt.mutateAsync({ id: prompt.id, memberId })
  }

  async function handleDelete(prompt: ReflectionPrompt) {
    if (prompt.source === 'default') return // Defaults can only be archived
    await deletePrompt.mutateAsync({ id: prompt.id, memberId })
  }

  function startEdit(prompt: ReflectionPrompt) {
    setEditingId(prompt.id)
    setEditText(prompt.prompt_text)
  }

  async function saveEdit(prompt: ReflectionPrompt) {
    if (!editText.trim()) return
    await updatePrompt.mutateAsync({
      id: prompt.id,
      memberId,
      promptText: editText.trim(),
      currentPromptText: prompt.prompt_text,
      currentOriginalText: prompt.original_text,
      isDefault: prompt.source === 'default',
    })
    setEditingId(null)
    setEditText('')
  }

  async function handleRestoreOriginal(prompt: ReflectionPrompt) {
    if (!prompt.original_text) return
    await restoreOriginal.mutateAsync({
      id: prompt.id,
      memberId,
      originalText: prompt.original_text,
    })
  }

  async function handleAddCustom() {
    if (!newPromptText.trim()) return
    await addCustom.mutateAsync({
      familyId,
      memberId,
      promptText: newPromptText.trim(),
      category: newPromptCategory,
    })
    setNewPromptText('')
    setAddingCustom(false)
  }

  return (
    <div className="space-y-4">
      {/* Category sections */}
      {REFLECTION_CATEGORIES.map(cat => {
        const items = grouped.get(cat.value) || []
        if (items.length === 0 && cat.value !== 'custom') return null
        const isExpanded = expandedCategory === cat.value

        return (
          <div
            key={cat.value}
            className="rounded-lg"
            style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
          >
            {/* Section header */}
            <button
              onClick={() => toggleCategory(cat.value)}
              className="w-full text-left px-4 py-3 flex items-center justify-between"
              style={{ minHeight: 'unset' }}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                  {cat.label}
                </span>
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}
                >
                  {items.length}
                </span>
              </div>
              {isExpanded
                ? <ChevronUp size={16} style={{ color: 'var(--color-text-secondary)' }} />
                : <ChevronDown size={16} style={{ color: 'var(--color-text-secondary)' }} />
              }
            </button>

            {/* Expanded prompts */}
            {isExpanded && (
              <div className="px-4 pb-3 space-y-2">
                {items.map(prompt => (
                  <PromptRow
                    key={prompt.id}
                    prompt={prompt}
                    editingId={editingId}
                    editText={editText}
                    onEditTextChange={setEditText}
                    onStartEdit={startEdit}
                    onSaveEdit={saveEdit}
                    onCancelEdit={() => { setEditingId(null); setEditText('') }}
                    onArchive={handleArchive}
                    onDelete={handleDelete}
                    onRestoreOriginal={handleRestoreOriginal}
                  />
                ))}
                {items.length === 0 && (
                  <p className="text-xs py-2" style={{ color: 'var(--color-text-secondary)' }}>
                    No prompts in this category.
                  </p>
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Add custom question */}
      {addingCustom ? (
        <div
          className="p-4 rounded-lg space-y-3"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            Add Custom Question
          </p>
          <textarea
            value={newPromptText}
            onChange={e => setNewPromptText(e.target.value)}
            placeholder="Your reflection question..."
            rows={2}
            className="w-full rounded-lg p-3 text-sm resize-y"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
              outline: 'none',
            }}
            autoFocus
          />
          <div className="flex items-center gap-3">
            <label className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Category:</label>
            <select
              value={newPromptCategory}
              onChange={e => setNewPromptCategory(e.target.value as ReflectionCategory)}
              className="rounded px-2 py-1 text-xs"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
              }}
            >
              {REFLECTION_CATEGORIES.map(c => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>
          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setAddingCustom(false); setNewPromptText('') }}
              className="px-3 py-1.5 rounded-lg text-xs"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Cancel
            </button>
            <button
              onClick={handleAddCustom}
              disabled={!newPromptText.trim() || addCustom.isPending}
              className="px-4 py-1.5 rounded-lg text-xs font-medium disabled:opacity-50"
              style={{
                background: 'var(--surface-primary, var(--color-btn-primary-bg))',
                color: 'var(--color-btn-primary-text)',
              }}
            >
              {addCustom.isPending ? 'Adding...' : 'Add Question'}
            </button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setAddingCustom(true)}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium"
          style={{
            border: '1px dashed var(--color-border)',
            color: 'var(--color-text-primary)',
            backgroundColor: 'transparent',
          }}
        >
          <Plus size={16} />
          Add Custom Question
        </button>
      )}

      {/* Show Archived toggle */}
      <div className="pt-2">
        <button
          onClick={() => setShowArchived(!showArchived)}
          className="text-xs flex items-center gap-1"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ArchiveRestore size={14} />
          {showArchived ? 'Hide' : 'Show'} Archived ({archived.length})
        </button>

        {showArchived && archived.length > 0 && (
          <div className="mt-2 space-y-2">
            {archived.map(p => (
              <div
                key={p.id}
                className="flex items-center justify-between gap-3 p-3 rounded-lg"
                style={{
                  backgroundColor: 'var(--color-bg-card)',
                  border: '1px solid var(--color-border)',
                  opacity: 0.7,
                }}
              >
                <p className="text-sm flex-1" style={{ color: 'var(--color-text-secondary)' }}>
                  {p.prompt_text}
                </p>
                <button
                  onClick={() => handleRestore(p)}
                  className="flex items-center gap-1 px-2 py-1 rounded text-xs shrink-0"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    color: 'var(--color-text-primary)',
                  }}
                >
                  <ArchiveRestore size={12} />
                  Restore
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── PromptRow sub-component ──────────────────────────────────

function PromptRow({
  prompt,
  editingId,
  editText,
  onEditTextChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onArchive,
  onDelete,
  onRestoreOriginal,
}: {
  prompt: ReflectionPrompt
  editingId: string | null
  editText: string
  onEditTextChange: (text: string) => void
  onStartEdit: (prompt: ReflectionPrompt) => void
  onSaveEdit: (prompt: ReflectionPrompt) => void
  onCancelEdit: () => void
  onArchive: (prompt: ReflectionPrompt) => void
  onDelete: (prompt: ReflectionPrompt) => void
  onRestoreOriginal: (prompt: ReflectionPrompt) => void
}) {
  const isEditing = editingId === prompt.id
  const isDefault = prompt.source === 'default'
  const hasOriginal = !!prompt.original_text

  if (isEditing) {
    return (
      <div
        className="p-3 rounded-lg space-y-2"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
      >
        <textarea
          value={editText}
          onChange={e => onEditTextChange(e.target.value)}
          rows={2}
          className="w-full rounded p-2 text-sm resize-y"
          style={{
            backgroundColor: 'var(--color-bg-primary)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            outline: 'none',
          }}
          autoFocus
        />
        <div className="flex gap-2 justify-end">
          <button onClick={onCancelEdit} className="p-1 rounded" style={{ color: 'var(--color-text-secondary)' }}>
            <X size={14} />
          </button>
          <button
            onClick={() => onSaveEdit(prompt)}
            disabled={!editText.trim()}
            className="p-1 rounded disabled:opacity-50"
            style={{ color: 'var(--color-success, #4b7c66)' }}
          >
            <Check size={14} />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div
      className="flex items-start gap-2 p-3 rounded-lg group"
      style={{ backgroundColor: 'var(--color-bg-secondary)' }}
    >
      <p className="text-sm flex-1" style={{ color: 'var(--color-text-primary)' }}>
        {prompt.prompt_text}
        {isDefault && (
          <span
            className="ml-2 text-xs px-1 py-0.5 rounded"
            style={{ backgroundColor: 'var(--color-bg-card)', color: 'var(--color-text-secondary)' }}
          >
            Default
          </span>
        )}
      </p>
      <div className="flex items-center gap-1 shrink-0">
        {hasOriginal && (
          <button
            onClick={() => onRestoreOriginal(prompt)}
            className="p-1 rounded opacity-60 hover:opacity-100"
            style={{ color: 'var(--color-text-secondary)' }}
            title="Restore to original wording"
          >
            <RotateCcw size={13} />
          </button>
        )}
        <button
          onClick={() => onStartEdit(prompt)}
          className="p-1 rounded opacity-60 hover:opacity-100"
          style={{ color: 'var(--color-text-secondary)' }}
          title="Edit"
        >
          <Pencil size={13} />
        </button>
        <button
          onClick={() => onArchive(prompt)}
          className="p-1 rounded opacity-60 hover:opacity-100"
          style={{ color: 'var(--color-text-secondary)' }}
          title="Archive"
        >
          <Archive size={13} />
        </button>
        {!isDefault && (
          <button
            onClick={() => onDelete(prompt)}
            className="p-1 rounded opacity-60 hover:opacity-100"
            style={{ color: 'var(--color-error, #b25a58)' }}
            title="Delete"
          >
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  )
}
