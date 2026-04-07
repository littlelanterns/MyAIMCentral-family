/**
 * PRD-18: RhythmModal
 *
 * Single modal component used for both Morning Rhythm and Evening Rhythm
 * (and future custom rhythms). The rhythm config drives which sections
 * render via SectionRendererSwitch.
 *
 * Behavior:
 *   - Auto-opens once per period via the dashboard mount logic (see
 *     RhythmDashboardCard) — this component just renders when isOpen.
 *   - Non-blocking: tap outside or X button → dismissNoAction (collapses
 *     to dashboard card without writing a completion record).
 *   - [Start/Close My Day] writes a 'completed' completion record.
 *   - [Snooze ▾] writes 'snoozed' status with snoozed_until timestamp.
 *   - [Dismiss for today] writes 'dismissed' status.
 *
 * Section sequence comes from rhythm_configs.sections (ordered JSONB).
 * Evening rhythm has section_order_locked=true so the order is fixed.
 */

import { useState, useRef, useEffect } from 'react'
import { Sun, Moon, X, ChevronDown } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { SectionRendererSwitch } from './sections/SectionRendererSwitch'
import {
  useCompleteRhythm,
  useSnoozeRhythm,
  useDismissRhythm,
} from '@/hooks/useRhythms'
import type { RhythmConfig, RhythmSection } from '@/types/rhythms'

interface Props {
  config: RhythmConfig
  familyId: string
  memberId: string
  isOpen: boolean
  onClose: () => void
  /** Reading Support flag (Guided shell preference). Forwarded to sections. */
  readingSupport?: boolean
}

export function RhythmModal({ config, familyId, memberId, isOpen, onClose, readingSupport }: Props) {
  const isMorning = config.rhythm_key === 'morning'
  const completeRhythm = useCompleteRhythm()
  const snoozeRhythm = useSnoozeRhythm()
  const dismissRhythm = useDismissRhythm()
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false)
  const snoozeMenuRef = useRef<HTMLDivElement>(null)

  // Close snooze dropdown on outside click
  useEffect(() => {
    if (!showSnoozeMenu) return
    function handler(e: MouseEvent) {
      if (snoozeMenuRef.current && !snoozeMenuRef.current.contains(e.target as Node)) {
        setShowSnoozeMenu(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showSnoozeMenu])

  // Sort sections by order, filter to enabled
  const orderedSections: RhythmSection[] = [...config.sections]
    .sort((a, b) => a.order - b.order)
    .filter(s => s.enabled)

  const handleComplete = async () => {
    await completeRhythm.mutateAsync({
      familyId,
      memberId,
      rhythmKey: config.rhythm_key,
      // Phase A: empty metadata. Phase B/C populates priority_items + mindsweep_items.
      metadata: {},
    })
    onClose()
  }

  const handleSnooze = async (minutes: number) => {
    await snoozeRhythm.mutateAsync({
      familyId,
      memberId,
      rhythmKey: config.rhythm_key,
      snoozeMinutes: minutes,
    })
    setShowSnoozeMenu(false)
    onClose()
  }

  const handleDismissForToday = async () => {
    await dismissRhythm.mutateAsync({
      familyId,
      memberId,
      rhythmKey: config.rhythm_key,
    })
    setShowSnoozeMenu(false)
    onClose()
  }

  const HeaderIcon = isMorning ? Sun : Moon
  const actionLabel = isMorning ? 'Start My Day' : 'Close My Day'

  return (
    <ModalV2
      id={`rhythm-${config.rhythm_key}`}
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="lg"
      title={config.display_name}
      icon={HeaderIcon}
      footer={
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="text-sm rounded-md px-3 py-2 transition-colors"
            style={{
              color: 'var(--color-text-secondary)',
              backgroundColor: 'transparent',
            }}
          >
            <X size={16} className="inline mr-1" />
            Close
          </button>

          <div className="flex items-center gap-2 relative">
            <div ref={snoozeMenuRef} className="relative">
              <button
                type="button"
                onClick={() => setShowSnoozeMenu(v => !v)}
                className="text-sm rounded-md px-3 py-2 inline-flex items-center gap-1 transition-colors"
                style={{
                  color: 'var(--color-text-secondary)',
                  backgroundColor: 'var(--color-bg-secondary)',
                }}
              >
                Snooze
                <ChevronDown size={14} />
              </button>
              {showSnoozeMenu && (
                <div
                  className="absolute bottom-full right-0 mb-2 rounded-lg shadow-lg overflow-hidden min-w-44 z-50"
                  style={{
                    backgroundColor: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border-default)',
                  }}
                >
                  <SnoozeMenuItem onClick={() => handleSnooze(30)}>
                    Remind me in 30 min
                  </SnoozeMenuItem>
                  <SnoozeMenuItem onClick={() => handleSnooze(60)}>
                    Remind me in 1 hour
                  </SnoozeMenuItem>
                  <SnoozeMenuItem onClick={handleDismissForToday}>
                    Dismiss for today
                  </SnoozeMenuItem>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleComplete}
              disabled={completeRhythm.isPending}
              className="text-sm font-semibold rounded-md px-4 py-2 disabled:opacity-50"
              style={{
                background: 'var(--surface-primary, var(--color-btn-primary-bg))',
                color: 'var(--color-btn-primary-text)',
              }}
            >
              {completeRhythm.isPending ? 'Saving…' : actionLabel}
            </button>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {orderedSections.map(section => (
          <SectionRendererSwitch
            key={section.section_type}
            section={section}
            rhythmKey={config.rhythm_key}
            familyId={familyId}
            memberId={memberId}
            reflectionCount={config.reflection_guideline_count}
            readingSupport={readingSupport}
          />
        ))}
      </div>
    </ModalV2>
  )
}

function SnoozeMenuItem({
  onClick,
  children,
}: {
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left text-sm px-3 py-2 transition-colors hover:bg-opacity-50"
      style={{
        color: 'var(--color-text-primary)',
      }}
    >
      {children}
    </button>
  )
}
