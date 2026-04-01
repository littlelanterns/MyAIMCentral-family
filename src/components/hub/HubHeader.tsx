/**
 * HubHeader — PRD-14D Family Hub
 *
 * Only rendered in 'standalone' context.
 * Left: Member drawer pull tab (scrolls to member access section)
 * Center: Hub title (from config or "[Family Name] Hub" default)
 * Right: Frame toggle (opens slideshow) + settings gear
 */

import { Settings, Frame } from 'lucide-react'
import { useFamily } from '@/hooks/useFamily'
import { useFamilyHubConfig } from '@/hooks/useFamilyHubConfig'

interface HubHeaderProps {
  onSettingsClick?: () => void
  onFrameClick?: () => void
}

export function HubHeader({ onSettingsClick, onFrameClick }: HubHeaderProps) {
  const { data: family } = useFamily()
  const { data: config } = useFamilyHubConfig(family?.id)

  const title = config?.hub_title || (family?.family_name ? `${family.family_name} Hub` : 'Family Hub')

  return (
    <header
      className="flex items-center justify-between px-4 py-3 sticky top-0 z-30"
      data-testid="hub-header"
      style={{
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-bg-card)',
      }}
    >
      {/* Left spacer (member access is via left-edge pull tab) */}
      <div style={{ width: 44 }} />

      {/* Center: Title */}
      <h1
        className="text-lg font-bold text-center truncate mx-2"
        style={{
          color: 'var(--color-text-heading)',
          fontFamily: 'var(--font-heading)',
        }}
      >
        {title}
      </h1>

      {/* Right: Frame toggle + Settings gear */}
      <div className="flex items-center gap-1">
        <button
          onClick={onFrameClick}
          className="flex items-center justify-center rounded-lg transition-colors"
          style={{
            width: 44,
            height: 44,
            color: 'var(--color-text-secondary)',
            backgroundColor: 'transparent',
          }}
          title="Slideshow frame"
          aria-label="Frame toggle"
        >
          <Frame size={20} />
        </button>

        <button
          onClick={onSettingsClick}
          className="flex items-center justify-center rounded-lg transition-colors"
          style={{
            width: 44,
            height: 44,
            color: 'var(--color-text-secondary)',
            backgroundColor: 'transparent',
          }}
          title="Hub Settings"
          aria-label="Hub Settings"
        >
          <Settings size={20} />
        </button>
      </div>
    </header>
  )
}
