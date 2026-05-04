/**
 * ShoppingModeStoreView — Store-specific shopping view with grouping + aisle lens
 * PRD-09B Enhancement: Shopping Mode composed view
 *
 * Sub-tasks 10 (grouping), 11 (aisle lens), 12 (check-off + not today)
 */

import { useState, useMemo } from 'react'
import {
  ArrowLeft, Check, EyeOff, List, LayoutGrid, Users, Layers,
} from 'lucide-react'
import { useToggleListItem } from '@/hooks/useLists'
import { useQueryClient } from '@tanstack/react-query'
import type { ShoppingModeItem, ShoppingModeGrouping } from '@/types/lists'

interface Props {
  storeName: string
  items: ShoppingModeItem[]
  isLoading: boolean
  memberId: string
  familyId: string
  onSwitchStore: () => void
}

const GROUPING_TABS: { key: ShoppingModeGrouping; label: string; icon: React.ReactNode }[] = [
  { key: 'by_section', label: 'By Section', icon: <Layers size={14} /> },
  { key: 'by_list', label: 'By List', icon: <List size={14} /> },
  { key: 'by_person', label: 'By Person', icon: <Users size={14} /> },
  { key: 'all', label: 'All', icon: <LayoutGrid size={14} /> },
]

export function ShoppingModeStoreView({
  storeName,
  items,
  isLoading,
  memberId,
  familyId,
  onSwitchStore,
}: Props) {
  const [grouping, setGrouping] = useState<ShoppingModeGrouping>('by_section')
  const [aisleFilter, setAisleFilter] = useState<string | null>(null)
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set())
  const [recentlyChecked, setRecentlyChecked] = useState<Set<string>>(new Set())
  const toggleItem = useToggleListItem()
  const queryClient = useQueryClient()

  // Filter out hidden ("not today") items
  const visibleItems = useMemo(
    () => items.filter(i => !hiddenIds.has(i.listItem.id)),
    [items, hiddenIds],
  )

  // Extract unique aisles/store_category values
  const aisles = useMemo(() => {
    const set = new Set<string>()
    for (const item of visibleItems) {
      if (item.listItem.store_category) set.add(item.listItem.store_category)
    }
    return [...set].sort()
  }, [visibleItems])

  // Apply aisle filter
  const filteredItems = useMemo(() => {
    if (!aisleFilter) return visibleItems
    return visibleItems.filter(i => i.listItem.store_category === aisleFilter)
  }, [visibleItems, aisleFilter])

  // Group items
  const groups = useMemo(() => {
    const map = new Map<string, ShoppingModeItem[]>()

    for (const item of filteredItems) {
      let key: string
      switch (grouping) {
        case 'by_section':
          key = item.listItem.store_category || item.listItem.section_name || 'Uncategorized'
          break
        case 'by_list':
          key = item.list.title
          break
        case 'by_person':
          key = item.listItem.gift_for || 'General'
          break
        case 'all':
        default:
          key = 'All Items'
          break
      }
      if (!map.has(key)) map.set(key, [])
      map.get(key)!.push(item)
    }

    // Sort groups alphabetically, but "Uncategorized"/"General" go last
    const entries = [...map.entries()].sort(([a], [b]) => {
      if (a === 'Uncategorized' || a === 'General') return 1
      if (b === 'Uncategorized' || b === 'General') return -1
      return a.localeCompare(b)
    })

    return entries
  }, [filteredItems, grouping])

  // Count totals
  const uncheckedCount = visibleItems.filter(i => !i.listItem.checked).length
  const listCount = new Set(visibleItems.map(i => i.list.id)).size

  function handleCheckOff(item: ShoppingModeItem) {
    setRecentlyChecked(prev => new Set(prev).add(item.listItem.id))
    toggleItem.mutate(
      {
        id: item.listItem.id,
        checked: true,
        listId: item.listItem.list_id,
        checkedBy: memberId,
        familyId,
        itemContent: item.listItem.content || item.listItem.item_name || undefined,
        purchaseSnapshot: {
          section_name: item.listItem.section_name,
          store_category: item.listItem.store_category,
          quantity: item.listItem.quantity,
          quantity_unit: item.listItem.quantity_unit,
        },
      },
      {
        onSuccess: () => {
          // Fade out after a brief delay
          setTimeout(() => {
            setRecentlyChecked(prev => {
              const next = new Set(prev)
              next.delete(item.listItem.id)
              return next
            })
            queryClient.invalidateQueries({ queryKey: ['shopping-mode-items'] })
          }, 800)
        },
      },
    )
  }

  function handleNotToday(item: ShoppingModeItem) {
    setHiddenIds(prev => new Set(prev).add(item.listItem.id))
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onSwitchStore}
            className="p-2 rounded-lg"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <ArrowLeft size={20} />
          </button>
          <h1
            className="text-lg font-bold"
            style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
          >
            {storeName}
          </h1>
        </div>
        <button
          onClick={onSwitchStore}
          className="px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{
            backgroundColor: 'var(--color-bg-card)',
            color: 'var(--color-btn-primary-bg)',
            border: '1px solid var(--color-btn-primary-bg)',
          }}
        >
          Switch Store
        </button>
      </div>

      {/* Grouping tabs */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
        {GROUPING_TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setGrouping(tab.key)}
            className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors"
            style={{
              backgroundColor: grouping === tab.key ? 'var(--color-bg-card)' : 'transparent',
              color: grouping === tab.key ? 'var(--color-text-heading)' : 'var(--color-text-secondary)',
            }}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Aisle lens (sub-task 11) */}
      {aisles.length > 0 && (
        <div className="flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          <button
            onClick={() => setAisleFilter(null)}
            className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors"
            style={{
              backgroundColor: aisleFilter === null ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-card)',
              color: aisleFilter === null ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
            }}
          >
            All Aisles
          </button>
          {aisles.map(aisle => (
            <button
              key={aisle}
              onClick={() => setAisleFilter(aisleFilter === aisle ? null : aisle)}
              className="px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors"
              style={{
                backgroundColor: aisleFilter === aisle ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-card)',
                color: aisleFilter === aisle ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
              }}
            >
              {aisle}
            </button>
          ))}
        </div>
      )}

      {/* Items list */}
      {isLoading ? (
        <div className="py-8 text-center">
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading items...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div
          className="rounded-xl p-6 text-center space-y-2"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border-default)' }}
        >
          <Check size={24} style={{ color: 'var(--color-btn-primary-bg)', margin: '0 auto' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
            All done at {storeName}!
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {hiddenIds.size > 0
              ? `${hiddenIds.size} item${hiddenIds.size > 1 ? 's' : ''} hidden for today.`
              : 'Nothing left to pick up here.'
            }
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(([groupName, groupItems]) => (
            <div key={groupName} className="space-y-1">
              {/* Group header (skip for "All Items" in flat mode) */}
              {groupName !== 'All Items' && (
                <h3
                  className="text-xs font-semibold uppercase tracking-wider px-1 pt-2"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {groupName}
                  <span className="ml-1.5 font-normal">({groupItems.filter(i => !i.listItem.checked).length})</span>
                </h3>
              )}

              {groupItems.map(item => {
                const isChecked = item.listItem.checked || recentlyChecked.has(item.listItem.id)
                return (
                  <div
                    key={item.listItem.id}
                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all"
                    style={{
                      backgroundColor: 'var(--color-bg-card)',
                      border: '1px solid var(--color-border-default)',
                      opacity: isChecked ? 0.5 : 1,
                    }}
                  >
                    {/* Checkbox */}
                    <button
                      onClick={() => handleCheckOff(item)}
                      disabled={isChecked}
                      className="w-6 h-6 rounded-md flex items-center justify-center flex-shrink-0 transition-colors"
                      style={{
                        backgroundColor: isChecked ? 'var(--color-btn-primary-bg)' : 'transparent',
                        border: isChecked ? 'none' : '2px solid var(--color-border-default)',
                        color: 'var(--color-btn-primary-text)',
                      }}
                    >
                      {isChecked && <Check size={14} />}
                    </button>

                    {/* Item content */}
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-medium truncate"
                        style={{
                          color: 'var(--color-text-heading)',
                          textDecoration: isChecked ? 'line-through' : 'none',
                        }}
                      >
                        {item.listItem.quantity ? `${item.listItem.quantity}${item.listItem.quantity_unit ? ` ${item.listItem.quantity_unit}` : ''} ` : ''}
                        {item.listItem.content || item.listItem.item_name}
                      </p>
                      <p className="text-[10px] truncate" style={{ color: 'var(--color-text-secondary)' }}>
                        {item.list.title}
                        {item.listItem.store_category && grouping !== 'by_section' ? ` · ${item.listItem.store_category}` : ''}
                      </p>
                    </div>

                    {/* Not today button */}
                    {!isChecked && (
                      <button
                        onClick={() => handleNotToday(item)}
                        className="p-1.5 rounded-md flex-shrink-0"
                        style={{ color: 'var(--color-text-secondary)' }}
                        title="Not today"
                      >
                        <EyeOff size={14} />
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      )}

      {/* Bottom bar */}
      <div
        className="flex items-center justify-between px-3 py-2 rounded-lg text-xs"
        style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}
      >
        <span>{uncheckedCount} item{uncheckedCount !== 1 ? 's' : ''} remaining</span>
        <span>From {listCount} list{listCount !== 1 ? 's' : ''}</span>
      </div>
    </div>
  )
}
