/**
 * FamilyHub — PRD-14D Family Hub
 *
 * The shared family surface. Renders differently based on context:
 * - 'standalone': Full viewport with own header, member access section visible.
 * - 'tab': Inline in dashboard perspective switcher, no header, member access hidden.
 *
 * Reads useFamilyHubConfig for section order and visibility.
 * Auto-creates config via upsert if none exists.
 * Sections are NOT collapsible. Visibility controlled via Hub Settings only.
 */

import { useState, useEffect, useMemo } from 'react'
import { Sparkles, Home, Settings, Frame } from 'lucide-react'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import {
  useFamilyHubConfig,
  useUpdateFamilyHubConfig,
  DEFAULT_SECTION_ORDER,
  type HubSectionKey,
} from '@/hooks/useFamilyHubConfig'
import { useFamilyBestIntentions } from '@/hooks/useFamilyBestIntentions'
import { useVisibleCountdowns } from '@/hooks/useCountdowns'

import { HubHeader } from './HubHeader'
import { HubSettings } from './HubSettings'
import { SlideshowOverlay } from './SlideshowOverlay'
import { HubCalendarSection } from './sections/HubCalendarSection'
import { HubBestIntentionsSection } from './sections/HubBestIntentionsSection'
import { HubCountdownsSection } from './sections/HubCountdownsSection'
import { HubVictoriesSummarySection } from './sections/HubVictoriesSummarySection'
import { HubMemberAccessSection } from './sections/HubMemberAccessSection'

// ─── Types ────────────────────────────────────────────────────────────────────

interface FamilyHubProps {
  context: 'standalone' | 'tab'
}

// ─── Onboarding Card ──────────────────────────────────────────────────────────

function HubOnboardingCard({ onDismiss }: { onDismiss: () => void }) {
  return (
    <div
      className="rounded-lg p-4"
      data-testid="hub-onboarding"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, var(--color-bg-card))',
        border: '1px solid color-mix(in srgb, var(--color-btn-primary-bg) 20%, transparent)',
      }}
    >
      <div className="flex items-start gap-3">
        <Sparkles size={20} className="shrink-0 mt-0.5" style={{ color: 'var(--color-btn-primary-bg)' }} />
        <div>
          <p
            className="text-sm font-medium mb-1"
            style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
          >
            Welcome to your Family Hub!
          </p>
          <p className="text-xs" style={{ color: 'var(--color-text-primary)' }}>
            This is your shared family surface. Add family intentions,
            countdowns, and calendar events to bring everyone together.
            Set it up on a shared tablet or TV for the whole family to see.
          </p>
          <button
            onClick={onDismiss}
            className="mt-2 text-xs font-medium"
            style={{ color: 'var(--color-btn-primary-bg)' }}
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Section Renderer ─────────────────────────────────────────────────────────

