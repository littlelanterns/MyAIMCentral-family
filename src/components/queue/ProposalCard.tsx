/**
 * ProposalCard — KIDS-REWARDS-PAGE Slice 4 (gate §5, ruling R3).
 *
 * A kid's reward proposal rendered inside the Queue RequestsTab (Convention
 * #66 — one decision inbox; proposals are architecturally requests with a
 * payload, homed in reward_proposals per R3).
 *
 * pending          → [Approve & set up] (prefill-confirm — RequestsTab opens
 *                    the matching creation flow), [Counter], [Decline + note]
 * counter_accepted → "{kid} accepted your counteroffer" + [Set it up]
 *                    (same prefill-confirm, from counter_terms)
 *
 * Zero hardcoded colors — all CSS custom properties (RequestCard sibling).
 */

import { useState } from 'react'
import { Check, ChevronDown, Handshake, Repeat2, User } from 'lucide-react'
import type { RewardProposalWithProposer } from '@/types/rewardProposals'
import {
  activeProposalTerms,
  describeCommitment,
  EARN_STRUCTURE_LABELS,
} from '@/types/rewardProposals'
import { getMemberColor } from '@/lib/memberColors'
import { PlatformAssetImage } from '@/components/shared/PlatformAssetImage'

interface ProposalCardProps {
  proposal: RewardProposalWithProposer
  onApprove: (proposal: RewardProposalWithProposer) => void
  onCounter: (proposal: RewardProposalWithProposer) => void
  onDecline: (proposal: RewardProposalWithProposer, note?: string) => void
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  return `${Math.floor(hours / 24)}d ago`
}

const actionButtonBase: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: '0.25rem',
  padding: '0.375rem 0.625rem',
  borderRadius: 'var(--vibe-radius-input, 8px)',
  border: 'none',
  fontSize: '0.8125rem',
  fontWeight: 600,
  cursor: 'pointer',
}

