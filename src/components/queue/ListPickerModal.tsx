/**
 * ListPickerModal (PRD-17 Sort Tab)
 *
 * When a studio_queue item has destination='list', this modal lets mom
 * pick an existing list to add the item(s) to, or create a new one.
 * Critical for MindSweep readiness — shopping items need list routing.
 *
 * Zero hardcoded hex colors — all CSS custom properties.
 */

import { useState, useMemo } from 'react'
import { createPortal } from 'react-dom'
import { X, List, Plus, Search, ShoppingCart, Gift, DollarSign, Briefcase, CheckSquare, Lightbulb, Clock } from 'lucide-react'
import { useLists, useCreateList, useCreateListItem } from '@/hooks/useLists'
import { useFamily } from '@/hooks/useFamily'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import type { List as ListType } from '@/types/lists'
import type { StudioQueueRecord } from './QueueCard'

interface ListPickerModalProps {
  isOpen: boolean
  onClose: () => void
  /** Queue items to add to the chosen list */
  items: StudioQueueRecord[]
  /** Called after items are added to a list */
  onComplete: (listId: string, listTitle: string) => void
}

const LIST_TYPE_ICONS: Record<string, typeof List> = {
  shopping: ShoppingCart,
  wishlist: Gift,
  expenses: DollarSign,
  packing: Briefcase,
  todo: CheckSquare,
  ideas: Lightbulb,
  backburner: Clock,
}

function getListIcon(listType: string) {
  return LIST_TYPE_ICONS[listType] ?? List
}

