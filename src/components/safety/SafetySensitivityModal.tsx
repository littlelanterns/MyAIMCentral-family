import { Lock } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import {
  useSensitivityConfigs,
  useUpsertSensitivityConfig,
  useResetSensitivityConfigs,
} from '@/hooks/useSafetyMonitoring'
import {
  CATEGORY_LIST,
  CATEGORY_DISPLAY_LABEL,
  isLockedCategory,
  resolveDefaultSensitivity,
  type SafetyCategory,
  type SafetySensitivity,
} from '@/lib/safety/categoryLabels'

/**
 * PRD-30 Screen 2 — per-member sensitivity modal. 8 category rows; the 3
 * locked categories (self_harm, abuse, sexual_predatory) render a Lock pill
 * pinned to High — there is no control to lower them, on this screen or via
 * any API path (enforced again at the pipeline layer regardless).
 */

const SENSITIVITY_OPTIONS: { value: SafetySensitivity; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

export function SafetySensitivityModal({
  isOpen,
  onClose,
  familyId,
  memberId,
  memberName,
  dashboardMode,
}: {
  isOpen: boolean
  onClose: () => void
  familyId: string
  memberId: string
  memberName: string
  dashboardMode: string | null
}) {
  const { data: overrides = [] } = useSensitivityConfigs(familyId, memberId)
  const upsert = useUpsertSensitivityConfig()
  const reset = useResetSensitivityConfigs()

  const overrideFor = (category: SafetyCategory): SafetySensitivity | null => {
    const row = overrides.find((o) => o.category === category)
    return row?.sensitivity ?? null
  }

  const effectiveFor = (category: SafetyCategory): SafetySensitivity => {
    if (isLockedCategory(category)) return 'high'
    return overrideFor(category) ?? resolveDefaultSensitivity(category, dashboardMode)
  }

  return (
    <ModalV2
      id="safety-sensitivity-modal"
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="md"
      title={`${memberName}'s Safety Sensitivity`}
      subtitle="How closely each category is watched"
      footer={
        <div className="flex items-center justify-between w-full">
          <button
            type="button"
            onClick={() => reset.mutate({ familyId, memberId })}
            className="text-sm font-medium"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Reset to Defaults
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: 'var(--surface-primary)', color: 'var(--color-text-on-primary)' }}
          >
            Done
          </button>
        </div>
      }
    >
      <div className="p-4 space-y-3">
        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          Low means only clear, serious patterns get flagged. High flags anything that comes up, even mild.
          Three categories are always set to High — they're too important to soften.
        </p>
        {CATEGORY_LIST.map((category) => {
          const locked = isLockedCategory(category)
          const effective = effectiveFor(category)
          return (
            <div
              key={category}
              className="flex items-center justify-between gap-3 py-2"
              style={{ borderBottom: '1px solid var(--color-border)' }}
            >
              <span className="text-sm font-medium" style={{ color: 'var(--color-text-primary)' }}>
                {CATEGORY_DISPLAY_LABEL[category]}
              </span>
              {locked ? (
                <span
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium shrink-0"
                  style={{
                    backgroundColor: 'color-mix(in srgb, var(--color-text-secondary) 12%, transparent)',
                    color: 'var(--color-text-secondary)',
                  }}
                  data-testid={`safety-sensitivity-locked-${category}`}
                >
                  <Lock size={11} /> High
                </span>
              ) : (
                <div
                  className="inline-flex rounded-lg overflow-hidden shrink-0"
                  style={{ border: '1px solid var(--color-border)' }}
                  data-testid={`safety-sensitivity-control-${category}`}
                >
                  {SENSITIVITY_OPTIONS.map((opt) => {
                    const selected = effective === opt.value
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => upsert.mutate({ familyId, memberId, category, sensitivity: opt.value })}
                        className="px-2.5 py-1 text-xs font-medium"
                        style={{
                          background: selected ? 'var(--surface-primary)' : 'transparent',
                          color: selected ? 'var(--color-text-on-primary)' : 'var(--color-text-secondary)',
                          border: 'none',
                          minHeight: 'unset',
                        }}
                        aria-pressed={selected}
                      >
                        {opt.label}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </ModalV2>
  )
}
