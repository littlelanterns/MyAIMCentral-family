import { useState } from 'react'
import { Shuffle, List } from 'lucide-react'

export type ActivityAccessMode = 'random' | 'browse'

interface DualModeListAccessProps {
  defaultMode?: ActivityAccessMode
  onModeChange?: (mode: ActivityAccessMode) => void
  className?: string
}

export function DualModeListAccess({
  defaultMode = 'random',
  onModeChange,
  className = '',
}: DualModeListAccessProps) {
  const [mode, setMode] = useState<ActivityAccessMode>(defaultMode)

  function handleChange(newMode: ActivityAccessMode) {
    setMode(newMode)
    onModeChange?.(newMode)
  }

  return (
    <div
      className={`inline-flex rounded-full border overflow-hidden ${className}`}
      style={{ borderColor: 'var(--color-border)' }}
    >
      <button
        type="button"
        onClick={() => handleChange('random')}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
        style={{
          backgroundColor: mode === 'random' ? 'var(--color-btn-primary-bg)' : 'transparent',
          color: mode === 'random' ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
        }}
      >
        <Shuffle size={13} />
        Surprise me
      </button>
      <button
        type="button"
        onClick={() => handleChange('browse')}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors"
        style={{
          backgroundColor: mode === 'browse' ? 'var(--color-btn-primary-bg)' : 'transparent',
          color: mode === 'browse' ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
        }}
      >
        <List size={13} />
        Let me pick
      </button>
    </div>
  )
}
