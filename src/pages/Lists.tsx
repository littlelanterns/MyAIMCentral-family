/**
 * Lists Page — PRD-09B Screen 2 + 3 + 4
 * Full reference collection management surface.
 * Types: Shopping, Wishlist, Expenses, Packing, To-Do, Custom, Randomizer.
 */

import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  List as ListIcon, Plus, ShoppingCart, Gift, Luggage, DollarSign,
  CheckSquare, Pencil, X, ExternalLink, ChevronDown, ChevronRight,
  ArrowRight, RotateCcw, Archive, Loader2,
  Clock, Lightbulb, Heart,
} from 'lucide-react'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import {
  useLists, useList, useListItems, useCreateList, useCreateListItem,
  useToggleListItem, useDeleteListItem, useUpdateListItem,
  useUncheckAllItems, usePromoteListItem, useArchiveList,
} from '@/hooks/useLists'
import { FeatureGuide, FeatureIcon } from '@/components/shared'
import type { ListItem, ListType } from '@/types/lists'
import { Randomizer } from '@/components/lists/Randomizer'

// ── Type config ────────────────────────────────────────────

const TYPE_CONFIG: Record<string, { icon: typeof ListIcon; label: string; description: string; isSystem?: boolean }> = {
  shopping: { icon: ShoppingCart, label: 'Shopping', description: 'Quantities, aisle, store grouping' },
  wishlist: { icon: Gift, label: 'Wishlist', description: 'URLs, prices, gift recipient' },
  packing: { icon: Luggage, label: 'Packing', description: 'Category sections, progress bar' },
  expenses: { icon: DollarSign, label: 'Expenses', description: 'Amounts, categories, totals' },
  todo: { icon: CheckSquare, label: 'To-Do', description: 'Checkboxes, promotable to tasks' },
  custom: { icon: Pencil, label: 'Custom', description: 'Flexible — you define the format' },
  simple: { icon: ListIcon, label: 'Simple', description: 'Basic checklist' },
  checklist: { icon: CheckSquare, label: 'Checklist', description: 'Check items off' },
  randomizer: { icon: RotateCcw, label: 'Randomizer', description: 'Draw random items' },
  backburner: { icon: Clock, label: 'Backburner', description: 'Someday/maybe — park it for later', isSystem: true },
  ideas: { icon: Lightbulb, label: 'Ideas', description: 'Capture raw ideas before they become anything', isSystem: true },
  prayer: { icon: Heart, label: 'Prayer', description: 'Ongoing prayer items and intentions' },
  reference: { icon: Lightbulb, label: 'Reference', description: 'Info to keep handy' },
}

const FILTER_TABS: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'shopping', label: 'Shopping' },
  { key: 'wishlist', label: 'Wishlists' },
  { key: 'packing', label: 'Packing' },
  { key: 'todo', label: 'To-Do' },
  { key: 'backburner', label: 'Backburner' },
  { key: 'ideas', label: 'Ideas' },
  { key: 'custom', label: 'Custom' },
  { key: 'shared', label: 'Shared' },
]

// ── Main page ──────────────────────────────────────────────

