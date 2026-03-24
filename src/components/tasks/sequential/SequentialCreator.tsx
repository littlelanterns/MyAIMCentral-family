/**
 * PRD-09A Screen 6: Sequential collection creation flow.
 * Manual input (type items per line), URL list, or Image/OCR (placeholder).
 */

import { useState } from 'react'
import { List, Link, Camera } from 'lucide-react'

interface SequentialCreatorProps {
  familyId: string
  onSave: (data: SequentialCreateData) => void
  onCancel: () => void
}

export interface SequentialCreateData {
  title: string
  items: string[]
  inputMethod: 'manual' | 'url' | 'image'
  lifeAreaTag?: string
  promotionTiming: 'immediate' | 'next_day' | 'manual'
  activeCount: number
}

export function SequentialCreator({ familyId, onSave, onCancel }: SequentialCreatorProps) {
  const [title, setTitle] = useState('')
  const [inputMethod, setInputMethod] = useState<'manual' | 'url' | 'image'>('manual')
  const [rawText, setRawText] = useState('')
  const [promotionTiming, setPromotionTiming] = useState<'immediate' | 'next_day' | 'manual'>('immediate')
  const [activeCount, setActiveCount] = useState(1)

  const items = rawText
    .split('\n')
    .map(l => l.trim())
    .filter(Boolean)

  function handleSave() {
    if (!title.trim() || items.length === 0) return
    onSave({
      title: title.trim(),
      items,
      inputMethod,
      promotionTiming,
      activeCount,
    })
  }

  return (
    <div className="flex flex-col gap-4 p-4">
      <h3 className="text-base font-semibold" style={{ color: 'var(--color-text-heading)' }}>
        New Sequential Collection
      </h3>

      {/* Title */}
      <div>
        <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          Collection Title
        </label>
        <input
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g., Saxon Math 5 — Chapters"
          className="w-full px-3 py-2 rounded-lg text-sm"
          style={{
            background: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
          }}
        />
      </div>

      {/* Input method */}
      <div>
        <label className="text-xs font-medium block mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          Input Method
        </label>
        <div className="flex gap-2">
          {([
            { key: 'manual' as const, label: 'Type Items', icon: List },
            { key: 'url' as const, label: 'URL List', icon: Link },
            { key: 'image' as const, label: 'Image/OCR', icon: Camera },
          ]).map(m => (
            <button
              key={m.key}
              onClick={() => setInputMethod(m.key)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: inputMethod === m.key
                  ? 'var(--color-btn-primary-bg)'
                  : 'var(--color-bg-secondary)',
                color: inputMethod === m.key
                  ? 'var(--color-btn-primary-text)'
                  : 'var(--color-text-primary)',
                border: `1px solid ${inputMethod === m.key ? 'transparent' : 'var(--color-border)'}`,
              }}
            >
              <m.icon size={14} />
              {m.label}
            </button>
          ))}
        </div>
      </div>

      {/* Items textarea */}
      {(inputMethod === 'manual' || inputMethod === 'url') && (
        <div>
          <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
            {inputMethod === 'manual' ? 'Items (one per line)' : 'URLs (one per line)'}
          </label>
          <textarea
            value={rawText}
            onChange={e => setRawText(e.target.value)}
            rows={8}
            placeholder={
              inputMethod === 'manual'
                ? 'Chapter 1 — Introduction\nChapter 2 — Place Value\nChapter 3 — Addition'
                : 'https://youtube.com/watch?v=...\nhttps://youtube.com/watch?v=...'
            }
            className="w-full px-3 py-2 rounded-lg text-sm resize-none"
            style={{
              background: 'var(--color-bg-secondary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border)',
            }}
          />
          {items.length > 0 && (
            <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
              {items.length} items detected
            </p>
          )}
        </div>
      )}

      {inputMethod === 'image' && (
        <div
          className="flex flex-col items-center gap-2 py-8 rounded-lg"
          style={{ background: 'var(--color-bg-secondary)', border: '2px dashed var(--color-border)' }}
        >
          <Camera size={24} style={{ color: 'var(--color-text-secondary)' }} />
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            Image/OCR parsing coming soon — use manual input for now
          </p>
        </div>
      )}

      {/* Promotion timing */}
      <div>
        <label className="text-xs font-medium block mb-2" style={{ color: 'var(--color-text-secondary)' }}>
          When next item activates
        </label>
        <div className="flex gap-2">
          {([
            { key: 'immediate' as const, label: 'Immediately' },
            { key: 'next_day' as const, label: 'Next day' },
            { key: 'manual' as const, label: 'Manual' },
          ]).map(t => (
            <button
              key={t.key}
              onClick={() => setPromotionTiming(t.key)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{
                background: promotionTiming === t.key
                  ? 'var(--color-btn-primary-bg)'
                  : 'var(--color-bg-secondary)',
                color: promotionTiming === t.key
                  ? 'var(--color-btn-primary-text)'
                  : 'var(--color-text-primary)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Active count */}
      <div>
        <label className="text-xs font-medium block mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          Active items at once
        </label>
        <input
          type="number"
          min={1}
          max={5}
          value={activeCount}
          onChange={e => setActiveCount(parseInt(e.target.value) || 1)}
          className="w-20 px-3 py-1.5 rounded-lg text-sm text-center"
          style={{
            background: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
          }}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          onClick={handleSave}
          disabled={!title.trim() || items.length === 0}
          className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
          style={{
            background: 'var(--color-btn-primary-bg)',
            color: 'var(--color-btn-primary-text)',
          }}
        >
          Create Collection ({items.length} items)
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl text-sm"
          style={{
            background: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