export function ProposalCard({ proposal, onApprove, onCounter, onDecline }: ProposalCardProps) {
  const [declineOpen, setDeclineOpen] = useState(false)
  const [declineNote, setDeclineNote] = useState('')

  const terms = activeProposalTerms(proposal)
  const avatarColor = getMemberColor({
    assigned_color: proposal.proposer_assigned_color,
    member_color: proposal.proposer_member_color,
  })
  const isCounterAccepted = proposal.status === 'counter_accepted'

  return (
    <div
      data-testid="proposal-card"
      style={{
        borderRadius: 'var(--vibe-radius-input, 8px)',
        border: '1px solid color-mix(in srgb, var(--color-btn-primary-bg) 30%, var(--color-border))',
        background: 'var(--color-bg-card)',
        padding: '0.875rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '0.625rem',
      }}
    >
      {/* Header: proposer + badge + time */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: avatarColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {proposal.proposer_avatar_url ? (
            <img
              src={proposal.proposer_avatar_url}
              alt=""
              style={{ width: 28, height: 28, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <User size={14} style={{ color: 'var(--color-text-on-primary, #fff)' }} />
          )}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>
            {proposal.proposer_display_name || 'Family Member'}
          </span>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              marginLeft: '0.5rem',
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: 'var(--color-btn-primary-bg)',
            }}
          >
            <Handshake size={12} /> Proposed a deal
          </span>
        </div>

        <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>
          {timeAgo(proposal.created_at)}
        </span>
      </div>

      {/* Counter-accepted banner */}
      {isCounterAccepted && (
        <div
          data-testid="proposal-counter-accepted-banner"
          style={{
            padding: '0.5rem 0.75rem',
            borderRadius: 'var(--vibe-radius-input, 8px)',
            background: 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, var(--color-bg-card))',
            fontSize: '0.8125rem',
            fontWeight: 600,
            color: 'var(--color-btn-primary-bg)',
          }}
        >
          {proposal.proposer_display_name || 'They'} accepted your counteroffer
          — ready to set up.
        </div>
      )}

      {/* The deal on the table */}
      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
        {terms.want_image_url && (
          <img
            src={terms.want_image_url}
            alt=""
            style={{
              width: 48,
              height: 48,
              objectFit: 'cover',
              borderRadius: 'var(--vibe-radius-card, 8px)',
              border: '1px solid var(--color-border)',
              flexShrink: 0,
            }}
          />
        )}
        {!terms.want_image_url && terms.want_image_asset_key && (
          <PlatformAssetImage
            assetKey={terms.want_image_asset_key}
            size={48}
            assetSize={128}
            variant="B"
            fallback={null}
          />
        )}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--color-text-heading)' }}>
            "{terms.want_text}"
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-secondary)', marginTop: '0.125rem' }}>
            if: {describeCommitment(terms)}
          </div>
          <span
            style={{
              display: 'inline-block',
              marginTop: '0.375rem',
              padding: '0.125rem 0.5rem',
              borderRadius: '9999px',
              fontSize: '0.6875rem',
              fontWeight: 600,
              backgroundColor: 'var(--color-bg-secondary)',
              color: 'var(--color-text-secondary)',
            }}
          >
            {EARN_STRUCTURE_LABELS[terms.earn_structure]}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap', marginTop: '0.125rem' }}>
        <button
          data-testid={isCounterAccepted ? 'proposal-setup' : 'proposal-approve'}
          onClick={() => onApprove(proposal)}
          style={{
            ...actionButtonBase,
            background: 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, var(--color-bg-card))',
            color: 'var(--color-btn-primary-bg)',
          }}
        >
          <Check size={14} /> {isCounterAccepted ? 'Set it up' : 'Approve & set up'}
        </button>

        {!isCounterAccepted && (
          <>
            <button
              data-testid="proposal-counter"
              onClick={() => onCounter(proposal)}
              style={{
                ...actionButtonBase,
                background: 'var(--color-bg-secondary)',
                color: 'var(--color-text-primary)',
              }}
            >
              <Repeat2 size={14} /> Counter
            </button>

            <div style={{ position: 'relative' }}>
              <button
                data-testid="proposal-decline-open"
                onClick={() => setDeclineOpen(!declineOpen)}
                style={{
                  ...actionButtonBase,
                  background: 'color-mix(in srgb, var(--color-btn-primary-hover) 8%, var(--color-bg-card))',
                  color: 'var(--color-text-secondary)',
                }}
              >
                Decline <ChevronDown size={14} />
              </button>
              {declineOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    marginTop: '0.25rem',
                    background: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                    borderRadius: 'var(--vibe-radius-input, 8px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                    zIndex: 10,
                    minWidth: '220px',
                    padding: '0.75rem',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      color: 'var(--color-text-muted)',
                      marginBottom: '0.5rem',
                    }}
                  >
                    Decline with note:
                  </div>
                  <textarea
                    value={declineNote}
                    onChange={e => setDeclineNote(e.target.value)}
                    placeholder="Optional: a kind word about why"
                    rows={2}
                    style={{
                      width: '100%',
                      padding: '0.5rem',
                      borderRadius: 'var(--vibe-radius-input, 8px)',
                      border: '1px solid var(--color-border)',
                      background: 'var(--color-bg-input, var(--color-bg-card))',
                      color: 'var(--color-text-primary)',
                      fontSize: '0.8125rem',
                      resize: 'none',
                      outline: 'none',
                      marginBottom: '0.5rem',
                    }}
                  />
                  <button
                    data-testid="proposal-decline-confirm"
                    onClick={() => {
                      setDeclineOpen(false)
                      onDecline(proposal, declineNote.trim() || undefined)
                      setDeclineNote('')
                    }}
                    style={{
                      ...actionButtonBase,
                      width: '100%',
                      background: 'color-mix(in srgb, var(--color-btn-primary-hover) 12%, var(--color-bg-card))',
                      color: 'var(--color-text-primary)',
                    }}
                  >
                    Decline
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
