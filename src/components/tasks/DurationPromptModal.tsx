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
  const [customMinutes, setCustomMinutes] = useState('')

  function handleChipTap(minutes: number) {
    onSubmit(minutes)
    setCustomMinutes('')
  }

  function handleCustomSubmit() {
    const parsed = parseInt(customMinutes, 10)
    if (!isNaN(parsed) && parsed > 0) {
      onSubmit(parsed)
      setCustomMinutes('')
    }
  }

  function handleSkip() {
    onSubmit(null)
    setCustomMinutes('')
  }

  function handleClose() {
    setCustomMinutes('')
    onClose()
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

        {/* Custom input */}
        <div className="flex items-center gap-2">
          <input
            type="number"
            min="1"
            placeholder="Custom minutes"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(e.target.value)}
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
          <Button
            variant="primary"
            onClick={handleCustomSubmit}
            disabled={!customMinutes || parseInt(customMinutes, 10) <= 0}
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
