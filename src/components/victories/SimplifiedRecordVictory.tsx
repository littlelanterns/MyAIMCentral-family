// PRD-11 Phase 12C: Simplified victory recording for kids (Guided/Play)
// Description + category quick-select only — no importance/bulk/GS-BI

import { useState, useCallback } from 'react'
import { X, Check } from 'lucide-react'
import { VoiceInputButton } from '@/components/shared/VoiceInputButton'
import { VICTORY_CATEGORIES } from '@/types/victories'
import type { VictorySource } from '@/types/victories'

interface SimplifiedRecordVictoryProps {
  shell: 'guided' | 'play'
  familyId: string
  memberId: string
  onSave: (data: { description: string; lifeAreaTag: string | null; source: VictorySource }) => void
  onClose: () => void
}

export function SimplifiedRecordVictory({
  shell,
  familyId: _familyId,
  memberId: _memberId,
  onSave,
  onClose,
}: SimplifiedRecordVictoryProps) {
  const [description, setDescription] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const isPlay = shell === 'play'
  const minTouchTarget = isPlay ? 56 : 48

  const handleVoiceTranscript = useCallback((text: string) => {
    setDescription(prev => prev ? prev + ' ' + text : text)
  }, [])

  function handleSave() {
    if (!description.trim()) return
    onSave({
      description: description.trim(),
      lifeAreaTag: selectedTag,
      source: 'manual',
    })
  }

  return (
    <div
      className="rounded-2xl p-4 space-y-4"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '2px solid color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 40%, transparent)',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3
          className={isPlay ? 'text-xl font-bold' : 'text-lg font-semibold'}
          style={{ color: 'var(--color-text-heading)' }}
        >
          {isPlay ? 'I Did Something Great!' : 'Record a Victory'}
        </h3>
        <button
          onClick={onClose}
          className="p-1 rounded-full"
          style={{
            color: 'var(--color-text-secondary)',
            minHeight: minTouchTarget,
            minWidth: minTouchTarget,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <X size={isPlay ? 24 : 20} />
        </button>
      </div>

      {/* Description input */}
      <div className="space-y-2">
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder={isPlay ? 'What did you do?' : 'What did you accomplish?'}
          rows={isPlay ? 3 : 2}
          className={`w-full rounded-xl px-4 py-3 resize-none ${isPlay ? 'text-lg' : 'text-base'}`}
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
            minHeight: isPlay ? 100 : 72,
          }}
        />
        <VoiceInputButton
          onTranscript={handleVoiceTranscript}
          size={isPlay ? 22 : 16}
          label={isPlay ? 'Say It!' : 'Dictate'}
          minHeight={minTouchTarget}
          buttonClassName={`rounded-xl border border-[var(--color-border)] ${isPlay ? 'px-4 py-3 text-base' : 'px-3 py-2 text-sm'}`}
        />
      </div>

      {/* Category quick-select */}
      <div className="flex flex-wrap gap-2">
        {VICTORY_CATEGORIES.filter(c => c.key !== 'custom').map(cat => {
          const isSelected = selectedTag === cat.tag
          return (
            <button
              key={cat.key}
              onClick={() => setSelectedTag(isSelected ? null : cat.tag)}
              className={`rounded-full px-3 font-medium transition-all ${isPlay ? 'text-sm py-2' : 'text-xs py-1.5'}`}
              style={{
                minHeight: minTouchTarget,
                backgroundColor: isSelected
                  ? 'color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 20%, var(--color-bg-card))'
                  : 'var(--color-bg-secondary)',
                color: isSelected ? 'var(--color-sparkle-gold-dark, #B8942A)' : 'var(--color-text-secondary)',
                border: isSelected
                  ? '1.5px solid var(--color-sparkle-gold, #D4AF37)'
                  : '1.5px solid var(--color-border)',
              }}
            >
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Save button */}
      <button
        onClick={handleSave}
        disabled={!description.trim()}
        className={`w-full rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${isPlay ? 'text-lg py-4' : 'text-base py-3'}`}
        style={{
          minHeight: minTouchTarget,
          backgroundColor: description.trim()
            ? 'var(--color-sparkle-gold, #D4AF37)'
            : 'var(--color-bg-secondary)',
          color: description.trim() ? 'white' : 'var(--color-text-secondary)',
          opacity: description.trim() ? 1 : 0.6,
        }}
      >
        <Check size={isPlay ? 24 : 20} />
        {isPlay ? 'Save!' : 'Save Victory'}
      </button>
    </div>
  )
}
