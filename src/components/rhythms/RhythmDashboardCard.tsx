/**
 * PRD-18: RhythmDashboardCard
 *
 * Compact card rendered in the Dashboard section list for a single
 * rhythm (morning or evening). Three visual states:
 *   - pending  → breathing glow + "Ready when you are" + tap opens modal
 *   - completed → subtle checkmark + completion time + tap re-opens modal read-only
 *   - snoozed  → "Snoozed until [time]" + no glow + tap opens modal immediately
 *
 * Auto-open logic: if this card detects that its rhythm is currently
 * inside its time window AND has no completion record for the period
 * AND auto_open=true AND we haven't already auto-opened today (tracked
 * in sessionStorage), the modal opens once on mount.
 *
 * sessionStorage flag: `rhythm-autoopened-{member}-{rhythm}-{period}`
 * — survives refreshes, scoped per browser session per member per
 * period. After dismiss the user can re-open by tapping the card.
 */

import { useState, useEffect } from 'react'
import { Sun, Moon, Check, Clock } from 'lucide-react'
import { BreathingGlow } from '@/components/ui/BreathingGlow'
import { RhythmModal } from './RhythmModal'
import { useRhythmConfig, useRhythmCompletion } from '@/hooks/useRhythms'
import { useFamilyMembers } from '@/hooks/useFamilyMember'
import {
  isRhythmActive,
  periodForRhythm,
  type RhythmAudience,
  type RhythmKey,
} from '@/types/rhythms'

interface Props {
  familyId: string
  memberId: string
  rhythmKey: RhythmKey
  /** Reading Support flag — used by Guided shell sections that read prompts aloud. */
  readingSupport?: boolean
}

function autoOpenSessionKey(memberId: string, rhythmKey: string, period: string) {
  return `rhythm-autoopened-${memberId}-${rhythmKey}-${period}`
}

function formatTime(iso: string): string {
  const d = new Date(iso)
  const h = d.getHours()
  const m = String(d.getMinutes()).padStart(2, '0')
  const period = h >= 12 ? 'PM' : 'AM'
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${display}:${m} ${period}`
}

export function RhythmDashboardCard({ familyId, memberId, rhythmKey, readingSupport }: Props) {
  const { data: config } = useRhythmConfig(memberId, rhythmKey)
  const { data: completion } = useRhythmCompletion(memberId, rhythmKey)
  // Derive rhythm audience from the rendered member's dashboard_mode.
  // Phase D (PRD-18 Enhancement 7): Independent teens get a tailored
  // rhythm variant — teen framing text, teen MindSweep-Lite dispositions,
  // teen morning insight pool, teen feature discovery. Adults unchanged.
  //
  // Works correctly in ViewAs mode because memberId is the viewed
  // member's id, not the viewer's. We look up the member from the
  // family roster (useFamilyMembers is already query-cached so there's
  // no additional fetch cost).
  const { data: roster = [] } = useFamilyMembers(familyId)
  const renderedMember = roster.find(m => m.id === memberId)
  const audience: RhythmAudience =
    renderedMember?.dashboard_mode === 'independent' ? 'teen' : 'adult'
  const [isOpen, setIsOpen] = useState(false)

  // Auto-open logic — fires once per period per browser session
  useEffect(() => {
    if (!config || !config.enabled || !config.auto_open) return

    const period = periodForRhythm(rhythmKey)
    const sessionKey = autoOpenSessionKey(memberId, rhythmKey, period)

    // Already auto-opened this session for this period? Don't reopen.
    if (sessionStorage.getItem(sessionKey) === '1') return

    // Outside time window? Don't open.
    if (!isRhythmActive(config.timing, new Date())) return

    // Already completed/dismissed/snoozed? Don't open.
    if (completion && completion.status !== 'pending') return

    // Snoozed but past the snooze time? Allow opening (treat as pending).
    if (completion?.status === 'snoozed' && completion.snoozed_until) {
      if (new Date(completion.snoozed_until) > new Date()) return
    }

    // Open and mark this session as auto-opened
    sessionStorage.setItem(sessionKey, '1')
    setIsOpen(true)
  }, [config, completion, memberId, rhythmKey])

  if (!config || !config.enabled) return null

  // For morning/evening only — periodic rhythms render inline cards
  // inside morning, not as their own dashboard card.
  if (rhythmKey !== 'morning' && rhythmKey !== 'evening') return null

  // Outside the time window AND no completion → hide. The card only
  // surfaces when the rhythm is relevant.
  const inWindow = isRhythmActive(config.timing, new Date())
  const hasCompletion = !!completion
  if (!inWindow && !hasCompletion) return null

  const isMorning = rhythmKey === 'morning'
  const Icon = isMorning ? Sun : Moon
  const status = completion?.status ?? 'pending'

  // Determine display state
  const showGlow = status === 'pending' && inWindow
  const isCompleted = status === 'completed'
  const isSnoozed =
    status === 'snoozed' &&
    completion?.snoozed_until &&
    new Date(completion.snoozed_until) > new Date()

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="w-full text-left rounded-xl p-4 transition-colors hover:bg-opacity-50"
        style={{
          background: 'var(--color-bg-card)',
          border: '1px solid var(--color-border-subtle)',
        }}
      >
        <div className="flex items-center gap-3">
          <BreathingGlow active={showGlow}>
            <span
              className="inline-flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0"
              style={{
                background: 'var(--surface-primary, var(--color-btn-primary-bg))',
                color: 'var(--color-btn-primary-text)',
              }}
            >
              <Icon size={20} />
            </span>
          </BreathingGlow>

          <div className="flex-1">
            <h3
              className="text-sm font-semibold"
              style={{
                color: 'var(--color-text-heading)',
                fontFamily: 'var(--font-heading)',
              }}
            >
              {config.display_name}
            </h3>
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              {isCompleted && completion?.completed_at && (
                <span className="inline-flex items-center gap-1">
                  <Check size={12} />
                  Completed {formatTime(completion.completed_at)}
                </span>
              )}
              {isSnoozed && completion?.snoozed_until && (
                <span className="inline-flex items-center gap-1">
                  <Clock size={12} />
                  Snoozed until {formatTime(completion.snoozed_until)}
                </span>
              )}
              {!isCompleted && !isSnoozed && 'Ready when you are'}
            </p>
          </div>
        </div>
      </button>

      <RhythmModal
        config={config}
        familyId={familyId}
        memberId={memberId}
        audience={audience}
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        readingSupport={readingSupport}
      />
    </>
  )
}
