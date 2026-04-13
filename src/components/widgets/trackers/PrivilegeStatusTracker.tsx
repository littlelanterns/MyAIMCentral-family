// PRD-28 Addition 3: Privilege Status Widget
// Color-zone display (Red/Yellow/Green) based on completion %.
// Visibility only — never blocks features or devices.
// Two modes: reads allowance_periods when config exists, falls back to raw task completion %.

import { Shield } from 'lucide-react'
import { useAllowanceConfig, useCompletionPercentage } from '@/hooks/useFinancial'
import type { DashboardWidget } from '@/types/widgets'
import type { PrivilegeStatusConfig, PrivilegeZone, FallbackCalculationMode } from '@/types/financial'

interface Props {
  widget: DashboardWidget
  isCompact?: boolean
}

export function PrivilegeStatusTracker({ widget, isCompact }: Props) {
  const config = (widget.widget_config ?? {}) as Partial<PrivilegeStatusConfig>
  const linkedMemberId = config.linked_member_id ?? widget.family_member_id
  const redThreshold = config.red_threshold ?? 50
  const yellowThreshold = config.yellow_threshold ?? 80
  const redDesc = config.red_description ?? ''
  const yellowDesc = config.yellow_description ?? ''
  const greenDesc = config.green_description ?? ''
  const fallbackMode = (config.fallback_calculation_mode ?? 'this_week') as FallbackCalculationMode

  // Determine data source: allowance config exists → use allowance period; otherwise → fallback
  const { data: allowanceConfig } = useAllowanceConfig(linkedMemberId)
  const dataMode = allowanceConfig?.enabled ? 'allowance' : 'fallback'

  const { data: pct = 0 } = useCompletionPercentage(
    linkedMemberId,
    dataMode,
    dataMode === 'fallback' ? fallbackMode : undefined,
  )

  // Determine zone
  const zone: PrivilegeZone = pct < redThreshold ? 'red' : pct < yellowThreshold ? 'yellow' : 'green'

  const zoneColors: Record<PrivilegeZone, string> = {
    red: 'var(--color-error)',
    yellow: 'var(--color-warning)',
    green: 'var(--color-success)',
  }

  const zoneLabels: Record<PrivilegeZone, string> = {
    red: 'Needs improvement',
    yellow: 'Getting there',
    green: 'On track',
  }

  const activeDescription = zone === 'red' ? redDesc : zone === 'yellow' ? yellowDesc : greenDesc

  if (isCompact) {
    return (
      <div className="flex items-center gap-2 p-2">
        <div
          className="w-3 h-3 rounded-full shrink-0"
          style={{ backgroundColor: zoneColors[zone] }}
        />
        <span className="text-sm font-semibold" style={{ color: 'var(--color-text-heading)' }}>
          {Math.round(pct)}%
        </span>
      </div>
    )
  }

  return (
    <div className="p-4 space-y-3">
      {/* Zone indicator */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: zoneColors[zone] }}
          />
          <span className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
            {zoneLabels[zone]}
          </span>
        </div>
        <Shield size={16} style={{ color: zoneColors[zone] }} />
      </div>

      {/* Percentage display */}
      <div className="text-center">
        <div
          className="text-4xl font-bold"
          style={{ color: zoneColors[zone] }}
        >
          {Math.round(pct)}%
        </div>
        <div className="text-xs mt-1" style={{ color: 'var(--color-text-muted)' }}>
          completion
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative h-3 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--color-bg-tertiary)' }}>
        {/* Red zone */}
        <div
          className="absolute inset-y-0 left-0"
          style={{
            width: `${redThreshold}%`,
            backgroundColor: 'color-mix(in srgb, var(--color-error) 20%, transparent)',
          }}
        />
        {/* Yellow zone */}
        <div
          className="absolute inset-y-0"
          style={{
            left: `${redThreshold}%`,
            width: `${yellowThreshold - redThreshold}%`,
            backgroundColor: 'color-mix(in srgb, var(--color-warning) 20%, transparent)',
          }}
        />
        {/* Green zone */}
        <div
          className="absolute inset-y-0"
          style={{
            left: `${yellowThreshold}%`,
            width: `${100 - yellowThreshold}%`,
            backgroundColor: 'color-mix(in srgb, var(--color-success) 20%, transparent)',
          }}
        />
        {/* Current position indicator */}
        <div
          className="absolute inset-y-0 w-1 rounded-full"
          style={{
            left: `${Math.min(pct, 100)}%`,
            backgroundColor: zoneColors[zone],
            transform: 'translateX(-50%)',
          }}
        />
      </div>

      {/* Zone description */}
      {activeDescription && (
        <div
          className="text-sm p-3 rounded-lg"
          style={{
            backgroundColor: `color-mix(in srgb, ${zoneColors[zone]} 8%, transparent)`,
            color: 'var(--color-text-primary)',
            border: `1px solid color-mix(in srgb, ${zoneColors[zone]} 20%, transparent)`,
          }}
        >
          {activeDescription}
        </div>
      )}
    </div>
  )
}
