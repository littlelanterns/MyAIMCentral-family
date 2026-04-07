/**
 * PRD-18 Screen 7: Rhythms Settings Page
 *
 * Phase A: per-rhythm enable/disable, section toggles, member picker
 * (mom only), restore-defaults stub. Custom rhythm creation and Studio
 * template browsing are stubbed with PlannedExpansionCard.
 *
 * Section reordering for non-evening rhythms is deferred to Phase B —
 * Phase A only ships toggle on/off. The evening rhythm has
 * section_order_locked=true and never reorders.
 */

import { useState } from 'react'
import { Settings, Sun, Moon, Calendar as CalendarIcon, Eye } from 'lucide-react'
import { FeatureGuide } from '@/components/shared'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import {
  useRhythmConfigs,
  useUpdateRhythmConfig,
  useToggleRhythmSection,
} from '@/hooks/useRhythms'
import type { RhythmConfig } from '@/types/rhythms'
import { CarryForwardFallbackSetting } from '@/components/rhythms/settings/CarryForwardFallbackSetting'

const RHYTHM_ICONS: Record<string, typeof Sun> = {
  morning: Sun,
  evening: Moon,
  weekly_review: CalendarIcon,
  monthly_review: CalendarIcon,
  quarterly_inventory: CalendarIcon,
}