function HubSectionRenderer({
  sectionKey,
  context,
  currentMemberId,
  isMom,
}: {
  sectionKey: HubSectionKey
  context: 'standalone' | 'tab'
  currentMemberId?: string
  isMom: boolean
}) {
  switch (sectionKey) {
    case 'family_calendar':
      return <HubCalendarSection />
    case 'family_vision':
      // PRD-12B dependency — hidden when no data (which is always until PRD-12B is built)
      return null
    case 'family_best_intentions':
      return (
        <HubBestIntentionsSection
          context={context}
          currentMemberId={currentMemberId}
          isMom={isMom}
        />
      )
    case 'countdowns':
      return <HubCountdownsSection />
    case 'victories_summary':
      return <HubVictoriesSummarySection />
    case 'widget_grid':
      return null // Wired when PRD-10 Hub widget deployment is built
    case 'member_access':
      if (context !== 'standalone') return null
      return <HubMemberAccessSection />
    default:
      return null
  }
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function FamilyHub({ context }: FamilyHubProps) {
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { data: config, isLoading: configLoading } = useFamilyHubConfig(family?.id)
  const updateConfig = useUpdateFamilyHubConfig()

  // Data queries for onboarding detection
  const { data: intentions } = useFamilyBestIntentions(family?.id)
  const { data: countdowns } = useVisibleCountdowns(family?.id)

  const isMom = member?.role === 'primary_parent'
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [slideshowOpen, setSlideshowOpen] = useState(false)

  // Auto-create config on first access (upsert)
  useEffect(() => {
    if (!family?.id || configLoading || config) return
    updateConfig.mutate({
      familyId: family.id,
      sectionOrder: [...DEFAULT_SECTION_ORDER],
      sectionVisibility: Object.fromEntries(DEFAULT_SECTION_ORDER.map((k) => [k, true])),
    })
  }, [family?.id, config, configLoading, updateConfig])

  // Determine section order and visibility
  const sectionOrder = useMemo(() => {
    if (config?.section_order && config.section_order.length > 0) {
      return config.section_order
    }
    return [...DEFAULT_SECTION_ORDER]
  }, [config?.section_order])

  const sectionVisibility = config?.section_visibility ?? {}

  const isSectionVisible = (key: string): boolean => {
    return sectionVisibility[key] !== false
  }

  // Onboarding state
  const isFirstTime =
    !configLoading &&
    (!intentions || intentions.length === 0) &&
    (!countdowns || countdowns.length === 0)
  const onboardingDismissed = (config?.preferences as Record<string, unknown>)?.onboarding_dismissed === true

  const handleDismissOnboarding = () => {
    if (!family?.id) return
    updateConfig.mutate({
      familyId: family.id,
      preferences: {
        ...((config?.preferences as Record<string, unknown>) ?? {}),
        onboarding_dismissed: true,
      },
    })
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  if (!family?.id || !member?.id) {
    return (
      <div className="flex items-center justify-center py-12">
        <div
          className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin"
          style={{ borderColor: 'var(--color-btn-primary-bg)', borderTopColor: 'transparent' }}
        />
      </div>
    )
  }

  return (
    <div
      className="density-compact"
      data-testid="family-hub"
      style={{
        backgroundColor: context === 'standalone' ? 'var(--color-bg-page)' : undefined,
        minHeight: context === 'standalone' ? '100vh' : undefined,
      }}
    >
      {/* Header — standalone only */}
      {context === 'standalone' && (
        <HubHeader
          onSettingsClick={() => isMom && setSettingsOpen(true)}
          onMembersClick={() => {
            const el = document.querySelector('[data-testid="hub-member-access-section"]')
            el?.scrollIntoView({ behavior: 'smooth' })
          }}
          onFrameClick={() => setSlideshowOpen(true)}
        />
      )}

      {/* Slideshow Overlay */}
      <SlideshowOverlay isOpen={slideshowOpen} onClose={() => setSlideshowOpen(false)} />

      {/* Tab context: frame + settings controls */}
      {context === 'tab' && (
        <div className="flex justify-end gap-1 px-4 pt-2">
          <button
            onClick={() => setSlideshowOpen(true)}
            className="p-2 rounded-lg"
            style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
            title="Slideshow frame"
          >
            <Frame size={18} />
          </button>
          {isMom && (
            <button
              onClick={() => setSettingsOpen(true)}
              className="p-2 rounded-lg"
              style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
              title="Hub Settings"
            >
              <Settings size={18} />
            </button>
          )}
        </div>
      )}

      {/* Hub Settings Modal — mom only */}
      {isMom && (
        <HubSettings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      )}

      {/* Main content area */}
      <div className="px-4 py-4 space-y-4 max-w-3xl mx-auto">
        {/* Onboarding card */}
        {isFirstTime && !onboardingDismissed && (
          <HubOnboardingCard onDismiss={handleDismissOnboarding} />
        )}

        {/* Sections in config order — visibility controlled via Settings only */}
        {sectionOrder.map((key) => {
          if (!isSectionVisible(key)) return null
          return (
            <HubSectionRenderer
              key={key}
              sectionKey={key as HubSectionKey}
              context={context}
              currentMemberId={member.id}
              isMom={isMom}
            />
          )
        })}

        {/* Empty state — all sections hidden */}
        {sectionOrder.every((key) => !isSectionVisible(key)) && (
          <div
            className="rounded-lg p-8 text-center"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
            }}
          >
            <Home size={32} className="mx-auto mb-3" style={{ color: 'var(--color-text-secondary)' }} />
            <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              All sections are hidden. Open Hub Settings to choose what to display.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
