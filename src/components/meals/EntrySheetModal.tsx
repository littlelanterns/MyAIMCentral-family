/**
 * EntrySheetModal — PRD-42 KitchenCompass §6.1
 *
 * Tap a plan entry: view recipe, [Cook this], change servings, assign cook,
 * kids-helped pills, mark made / didn't happen / move, notes, remove. The
 * mark-made follow-up strip offers leftovers / kids-helped homeschool
 * minutes / a cooking Victory (PRD §12.1-3 fold-ins).
 */

import { useState } from 'react'
import { X, ChefHat, Trash2, Check, Undo2, CalendarClock, Camera, PartyPopper } from 'lucide-react'
import { useFamilyMembers } from '@/hooks/useFamilyMember'
import MemberPillSelector from '@/components/shared/MemberPillSelector'
import {
  useUpdateMealPlanEntry, useMarkMealMade, useMarkMealDidntHappen, useAssignCook, useSetKidsHelped,
  useCreateLeftoverEntry, useLogCookingHomeschoolMinutes, useCreateMealVictory, useDeleteMealPlanEntry,
} from '@/hooks/useMealPlan'
import { CookViewModal } from './CookViewModal'
import { RecipeDetailModal } from './RecipeDetailModal'
import { localIsoDaysFromToday } from '@/utils/dates'
import type { MealPlanEntryWithRecipe, MealSlot } from '@/types/meals'

interface EntrySheetModalProps {
  familyId: string
  memberId: string
  isMomOrGrant: boolean
  entry: MealPlanEntryWithRecipe
  onClose: () => void
}

