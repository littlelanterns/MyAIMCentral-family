import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Lock, Settings2, ShieldCheck, ChevronRight, Mail } from 'lucide-react'
import { FeatureGuide } from '@/components/shared'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import {
  useMonitoringConfigs,
  useUpdateMonitoringConfig,
  useNotificationRecipients,
  useUpsertRecipient,
} from '@/hooks/useSafetyMonitoring'
import { SafetySensitivityModal } from './SafetySensitivityModal'

/**
 * PRD-30 Screen 1 — Settings → "Safety Monitoring" section. Primary-parent
 * ONLY: dad receives flags when granted below, but never sees this
 * configuration screen (addendum ruling, mirrored by SettingsPage.tsx only
 * mounting this section under `shell === 'mom'`).
 */
export function SafetyMonitoringSettingsSection() {
  const { data: mom } = useFamilyMember()
  const familyId = mom?.family_id
  const { data: allMembers = [] } = useFamilyMembers(familyId)
  const { data: configs = [] } = useMonitoringConfigs(familyId)
  const { data: recipients = [] } = useNotificationRecipients(familyId)
  const updateConfig = useUpdateMonitoringConfig()
  const upsertRecipient = useUpsertRecipient()
  const [sensitivityFor, setSensitivityFor] = useState<{ id: string; name: string; dashboardMode: string | null } | null>(null)

  const monitorable = allMembers.filter((m) => m.role === 'member' || m.role === 'additional_adult')
  const dad = allMembers.find((m) => m.role === 'additional_adult')
  const dadRecipient = dad ? recipients.find((r) => r.recipient_member_id === dad.id) : undefined
  const anyActive = configs.some((c) => c.is_active)

  const configFor = (memberId: string) => configs.find((c) => c.monitored_member_id === memberId)

  return (
    <div className="space-y-4">
      <FeatureGuide featureKey="safety_monitoring_basic" />

      <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
        The invisible safety net behind LiLa. When a monitored family member says something concerning in a LiLa
        conversation, you get a private, gentle heads-up — never anything the child can see, never their exact
        words.
      </p>

      {!anyActive && (
        <div
          className="rounded-lg p-3 text-xs"
          style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-secondary)' }}
        >
          Monitoring is off for everyone right now. Turn it on below for any child or adult you'd like a quiet
          heads-up about.
        </div>
      )}

      {/* Recipients */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
          Who gets alerted
        </p>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>You (Mom)</span>
            <span
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-text-secondary) 12%, transparent)',
                color: 'var(--color-text-secondary)',
              }}
            >
              <Lock size={11} /> Always on
            </span>
          </div>
          {dad && (
            <div className="flex items-center justify-between">
              <span className="text-sm" style={{ color: 'var(--color-text-primary)' }}>{dad.display_name}</span>
              <ToggleSwitch
                checked={!!dadRecipient?.is_active}
                onChange={(v) =>
                  familyId && dad && upsertRecipient.mutate({ familyId, recipientMemberId: dad.id, isActive: v })
                }
                testId={`safety-recipient-toggle-${dad.id}`}
              />
            </div>
          )}
        </div>
      </div>

      {/* Delivery channels */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
          Delivery
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm flex items-center gap-1.5" style={{ color: 'var(--color-text-primary)' }}>
              <ShieldCheck size={14} /> In-app notifications
            </span>
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Always on</span>
          </div>
          <div className="flex items-center justify-between opacity-60">
            <span className="text-sm flex items-center gap-1.5" style={{ color: 'var(--color-text-primary)' }}>
              <Mail size={14} /> Email
            </span>
            <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Coming soon</span>
          </div>
        </div>
        <p className="text-xs mt-1.5" style={{ color: 'var(--color-text-secondary)' }}>
          A weekly trend summary arrives automatically every Sunday for anyone monitored — no setup needed.
        </p>
      </div>

      {/* Monitored members */}
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--color-text-tertiary)' }}>
          Who's monitored
        </p>
        <div className="space-y-1.5">
          {monitorable.map((m) => {
            const cfg = configFor(m.id)
            const isActive = cfg?.is_active ?? false
            return (
              <div
                key={m.id}
                className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg"
                style={{ backgroundColor: 'var(--color-bg-secondary)' }}
                data-testid={`safety-member-row-${m.id}`}
              >
                <span className="flex-1 text-sm font-medium truncate" style={{ color: 'var(--color-text-primary)' }}>
                  {m.display_name}
                </span>
                {isActive && (
                  <button
                    type="button"
                    onClick={() =>
                      setSensitivityFor({ id: m.id, name: m.display_name, dashboardMode: m.dashboard_mode ?? null })
                    }
                    aria-label={`${m.display_name} sensitivity settings`}
                    data-testid={`safety-sensitivity-gear-${m.id}`}
                    className="p-1 rounded"
                    style={{ color: 'var(--color-text-secondary)', background: 'transparent', border: 'none', minHeight: 'unset' }}
                  >
                    <Settings2 size={15} />
                  </button>
                )}
                <ToggleSwitch
                  checked={isActive}
                  onChange={(v) => cfg && familyId && updateConfig.mutate({ id: cfg.id, isActive: v, familyId })}
                  testId={`safety-member-toggle-${m.id}`}
                />
              </div>
            )
          })}
          {monitorable.length === 0 && (
            <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
              No monitorable family members yet.
            </p>
          )}
        </div>
      </div>

      <Link
        to="/safety-flags"
        className="flex items-center justify-between p-3 rounded-lg"
        style={{ backgroundColor: 'var(--color-bg-secondary)' }}
        data-testid="safety-flag-history-link"
      >
        <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>View Flag History</span>
        <ChevronRight size={16} style={{ color: 'var(--color-text-tertiary)' }} />
      </Link>

      {sensitivityFor && familyId && (
        <SafetySensitivityModal
          isOpen
          onClose={() => setSensitivityFor(null)}
          familyId={familyId}
          memberId={sensitivityFor.id}
          memberName={sensitivityFor.name}
          dashboardMode={sensitivityFor.dashboardMode}
        />
      )}
    </div>
  )
}

function ToggleSwitch({ checked, onChange, testId }: { checked: boolean; onChange: (v: boolean) => void; testId?: string }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0"
      style={{
        backgroundColor: checked ? 'var(--color-btn-primary-bg)' : 'var(--color-bg-card)',
        border: `1px solid ${checked ? 'var(--color-btn-primary-bg)' : 'var(--color-border)'}`,
        minHeight: 'unset',
      }}
      aria-pressed={checked}
      data-testid={testId}
    >
      <span
        className="inline-block h-4 w-4 rounded-full transition-transform"
        style={{
          backgroundColor: checked ? 'var(--color-btn-primary-text)' : 'var(--color-text-secondary)',
          transform: checked ? 'translateX(22px)' : 'translateX(4px)',
        }}
      />
    </button>
  )
}
