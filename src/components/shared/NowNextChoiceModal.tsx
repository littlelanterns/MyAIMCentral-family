import { useState } from 'react'
import { Layers } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { Button } from '@/components/shared'

export type NowNextTiming = 'now' | 'next'

export interface NowNextChoiceModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  itemName: string
  affectedNames: string[]
  affectedCount: number
  defaultTiming: NowNextTiming
  nextCycleDate: string | null
  onConfirm: (timing: NowNextTiming) => void
  onCancel: () => void
}

function formatNameList(names: string[]): string {
  if (names.length === 0) return ''
  if (names.length === 1) return names[0]
  if (names.length === 2) return `${names[0]} and ${names[1]}`
  return `${names.slice(0, -1).join(', ')}, and ${names[names.length - 1]}`
}

export function NowNextChoiceModal({
  isOpen,
  onClose,
  title,
  itemName,
  affectedNames,
  affectedCount,
  defaultTiming,
  nextCycleDate,
  onConfirm,
  onCancel,
}: NowNextChoiceModalProps) {
  const [timing, setTiming] = useState<NowNextTiming>(defaultTiming)
  const nameList = formatNameList(affectedNames)

  const formattedNextDate = nextCycleDate
    ? new Date(nextCycleDate).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : null

  return (
    <ModalV2
      id="now-next-choice"
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="sm"
      title={title}
      subtitle={itemName}
      icon={Layers}
    >
      <div className="p-4 flex flex-col gap-4">
        <div
          className="text-sm"
          style={{ color: 'var(--color-text-primary)' }}
        >
          This will update {affectedCount} shared {affectedCount === 1 ? 'member' : 'members'}
          {nameList ? ': ' : '.'}
          {nameList && (
            <strong style={{ color: 'var(--color-text-heading)' }}>
              {nameList}
            </strong>
          )}
          {nameList && '.'}
        </div>

        <div>
          <p
            className="text-xs font-medium mb-2"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            When should this take effect?
          </p>
          <div
            className="flex rounded-lg overflow-hidden"
            style={{ border: '1px solid var(--color-border)' }}
          >
            <button
              type="button"
              onClick={() => setTiming('now')}
              className="flex-1 text-xs font-medium px-3 py-2"
              style={{
                background: timing === 'now' ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-card)',
                color: timing === 'now' ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Now
            </button>
            <button
              type="button"
              onClick={() => setTiming('next')}
              className="flex-1 text-xs font-medium px-3 py-2"
              style={{
                background: timing === 'next' ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-card)',
                color: timing === 'next' ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
                border: 'none',
                cursor: 'pointer',
                borderLeft: '1px solid var(--color-border)',
              }}
            >
              Next cycle
            </button>
          </div>
          <p
            className="text-xs mt-1.5"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {timing === 'now'
              ? 'Changes apply immediately.'
              : formattedNextDate
                ? `Changes take effect ${formattedNextDate}.`
                : 'Changes will be staged for manual apply.'}
          </p>
        </div>

        <div className="flex flex-col gap-2 pt-1">
          <Button variant="primary" onClick={() => onConfirm(timing)}>
            {timing === 'now'
              ? 'Update now'
              : formattedNextDate
                ? `Stage for ${formattedNextDate}`
                : 'Stage changes'}
          </Button>
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    </ModalV2>
  )
}
