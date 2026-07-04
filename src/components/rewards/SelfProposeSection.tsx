/**
 * SelfProposeSection — KIDS-REWARDS-PAGE Slice 4 (gate §6 + §11).
 *
 * The adult "promise yourself a reward" screen on their own /my-rewards page:
 * the kid proposal flow with negotiation COLLAPSED — proposer and approver
 * are the same person, so it is one screen: define the reward, define the
 * earning structure, confirm the prefilled artifact (same prefill mechanism
 * as mom's Approve flow — never silent auto-create), done.
 *
 * Per-reward visibility (§11): private to the creator by DEFAULT, shareable
 * with selected members via a member picker. Written onto the created task's
 * reward_visibility/reward_shared_with (migration 100278) and snapshotted
 * into the earned prize at award time — enforced at the query layer by the
 * 100266 earned_prizes RLS, never rendered-then-hidden.
 *
 * Renders for mom, dad, and special adults (any adult self-proposes — §11).
 * Mom's Prize Board pill entry to this same flow ships with Slice 5.
 */

import { useState } from 'react'
import { ChevronDown, ChevronRight, Handshake } from 'lucide-react'
import type { FamilyMember } from '@/hooks/useFamilyMember'
import { useFamilyMembers } from '@/hooks/useFamilyMember'
import { useMySelfProposals, useCreateSelfProposal } from '@/hooks/useRewardProposals'
import {
  ProposalTermsForm,
  emptyProposalTerms,
  isProposalTermsComplete,
} from './ProposalTermsForm'
import { ProposalArtifactCreator } from './ProposalArtifactCreator'
import { describeCommitment } from '@/types/rewardProposals'
import type { ProposalArtifactType, ProposalTerms } from '@/types/rewardProposals'
import { getMemberColor } from '@/lib/memberColors'

interface SelfProposeSectionProps {
  member: FamilyMember
  isOwnSession: boolean
}

