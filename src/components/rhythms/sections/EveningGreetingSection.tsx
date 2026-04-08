/**
 * PRD-18 Evening Section #1: Evening Greeting
 *
 * Personalized warm greeting that opens the evening rhythm. No data,
 * no interaction — just sets the tone.
 *
 * Variants:
 *   'adult' (default) — "How was your day, [Name]?"
 *   'teen'            — "Hey [Name], how'd today go?" (Phase D Enhancement 7)
 */

import { Moon } from 'lucide-react'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'

interface Props {
  /**
   * Greeting variant. Adult is the default; teen variant uses looser,
   * ownership-framed language per PRD-18 Enhancement 7.
   */
  variant?: 'adult' | 'teen'
}

export function EveningGreetingSection({ variant = 'adult' }: Props) {
  const { data: member } = useFamilyMember()
  const { isViewingAs, viewingAsMember } = useViewAs()
  const activeMember = isViewingAs && viewingAsMember ? viewingAsMember : member
  const name = activeMember?.display_name?.split(' ')[0] ?? ''

  const headline =
    variant === 'teen'
      ? `Hey${name ? ` ${name}` : ''}, how'd today go?`
      : `How was your day${name ? `, ${name}` : ''}?`
  const subhead =
    variant === 'teen'
      ? "Let's see what went right and set you up for tomorrow."
      : "Let's notice what went right and set up tomorrow."

  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <div className="flex items-center gap-3">
        <Moon size={22} style={{ color: 'var(--color-accent-deep)' }} />
        <div>
          <h2
            className="text-xl font-semibold"
            style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
          >
            {headline}
          </h2>
          <p
            className="text-sm mt-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {subhead}
          </p>
        </div>
      </div>
    </div>
  )
}
