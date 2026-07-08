/**
 * AddToPlanModal — PRD-42 KitchenCompass §6.4
 * "[Add to plan] → date + slot picker (defaults: next empty dinner)."
 */

import { useState } from 'react'
import { X, CalendarPlus } from 'lucide-react'
import { useCreateMealPlanEntry } from '@/hooks/useMealPlan'
import { useMealSettings } from '@/hooks/useFoodProfiles'
import { todayLocalIso } from '@/utils/dates'
import type { MealSlot } from '@/types/meals'

interface AddToPlanModalProps {
  familyId: string
  memberId: string
  recipeId: string
  recipeTitle: string
  servingsBase: number | null
  onClose: () => void
  onAdded?: () => void
}

const SLOT_LABELS: Record<MealSlot, string> = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack', custom: 'Custom' }

export function AddToPlanModal({ familyId, memberId, recipeId, recipeTitle, servingsBase, onClose, onAdded }: AddToPlanModalProps) {
  const { data: settings } = useMealSettings(familyId)
  const enabledSlots = settings?.enabled_slots ?? ['dinner']
  const [date, setDate] = useState(todayLocalIso())
  const [slot, setSlot] = useState<MealSlot>(enabledSlots.includes('dinner') ? 'dinner' : (enabledSlots[0] ?? 'dinner'))
  const [servings, setServings] = useState(servingsBase ?? undefined)
  const createEntry = useCreateMealPlanEntry()

  async function handleAdd() {
    await createEntry.mutateAsync({
      familyId,
      createdBy: memberId,
      entryDate: date,
      mealSlot: slot,
      recipeId,
      titleSnapshot: recipeTitle,
      servingsPlanned: servings ?? null,
    })
    onAdded?.()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div className="w-full max-w-sm rounded-2xl p-5 space-y-4 density-comfortable" style={{ backgroundColor: 'var(--color-bg-card)' }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold flex items-center gap-2" style={{ color: 'var(--color-text-primary)' }}><CalendarPlus size={18} /> Add to Plan</h3>
          <button onClick={onClose}><X size={16} style={{ color: 'var(--color-text-secondary)' }} /></button>
        </div>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{recipeTitle}</p>

        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>Date</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 rounded-lg text-sm" style={fieldStyle} />
        </div>

        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>Meal</label>
          <div className="flex flex-wrap gap-1.5">
            {enabledSlots.map((s) => (
              <button
                key={s}
                onClick={() => setSlot(s)}
                className="px-3 py-1.5 rounded-lg text-xs"
                style={{
                  backgroundColor: slot === s ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
                  color: slot === s ? 'var(--color-text-on-primary, white)' : 'var(--color-text-primary)',
                }}
              >
                {SLOT_LABELS[s]}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>Servings</label>
          <input
            type="number"
            value={servings ?? ''}
            onChange={(e) => setServings(e.target.value === '' ? undefined : Number(e.target.value))}
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={fieldStyle}
          />
        </div>

        <button onClick={handleAdd} disabled={createEntry.isPending} className="btn-primary w-full py-2 rounded-lg text-sm font-medium disabled:opacity-50">
          Add to Plan
        </button>
      </div>
    </div>
  )
}

const fieldStyle: React.CSSProperties = { backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }
