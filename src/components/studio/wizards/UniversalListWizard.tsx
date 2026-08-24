/**
 * UniversalListWizard — AI-first list creation wizard.
 *
 * One wizard handles all list types. AI detects the right type from
 * free text, or mom picks from suggested starting points.
 *
 * Steps:
 * 1. What's this list for? (free text or preset picker)
 * 2. Dump your items (BulkAddWithAI)
 * 3. Who shares this? (MemberPillSelector)
 * 4. Organize it (AI-suggested sections, editable)
 * 5. Extras (context-dependent options + ConnectionOffersPanel)
 * 6. Review & deploy
 */

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { SetupWizard, type WizardStep } from './SetupWizard'
import { useWizardProgress } from './useWizardProgress'
import { WizardTagPicker } from './WizardTagPicker'
import { ConnectionOffersPanel } from './ConnectionOffersPanel'
import { useFamily } from '@/hooks/useFamily'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamilyMembers, type FamilyMember } from '@/hooks/useFamilyMember'
import { useQueryClient } from '@tanstack/react-query'
import { useCreateList, useShareList } from '@/hooks/useLists'
import { getMemberColor } from '@/lib/memberColors'
import { supabase } from '@/lib/supabase/client'
import { sendAIMessage, extractJSON } from '@/lib/ai/send-ai-message'
import { LIST_PRESETS, LIST_TYPE_DETECTION_PROMPT, type ListPreset } from './presets/listPresets'
import type { ListType } from '@/types/lists'
import {
  ShoppingCart,
  CheckSquare,
  DollarSign,
  Backpack,
  Gift,
  GraduationCap,
  Lightbulb,
  Heart,
  LayoutList,
  Loader,
  Trash2,
  GripVertical,
  Plus,
} from 'lucide-react'

// ─── State ───

interface ListWizardItem {
  text: string
  section?: string
  price?: string
  quantity?: string
  priority?: string
  resource_url?: string
  notes?: string
  store_tags?: string[]
  store_category?: string
  /** True when this item came from preset example data (not user-typed) */
  fromExample?: boolean
}

interface ListWizardState {
  // Step 1
  selectedPresetKey: string | null
  freeTextDescription: string
  detectedListType: ListType | null
  // Step 2
  items: ListWizardItem[]
  rawInput: string
  // Step 3
  sharingMode: 'private' | 'specific' | 'family'
  sharedMemberIds: string[]
  anyoneCanAdd: boolean
  // Step 4
  sections: string[]
  // Step 5
  extras: Record<string, boolean>
  connections: Record<string, boolean>
  // Step 6
  tags: string[]
  listTitle: string
}

const INITIAL_STATE: ListWizardState = {
  selectedPresetKey: null,
  freeTextDescription: '',
  detectedListType: null,
  items: [],
  rawInput: '',
  sharingMode: 'private',
  sharedMemberIds: [],
  anyoneCanAdd: false,
  sections: [],
  extras: {},
  connections: {},
  tags: [],
  listTitle: '',
}

const STEPS: WizardStep[] = [
  { key: 'purpose', title: 'Purpose' },
  { key: 'items', title: 'Items' },
  { key: 'sharing', title: 'Sharing' },
  { key: 'organize', title: 'Organize' },
  { key: 'extras', title: 'Extras' },
  { key: 'review', title: 'Review' },
]

const PRESET_ICONS: Record<string, typeof ShoppingCart> = {
  todo: CheckSquare,
  shopping: ShoppingCart,
  shared_shopping: ShoppingCart,
  expenses: DollarSign,
  packing: Backpack,
  wishlist: Gift,
  school_expenses: GraduationCap,
  ideas: Lightbulb,
  prayer: Heart,
  custom: LayoutList,
}

// ─── Component ───

interface UniversalListWizardProps {
  isOpen: boolean
  onClose: () => void
  /** Pre-select a specific preset on open */
  initialPreset?: string
}

export function UniversalListWizard({
  isOpen,
  onClose,
  initialPreset,
}: UniversalListWizardProps) {
  const { data: family } = useFamily()
  const { data: currentMember } = useFamilyMember()
  const { data: members = [] } = useFamilyMembers(family?.id ?? '')
  const createList = useCreateList()
  const shareList = useShareList()
  const queryClient = useQueryClient()

  const familyId = family?.id ?? ''

  const {
    state,
    setState,
    currentStep,
    setCurrentStep,
    clearProgress,
    hasRestoredDraft,
  } = useWizardProgress<ListWizardState>({
    wizardId: 'universal-list',
    familyId,
    initialState: {
      ...INITIAL_STATE,
      selectedPresetKey: initialPreset ?? null,
    },
  })

  const [isDeploying, setIsDeploying] = useState(false)
  const [deployError, setDeployError] = useState<string | null>(null)
  const [detectingType, setDetectingType] = useState(false)
  const [parsingItems, setParsingItems] = useState(false)

  // F-22: deploy is resumable, never silently partial. If a later phase
  // fails, the created list id is kept so mom's retry finishes the SAME list
  // instead of creating a duplicate half-list.
  const deployedListIdRef = useRef<string | null>(null)
  const itemsInsertedRef = useRef(false)
  const sharedIdsRef = useRef<Set<string>>(new Set())

  // Resolve active preset
  const activePreset = useMemo<ListPreset | null>(() => {
    if (state.selectedPresetKey) {
      return LIST_PRESETS.find((p) => p.key === state.selectedPresetKey) ?? null
    }
    return null
  }, [state.selectedPresetKey])

  const resolvedListType: ListType =
    state.detectedListType ?? activePreset?.listType ?? 'custom'

  // ─── Step handlers ───

  const selectPreset = useCallback(
    (key: string) => {
      const preset = LIST_PRESETS.find((p) => p.key === key)
      if (preset) {
        const exampleItems: ListWizardItem[] = (preset.exampleItems ?? []).map((ei) => ({
          text: ei.text,
          section: ei.section,
          quantity: ei.quantity,
          notes: ei.notes,
          store_tags: ei.store_tags,
          store_category: ei.store_category,
          fromExample: true,
        }))
        setState((prev) => ({
          ...prev,
          selectedPresetKey: key,
          detectedListType: preset.listType,
          sections: preset.suggestedSections ?? [],
          tags: [...preset.defaultTags],
          listTitle: '',
          freeTextDescription: '',
          // Apply preset sharing defaults
          ...(preset.defaultSharingMode ? { sharingMode: preset.defaultSharingMode } : {}),
          ...(preset.defaultAnyoneCanAdd != null ? { anyoneCanAdd: preset.defaultAnyoneCanAdd } : {}),
          // Populate example items (only if the user hasn't already added their own)
          ...(exampleItems.length > 0 && prev.items.length === 0 ? { items: exampleItems } : {}),
        }))
      }
    },
    [setState],
  )

  // Auto-select the initial preset on mount (when not restoring a draft).
  // We check `state.detectedListType` rather than localStorage because
  // React Strict Mode double-invokes effects: the persistence effect writes
  // INITIAL_STATE to localStorage between the two invocations, making the
  // second mount think a draft exists. Instead, we rely on the fact that
  // restored drafts always have a non-null detectedListType. The selectPreset
  // function itself guards against overwriting user-added items via
  // prev.items.length === 0.
  useEffect(() => {
    if (initialPreset && !state.detectedListType) {
      selectPreset(initialPreset)
    }
    // Only run on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const detectTypeFromText = useCallback(async () => {
    if (!state.freeTextDescription.trim()) return
    setDetectingType(true)
    try {
      const response = await sendAIMessage(
        LIST_TYPE_DETECTION_PROMPT + state.freeTextDescription,
        [{ role: 'user', content: state.freeTextDescription }],
        256,
        'haiku',
      )
      const parsed = extractJSON<{ listType?: string; confidence?: number }>(response)
      if (parsed?.listType) {
        const matchedPreset = LIST_PRESETS.find(
          (p) => p.key === parsed.listType || p.listType === parsed.listType,
        )
        setState((prev) => ({
          ...prev,
          detectedListType: parsed.listType as ListType,
          selectedPresetKey: matchedPreset?.key ?? null,
          sections: matchedPreset?.suggestedSections ?? [],
          tags: matchedPreset?.defaultTags ?? [],
          listTitle: prev.freeTextDescription,
        }))
      }
    } catch {
      // Fallback: use custom type
      setState((prev) => ({
        ...prev,
        detectedListType: 'custom',
        listTitle: prev.freeTextDescription,
      }))
    }
    setDetectingType(false)
  }, [state.freeTextDescription, setState])

  const parseItems = useCallback(async () => {
    if (!state.rawInput.trim()) return
    const prompt = activePreset?.parsePrompt ?? LIST_PRESETS[LIST_PRESETS.length - 1].parsePrompt
    setParsingItems(true)
    try {
      const response = await sendAIMessage(
        prompt,
        [{ role: 'user', content: state.rawInput }],
        4096,
        'haiku',
      )
      const parsed = extractJSON<Record<string, unknown>[]>(response)
      if (Array.isArray(parsed)) {
        const newItems: ListWizardItem[] = parsed.map((item: Record<string, unknown>) => ({
          text: String(item.text ?? item.content ?? item.name ?? ''),
          section: item.section as string | undefined ?? item.category as string | undefined,
          price: item.price != null ? String(item.price) : undefined,
          quantity: item.quantity != null ? String(item.quantity) : undefined,
          priority: item.priority as string | undefined,
          resource_url: (item.url ?? item.resource_url) as string | undefined,
          notes: item.notes as string | undefined,
          store_tags: Array.isArray(item.store_tags) ? item.store_tags as string[] : undefined,
          store_category: item.store_category as string | undefined,
        }))
        // Extract unique sections from parsed items
        const parsedSections = [...new Set(newItems.map((i) => i.section).filter(Boolean))] as string[]
        setState((prev) => {
          // Append new items, deduplicating by case-insensitive text match
          const existingTexts = new Set(
            prev.items.map((i) => i.text.trim().toLowerCase()),
          )
          const deduped = newItems.filter(
            (i) => i.text.trim() && !existingTexts.has(i.text.trim().toLowerCase()),
          )
          return {
            ...prev,
            items: [...prev.items, ...deduped],
            sections:
              parsedSections.length > 0
                ? [...new Set([...prev.sections, ...parsedSections])]
                : prev.sections,
          }
        })
      }
    } catch {
      // Fallback: split by newlines and append (deduplicated)
      const lines = state.rawInput
        .split('\n')
        .map((l) => l.trim())
        .filter(Boolean)
      setState((prev) => {
        const existingTexts = new Set(
          prev.items.map((i) => i.text.trim().toLowerCase()),
        )
        const deduped = lines
          .filter((text) => !existingTexts.has(text.toLowerCase()))
          .map((text) => ({ text }))
        return {
          ...prev,
          items: [...prev.items, ...deduped],
        }
      })
    }
    setParsingItems(false)
  }, [state.rawInput, activePreset, setState])

  const removeItem = useCallback(
    (index: number) => {
      setState((prev) => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }))
    },
    [setState],
  )

  const addItem = useCallback(() => {
    setState((prev) => ({
      ...prev,
      items: [...prev.items, { text: '' }],
    }))
  }, [setState])

  const updateItem = useCallback(
    (index: number, field: keyof ListWizardItem, value: string) => {
      setState((prev) => ({
        ...prev,
        items: prev.items.map((item, i) =>
          i === index ? { ...item, [field]: value } : item,
        ),
      }))
    },
    [setState],
  )

  const addSection = useCallback(() => {
    setState((prev) => ({
      ...prev,
      sections: [...prev.sections, ''],
    }))
  }, [setState])

  const updateSection = useCallback(
    (index: number, value: string) => {
      setState((prev) => ({
        ...prev,
        sections: prev.sections.map((s, i) => (i === index ? value : s)),
      }))
    },
    [setState],
  )

  const removeSection = useCallback(
    (index: number) => {
      setState((prev) => ({
        ...prev,
        sections: prev.sections.filter((_, i) => i !== index),
      }))
    },
    [setState],
  )

  // ─── Deploy ───

  /** Split a human quantity string ("2 lbs", "1 gallon", "3") into the DB's
   *  numeric quantity + quantity_unit columns. Non-numeric strings become
   *  a unit-only note so nothing is silently dropped (F-22: preset
   *  quantities were being discarded entirely). */
  const parseQuantity = (raw: string | undefined): { quantity: number | null; quantity_unit: string | null } => {
    if (!raw?.trim()) return { quantity: null, quantity_unit: null }
    const match = raw.trim().match(/^(\d+(?:[.,]\d+)?)\s*(.*)$/)
    if (!match) return { quantity: null, quantity_unit: raw.trim() }
    return {
      quantity: Number(match[1].replace(',', '.')),
      quantity_unit: match[2].trim() || null,
    }
  }

  const deploy = useCallback(async () => {
    if (!family || !currentMember) return
    setIsDeploying(true)
    setDeployError(null)
    try {
      // F-22: a list is never silently titled after the purpose tile. The
      // review step auto-suggests a visible, editable name; by the time
      // deploy runs a non-empty title is required (canFinish).
      const title = state.listTitle.trim()
      if (!title) {
        setDeployError('Give your list a name before deploying.')
        return
      }

      const validItems = state.items.filter((i) => i.text.trim())

      // 1. Create the list (with Living Shopping List V1 overrides) —
      // skipped on retry when a previous attempt already created it.
      let listId = deployedListIdRef.current
      if (!listId) {
        const createPayload: Parameters<typeof createList.mutateAsync>[0] = {
          family_id: family.id,
          owner_id: currentMember.id,
          title,
          list_type: resolvedListType,
          tags: state.tags,
        }
        // Respect extras toggles for Living Shopping List fields
        // (DB trigger sets defaults for shopping lists; only override if mom explicitly unchecked)
        if (state.extras.always_on === false) {
          createPayload.is_always_on = false
        }
        if (state.extras.shopping_mode === false) {
          createPayload.include_in_shopping_mode = false
        }
        const list = await createList.mutateAsync(createPayload)
        listId = list.id
        deployedListIdRef.current = listId
      }

      // 2. Create list items in ONE batched insert — all-or-nothing, so a
      // mid-list failure can never leave a half-populated list (the S4
      // audit found exactly that). Quantities from presets/parsing are
      // preserved instead of dropped.
      if (!itemsInsertedRef.current && validItems.length > 0) {
        const itemRows = validItems.map((item, i) => {
          const { quantity, quantity_unit } = parseQuantity(item.quantity)
          return {
            list_id: listId,
            content: item.text,
            section_name: item.section ?? null,
            notes: item.notes ?? null,
            sort_order: i,
            quantity,
            quantity_unit,
            store_tags: item.store_tags ?? null,
            store_category: item.store_category ?? null,
          }
        })
        const { error: itemsError } = await supabase.from('list_items').insert(itemRows)
        if (itemsError) {
          throw new Error(`Couldn't add your items (${itemsError.message}). Your list "${title}" was created — tap Create List to retry adding the items.`)
        }
        itemsInsertedRef.current = true
      }

      // 3. Share with selected members — each success is remembered so a
      // retry only re-attempts the missing shares.
      const shareTargets =
        state.sharingMode === 'specific'
          ? state.sharedMemberIds.filter((mid) => mid !== currentMember.id)
          : state.sharingMode === 'family'
            ? members.filter((m: FamilyMember) => m.id !== currentMember.id && m.is_active).map((m: FamilyMember) => m.id)
            : []
      const shareFailures: string[] = []
      for (const mid of shareTargets) {
        if (sharedIdsRef.current.has(mid)) continue
        try {
          await shareList.mutateAsync({
            listId: listId!,
            memberId: mid,
            canEdit: state.anyoneCanAdd,
          })
          sharedIdsRef.current.add(mid)
        } catch (err) {
          console.error('List wizard share failed for member', mid, err)
          shareFailures.push(mid)
        }
      }
      if (shareFailures.length > 0) {
        const names = shareFailures
          .map((mid) => members.find((m: FamilyMember) => m.id === mid)?.display_name ?? 'a family member')
          .join(', ')
        throw new Error(`Your list "${title}" and its items were created, but sharing with ${names} didn't go through. Tap Create List to retry sharing.`)
      }

      // 4. Log to activity_log_entries (best-effort — never blocks success)
      const { error: logError } = await supabase.from('activity_log_entries').insert({
        family_id: family.id,
        member_id: currentMember.id,
        event_type: 'wizard_deployed',
        source: 'wizard',
        source_reference_id: listId,
        source_table: 'lists',
        metadata: {
          wizard_id: 'universal-list',
          preset: state.selectedPresetKey,
          list_type: resolvedListType,
          item_count: validItems.length,
          sharing_mode: state.sharingMode,
          shared_with_count: shareTargets.length,
          tags: state.tags,
          connections: state.connections,
          extras: state.extras,
        },
      })
      if (logError) console.warn('List wizard activity log failed (non-critical):', logError)

      queryClient.invalidateQueries({ queryKey: ['list-items', listId] })
      queryClient.invalidateQueries({ queryKey: ['lists', family.id] })
      deployedListIdRef.current = null
      itemsInsertedRef.current = false
      sharedIdsRef.current = new Set()
      clearProgress()
      onClose()
    } catch (err) {
      console.error('List wizard deploy failed:', err)
      setDeployError(
        err instanceof Error && err.message
          ? err.message
          : 'Something went wrong deploying your list. Nothing was lost — tap Create List to try again.',
      )
    }
    setIsDeploying(false)
  }, [
    family,
    currentMember,
    members,
    state,
    resolvedListType,
    createList,
    shareList,
    clearProgress,
    onClose,
    queryClient,
  ])

  // ─── Navigation ───

  const canAdvance = useMemo(() => {
    switch (currentStep) {
      case 0: // Purpose
        return !!(state.selectedPresetKey || state.detectedListType)
      case 1: // Items
        return state.items.length > 0
      case 2: // Sharing — "specific" with nobody picked would silently
        // deploy an unshared list (F-22): require at least one person.
        return state.sharingMode !== 'specific' || state.sharedMemberIds.length > 0
      case 3: // Organize
        return true
      case 4: // Extras
        return true
      case 5: // Review
        return true
      default:
        return true
    }
  }, [currentStep, state])

  const handleNext = useCallback(() => {
    setCurrentStep(currentStep + 1)
  }, [currentStep, setCurrentStep])

  // F-22: auto-suggest a real, VISIBLE list name when mom reaches Review
  // without typing one — never silently fall back to the purpose-tile label
  // at deploy time. The suggestion sits editable in the name input.
  const SUGGESTED_NAMES: Record<string, string> = useMemo(() => ({
    todo: 'To-Do List',
    shopping: 'Grocery List',
    shared_shopping: 'Family Shopping List',
    expenses: 'Upcoming Expenses',
    packing: 'Packing List',
    wishlist: 'Wishlist',
    school_expenses: 'School Expenses',
    ideas: 'Ideas',
    prayer: 'Prayer List',
    custom: 'My List',
  }), [])

  useEffect(() => {
    if (currentStep === 5 && !state.listTitle.trim()) {
      const suggestion =
        (state.selectedPresetKey && SUGGESTED_NAMES[state.selectedPresetKey]) ||
        state.freeTextDescription.trim() ||
        SUGGESTED_NAMES[resolvedListType] ||
        'My List'
      setState((prev) => ({ ...prev, listTitle: suggestion }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentStep])

  const handleBack = useCallback(() => {
    setCurrentStep(currentStep - 1)
  }, [currentStep, setCurrentStep])

  // ─── Active members for sharing ───

  const shareableMembers = useMemo(
    () => members.filter((m: FamilyMember) => m.is_active && m.id !== currentMember?.id),
    [members, currentMember],
  )

  // ─── Render steps ───

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return renderPurposeStep()
      case 1:
        return renderItemsStep()
      case 2:
        return renderSharingStep()
      case 3:
        return renderOrganizeStep()
      case 4:
        return renderExtrasStep()
      case 5:
        return renderReviewStep()
      default:
        return null
    }
  }

  // ─── Step 1: Purpose ───

  const renderPurposeStep = () => (
    <div className="space-y-4">
      {hasRestoredDraft && (
        <div
          className="flex items-center justify-between px-3 py-2 rounded-lg text-sm"
          style={{
            backgroundColor: 'var(--color-bg-tertiary)',
            color: 'var(--color-text-secondary)',
          }}
        >
          <span>Resumed from where you left off.</span>
          <button
            onClick={clearProgress}
            className="text-xs underline"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Start over
          </button>
        </div>
      )}

      <p
        className="text-sm"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Pick a starting point, or describe what you need and we'll figure out the
        best format.
      </p>

      {/* Suggested starting points */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {LIST_PRESETS.filter((p) => p.key !== 'custom' && p.key !== 'shared_shopping').map((preset) => {
          const Icon = PRESET_ICONS[preset.key] ?? LayoutList
          const isSelected = state.selectedPresetKey === preset.key
          return (
            <button
              key={preset.key}
              onClick={() => selectPreset(preset.key)}
              className="flex flex-col items-start gap-1.5 p-3 rounded-lg text-left transition-all"
              style={{
                backgroundColor: isSelected
                  ? 'var(--color-bg-tertiary)'
                  : 'var(--color-bg-secondary)',
                border: isSelected
                  ? '2px solid var(--color-btn-primary-bg)'
                  : '2px solid transparent',
              }}
            >
              <Icon
                size={18}
                style={{
                  color: isSelected
                    ? 'var(--color-btn-primary-bg)'
                    : 'var(--color-text-muted)',
                }}
              />
              <span
                className="text-sm font-medium"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {preset.label}
              </span>
            </button>
          )
        })}
      </div>

      {/* Free text description */}
      <div className="space-y-2">
        <label
          className="text-xs font-medium"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Or describe what you need:
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={state.freeTextDescription}
            onChange={(e) =>
              setState((prev) => ({
                ...prev,
                freeTextDescription: e.target.value,
                selectedPresetKey: null,
              }))
            }
            onKeyDown={(e) => {
              if (e.key === 'Enter') detectTypeFromText()
            }}
            placeholder='e.g., "stuff we need from Costco"'
            className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
          />
          <button
            onClick={detectTypeFromText}
            disabled={!state.freeTextDescription.trim() || detectingType}
            className="px-3 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
            style={{
              backgroundColor: 'var(--color-btn-primary-bg)',
              color: 'var(--color-btn-primary-text)',
            }}
          >
            {detectingType ? <Loader size={14} className="animate-spin" /> : 'Go'}
          </button>
        </div>
        {state.detectedListType && !state.selectedPresetKey && (
          <p
            className="text-xs"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Detected: {state.detectedListType} list
          </p>
        )}
      </div>
    </div>
  )

  // ─── Step 2: Items ───

  const hasExampleItems = state.items.length > 0 && state.items.some((i) => i.fromExample)

  const clearExampleItems = useCallback(() => {
    setState((prev) => ({
      ...prev,
      items: [],
      rawInput: '',
    }))
  }, [setState])

  const renderItemsStep = () => (
    <div className="space-y-4">
      <p
        className="text-sm"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {hasExampleItems
          ? 'Here\'s a starting list — edit these, add your own, or clear and start fresh.'
          : 'List everything — one item per line, or just brain dump it all. AI will organize it for you.'}
      </p>

      <textarea
        value={state.rawInput}
        onChange={(e) =>
          setState((prev) => ({ ...prev, rawInput: e.target.value }))
        }
        placeholder={
          activePreset?.key === 'shopping'
            ? 'milk, eggs, bread, chicken breasts (2 lbs), broccoli...'
            : activePreset?.key === 'todo'
              ? 'Call the dentist\nReturn library books\nFix the kitchen faucet...'
              : 'Type or paste your items here...'
        }
        rows={6}
        className="w-full px-3 py-2 rounded-lg text-sm outline-none resize-none"
        style={{
          backgroundColor: 'var(--color-bg-secondary)',
          color: 'var(--color-text-primary)',
          border: '1px solid var(--color-border)',
        }}
      />

      <div className="flex gap-2">
        <button
          onClick={parseItems}
          disabled={!state.rawInput.trim() || parsingItems}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
          style={{
            backgroundColor: 'var(--color-btn-primary-bg)',
            color: 'var(--color-btn-primary-text)',
          }}
        >
          {parsingItems ? (
            <>
              <Loader size={14} className="animate-spin" />
              Organizing...
            </>
          ) : (
            'Organize with AI'
          )}
        </button>
        {state.items.length > 0 && (
          <span
            className="self-center text-xs"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {state.items.length} items ready
          </span>
        )}
      </div>

      {/* Parsed items preview */}
      {state.items.length > 0 && (
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {state.items.map((item, i) => (
            <div
              key={i}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
              style={{ backgroundColor: 'var(--color-bg-secondary)' }}
            >
              <GripVertical
                size={12}
                style={{ color: 'var(--color-text-muted)' }}
              />
              <input
                type="text"
                value={item.text}
                onChange={(e) => updateItem(i, 'text', e.target.value)}
                className="flex-1 text-sm bg-transparent outline-none"
                style={{ color: 'var(--color-text-primary)' }}
              />
              {item.section && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    backgroundColor: 'var(--color-bg-tertiary)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {item.section}
                </span>
              )}
              {item.price && (
                <span
                  className="text-xs"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  ${item.price}
                </span>
              )}
              <button onClick={() => removeItem(i)}>
                <Trash2
                  size={12}
                  style={{ color: 'var(--color-text-muted)' }}
                />
              </button>
            </div>
          ))}
          <div className="flex items-center gap-3">
            <button
              onClick={addItem}
              className="flex items-center gap-1 px-3 py-1.5 text-xs transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <Plus size={12} />
              Add item
            </button>
            {hasExampleItems && (
              <button
                onClick={clearExampleItems}
                className="flex items-center gap-1 px-3 py-1.5 text-xs transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <Trash2 size={12} />
                Clear examples and start fresh
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )

  // ─── Step 3: Sharing ───

  const renderSharingStep = () => (
    <div className="space-y-4">
      <p
        className="text-sm"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        Who should have access to this list?
      </p>

      <div className="space-y-2">
        {(['private', 'specific', 'family'] as const).map((mode) => {
          const labels = {
            private: { title: 'Just me', desc: 'Only you can see and edit this list.' },
            specific: {
              title: 'Me and specific people',
              desc: 'Share with family members you choose.',
            },
            family: {
              title: 'Whole family',
              desc: 'Everyone in the family can see this list.',
            },
          }
          const { title, desc } = labels[mode]
          return (
            <button
              key={mode}
              onClick={() =>
                setState((prev) => ({ ...prev, sharingMode: mode }))
              }
              className="w-full text-left px-4 py-3 rounded-lg transition-all"
              style={{
                backgroundColor:
                  state.sharingMode === mode
                    ? 'var(--color-bg-tertiary)'
                    : 'var(--color-bg-secondary)',
                border:
                  state.sharingMode === mode
                    ? '2px solid var(--color-btn-primary-bg)'
                    : '2px solid transparent',
              }}
            >
              <div
                className="text-sm font-medium"
                style={{ color: 'var(--color-text-primary)' }}
              >
                {title}
              </div>
              <div
                className="text-xs mt-0.5"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {desc}
              </div>
            </button>
          )
        })}
      </div>

      {/* Member picker for "specific" mode */}
      {state.sharingMode === 'specific' && shareableMembers.length > 0 && (
        <div className="space-y-2">
          <div className="flex flex-wrap gap-1.5">
            {shareableMembers.map((m: FamilyMember) => {
              const isSelected = state.sharedMemberIds.includes(m.id)
              const color = getMemberColor(m)
              return (
                <button
                  key={m.id}
                  onClick={() =>
                    setState((prev) => ({
                      ...prev,
                      sharedMemberIds: isSelected
                        ? prev.sharedMemberIds.filter((id) => id !== m.id)
                        : [...prev.sharedMemberIds, m.id],
                    }))
                  }
                  className="px-3 py-1.5 rounded-full text-xs font-medium transition-all"
                  style={
                    isSelected
                      ? { backgroundColor: color, color: '#fff', border: `2px solid ${color}` }
                      : { backgroundColor: 'transparent', color: 'var(--color-text-secondary)', border: `2px solid ${color}` }
                  }
                >
                  {m.display_name.split(' ')[0]}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* "Can others add items?" toggle */}
      {state.sharingMode !== 'private' && (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={state.anyoneCanAdd}
            onChange={(e) =>
              setState((prev) => ({ ...prev, anyoneCanAdd: e.target.checked }))
            }
            className="rounded"
            style={{ accentColor: 'var(--color-btn-primary-bg)' }}
          />
          <span
            className="text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Others can add items (not just view)
          </span>
        </label>
      )}
    </div>
  )

  // ─── Step 4: Organize ───

  const renderOrganizeStep = () => (
    <div className="space-y-4">
      <p
        className="text-sm"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {state.sections.length > 0
          ? 'We suggested some categories. Edit, add, or remove as you like.'
          : 'Want to organize items into sections? Add categories below, or skip this step.'}
      </p>

      <div className="space-y-1.5">
        {state.sections.map((section, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="text"
              value={section}
              onChange={(e) => updateSection(i, e.target.value)}
              placeholder="Section name"
              className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
              }}
            />
            <button onClick={() => removeSection(i)}>
              <Trash2
                size={14}
                style={{ color: 'var(--color-text-muted)' }}
              />
            </button>
          </div>
        ))}
        <button
          onClick={addSection}
          className="flex items-center gap-1 px-3 py-2 text-sm transition-colors"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <Plus size={14} />
          Add section
        </button>
      </div>

      {/* Preview items by section */}
      {state.sections.length > 0 && state.items.length > 0 && (
        <div className="space-y-3 mt-4">
          <h4
            className="text-xs font-medium uppercase"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Preview
          </h4>
          {state.sections.map((section) => {
            const sectionItems = state.items.filter(
              (item) =>
                item.section?.toLowerCase() === section.toLowerCase(),
            )
            if (sectionItems.length === 0) return null
            return (
              <div key={section}>
                <div
                  className="text-xs font-semibold uppercase mb-1"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  {section} ({sectionItems.length})
                </div>
                {sectionItems.map((item, i) => (
                  <div
                    key={i}
                    className="text-xs pl-3 py-0.5"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {item.text}
                  </div>
                ))}
              </div>
            )
          })}
          {/* Unsectioned items */}
          {(() => {
            const unsectioned = state.items.filter(
              (item) =>
                !item.section ||
                !state.sections.some(
                  (s) => s.toLowerCase() === item.section?.toLowerCase(),
                ),
            )
            if (unsectioned.length === 0) return null
            return (
              <div>
                <div
                  className="text-xs font-semibold uppercase mb-1"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Unsorted ({unsectioned.length})
                </div>
                {unsectioned.map((item, i) => (
                  <div
                    key={i}
                    className="text-xs pl-3 py-0.5"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {item.text}
                  </div>
                ))}
              </div>
            )
          })()}
        </div>
      )}
    </div>
  )

  // ─── Step 5: Extras ───

  const renderExtrasStep = () => {
    const presetExtras = activePreset?.extras ?? []

    return (
      <div className="space-y-4">
        {presetExtras.length > 0 && (
          <div className="space-y-2">
            {presetExtras.map((extra) => (
              <label
                key={extra.key}
                className="flex items-start gap-2.5 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={state.extras[extra.key] ?? extra.defaultChecked}
                  onChange={(e) =>
                    setState((prev) => ({
                      ...prev,
                      extras: { ...prev.extras, [extra.key]: e.target.checked },
                    }))
                  }
                  className="mt-0.5 rounded"
                  style={{ accentColor: 'var(--color-btn-primary-bg)' }}
                />
                <div>
                  <div
                    className="text-sm font-medium"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {extra.label}
                  </div>
                  <div
                    className="text-xs mt-0.5"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {extra.description}
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}

        <ConnectionOffersPanel
          context="list"
          connections={state.connections}
          onChange={(connections) =>
            setState((prev) => ({ ...prev, connections }))
          }
        />

        {presetExtras.length === 0 &&
          Object.keys(state.connections).filter((k) => state.connections[k]).length === 0 && (
            <p
              className="text-sm text-center py-4"
              style={{ color: 'var(--color-text-muted)' }}
            >
              No extras for this list type. You can always add connections later.
            </p>
          )}
      </div>
    )
  }

  // ─── Step 6: Review ───

  const renderReviewStep = () => (
    <div className="space-y-4">
      {/* List title */}
      <div className="space-y-1">
        <label
          className="text-xs font-medium"
          style={{ color: 'var(--color-text-muted)' }}
        >
          List name
        </label>
        <input
          type="text"
          value={state.listTitle}
          onChange={(e) =>
            setState((prev) => ({ ...prev, listTitle: e.target.value }))
          }
          placeholder={activePreset?.label ?? 'My List'}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
          }}
        />
      </div>

      {/* Summary */}
      <div
        className="p-3 rounded-lg space-y-2"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
      >
        <div className="flex justify-between text-sm">
          <span style={{ color: 'var(--color-text-muted)' }}>Type</span>
          <span style={{ color: 'var(--color-text-primary)' }}>
            {resolvedListType}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span style={{ color: 'var(--color-text-muted)' }}>Items</span>
          <span style={{ color: 'var(--color-text-primary)' }}>
            {state.items.length}
          </span>
        </div>
        {state.sections.length > 0 && (
          <div className="flex justify-between text-sm">
            <span style={{ color: 'var(--color-text-muted)' }}>Sections</span>
            <span style={{ color: 'var(--color-text-primary)' }}>
              {state.sections.filter(Boolean).length}
            </span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span style={{ color: 'var(--color-text-muted)' }}>Sharing</span>
          <span style={{ color: 'var(--color-text-primary)' }}>
            {state.sharingMode === 'private'
              ? 'Just you'
              : state.sharingMode === 'family'
                ? 'Whole family'
                : `${state.sharedMemberIds.length} people`}
          </span>
        </div>
      </div>

      {/* Tags */}
      <WizardTagPicker
        tags={state.tags}
        onChange={(tags) => setState((prev) => ({ ...prev, tags }))}
        suggestedTags={activePreset?.defaultTags ?? []}
      />

      {/* F-22: deploy failures are surfaced to mom, never console-only.
          The wizard stays open and Create List retries against the SAME
          list (no duplicate half-lists). */}
      {deployError && (
        <div
          role="alert"
          className="rounded-lg p-3 text-sm border"
          style={{
            borderColor: 'var(--color-error, #b3261e)',
            color: 'var(--color-error, #b3261e)',
            backgroundColor: 'color-mix(in srgb, var(--color-error, #b3261e) 8%, var(--color-bg-card))',
          }}
        >
          {deployError}
        </div>
      )}

      <p
        className="text-xs text-center"
        style={{ color: 'var(--color-text-muted)' }}
      >
        You can add more items anytime — type them in, brain dump to your
        notepad, or tell LiLa.
      </p>
    </div>
  )

  // ─── Wizard shell ───

  return (
    <SetupWizard
      id="universal-list-wizard"
      isOpen={isOpen}
      onClose={onClose}
      title={activePreset?.wizardTitle ?? 'Create a List'}
      subtitle={activePreset?.wizardTitle ? undefined : activePreset?.label}
      steps={STEPS}
      currentStep={currentStep}
      onBack={handleBack}
      onNext={handleNext}
      onFinish={deploy}
      canAdvance={canAdvance}
      canFinish={state.items.length > 0 && state.listTitle.trim().length > 0}
      isFinishing={isDeploying}
      finishLabel="Create List"
    >
      {renderStep()}
    </SetupWizard>
  )
}
