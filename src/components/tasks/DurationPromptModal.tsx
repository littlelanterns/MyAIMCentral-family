import { useState } from 'react'
import { Clock } from 'lucide-react'
import { ModalV2, Button } from '@/components/shared'

const DURATION_CHIPS = [5, 10, 15, 30, 45, 60] as const

interface DurationPromptModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (durationMinutes: number | null) => void
  taskTitle?: string
}

export function DurationPromptModal({
  isOpen,
  onClose,
  onSubmit,
  taskTitle,
}: DurationPromptModalProps) {
  const [customValue, setCustomValue] = useState('')
  const [unit, setUnit] = useState<'min' | 'hr'>('min')

  function handleChipTap(minutes: number) {
    onSubmit(minutes)
    resetState()
  }

  function handleCustomSubmit() {
    const parsed = parseFloat(customValue)
    if (!isNaN(parsed) && parsed > 0) {
      const minutes = unit === 'hr' ? Math.round(parsed * 60) : Math.round(parsed)
      onSubmit(minutes)
      resetState()
    }
  }

  function handleSkip() {
    onSubmit(null)
    resetState()
  }

  function handleClose() {
    resetState()
    onClose()
  }

  function resetState() {
    setCustomValue('')
    setUnit('min')
  }

  return (
    <ModalV2
      id="duration-prompt"
      isOpen={isOpen}
      onClose={handleClose}
      type="transient"
      size="sm"
      title="How long did you work on this?"
      subtitle={taskTitle}
      icon={Clock}
    >
      <div className="flex flex-col gap-4 p-4">
        {/* Duration chips */}
        <div className="grid grid-cols-3 gap-2">
          {DURATION_CHIPS.map((minutes) => (
            <button
              key={minutes}
              type="button"
              onClick={() => handleChipTap(minutes)}
              className="rounded-lg px-3 py-3 text-sm font-medium transition-colors"
              style={{
                background: 'var(--color-surface-secondary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border-default)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--color-surface-primary)'
                e.currentTarget.style.borderColor = 'var(--color-accent)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'var(--color-surface-secondary)'
                e.currentTarget.style.borderColor = 'var(--color-border-default)'
              }}
            >
              {minutes < 60 ? `${minutes} min` : '1 hour'}
            </button>
          ))}
        </div>

        {/* Custom input with unit toggle */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="0.1"
            step="any"
            placeholder={unit === 'hr' ? 'Hours' : 'Minutes'}
            value={customValue}
            onChange={(e) => setCustomValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleCustomSubmit()
            }}
            className="flex-1 rounded-lg px-3 py-2 text-sm"
            style={{
              background: 'var(--color-surface-secondary)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border-default)',
            }}
          />
          <div
            className="flex rounded-lg overflow-hidden"
            style={{ border: '1px solid var(--color-border-default)' }}
          >
            <button
              type="button"
              onClick={() => setUnit('min')}
              className="px-2.5 py-2 text-xs font-medium transition-colors"
              style={{
                background: unit === 'min' ? 'var(--color-btn-primary-bg)' : 'var(--color-surface-secondary)',
                color: unit === 'min' ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
              }}
            >
              min
            </button>
            <button
              type="button"
              onClick={() => setUnit('hr')}
              className="px-2.5 py-2 text-xs font-medium transition-colors"
              style={{
                background: unit === 'hr' ? 'var(--color-btn-primary-bg)' : 'var(--color-surface-secondary)',
                color: unit === 'hr' ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
              }}
            >
              hr
            </button>
          </div>
          <Button
            variant="primary"
            onClick={handleCustomSubmit}
            disabled={!customValue || parseFloat(customValue) <= 0}
            size="sm"
          >
            Log
          </Button>
        </div>

        {/* Skip */}
        <button
          type="button"
          onClick={handleSkip}
          className="text-sm py-2 transition-colors"
          style={{ color: 'var(--color-text-tertiary)' }}
        >
          Skip — just log the session
        </button>
      </div>
    </ModalV2>
  )
}
