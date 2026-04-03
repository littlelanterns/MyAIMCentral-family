/**
 * BulkAddWithFrequency — Enhanced bulk add for Randomizer lists
 *
 * Extends the standard AI parsing with per-item frequency suggestions.
 * AI suggests how often each item should surface (daily/weekly/monthly caps,
 * cooldowns, reward amounts). Mom can accept, edit, or clear suggestions
 * before saving.
 *
 * Spec: specs/smart-lists-reveal-mechanics-spec.md Part 4
 */

import { useState, useCallback } from 'react'
import { X, Trash2, Check, Loader, Sparkles, ChevronDown, ChevronUp, Mic, MicOff } from 'lucide-react'
import { sendAIMessage, extractJSON } from '@/lib/ai/send-ai-message'
import { useVoiceInput, formatDuration } from '@/hooks/useVoiceInput'
import { FrequencyRulesEditor, type FrequencyRules } from './FrequencyRulesEditor'
import type { FrequencyPeriod } from '@/types/lists'

interface ParsedFrequencyItem {
  text: string
  category: string | null
  selected: boolean
  frequency: FrequencyRules
}

interface BulkAddWithFrequencyProps {
  listId: string
  listTitle: string
  existingItemCount: number
  onSave: (items: { text: string; category: string | null; frequency: FrequencyRules }[]) => Promise<void>
  onClose: () => void
}

const FREQUENCY_PARSE_PROMPT = `You are parsing a list of household tasks/activities for a family chore/activity randomizer pool.
For each item, return a JSON object with:
- "text": the cleaned-up task/activity name
- "category": suggested category if apparent ("quick", "medium", "big", "connection") or null
- "frequency_min": suggested minimum times per period (integer or null). E.g., "clean up toys" → 3
- "frequency_max": suggested maximum times per period (integer or null). E.g., "wash windows" → 1
- "frequency_period": "day", "week", or "month" (or null if unlimited)
- "cooldown_hours": hours between completions (integer or null)
- "reward_amount": dollar amount if mentioned in the text (number or null). Extract from patterns like "$5", "5 dollars", etc.

Base suggestions on common household patterns:
- Window washing → max 1/month
- Wiping table → at least 1/day
- Cleaning up toys → at least 3/week
- Yard work → max 1/week
- Items with dollar amounts are paid chores — extract the amount

Return ONLY a JSON array. No markdown, no preamble.`