export function ListsPage() {
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { data: lists = [], isLoading } = useLists(family?.id)
  const createList = useCreateList()

  const [searchParams, setSearchParams] = useSearchParams()
  const [filter, setFilter] = useState('all')
  const [showCreate, setShowCreate] = useState(false)
  const [selectedListId, setSelectedListId] = useState<string | null>(null)
  const [createType, setCreateType] = useState<ListType | null>(null)
  const [createTitle, setCreateTitle] = useState('')

  // Handle ?create=<type> URL param from Studio navigation
  useEffect(() => {
    const createParam = searchParams.get('create')
    if (createParam) {
      setCreateType(createParam as ListType)
      setShowCreate(true)
      setSearchParams({}, { replace: true })
    }
  }, [])

  // Filter lists
  const activeLists = lists.filter(l => !l.archived_at)
  const filtered = filter === 'all'
    ? activeLists
    : filter === 'shared'
      ? activeLists.filter(l => l.is_shared)
      : activeLists.filter(l => l.list_type === filter)

  async function handleCreate() {
    if (!member || !family || !createTitle.trim() || !createType) return
    const result = await createList.mutateAsync({
      family_id: family.id,
      owner_id: member.id,
      title: createTitle.trim(),
      list_type: createType,
    })
    setCreateTitle('')
    setCreateType(null)
    setShowCreate(false)
    setSelectedListId(result.id)
  }

  // If a list is selected, show detail view
  if (selectedListId) {
    return (
      <ListDetailView
        listId={selectedListId}
        onBack={() => setSelectedListId(null)}
      />
    )
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <FeatureGuide featureKey="lists_detail" />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FeatureIcon featureKey="lists" fallback={<ListIcon size={32} style={{ color: 'var(--color-btn-primary-bg)' }} />} size={32} />
          <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}>
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

      {/* Filter tabs */}
      <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
        {FILTER_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setFilter(tab.key)}
            className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors"
            style={{
              backgroundColor: filter === tab.key ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-card)',
              color: filter === tab.key ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
              border: `1px solid ${filter === tab.key ? 'transparent' : 'var(--color-border)'}`,
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Create modal */}
      {showCreate && (
        <div className="rounded-xl overflow-hidden" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          {!createType ? (
            <div className="p-4 space-y-3">
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>What kind of list?</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {(['shopping', 'wishlist', 'expenses', 'packing', 'todo', 'ideas', 'prayer', 'backburner', 'custom'] as ListType[]).map(type => {
                  const cfg = TYPE_CONFIG[type]
                  const Icon = cfg.icon
                  return (
                    <button
                      key={type}
                      onClick={() => setCreateType(type)}
                      className="flex flex-col items-center gap-2 p-3 rounded-lg transition-all hover:scale-[1.02]"
                      style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
                    >
                      <Icon size={20} style={{ color: 'var(--color-btn-primary-bg)' }} />
                      <span className="text-xs font-medium" style={{ color: 'var(--color-text-heading)' }}>{cfg.label}</span>
                      <span className="text-[10px] text-center" style={{ color: 'var(--color-text-secondary)' }}>{cfg.description}</span>
                    </button>
                  )
                })}
              </div>
              <button onClick={() => setShowCreate(false)} className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
            </div>
          ) : (
            <div className="p-4 space-y-3">
              <p className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
                New {TYPE_CONFIG[createType]?.label ?? 'List'}
              </p>
              <input
                type="text"
                placeholder="List name"
                value={createTitle}
                onChange={e => setCreateTitle(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                autoFocus
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              />
              <div className="flex gap-2 justify-end">
                <button onClick={() => { setCreateType(null); setShowCreate(false) }} className="px-3 py-1.5 rounded-lg text-sm" style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
                <button
                  onClick={handleCreate}
                  disabled={!createTitle.trim()}
                  className="px-4 py-1.5 rounded-lg text-sm font-medium disabled:opacity-50"
                  style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
                >
                  Create
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* List cards */}
      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 size={24} className="animate-spin" style={{ color: 'var(--color-text-secondary)' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="p-8 rounded-lg text-center" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <ListIcon size={32} className="mx-auto mb-3" style={{ color: 'var(--color-text-secondary)' }} />
          <p className="font-medium" style={{ color: 'var(--color-text-heading)' }}>No lists yet</p>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            Create one to start organizing — shopping, packing, wishlists, and more.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(list => {
            const cfg = TYPE_CONFIG[list.list_type] ?? TYPE_CONFIG.custom
            const Icon = cfg.icon
            return (
              <button
                key={list.id}
                onClick={() => setSelectedListId(list.id)}
                className="w-full flex items-center gap-3 p-4 rounded-lg text-left transition-all hover:translate-y-[-1px] hover:shadow-sm"
                style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
              >
                <Icon size={18} style={{ color: 'var(--color-btn-primary-bg)' }} />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate" style={{ color: 'var(--color-text-heading)' }}>{list.title}</p>
                  <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {cfg.label} {list.is_shared ? ' · Shared' : ''}
                  </p>
                </div>
                <ChevronRight size={16} style={{ color: 'var(--color-text-secondary)' }} />
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

// ── List Detail View ──────────────────────────────────────

function ListDetailView({ listId, onBack }: { listId: string; onBack: () => void }) {
  const { data: list } = useList(listId)
  const { data: items = [], isLoading } = useListItems(listId)
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const createItem = useCreateListItem()
  const toggleItem = useToggleListItem()
  const deleteItem = useDeleteListItem()
  useUpdateListItem() // available for future inline editing
  const uncheckAll = useUncheckAllItems()
  const promoteItem = usePromoteListItem()
  const archiveList = useArchiveList()
  const { data: familyMembers = [] } = useFamilyMembers(list?.family_id)

  const [newItemText, setNewItemText] = useState('')
  const [newItemSection, setNewItemSection] = useState('')
  void setNewItemSection // setter available for section input field
  const [editingId, setEditingId] = useState<string | null>(null)
  const [_showAddSection, _setShowAddSection] = useState(false)

  if (!list) return null

  if (list.list_type === 'randomizer') {
    return (
      <Randomizer
        listId={list.id}
        listTitle={list.title}
        familyId={list.family_id}
        assigningMemberId={member?.id ?? ''}
        items={items.map(item => ({
          id: item.id,
          item_name: item.content || '',
          notes: item.notes ?? null,
          category: item.section_name ?? null,
          is_repeatable: item.availability_mode !== 'one_time',
        }))}
        eligibleMembers={familyMembers}
      />
    )
  }

  const cfg = TYPE_CONFIG[list.list_type] ?? TYPE_CONFIG.custom
  const Icon = cfg.icon

  // Group items by section
  const sections = new Map<string, ListItem[]>()
  const unsectioned: ListItem[] = []
  items.forEach(item => {
    if (item.section_name) {
      if (!sections.has(item.section_name)) sections.set(item.section_name, [])
      sections.get(item.section_name)!.push(item)
    } else {
      unsectioned.push(item)
    }
  })

  const totalItems = items.length
  const checkedItems = items.filter(i => i.checked).length
  const totalPrice = items.reduce((sum, i) => sum + (i.price ?? 0), 0)

  async function addItem() {
    if (!newItemText.trim()) return
    await createItem.mutateAsync({
      list_id: listId,
      content: newItemText.trim(),
      section_name: newItemSection || undefined,
      sort_order: items.length,
    })
    setNewItemText('')
  }

  async function handlePromote(item: ListItem) {
    if (!family || !member) return
    await promoteItem.mutateAsync({
      itemId: item.id,
      content: item.content || item.item_name || '',
      familyId: family.id,
      memberId: member.id,
      listId,
    })
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="p-1.5 rounded-lg" style={{ color: 'var(--color-text-secondary)' }}>
          <ChevronDown size={20} className="rotate-90" />
        </button>
        <Icon size={20} style={{ color: 'var(--color-btn-primary-bg)' }} />
        <h1 className="text-xl font-bold flex-1" style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}>
          {list.title}
        </h1>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => uncheckAll.mutate(listId)}
            className="p-1.5 rounded-lg text-xs"
            style={{ color: 'var(--color-text-secondary)' }}
            title="Uncheck all"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={() => { archiveList.mutate(listId); onBack() }}
            className="p-1.5 rounded-lg text-xs"
            style={{ color: 'var(--color-text-secondary)' }}
            title="Archive"
          >
            <Archive size={16} />
          </button>
        </div>
      </div>

      {/* Progress */}
      {totalItems > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${(checkedItems / totalItems) * 100}%`, backgroundColor: 'var(--color-btn-primary-bg)' }}
            />
          </div>
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            {checkedItems}/{totalItems}
          </span>
        </div>
      )}

      {/* Price total for wishlists/expenses */}
      {(list.list_type === 'wishlist' || list.list_type === 'expenses') && totalPrice > 0 && (
        <div className="text-right text-sm font-medium" style={{ color: 'var(--color-btn-primary-bg)' }}>
          Total: ${totalPrice.toFixed(2)}
        </div>
      )}

      {/* Items by section */}
      {Array.from(sections.entries()).map(([sectionName, sectionItems]) => (
        <div key={sectionName}>
          <p className="text-xs font-semibold uppercase tracking-wider px-1 pb-1" style={{ color: 'var(--color-text-secondary)' }}>
            {sectionName}
          </p>
          <div className="space-y-1">
            {sectionItems.sort((a, b) => a.sort_order - b.sort_order).map(item => (
              <ListItemRow
                key={item.id}
                item={item}
                listType={list.list_type}
                onToggle={() => toggleItem.mutate({ id: item.id, checked: !item.checked, listId, checkedBy: member?.id })}
                onDelete={() => deleteItem.mutate({ id: item.id, listId })}
                onPromote={() => handlePromote(item)}
                isEditing={editingId === item.id}
                onEdit={() => setEditingId(editingId === item.id ? null : item.id)}
              />
            ))}
          </div>
        </div>
      ))}

      {/* Unsectioned items */}
      {unsectioned.length > 0 && (
        <div className="space-y-1">
          {unsectioned.sort((a, b) => a.sort_order - b.sort_order).map(item => (
            <ListItemRow
              key={item.id}
              item={item}
              listType={list.list_type}
              onToggle={() => toggleItem.mutate({ id: item.id, checked: !item.checked, listId, checkedBy: member?.id })}
              onDelete={() => deleteItem.mutate({ id: item.id, listId })}
              onPromote={() => handlePromote(item)}
              isEditing={editingId === item.id}
              onEdit={() => setEditingId(editingId === item.id ? null : item.id)}
            />
          ))}
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && !isLoading && (
        <div className="p-6 rounded-lg text-center" style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}>
          <Icon size={28} className="mx-auto mb-2" style={{ color: 'var(--color-text-secondary)' }} />
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            This list is ready for items! Start adding below.
          </p>
        </div>
      )}

      {/* Add item */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newItemText}
          onChange={e => setNewItemText(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addItem()}
          placeholder="Add an item..."
          className="flex-1 px-3 py-2 rounded-lg text-sm"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
        />
        <button
          onClick={addItem}
          disabled={!newItemText.trim()}
          className="px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
          style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
        >
          <Plus size={16} />
        </button>
      </div>
    </div>
  )
}

// ── List Item Row ──────────────────────────────────────────

function ListItemRow({
  item,
  listType,
  onToggle,
  onDelete,
  onPromote,
  isEditing: _isEditing,
  onEdit: _onEdit,
}: {
  item: ListItem
  listType: string
  onToggle: () => void
  onDelete: () => void
  onPromote: () => void
  isEditing: boolean
  onEdit: () => void
}) {
  const isTodo = listType === 'todo'
  const isWishlist = listType === 'wishlist'
  const isExpense = listType === 'expenses'
  const isShopping = listType === 'shopping'

  return (
    <div
      className="flex items-start gap-2.5 px-3 py-2 rounded-lg group transition-colors"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        opacity: item.checked ? 0.6 : 1,
      }}
    >
      {/* Checkbox */}
      <button onClick={onToggle} className="mt-0.5 flex-shrink-0">
        <div
          className="w-5 h-5 rounded border-2 flex items-center justify-center transition-colors"
          style={{
            borderColor: item.checked ? 'var(--color-btn-primary-bg)' : 'var(--color-border)',
            backgroundColor: item.checked ? 'var(--color-btn-primary-bg)' : 'transparent',
          }}
        >
          {item.checked && <CheckSquare size={12} style={{ color: 'var(--color-btn-primary-text)' }} />}
        </div>
      </button>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p
          className={`text-sm ${item.checked ? 'line-through' : ''}`}
          style={{ color: 'var(--color-text-primary)' }}
        >
          {item.content || item.item_name}
        </p>

        {/* Type-specific fields */}
        <div className="flex flex-wrap items-center gap-2 mt-0.5">
          {isShopping && item.quantity && (
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              x{item.quantity} {item.quantity_unit ?? ''}
            </span>
          )}
          {isWishlist && item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs flex items-center gap-0.5 hover:underline"
              style={{ color: 'var(--color-btn-primary-bg)' }}
              onClick={e => e.stopPropagation()}
            >
              <ExternalLink size={10} /> Link
            </a>
          )}
          {(isWishlist || isExpense) && item.price != null && (
            <span className="text-xs font-medium" style={{ color: 'var(--color-btn-primary-bg)' }}>
              ${item.price.toFixed(2)}
            </span>
          )}
          {item.notes && (
            <span className="text-xs italic" style={{ color: 'var(--color-text-secondary)' }}>
              {item.notes}
            </span>
          )}
          {item.promoted_to_task && (
            <span className="text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, transparent)', color: 'var(--color-btn-primary-bg)' }}>
              Promoted
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
        {isTodo && !item.promoted_to_task && (
          <button onClick={onPromote} className="p-1 rounded" title="Promote to task" style={{ color: 'var(--color-btn-primary-bg)' }}>
            <ArrowRight size={14} />
          </button>
        )}
        <button onClick={onDelete} className="p-1 rounded" style={{ color: 'var(--color-text-secondary)' }}>
          <X size={14} />
        </button>
      </div>
    </div>
  )
}
