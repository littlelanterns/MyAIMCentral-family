/**
 * CookViewModal — PRD-42 KitchenCompass §6.1 (D-42-6 Family Pointers rider)
 *
 * The cook-facing surface: large type, step-through instructions with
 * recipe-specific pointers pinned at top and technique pointers matched
 * beside relevant steps, scaled quantities for the entry's servings_planned,
 * in-the-moment mic-addable pointer capture.
 */

import { useMemo, useState } from 'react'
import { X, ChevronLeft, ChevronRight, Mic, MicOff, Plus, Lightbulb } from 'lucide-react'
import { useRecipe, useRecipePointers, useTechniquePointers, useCreatePointer } from '@/hooks/useRecipes'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import type { RecipeIngredient, RecipeInstructionStep } from '@/types/meals'

interface CookViewModalProps {
  familyId: string
  memberId: string
  recipeId: string
  servingsPlanned: number | null
  onClose: () => void
}

function scaleQty(ing: RecipeIngredient, factor: number): RecipeIngredient {
  if (ing.quantity == null || ing.scaling_note) return ing
  return { ...ing, quantity: Math.round(ing.quantity * factor * 100) / 100 }
}

/** Technique-tag matching: does this pointer's tag appear in the step text or any ingredient name? */
function matchesStep(techniqueTag: string, step: RecipeInstructionStep, ingredients: RecipeIngredient[]): boolean {
  const tag = techniqueTag.toLowerCase()
  if (step.text.toLowerCase().includes(tag)) return true
  return ingredients.some((ing) => (ing.item || ing.text || '').toLowerCase().includes(tag))
}

export function CookViewModal({ familyId, memberId, recipeId, servingsPlanned, onClose }: CookViewModalProps) {
  const { data: recipe } = useRecipe(recipeId)
  const { data: recipePointers = [] } = useRecipePointers(familyId, recipeId)
  const { data: techniquePointers = [] } = useTechniquePointers(familyId)
  const [currentStep, setCurrentStep] = useState(0)
  const [newPointerText, setNewPointerText] = useState('')
  const voice = useVoiceInput()
  const createPointer = useCreatePointer()

  const scaleFactor = recipe?.servings_base && servingsPlanned ? servingsPlanned / recipe.servings_base : 1
  const scaledIngredients = useMemo(
    () => (recipe ? recipe.ingredients.map((i) => scaleQty(i, scaleFactor)) : []),
    [recipe, scaleFactor],
  )

  if (!recipe) return null

  const step = recipe.instructions[currentStep]
  const matchingTechniquePointers = step
    ? techniquePointers.filter((p) => p.technique_tag && matchesStep(p.technique_tag, step, recipe.ingredients))
    : []

  async function handleMic() {
    if (voice.state === 'recording') {
      const text = await voice.stopRecording()
      if (text) setNewPointerText((prev) => (prev ? `${prev} ${text}` : text))
    } else if (voice.state === 'idle') {
      await voice.startRecording()
    }
  }

  async function handleAddPointer() {
    if (!newPointerText.trim()) return
    await createPointer.mutateAsync({
      familyId, createdBy: memberId, recipeId, text: newPointerText.trim(), sortOrder: recipePointers.length,
    })
    setNewPointerText('')
  }

  return (
    <div className="fixed inset-0 z-[70] flex flex-col" style={{ backgroundColor: 'var(--color-bg-primary)' }}>
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text-primary)' }}>{recipe.title}</h2>
        <button onClick={onClose} className="p-2 rounded-full" style={{ backgroundColor: 'var(--color-bg-secondary)' }}><X size={18} /></button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 max-w-2xl mx-auto w-full space-y-6">
        {recipePointers.length > 0 && (
          <div className="p-4 rounded-xl space-y-2" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
            <p className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5" style={{ color: 'var(--color-text-secondary)' }}>
              <Lightbulb size={14} /> How WE do it
            </p>
            {recipePointers.map((p) => (
              <p key={p.id} className="text-base" style={{ color: 'var(--color-text-primary)' }}>{p.text}</p>
            ))}
          </div>
        )}

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Ingredients {servingsPlanned && recipe.servings_base ? `(for ${servingsPlanned})` : ''}
          </p>
          <ul className="text-lg space-y-1.5" style={{ color: 'var(--color-text-primary)' }}>
            {scaledIngredients.map((ing, i) => (
              <li key={i}>{ing.quantity != null && `${ing.quantity}${ing.unit ? ` ${ing.unit}` : ''} `}{ing.item || ing.text}</li>
            ))}
          </ul>
        </div>

        {step && (
          <div className="text-center space-y-4">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Step {currentStep + 1} of {recipe.instructions.length}</p>
            <p className="text-2xl leading-relaxed" style={{ color: 'var(--color-text-primary)' }}>{step.text}</p>

            {matchingTechniquePointers.length > 0 && (
              <div className="space-y-1.5">
                {matchingTechniquePointers.map((p) => (
                  <p key={p.id} className="text-sm inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}>
                    <Lightbulb size={12} /> {p.text}
                  </p>
                ))}
              </div>
            )}

            <div className="flex items-center justify-center gap-4 pt-4">
              <button
                onClick={() => setCurrentStep((s) => Math.max(0, s - 1))}
                disabled={currentStep === 0}
                className="p-3 rounded-full disabled:opacity-30"
                style={{ backgroundColor: 'var(--color-bg-secondary)' }}
              >
                <ChevronLeft size={24} />
              </button>
              <button
                onClick={() => setCurrentStep((s) => Math.min(recipe.instructions.length - 1, s + 1))}
                disabled={currentStep === recipe.instructions.length - 1}
                className="btn-primary p-3 rounded-full disabled:opacity-30"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>
        )}

        <div className="p-3 rounded-xl space-y-2" style={{ backgroundColor: 'var(--color-bg-secondary)' }}>
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>Add a pointer for next time</p>
          <div className="flex gap-2">
            <input
              value={newPointerText}
              onChange={(e) => setNewPointerText(e.target.value)}
              placeholder="e.g. Use the small skillet"
              className="flex-1 px-3 py-2.5 rounded-lg text-base"
              style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
            />
            <button onClick={handleMic} className="p-2.5 rounded-lg" style={{ backgroundColor: 'var(--color-bg-card)' }}>
              {voice.state === 'recording' ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <button onClick={handleAddPointer} className="btn-primary p-2.5 rounded-lg"><Plus size={18} /></button>
          </div>
        </div>
      </div>
    </div>
  )
}
