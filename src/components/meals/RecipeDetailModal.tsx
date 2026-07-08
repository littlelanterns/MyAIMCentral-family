/**
 * RecipeDetailModal — PRD-42 KitchenCompass §6.4
 *
 * Hero, meta, scaling stepper (client-side math + optional scale_assist),
 * saved versions, Add to plan, Send to shopping list, kid hearts strip,
 * Family Pointers section, made-it history, mom's rotation dial, teen
 * approval bar.
 */

import { useMemo, useState } from 'react'
import {
  X, Heart, HeartOff, Star, Clock, Users, Save, CalendarPlus, ShoppingCart,
  Mic, MicOff, Plus, Trash2, Check, Loader2, Sparkles,
} from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import {
  useRecipe, useRecipeVersions, useRecipePointers, useRecipeHearts, useSaveRecipeVersion, useDeleteRecipeVersion,
  useSetRecipeRotation, useToggleRecipeAiInclusion, useApproveRecipe, useCreatePointer, useDeletePointer,
} from '@/hooks/useRecipes'
import { useFamilyMembers } from '@/hooks/useFamilyMember'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { getMemberColor } from '@/lib/memberColors'
import { Avatar } from '@/components/shared/Avatar'
import { todayLocalIso } from '@/utils/dates'
import { AddToPlanModal } from './AddToPlanModal'
import { SendToShoppingListModal } from './SendToShoppingListModal'
import type { RecipeIngredient, RecipeRotation } from '@/types/meals'

interface RecipeDetailModalProps {
  recipeId: string
  familyId: string
  memberId: string
  isMom?: boolean
  onClose: () => void
}

const SCALE_PRESETS = [0.5, 1, 1.5, 2, 3, 4]

function scaleIngredient(ing: RecipeIngredient, factor: number): RecipeIngredient {
  if (ing.quantity == null) return ing
  if (ing.scaling_note) return ing // awkward conversion — leave as-is until scale_assist runs
  return { ...ing, quantity: Math.round(ing.quantity * factor * 100) / 100 }
}

