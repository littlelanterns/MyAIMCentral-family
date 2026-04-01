import { useState, useCallback } from 'react'
import { X, Trash2, Check, Loader } from 'lucide-react'
import { sendAIMessage, extractJSON } from '@/lib/ai/send-ai-message'

/**
 * BulkAddWithAI — Universal reusable component (PRD-17 pattern)
 *
 * Used everywhere items are bulk-added via natural language:
 * - Family member setup
 * - Guiding Stars
 * - Best Intentions
 * - Self-Knowledge
 * - Tasks
 * - Lists
 * - Review & Route extracted items
 *
 * The caller provides a parsePrompt that tells the AI how to parse the input,
 * optional categories for sorting, and an onSave callback.
 */

export interface ParsedBulkItem {
  text: string
  category?: string
  selected: boolean
  unclear?: boolean
  metadata?: Record<string, unknown>
}

interface CategoryOption {
  value: string
  label: string
}

interface BulkAddWithAIProps {
  title: string
  placeholder: string
  hint?: string
  categories?: CategoryOption[]
  parsePrompt: string
  onSave: (items: ParsedBulkItem[]) => Promise<void>
  onClose: () => void
  modelTier?: 'sonnet' | 'haiku'
}

export function BulkAddWithAI({
  title,
  placeholder,
  hint,
  categories,
  parsePrompt,
  onSave,
  onClose,
  modelTier = 'haiku',
}: BulkAddWithAIProps) {
  const [inputText, setInputText] = useState('')
  const [parsedItems, setParsedItems] = useState<ParsedBulkItem[]>([])
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState<'input' | 'preview'>('input')
  const [error, setError] = useState<string | null>(null)

  const defaultCategory = categories?.[0]?.value

  const handleParse = useCallback(async () => {
    const trimmed = inputText.trim()
    if (!trimmed) return

    setParsing(true)
    setError(null)

    try {
      const categoryList = categories
        ? categories.map(c => `"${c.value}" (${c.label})`).join(', ')
        : ''

      const systemPrompt = categories
        ? `${parsePrompt}\n\nValid categories: ${categoryList}\n\nReturn ONLY a JSON array of objects with "text" and "category" fields. If an entry is ambiguous (could be a store name, a category header, an errand, or not clearly a list item), include "unclear": true so the user can clarify. Example: [{"text": "item text", "category": "Store"}, {"text": "Walgreens", "category": "", "unclear": true}]. No other text.`
        : `${parsePrompt}\n\nReturn ONLY a JSON array of strings. Example: ["item 1", "item 2"]. No other text.`

      const response = await sendAIMessage(
        systemPrompt,
        [{ role: 'user', content: trimmed }],
        2048,
        modelTier,
      )

      const parsed = extractJSON<unknown[]>(response)

      if (parsed && Array.isArray(parsed)) {
        const items: ParsedBulkItem[] = parsed
          .map((item): ParsedBulkItem | null => {
            if (typeof item === 'string') {
              return { text: item.trim(), category: defaultCategory, selected: true }
            }
            if (item && typeof item === 'object' && 'text' in item) {
              const obj = item as Record<string, unknown>
              // Accept any non-empty category the AI returns (e.g. detected store names)
              const aiCat = typeof obj.category === 'string' && obj.category.trim() ? obj.category.trim() : undefined
              const cat = categories ? (aiCat || defaultCategory) : undefined
              const isUnclear = obj.unclear === true
              return {
                text: (obj.text as string).trim(),
                category: isUnclear ? undefined : cat,
                selected: !isUnclear, // Unclear items default to deselected
                unclear: isUnclear,
                metadata: obj,
              }
            }
            return null
          })
          .filter((item): item is ParsedBulkItem => item !== null && item.text.length > 0)

        if (items.length > 0) {
          setParsedItems(items)
          setStep('preview')
          return
        }
      }

      setError('Could not parse items from your text. Try a different format.')
    } catch (err) {
      setError((err as Error).message || 'Something went wrong. Please try again.')
    } finally {
      setParsing(false)
    }
  }, [inputText, parsePrompt, categories, defaultCategory, modelTier])

  const handleToggleItem = useCallback((index: number) => {
    setParsedItems(prev => prev.map((item, i) =>
      i === index ? { ...item, selected: !item.selected } : item
    ))
  }, [])

  const handleEditText = useCallback((index: number, newText: string) => {
    setParsedItems(prev => prev.map((item, i) =>
      i === index ? { ...item, text: newText } : item
    ))
  }, [])

  const handleEditCategory = useCallback((index: number, newCategory: string) => {
    setParsedItems(prev => prev.map((item, i) =>
      i === index ? { ...item, category: newCategory } : item
    ))
  }, [])

  const handleRemoveItem = useCallback((index: number) => {
    setParsedItems(prev => prev.filter((_, i) => i !== index))
  }, [])

  /** Resolve an unclear item: classify it as a section header, a regular item, or skip it */
  const handleResolveUnclear = useCallback((index: number, resolution: 'store' | 'item' | 'skip') => {
    setParsedItems(prev => prev.map((item, i) => {
      if (i !== index) return item
      if (resolution === 'skip') return { ...item, unclear: false, selected: false }
      if (resolution === 'store') {
        // Convert to a store section — reassign all subsequent unsectioned items to this store
        // and remove this entry (it's a header, not an item)
        const storeName = item.text
        const updated = [...prev]
        // Mark items after this one that have no category to use this store name
        for (let j = i + 1; j < updated.length; j++) {
          if (updated[j].unclear) break // stop at next unclear
          if (!updated[j].category) {
            updated[j] = { ...updated[j], category: storeName }
          }
        }
        // Mark this item as removed
        return { ...item, unclear: false, selected: false }
      }
      // resolution === 'item' — keep as a regular item
      return { ...item, unclear: false, selected: true, category: item.category || undefined }
    }))
  }, [])

  const handleSave = useCallback(async () => {
    const selected = parsedItems.filter(item => item.selected && item.text.trim().length > 0)
    if (selected.length === 0) return

    setSaving(true)
    setError(null)
    try {
      await onSave(selected)
      onClose()
    } catch {
      setError('Failed to save items. Please try again.')
    } finally {
      setSaving(false)
    }
  }, [parsedItems, onSave, onClose])

  const selectedCount = parsedItems.filter(item => item.selected && item.text.trim().length > 0).length

  return (
    <div
      className="rounded-xl overflow-hidden"
      style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
          {title}
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:opacity-70"
          style={{ color: 'var(--color-text-secondary)', minHeight: 'unset' }}
        >
          <X size={18} />
        </button>
      </div>

      {error && (
        <div className="px-4 py-2 text-sm" style={{ color: 'var(--color-error, #c44)' }}>
          {error}
        </div>
      )}

      {/* Step 1: Input */}
      {step === 'input' && (
        <div className="p-4 space-y-3">
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {hint || 'Paste or type in natural language. Any format works — the AI will sort it out.'}
          </p>

          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={placeholder}
            rows={6}
            className="w-full px-3 py-2 rounded-lg text-sm resize-y"
            style={{
              backgroundColor: 'var(--color-bg-primary)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-primary)',
              minHeight: 'unset',
            }}
            autoFocus
          />

          <div className="flex items-center gap-2">
            <button
              onClick={handleParse}
              disabled={!inputText.trim() || parsing}
              className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{
                backgroundColor: 'var(--color-btn-primary-bg)',
                color: 'var(--color-btn-primary-text)',
                minHeight: 'unset',
              }}
            >
              {parsing && <Loader size={14} className="animate-spin" />}
              {parsing ? 'Processing...' : 'Process with AI'}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-secondary)',
                minHeight: 'unset',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 'preview' && (() => {
        const unclearItems = parsedItems.map((item, i) => ({ item, index: i })).filter(({ item }) => item.unclear)
        const regularItems = parsedItems.map((item, i) => ({ item, index: i })).filter(({ item }) => !item.unclear)

        // Merge predefined categories with AI-detected ones for the dropdown
        const allCats = new Map(categories?.map(c => [c.value, c.label]) ?? [])
        parsedItems.forEach(p => {
          if (p.category && !allCats.has(p.category)) allCats.set(p.category, p.category)
        })

        return (
        <div className="p-4 space-y-3">
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            {regularItems.length} item{regularItems.length !== 1 ? 's' : ''} found.
            {selectedCount < regularItems.length && ` ${selectedCount} selected.`}
            {' '}Edit, recategorize, or deselect before saving.
          </p>

          {/* Needs Clarification section */}
          {unclearItems.length > 0 && (
            <div className="rounded-lg p-3 space-y-2" style={{ backgroundColor: 'color-mix(in srgb, var(--color-accent, #D6A461) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--color-accent, #D6A461) 30%, transparent)' }}>
              <p className="text-xs font-semibold" style={{ color: 'var(--color-accent, #D6A461)' }}>
                Needs Clarification ({unclearItems.length})
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                AI wasn't sure about these. Is each one a store, an item, or should it be skipped?
              </p>
              {unclearItems.map(({ item, index }) => (
                <div key={index} className="flex items-center gap-2 py-1">
                  <span className="text-sm font-medium flex-1 min-w-0" style={{ color: 'var(--color-text-primary)' }}>
                    "{item.text}"
                  </span>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => handleResolveUnclear(index, 'store')}
                      className="px-2 py-0.5 rounded text-[10px] font-medium"
                      style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)', minHeight: 'unset' }}
                    >
                      Store
                    </button>
                    <button
                      onClick={() => handleResolveUnclear(index, 'item')}
                      className="px-2 py-0.5 rounded text-[10px] font-medium"
                      style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)', minHeight: 'unset' }}
                    >
                      Item
                    </button>
                    <button
                      onClick={() => handleResolveUnclear(index, 'skip')}
                      className="px-2 py-0.5 rounded text-[10px] font-medium"
                      style={{ color: 'var(--color-text-secondary)', minHeight: 'unset' }}
                    >
                      Skip
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Regular items */}
          <div className="space-y-1 max-h-[400px] overflow-y-auto">
            {regularItems.map(({ item, index }) => (
              <div
                key={index}
                className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                style={{
                  backgroundColor: item.selected ? 'var(--color-bg-primary)' : 'transparent',
                  opacity: item.selected ? 1 : 0.5,
                  border: '1px solid var(--color-border)',
                }}
              >
                <button
                  onClick={() => handleToggleItem(index)}
                  className="shrink-0 w-5 h-5 rounded flex items-center justify-center"
                  style={{
                    backgroundColor: item.selected ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-secondary)',
                    color: 'var(--color-btn-primary-text)',
                    minHeight: 'unset',
                  }}
                >
                  {item.selected && <Check size={12} />}
                </button>

                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => handleEditText(index, e.target.value)}
                  className="flex-1 px-2 py-1 rounded text-sm bg-transparent"
                  style={{
                    color: 'var(--color-text-primary)',
                    border: 'none',
                    outline: 'none',
                    minHeight: 'unset',
                  }}
                />

                {categories && (
                  <select
                    value={item.category || ''}
                    onChange={(e) => handleEditCategory(index, e.target.value)}
                    className="text-xs px-1 py-0.5 rounded"
                    style={{
                      backgroundColor: 'var(--color-bg-secondary)',
                      color: 'var(--color-text-primary)',
                      border: '1px solid var(--color-border)',
                      minHeight: 'unset',
                    }}
                  >
                    <option value="">No section</option>
                    {Array.from(allCats.entries()).map(([val, label]) => (
                      <option key={val} value={val}>{label}</option>
                    ))}
                  </select>
                )}

                <button
                  onClick={() => handleRemoveItem(index)}
                  className="shrink-0 p-1 rounded hover:opacity-70"
                  style={{ color: 'var(--color-text-secondary)', minHeight: 'unset' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={selectedCount === 0 || saving}
              className="btn-primary flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
              style={{
                backgroundColor: 'var(--color-btn-primary-bg)',
                color: 'var(--color-btn-primary-text)',
                minHeight: 'unset',
              }}
            >
              {saving && <Loader size={14} className="animate-spin" />}
              {saving ? 'Saving...' : `Save Selected (${selectedCount})`}
            </button>
            <button
              onClick={() => { setStep('input'); setError(null) }}
              className="px-4 py-2 rounded-lg text-sm"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                color: 'var(--color-text-secondary)',
                minHeight: 'unset',
              }}
            >
              Back
            </button>
          </div>
        </div>
        )
      })()}
    </div>
  )
}
