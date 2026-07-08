/**
 * RecipeCaptureModal — PRD-42 KitchenCompass §6.3
 *
 * Four capture tiles (Link / Photo / Paste / This Went Well) converging on
 * one HITM review card (Convention #4): every extracted field is editable
 * inline, then Edit(implicit)/Approve/Regenerate/Reject. Nothing persists to
 * `recipes` before Approve.
 */

import { useState, useRef } from 'react'
import {
  Link2, Camera, ClipboardPaste, Sparkles, Mic, MicOff, X, Plus, Trash2,
  RefreshCw, Check, Loader2, ChefHat,
} from 'lucide-react'
import { ModalV2 } from '@/components/shared'
import { supabase } from '@/lib/supabase/client'
import { useVoiceInput } from '@/hooks/useVoiceInput'
import { useRecipePhotoUpload, readFileAsBase64 } from '@/hooks/useRecipePhotoUpload'
import { useCreateRecipe } from '@/hooks/useRecipes'
import type { RecipeExtractResult, RecipeIngredient, RecipeApprovalStatus, RecipeSourceType } from '@/types/meals'

type CaptureStep = 'tiles' | 'input' | 'loading' | 'review'
/** The 4 capture tiles only — scale_assist is a separate flow (Recipe Detail), never chosen here. */
type CaptureMode = 'link' | 'photo' | 'paste' | 'went_well'

interface RecipeCaptureModalProps {
  isOpen: boolean
  onClose: () => void
  familyId: string
  memberId: string
  /** Independent teens get approval_status='suggested' — enforced again server-side at RLS. */
  isTeen?: boolean
  /** Prefill for the Paste tile — used by the SortTab Recipe card + example tiles. */
  initialPasteText?: string
  onRecipeCreated?: (recipeId: string) => void
}

const EMPTY_INGREDIENT: RecipeIngredient = { text: '', quantity: null, unit: null, item: '', store_category: null, optional: false, scaling_note: null }

