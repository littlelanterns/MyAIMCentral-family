/**
 * PRD-18 Section Type #11: Encouraging Message (Guided / Play morning rhythm)
 *
 * Warm one-liner at the top of the kid's morning rhythm. Picks a single
 * message from a 20-string pool via date-seeded PRNG so the same kid
 * sees the same message all day, rotates at midnight, and the same
 * member doesn't see two days in a row by chance.
 *
 * Phase B implementation: static rotating pool. Per PRD-18 §Section
 * Type #11 the message can be "LiLa-generated or pre-written warm
 * message" — when PRD-05 day-data context is built, this component
 * can swap pickOne() for a Haiku call that reads yesterday's
 * victories/intentions and writes a personalized line. The component
 * interface stays the same.
 *
 * Reading Support: when enabled, a Volume2 icon reads the message
 * aloud via window.speechSynthesis. Same pattern as the other Guided
 * sections (Pride, Reflections, Tomorrow, Day Highlights).
 *
 * The 20 messages are intentionally:
 *   - low-pressure (never assume the day will go a particular way)
 *   - generic across ages 8-12
 *   - never reference specific events ("yesterday you...") because
 *     the static pool doesn't have that context
 *   - warm without being saccharine
 *   - single sentence, ≤ 14 words after name substitution
 *
 * The {name} placeholder is substituted with the member's display_name
 * before render. If the member has no display_name (shouldn't happen
 * in practice), falls back to "friend".
 */

import { useMemo } from 'react'
import { Sun, Volume2 } from 'lucide-react'
import { useFamilyMembers } from '@/hooks/useFamilyMember'
import { rhythmSeed, pickOne } from '@/lib/rhythm/dateSeedPrng'

interface Props {
  familyId: string
  memberId: string
  readingSupport?: boolean
}

// 20 warm, low-pressure messages with {name} placeholder.
// Authored 2026-04-07. Edit freely — same kid sees same one all day,
// rotates at midnight via date-seeded PRNG.
const ENCOURAGING_MESSAGES = [
  "Good morning, {name}. Today is a fresh start.",
  "Hi {name}! You belong here.",
  "Morning, {name}. Small steps add up to big things.",
  "{name}, you are stronger than you think.",
  "Good morning, {name}! Be kind to yourself today.",
  "Hey {name} — your effort counts even when no one sees it.",
  "{name}, today is yours to make.",
  "Morning, {name}! One thing at a time.",
  "Good morning, {name}. You don't have to be perfect — just be you.",
  "{name}, you make your family better just by being you.",
  "Morning, {name}! Today, look for one good thing.",
  "Hi {name} — you've got everything you need to start.",
  "Good morning, {name}. Hard things are easier when you take the first step.",
  "{name}, your kindness is one of your superpowers.",
  "Morning, {name}! Curiosity is a gift — use it today.",
  "Hi {name}! It's okay to ask for help. That's how we grow.",
  "Good morning, {name}. Today, you get to choose how you show up.",
  "{name}, the world is more interesting because you're in it.",
  "Morning, {name}! You can do hard things, even if they take a while.",
  "Hi {name} — today is going to teach you something. Let it.",
] as const

function speak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.rate = 0.95
  window.speechSynthesis.speak(utter)
}

export function GuidedEncouragingMessageSection({
  familyId,
  memberId,
  readingSupport,
}: Props) {
  const { data: members = [] } = useFamilyMembers(familyId)
  const member = members.find(m => m.id === memberId)
  const name = member?.display_name?.split(' ')[0] ?? 'friend'

  // Date-seeded rotation — same kid sees the same message all day,
  // rotates at midnight, deterministic via the existing PRNG helper.
  const message = useMemo(() => {
    const seed = rhythmSeed(memberId, 'morning:encouraging')
    const template =
      pickOne(ENCOURAGING_MESSAGES as unknown as string[], seed) ??
      ENCOURAGING_MESSAGES[0]
    return template.replace('{name}', name)
  }, [memberId, name])

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: 'color-mix(in srgb, var(--color-accent-deep) 8%, transparent)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <div className="flex items-start gap-3">
        <Sun
          size={20}
          style={{
            color: 'var(--color-accent-deep)',
            flexShrink: 0,
            marginTop: 2,
          }}
        />
        <p
          className="text-base flex-1"
          style={{
            color: 'var(--color-text-primary)',
            fontFamily: 'var(--font-heading)',
          }}
        >
          {message}
        </p>
        {readingSupport && (
          <button
            type="button"
            onClick={() => speak(message)}
            className="flex-shrink-0 opacity-70 hover:opacity-100"
            aria-label="Read aloud"
          >
            <Volume2 size={18} style={{ color: 'var(--color-accent-deep)' }} />
          </button>
        )}
      </div>
    </div>
  )
}
