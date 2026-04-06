/**
 * ReferenceListView — PRD-09B Addendum
 * Accordion-based section renderer for Reference lists.
 * No checkboxes, no promote-to-task — pure lookup reference.
 * Used in list detail view and dashboard widget (compact mode).
 */

import { useState, useCallback, useMemo } from 'react'
import { ChevronRight, ChevronDown, Plus, X, BookOpen } from 'lucide-react'
import { useListItems, useCreateListItem, useUpdateListItem, useDeleteListItem } from '@/hooks/useLists'
import type { ListItem } from '@/types/lists'

interface ReferenceListViewProps {
  listId: string
  compact?: boolean
  canEdit?: boolean
}

/** Persisted section expand state per list */
function useSectionState(listId: string) {
  const key = `ref-list-${listId}-sections`
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? new Set(JSON.parse(stored)) : new Set<string>()
    } catch {
      return new Set<string>()
    }
  })

  const toggle = useCallback((section: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(section)) next.delete(section)
      else next.add(section)
      try { localStorage.setItem(key, JSON.stringify([...next])) } catch { /* noop */ }
      return next
    })
  }, [key])

  return { expanded, toggle }
}

export function ReferenceListView({ listId, compact, canEdit = false }: ReferenceListViewProps) {
  const { data: items = [], isLoading } = useListItems(listId)
  const createItem = useCreateListItem()
  const updateItem = useUpdateListItem()
  const deleteItem = useDeleteListItem()
  const { expanded, toggle } = useSectionState(listId)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [editNotes, setEditNotes] = useState('')
  const [addingInSection, setAddingInSection] = useState<string | null>(null)
  const [newItemText, setNewItemText] = useState('')
  const [addingSectionName, setAddingSectionName] = useState(false)
  const [newSectionName, setNewSectionName] = useState('')

  // Group items by section
  const { sections, sectionOrder } = useMemo(() => {
    const sectionMap = new Map<string, ListItem[]>()
    const generalKey = '__general__'

    items.forEach(item => {
      const key = item.section_name || generalKey
      if (!sectionMap.has(key)) sectionMap.set(key, [])
      sectionMap.get(key)!.push(item)
    })

    // Sort sections by min sort_order of their items
    const order = [...sectionMap.keys()].sort((a, b) => {
      const aMin = Math.min(...(sectionMap.get(a)?.map(i => i.sort_order) ?? [0]))
      const bMin = Math.min(...(sectionMap.get(b)?.map(i => i.sort_order) ?? [0]))
      return aMin - bMin
    })

    // Sort items within each section
    for (const [, sectionItems] of sectionMap) {
      sectionItems.sort((a, b) => a.sort_order - b.sort_order)
    }

    return { sections: sectionMap, sectionOrder: order }
  }, [items])

  function startEdit(item: ListItem) {
    if (!canEdit) return
    setEditingId(item.id)
    setEditText(item.content || item.item_name || '')
    setEditNotes(item.notes ?? '')
  }

  async function saveEdit(item: ListItem) {
    if (!editText.trim()) {
      setEditingId(null)
      return
    }
    await updateItem.mutateAsync({
      id: item.id,
      listId,
      content: editText.trim(),
      notes: editNotes.trim() || null,
    })
    setEditingId(null)
  }

  async function addItem(sectionName: string | null) {
    if (!newItemText.trim()) return
    await createItem.mutateAsync({
      list_id: listId,
      content: newItemText.trim(),
      section_name: sectionName === '__general__' ? undefined : (sectionName ?? undefined),
      sort_order: items.length,
    })
    setNewItemText('')
    // Keep input open for more items
  }

  async function addSection() {
    if (!newSectionName.trim()) return
    // Create a placeholder item in the new section
    await createItem.mutateAsync({
      list_id: listId,
      content: '(first item)',
      section_name: newSectionName.trim(),
      sort_order: items.length,
    })
    // Auto-expand the new section
    toggle(newSectionName.trim())
    setNewSectionName('')
    setAddingSectionName(false)
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin w-5 h-5 rounded-full border-2" style={{ borderColor: 'var(--color-border)', borderTopColor: 'var(--color-btn-primary-bg)' }} />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="py-6 text-center">
        <BookOpen size={24} className="mx-auto mb-2" style={{ color: 'var(--color-text-secondary)' }} />
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          {canEdit ? 'Add sections and items below' : 'No reference items yet'}
        </p>
      </div>
    )
  }

  return (
    <div className={compact ? 'space-y-1' : 'space-y-2'}>
      {sectionOrder.map(sectionKey => {
        const sectionItems = sections.get(sectionKey) ?? []
        const displayName = sectionKey === '__general__' ? 'General' : sectionKey
        const isExpanded = expanded.has(sectionKey)

        return (
          <div key={sectionKey}>
            {/* Section header */}
            <button
              onClick={() => toggle(sectionKey)}
              className="flex items-center gap-1.5 w-full py-1.5 text-left"
            >
              {isExpanded
                ? <ChevronDown size={14} style={{ color: 'var(--color-btn-primary-bg)' }} />
                : <ChevronRight size={14} style={{ color: 'var(--color-text-secondary)' }} />
              }
              <span
                className={`text-xs font-semibold uppercase tracking-wider ${compact ? 'text-[10px]' : ''}`}
                style={{ color: isExpanded ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)' }}
              >
                {displayName}
              </span>
              <span className="text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                {sectionItems.length}
              </span>
            </button>

            {/* Section items */}
            {isExpanded && (
              <div className={`${compact ? 'pl-4 space-y-0.5' : 'pl-5 space-y-1'}`}>
                {sectionItems.map(item => (
                  <div key={item.id} className="group">
                    {editingId === item.id ? (
                      <div className="space-y-1 py-1">
                        <input
                          type="text"
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveEdit(item); if (e.key === 'Escape') setEditingId(null) }}
                          autoFocus
                          className="w-full px-2 py-1 rounded text-sm"
                          style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                        />
                        <input
                          type="text"
                          value={editNotes}
                          onChange={e => setEditNotes(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') saveEdit(item); if (e.key === 'Escape') setEditingId(null) }}
                          placeholder="Notes (optional)"
                          className="w-full px-2 py-1 rounded text-xs"
                          style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
                        />
                        <div className="flex gap-1 justify-end">
                          <button onClick={() => setEditingId(null)} className="text-xs px-2 py-0.5 rounded" style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
                          <button onClick={() => saveEdit(item)} className="text-xs px-2 py-0.5 rounded" style={{ color: 'var(--color-btn-primary-bg)' }}>Save</button>
                        </div>
                      </div>
                    ) : (
                      <div
                        className={`flex items-start gap-1 ${canEdit ? 'cursor-pointer hover:bg-[color-mix(in_srgb,var(--color-bg-secondary)_50%,transparent)] rounded px-1' : 'px-1'}`}
                        onClick={() => canEdit && startEdit(item)}
                      >
                        <div className="flex-1 min-w-0 py-0.5">
                          <p className={`${compact ? 'text-xs' : 'text-sm'} font-medium`} style={{ color: 'var(--color-text-primary)' }}>
                            {item.content || item.item_name}
                          </p>
                          {item.notes && (
                            <p className={`${compact ? 'text-[10px]' : 'text-xs'} italic whitespace-pre-wrap`} style={{ color: 'var(--color-text-secondary)' }}>
                              {item.notes}
                            </p>
                          )}
                        </div>
                        {canEdit && (
                          <button
                            onClick={(e) => { e.stopPropagation(); deleteItem.mutate({ id: item.id, listId }) }}
                            className="p-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                            style={{ color: 'var(--color-text-secondary)' }}
                          >
                            <X size={12} />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Add item inline */}
                {canEdit && (
                  addingInSection === sectionKey ? (
                    <div className="flex gap-1 py-1">
                      <input
                        type="text"
                        value={newItemText}
                        onChange={e => setNewItemText(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') addItem(sectionKey)
                          if (e.key === 'Escape') { setAddingInSection(null); setNewItemText('') }
                        }}
                        autoFocus
                        placeholder="New item..."
                        className="flex-1 px-2 py-1 rounded text-xs"
                        style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                      />
                      <button
                        onClick={() => { setAddingInSection(null); setNewItemText('') }}
                        className="text-xs px-1"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        Done
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => { setAddingInSection(sectionKey); setNewItemText('') }}
                      className="flex items-center gap-1 text-xs py-1"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      <Plus size={12} /> Add item
                    </button>
                  )
                )}
              </div>
            )}
          </div>
        )
      })}

      {/* Add section */}
      {canEdit && !compact && (
        addingSectionName ? (
          <div className="flex gap-1 pt-1">
            <input
              type="text"
              value={newSectionName}
              onChange={e => setNewSectionName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') addSection()
                if (e.key === 'Escape') { setAddingSectionName(false); setNewSectionName('') }
              }}
              autoFocus
              placeholder="Section name..."
              className="flex-1 px-2 py-1 rounded text-xs"
              style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            />
            <button onClick={() => { setAddingSectionName(false); setNewSectionName('') }} className="text-xs px-1" style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
          </div>
        ) : (
          <button
            onClick={() => setAddingSectionName(true)}
            className="flex items-center gap-1 text-xs py-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <Plus size={12} /> Add section
          </button>
        )
      )}

      {/* View only indicator */}
      {!canEdit && !compact && (
        <p className="text-[10px] text-center pt-2" style={{ color: 'var(--color-text-secondary)' }}>
          View only
        </p>
      )}
    </div>
  )
}
