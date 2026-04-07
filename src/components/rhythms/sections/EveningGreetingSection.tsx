/**
 * PRD-18 Evening Section #1: Evening Greeting
 *
 * Personalized warm greeting that opens the evening rhythm. No data,
 * no interaction — just sets the tone. "How was your day, [Name]?"
 */

import { Moon } from 'lucide-react'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'

export function EveningGreetingSection() {
  const { data: member } = useFamilyMember()
  const { isViewingAs, viewingAsMember } = useViewAs()
  const activeMember = isViewingAs && viewingAsMember ? viewingAsMember : member
  const name = activeMember?.display_name?.split(' ')[0] ?? ''

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
            How was your day{name ? `, ${name}` : ''}?
          </h2>
          <p
            className="text-sm mt-1"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Let's notice what went right and set up tomorrow.
          </p>
        </div>
      </div>
    </div>
  )
}
