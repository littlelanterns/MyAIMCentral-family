/**
 * PlannedExpansionCard (PRD-32A)
 *
 * Enhanced demand validation card with three sections:
 * 1. Vision Description — what the feature will do (from feature_expansion_registry)
 * 2. Demand Validation — Yes/No vote + optional freeform note
 * 3. Anticipation Builder — "Notify me when it's ready" toggle
 *
 * Warm styling: Warm Cream background, Soft Gold accent border, Sparkles icon.
 * Feels like discovering something exciting, not hitting a wall.
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles, ThumbsUp, ThumbsDown, Send, Check, Bell, BellOff, Map } from 'lucide-react'
import { FEATURE_EXPANSION_REGISTRY } from '@/config/feature_expansion_registry'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { useTheme } from '@/lib/theme'
import { getFeatureIcon } from '@/lib/assets'
import { FeatureGuide } from './FeatureGuide'

interface PlannedExpansionCardProps {
  featureKey: string
}

export function PlannedExpansionCard({ featureKey }: PlannedExpansionCardProps) {
  const { data: member } = useFamilyMember()
  const { isViewingAs, realViewerId } = useViewAs()
  const entry = FEATURE_EXPANSION_REGISTRY[featureKey]

  const { vibe } = useTheme()
  const [heroUrl, setHeroUrl] = useState<string | null>(null)
  const [vote, setVote] = useState<boolean | null>(null)
  const [note, setNote] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [showNoteField, setShowNoteField] = useState(false)
  const [previousVote, setPreviousVote] = useState<boolean | null>(null)
  const [notifyEnabled, setNotifyEnabled] = useState(false)
  const [notifySubmitted, setNotifySubmitted] = useState(false)

  // Fetch illustrated hero image for this feature
  useEffect(() => {
    let cancelled = false
    getFeatureIcon(featureKey, vibe, 'A', 128).then(url => {
      if (!cancelled) setHeroUrl(url)
    })
    return () => { cancelled = true }
  }, [featureKey, vibe])

  // Silent no-op if feature key not in registry
  if (!entry) return null

  // Hide for guided/play shells
  const dashboardMode = member?.dashboard_mode
  if (dashboardMode === 'guided' || dashboardMode === 'play') return null

  // Load previous vote
  useEffect(() => {
    if (!member?.id) return

    supabase
      .from('feature_demand_responses')
      .select('vote, freeform_note')
      .eq('family_member_id', member.id)
      .eq('feature_key', featureKey)
      .order('responded_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setPreviousVote(data[0].vote)
          setVote(data[0].vote)
          if (data[0].freeform_note) {
            setNote(data[0].freeform_note)
          }
          setSubmitted(true)
        }
      })

    // Load notification preference
    supabase
      .from('notification_preferences')
      .select('is_enabled')
      .eq('member_id', member.id)
      .eq('category', `feature_launch_${featureKey}`)
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setNotifyEnabled(data[0].is_enabled)
          setNotifySubmitted(true)
        }
      })
  }, [member?.id, featureKey])

  const handleVote = async (isYes: boolean) => {
    if (!member?.id || !member?.family_id) return

    setVote(isYes)
    if (isYes) {
      setShowNoteField(true)
    } else {
      setShowNoteField(false)
      await insertVote(false, null)
      setSubmitted(true)
    }
  }

  const handleSubmitNote = async () => {
    if (!member?.id || !member?.family_id) return
    await insertVote(true, note.trim() || null)
    setSubmitted(true)
    setShowNoteField(false)
  }

  async function insertVote(voteValue: boolean, freeformNote: string | null) {
    if (!member?.id || !member?.family_id) return

    await supabase.from('feature_demand_responses').insert({
      family_id: member.family_id,
      family_member_id: member.id,
      feature_key: featureKey,
      vote: voteValue,
      freeform_note: freeformNote,
      voted_via_view_as: isViewingAs,
      actual_voter_id: isViewingAs && realViewerId ? realViewerId : null,
    })
  }

  const handleNotifyToggle = async () => {
    if (!member?.id || !member?.family_id) return

    const newValue = !notifyEnabled
    setNotifyEnabled(newValue)

    if (notifySubmitted) {
      await supabase
        .from('notification_preferences')
        .update({ is_enabled: newValue })
        .eq('member_id', member.id)
        .eq('category', `feature_launch_${featureKey}`)
    } else {
      await supabase.from('notification_preferences').insert({
        family_id: member.family_id,
        member_id: member.id,
        category: `feature_launch_${featureKey}`,
        is_enabled: newValue,
        channel: 'in_app',
      })
      setNotifySubmitted(true)
    }
  }

  return (
    <div className="space-y-4">
      {/* FeatureGuide for demand validation concept */}
      <FeatureGuide
        featureKey={`demand_validation_${featureKey}`}
        title="Help shape MyAIM"
        description="Features on this page are on our roadmap. Tell us which ones matter most to your family — your votes directly influence what we build next!"
        bullets={[
          'Vote on features you\'re excited about',
          'Tell us what you\'d love the feature to do',
          'Get notified the moment it launches',
        ]}
      />

      {/* Main Card */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: 'var(--color-warm-cream, #FFF4EC)',
          border: '1.5px solid var(--color-soft-gold, #F4DCB7)',
          borderRadius: 'var(--vibe-radius-card, 0.75rem)',
        }}
      >
        {/* ── Hero image (illustrated vibes only) ── */}
        {heroUrl && (
          <div className="flex justify-center py-4" style={{ backgroundColor: 'var(--color-soft-gold, #F4DCB7)', opacity: 0.35 }}>
            <img src={heroUrl} alt={entry.name} width={128} height={128} className="rounded-lg" />
          </div>
        )}

        {/* ── Section 1: Vision Description ── */}
        <div className="p-5 pb-4">
          <div className="flex items-start gap-3">
            {!heroUrl && (
              <div
                className="mt-0.5 shrink-0 rounded-lg p-2"
                style={{ backgroundColor: 'var(--color-golden-honey, #D6A461)', opacity: 0.15 }}
              >
                <Sparkles size={20} style={{ color: 'var(--color-golden-honey, #D6A461)' }} />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1.5">
                <h3 className="text-base font-semibold" style={{ color: 'var(--color-warm-earth, #6B4E3D)' }}>
                  {entry.name}
                </h3>
                <span
                  className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider"
                  style={{
                    backgroundColor: 'var(--color-golden-honey, #D6A461)',
                    color: 'white',
                  }}
                >
                  On our roadmap
                </span>
              </div>
              <p
                className="text-sm leading-relaxed"
                style={{ color: 'var(--color-warm-earth, #6B4E3D)', opacity: 0.75 }}
              >
                {entry.description}
              </p>
              {entry.location_hint && (
                <p className="mt-1.5 text-xs" style={{ color: 'var(--color-warm-earth, #6B4E3D)', opacity: 0.45 }}>
                  {entry.location_hint}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--color-soft-gold, #F4DCB7)', opacity: 0.6 }} />

        {/* ── Section 2: Demand Validation ── */}
        <div className="px-5 py-4">
          {submitted && previousVote !== null ? (
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-warm-earth, #6B4E3D)', opacity: 0.6 }}>
              <Check size={16} style={{ color: 'var(--color-sage-teal, #68a395)' }} />
              <span>
                You said <strong>{previousVote ? 'yes, definitely!' : 'not right now'}</strong> — thanks for the input!
              </span>
            </div>
          ) : submitted ? (
            <div className="flex items-center gap-2 text-sm" style={{ color: 'var(--color-sage-teal, #68a395)' }}>
              <Check size={16} />
              <span>Thanks for your input!</span>
            </div>
          ) : (
            <>
              <p className="text-sm font-medium mb-2.5" style={{ color: 'var(--color-warm-earth, #6B4E3D)', opacity: 0.85 }}>
                Would this be useful for your family?
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleVote(true)}
                  className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all"
                  style={{
                    backgroundColor: vote === true ? 'var(--color-sage-teal, #68a395)' : 'var(--color-sage-teal, #68a395)',
                    color: 'white',
                    opacity: vote === true ? 1 : 0.85,
                    transform: vote === true ? 'scale(1.02)' : 'scale(1)',
                  }}
                >
                  <ThumbsUp size={14} />
                  Yes, definitely!
                </button>
                <button
                  onClick={() => handleVote(false)}
                  className="flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-all"
                  style={{
                    backgroundColor: vote === false ? 'var(--color-warm-earth, #6B4E3D)' : 'transparent',
                    color: vote === false ? 'white' : 'var(--color-warm-earth, #6B4E3D)',
                    border: vote === false ? 'none' : '1px solid var(--color-warm-earth, #6B4E3D)',
                    opacity: vote === false ? 0.7 : 0.4,
                  }}
                >
                  <ThumbsDown size={14} />
                  Not right now
                </button>
              </div>
            </>
          )}

          {/* Freeform note field */}
          {showNoteField && !submitted && (
            <div className="mt-3">
              <label className="block text-xs mb-1" style={{ color: 'var(--color-warm-earth, #6B4E3D)', opacity: 0.5 }}>
                What would you hope this does? (optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 500))}
                placeholder="Tell us what you'd love this to do..."
                rows={3}
                className="w-full rounded-lg px-3 py-2 text-sm outline-none resize-none"
                style={{
                  backgroundColor: 'white',
                  border: '1px solid var(--color-soft-gold, #F4DCB7)',
                  color: 'var(--color-warm-earth, #6B4E3D)',
                }}
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs" style={{ color: 'var(--color-warm-earth, #6B4E3D)', opacity: 0.3 }}>
                  {note.length}/500
                </span>
                <button
                  onClick={handleSubmitNote}
                  className="flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-sm font-medium text-white transition-colors"
                  style={{ backgroundColor: 'var(--color-sage-teal, #68a395)' }}
                >
                  <Send size={14} />
                  Submit
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Divider */}
        <div style={{ borderTop: '1px solid var(--color-soft-gold, #F4DCB7)', opacity: 0.6 }} />

        {/* ── Section 3: Anticipation Builder ── */}
        <div className="px-5 py-3">
          <button
            onClick={handleNotifyToggle}
            className="flex items-center gap-2.5 w-full text-left group"
          >
            <div
              className="shrink-0 w-10 h-5 rounded-full relative transition-colors"
              style={{
                backgroundColor: notifyEnabled
                  ? 'var(--color-sage-teal, #68a395)'
                  : 'var(--color-warm-earth, #6B4E3D)',
                opacity: notifyEnabled ? 1 : 0.2,
              }}
            >
              <div
                className="absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform"
                style={{ left: notifyEnabled ? '1.25rem' : '0.125rem' }}
              />
            </div>
            <div className="flex items-center gap-1.5">
              {notifyEnabled ? (
                <Bell size={14} style={{ color: 'var(--color-sage-teal, #68a395)' }} />
              ) : (
                <BellOff size={14} style={{ color: 'var(--color-warm-earth, #6B4E3D)', opacity: 0.4 }} />
              )}
              <span
                className="text-sm"
                style={{
                  color: notifyEnabled
                    ? 'var(--color-sage-teal, #68a395)'
                    : 'var(--color-warm-earth, #6B4E3D)',
                  opacity: notifyEnabled ? 1 : 0.5,
                }}
              >
                {notifyEnabled
                  ? "We'll let you know the moment it's ready!"
                  : 'Get notified when this launches'}
              </span>
            </div>
          </button>
        </div>

        {/* ── Lantern's Path link ── */}
        <div className="px-5 pb-4">
          <Link
            to="/lanterns-path"
            className="flex items-center gap-1.5 text-xs font-medium"
            style={{ color: 'var(--color-warm-earth, #6B4E3D)', opacity: 0.55 }}
          >
            <Map size={12} />
            Learn more in The Lantern's Path
          </Link>
        </div>
      </div>
    </div>
  )
}