export function RecipeDetailModal({ recipeId, familyId, memberId, isMom = false, onClose }: RecipeDetailModalProps) {
  const { data: recipe } = useRecipe(recipeId)
  const { data: versions = [] } = useRecipeVersions(recipeId)
  const { data: pointers = [] } = useRecipePointers(familyId, recipeId)
  const { data: heartedMemberIds = [] } = useRecipeHearts(recipeId)
  const { data: members = [] } = useFamilyMembers(familyId)

  const [scaleFactor, setScaleFactor] = useState(1)
  const [customScale, setCustomScale] = useState('')
  const [smoothing, setSmoothing] = useState(false)
  const [smoothedIngredients, setSmoothedIngredients] = useState<RecipeIngredient[] | null>(null)
  const [showAddToPlan, setShowAddToPlan] = useState(false)
  const [showSendToShopping, setShowSendToShopping] = useState(false)
  const [showSaveVersion, setShowSaveVersion] = useState(false)
  const [versionLabel, setVersionLabel] = useState('')
  const [newPointerText, setNewPointerText] = useState('')
  const [newTechniqueTag, setNewTechniqueTag] = useState('')

  const saveVersion = useSaveRecipeVersion()
  const deleteVersion = useDeleteRecipeVersion()
  const setRotation = useSetRecipeRotation()
  const toggleAiInclusion = useToggleRecipeAiInclusion()
  const approveRecipe = useApproveRecipe()
  const createPointer = useCreatePointer()
  const deletePointer = useDeletePointer()
  const voice = useVoiceInput()

  const scaledIngredients = useMemo(() => {
    if (!recipe) return []
    const source = smoothedIngredients ?? recipe.ingredients
    if (smoothedIngredients) return source // already scaled by scale_assist
    return source.map((ing) => scaleIngredient(ing, scaleFactor))
  }, [recipe, scaleFactor, smoothedIngredients])

  const hasAwkwardIngredients = scaledIngredients.some((i) => i.scaling_note && scaleFactor !== 1)

  async function handleScaleAssist() {
    if (!recipe) return
    setSmoothing(true)
    try {
      const { data, error } = await supabase.functions.invoke('recipe-extract', {
        body: { mode: 'scale_assist', ingredients: scaledIngredients, scale_factor: scaleFactor, family_id: familyId, member_id: memberId },
      })
      if (error) throw error
      if (data?.result?.ingredients) setSmoothedIngredients(data.result.ingredients)
    } finally {
      setSmoothing(false)
    }
  }

  function applyScale(factor: number) {
    setScaleFactor(factor)
    setSmoothedIngredients(null)
    setCustomScale('')
  }

  async function handleSaveVersion() {
    if (!recipe || !versionLabel.trim()) return
    await saveVersion.mutateAsync({
      recipeId: recipe.id,
      familyId,
      createdBy: memberId,
      label: versionLabel.trim(),
      scaleFactor,
      servings: recipe.servings_base ? recipe.servings_base * scaleFactor : null,
      ingredients: scaledIngredients,
    })
    setVersionLabel('')
    setShowSaveVersion(false)
  }

  async function handleMicPointer() {
    if (voice.state === 'recording') {
      const text = await voice.stopRecording()
      if (text) setNewPointerText((prev) => (prev ? `${prev} ${text}` : text))
    } else if (voice.state === 'idle') {
      await voice.startRecording()
    }
  }

  async function handleAddPointer(isTechnique: boolean) {
    if (!newPointerText.trim()) return
    await createPointer.mutateAsync({
      familyId,
      createdBy: memberId,
      recipeId: isTechnique ? null : recipeId,
      techniqueTag: isTechnique ? (newTechniqueTag.trim() || newPointerText.trim().slice(0, 40)) : null,
      text: newPointerText.trim(),
      sortOrder: pointers.length,
    })
    setNewPointerText('')
    setNewTechniqueTag('')
  }

  if (!recipe) return null

  const heartedBy = members.filter((m) => heartedMemberIds.includes(m.id))

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }} onClick={onClose}>
      <div
        className="density-comfortable w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{ backgroundColor: 'var(--color-bg-card)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <div className="h-40 flex items-center justify-center rounded-t-2xl" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            {recipe.photo_urls[0] ? (
              <img src={recipe.photo_urls[0]} alt="" className="w-full h-full object-cover rounded-t-2xl" />
            ) : (
              <Sparkles size={32} style={{ color: 'var(--color-text-secondary)' }} />
            )}
          </div>
          <button data-testid="recipe-detail-close" onClick={onClose} className="absolute top-3 right-3 p-1.5 rounded-full" style={{ backgroundColor: 'rgba(0,0,0,0.4)', color: 'white' }}>
            <X size={16} />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{recipe.title}</h2>
            <button onClick={() => toggleAiInclusion.mutate({ id: recipe.id, familyId, isIncluded: !recipe.is_included_in_ai })}>
              {recipe.is_included_in_ai ? (
                <Heart size={20} fill="currentColor" style={{ color: 'var(--color-accent)' }} />
              ) : (
                <HeartOff size={20} style={{ color: 'var(--color-text-secondary)' }} />
              )}
            </button>
          </div>
          {recipe.description && <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{recipe.description}</p>}

          <div className="flex items-center gap-3 flex-wrap text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {recipe.total_minutes && <span className="flex items-center gap-1"><Clock size={12} /> {recipe.total_minutes} min</span>}
            {recipe.servings_base && <span className="flex items-center gap-1"><Users size={12} /> {recipe.servings_base} servings</span>}
            {recipe.effort_level && <span className="capitalize">{recipe.effort_level}</span>}
            {recipe.times_made > 0 && <span>Made {recipe.times_made}×</span>}
          </div>

          {heartedBy.length > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {heartedBy.map((m) => (
                  <Avatar key={m.id} src={m.avatar_url} name={m.display_name} color={getMemberColor(m)} size="sm" />
                ))}
              </div>
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                Loved by {heartedBy.map((m) => m.display_name).join(' and ')}
              </span>
            </div>
          )}
          {recipe.rotation === 'favorite' && (
            <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-accent)' }}>
              <Star size={12} fill="currentColor" /> Family favorite
            </div>
          )}

          {recipe.approval_status === 'suggested' && isMom && (
            <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
              <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>Suggested recipe — waiting for your approval.</span>
              <button
                onClick={() => approveRecipe.mutate({ id: recipe.id, familyId })}
                className="btn-primary flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium"
              >
                <Check size={12} /> Approve
              </button>
            </div>
          )}

          {/* Scaling stepper */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>Scale</span>
              <button onClick={() => setShowSaveVersion(true)} className="flex items-center gap-1 text-xs" style={{ color: 'var(--color-accent)' }}>
                <Save size={12} /> Save this version
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 items-center">
              {SCALE_PRESETS.map((p) => (
                <button
                  key={p}
                  onClick={() => applyScale(p)}
                  className="px-2.5 py-1 rounded text-xs"
                  style={{
                    backgroundColor: scaleFactor === p ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
                    color: scaleFactor === p ? 'var(--color-text-on-primary, white)' : 'var(--color-text-primary)',
                  }}
                >
                  {p}×
                </button>
              ))}
              <input
                type="number"
                step="0.1"
                placeholder="custom"
                value={customScale}
                onChange={(e) => setCustomScale(e.target.value)}
                onBlur={() => { const n = Number(customScale); if (n > 0) applyScale(n) }}
                className="w-16 px-2 py-1 rounded text-xs"
                style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              />
            </div>
            {hasAwkwardIngredients && (
              <button
                onClick={handleScaleAssist}
                disabled={smoothing}
                className="mt-2 flex items-center gap-1.5 text-xs px-2 py-1 rounded"
                style={{ color: 'var(--color-accent)' }}
              >
                {smoothing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
                Smooth these with AI
              </button>
            )}
          </div>

          {showSaveVersion && (
            <div className="flex gap-2 items-center p-2 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
              <input
                value={versionLabel}
                onChange={(e) => setVersionLabel(e.target.value)}
                placeholder="e.g. Double batch for co-op"
                className="flex-1 px-2.5 py-1.5 rounded text-sm"
                style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
              />
              <button onClick={handleSaveVersion} className="btn-primary px-3 py-1.5 rounded text-xs font-medium">Save</button>
              <button onClick={() => setShowSaveVersion(false)} className="px-2 py-1.5 text-xs" style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
            </div>
          )}

          {versions.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {versions.map((v) => (
                <span key={v.id} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full" style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}>
                  {v.label}
                  <button onClick={() => deleteVersion.mutate({ id: v.id, recipeId })}><X size={10} /></button>
                </span>
              ))}
            </div>
          )}

          {/* Ingredients */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Ingredients</h3>
            <ul className="space-y-1 text-sm" style={{ color: 'var(--color-text-primary)' }}>
              {scaledIngredients.map((ing, i) => (
                <li key={i}>
                  {ing.quantity != null && `${ing.quantity}${ing.unit ? ` ${ing.unit}` : ''} `}
                  {ing.item || ing.text}
                  {ing.scaling_note && <span className="text-xs ml-1" style={{ color: 'var(--color-text-secondary)' }}>({ing.scaling_note})</span>}
                </li>
              ))}
            </ul>
          </div>

          {/* Instructions */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Instructions</h3>
            <ol className="space-y-1.5 text-sm list-decimal list-inside" style={{ color: 'var(--color-text-primary)' }}>
              {recipe.instructions.map((step) => <li key={step.step}>{step.text}</li>)}
            </ol>
          </div>

          {/* Family Pointers (D-42-6) */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Family Pointers — how WE do it</h3>
            {pointers.length === 0 && <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>No pointers yet.</p>}
            <ul className="space-y-1.5">
              {pointers.map((p) => (
                <li key={p.id} className="flex items-start justify-between gap-2 text-sm p-2 rounded-lg" style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}>
                  <span>{p.text}</span>
                  <button onClick={() => deletePointer.mutate({ id: p.id, familyId })} className="shrink-0"><Trash2 size={12} style={{ color: 'var(--color-text-secondary)' }} /></button>
                </li>
              ))}
            </ul>
            <div className="flex gap-2 items-center mt-2">
              <input
                value={newPointerText}
                onChange={(e) => setNewPointerText(e.target.value)}
                placeholder="e.g. Use the small skillet, we do half the sugar"
                className="flex-1 px-2.5 py-1.5 rounded-lg text-sm"
                style={fieldStyle}
              />
              <button onClick={handleMicPointer} className="p-2 rounded-lg shrink-0" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
                {voice.state === 'recording' ? <MicOff size={14} /> : <Mic size={14} />}
              </button>
              <button onClick={() => handleAddPointer(false)} className="p-2 rounded-lg shrink-0" style={{ backgroundColor: 'var(--color-bg-secondary)' }} title="Add for this recipe">
                <Plus size={14} />
              </button>
            </div>
            <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              Everyone can read pointers while cooking — only you and other adults with plan access can add or edit them.
            </p>
          </div>

          {/* Mom's rotation dial */}
          {isMom && (
            <div>
              <h3 className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Rotation (only you see this)</h3>
              <div className="flex gap-1.5 flex-wrap">
                {(['favorite', 'normal', 'rest', 'retired'] as RecipeRotation[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRotation.mutate({ id: recipe.id, familyId, rotation: r })}
                    className="px-2.5 py-1 rounded text-xs capitalize"
                    style={{
                      backgroundColor: recipe.rotation === r ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
                      color: recipe.rotation === r ? 'var(--color-text-on-primary, white)' : 'var(--color-text-primary)',
                    }}
                  >
                    {r === 'rest' ? 'Rest for now' : r === 'retired' ? 'Retire' : r}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <button onClick={() => setShowAddToPlan(true)} className="btn-primary flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium">
              <CalendarPlus size={14} /> Add to plan
            </button>
            <button onClick={() => setShowSendToShopping(true)} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}>
              <ShoppingCart size={14} /> Send ingredients to shopping list
            </button>
          </div>
        </div>
      </div>

      {showAddToPlan && (
        <AddToPlanModal
          familyId={familyId}
          memberId={memberId}
          recipeId={recipe.id}
          recipeTitle={recipe.title}
          servingsBase={recipe.servings_base}
          onClose={() => setShowAddToPlan(false)}
        />
      )}
      {showSendToShopping && (
        <SendToShoppingListModal
          familyId={familyId}
          entries={[{
            entryDate: todayLocalIso(),
            recipeTitle: recipe.title,
            ingredients: scaledIngredients,
          }]}
          onClose={() => setShowSendToShopping(false)}
        />
      )}
    </div>
  )
}

const fieldStyle: React.CSSProperties = { backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }
