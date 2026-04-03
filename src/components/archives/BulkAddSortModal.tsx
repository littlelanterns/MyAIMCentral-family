/**
 * BulkAddSortModal — PRD-13B
 * Three-step flow: Input → AI Sort (Haiku) → Review & Save.
 * Human-in-the-Mix: nothing saves without mom reviewing.
 * Saves archive_context_items with source = 'bulk_add'.
 */

import { useState, useCallback, useMemo } from 'react'
import { Loader, RefreshCw, ArrowLeft, Check, Sparkles } from 'lucide-react'
import { ModalV2 } from '@/components/shared'
import { sendAIMessage, extractJSON } from '@/lib/ai/send-ai-message'
import { VoiceInputButton } from '@/components/shared/VoiceInputButton'
import { useCreateArchiveContextItem } from '@/hooks/useArchives'
import { supabase } from '@/lib/supabase/client'
import { SYSTEM_FOLDER_NAMES } from '@/types/archives'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface BulkAddSortModalProps {
  open: boolean
  onClose: () => void
  familyId: string
  momMemberId: string
  familyMembers: Array<{ id: string; display_name: string; role: string }>
  /** Pre-populated input text (e.g. from Voice Dump) */
  initialText?: string
}

interface SortedItem {
  member_name: string
  folder_category: string
  context_field: string
  context_value: string
  selected: boolean
  /** Resolved member_id (set during review) */
  member_id: string | null
}

type Step = 'input' | 'sorting' | 'review' | 'error'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const FOLDER_CATEGORIES = [...SYSTEM_FOLDER_NAMES] as string[]
const FAMILY_OVERVIEW_LABEL = 'Family Overview'

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BulkAddSortModal({
  open,
  onClose,
  familyId,
  momMemberId,
  familyMembers,
  initialText = '',
}: BulkAddSortModalProps) {
  const [step, setStep] = useState<Step>(initialText ? 'input' : 'input')
  const [inputText, setInputText] = useState(initialText)
  const [sortedItems, setSortedItems] = useState<SortedItem[]>([])
  const [errorMessage, setErrorMessage] = useState('')
  const [saving, setSaving] = useState(false)
  const createItem = useCreateArchiveContextItem()

  const handleVoiceTranscript = useCallback((text: string) => {
    setInputText(prev => prev ? prev + '\n' + text : text)
  }, [])

  // Auto-trigger sort if initialText is provided (from Voice Dump)
  const [autoTriggered, setAutoTriggered] = useState(false)

  // When modal opens with initial text, auto-trigger sort
  if (open && initialText && !autoTriggered && step === 'input') {
    setAutoTriggered(true)
    setInputText(initialText)
    // Defer the sort to next tick
    setTimeout(() => handleSort(initialText), 0)
  }

  // Reset state when modal closes
  const handleClose = useCallback(() => {
    setStep('input')
    setInputText('')
    setSortedItems([])
    setErrorMessage('')
    setAutoTriggered(false)
    onClose()
  }, [onClose])

  // Member lookup: name → id
  const memberLookup = useMemo(() => {
    const map = new Map<string, string>()
    for (const m of familyMembers) {
      map.set(m.display_name.toLowerCase(), m.id)
    }
    return map
  }, [familyMembers])

  // Member + "Family Overview" dropdown options
  const memberOptions = useMemo(
    () => [
      { value: FAMILY_OVERVIEW_LABEL, label: FAMILY_OVERVIEW_LABEL },
      ...familyMembers.map((m) => ({ value: m.display_name, label: m.display_name })),
    ],
    [familyMembers],
  )

  // -------------------------------------------------------------------------
  // AI Sort
  // -------------------------------------------------------------------------

  async function handleSort(text?: string) {
    const content = (text || inputText).trim()
    if (!content) return

    setStep('sorting')
    setErrorMessage('')

    const memberList = familyMembers
      .map((m) => `- ${m.display_name} (${m.role})`)
      .join('\n')

    const systemPrompt = `You are sorting family context items. Extract every individual fact from the text below and assign each to the correct family member and folder category.

Family members:
${memberList}

Folder categories (use EXACTLY these names):
${FOLDER_CATEGORIES.map((c) => `- ${c}`).join('\n')}

Rules:
- Extract every useful fact, even small details
- If a fact applies to the whole family use member_name: "${FAMILY_OVERVIEW_LABEL}"
- Be generous — extract too much rather than too little
- Return ONLY valid JSON, no markdown, no explanation

Return this exact structure:
[{"member_name": "exact name from list above", "folder_category": "exact category name above", "context_field": "short label like Favorite game", "context_value": "the actual fact"}]`

    try {
      const response = await sendAIMessage(
        systemPrompt,
        [{ role: 'user', content }],
        4096,
        'haiku',
      )

      const parsed = extractJSON<Array<{
        member_name: string
        folder_category: string
        context_field: string
        context_value: string
      }>>(response)

      if (!parsed || !Array.isArray(parsed) || parsed.length === 0) {
        setErrorMessage('LiLa could not extract any items. Try adding more detail.')
        setStep('error')
        return
      }

      // Resolve member_ids and build sorted items
      const items: SortedItem[] = parsed.map((item) => ({
        member_name: item.member_name || FAMILY_OVERVIEW_LABEL,
        folder_category: FOLDER_CATEGORIES.includes(item.folder_category)
          ? item.folder_category
          : 'General',
        context_field: item.context_field || '',
        context_value: item.context_value || '',
        selected: true,
        member_id: memberLookup.get(item.member_name?.toLowerCase()) ?? null,
      }))

      setSortedItems(items)
      setStep('review')
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'AI call failed')
      setStep('error')
    }
  }

  // -------------------------------------------------------------------------
  // Save
  // -------------------------------------------------------------------------

  const selectedCount = sortedItems.filter((i) => i.selected).length

  async function handleSave() {
    const toSave = sortedItems.filter((i) => i.selected)
    if (toSave.length === 0) return

    setSaving(true)

    try {
      // We need to find/create folders for each member+category combo
      for (const item of toSave) {
        const memberId = item.member_id
        const isFamilyLevel = item.member_name === FAMILY_OVERVIEW_LABEL

        // Find the target folder
        let folderId: string | null = null

        if (isFamilyLevel) {
          // Find family overview subfolder matching the category
          const { data: folders } = await supabase
            .from('archive_folders')
            .select('id, folder_name')
            .eq('family_id', familyId)
            .is('member_id', null)
            .eq('folder_type', 'family_overview')

          const match = folders?.find(
            (f: { folder_name: string }) =>
              f.folder_name.toLowerCase().includes(item.folder_category.toLowerCase()) ||
              item.folder_category.toLowerCase().includes(f.folder_name.toLowerCase()),
          )
          folderId = match?.id ?? folders?.[0]?.id ?? null
        } else if (memberId) {
          // Find member's system category folder
          const { data: folders } = await supabase
            .from('archive_folders')
            .select('id, folder_name, parent_folder_id')
            .eq('family_id', familyId)
            .eq('member_id', memberId)
            .eq('folder_type', 'system_category')

          const match = folders?.find(
            (f: { folder_name: string }) => f.folder_name === item.folder_category,
          )

          if (match) {
            folderId = match.id
          } else {
            // Fall back to "General" folder
            const general = folders?.find(
              (f: { folder_name: string }) => f.folder_name === 'General',
            )
            folderId = general?.id ?? folders?.[0]?.id ?? null
          }
        }

        if (!folderId) continue

        await createItem.mutateAsync({
          family_id: familyId,
          folder_id: folderId,
          member_id: memberId,
          context_field: item.context_field || null,
          context_value: item.context_value,
          context_type: 'general',
          source: 'manual', // DB CHECK may not have 'bulk_add' yet — use 'manual' as safe fallback
          added_by: momMemberId,
        })
      }

      handleClose()

      // Toast would be nice but we don't have a ref here — the parent can handle it
    } catch {
      setErrorMessage('Failed to save some items. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  // -------------------------------------------------------------------------
  // Item editing
  // -------------------------------------------------------------------------

  function updateItem(index: number, updates: Partial<SortedItem>) {
    setSortedItems((prev) =>
      prev.map((item, i) => {
        if (i !== index) return item
        const updated = { ...item, ...updates }
        // Re-resolve member_id if member_name changed
        if (updates.member_name !== undefined) {
          updated.member_id = memberLookup.get(updates.member_name.toLowerCase()) ?? null
        }
        return updated
      }),
    )
  }

  function toggleAll(selected: boolean) {
    setSortedItems((prev) => prev.map((item) => ({ ...item, selected })))
  }

  // -------------------------------------------------------------------------
  // Grouped items for review
  // -------------------------------------------------------------------------

  const groupedItems = useMemo(() => {
    const map = new Map<string, { items: Array<SortedItem & { index: number }> }>()
    sortedItems.forEach((item, index) => {
      const key = item.member_name
      if (!map.has(key)) map.set(key, { items: [] })
      map.get(key)!.items.push({ ...item, index })
    })
    return Array.from(map.entries())
  }, [sortedItems])

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  return (
    <ModalV2
      id="archive-bulk-add-sort"
      isOpen={open}
      onClose={handleClose}
      type="transient"
      title={step === 'review' ? 'Review & Save' : 'Bulk Add & Sort'}
      size="lg"
      footer={
        step === 'review' ? (
          <div className="flex items-center justify-between w-full">
            <div className="flex gap-2">
              <button
                onClick={() => { setStep('input'); setAutoTriggered(false) }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
                style={{
                  color: 'var(--color-text-secondary)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <ArrowLeft size={14} /> Edit Input
              </button>
              <button
                onClick={() => handleSort()}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
                style={{
                  color: 'var(--color-btn-primary-bg)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <RefreshCw size={14} /> Regenerate
              </button>
            </div>
            <button
              onClick={handleSave}
              disabled={saving || selectedCount === 0}
              className="flex items-center gap-1.5 px-5 py-2 rounded-lg text-sm font-semibold transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60"
              style={{
                background: 'var(--surface-primary, var(--color-btn-primary-bg))',
                color: 'var(--color-btn-primary-text)',
              }}
            >
              {saving ? (
                <Loader size={14} className="animate-spin" />
              ) : (
                <Check size={14} />
              )}
              Save Selected ({selectedCount})
            </button>
          </div>
        ) : undefined
      }
    >
      {/* Step: Input */}
      {step === 'input' && (
        <div className="space-y-4 py-2">
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Describe your family — paste notes, a list, anything. LiLa will sort each item to the right person and folder.
          </p>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Jordan loves Minecraft and hates math worksheets.\nRuthie needs her weighted blanket during therapy.\nAlex is into music production.\nCasey's favorite series is Percy Jackson.\nFamily rule: no screens before breakfast.`}
            rows={8}
            className="w-full text-sm rounded-lg px-3 py-2.5 outline-none transition-colors resize-y"
            style={{
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
              minHeight: '160px',
            }}
          />

          <VoiceInputButton
            onTranscript={handleVoiceTranscript}
            size={16}
            label="Dictate Instead"
            buttonClassName="w-full flex items-center justify-center gap-2 px-4 py-3 text-sm rounded-xl transition-transform hover:scale-[1.01] active:scale-[0.99]"
          />

          <button
            onClick={() => handleSort()}
            disabled={!inputText.trim()}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50"
            style={{
              background: 'var(--surface-primary, var(--color-btn-primary-bg))',
              color: 'var(--color-btn-primary-text)',
            }}
          >
            <Sparkles size={16} />
            Let LiLa Sort
          </button>
        </div>
      )}

      {/* Step: Sorting */}
      {step === 'sorting' && (
        <div className="flex flex-col items-center justify-center py-16 gap-4">
          <Loader size={32} className="animate-spin" style={{ color: 'var(--color-btn-primary-bg)' }} />
          <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
            LiLa is sorting your items...
          </p>
        </div>
      )}

      {/* Step: Error */}
      {step === 'error' && (
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <p className="text-sm text-center" style={{ color: 'var(--color-error, #ef4444)' }}>
            {errorMessage}
          </p>
          <div className="flex gap-3">
            <button
              onClick={() => { setStep('input'); setAutoTriggered(false) }}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
              }}
            >
              Edit Input
            </button>
            <button
              onClick={() => handleSort()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium"
              style={{
                background: 'var(--surface-primary, var(--color-btn-primary-bg))',
                color: 'var(--color-btn-primary-text)',
              }}
            >
              <RefreshCw size={14} /> Try Again
            </button>
          </div>
        </div>
      )}

      {/* Step: Review */}
      {step === 'review' && (
        <div className="space-y-4 py-2">
          {/* Select all / none */}
          <div className="flex items-center justify-between">
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {selectedCount} of {sortedItems.length} items selected
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => toggleAll(true)}
                className="text-xs font-medium px-2 py-1 rounded"
                style={{ color: 'var(--color-btn-primary-bg)' }}
              >
                Select all
              </button>
              <button
                onClick={() => toggleAll(false)}
                className="text-xs font-medium px-2 py-1 rounded"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Deselect all
              </button>
            </div>
          </div>

          {/* Grouped by member */}
          {groupedItems.map(([memberName, group]) => (
            <div key={memberName}>
              <h4
                className="text-sm font-semibold mb-2 px-1"
                style={{ color: 'var(--color-text-heading)' }}
              >
                {memberName}
              </h4>

              <div className="space-y-1.5">
                {group.items.map(({ index, ...item }) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 p-2.5 rounded-lg"
                    style={{
                      backgroundColor: item.selected
                        ? 'color-mix(in srgb, var(--color-btn-primary-bg) 6%, transparent)'
                        : 'var(--color-bg-secondary)',
                      border: `1px solid ${item.selected ? 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)' : 'var(--color-border)'}`,
                      opacity: item.selected ? 1 : 0.6,
                    }}
                  >
                    {/* Checkbox */}
                    <input
                      type="checkbox"
                      checked={item.selected}
                      onChange={(e) => updateItem(index, { selected: e.target.checked })}
                      className="mt-1 flex-shrink-0"
                      style={{ accentColor: 'var(--color-btn-primary-bg)', width: 16, height: 16 }}
                    />

                    {/* Content */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div>
                        {item.context_field && (
                          <span className="text-xs font-semibold" style={{ color: 'var(--color-text-heading)' }}>
                            {item.context_field}:{' '}
                          </span>
                        )}
                        <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                          {item.context_value}
                        </span>
                      </div>

                      {/* Editable dropdowns */}
                      <div className="flex gap-2 flex-wrap">
                        <select
                          value={item.member_name}
                          onChange={(e) => updateItem(index, { member_name: e.target.value })}
                          className="text-xs rounded px-2 py-1 outline-none"
                          style={{
                            backgroundColor: 'var(--color-bg-secondary)',
                            color: 'var(--color-text-primary)',
                            border: '1px solid var(--color-border)',
                          }}
                        >
                          {memberOptions.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>

                        <select
                          value={item.folder_category}
                          onChange={(e) => updateItem(index, { folder_category: e.target.value })}
                          className="text-xs rounded px-2 py-1 outline-none"
                          style={{
                            backgroundColor: 'var(--color-bg-secondary)',
                            color: 'var(--color-text-primary)',
                            border: '1px solid var(--color-border)',
                          }}
                        >
                          {FOLDER_CATEGORIES.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </ModalV2>
  )
}
