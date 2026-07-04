/**
 * ProposalTermsForm — KIDS-REWARDS-PAGE Slice 4 (gate §5).
 *
 * The guided (never freeform — founder decision) terms editor shared by:
 *   - the kid's Propose-a-Deal form (ProposeRewardSection)
 *   - mom's counteroffer editor (RequestsTab counter modal)
 *   - the adult self-propose screen (SelfProposeSection)
 *
 * "I want…" (text + optional three-mode picture) and "I will…" via simple
 * structured choices: do a thing once / do a thing every day for N days /
 * finish a list of things — mapping cleanly to task / streak tracker /
 * routine checklist. No LiLa parsing in v1 (registered enhancement).
 */

import { CalendarClock, CheckSquare, ListChecks } from 'lucide-react'
import { RewardImagePicker } from './RewardImagePicker'
import type { ProposalEarnStructure, ProposalTerms } from '@/types/rewardProposals'

export function emptyProposalTerms(): ProposalTerms {
  return {
    want_text: '',
    want_image_url: null,
    want_image_asset_key: null,
    will_text: '',
    earn_structure: 'once',
    params: {},
  }
}

export function isProposalTermsComplete(terms: ProposalTerms): boolean {
  if (!terms.want_text.trim() || !terms.will_text.trim()) return false
  if (terms.earn_structure === 'streak_n_days') {
    return (terms.params.days ?? 0) >= 2
  }
  if (terms.earn_structure === 'finish_list') {
    return (terms.params.items ?? []).filter(i => i.trim()).length >= 1
  }
  return true
}

const STRUCTURES: {
  key: ProposalEarnStructure
  label: string
  description: string
  icon: typeof CheckSquare
}[] = [
  { key: 'once', label: 'Do one thing', description: 'One task, one reward', icon: CheckSquare },
  { key: 'streak_n_days', label: 'Every day', description: 'Keep it up for a number of days', icon: CalendarClock },
  { key: 'finish_list', label: 'Finish a list', description: 'A checklist to work through', icon: ListChecks },
]

interface ProposalTermsFormProps {
  value: ProposalTerms
  onChange: (terms: ProposalTerms) => void
  familyId: string
  /** Framing: 'kid' = pitching a parent; 'self' = promising yourself. */
  audience: 'kid' | 'self'
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem 0.75rem',
  minHeight: '44px',
  borderRadius: 'var(--vibe-radius-input, 8px)',
  border: '1px solid var(--color-border)',
  backgroundColor: 'var(--color-bg-input, var(--color-bg-card))',
  color: 'var(--color-text-primary)',
  fontSize: 'var(--font-size-sm, 0.875rem)',
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 'var(--font-size-sm, 0.875rem)',
  fontWeight: 600,
  color: 'var(--color-text-primary)',
  marginBottom: '0.375rem',
}

export function ProposalTermsForm({ value, onChange, familyId, audience }: ProposalTermsFormProps) {
  const set = (patch: Partial<ProposalTerms>) => onChange({ ...value, ...patch })

  return (
    <div className="space-y-4" data-testid="proposal-terms-form">
      {/* I want... */}
      <div>
        <label style={labelStyle} htmlFor="proposal-want">
          {audience === 'kid' ? 'I want...' : 'The reward'}
        </label>
        <input
          id="proposal-want"
          data-testid="proposal-want-input"
          type="text"
          value={value.want_text}
          onChange={e => set({ want_text: e.target.value })}
          placeholder={audience === 'kid' ? 'an ice cream trip' : 'a quiet evening with my book'}
          style={inputStyle}
        />
      </div>

      <RewardImagePicker
        value={{ imageUrl: value.want_image_url, imageAssetKey: value.want_image_asset_key }}
        onChange={img => set({ want_image_url: img.imageUrl, want_image_asset_key: img.imageAssetKey })}
        familyId={familyId}
        suggestText={value.want_text}
        label="Add a picture (optional)"
      />

      {/* I will... structure */}
      <div>
        <span style={labelStyle}>
          {audience === 'kid' ? 'To earn it, I will...' : 'To earn it, you will...'}
        </span>
        <div style={{ display: 'flex', gap: '0.5rem' }} role="radiogroup" aria-label="How will it be earned?">
          {STRUCTURES.map(s => {
            const Icon = s.icon
            const active = value.earn_structure === s.key
            return (
              <button
                key={s.key}
                type="button"
                role="radio"
                aria-checked={active}
                data-testid={`proposal-structure-${s.key}`}
                onClick={() => set({ earn_structure: s.key, params: {} })}
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '0.25rem',
                  padding: '0.625rem 0.375rem',
                  minHeight: '44px',
                  borderRadius: 'var(--vibe-radius-input, 8px)',
                  border: active
                    ? '2px solid var(--color-btn-primary-bg)'
                    : '1px solid var(--color-border)',
                  backgroundColor: active
                    ? 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, var(--color-bg-card))'
                    : 'var(--color-bg-card)',
                  color: 'var(--color-text-primary)',
                  cursor: 'pointer',
                }}
              >
                <Icon size={18} style={{ color: active ? 'var(--color-btn-primary-bg)' : 'var(--color-text-secondary)' }} />
                <span style={{ fontSize: 'var(--font-size-xs, 0.75rem)', fontWeight: active ? 700 : 500 }}>
                  {s.label}
                </span>
              </button>
            )
          })}
        </div>
        <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', margin: '0.375rem 0 0' }}>
          {STRUCTURES.find(s => s.key === value.earn_structure)?.description}
        </p>
      </div>

      {/* Commitment text */}
      <div>
        <label style={labelStyle} htmlFor="proposal-will">
          {value.earn_structure === 'finish_list' ? 'What is the list about?' : 'What will you do?'}
        </label>
        <input
          id="proposal-will"
          data-testid="proposal-will-input"
          type="text"
          value={value.will_text}
          onChange={e => set({ will_text: e.target.value })}
          placeholder={
            value.earn_structure === 'streak_n_days'
              ? 'practice piano'
              : value.earn_structure === 'finish_list'
                ? 'my summer reading'
                : 'clean out the garage'
          }
          style={inputStyle}
        />
      </div>

      {/* Structure params */}
      {value.earn_structure === 'streak_n_days' && (
        <div>
          <label style={labelStyle} htmlFor="proposal-days">
            For how many days in a row?
          </label>
          <input
            id="proposal-days"
            data-testid="proposal-days-input"
            type="number"
            min={2}
            max={365}
            value={value.params.days ?? ''}
            onChange={e => {
              const days = parseInt(e.target.value, 10)
              set({ params: { ...value.params, days: Number.isNaN(days) ? undefined : days } })
            }}
            placeholder="7"
            style={{ ...inputStyle, width: '120px' }}
          />
        </div>
      )}

      {value.earn_structure === 'finish_list' && (
        <div>
          <label style={labelStyle} htmlFor="proposal-items">
            The things to finish (one per line)
          </label>
          <textarea
            id="proposal-items"
            data-testid="proposal-items-input"
            rows={4}
            value={(value.params.items ?? []).join('\n')}
            onChange={e =>
              set({ params: { ...value.params, items: e.target.value.split('\n') } })
            }
            placeholder={'Read chapter 1\nRead chapter 2\nWrite the book report'}
            style={{ ...inputStyle, resize: 'vertical', minHeight: '96px' }}
          />
        </div>
      )}
    </div>
  )
}
