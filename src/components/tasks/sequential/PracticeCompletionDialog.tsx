/**
 * PracticeCompletionDialog — Build J (PRD-09A/09B Linked Steps)
 *
 * Duration prompt shown when a child completes a practice session on an item
 * with track_duration=true. Presets: 15 / 30 / 45 / 60 minutes + custom.
 * Also used for "complete" mode items when track_duration=true on the source.
 *
 * Theme-tokened. No hardcoded colors. Lucide icons only.
 */

import { useState } from 'react'
import { Clock } from 'lucide-react'
import { ModalV2 } from '@/components/shared'
import { Button } from '@/components/shared'

interface PracticeCompletionDialogProps {
  isOpen: boolean
  onClose: () => void
  /** Called with the duration in minutes. Pass null if the user skips. */
  onConfirm: (durationMinutes: number | null) => void
  /** Display title of the item being practiced (for context) */
  itemTitle?: string
  /** Whether submission is pending (disables buttons) */
  pending?: boolean
}

const PRESET_MINUTES = [15, 30, 45, 60]

export function PracticeCompletionDialog({
  isOpen,
  onClose,
  onConfirm,
  itemTitle,
  pending = false,
}: PracticeCompletionDialogProps) {
  const [customMinutes, setCustomMinutes] = useState<string>('')
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null)

  function handleConfirm(minutes: number | null) {
    onConfirm(minutes)
    setCustomMinutes('')
    setSelectedPreset(null)
  }

  function handleCustom() {
    const n = parseInt(customMinutes, 10)
    if (Number.isFinite(n) && n > 0 && n < 600) {
      handleConfirm(n)
    }
  }

  return (
    <ModalV2
      id="practice-completion-dialog"
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      title="How long did that take?"
      size="sm"
    >
      <div className="flex flex-col gap-4 p-4">
        {itemTitle && (
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-lg"
            style={{
              background: 'var(--color-bg-secondary)',
              border: '1px solid var(--color-border)',
            }}
          >
            <Clock size={14} style={{ color: 'var(--color-btn-primary-bg)' }} />
            <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
              {itemTitle}
            </span>
          </div>
        )}

        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          Pick a preset or enter exactly how long you practiced.
        </p>

        {/* Preset buttons */}
        <div className="grid grid-cols-4 gap-2">
          {PRESET_MINUTES.map(mins => (
            <button
              key={mins}
              type="button"
              onClick={() => setSelectedPreset(mins)}
              className="px-3 py-3 rounded-lg text-sm font-medium transition-colors"
              style={{
                background: selectedPreset === mins
                  ? 'var(--color-btn-primary-bg)'
                  : 'var(--color-bg-secondary)',
                color: selectedPreset === mins
                  ? 'var(--color-btn-primary-text)'
                  : 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
              }}
            >
              {mins} min
            </button>
          ))}
        </div>

        {/* Custom input */}
        <div>
          <label
            className="text-xs font-medium block mb-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Or enter custom minutes
          </label>
          <div className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={599}
              value={customMinutes}
              onChange={e => {
                setCustomMinutes(e.target.value)
                setSelectedPreset(null)
              }}
              placeholder="e.g. 20"
              className="w-24 px-3 py-2 rounded-lg text-sm text-center"
              style={{
                background: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
                border: '1px solid var(--color-border)',
              }}
            />
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              minutes
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              if (customMinutes) {
                handleCustom()
              } else if (selectedPreset != null) {
                handleConfirm(selectedPreset)
              }
            }}
            disabled={
              pending ||
              (selectedPreset == null && (!customMinutes || parseInt(customMinutes, 10) <= 0))
            }
            className="flex-1"
          >
            Log practice
          </Button>
          <Button
            variant="secondary"
            size="md"
            onClick={() => handleConfirm(null)}
            disabled={pending}
          >
            Skip
          </Button>
        </div>
      </div>
    </ModalV2>
  )
}
