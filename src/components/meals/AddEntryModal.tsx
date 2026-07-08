/**
 * AddEntryModal — PRD-42 KitchenCompass §6.1
 * The "+" in an empty plan cell: pick an existing recipe or type something
 * freeform ("Leftovers", "Pizza night out").
 */

import { useMemo, useState } from 'react'
import { X, Search, ChefHat } from 'lucide-react'
import { useRecipes } from '@/hooks/useRecipes'
import { useCreateMealPlanEntry } from '@/hooks/useMealPlan'
import type { MealSlot } from '@/types/meals'

interface AddEntryModalProps {
  familyId: string
  memberId: string
  entryDate: string
  mealSlot: MealSlot
  onClose: () => void
}

export function AddEntryModal({ familyId, memberId, entryDate, mealSlot, onClose }: AddEntryModalProps) {
  const { data: recipes = [] } = useRecipes(familyId)
  const [search, setSearch] = useState('')
  const [freeformTitle, setFreeformTitle] = useState('')
  const createEntry = useCreateMealPlanEntry()

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return recipes.slice(0, 8)
    return recipes.filter((r) => r.title.toLowerCase().includes(q)).slice(0, 8)
  }, [recipes, search])

  async function addRecipe(recipeId: string, title: string, servingsBase: number | null) {
    await createEntry.mutateAsync({ familyId, createdBy: memberId, entryDate, mealSlot, recipeId, titleSnapshot: title, servingsPlanned: servingsBase })
    onClose()
  }

  async function addFreeform() {
    if (!freeformTitle.trim()) return
    await createEntry.mutateAsync({ familyId, createdBy: memberId, entryDate, mealSlot, titleSnapshot: freeformTitle.trim() })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl p-5 space-y-3 density-compact" style={{ backgroundColor: 'var(--color-bg-card)' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>What are we having?</h3>
          <button onClick={onClose}><X size={16} style={{ color: 'var(--color-text-secondary)' }} /></button>
        </div>

        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-text-secondary)' }} />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your recipes..."
            className="w-full pl-8 pr-3 py-2 rounded-lg text-sm"
            style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          />
        </div>

        <div className="max-h-56 overflow-y-auto space-y-1">
          {filtered.map((r) => (
            <button
              key={r.id}
              onClick={() => addRecipe(r.id, r.title, r.servings_base)}
              className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-left text-sm"
              style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
            >
              <ChefHat size={14} style={{ color: 'var(--color-text-secondary)' }} />
              {r.title}
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="text-xs px-1 py-2" style={{ color: 'var(--color-text-secondary)' }}>No recipes yet — add one from the Recipe Box, or type below.</p>
          )}
        </div>

        <div className="pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
          <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>Or type it freeform</label>
          <div className="flex gap-2">
            <input
              value={freeformTitle}
              onChange={(e) => setFreeformTitle(e.target.value)}
              placeholder="Leftovers, Pizza night out..."
              className="flex-1 px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            />
            <button onClick={addFreeform} disabled={!freeformTitle.trim()} className="btn-primary px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-40">Add</button>
          </div>
        </div>
      </div>
    </div>
  )
}
