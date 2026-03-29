/**
 * CalendarSettingsModal — PRD-14B Screen 7
 *
 * Transient modal (ModalV2, sm) for calendar-level settings.
 * Opened from gear icon in Calendar page toolbar.
 *
 * Settings:
 *  - Week start day (Sunday/Monday)
 *  - Default drive time (minutes)
 *  - Auto-approve members list
 *  - Required intake fields for kid events
 *  - Default calendar view preference (Month/Week/Day)
 *  - Color mode preference (Dots/Stripe)
 */

import { useState, useEffect } from 'react'
import { ModalV2 } from '@/components/shared'
import { useCalendarSettings, useUpdateCalendarSettings } from '@/hooks/useCalendarEvents'
import { useFamilyMembers, useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'

const INTAKE_FIELD_OPTIONS = [
  { key: 'description', label: 'Description' },
  { key: 'location', label: 'Location' },
  { key: 'transportation', label: 'Transportation details' },
  { key: 'items_to_bring', label: 'Items to bring' },
  { key: 'attendees', label: 'Who\'s involved' },
] as const

interface CalendarSettingsModalProps {
  isOpen: boolean
  onClose: () => void
  onDefaultViewChange?: (view: string) => void
  onColorModeChange?: (mode: string) => void
}

export function CalendarSettingsModal({ isOpen, onClose, onDefaultViewChange, onColorModeChange }: CalendarSettingsModalProps) {
  const { data: settings, isLoading } = useCalendarSettings()
  const { mutate: updateSettings } = useUpdateCalendarSettings()
  const { data: family } = useFamily()
  const { data: currentMember } = useFamilyMember()
  const { data: familyMembers } = useFamilyMembers(family?.id)

  // Local state mirrors DB, saves on change
  const [weekStart, setWeekStart] = useState<0 | 1>(0)
  const [driveTime, setDriveTime] = useState(30)
  const [autoApprove, setAutoApprove] = useState<string[]>([])
  const [requiredFields, setRequiredFields] = useState<string[]>([])
  const [defaultView, setDefaultView] = useState<string>(() => {
    try { return localStorage.getItem('myaim-calendar-default-view') || 'month' } catch { return 'month' }
  })
  const [colorMode, setColorMode] = useState<string>(() => {
    try { return localStorage.getItem('myaim-calendar-color-mode') || 'dots' } catch { return 'dots' }
  })

  // Sync from DB
  useEffect(() => {
    if (!settings) return
    setWeekStart((settings.week_start_day ?? 0) as 0 | 1)
    setDriveTime(settings.default_drive_time_minutes ?? 30)
    setAutoApprove(settings.auto_approve_members ?? [])
    setRequiredFields((settings.required_intake_fields as string[]) ?? [])
  }, [settings])

  function handleWeekStartChange(val: 0 | 1) {
    setWeekStart(val)
    updateSettings({ week_start_day: val })
  }

  function handleDriveTimeBlur() {
    const clamped = Math.max(0, Math.min(driveTime, 180))
    setDriveTime(clamped)
    updateSettings({ default_drive_time_minutes: clamped })
  }

  function handleToggleAutoApprove(memberId: string) {
    const next = autoApprove.includes(memberId)
      ? autoApprove.filter(id => id !== memberId)
      : [...autoApprove, memberId]
    setAutoApprove(next)
    updateSettings({ auto_approve_members: next })
  }

  function handleToggleRequiredField(fieldKey: string) {
    const next = requiredFields.includes(fieldKey)
      ? requiredFields.filter(k => k !== fieldKey)
      : [...requiredFields, fieldKey]
    setRequiredFields(next)
    updateSettings({ required_intake_fields: next })
  }

  function handleDefaultViewChange(view: string) {
    setDefaultView(view)
    try { localStorage.setItem('myaim-calendar-default-view', view) } catch { /* ignore */ }
    onDefaultViewChange?.(view)
  }

  function handleColorModeChange(mode: string) {
    setColorMode(mode)
    try { localStorage.setItem('myaim-calendar-color-mode', mode) } catch { /* ignore */ }
    onColorModeChange?.(mode)
  }

  const isMom = currentMember?.role === 'primary_parent'

  return (
    <ModalV2
      id="calendar-settings"
      isOpen={isOpen}
      onClose={onClose}
      title="Calendar Settings"
      size="sm"
      type="transient"
    >
      <div className="density-tight p-5 space-y-6">
        {isLoading ? (
          <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading settings...</div>
        ) : (
          <>
            {/* Week Start Day */}
            <section>
              <h3
                className="text-sm font-semibold mb-2"
                style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
              >
                Week starts on
              </h3>
              <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                {([0, 1] as const).map(val => (
                  <button
                    key={val}
                    onClick={() => handleWeekStartChange(val)}
                    disabled={!isMom}
                    className="flex-1 text-sm py-2 font-medium transition-colors"
                    style={{
                      background: weekStart === val ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-card)',
                      color: weekStart === val ? 'var(--color-btn-primary-text)' : 'var(--color-text-primary)',
                      border: 'none',
                      minHeight: 'unset',
                      cursor: isMom ? 'pointer' : 'default',
                      opacity: !isMom ? 0.6 : 1,
                    }}
                  >
                    {val === 0 ? 'Sunday' : 'Monday'}
                  </button>
                ))}
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                Affects all calendar views, scheduler, and dashboard widget
              </p>
            </section>

            {/* Default Drive Time */}
            <section>
              <h3
                className="text-sm font-semibold mb-2"
                style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
              >
                Default drive time
              </h3>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={driveTime}
                  onChange={(e) => setDriveTime(Number(e.target.value) || 0)}
                  onBlur={handleDriveTimeBlur}
                  disabled={!isMom}
                  min={0}
                  max={180}
                  className="w-20 px-2 py-1.5 rounded-lg text-sm outline-none"
                  style={{
                    backgroundColor: 'var(--color-bg-primary)',
                    border: '1px solid var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                />
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>minutes</span>
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                Used to calculate "leave by" times when transportation is needed
              </p>
            </section>

            {/* Auto-Approve Members */}
            <section>
              <h3
                className="text-sm font-semibold mb-2"
                style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
              >
                Members who don't need approval
              </h3>
              <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                Events from these members will be automatically approved
              </p>
              <div className="space-y-1">
                {(familyMembers ?? []).map(m => {
                  const isMomMember = m.role === 'primary_parent'
                  const isChecked = isMomMember || autoApprove.includes(m.id)
                  return (
                    <label
                      key={m.id}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg cursor-pointer transition-colors"
                      style={{
                        backgroundColor: isChecked
                          ? 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, var(--color-bg-card))'
                          : 'transparent',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => !isMomMember && handleToggleAutoApprove(m.id)}
                        disabled={isMomMember || !isMom}
                        className="rounded"
                        style={{ accentColor: 'var(--color-btn-primary-bg)' }}
                      />
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {m.display_name}
                        </span>
                        {isMomMember && (
                          <span className="text-xs ml-2" style={{ color: 'var(--color-text-secondary)' }}>
                            (always approved)
                          </span>
                        )}
                      </div>
                      <span className="text-xs capitalize" style={{ color: 'var(--color-text-secondary)' }}>
                        {m.role === 'primary_parent' ? 'Mom' : m.role?.replace('_', ' ')}
                      </span>
                    </label>
                  )
                })}
              </div>
            </section>

            {/* Required Intake Fields (for kid events) */}
            <section>
              <h3
                className="text-sm font-semibold mb-2"
                style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
              >
                Required fields for kid events
              </h3>
              <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                When kids create events, these fields will be mandatory
              </p>
              <div className="space-y-1">
                {INTAKE_FIELD_OPTIONS.map(opt => {
                  const isChecked = requiredFields.includes(opt.key)
                  return (
                    <label
                      key={opt.key}
                      className="flex items-center gap-3 px-3 py-1.5 rounded-lg cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleRequiredField(opt.key)}
                        disabled={!isMom}
                        className="rounded"
                        style={{ accentColor: 'var(--color-btn-primary-bg)' }}
                      />
                      <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>
                        {opt.label}
                      </span>
                    </label>
                  )
                })}
              </div>
            </section>

            {/* Default Calendar View */}
            <section>
              <h3
                className="text-sm font-semibold mb-2"
                style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
              >
                Default view
              </h3>
              <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                {(['month', 'week', 'day'] as const).map(v => (
                  <button
                    key={v}
                    onClick={() => handleDefaultViewChange(v)}
                    className="flex-1 text-sm py-2 font-medium capitalize transition-colors"
                    style={{
                      background: defaultView === v ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-card)',
                      color: defaultView === v ? 'var(--color-btn-primary-text)' : 'var(--color-text-primary)',
                      border: 'none',
                      minHeight: 'unset',
                      cursor: 'pointer',
                    }}
                  >
                    {v}
                  </button>
                ))}
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                The view that opens when you navigate to the Calendar page
              </p>
            </section>

            {/* Color Mode */}
            <section>
              <h3
                className="text-sm font-semibold mb-2"
                style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
              >
                Event colors
              </h3>
              <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
                {([['dots', 'Dots'], ['stripe', 'Stripe']] as const).map(([key, label]) => (
                  <button
                    key={key}
                    onClick={() => handleColorModeChange(key)}
                    className="flex-1 text-sm py-2 font-medium transition-colors"
                    style={{
                      background: colorMode === key ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-card)',
                      color: colorMode === key ? 'var(--color-btn-primary-text)' : 'var(--color-text-primary)',
                      border: 'none',
                      minHeight: 'unset',
                      cursor: 'pointer',
                    }}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                How member colors appear on events: small dots or left border stripe
              </p>
            </section>
          </>
        )}
      </div>
    </ModalV2>
  )
}
