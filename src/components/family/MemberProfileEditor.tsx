import { useState } from 'react'
import { MEMBER_COLORS } from '@/config/member_colors'
import { BRACKET_LABELS, type CoppaAgeBracket } from '@/lib/coppa/brackets'

/**
 * MEMBER-SETTINGS-HUB: extracted from FamilyMembers.tsx's inline MemberRow
 * edit panel (2026-09-07) so the same profile form can be mounted both from
 * the inline "Edit" pencil on the Family Management list AND from the new
 * Member Settings Hub. ONE save path — this component owns no persistence
 * logic of its own, it only calls the `onSave`/`onUnder13Transition`
 * callbacks its caller already wires to the real save/consent-gate pipeline
 * in FamilyMembers.tsx. Never fork the bracket-transition consent gate: a
 * bracket change TO under_13 must always route through `onUnder13Transition`,
 * never a bare `onSave`.
 */

const DASHBOARD_MODE_LABELS: Record<string, string> = {
  adult: 'Adult Dashboard',
  independent: 'Independent Mode — Full Features',
  guided: 'Guided Mode — Guided Experience',
  play: 'Play Mode — Fun & Gamified',
}

function calculateAge(dob: string): number | null {
  if (!dob) return null
  const birth = new Date(dob)
  const today = new Date()
  let age = today.getFullYear() - birth.getFullYear()
  const monthDiff = today.getMonth() - birth.getMonth()
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--
  }
  return age >= 0 ? age : null
}

export interface MemberProfileEditorMember {
  id: string
  family_id: string
  display_name: string
  role: string
  dashboard_mode: string | null
  member_color: string | null
  age: number | null
  date_of_birth: string | null
  coppa_age_bracket?: CoppaAgeBracket | null
}

export interface MemberProfileEditorProps {
  member: MemberProfileEditorMember
  onSave: (updates: Record<string, unknown>) => Promise<void>
  /** PRD-40: bracket changed TO under_13 — caller routes through the consent gate. */
  onUnder13Transition: (updates: Record<string, unknown>) => void
  /** Optional — omit to hide the Cancel button (e.g. the hub has no "toggle off" state). */
  onCancel?: () => void
}

export function MemberProfileEditor({ member, onSave, onUnder13Transition, onCancel }: MemberProfileEditorProps) {
  const [name, setName] = useState(member.display_name)
  const [mode, setMode] = useState(member.dashboard_mode || 'guided')
  const [dob, setDob] = useState(member.date_of_birth || '')
  const [color, setColor] = useState(member.member_color || '')
  const [bracket, setBracket] = useState<CoppaAgeBracket>(member.coppa_age_bracket ?? 'adult')
  const [saving, setSaving] = useState(false)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          />
        </div>
        <div>
          <label className="block text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>Dashboard Style</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="w-full px-3 py-2 rounded-lg text-sm outline-none"
            style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
          >
            {Object.entries(DASHBOARD_MODE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
        </div>
      </div>
      <div>
        <label className="block text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
          Birthday
          {dob && calculateAge(dob) != null && <span className="ml-1 opacity-70">(Age {calculateAge(dob)})</span>}
        </label>
        <input
          type="date"
          value={dob}
          onChange={(e) => setDob(e.target.value)}
          className="w-full px-3 py-2 rounded-lg text-sm outline-none"
          style={{ backgroundColor: 'var(--color-bg-primary)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }}
        />
      </div>
      {/* PRD-40: age-bracket selector (children only) + R-14 transition nudge */}
      {member.role === 'member' && (
        <div data-testid="coppa-bracket-selector-edit">
          <label className="block text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>Age bracket</label>
          <div className="flex flex-wrap gap-3">
            {(['under_13', '13_to_17', 'adult'] as const).map((b) => (
              <label key={b} className="flex items-center gap-1.5 cursor-pointer text-sm" style={{ color: 'var(--color-text-primary)', minHeight: '28px' }}>
                <input
                  type="radio"
                  name={`bracket-edit-${member.id}`}
                  value={b}
                  checked={bracket === b}
                  onChange={() => setBracket(b)}
                  style={{ accentColor: 'var(--color-btn-primary-bg)' }}
                />
                {BRACKET_LABELS[b]}
              </label>
            ))}
          </div>
          {(() => {
            // R-14: members bracketed under_13 without a DOB never
            // auto-transition — show a gentle nudge when the static age
            // (or an entered birthday) suggests they're 13+ now.
            const effectiveAge = dob ? calculateAge(dob) : member.age
            const showNudge = bracket === 'under_13' && effectiveAge != null && effectiveAge >= 13
            return showNudge ? (
              <p className="mt-1.5 text-xs" data-testid="coppa-age-nudge" style={{ color: 'var(--color-text-secondary)' }}>
                {name || member.display_name} looks like they may be 13 or older now — you can
                update their age bracket above.
              </p>
            ) : null
          })()}
        </div>
      )}
      <div>
        <label className="block text-xs mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Color</label>
        <div className="flex flex-wrap gap-1.5">
          {MEMBER_COLORS.map((c) => (
            <button
              key={c.hex}
              type="button"
              onClick={() => setColor(c.hex)}
              className="w-5 h-5 rounded-full transition-transform"
              style={{
                backgroundColor: c.hex,
                outline: color === c.hex ? '2px solid var(--color-text-primary)' : 'none',
                outlineOffset: '1px',
                transform: color === c.hex ? 'scale(1.2)' : 'scale(1)',
              }}
              title={c.name}
            />
          ))}
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={async () => {
            setSaving(true)
            const age = dob ? calculateAge(dob) : member.age
            const updates: Record<string, unknown> = {
              display_name: name.trim(),
              dashboard_mode: mode,
              date_of_birth: dob || null,
              member_color: color,
              assigned_color: color,
              age,
              coppa_age_bracket: bracket,
            }
            // PRD-40: transitioning TO under_13 is an add-under-13 event —
            // route through the consent gate, never a bare update.
            const wasUnder13 = (member.coppa_age_bracket ?? 'adult') === 'under_13'
            if (bracket === 'under_13' && !wasUnder13) {
              setSaving(false)
              onUnder13Transition(updates)
              return
            }
            await onSave(updates)
            setSaving(false)
          }}
          disabled={saving || !name.trim()}
          className="px-4 py-1.5 rounded-lg text-sm font-medium text-white disabled:opacity-50"
          style={{ backgroundColor: 'var(--color-sage-teal)' }}
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        {onCancel && (
          <button
            onClick={onCancel}
            className="px-4 py-1.5 rounded-lg text-sm"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  )
}
