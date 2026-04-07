/**
 * FaithPreferencesModal — PRD-13
 * Screen 4: Faith Preferences editor.
 * Launched from Family Overview Detail (Faith & Values section).
 * All 6 sections visible at once (NOT a wizard), scrollable.
 * UPSERTs to faith_preferences table on Save.
 */

import { useState, useEffect } from 'react'
import { BookHeart } from 'lucide-react'
import { ModalV2 } from '@/components/shared'
import { useFaithPreferences, useSaveFaithPreferences } from '@/hooks/useArchives'
import { FAITH_TRADITIONS } from '@/types/archives'
import type { FaithPreferences, FaithRelevanceSetting } from '@/types/archives'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface FaithFormState {
  faith_tradition: string
  denomination: string
  observances: string
  sacred_texts: string
  prioritize_tradition: boolean
  include_comparative: boolean
  include_secular: boolean
  educational_only: boolean
  use_our_terminology: boolean
  respect_but_dont_assume: boolean
  avoid_conflicting: boolean
  acknowledge_diversity: boolean
  minority_views: boolean
  diversity_notes: string
  special_instructions: string
  relevance_setting: FaithRelevanceSetting
}

function fromDbToForm(data: FaithPreferences | null): FaithFormState {
  if (!data) {
    return {
      faith_tradition: '',
      denomination: '',
      observances: '',
      sacred_texts: '',
      prioritize_tradition: false,
      include_comparative: false,
      include_secular: false,
      educational_only: false,
      use_our_terminology: false,
      respect_but_dont_assume: true,
      avoid_conflicting: true,
      acknowledge_diversity: false,
      minority_views: false,
      diversity_notes: '',
      special_instructions: '',
      relevance_setting: 'automatic',
    }
  }

  return {
    faith_tradition: data.faith_tradition ?? '',
    denomination: data.denomination ?? '',
    observances: (data.observances ?? []).join('\n'),
    sacred_texts: (data.sacred_texts ?? []).join('\n'),
    prioritize_tradition: data.prioritize_tradition,
    include_comparative: data.include_comparative,
    include_secular: data.include_secular,
    educational_only: data.educational_only,
    use_our_terminology: data.use_our_terminology,
    respect_but_dont_assume: data.respect_but_dont_assume,
    avoid_conflicting: data.avoid_conflicting,
    acknowledge_diversity: data.acknowledge_diversity,
    minority_views: data.minority_views,
    diversity_notes: data.diversity_notes ?? '',
    special_instructions: data.special_instructions ?? '',
    relevance_setting: data.relevance_setting ?? 'automatic',
  }
}

function fromFormToDb(form: FaithFormState, familyId: string): Partial<FaithPreferences> & { family_id: string } {
  return {
    family_id: familyId,
    faith_tradition: form.faith_tradition || null,
    denomination: form.denomination || null,
    observances: form.observances
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean),
    sacred_texts: form.sacred_texts
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean),
    prioritize_tradition: form.prioritize_tradition,
    include_comparative: form.include_comparative,
    include_secular: form.include_secular,
    educational_only: form.educational_only,
    use_our_terminology: form.use_our_terminology,
    respect_but_dont_assume: form.respect_but_dont_assume,
    avoid_conflicting: form.avoid_conflicting,
    acknowledge_diversity: form.acknowledge_diversity,
    minority_views: form.minority_views,
    diversity_notes: form.diversity_notes || null,
    special_instructions: form.special_instructions || null,
    relevance_setting: form.relevance_setting,
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h3
      className="text-sm font-semibold mb-2"
      style={{ color: 'var(--color-text-heading)' }}
    >
      {children}
    </h3>
  )
}

function SectionDescription({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>
      {children}
    </p>
  )
}

function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label
      className="flex items-start gap-2.5 py-1.5 cursor-pointer"
      style={{ color: 'var(--color-text-primary)' }}
    >
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 rounded"
        style={{
          accentColor: 'var(--color-btn-primary-bg)',
          width: 16,
          height: 16,
          flexShrink: 0,
        }}
      />
      <span className="text-sm">{label}</span>
    </label>
  )
}

function RadioField({
  label,
  description,
  value,
  selected,
  onChange,
}: {
  label: string
  description?: string
  value: string
  selected: string
  onChange: (value: string) => void
}) {
  return (
    <label
      className="flex items-start gap-2.5 py-1.5 cursor-pointer"
      style={{ color: 'var(--color-text-primary)' }}
    >
      <input
        type="radio"
        checked={selected === value}
        onChange={() => onChange(value)}
        className="mt-0.5"
        style={{
          accentColor: 'var(--color-btn-primary-bg)',
          width: 16,
          height: 16,
          flexShrink: 0,
        }}
      />
      <div>
        <span className="text-sm font-medium">{label}</span>
        {description && (
          <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
            {description}
          </p>
        )}
      </div>
    </label>
  )
}

function TextInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm rounded-lg px-3 py-2 outline-none transition-colors"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
        }}
      />
    </div>
  )
}

function TextareaInput({
  label,
  value,
  onChange,
  placeholder,
  rows,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  rows?: number
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows ?? 3}
        className="w-full text-sm rounded-lg px-3 py-2 outline-none transition-colors resize-y"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
        }}
      />
    </div>
  )
}

function SelectInput({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: readonly string[]
  placeholder?: string
}) {
  return (
    <div className="mb-3">
      <label className="block text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm rounded-lg px-3 py-2 outline-none transition-colors"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
        }}
      >
        <option value="">{placeholder ?? 'Select...'}</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </select>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface FaithPreferencesModalProps {
  open: boolean
  onClose: () => void
  familyId: string
}

export function FaithPreferencesModal({ open, onClose, familyId }: FaithPreferencesModalProps) {
  const { data: faithData, isLoading } = useFaithPreferences(familyId)
  const saveMutation = useSaveFaithPreferences()

  const [form, setForm] = useState<FaithFormState>(() => fromDbToForm(null))
  const [initialized, setInitialized] = useState(false)

  // Sync form from DB when data loads
  useEffect(() => {
    if (!isLoading && !initialized) {
      setForm(fromDbToForm(faithData ?? null))
      setInitialized(true)
    }
  }, [faithData, isLoading, initialized])

  // Re-initialize when modal opens
  useEffect(() => {
    if (open) {
      setForm(fromDbToForm(faithData ?? null))
      setInitialized(true)
    }
  }, [open, faithData])

  const update = <K extends keyof FaithFormState>(field: K, value: FaithFormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }))
  }

  const handleSave = () => {
    const payload = fromFormToDb(form, familyId)
    saveMutation.mutate(payload, {
      onSuccess: () => {
        onClose()
      },
    })
  }

  const isDirty =
    initialized && JSON.stringify(fromDbToForm(faithData ?? null)) !== JSON.stringify(form)

  return (
    <ModalV2
      id="faith-preferences"
      isOpen={open}
      onClose={onClose}
      type="transient"
      title="Faith Preferences"
      size="lg"
      hasUnsavedChanges={isDirty}
      footer={
        <div className="flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            style={{
              color: 'var(--color-text-secondary)',
              border: '1px solid var(--color-border)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saveMutation.isPending}
            className="px-5 py-2 rounded-lg text-sm font-semibold transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
            style={{
              background: 'var(--surface-primary, var(--color-btn-primary-bg))',
              color: 'var(--color-btn-primary-text)',
            }}
          >
            {saveMutation.isPending ? 'Saving...' : 'Save'}
          </button>
        </div>
      }
    >
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div
            className="animate-spin rounded-full h-8 w-8 border-2 border-t-transparent"
            style={{ borderColor: 'var(--color-btn-primary-bg)', borderTopColor: 'transparent' }}
          />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Intro */}
          <div
            className="flex items-start gap-3 p-3 rounded-xl"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 6%, transparent)',
              border: '1px solid color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)',
            }}
          >
            <BookHeart size={18} className="shrink-0 mt-0.5" style={{ color: 'var(--color-btn-primary-bg)' }} />
            <p className="text-xs" style={{ color: 'var(--color-text-primary)' }}>
              These preferences help LiLa respect and integrate your family's faith and values into conversations.
              Everything here is optional — share as much or as little as you like.
            </p>
          </div>

          {/* Section 1: Faith Identity */}
          <div>
            <SectionHeading>Faith Identity</SectionHeading>
            <SectionDescription>
              Tell us about your family's faith background. All fields are optional.
            </SectionDescription>

            <SelectInput
              label="Faith Tradition"
              value={form.faith_tradition}
              onChange={(v) => update('faith_tradition', v)}
              options={FAITH_TRADITIONS}
              placeholder="Select a tradition..."
            />

            <TextInput
              label="Denomination"
              value={form.denomination}
              onChange={(v) => update('denomination', v)}
              placeholder="e.g., Southern Baptist, Reform, Maronite"
            />

            <TextareaInput
              label="Observances"
              value={form.observances}
              onChange={(v) => update('observances', v)}
              placeholder="e.g., Sabbath&#10;Ramadan&#10;Lent&#10;One per line"
              rows={3}
            />

            <TextareaInput
              label="Sacred Texts"
              value={form.sacred_texts}
              onChange={(v) => update('sacred_texts', v)}
              placeholder="e.g., Bible&#10;Torah&#10;Quran&#10;One per line"
              rows={3}
            />
          </div>

          <hr style={{ borderColor: 'var(--color-border)', opacity: 0.5 }} />

          {/* Section 2: Response Approach */}
          <div>
            <SectionHeading>Response Approach</SectionHeading>
            <SectionDescription>
              How should LiLa frame faith-related responses?
            </SectionDescription>

            <div className="space-y-1">
              <CheckboxField
                label="Prioritize our tradition's teachings"
                checked={form.prioritize_tradition}
                onChange={(v) => update('prioritize_tradition', v)}
              />
              <CheckboxField
                label="Include comparative views from other traditions"
                checked={form.include_comparative}
                onChange={(v) => update('include_comparative', v)}
              />
              <CheckboxField
                label="Include secular perspectives"
                checked={form.include_secular}
                onChange={(v) => update('include_secular', v)}
              />
              <CheckboxField
                label="Educational only (no faith guidance)"
                checked={form.educational_only}
                onChange={(v) => update('educational_only', v)}
              />
            </div>
          </div>

          <hr style={{ borderColor: 'var(--color-border)', opacity: 0.5 }} />

          {/* Section 3: Tone & Framing */}
          <div>
            <SectionHeading>Tone & Framing</SectionHeading>
            <SectionDescription>
              How should LiLa handle faith-related language?
            </SectionDescription>

            <div className="space-y-1">
              <CheckboxField
                label="Use our tradition's terminology"
                checked={form.use_our_terminology}
                onChange={(v) => update('use_our_terminology', v)}
              />
              <CheckboxField
                label="Respect but don't assume"
                checked={form.respect_but_dont_assume}
                onChange={(v) => update('respect_but_dont_assume', v)}
              />
              <CheckboxField
                label="Avoid conflicting teachings"
                checked={form.avoid_conflicting}
                onChange={(v) => update('avoid_conflicting', v)}
              />
            </div>
          </div>

          <hr style={{ borderColor: 'var(--color-border)', opacity: 0.5 }} />

          {/* Section 4: Internal Diversity */}
          <div>
            <SectionHeading>Internal Diversity</SectionHeading>
            <SectionDescription>
              How should LiLa handle diverse views within your tradition?
            </SectionDescription>

            <div className="space-y-1">
              <CheckboxField
                label="Acknowledge diverse perspectives within our tradition"
                checked={form.acknowledge_diversity}
                onChange={(v) => update('acknowledge_diversity', v)}
              />
              <CheckboxField
                label="Include minority views"
                checked={form.minority_views}
                onChange={(v) => update('minority_views', v)}
              />
            </div>

            <div className="mt-2">
              <TextInput
                label="Other notes"
                value={form.diversity_notes}
                onChange={(v) => update('diversity_notes', v)}
                placeholder="Any additional notes about perspectives within your tradition..."
              />
            </div>
          </div>

          <hr style={{ borderColor: 'var(--color-border)', opacity: 0.5 }} />

          {/* Section 5: Special Instructions */}
          <div>
            <SectionHeading>Special Instructions</SectionHeading>
            <SectionDescription>
              Any additional guidance for LiLa about your family's faith and values.
            </SectionDescription>

            <TextareaInput
              label="Special Instructions"
              value={form.special_instructions}
              onChange={(v) => update('special_instructions', v)}
              placeholder="Any additional guidance for LiLa about your family's faith and values..."
              rows={4}
            />
          </div>

          <hr style={{ borderColor: 'var(--color-border)', opacity: 0.5 }} />

          {/* Section 6: Relevance Settings */}
          <div>
            <SectionHeading>Relevance Settings</SectionHeading>
            <SectionDescription>
              When should LiLa include faith context in conversations?
            </SectionDescription>

            <div className="space-y-2">
              <RadioField
                label="Automatic (recommended)"
                description="LiLa evaluates whether faith context is relevant to each conversation."
                value="automatic"
                selected={form.relevance_setting}
                onChange={(v) => update('relevance_setting', v as FaithRelevanceSetting)}
              />
              <RadioField
                label="Always include"
                description="Include faith context in every conversation."
                value="always"
                selected={form.relevance_setting}
                onChange={(v) => update('relevance_setting', v as FaithRelevanceSetting)}
              />
              <RadioField
                label="Manual only"
                description="Only include faith context when you explicitly request it."
                value="manual"
                selected={form.relevance_setting}
                onChange={(v) => update('relevance_setting', v as FaithRelevanceSetting)}
              />
            </div>
          </div>
        </div>
      )}
    </ModalV2>
  )
}