export function RhythmsSettingsPage() {
  const { data: family } = useFamily()
  const { data: viewer } = useFamilyMember()
  const { data: familyMembers = [] } = useFamilyMembers(family?.id)
  const { isViewingAs, viewingAsMember } = useViewAs()
  const isMom = viewer?.role === 'primary_parent'
  const activeViewer = isViewingAs && viewingAsMember ? viewingAsMember : viewer

  // Mom can configure any family member; others see only their own
  const [selectedMemberId, setSelectedMemberId] = useState<string | undefined>(activeViewer?.id)
  const effectiveMemberId = isMom ? selectedMemberId : activeViewer?.id

  const { data: configs = [], isLoading } = useRhythmConfigs(effectiveMemberId)

  const active = configs.filter(c => c.enabled)
  const available = configs.filter(c => !c.enabled)

  return (
    <div className="density-comfortable max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <Settings size={32} style={{ color: 'var(--color-btn-primary-bg)' }} />
        <div>
          <h1
            className="text-2xl font-bold"
            style={{
              color: 'var(--color-text-heading)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            Rhythms
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Configure morning, evening, and periodic check-in experiences.
          </p>
        </div>
      </div>

      <FeatureGuide featureKey="rhythms_basic" />

      {/* Member picker — mom only */}
      {isMom && (
        <div
          className="rounded-xl p-4 flex items-center gap-3"
          style={{
            background: 'var(--color-bg-card)',
            border: '1px solid var(--color-border-subtle)',
          }}
        >
          <Eye size={16} style={{ color: 'var(--color-text-secondary)' }} />
          <label
            className="text-sm font-medium"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Configuring rhythms for:
          </label>
          <select
            value={selectedMemberId ?? ''}
            onChange={e => setSelectedMemberId(e.target.value)}
            className="text-sm rounded-md px-2 py-1"
            style={{
              backgroundColor: 'var(--color-bg-input)',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border-input)',
            }}
          >
            {familyMembers.map(m => (
              <option key={m.id} value={m.id}>
                {m.display_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {isLoading && (
        <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
          Loading rhythms…
        </p>
      )}

      {!isLoading && configs.length === 0 && (
        <p className="text-sm text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
          No rhythms configured for this member.
        </p>
      )}

      {/* Active Rhythms */}
      {active.length > 0 && (
        <section>
          <h2
            className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Active Rhythms
          </h2>
          <div className="space-y-3">
            {active.map(config => (
              <RhythmConfigRow key={config.id} config={config} />
            ))}
          </div>
        </section>
      )}

      {/* Available Rhythms */}
      {available.length > 0 && (
        <section>
          <h2
            className="text-xs font-semibold uppercase tracking-wide mb-3"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Available Rhythms
          </h2>
          <div className="space-y-3">
            {available.map(config => (
              <RhythmConfigRow key={config.id} config={config} />
            ))}
          </div>
        </section>
      )}

      {/* Carry Forward Fallback — Phase B (Enhancement 5) */}
      {effectiveMemberId && (
        <CarryForwardFallbackSetting
          memberId={effectiveMemberId}
          memberName={
            familyMembers.find(m => m.id === effectiveMemberId)?.display_name ??
            'this member'
          }
        />
      )}

      {/* Custom Rhythms — Phase A stub */}
      <section>
        <h2
          className="text-xs font-semibold uppercase tracking-wide mb-3"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Custom Rhythms
        </h2>
        <div
          className="rounded-xl p-4 text-center text-sm opacity-70"
          style={{
            background: 'var(--color-bg-card)',
            border: '1px dashed var(--color-border-subtle)',
            color: 'var(--color-text-secondary)',
          }}
        >
          Custom rhythm creation and Studio template browsing are coming.
        </div>
      </section>
    </div>
  )
}

// ─── Individual rhythm row ───────────────────────────────────

function RhythmConfigRow({ config }: { config: RhythmConfig }) {
  const [expanded, setExpanded] = useState(false)
  const updateConfig = useUpdateRhythmConfig()
  const toggleSection = useToggleRhythmSection()

  const Icon = RHYTHM_ICONS[config.rhythm_key] ?? Settings

  const handleToggleEnabled = () => {
    updateConfig.mutate({
      configId: config.id,
      memberId: config.member_id,
      updates: { enabled: !config.enabled },
    })
  }

  const handleSectionToggle = (sectionType: string, currentEnabled: boolean) => {
    toggleSection.mutate({
      configId: config.id,
      memberId: config.member_id,
      currentSections: config.sections,
      sectionType,
      enabled: !currentEnabled,
    })
  }

  return (
    <div
      className="rounded-xl"
      style={{
        background: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-subtle)',
      }}
    >
      <div className="flex items-center gap-3 p-4">
        <Icon size={20} style={{ color: 'var(--color-accent-deep)' }} />
        <div className="flex-1">
          <h3
            className="text-sm font-semibold"
            style={{
              color: 'var(--color-text-heading)',
              fontFamily: 'var(--font-heading)',
            }}
          >
            {config.display_name}
          </h3>
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {config.sections.filter(s => s.enabled).length} sections enabled
            {config.section_order_locked && ' · order locked'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setExpanded(v => !v)}
          className="text-xs rounded-md px-3 py-1.5"
          style={{
            color: 'var(--color-text-secondary)',
            backgroundColor: 'var(--color-bg-secondary)',
          }}
        >
          {expanded ? 'Hide' : 'Sections'}
        </button>

        <button
          type="button"
          onClick={handleToggleEnabled}
          disabled={updateConfig.isPending}
          className="text-xs font-semibold rounded-md px-3 py-1.5 disabled:opacity-50"
          style={
            config.enabled
              ? {
                  color: 'var(--color-text-secondary)',
                  backgroundColor: 'var(--color-bg-secondary)',
                }
              : {
                  background: 'var(--surface-primary, var(--color-btn-primary-bg))',
                  color: 'var(--color-btn-primary-text)',
                }
          }
        >
          {config.enabled ? 'Disable' : 'Enable'}
        </button>
      </div>

      {expanded && (
        <div
          className="border-t px-4 py-3 space-y-2"
          style={{ borderColor: 'var(--color-border-subtle)' }}
        >
          <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>
            Toggle sections on or off. {config.section_order_locked && 'Section order is fixed for this rhythm.'}
          </p>
          {[...config.sections]
            .sort((a, b) => a.order - b.order)
            .map(section => (
              <div
                key={section.section_type}
                className="flex items-center justify-between text-sm py-1"
              >
                <span style={{ color: 'var(--color-text-primary)' }}>
                  {section.section_type
                    .split('_')
                    .map(w => w[0].toUpperCase() + w.slice(1))
                    .join(' ')}
                </span>
                <button
                  type="button"
                  onClick={() => handleSectionToggle(section.section_type, section.enabled)}
                  disabled={toggleSection.isPending}
                  className="text-xs rounded-md px-2 py-1 disabled:opacity-50"
                  style={
                    section.enabled
                      ? {
                          background: 'var(--surface-primary, var(--color-btn-primary-bg))',
                          color: 'var(--color-btn-primary-text)',
                        }
                      : {
                          color: 'var(--color-text-secondary)',
                          backgroundColor: 'var(--color-bg-secondary)',
                        }
                  }
                >
                  {section.enabled ? 'On' : 'Off'}
                </button>
              </div>
            ))}
        </div>
      )}
    </div>
  )
}
