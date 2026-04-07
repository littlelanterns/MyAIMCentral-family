/**
 * PRD-18 Mini Evening Rhythm for Guided — Day Highlights
 *
 * Reads today's victories for the Guided member and shows them with
 * kid-friendly framing: "Look at what you did today!"
 *
 * Auto-hides when there are zero victories — but renders a warm empty
 * state instead of disappearing entirely, because the child seeing
 * "nothing recorded" might feel like they did nothing wrong.
 *
 * Reading Support: when the parent has enabled it, a Volume2 icon
 * appears next to the heading and reads it aloud via speechSynthesis.
 */

import { Sparkles, Volume2 } from 'lucide-react'
import { useVictories } from '@/hooks/useVictories'

interface Props {
  memberId: string
  readingSupport?: boolean
  /** Maximum highlights to show. Default 5. */
  maxItems?: number
}

function speak(text: string) {
  if (typeof window === 'undefined' || !window.speechSynthesis) return
  window.speechSynthesis.cancel()
  const utter = new SpeechSynthesisUtterance(text)
  utter.rate = 0.95
  window.speechSynthesis.speak(utter)
}

export function GuidedDayHighlightsSection({ memberId, readingSupport, maxItems = 5 }: Props) {
  const { data: victories = [], isLoading } = useVictories(memberId, { period: 'today' })

  if (isLoading) return null

  const visible = victories.slice(0, maxItems)
  const overflow = victories.length - visible.length
  const heading = victories.length > 0
    ? "Look at what you did today!"
    : "Today is yours."

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-subtle)',
        minHeight: 48,
      }}
    >
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={22} style={{ color: 'var(--color-accent-deep)' }} />
        <h3
          className="text-base font-semibold"
          style={{
            color: 'var(--color-text-heading)',
            fontFamily: 'var(--font-heading)',
          }}
        >
          {heading}
        </h3>
        {readingSupport && (
          <button
            type="button"
            onClick={() => speak(heading)}
            className="ml-auto rounded-md p-1"
            style={{ color: 'var(--color-text-secondary)' }}
            aria-label="Read aloud"
          >
            <Volume2 size={20} />
          </button>
        )}
      </div>

      {victories.length === 0 ? (
        <p className="text-base" style={{ color: 'var(--color-text-secondary)' }}>
          Some days are quiet. That's a kind of brave too.
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map(v => (
            <li
              key={v.id}
              className="flex items-start gap-3 text-base"
              style={{ color: 'var(--color-text-primary)', minHeight: 32 }}
            >
              <span
                className="inline-flex items-center justify-center w-6 h-6 rounded-full flex-shrink-0 mt-0.5"
                style={{
                  background: 'var(--color-accent-deep)',
                  color: 'var(--color-text-on-primary)',
                  fontSize: 14,
                  lineHeight: 1,
                }}
              >
                ✓
              </span>
              <span className="flex-1">{v.description}</span>
            </li>
          ))}
        </ul>
      )}

      {overflow > 0 && (
        <p
          className="mt-3 text-sm"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          and {overflow} more
        </p>
      )}
    </div>
  )
}