export function BulkAddWithFrequency({
  listId: _listId,
  listTitle,
  existingItemCount: _existingItemCount,
  onSave,
  onClose,
}: BulkAddWithFrequencyProps) {
  const [inputText, setInputText] = useState('')
  const [parsedItems, setParsedItems] = useState<ParsedFrequencyItem[]>([])
  const [parsing, setParsing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [step, setStep] = useState<'input' | 'preview'>('input')
  const [error, setError] = useState<string | null>(null)
  const voice = useVoiceInput()

  const handleVoiceToggle = useCallback(async () => {
    if (voice.state === 'recording') {
      const text = await voice.stopRecording()
      if (text) {
        setInputText(prev => prev ? prev + '\n' + text : text)
      }
    } else if (voice.state === 'idle') {
      await voice.startRecording()
    }
  }, [voice])

  const handleParse = useCallback(async () => {
    const trimmed = inputText.trim()
    if (!trimmed) return

    setParsing(true)
    setError(null)

    try {
      const response = await sendAIMessage(
        FREQUENCY_PARSE_PROMPT,
        [{ role: 'user', content: trimmed }],
        4096,
        'haiku',
      )

      const parsed = extractJSON<unknown[]>(response)

      if (parsed && Array.isArray(parsed)) {
        const items: ParsedFrequencyItem[] = parsed
          .map((raw): ParsedFrequencyItem | null => {
            if (!raw || typeof raw !== 'object') return null
            const obj = raw as Record<string, unknown>
            const text = typeof obj.text === 'string' ? obj.text.trim() : ''
            if (!text) return null

            return {
              text,
              category: typeof obj.category === 'string' ? obj.category : null,
              selected: true,
              frequency: {
                frequency_min: typeof obj.frequency_min === 'number' ? obj.frequency_min : null,
                frequency_max: typeof obj.frequency_max === 'number' ? obj.frequency_max : null,
                frequency_period: (['day', 'week', 'month'].includes(obj.frequency_period as string)
                  ? obj.frequency_period as FrequencyPeriod
                  : null),
                cooldown_hours: typeof obj.cooldown_hours === 'number' ? obj.cooldown_hours : null,
                lifetime_max: null,
                reward_amount: typeof obj.reward_amount === 'number' ? obj.reward_amount : null,
              },
            }
          })
          .filter((item): item is ParsedFrequencyItem => item !== null)

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
  }, [inputText])

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

  const handleUpdateFrequency = useCallback((index: number, freq: FrequencyRules) => {
    setParsedItems(prev => prev.map((item, i) =>
      i === index ? { ...item, frequency: freq } : item
    ))
  }, [])

  const handleClearFrequency = useCallback((index: number) => {
    setParsedItems(prev => prev.map((item, i) =>
      i === index ? {
        ...item,
        frequency: {
          frequency_min: null, frequency_max: null, frequency_period: null,
          cooldown_hours: null, lifetime_max: null, reward_amount: null,
        },
      } : item
    ))
  }, [])

  const handleRemoveItem = useCallback((index: number) => {
    setParsedItems(prev => prev.filter((_, i) => i !== index))
  }, [])

  const handleAcceptAll = useCallback(() => {
    // Already accepted — this is a no-op but provides UX clarity
  }, [])

  const handleClearAll = useCallback(() => {
    setParsedItems(prev => prev.map(item => ({
      ...item,
      frequency: {
        frequency_min: null, frequency_max: null, frequency_period: null,
        cooldown_hours: null, lifetime_max: null, reward_amount: null,
      },
    })))
  }, [])

  const handleSave = useCallback(async () => {
    const selected = parsedItems
      .filter(item => item.selected && item.text.trim().length > 0)
      .map(item => ({
        text: item.text,
        category: item.category,
        frequency: item.frequency,
      }))

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
        <div className="flex items-center gap-2">
          <Sparkles size={16} style={{ color: 'var(--color-btn-primary-bg)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
            Bulk Add — {listTitle}
          </h3>
        </div>
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
            Paste chores, activities, or reward ideas. Include dollar amounts for paid chores.
            AI will suggest frequency rules for each item.
          </p>

          <div className="relative">
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={'wash the windows\norganize the fridge\nclean up the toys\nwipe down the kitchen table\nclean out the van - $5\nmow the front yard - $10'}
              rows={8}
              className="w-full px-3 py-2 rounded-lg text-sm resize-y"
              style={{
                backgroundColor: 'var(--color-bg-primary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
                minHeight: 'unset',
              }}
              autoFocus
            />
            {voice.state === 'recording' && voice.interimText && (
              <p className="text-xs italic px-3 pt-1" style={{ color: 'var(--color-text-tertiary)' }}>
                {voice.interimText}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            {voice.isSupported && (
              <button
                type="button"
                onClick={handleVoiceToggle}
                disabled={voice.state === 'transcribing' || parsing}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                style={{
                  backgroundColor: voice.state === 'recording'
                    ? 'color-mix(in srgb, var(--color-error, #c44) 15%, transparent)'
                    : 'var(--color-bg-secondary)',
                  color: voice.state === 'recording'
                    ? 'var(--color-error, #c44)'
                    : 'var(--color-text-secondary)',
                  minHeight: 'unset',
                }}
              >
                {voice.state === 'recording' ? <MicOff size={14} /> : <Mic size={14} />}
                {voice.state === 'recording'
                  ? formatDuration(voice.duration)
                  : voice.state === 'transcribing'
                    ? 'Transcribing...'
                    : 'Dictate'}
              </button>
            )}
            <button
              onClick={handleParse}
              disabled={!inputText.trim() || parsing}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
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

      {/* Step 2: Preview with frequency suggestions */}
      {step === 'preview' && (
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {parsedItems.length} item{parsedItems.length !== 1 ? 's' : ''} found.
              {selectedCount < parsedItems.length && ` ${selectedCount} selected.`}
            </p>
            <div className="flex gap-2">
              <button
                onClick={handleAcceptAll}
                className="text-xs px-2 py-1 rounded"
                style={{
                  backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, transparent)',
                  color: 'var(--color-btn-primary-bg)',
                  minHeight: 'unset',
                }}
              >
                Accept All
              </button>
              <button
                onClick={handleClearAll}
                className="text-xs px-2 py-1 rounded"
                style={{
                  backgroundColor: 'var(--color-bg-secondary)',
                  color: 'var(--color-text-secondary)',
                  minHeight: 'unset',
                }}
              >
                Clear All Rules
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {parsedItems.map((item, index) => (
              <FrequencyItemRow
                key={index}
                item={item}
                index={index}
                onToggle={handleToggleItem}
                onEditText={handleEditText}
                onUpdateFrequency={handleUpdateFrequency}
                onClearFrequency={handleClearFrequency}
                onRemove={handleRemoveItem}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={selectedCount === 0 || saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
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
      )}
    </div>
  )
}

// ─── Per-item row with frequency suggestion ──────────────

function FrequencyItemRow({
  item,
  index,
  onToggle,
  onEditText,
  onUpdateFrequency,
  onClearFrequency,
  onRemove,
}: {
  item: ParsedFrequencyItem
  index: number
  onToggle: (index: number) => void
  onEditText: (index: number, text: string) => void
  onUpdateFrequency: (index: number, freq: FrequencyRules) => void
  onClearFrequency: (index: number) => void
  onRemove: (index: number) => void
}) {
  const [expanded, setExpanded] = useState(false)
  const hasFrequency = item.frequency.frequency_min != null
    || item.frequency.frequency_max != null
    || item.frequency.cooldown_hours != null
    || item.frequency.reward_amount != null

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        backgroundColor: item.selected ? 'var(--color-bg-primary)' : 'transparent',
        opacity: item.selected ? 1 : 0.5,
        border: '1px solid var(--color-border)',
      }}
    >
      {/* Main row */}
      <div className="flex items-center gap-2 px-3 py-2">
        <button
          onClick={() => onToggle(index)}
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
          onChange={(e) => onEditText(index, e.target.value)}
          className="flex-1 px-2 py-1 rounded text-sm bg-transparent"
          style={{
            color: 'var(--color-text-primary)',
            border: 'none',
            outline: 'none',
            minHeight: 'unset',
          }}
        />

        {item.category && (
          <span
            className="text-[10px] px-1.5 py-0.5 rounded-full capitalize"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, transparent)',
              color: 'var(--color-btn-primary-bg)',
            }}
          >
            {item.category}
          </span>
        )}

        {item.frequency.reward_amount != null && (
          <span className="text-xs font-medium" style={{ color: 'var(--color-btn-primary-bg)' }}>
            ${item.frequency.reward_amount}
          </span>
        )}

        {/* Frequency summary */}
        {hasFrequency && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-0.5 text-[11px] px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, transparent)',
              color: 'var(--color-btn-primary-bg)',
              minHeight: 'unset',
              cursor: 'pointer',
            }}
          >
            {expanded ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
            Edit
          </button>
        )}

        {!hasFrequency && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-[11px] px-1.5 py-0.5 rounded"
            style={{
              color: 'var(--color-text-secondary)',
              minHeight: 'unset',
              cursor: 'pointer',
            }}
          >
            + rules
          </button>
        )}

        <button
          onClick={() => onClearFrequency(index)}
          className="text-[10px] px-1 rounded"
          style={{ color: 'var(--color-text-secondary)', minHeight: 'unset', cursor: 'pointer' }}
          title="Clear frequency rules"
        >
          Clear
        </button>

        <button
          onClick={() => onRemove(index)}
          className="shrink-0 p-1 rounded hover:opacity-70"
          style={{ color: 'var(--color-text-secondary)', minHeight: 'unset' }}
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Expanded frequency editor */}
      {expanded && (
        <div className="px-3 pb-3">
          <FrequencyRulesEditor
            value={item.frequency}
            onChange={(freq) => onUpdateFrequency(index, freq)}
            compact={false}
          />
        </div>
      )}
    </div>
  )
}