export function ListPickerModal({ isOpen, onClose, items, onComplete }: ListPickerModalProps) {
  const { data: family } = useFamily()
  const { data: currentMember } = useFamilyMember()
  const { data: lists = [] } = useLists(family?.id)
  const createList = useCreateList()
  const createListItem = useCreateListItem()

  const [search, setSearch] = useState('')
  const [creating, setCreating] = useState(false)
  const [newListName, setNewListName] = useState('')
  const [adding, setAdding] = useState(false)

  const activeLists = useMemo(() => {
    const filtered = lists.filter((l) => !l.archived_at)
    if (!search.trim()) return filtered
    const q = search.toLowerCase()
    return filtered.filter((l) => l.title.toLowerCase().includes(q))
  }, [lists, search])

  async function addItemsToList(list: ListType) {
    if (adding || !items.length) return
    setAdding(true)
    try {
      for (let i = 0; i < items.length; i++) {
        await createListItem.mutateAsync({
          list_id: list.id,
          content: items[i].content,
          sort_order: i,
        })
      }
      onComplete(list.id, list.title)
    } catch {
      // Error handled by mutation
    } finally {
      setAdding(false)
    }
  }

  async function handleCreateAndAdd() {
    if (!family?.id || !currentMember?.id || !newListName.trim()) return
    setAdding(true)
    try {
      const newList = await createList.mutateAsync({
        family_id: family.id,
        owner_id: currentMember.id,
        title: newListName.trim(),
        list_type: 'custom',
      })
      for (let i = 0; i < items.length; i++) {
        await createListItem.mutateAsync({
          list_id: newList.id,
          content: items[i].content,
          sort_order: i,
        })
      }
      onComplete(newList.id, newList.title)
    } catch {
      // Error handled by mutation
    } finally {
      setAdding(false)
      setCreating(false)
      setNewListName('')
    }
  }

  if (!isOpen) return null

  const itemLabel = items.length === 1
    ? `"${items[0].content.slice(0, 50)}${items[0].content.length > 50 ? '...' : ''}"`
    : `${items.length} items`

  return createPortal(
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 55,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, backgroundColor: 'rgba(0,0,0,0.4)' }}
        aria-hidden="true"
      />

      {/* Modal */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: 440,
          maxHeight: '80vh',
          backgroundColor: 'var(--color-bg-card)',
          borderRadius: 'var(--vibe-radius-input, 8px)',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between"
          style={{
            padding: '0.75rem 1rem',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <div>
            <h3 style={{
              fontWeight: 600,
              fontSize: 'var(--font-size-base, 1rem)',
              color: 'var(--color-text-heading)',
              margin: 0,
            }}>
              Add to list
            </h3>
            <p style={{
              fontSize: 'var(--font-size-xs, 0.75rem)',
              color: 'var(--color-text-secondary)',
              margin: '2px 0 0 0',
            }}>
              {itemLabel}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              padding: 4,
              minHeight: 'unset',
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '0.5rem 1rem 0' }}>
          <div
            className="flex items-center gap-2"
            style={{
              padding: '0.4rem 0.75rem',
              borderRadius: 'var(--vibe-radius-input, 8px)',
              border: '1px solid var(--color-border)',
              backgroundColor: 'var(--color-bg-input, var(--color-bg-card))',
            }}
          >
            <Search size={14} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search lists..."
              style={{
                flex: 1,
                border: 'none',
                background: 'none',
                outline: 'none',
                color: 'var(--color-text-primary)',
                fontSize: 'var(--font-size-sm, 0.875rem)',
              }}
            />
          </div>
        </div>

        {/* List options */}
        <div
          style={{
            flex: 1,
            overflowY: 'auto',
            padding: '0.5rem 1rem 0.75rem',
          }}
          className="space-y-1"
        >
          {/* Create new list */}
          {creating ? (
            <div
              className="flex items-center gap-2"
              style={{
                padding: '0.5rem 0.75rem',
                borderRadius: 'var(--vibe-radius-input, 8px)',
                border: '1px solid var(--color-btn-primary-bg)',
                backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 6%, var(--color-bg-card))',
              }}
            >
              <Plus size={16} style={{ color: 'var(--color-btn-primary-bg)', flexShrink: 0 }} />
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleCreateAndAdd(); if (e.key === 'Escape') setCreating(false) }}
                placeholder="New list name..."
                autoFocus
                style={{
                  flex: 1,
                  border: 'none',
                  background: 'none',
                  outline: 'none',
                  color: 'var(--color-text-primary)',
                  fontSize: 'var(--font-size-sm, 0.875rem)',
                }}
              />
              <button
                onClick={handleCreateAndAdd}
                disabled={!newListName.trim() || adding}
                style={{
                  padding: '0.25rem 0.6rem',
                  borderRadius: 'var(--vibe-radius-input, 8px)',
                  border: 'none',
                  backgroundColor: 'var(--color-btn-primary-bg)',
                  color: 'var(--color-btn-primary-text)',
                  fontSize: 'var(--font-size-xs, 0.75rem)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  opacity: !newListName.trim() || adding ? 0.5 : 1,
                }}
              >
                {adding ? '...' : 'Create & add'}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              className="flex items-center gap-2 w-full text-left transition-colors"
              style={{
                padding: '0.6rem 0.75rem',
                borderRadius: 'var(--vibe-radius-input, 8px)',
                border: '1px dashed var(--color-border)',
                backgroundColor: 'transparent',
                color: 'var(--color-btn-primary-bg)',
                fontSize: 'var(--font-size-sm, 0.875rem)',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              <Plus size={16} />
              Create new list
            </button>
          )}

          {/* Existing lists */}
          {activeLists.map((list) => {
            const Icon = getListIcon(list.list_type)
            return (
              <button
                key={list.id}
                onClick={() => addItemsToList(list)}
                disabled={adding}
                className="flex items-center gap-2.5 w-full text-left transition-colors"
                style={{
                  padding: '0.6rem 0.75rem',
                  borderRadius: 'var(--vibe-radius-input, 8px)',
                  border: '1px solid var(--color-border)',
                  backgroundColor: 'var(--color-bg-card)',
                  cursor: adding ? 'wait' : 'pointer',
                  opacity: adding ? 0.6 : 1,
                }}
              >
                <Icon size={16} style={{ color: 'var(--color-text-secondary)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{
                    fontWeight: 500,
                    fontSize: 'var(--font-size-sm, 0.875rem)',
                    color: 'var(--color-text-heading)',
                    margin: 0,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}>
                    {list.title}
                  </p>
                  <p style={{
                    fontSize: 'var(--font-size-xs, 0.75rem)',
                    color: 'var(--color-text-secondary)',
                    margin: 0,
                    textTransform: 'capitalize',
                  }}>
                    {list.list_type.replace(/_/g, ' ')}
                  </p>
                </div>
              </button>
            )
          })}

          {activeLists.length === 0 && search.trim() && (
            <p style={{
              textAlign: 'center',
              padding: '1rem',
              fontSize: 'var(--font-size-sm, 0.875rem)',
              color: 'var(--color-text-secondary)',
            }}>
              No lists matching "{search}"
            </p>
          )}
        </div>
      </div>
    </div>,
    document.body,
  )
}