export function SelfProposeSection({ member, isOwnSession }: SelfProposeSectionProps) {
  const [expanded, setExpanded] = useState(false)
  const [terms, setTerms] = useState(emptyProposalTerms)
  const [shareMode, setShareMode] = useState<'private' | 'shared'>('private')
  const [sharedWith, setSharedWith] = useState<string[]>([])
  const [settingUp, setSettingUp] = useState<ProposalTerms | null>(null)

  const { data: familyMembers = [] } = useFamilyMembers(member.family_id)
  const { data: selfProposals = [] } = useMySelfProposals(member.id)
  const createSelfProposal = useCreateSelfProposal()

  const shareCandidates = familyMembers.filter(
    m => m.is_active && m.id !== member.id && m.role !== 'family',
  )

  const canSetUp =
    isProposalTermsComplete(terms) && (shareMode === 'private' || sharedWith.length > 0)

  const handleArtifactCreated = async (
    artifactType: ProposalArtifactType,
    artifactId: string | null,
  ) => {
    await createSelfProposal.mutateAsync({
      familyId: member.family_id,
      proposerId: member.id,
      terms: {
        ...terms,
        want_text: terms.want_text.trim(),
        will_text: terms.will_text.trim(),
        params: {
          ...terms.params,
          items: terms.params.items?.map(i => i.trim()).filter(Boolean),
        },
      },
      artifactType,
      artifactId,
    })
    setTerms(emptyProposalTerms())
    setShareMode('private')
    setSharedWith([])
    // Stay expanded — the fresh promise appearing under "My promises" IS the
    // success feedback (never silently succeed).
  }

  return (
    <section
      data-testid="mr-section-self-propose"
      aria-label="Promise Yourself a Reward"
      className="rounded-xl"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
        padding: '1rem',
      }}
    >
      <button
        type="button"
        data-testid="self-propose-toggle"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-2 text-left"
        style={{
          fontSize: 'var(--font-size-base)',
          fontWeight: 700,
          color: 'var(--color-text-heading)',
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        {expanded ? (
          <ChevronDown size={16} style={{ color: 'var(--color-text-secondary)' }} />
        ) : (
          <ChevronRight size={16} style={{ color: 'var(--color-text-secondary)' }} />
        )}
        <span style={{ color: 'var(--color-btn-primary-bg)', display: 'inline-flex' }}>
          <Handshake size={18} />
        </span>
        Promise Yourself a Reward
      </button>

      {expanded && (
        <div className="mt-3 space-y-4">
          {isOwnSession ? (
            <>
              <ProposalTermsForm
                value={terms}
                onChange={setTerms}
                familyId={member.family_id}
                audience="self"
              />

              {/* §11 per-reward visibility — private by default */}
              <div>
                <span
                  style={{
                    display: 'block',
                    fontSize: 'var(--font-size-sm)',
                    fontWeight: 600,
                    color: 'var(--color-text-primary)',
                    marginBottom: '0.375rem',
                  }}
                >
                  Who can see this reward?
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {(
                    [
                      { key: 'private', label: 'Just me' },
                      { key: 'shared', label: 'Share with...' },
                    ] as const
                  ).map(opt => {
                    const active = shareMode === opt.key
                    return (
                      <button
                        key={opt.key}
                        type="button"
                        data-testid={`self-propose-visibility-${opt.key}`}
                        onClick={() => setShareMode(opt.key)}
                        style={{
                          flex: 1,
                          padding: '0.5rem',
                          minHeight: '44px',
                          borderRadius: 'var(--vibe-radius-input, 8px)',
                          border: active
                            ? '2px solid var(--color-btn-primary-bg)'
                            : '1px solid var(--color-border)',
                          backgroundColor: active
                            ? 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, var(--color-bg-card))'
                            : 'var(--color-bg-card)',
                          color: 'var(--color-text-primary)',
                          fontSize: 'var(--font-size-sm)',
                          fontWeight: active ? 600 : 400,
                          cursor: 'pointer',
                        }}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>

                {shareMode === 'shared' && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {shareCandidates.map(m => {
                      const selected = sharedWith.includes(m.id)
                      const color = getMemberColor(m)
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() =>
                            setSharedWith(prev =>
                              selected ? prev.filter(id => id !== m.id) : [...prev, m.id],
                            )
                          }
                          className="rounded-full"
                          style={{
                            padding: '0.375rem 0.875rem',
                            minHeight: '40px',
                            fontSize: 'var(--font-size-sm)',
                            fontWeight: 600,
                            backgroundColor: selected ? color : 'transparent',
                            border: `2px solid ${color}`,
                            color: selected ? 'var(--color-text-on-primary, #fff)' : 'var(--color-text-primary)',
                            cursor: 'pointer',
                          }}
                        >
                          {m.display_name.split(' ')[0]}
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              <button
                type="button"
                data-testid="self-propose-setup"
                onClick={() => setSettingUp(terms)}
                disabled={!canSetUp}
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
                  opacity: canSetUp ? 1 : 0.5,
                }}
              >
                Set it up
              </button>
            </>
          ) : (
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              {member.display_name} can promise themself rewards from their own
              login.
            </p>
          )}

          {/* Recent self-promises */}
          {selfProposals.length > 0 && (
            <div className="space-y-1.5" data-testid="self-propose-list">
              <p
                style={{
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 700,
                  color: 'var(--color-text-secondary)',
                  margin: 0,
                }}
              >
                My promises
              </p>
              {selfProposals.map(p => (
                <div
                  key={p.id}
                  className="rounded-lg px-3 py-2"
                  style={{
                    backgroundColor: 'var(--color-bg-secondary)',
                    border: '1px solid var(--color-border)',
                  }}
                >
                  <p
                    className="font-semibold"
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
                    {describeCommitment(p.terms)} &middot;{' '}
                    {new Date(p.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Prefill-confirm: same mechanism as mom's Approve (gate §6) */}
      {settingUp && (
        <ProposalArtifactCreator
          terms={settingUp}
          familyId={member.family_id}
          assigneeId={member.id}
          creatorId={member.id}
          rewardVisibility={shareMode}
          rewardSharedWith={shareMode === 'shared' ? sharedWith : []}
          onCreated={handleArtifactCreated}
          onClose={() => setSettingUp(null)}
        />
      )}
    </section>
  )
}
