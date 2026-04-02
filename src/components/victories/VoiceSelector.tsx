// PRD-11 Phase 12C: Voice personality picker for celebrations
// Grid of available voices with labels, sample lines, and preview

import { Check } from 'lucide-react'
import { VOICE_PERSONALITIES } from '@/types/victories'
import type { VoicePersonality } from '@/types/victories'

interface VoiceSelectorProps {
  selectedVoice: VoicePersonality
  onSelect: (voice: VoicePersonality) => void
  isSaving?: boolean
}

const voiceKeys = Object.keys(VOICE_PERSONALITIES) as VoicePersonality[]
const essentialVoices = voiceKeys.filter(k => VOICE_PERSONALITIES[k].tier === 'essential')
const fullMagicVoices = voiceKeys.filter(k => VOICE_PERSONALITIES[k].tier === 'full_magic')

export function VoiceSelector({ selectedVoice, onSelect, isSaving }: VoiceSelectorProps) {
  return (
    <div className="space-y-4">
      <VoiceGroup title="Standard Voices" voices={essentialVoices} selectedVoice={selectedVoice} onSelect={onSelect} isSaving={isSaving} />
      <VoiceGroup title="Character Voices" voices={fullMagicVoices} selectedVoice={selectedVoice} onSelect={onSelect} isSaving={isSaving} tierBadge />
    </div>
  )
}

function VoiceGroup({
  title,
  voices,
  selectedVoice,
  onSelect,
  isSaving,
  tierBadge,
}: {
  title: string
  voices: VoicePersonality[]
  selectedVoice: VoicePersonality
  onSelect: (v: VoicePersonality) => void
  isSaving?: boolean
  tierBadge?: boolean
}) {
  return (
    <div>
      <h4
        className="text-sm font-medium mb-2"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        {title}
        {tierBadge && (
          <span
            className="ml-2 text-xs px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)',
              color: 'var(--color-btn-primary-bg)',
            }}
          >
            Full Magic
          </span>
        )}
      </h4>
      <div className="grid grid-cols-1 gap-2">
        {voices.map(key => {
          const voice = VOICE_PERSONALITIES[key]
          const isSelected = selectedVoice === key
          return (
            <button
              key={key}
              disabled={isSaving}
              onClick={() => onSelect(key)}
              className="text-left rounded-lg p-3 transition-all"
              style={{
                backgroundColor: isSelected
                  ? 'color-mix(in srgb, var(--color-sparkle-gold, #D4AF37) 15%, var(--color-bg-card))'
                  : 'var(--color-bg-secondary)',
                border: isSelected
                  ? '2px solid var(--color-sparkle-gold, #D4AF37)'
                  : '2px solid transparent',
              }}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="font-medium text-sm" style={{ color: 'var(--color-text-primary)' }}>
                  {voice.label}
                </span>
                {isSelected && (
                  <Check size={16} style={{ color: 'var(--color-sparkle-gold, #D4AF37)' }} />
                )}
              </div>
              <p className="text-xs mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                {voice.description}
              </p>
              <p
                className="text-xs italic"
                style={{ color: 'var(--color-text-tertiary, var(--color-text-secondary))' }}
              >
                "{voice.sampleLine}"
              </p>
            </button>
          )
        })}
      </div>
    </div>
  )
}