export function RecipeCaptureModal({
  isOpen, onClose, familyId, memberId, isTeen = false, initialPasteText, onRecipeCreated,
}: RecipeCaptureModalProps) {
  const [step, setStep] = useState<CaptureStep>(initialPasteText ? 'input' : 'tiles')
  const [mode, setMode] = useState<CaptureMode>('paste')
  const [pasteText, setPasteText] = useState(initialPasteText ?? '')
  const [linkUrl, setLinkUrl] = useState('')
  const [wentWellDescription, setWentWellDescription] = useState('')
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<string[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [crisisMessage, setCrisisMessage] = useState<string | null>(null)
  const [notARecipe, setNotARecipe] = useState(false)

  // Review-step editable state
  const [result, setResult] = useState<RecipeExtractResult | null>(null)
  const [uploadedPhotoUrls, setUploadedPhotoUrls] = useState<string[]>([])

  const fileInputRef = useRef<HTMLInputElement>(null)
  const voice = useVoiceInput()
  const { uploadPhoto } = useRecipePhotoUpload(familyId)
  const createRecipe = useCreateRecipe()

  function reset() {
    setStep('tiles')
    setMode('paste')
    setPasteText('')
    setLinkUrl('')
    setWentWellDescription('')
    setPhotoFiles([])
    setPhotoPreviewUrls([])
    setErrorMessage(null)
    setCrisisMessage(null)
    setNotARecipe(false)
    setResult(null)
    setUploadedPhotoUrls([])
  }

  function handleClose() {
    reset()
    onClose()
  }

  function chooseTile(chosenMode: CaptureMode) {
    setMode(chosenMode)
    setStep('input')
  }

  function handleFileSelect(files: FileList | null) {
    if (!files) return
    const arr = Array.from(files).slice(0, 6)
    setPhotoFiles(arr)
    setPhotoPreviewUrls(arr.map((f) => URL.createObjectURL(f)))
  }

  async function handleMicToggle() {
    if (voice.state === 'recording') {
      const text = await voice.stopRecording()
      if (text) setWentWellDescription((prev) => (prev ? `${prev} ${text}` : text))
    } else if (voice.state === 'idle') {
      await voice.startRecording()
    }
  }

  async function runExtraction() {
    setErrorMessage(null)
    setCrisisMessage(null)
    setStep('loading')

    try {
      // Upload photos to storage in parallel with the base64 read (both needed).
      const photoUploads = photoFiles.length > 0
        ? await Promise.all(photoFiles.map(async (f) => ({ base64: await readFileAsBase64(f), url: await uploadPhoto(f) })))
        : []
      setUploadedPhotoUrls(photoUploads.map((p) => p.url).filter((u): u is string => !!u))

      const body: Record<string, unknown> = { mode, family_id: familyId, member_id: memberId }
      if (mode === 'link') body.url = linkUrl.trim()
      if (mode === 'paste') body.text = pasteText.trim()
      if (mode === 'photo') {
        body.photo_base64 = photoUploads.map((p) => p.base64)
      }
      if (mode === 'went_well') {
        body.went_well_description = wentWellDescription.trim()
        if (photoUploads.length > 0) body.photo_base64 = photoUploads.map((p) => p.base64)
      }

      const { data, error: fnError } = await supabase.functions.invoke('recipe-extract', { body })
      if (fnError) throw fnError

      if (data?.crisis) {
        setCrisisMessage(data.response)
        setStep('input')
        return
      }
      if (data?.error) {
        setErrorMessage(data.error)
        setStep('input')
        return
      }

      const extracted = data.result as RecipeExtractResult
      setResult(extracted)
      setNotARecipe(!!data.not_a_recipe)
      setStep('review')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Something went wrong extracting that recipe.')
      setStep('input')
    }
  }

  function updateResultField<K extends keyof RecipeExtractResult>(field: K, value: RecipeExtractResult[K]) {
    setResult((prev) => (prev ? { ...prev, [field]: value } : prev))
  }

  function updateIngredient(index: number, patch: Partial<RecipeIngredient>) {
    if (!result) return
    const next = [...result.ingredients]
    next[index] = { ...next[index], ...patch }
    updateResultField('ingredients', next)
  }

  function addIngredient() {
    if (!result) return
    updateResultField('ingredients', [...result.ingredients, { ...EMPTY_INGREDIENT }])
  }

  function removeIngredient(index: number) {
    if (!result) return
    updateResultField('ingredients', result.ingredients.filter((_, i) => i !== index))
  }

  function updateStep(index: number, text: string) {
    if (!result) return
    const next = [...result.instructions]
    next[index] = { ...next[index], text }
    updateResultField('instructions', next)
  }

  function addStep() {
    if (!result) return
    updateResultField('instructions', [...result.instructions, { step: result.instructions.length + 1, text: '' }])
  }

  function removeStep(index: number) {
    if (!result) return
    const next = result.instructions.filter((_, i) => i !== index).map((s, i) => ({ ...s, step: i + 1 }))
    updateResultField('instructions', next)
  }

  async function handleApprove() {
    if (!result) return
    const approvalStatus: RecipeApprovalStatus = isTeen ? 'suggested' : 'approved'
    const recipe = await createRecipe.mutateAsync({
      familyId,
      createdBy: memberId,
      title: result.title,
      description: result.description,
      sourceType: mode as RecipeSourceType,
      sourceUrl: mode === 'link' ? linkUrl.trim() : null,
      photoUrls: uploadedPhotoUrls,
      ingredients: result.ingredients,
      instructions: result.instructions,
      prepMinutes: result.prep_minutes,
      cookMinutes: result.cook_minutes,
      totalMinutes: result.total_minutes,
      servingsBase: result.servings_base,
      effortLevel: result.effort_level,
      equipmentTags: result.equipment_tags,
      tags: result.tags,
      approvalStatus,
    })
    onRecipeCreated?.(recipe.id)
    handleClose()
  }

  function handleRegenerate() {
    setResult(null)
    void runExtraction()
  }

  function handleReject() {
    reset()
  }

  const isLowConfidence = (field: string) => (result?.low_confidence_fields ?? []).includes(field)

  return (
    <ModalV2
      id="recipe-capture"
      isOpen={isOpen}
      onClose={handleClose}
      type="transient"
      size="lg"
      title="Add a Recipe"
      subtitle={step === 'review' ? 'Review before saving — nothing is saved yet' : undefined}
      icon={ChefHat}
    >
      <div className="density-comfortable">
        {step === 'tiles' && (
          <div className="grid grid-cols-2 gap-3">
            <CaptureTile icon={Link2} label="Link" description="Paste a recipe URL" onClick={() => chooseTile('link')} />
            <CaptureTile icon={Camera} label="Photo" description="Snap a recipe card or note" onClick={() => chooseTile('photo')} />
            <CaptureTile icon={ClipboardPaste} label="Paste" description="Paste recipe text" onClick={() => chooseTile('paste')} />
            <CaptureTile icon={Sparkles} label="This Went Well" description="Tell me what you made" onClick={() => chooseTile('went_well')} />
          </div>
        )}

        {step === 'input' && (
          <div className="space-y-4">
            {crisisMessage && (
              <div
                className="p-4 rounded-lg text-sm"
                style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
              >
                {crisisMessage}
              </div>
            )}
            {errorMessage && (
              <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--color-error-bg, #fee)', color: 'var(--color-error, #b00)' }}>
                {errorMessage}
              </div>
            )}

            {mode === 'link' && (
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'var(--color-text-primary)' }}>Recipe URL</label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com/best-chili-recipe"
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                />
              </div>
            )}

            {mode === 'paste' && (
              <div>
                <label className="text-sm font-medium block mb-1" style={{ color: 'var(--color-text-primary)' }}>Recipe text</label>
                <textarea
                  value={pasteText}
                  onChange={(e) => setPasteText(e.target.value)}
                  rows={10}
                  placeholder="Paste ingredients and instructions here..."
                  className="w-full px-3 py-2 rounded-lg text-sm"
                  style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                />
              </div>
            )}

            {mode === 'photo' && (
              <PhotoPicker fileInputRef={fileInputRef} previewUrls={photoPreviewUrls} onSelect={handleFileSelect} label="Photo(s) of the recipe" />
            )}

            {mode === 'went_well' && (
              <div className="space-y-3">
                <PhotoPicker fileInputRef={fileInputRef} previewUrls={photoPreviewUrls} onSelect={handleFileSelect} label="Snap what you made (optional)" />
                <div>
                  <label className="text-sm font-medium block mb-1" style={{ color: 'var(--color-text-primary)' }}>What did you do?</label>
                  <div className="flex gap-2 items-start">
                    <textarea
                      value={wentWellDescription}
                      onChange={(e) => setWentWellDescription(e.target.value)}
                      rows={6}
                      placeholder="I browned the ground beef, added a can of diced tomatoes..."
                      className="flex-1 px-3 py-2 rounded-lg text-sm"
                      style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
                    />
                    <button
                      type="button"
                      onClick={handleMicToggle}
                      className="p-2.5 rounded-lg shrink-0"
                      style={{
                        backgroundColor: voice.state === 'recording' ? 'var(--color-error-bg, #fee)' : 'var(--color-bg-secondary)',
                        color: voice.state === 'recording' ? 'var(--color-error, #b00)' : 'var(--color-text-primary)',
                      }}
                      title={voice.state === 'recording' ? 'Stop recording' : 'Dictate'}
                    >
                      {voice.state === 'recording' ? <MicOff size={18} /> : <Mic size={18} />}
                    </button>
                  </div>
                  {voice.interimText && (
                    <p className="text-xs mt-1 italic" style={{ color: 'var(--color-text-secondary)' }}>{voice.interimText}</p>
                  )}
                  {voice.error && (
                    <p className="text-xs mt-1" style={{ color: 'var(--color-error, #b00)' }}>{voice.error}</p>
                  )}
                  <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                    I'll keep it the way you said it. Fill in more anytime.
                  </p>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button onClick={handleClose} className="px-4 py-2 text-sm rounded-lg" style={{ color: 'var(--color-text-secondary)' }}>Cancel</button>
              <button
                onClick={runExtraction}
                disabled={
                  (mode === 'link' && !linkUrl.trim()) ||
                  (mode === 'paste' && !pasteText.trim()) ||
                  (mode === 'photo' && photoFiles.length === 0) ||
                  (mode === 'went_well' && !wentWellDescription.trim())
                }
                className="btn-primary px-4 py-2 text-sm rounded-lg disabled:opacity-40"
              >
                Extract Recipe
              </button>
            </div>
          </div>
        )}

        {step === 'loading' && (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Loader2 size={28} className="animate-spin" style={{ color: 'var(--color-accent)' }} />
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Reading the recipe...</p>
          </div>
        )}

        {step === 'review' && result && (
          <div className="space-y-4">
            {notARecipe && (
              <div className="p-3 rounded-lg text-sm" style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}>
                I couldn't find recipe content there. You can still edit the fields below by hand, or Reject and try a different source.
              </div>
            )}

            <ReviewField label="Title" lowConfidence={isLowConfidence('title')}>
              <input
                value={result.title}
                onChange={(e) => updateResultField('title', e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm font-medium"
                style={fieldStyle}
              />
            </ReviewField>

            <ReviewField label="Description">
              <textarea
                value={result.description ?? ''}
                onChange={(e) => updateResultField('description', e.target.value)}
                rows={2}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={fieldStyle}
              />
            </ReviewField>

            <div className="grid grid-cols-4 gap-2">
              <NumberField label="Prep min" value={result.prep_minutes} onChange={(v) => updateResultField('prep_minutes', v)} lowConfidence={isLowConfidence('prep_minutes')} />
              <NumberField label="Cook min" value={result.cook_minutes} onChange={(v) => updateResultField('cook_minutes', v)} lowConfidence={isLowConfidence('cook_minutes')} />
              <NumberField label="Total min" value={result.total_minutes} onChange={(v) => updateResultField('total_minutes', v)} lowConfidence={isLowConfidence('total_minutes')} />
              <NumberField label="Servings" value={result.servings_base} onChange={(v) => updateResultField('servings_base', v)} lowConfidence={isLowConfidence('servings_base')} />
            </div>

            <ReviewField label="Effort" lowConfidence={isLowConfidence('effort_level')}>
              <div className="flex gap-2">
                {(['quick', 'standard', 'project'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => updateResultField('effort_level', lvl)}
                    className="px-3 py-1.5 rounded-lg text-xs capitalize"
                    style={{
                      backgroundColor: result.effort_level === lvl ? 'var(--color-accent)' : 'var(--color-bg-secondary)',
                      color: result.effort_level === lvl ? 'var(--color-text-on-primary, white)' : 'var(--color-text-primary)',
                    }}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
            </ReviewField>

            <ReviewField label="Ingredients" lowConfidence={result.ingredients.some((_, i) => isLowConfidence(`ingredients[${i}]`))}>
              <div className="space-y-2">
                {result.ingredients.map((ing, i) => (
                  <div key={i} className="flex gap-1.5 items-center">
                    <input
                      value={ing.text}
                      onChange={(e) => updateIngredient(i, { text: e.target.value })}
                      placeholder="2 cups flour"
                      className="flex-1 px-2.5 py-1.5 rounded-lg text-sm"
                      style={fieldStyle}
                    />
                    {ing.scaling_note && (
                      <span className="text-xs shrink-0" style={{ color: 'var(--color-warning, #b58900)' }} title={ing.scaling_note}>⚠</span>
                    )}
                    <button onClick={() => removeIngredient(i)} className="p-1.5 shrink-0" style={{ color: 'var(--color-text-secondary)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button onClick={addIngredient} className="flex items-center gap-1 text-xs px-2 py-1 rounded" style={{ color: 'var(--color-accent)' }}>
                  <Plus size={12} /> Add ingredient
                </button>
              </div>
            </ReviewField>

            <ReviewField label="Instructions">
              <div className="space-y-2">
                {result.instructions.map((step, i) => (
                  <div key={i} className="flex gap-1.5 items-start">
                    <span className="text-xs font-semibold mt-2 w-5 shrink-0 text-center" style={{ color: 'var(--color-text-secondary)' }}>{step.step}.</span>
                    <textarea
                      value={step.text}
                      onChange={(e) => updateStep(i, e.target.value)}
                      rows={2}
                      className="flex-1 px-2.5 py-1.5 rounded-lg text-sm"
                      style={fieldStyle}
                    />
                    <button onClick={() => removeStep(i)} className="p-1.5 shrink-0 mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
                <button onClick={addStep} className="flex items-center gap-1 text-xs px-2 py-1 rounded" style={{ color: 'var(--color-accent)' }}>
                  <Plus size={12} /> Add step
                </button>
              </div>
            </ReviewField>

            {isTeen && (
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                This will be saved as a suggestion for mom to approve before it joins the family Recipe Box.
              </p>
            )}

            {/* HITM: Approve / Regenerate / Reject (Edit is inherent — every field above is already editable) */}
            <div className="flex items-center gap-2 pt-3 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <button
                onClick={handleApprove}
                disabled={createRecipe.isPending || !result.title.trim()}
                className="btn-primary flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              >
                {createRecipe.isPending ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Approve
              </button>
              <button onClick={handleRegenerate} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm" style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}>
                <RefreshCw size={14} /> Regenerate
              </button>
              <button onClick={handleReject} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <X size={14} /> Reject
              </button>
            </div>
          </div>
        )}
      </div>
    </ModalV2>
  )
}

const fieldStyle: React.CSSProperties = { backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }

function CaptureTile({ icon: Icon, label, description, onClick }: { icon: React.ComponentType<{ size?: number }>; label: string; description: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 p-5 rounded-xl text-center transition-transform hover:scale-[1.02]"
      style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
    >
      <Icon size={28} />
      <span className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>{label}</span>
      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{description}</span>
    </button>
  )
}

function PhotoPicker({
  fileInputRef, previewUrls, onSelect, label,
}: { fileInputRef: React.RefObject<HTMLInputElement | null>; previewUrls: string[]; onSelect: (files: FileList | null) => void; label: string }) {
  return (
    <div>
      <label className="text-sm font-medium block mb-1" style={{ color: 'var(--color-text-primary)' }}>{label}</label>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        capture="environment"
        className="hidden"
        onChange={(e) => onSelect(e.target.files)}
      />
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 px-3 py-6 rounded-lg text-sm border-dashed"
        style={{ border: '2px dashed var(--color-border)', color: 'var(--color-text-secondary)' }}
      >
        <Camera size={18} /> {previewUrls.length > 0 ? 'Add more photos' : 'Take or choose photo(s)'}
      </button>
      {previewUrls.length > 0 && (
        <div className="flex gap-2 mt-2 flex-wrap">
          {previewUrls.map((url, i) => (
            <img key={i} src={url} alt="" className="w-16 h-16 object-cover rounded-lg" />
          ))}
        </div>
      )}
    </div>
  )
}

function ReviewField({ label, lowConfidence, children }: { label: string; lowConfidence?: boolean; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide flex items-center gap-1.5 mb-1" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
        {lowConfidence && <span title="Double-check this — I wasn't confident" style={{ color: 'var(--color-warning, #b58900)' }}>●</span>}
      </label>
      {children}
    </div>
  )
}

function NumberField({ label, value, onChange, lowConfidence }: { label: string; value: number | null; onChange: (v: number | null) => void; lowConfidence?: boolean }) {
  return (
    <ReviewField label={label} lowConfidence={lowConfidence}>
      <input
        type="number"
        value={value ?? ''}
        onChange={(e) => onChange(e.target.value === '' ? null : Number(e.target.value))}
        className="w-full px-2.5 py-1.5 rounded-lg text-sm"
        style={fieldStyle}
      />
    </ReviewField>
  )
}
