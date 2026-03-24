import { useState, useEffect } from 'react'
import { Sparkles, ThumbsUp, ThumbsDown, Send, Check } from 'lucide-react'
import { FEATURE_EXPANSION_REGISTRY } from '@/config/feature_expansion_registry'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'

interface PlannedExpansionCardProps {
  featureKey: string
}

export function PlannedExpansionCard({ featureKey }: PlannedExpansionCardProps) {
  const { data: member } = useFamilyMember()
  const entry = FEATURE_EXPANSION_REGISTRY[featureKey]

  const [vote, setVote] = useState<boolean | null>(null)
  const [note, setNote] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [showNoteField, setShowNoteField] = useState(false)
  const [previousVote, setPreviousVote] = useState<boolean | null>(null)

  // Silent no-op if feature key not in registry
  if (!entry) return null

  // Hide for guided/play shells (checked via role)
  const role = member?.role
  if (role === 'guided' || role === 'play') return null

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
  }, [member?.id, featureKey])

  const handleVote = async (isYes: boolean) => {
    if (!member?.id || !member?.family_id) return

    setVote(isYes)
    if (isYes) {
      setShowNoteField(true)
    } else {
      setShowNoteField(false)
      // Submit "no" vote immediately
      await supabase.from('feature_demand_responses').insert({
        family_id: member.family_id,
        family_member_id: member.id,
        feature_key: featureKey,
        vote: false,
        voted_via_view_as: false,
      })
      setSubmitted(true)
    }
  }

  const handleSubmitNote = async () => {
    if (!member?.id || !member?.family_id) return

    await supabase.from('feature_demand_responses').insert({
      family_id: member.family_id,
      family_member_id: member.id,
      feature_key: featureKey,
      vote: true,
      freeform_note: note.trim() || null,
      voted_via_view_as: false,
    })
    setSubmitted(true)
    setShowNoteField(false)
  }

  return (
    <div className="rounded-xl border border-dashed border-[var(--color-golden-honey)]/40 bg-[var(--color-soft-gold)]/10 p-6">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0 rounded-lg bg-[var(--color-golden-honey)]/15 p-2">
          <Sparkles size={20} className="text-[var(--color-golden-honey)]" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="mb-1 text-xs font-medium uppercase tracking-wider text-[var(--color-golden-honey)]">
            Coming Soon
          </div>
          <h3 className="text-base font-semibold text-[var(--color-warm-earth)] mb-1.5">
            {entry.name}
          </h3>
          <p className="text-sm text-[var(--color-warm-earth)]/65 leading-relaxed">
            {entry.description}
          </p>

          {submitted && previousVote !== null ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-[var(--color-warm-earth)]/50">
              <Check size={16} className="text-[var(--color-sage-teal)]" />
              <span>
                You said{' '}
                <strong>{previousVote ? 'yes' : "not right now"}</strong>
                {' '}— thanks for the input!
              </span>
            </div>
          ) : submitted ? (
            <div className="mt-4 flex items-center gap-2 text-sm text-[var(--color-sage-teal)]">
              <Check size={16} />
              <span>Thanks for your input!</span>
            </div>
          ) : (
            <>
              <p className="mt-4 text-sm font-medium text-[var(--color-warm-earth)]/75">
                Would this be helpful for your family?
              </p>
              <div className="mt-2 flex items-center gap-2">
                <button
                  onClick={() => handleVote(true)}
                  className={`
                    flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors
                    ${vote === true
                      ? 'bg-[var(--color-sage-teal)] text-white'
                      : 'bg-[var(--color-sage-teal)]/10 text-[var(--color-sage-teal)] hover:bg-[var(--color-sage-teal)]/20'
                    }
                  `}
                >
                  <ThumbsUp size={14} />
                  Yes
                </button>
                <button
                  onClick={() => handleVote(false)}
                  className={`
                    flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors
                    ${vote === false
                      ? 'bg-[var(--color-warm-earth)]/20 text-[var(--color-warm-earth)]'
                      : 'bg-[var(--color-warm-earth)]/5 text-[var(--color-warm-earth)]/50 hover:bg-[var(--color-warm-earth)]/10'
                    }
                  `}
                >
                  <ThumbsDown size={14} />
                  Not right now
                </button>
              </div>
            </>
          )}

          {showNoteField && !submitted && (
            <div className="mt-3">
              <label className="block text-xs text-[var(--color-warm-earth)]/50 mb-1">
                What would you hope its capabilities would be? (optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value.slice(0, 500))}
                placeholder="Tell us what you'd love this to do..."
                rows={3}
                className="w-full rounded-lg border border-[var(--color-warm-earth)]/15 bg-white/60 px-3 py-2 text-sm text-[var(--color-warm-earth)] placeholder:text-[var(--color-warm-earth)]/30 focus:border-[var(--color-sage-teal)] focus:outline-none focus:ring-1 focus:ring-[var(--color-sage-teal)]/30"
              />
              <div className="mt-2 flex items-center justify-between">
                <span className="text-xs text-[var(--color-warm-earth)]/30">
                  {note.length}/500
                </span>
                <button
                  onClick={handleSubmitNote}
                  className="flex items-center gap-1.5 rounded-lg bg-[var(--color-sage-teal)] px-4 py-1.5 text-sm font-medium text-white hover:bg-[var(--color-deep-ocean)] transition-colors"
                >
                  <Send size={14} />
                  Submit
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
