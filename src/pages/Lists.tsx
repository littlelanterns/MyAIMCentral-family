import { useState } from 'react'
import { List as ListIcon, Plus } from 'lucide-react'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useLists, useCreateList } from '@/hooks/useLists'
import type { ListType } from '@/hooks/useLists'

const LIST_TYPES: { value: ListType; label: string }[] = [
  { value: 'simple', label: 'Simple' },
  { value: 'checklist', label: 'Checklist' },
  { value: 'reference', label: 'Reference' },
  { value: 'template', label: 'Template' },
  { value: 'randomizer', label: 'Randomizer' },
  { value: 'backburner', label: 'Backburner' },
]

export function ListsPage() {
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { data: lists = [], isLoading } = useLists(family?.id)
  const createList = useCreateList()

  const [showCreate, setShowCreate] = useState(false)
  const [formTitle, setFormTitle] = useState('')
  const [formType, setFormType] = useState<ListType>('checklist')

  async function handleCreate() {
    if (!member || !family || !formTitle.trim()) return
    await createList.mutateAsync({
      family_id: family.id,
      owner_id: member.id,
      title: formTitle.trim(),
      list_type: formType,
    })
    setFormTitle('')
    setShowCreate(false)
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ListIcon size={24} style={{ color: 'var(--color-btn-primary-bg)' }} />
          <h1
            className="text-2xl font-bold"
            style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
          >
            Lists
          </h1>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
          style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
        >
          <Plus size={16} />
          New List
        </button>
      </div>

      {showCreate && (
        <div
          className="p-4 rounded-lg space-y-3"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <input
            type="text"
            placeholder="List name"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
            autoFocus
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          />
          <select
            value={formType}
            onChange={(e) => setFormType(e.target.value as ListType)}
            className="px-3 py-1.5 rounded-lg text-sm"
            style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            {LIST_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 rounded-lg text-sm" style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
            <button
              onClick={handleCreate}
              disabled={!formTitle.trim()}
              className="px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
            >
              Create
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <p style={{ color: 'var(--color-text-secondary)' }}>Loading...</p>
      ) : lists.length === 0 ? (
        <div className="p-8 rounded-lg text-center" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <ListIcon size={32} className="mx-auto mb-3" style={{ color: 'var(--color-text-secondary)' }} />
          <p style={{ color: 'var(--color-text-secondary)' }}>No lists yet. Create one to start organizing.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {lists.map(list => (
            <div
              key={list.id}
              className="flex items-center justify-between p-4 rounded-lg"
              style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
            >
              <div>
                <p className="font-medium" style={{ color: 'var(--color-text-heading)' }}>{list.title}</p>
                <span className="text-xs capitalize" style={{ color: 'var(--color-text-secondary)' }}>{list.list_type}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
