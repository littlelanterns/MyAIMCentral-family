/**
 * ConnectionOffersPanel — Collapsed expandable "Connect this to other features"
 *
 * Shows contextual connection options based on what's being created.
 * Hidden when nothing is available to connect to. No empty expandable,
 * no "coming soon" — just absent.
 *
 * Per addendum Decision #1 (Hole #1): also usable in normal edit views
 * as a collapsed expandable section at the bottom of edit forms.
 */

import { useState } from 'react'
import { ChevronDown, ChevronUp, Link2 } from 'lucide-react'

export type ConnectionOffer = {
  key: string
  label: string
  description: string
  checked: boolean
}

export type ItemContext =
  | 'list'
  | 'tracker'
  | 'task'
  | 'routine'
  | 'opportunity'
  | 'sequential'
  | 'randomizer'

/**
 * Returns the available connection offers for a given item context.
 * Returns empty array when nothing is connectable — the panel won't render.
 */
export function getConnectionOffers(context: ItemContext): ConnectionOffer[] {
  switch (context) {
    case 'tracker':
      return [
        { key: 'allowance', label: 'Count toward allowance?', description: 'Completions that increment this tracker will also count in allowance calculations.', checked: false },
        { key: 'victory', label: 'Record victories?', description: 'Reaching the goal will automatically record a victory.', checked: false },
        { key: 'rhythm_morning', label: 'Show in morning rhythm?', description: 'This tracker will appear in morning rhythm sections.', checked: false },
        { key: 'rhythm_evening', label: 'Show in evening rhythm?', description: 'This tracker will appear in evening rhythm sections.', checked: false },
        { key: 'reward_reveal', label: 'Add a reward reveal?', description: 'A celebration animation plays when the goal is reached.', checked: false },
      ]
    case 'list':
      return [
        { key: 'share_family', label: 'Share with family members?', description: 'Other family members can view or edit this list.', checked: false },
        { key: 'victory_on_complete', label: 'Victory when all done?', description: 'Checking off every item records a victory.', checked: false },
      ]
    case 'task':
      return [
        { key: 'allowance', label: 'Count toward allowance?', description: 'Completing this task contributes to allowance calculations.', checked: false },
        { key: 'homework', label: 'Count toward homework?', description: 'Completing this task logs homework time.', checked: false },
        { key: 'gamification', label: 'Earn gamification points?', description: 'Completing this task earns points for the assigned member.', checked: true },
      ]
    case 'routine':
      return [
        { key: 'streak', label: 'Track a streak?', description: 'A streak counter shows how many consecutive days the routine was completed.', checked: false },
        { key: 'gamification', label: 'Earn points per step?', description: 'Each completed step earns gamification points.', checked: true },
      ]
    case 'opportunity':
      return [
        { key: 'allowance', label: 'Count toward allowance?', description: 'Earnings from these jobs count in allowance calculations.', checked: false },
        { key: 'tally_tracker', label: 'Deploy an earnings tracker?', description: 'A dashboard tracker widget that shows total earnings.', checked: false },
      ]
    case 'sequential':
      return [
        { key: 'routine_link', label: 'Link to a routine step?', description: 'The current item appears inside a daily routine as a linked step.', checked: false },
        { key: 'streak', label: 'Add a streak counter?', description: 'Track consecutive days of working through this sequence.', checked: false },
      ]
    case 'randomizer':
      return [
        { key: 'routine_link', label: 'Link to a routine step?', description: 'Auto-draw an item daily as part of a routine.', checked: false },
        { key: 'spinner_widget', label: 'Deploy a spinner widget?', description: 'A dashboard spinner widget for drawing from this list.', checked: false },
      ]
    default:
      return []
  }
}

interface ConnectionOffersPanelProps {
  context: ItemContext
  connections: Record<string, boolean>
  onChange: (connections: Record<string, boolean>) => void
}

export function ConnectionOffersPanel({
  context,
  connections,
  onChange,
}: ConnectionOffersPanelProps) {
  const [expanded, setExpanded] = useState(false)

  const offers = getConnectionOffers(context)

  // Don't render if nothing available
  if (offers.length === 0) return null

  const activeCount = Object.values(connections).filter(Boolean).length

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{
        border: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-bg-secondary)',
      }}
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium transition-colors"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        <span className="flex items-center gap-2">
          <Link2 size={14} style={{ color: 'var(--color-text-muted)' }} />
          Connect this to other features
          {activeCount > 0 && (
            <span
              className="text-xs px-1.5 py-0.5 rounded-full"
              style={{
                backgroundColor: 'var(--color-btn-primary-bg)',
                color: 'var(--color-btn-primary-text)',
              }}
            >
              {activeCount}
            </span>
          )}
        </span>
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {offers.map((offer) => {
            const isChecked = connections[offer.key] ?? offer.checked
            return (
              <label
                key={offer.key}
                className="flex items-start gap-2.5 cursor-pointer py-1"
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={(e) =>
                    onChange({ ...connections, [offer.key]: e.target.checked })
                  }
                  className="mt-0.5 rounded"
                  style={{ accentColor: 'var(--color-btn-primary-bg)' }}
                />
                <div>
                  <div
                    className="text-sm font-medium"
                    style={{ color: 'var(--color-text-primary)' }}
                  >
                    {offer.label}
                  </div>
                  <div
                    className="text-xs mt-0.5"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {offer.description}
                  </div>
                </div>
              </label>
            )
          })}
        </div>
      )}
    </div>
  )
}
