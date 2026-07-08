/**
 * SendToShoppingListModal — PRD-42 KitchenCompass §6.6
 *
 * The merge review screen — this IS the HITM for the batch. Identical
 * items combined with "from X, Y" provenance, each row editable/toggleable,
 * store_category shown as chips, "already have it" toggle, list picker.
 * Confirm writes through the EXISTING list_items pipeline (ruling 2 — no
 * parallel grocery machinery).
 */

import { useMemo, useState } from 'react'
import { X, ShoppingCart, Check, Loader2 } from 'lucide-react'
import { useLists } from '@/hooks/useLists'
import { useSendIngredientsToShoppingList, type ShoppingHandoffIngredient } from '@/hooks/useMealPlan'
import type { RecipeIngredient } from '@/types/meals'

export interface ShoppingSourceEntry {
  entryDate: string
  recipeTitle: string
  ingredients: RecipeIngredient[]
}

interface MergedRow extends ShoppingHandoffIngredient {
  id: string
  include: boolean
  alreadyHave: boolean
  fromRecipes: string[]
}

interface SendToShoppingListModalProps {
  familyId: string
  entries: ShoppingSourceEntry[]
  onClose: () => void
  onSent?: () => void
}

const STORE_CATEGORIES = ['produce', 'dairy', 'meat', 'pantry', 'frozen', 'bakery', 'household', 'other']

function mergeEntries(entries: ShoppingSourceEntry[]): MergedRow[] {
  const byKey = new Map<string, MergedRow>()
  for (const entry of entries) {
    for (const ing of entry.ingredients) {
      const itemName = ing.item || ing.text
      const key = itemName.trim().toLowerCase()
      const existing = byKey.get(key)
      if (existing) {
        if (ing.quantity != null && existing.scaledQuantity != null) {
          existing.scaledQuantity += ing.quantity
        } else if (ing.quantity != null) {
          existing.scaledQuantity = ing.quantity
        }
        if (!existing.fromRecipes.includes(entry.recipeTitle)) existing.fromRecipes.push(entry.recipeTitle)
      } else {
        byKey.set(key, {
          ...ing,
          id: key,
          scaledQuantity: ing.quantity,
          sourceRecipeTitle: entry.recipeTitle,
          sourceEntryDate: entry.entryDate,
          include: true,
          alreadyHave: false,
          fromRecipes: [entry.recipeTitle],
        })
      }
    }
  }
  return Array.from(byKey.values())
}

export function SendToShoppingListModal({ familyId, entries, onClose, onSent }: SendToShoppingListModalProps) {
  const { data: lists = [] } = useLists(familyId)
  const shoppingLists = lists.filter((l) => l.list_type === 'shopping')
  const [selectedListId, setSelectedListId] = useState<string>(shoppingLists[0]?.id ?? lists[0]?.id ?? '')
  const [rows, setRows] = useState<MergedRow[]>(() => mergeEntries(entries))
  const [sentCount, setSentCount] = useState<number | null>(null)

  const sendMutation = useSendIngredientsToShoppingList()

  const includedRows = useMemo(() => rows.filter((r) => r.include && !r.alreadyHave), [rows])

  function updateRow(id: string, patch: Partial<MergedRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)))
  }

  async function handleConfirm() {
    if (!selectedListId || includedRows.length === 0) return
    const result = await sendMutation.mutateAsync({ listId: selectedListId, items: includedRows })
    setSentCount(result.count)
  }

  if (sentCount !== null) {
    const listName = lists.find((l) => l.id === selectedListId)?.title ?? 'your list'
    return (
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="w-full max-w-sm rounded-2xl p-6 text-center space-y-3" style={{ backgroundColor: 'var(--color-bg-card)' }}>
          <Check size={32} className="mx-auto" style={{ color: 'var(--color-accent)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {sentCount} item{sentCount === 1 ? '' : 's'} added to {listName}.
          </p>
          <button onClick={() => { onSent?.(); onClose() }} className="btn-primary px-4 py-2 rounded-lg text-sm font-medium">Done</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div
        className="w-full max-w-xl max-h-[85vh] overflow-y-auto rounded-2xl p-5 space-y-4 density-compact"
        style={{ backgroundColor: 'var(--color-bg-card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}>
            <ShoppingCart size={18} /> Send to Shopping List
          </h3>
          <button onClick={onClose}><X size={16} style={{ color: 'var(--color-text-secondary)' }} /></button>
        </div>

        {lists.length > 0 ? (
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>List</label>
            <select
              data-testid="shopping-list-picker"
              value={selectedListId}
              onChange={(e) => setSelectedListId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            >
              {lists.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
          </div>
        ) : (
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Create a shopping list first from the Lists page.</p>
        )}

        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.id} className="flex items-center gap-2 p-2 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)', opacity: row.alreadyHave ? 0.5 : 1 }}>
              <input type="checkbox" checked={row.include} onChange={(e) => updateRow(row.id, { include: e.target.checked })} />
              <input
                value={row.item}
                onChange={(e) => updateRow(row.id, { item: e.target.value })}
                className="flex-1 px-2 py-1 rounded text-sm"
                style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              />
              <input
                type="number"
                value={row.scaledQuantity ?? ''}
                onChange={(e) => updateRow(row.id, { scaledQuantity: e.target.value === '' ? null : Number(e.target.value) })}
                className="w-16 px-1.5 py-1 rounded text-sm"
                style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              />
              <select
                value={row.store_category ?? 'other'}
                onChange={(e) => updateRow(row.id, { store_category: e.target.value })}
                className="px-1.5 py-1 rounded text-xs capitalize shrink-0"
                style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}
              >
                {STORE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
              <label className="flex items-center gap-1 text-[10px] shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
                <input type="checkbox" checked={row.alreadyHave} onChange={(e) => updateRow(row.id, { alreadyHave: e.target.checked })} />
                Have it
              </label>
            </div>
          ))}
        </div>

        <p className="text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
          Already-sent items won't double — review the merge above before confirming.
        </p>

        <button
          onClick={handleConfirm}
          disabled={sendMutation.isPending || !selectedListId || includedRows.length === 0}
          className="btn-primary w-full py-2.5 rounded-lg text-sm font-medium disabled:opacity-40 flex items-center justify-center gap-2"
        >
          {sendMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <ShoppingCart size={14} />}
          Add {includedRows.length} item{includedRows.length === 1 ? '' : 's'}
        </button>
      </div>
    </div>
  )
}
