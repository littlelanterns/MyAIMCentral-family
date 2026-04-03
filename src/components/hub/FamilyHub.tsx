/**
 * FamilyHub — PRD-14D Family Hub
 *
 * The shared family surface. Renders differently based on context:
 * - 'standalone': Full viewport with own header, member access section visible.
 * - 'tab': Inline in dashboard perspective switcher, no header, member access hidden.
 *
 * Reads useFamilyHubConfig for section order and visibility.
 * Long-press enters edit mode (mom only, disabled in Hub Mode).
 * Edit mode shows section labels with archive/restore toggles — no eyeballs.
 */

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Sparkles, Home, Settings, Frame, GripVertical, ArchiveRestore, Archive, ChevronLeft, Lock, Unlock, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { PullTab } from '@/components/shared/PullTab'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
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
import { HubMemberAuthModal } from './HubMemberAuthModal'
import type { FamilyMember } from '@/hooks/useFamilyMember'

// ─── Section labels ──────────────────────────────────────────────────────────

const SECTION_LABELS: Record<string, string> = {
  family_calendar: 'Family Calendar',
  family_vision: 'Family Vision',
  family_best_intentions: 'Family Best Intentions',
  victories_summary: 'Victories Summary',
  countdowns: 'Countdowns',
  widget_grid: 'Widget Grid',
  member_access: 'Member Access',
}

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
      return null // PRD-12B dependency
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
      return null // PRD-10 Hub widget deployment
    case 'member_access':
      if (context === 'tab') return null // Only in standalone mode
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

  const { data: familyMembers } = useFamilyMembers(family?.id)

  // Data queries for onboarding detection
  const { data: intentions } = useFamilyBestIntentions(family?.id)
  const { data: countdowns } = useVisibleCountdowns(family?.id)

  const isMom = member?.role === 'primary_parent'
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [slideshowOpen, setSlideshowOpen] = useState(false)
  const [editMode, setEditMode] = useState(false)
  const [memberDrawerOpen, setMemberDrawerOpen] = useState(false)
  const [authMember, setAuthMember] = useState<FamilyMember | null>(null)

  // Hub Mode kiosk lock state — persisted to localStorage
  const [hubModeActive, setHubModeActive] = useState<boolean>(() => {
    try { return localStorage.getItem('myaim-hub-mode') === 'true' } catch { return false }
  })
  const [hubModePinEntry, setHubModePinEntry] = useState(false)
  const [hubModePin, setHubModePin] = useState('')
  const [hubModePinError, setHubModePinError] = useState('')

  const activateHubMode = useCallback(() => {
    if (!config?.hub_pin) {
      // No Hub PIN set — can't activate Hub Mode
      return
    }
    setHubModeActive(true)
    try { localStorage.setItem('myaim-hub-mode', 'true') } catch { /* */ }
  }, [config?.hub_pin])

  const handleHubModeExit = useCallback(async () => {
    if (!config?.hub_pin) {
      setHubModeActive(false)
      try { localStorage.removeItem('myaim-hub-mode') } catch { /* */ }
      return
    }
    // Show PIN entry to exit
    setHubModePinEntry(true)
    setHubModePin('')
    setHubModePinError('')
  }, [config?.hub_pin])

  const handleHubModePinSubmit = useCallback(async () => {
    if (!config?.hub_pin || hubModePin.length < 4) return
    // Verify Hub PIN — stored as bcrypt hash, use verify_hub_pin RPC if available,
    // otherwise compare plaintext (hub_pin stored hashed in DB)
    let data: unknown = null
    try {
      const result = await supabase.rpc('verify_hub_pin', {
        p_family_id: family?.id,
        p_pin: hubModePin,
      })
      data = result.data
    } catch { /* RPC not available yet */ }

    if (data === true) {
      setHubModeActive(false)
      try { localStorage.removeItem('myaim-hub-mode') } catch { /* */ }
      setHubModePinEntry(false)
    } else {
      setHubModePinError('Incorrect PIN')
      setHubModePin('')
    }
  }, [config?.hub_pin, hubModePin, family?.id])

  // Long-press to enter edit mode (mom only)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const handlePointerDown = useCallback(() => {
    if (!isMom || editMode || hubModeActive) return
    longPressTimer.current = setTimeout(() => setEditMode(true), 500)
  }, [isMom, editMode])
  const cancelLongPress = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
  }, [])

  // Auto-create config on first access (upsert)
  useEffect(() => {
    if (!family?.id || configLoading || config) return
    updateConfig.mutate({
      familyId: family.id,
      sectionOrder: [...DEFAULT_SECTION_ORDER],
      sectionVisibility: Object.fromEntries(DEFAULT_SECTION_ORDER.map((k) => [k, true])),
    })
  }, [family?.id, config, configLoading, updateConfig])

  // Section order and visibility
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

  const toggleSectionVisibility = useCallback((key: string) => {
    if (!family?.id) return
    const current = sectionVisibility[key] ?? true
    updateConfig.mutate({
      familyId: family.id,
      sectionVisibility: { ...sectionVisibility, [key]: !current },
    })
  }, [family?.id, sectionVisibility, updateConfig])

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
      onPointerDown={handlePointerDown}
      onPointerUp={cancelLongPress}
      onPointerLeave={cancelLongPress}
      style={{
        backgroundColor: context === 'standalone' ? 'var(--color-bg-page)' : undefined,
        minHeight: context === 'standalone' ? '100vh' : undefined,
      }}
    >
      {/* Header — standalone only */}
      {context === 'standalone' && (
        <HubHeader
          onSettingsClick={() => isMom && setSettingsOpen(true)}
          onFrameClick={() => setSlideshowOpen(true)}
        />
      )}

      {/* Slideshow Overlay */}
      <SlideshowOverlay
        isOpen={slideshowOpen}
        onClose={() => setSlideshowOpen(false)}
        onOpenSettings={isMom ? () => setSettingsOpen(true) : undefined}
      />

      {/* Member pull tab — left edge near top, standalone only */}
      {context === 'standalone' && !memberDrawerOpen && (
        <div className="fixed left-0 z-30" style={{ top: 80 }}>
          <PullTab
            orientation="side"
            onClick={() => setMemberDrawerOpen(true)}
            className="rounded-l-none! rounded-r-lg!"
          >
            <Users size={16} />
          </PullTab>
        </div>
      )}

      {/* Member drawer — slides in from left, standalone only (PRD-04 / PRD-14D) */}
      {context === 'standalone' && memberDrawerOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)' }}
            onClick={() => setMemberDrawerOpen(false)}
          />
          <aside
            className="fixed inset-y-0 left-0 z-50 flex flex-col"
            style={{
              width: '280px',
              backgroundColor: 'var(--color-bg-card)',
              borderRight: '1px solid var(--color-border)',
              boxShadow: '4px 0 20px rgba(0, 0, 0, 0.15)',
              animation: 'hubDrawerSlide 200ms ease-out',
            }}
          >
            <div
              className="flex items-center justify-between p-4 border-b"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <span className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
                Family Members
              </span>
              <button
                onClick={() => setMemberDrawerOpen(false)}
                className="p-1 rounded"
                style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
              >
                <ChevronLeft size={16} />
              </button>
            </div>
            <p className="text-xs px-4 pt-2 pb-1" style={{ color: 'var(--color-text-secondary)' }}>
              Tap your name to open your space
            </p>
            <div className="flex-1 overflow-y-auto py-1">
              {(familyMembers ?? [])
                .filter((m) => m.is_active && !m.out_of_nest)
                .map((m) => {
                  const color = m.calendar_color || m.assigned_color || m.member_color || 'var(--color-btn-primary-bg)'
                  const hasPin = m.auth_method === 'pin' || m.auth_method === 'visual_password'
                  return (
                    <button
                      key={m.id}
                      onClick={() => {
                        setMemberDrawerOpen(false)
                        setAuthMember(m)
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3 text-left"
                      style={{ minHeight: 48, color: 'var(--color-text-primary)' }}
                    >
                      <div className="relative shrink-0">
                        <span
                          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold"
                          style={{ backgroundColor: color, color: 'var(--color-text-on-primary, #fff)', display: 'flex' }}
                        >
                          {m.display_name.charAt(0).toUpperCase()}
                        </span>
                        {hasPin && (
                          <span
                            className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
                          >
                            <Lock size={8} style={{ color: 'var(--color-text-secondary)' }} />
                          </span>
                        )}
                      </div>
                      <div>
                        <span className="text-sm font-medium block">{m.display_name}</span>
                        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          {m.role === 'primary_parent' ? 'Mom' : m.role === 'additional_adult' ? 'Adult' : m.dashboard_mode || 'Member'}
                        </span>
                      </div>
                    </button>
                  )
                })}
            </div>
          </aside>
          <style>{`
            @keyframes hubDrawerSlide {
              from { transform: translateX(-100%); }
              to { transform: translateX(0); }
            }
          `}</style>
        </>
      )}

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

      {/* Hub Member Auth Modal — PIN entry for member quick access */}
      <HubMemberAuthModal
        member={authMember}
        isOpen={authMember !== null}
        onClose={() => setAuthMember(null)}
      />

      {/* Hub Mode lock/unlock — standalone only */}
      {context === 'standalone' && isMom && config?.hub_pin && (
        <button
          onClick={hubModeActive ? handleHubModeExit : activateHubMode}
          className="fixed bottom-4 right-4 z-30 flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-semibold"
          style={{
            background: hubModeActive
              ? 'color-mix(in srgb, var(--color-error, #ef4444) 15%, var(--color-bg-card))'
              : 'var(--gradient-primary, var(--color-btn-primary-bg))',
            color: hubModeActive ? 'var(--color-text-primary)' : 'var(--color-btn-primary-text)',
            border: '1px solid var(--color-border)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          }}
        >
          {hubModeActive ? <><Unlock size={14} /> Exit Hub Mode</> : <><Lock size={14} /> Hub Mode</>}
        </button>
      )}

      {/* Hub Mode PIN exit modal */}
      {hubModePinEntry && (
        <>
          <div
            className="fixed inset-0 z-60"
            onClick={() => setHubModePinEntry(false)}
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.5)' }}
          />
          <div
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[90vw] max-w-xs rounded-xl p-6 z-61 space-y-4"
            style={{
              backgroundColor: 'var(--color-bg-card)',
              border: '1px solid var(--color-border)',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)',
            }}
          >
            <p className="text-sm font-semibold text-center" style={{ color: 'var(--color-text-heading)' }}>
              Enter Hub PIN to exit Hub Mode
            </p>
            {hubModePinError && (
              <p className="text-xs text-center" style={{ color: 'var(--color-error, #ef4444)' }}>
                {hubModePinError}
              </p>
            )}
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={hubModePin}
              onChange={(e) => { setHubModePin(e.target.value.replace(/\D/g, '')); setHubModePinError('') }}
              className="w-full px-3 py-3 rounded-lg outline-none text-center text-2xl tracking-widest"
              style={{
                backgroundColor: 'var(--color-bg-secondary)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-text-primary)',
              }}
              placeholder="····"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={() => setHubModePinEntry(false)}
                className="flex-1 py-2 rounded-lg text-sm"
                style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
              >
                Cancel
              </button>
              <button
                onClick={handleHubModePinSubmit}
                disabled={hubModePin.length < 4}
                className="flex-1 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                style={{
                  background: 'var(--gradient-primary, var(--color-btn-primary-bg))',
                  color: 'var(--color-btn-primary-text)',
                  border: 'none',
                }}
              >
                Unlock
              </button>
            </div>
          </div>
        </>
      )}

      {/* Edit mode banner */}
      {editMode && (
        <div
          className="flex items-center justify-between px-4 py-2"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, var(--color-bg-card))',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <span className="text-xs font-medium" style={{ color: 'var(--color-text-heading)' }}>
            Editing Hub — archive or restore sections
          </span>
          <button
            onClick={() => setEditMode(false)}
            className="text-xs font-medium px-3 py-1.5 rounded-lg"
            style={{
              backgroundColor: 'var(--surface-primary, var(--color-btn-primary-bg))',
              color: 'var(--color-text-on-primary, #fff)',
            }}
          >
            Done
          </button>
        </div>
      )}

      {/* Main content area */}
      <div className="px-4 py-4 space-y-4 max-w-3xl mx-auto">
        {/* Onboarding card */}
        {isFirstTime && !onboardingDismissed && (
          <HubOnboardingCard onDismiss={handleDismissOnboarding} />
        )}

        {/* Sections in config order */}
        {sectionOrder.map((key) => {
          const visible = isSectionVisible(key)
          // Normal mode: skip hidden sections
          if (!visible && !editMode) return null

          return (
            <div key={key} style={{ opacity: editMode && !visible ? 0.35 : 1 }}>
              {/* Edit mode: section label with archive/restore toggle */}
              {editMode && (
                <div
                  className="flex items-center gap-2 mb-1.5 px-2 py-1.5 rounded-lg"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 6%, var(--color-bg-secondary))',
                    border: '1px solid color-mix(in srgb, var(--color-btn-primary-bg) 12%, transparent)',
                  }}
                >
                  <GripVertical size={14} style={{ color: 'var(--color-text-secondary)' }} />
                  <span className="flex-1 text-xs font-medium" style={{ color: 'var(--color-text-heading)' }}>
                    {SECTION_LABELS[key] ?? key}
                  </span>
                  <button
                    onClick={() => toggleSectionVisibility(key)}
                    className="flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded"
                    style={{
                      backgroundColor: visible
                        ? 'var(--color-bg-secondary)'
                        : 'color-mix(in srgb, var(--color-btn-primary-bg) 15%, transparent)',
                      color: visible
                        ? 'var(--color-text-secondary)'
                        : 'var(--color-btn-primary-bg)',
                      minHeight: 'unset',
                    }}
                  >
                    {visible ? (
                      <><Archive size={10} /> Archive</>
                    ) : (
                      <><ArchiveRestore size={10} /> Restore</>
                    )}
                  </button>
                </div>
              )}
              {/* Section content */}
              {visible && (
                <HubSectionRenderer
                  sectionKey={key as HubSectionKey}
                  context={context}
                  currentMemberId={member.id}
                  isMom={isMom}
                />
              )}
            </div>
          )
        })}

        {/* Empty state — all sections hidden */}
        {sectionOrder.every((key) => !isSectionVisible(key)) && !editMode && (
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
