/**
 * ProposeRewardSection — KIDS-REWARDS-PAGE Slice 4 (gate §5).
 *
 * The kid-facing "Propose a Deal" section on My Rewards (Guided+ only — the
 * section never renders on the Play variant). Mom opts it in per kid via
 * my_rewards_sections.propose (default OFF).
 *
 * Guided form, not freeform: "I want… if I will…" with three structured
 * earn choices. Submitting creates a pending reward_proposals row and drops
 * a card into mom's Queue RequestsTab (Convention #66 — one decision inbox).
 *
 * The kid's proposal list shows every outcome, including mom's ONE-round
 * counteroffer with Accept / Decline (gate §5). Actions are offered only on
 * the member's own real auth session — RLS writes are proposer-scoped, so a
 * mom-session View As must not offer buttons that would fail (Convention #39,
 * same discipline as self-redeem).
 */

import { useState } from 'react'
import { Handshake, Undo2 } from 'lucide-react'
import type { FamilyMember } from '@/hooks/useFamilyMember'
import {
  useMyRewardProposals,
  useCreateRewardProposal,
  useRespondToCounter,
  useWithdrawRewardProposal,
} from '@/hooks/useRewardProposals'
import {
  ProposalTermsForm,
  emptyProposalTerms,
  isProposalTermsComplete,
} from './ProposalTermsForm'
import { describeCommitment } from '@/types/rewardProposals'
import type { RewardProposal } from '@/types/rewardProposals'

interface ProposeRewardSectionProps {
  member: FamilyMember
  variant: 'standard' | 'play'
  isOwnSession: boolean
}

const STATUS_LABELS: Record<RewardProposal['status'], string> = {
  pending: 'Waiting for an answer',
  countered: 'Counteroffer!',
  counter_accepted: 'You said yes — being set up',
  accepted: 'Deal!',
  declined: 'Not this time',
}

function statusChipColors(status: RewardProposal['status']): React.CSSProperties {
  const base: React.CSSProperties = {
    display: 'inline-block',
    padding: '0.125rem 0.5rem',
    borderRadius: '9999px',
    fontSize: 'var(--font-size-xs, 0.75rem)',
    fontWeight: 700,
  }
  switch (status) {
    case 'accepted':
    case 'counter_accepted':
      return {
        ...base,
        backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 14%, var(--color-bg-card))',
        color: 'var(--color-btn-primary-bg)',
      }
    case 'countered':
      return {
        ...base,
        backgroundColor: 'color-mix(in srgb, var(--color-accent, var(--color-btn-primary-bg)) 16%, var(--color-bg-card))',
        color: 'var(--color-accent, var(--color-btn-primary-bg))',
      }
    default:
      return {
        ...base,
        backgroundColor: 'var(--color-bg-secondary)',
        color: 'var(--color-text-secondary)',
      }
  }
}