export function EntrySheetModal({ familyId, memberId, isMomOrGrant, entry, onClose }: EntrySheetModalProps) {
  const { data: members = [] } = useFamilyMembers(familyId)
  const [servings, setServings] = useState(entry.servings_planned ?? undefined)
  const [notes, setNotes] = useState(entry.notes ?? '')
  const [showCookView, setShowCookView] = useState(false)
  const [showDetail, setShowDetail] = useState(false)
  const [showFollowUp, setShowFollowUp] = useState(entry.status === 'made')
  const [homeschoolLogged, setHomeschoolLogged] = useState(false)
  const [victoryLogged, setVictoryLogged] = useState(false)

  const updateEntry = useUpdateMealPlanEntry()
  const markMade = useMarkMealMade()
  const markDidntHappen = useMarkMealDidntHappen()
  const assignCook = useAssignCook()
  const setKidsHelped = useSetKidsHelped()
  const createLeftover = useCreateLeftoverEntry()
  const logHomeschool = useLogCookingHomeschoolMinutes()
  const createVictory = useCreateMealVictory()
  const deleteEntry = useDeleteMealPlanEntry()

  async function handleMarkMade() {
    await markMade.mutateAsync({ id: entry.id, familyId, recipeId: entry.recipe_id })
    setShowFollowUp(true)
  }

  async function handleDidntHappen() {
    await markDidntHappen.mutateAsync({ id: entry.id, familyId })
    onClose()
  }

  async function handleSaveNotesAndServings() {
    await updateEntry.mutateAsync({ id: entry.id, familyId, updates: { notes, servings_planned: servings ?? null } })
  }

  async function handlePlanLeftovers() {
    await createLeftover.mutateAsync({
      familyId, createdBy: memberId, sourceTitle: entry.title_snapshot,
      nextDate: localIsoDaysFromToday(1), mealSlot: entry.meal_slot as MealSlot,
    })
  }

  async function handleLogHomeschoolMinutes(kidId: string) {
    await logHomeschool.mutateAsync({
      familyId, memberId: kidId, minutes: 20,
      description: `Helped cook: ${entry.title_snapshot}`,
      approvedBy: isMomOrGrant ? memberId : null,
    })
    setHomeschoolLogged(true)
  }

  async function handleCelebrate(kidId: string) {
    const kid = members.find((m) => m.id === kidId)
    await createVictory.mutateAsync({
      familyId, memberId: kidId,
      memberType: kid?.dashboard_mode === 'guided' ? 'guided' : kid?.dashboard_mode === 'play' ? 'play' : kid?.dashboard_mode === 'independent' ? 'teen' : 'child',
      description: `Helped make ${entry.title_snapshot}!`,
      sourceReferenceId: entry.id,
    })
    setVictoryLogged(true)
  }

  async function handleRemove() {
    await deleteEntry.mutateAsync({ id: entry.id, familyId })
    onClose()
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div
        className="w-full max-w-md max-h-[85vh] overflow-y-auto rounded-2xl p-5 space-y-4 density-comfortable"
        style={{ backgroundColor: 'var(--color-bg-card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{entry.title_snapshot}</h3>
          <button onClick={onClose}><X size={16} style={{ color: 'var(--color-text-secondary)' }} /></button>
        </div>

        {entry.recipe_id && (
          <div className="flex gap-2">
            <button onClick={() => setShowDetail(true)} className="flex-1 px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}>
              View recipe
            </button>
            <button onClick={() => setShowCookView(true)} className="btn-primary flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium">
              <ChefHat size={14} /> Cook this
            </button>
          </div>
        )}

        {isMomOrGrant && (
          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>Servings</label>
            <input
              type="number"
              value={servings ?? ''}
              onChange={(e) => setServings(e.target.value === '' ? undefined : Number(e.target.value))}
              onBlur={handleSaveNotesAndServings}
              className="w-full px-3 py-2 rounded-lg text-sm"
              style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            />
          </div>
        )}

        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>Who's cooking?</label>
          <MemberPillSelector
            members={members}
            selectedIds={entry.cook_member_id ? [entry.cook_member_id] : []}
            onToggle={(id: string) => assignCook.mutate({ id: entry.id, familyId, cookMemberId: entry.cook_member_id === id ? null : id })}
            showSortToggle={false}
            variant="compact"
          />
        </div>

        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>Kids helped?</label>
          <MemberPillSelector
            members={members}
            selectedIds={entry.kids_helped_member_ids}
            onToggle={(id: string) => {
              const next = entry.kids_helped_member_ids.includes(id)
                ? entry.kids_helped_member_ids.filter((k) => k !== id)
                : [...entry.kids_helped_member_ids, id]
              setKidsHelped.mutate({ id: entry.id, familyId, kidsHelpedMemberIds: next })
            }}
            showSortToggle={false}
            variant="compact"
          />
        </div>

        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleSaveNotesAndServings}
            rows={2}
            className="w-full px-3 py-2 rounded-lg text-sm"
            style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          />
        </div>

        {entry.status !== 'made' && !showFollowUp && (
          <div className="flex gap-2">
            <button onClick={handleMarkMade} className="btn-primary flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium">
              <Check size={14} /> Mark made
            </button>
            <button onClick={handleDidntHappen} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm" style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}>
              <Undo2 size={14} /> Didn't happen
            </button>
          </div>
        )}

        {showFollowUp && (
          <div className="p-3 rounded-lg space-y-2" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>Nice work!</p>
            <button onClick={handlePlanLeftovers} className="flex items-center gap-1.5 text-sm px-2 py-1 rounded" style={{ color: 'var(--color-accent)' }}>
              <CalendarClock size={14} /> Plan leftovers tomorrow?
            </button>
            {entry.kids_helped_member_ids.map((kidId) => {
              const kid = members.find((m) => m.id === kidId)
              if (!kid) return null
              return (
                <div key={kidId} className="flex items-center gap-2 flex-wrap">
                  {!homeschoolLogged && (
                    <button onClick={() => handleLogHomeschoolMinutes(kidId)} className="flex items-center gap-1.5 text-sm px-2 py-1 rounded" style={{ color: 'var(--color-accent)' }}>
                      <Camera size={14} /> Log {kid.display_name}'s homeschool minutes
                    </button>
                  )}
                  {!victoryLogged && (
                    <button onClick={() => handleCelebrate(kidId)} className="flex items-center gap-1.5 text-sm px-2 py-1 rounded" style={{ color: 'var(--color-accent)' }}>
                      <PartyPopper size={14} /> Celebrate {kid.display_name}
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {isMomOrGrant && (
          <button onClick={handleRemove} className="flex items-center gap-1.5 text-xs px-2 py-1 rounded" style={{ color: 'var(--color-text-secondary)' }}>
            <Trash2 size={12} /> Remove from plan
          </button>
        )}
      </div>

      {showCookView && entry.recipe_id && (
        <CookViewModal familyId={familyId} memberId={memberId} recipeId={entry.recipe_id} servingsPlanned={entry.servings_planned} onClose={() => setShowCookView(false)} />
      )}
      {showDetail && entry.recipe_id && (
        <RecipeDetailModal recipeId={entry.recipe_id} familyId={familyId} memberId={memberId} isMom={isMomOrGrant} onClose={() => setShowDetail(false)} />
      )}
    </div>
  )
}