export function ProposeRewardSection({ member, variant, isOwnSession }: ProposeRewardSectionProps) {
  const play = variant === 'play'
  const [formOpen, setFormOpen] = useState(false)
  const [terms, setTerms] = useState(emptyProposalTerms)
  const { data: proposals = [] } = useMyRewardProposals(member.id)
  const createProposal = useCreateRewardProposal()
  const respondToCounter = useRespondToCounter()
  const withdraw = useWithdrawRewardProposal()

  // Gate §5: Guided and up only — no Play version in this build.
  if (play) return null

  const handleSubmit = async () => {
    if (!isProposalTermsComplete(terms)) return
    await createProposal.mutateAsync({
      familyId: member.family_id,
      proposerId: member.id,
      proposerName: member.display_name,
      terms: {
        ...terms,
        want_text: terms.want_text.trim(),
        will_text: terms.will_text.trim(),
        params: {
          ...terms.params,
          items: terms.params.items?.map(i => i.trim()).filter(Boolean),
        },
      },
    })
    setTerms(emptyProposalTerms())
    setFormOpen(false)
  }

  return (
    <section
      data-testid="mr-section-propose"
      aria-label="Propose a Deal"
      className="rounded-xl"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        padding: '1rem',
      }}
    >
      <div
        className="flex items-center gap-2 mb-3"
        style={{
          fontSize: 'var(--font-size-base)',
          fontWeight: 700,
          color: 'var(--color-text-heading)',
        }}
      >
        <span style={{ color: 'var(--color-btn-primary-bg)', display: 'inline-flex' }}>
          <Handshake size={18} />
        </span>
        Propose a Deal
      </div>

      {/* New proposal */}
      {isOwnSession && !formOpen && (
        <button
          type="button"
          data-testid="proposal-open-form"
          onClick={() => setFormOpen(true)}
          className="rounded-full"
          style={{
            padding: '0.5rem 1rem',
            minHeight: '44px',
            fontSize: 'var(--font-size-sm)',
            fontWeight: 600,
            backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, var(--color-bg-card))',
            border: 'none',
            color: 'var(--color-btn-primary-bg)',
            cursor: 'pointer',
          }}
        >
          Pitch a deal
        </button>
      )}

      {isOwnSession && formOpen && (
        <div
          className="rounded-lg p-3 mb-3"
          style={{ backgroundColor: 'var(--color-bg-secondary)', border: '1px solid var(--color-border)' }}
        >
          <ProposalTermsForm
            value={terms}
            onChange={setTerms}
            familyId={member.family_id}
            audience="kid"
          />
          <p
            className="mt-3"
            style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}
          >
            Your pitch goes to your parent — they can say yes, say no, or make
            a counteroffer.
          </p>
          <div className="flex gap-2 mt-2">
            <button
              type="button"
              data-testid="proposal-submit"
              onClick={handleSubmit}
              disabled={!isProposalTermsComplete(terms) || createProposal.isPending}
              className="rounded-full"
              style={{
                padding: '0.5rem 1.25rem',
                minHeight: '44px',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 700,
                background: 'var(--surface-primary)',
                border: 'none',
                color: 'var(--color-text-on-primary)',
                cursor: 'pointer',
                opacity: !isProposalTermsComplete(terms) || createProposal.isPending ? 0.5 : 1,
              }}
            >
              {createProposal.isPending ? 'Sending...' : 'Send your pitch'}
            </button>
            <button
              type="button"
              onClick={() => setFormOpen(false)}
              className="rounded-full"
              style={{
                padding: '0.5rem 1rem',
                minHeight: '44px',
                fontSize: 'var(--font-size-sm)',
                fontWeight: 600,
                backgroundColor: 'transparent',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-secondary)',
                cursor: 'pointer',
              }}
            >
              Never mind
            </button>
          </div>
        </div>
      )}

      {/* My proposals */}
      {proposals.length === 0 && !formOpen ? (
        <p className="text-sm py-2" style={{ color: 'var(--color-text-secondary)' }}>
          Got something you'd love to earn? Pitch a deal and see what happens!
        </p>
      ) : (
        <div className="space-y-2 mt-3" data-testid="proposal-list">
          {proposals.map(p => (
            <div
              key={p.id}
              data-testid={`proposal-row-${p.status}`}
              className="rounded-lg p-3"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border:
                  p.status === 'countered'
                    ? '1px solid color-mix(in srgb, var(--color-btn-primary-bg) 40%, transparent)'
                    : '1px solid var(--color-border)',
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p
                    className="font-semibold truncate"
                    style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', margin: 0 }}
                  >
                    {p.terms.want_text}
                  </p>
                  <p
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      color: 'var(--color-text-secondary)',
                      margin: '0.125rem 0 0',
                    }}
                  >
                    {describeCommitment(p.terms)}
                  </p>
                </div>
                <span style={statusChipColors(p.status)}>{STATUS_LABELS[p.status]}</span>
              </div>

              {/* Mom's counteroffer — ONE round: accept or decline (gate §5) */}
              {p.status === 'countered' && p.counter_terms && (
                <div
                  className="rounded-lg p-2.5 mt-2"
                  style={{
                    backgroundColor: 'var(--color-bg-card)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <p
                    style={{
                      fontSize: 'var(--font-size-xs)',
                      fontWeight: 700,
                      color: 'var(--color-text-secondary)',
                      margin: 0,
                    }}
                  >
                    The counteroffer:
                  </p>
                  <p
                    className="font-semibold"
                    style={{ fontSize: 'var(--font-size-sm)', color: 'var(--color-text-primary)', margin: '0.25rem 0 0' }}
                  >
                    {p.counter_terms.want_text}
                  </p>
                  <p style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)', margin: '0.125rem 0 0' }}>
                    {describeCommitment(p.counter_terms)}
                  </p>
                  {p.counter_note && (
                    <p
                      style={{
                        fontSize: 'var(--font-size-xs)',
                        color: 'var(--color-text-secondary)',
                        fontStyle: 'italic',
                        margin: '0.375rem 0 0',
                      }}
                    >
                      "{p.counter_note}"
                    </p>
                  )}
                  {isOwnSession && (
                    <div className="flex gap-2 mt-2">
                      <button
                        type="button"
                        data-testid="counter-accept"
                        onClick={() =>
                          respondToCounter.mutate({
                            proposal: p,
                            accept: true,
                            responderName: member.display_name,
                          })
                        }
                        disabled={respondToCounter.isPending}
                        className="rounded-full"
                        style={{
                          padding: '0.375rem 1rem',
                          minHeight: '40px',
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 700,
                          background: 'var(--surface-primary)',
                          border: 'none',
                          color: 'var(--color-text-on-primary)',
                          cursor: 'pointer',
                        }}
                      >
                        I accept!
                      </button>
                      <button
                        type="button"
                        data-testid="counter-decline"
                        onClick={() =>
                          respondToCounter.mutate({
                            proposal: p,
                            accept: false,
                            responderName: member.display_name,
                          })
                        }
                        disabled={respondToCounter.isPending}
                        className="rounded-full"
                        style={{
                          padding: '0.375rem 1rem',
                          minHeight: '40px',
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: 600,
                          backgroundColor: 'transparent',
                          border: '1px solid var(--color-border)',
                          color: 'var(--color-text-secondary)',
                          cursor: 'pointer',
                        }}
                      >
                        No thanks
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Declined note */}
              {p.status === 'declined' && p.decline_note && (
                <p
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-secondary)',
                    fontStyle: 'italic',
                    margin: '0.375rem 0 0',
                  }}
                >
                  "{p.decline_note}"
                </p>
              )}

              {/* Withdraw a still-pending pitch */}
              {p.status === 'pending' && isOwnSession && (
                <button
                  type="button"
                  data-testid="proposal-withdraw"
                  onClick={() => withdraw.mutate({ proposalId: p.id })}
                  disabled={withdraw.isPending}
                  className="flex items-center gap-1 mt-2"
                  style={{
                    fontSize: 'var(--font-size-xs)',
                    color: 'var(--color-text-secondary)',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.25rem 0',
                  }}
                >
                  <Undo2 size={12} /> Take it back
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
