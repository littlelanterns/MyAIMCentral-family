import { AlertOctagon, AlertTriangle, Info, MessageCircle, ExternalLink, Phone, Check, X } from 'lucide-react'
import { ModalV2 } from '@/components/shared/ModalV2'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useSafetyFlag, useSafetyResources, useUpdateFlagStatus, type SafetyResourceRow } from '@/hooks/useSafetyMonitoring'
import {
  CATEGORY_DISPLAY_LABEL,
  SEVERITY_DISPLAY_LABEL,
  surfaceLabel,
  detectionLayerLabel,
  type SafetySeverity,
} from '@/lib/safety/categoryLabels'

/**
 * PRD-30 Screen 3 — flag detail, NO-EXCERPT MODE (J2/D2). No CONTEXT block,
 * no "Show More Context" — the conversation content is DB-column-guarded and
 * this UI never requests it. Only category, severity, timestamp, surface,
 * the content-free "How to Bring This Up" starter, and curated resources.
 * No Delete action ever exists (flags are permanent, Key PRD Decision #8).
 */

const SEVERITY_ICON: Record<SafetySeverity, typeof AlertOctagon> = {
  critical: AlertOctagon,
  warning: AlertTriangle,
  concern: Info,
}

const SEVERITY_COLOR: Record<SafetySeverity, string> = {
  critical: 'var(--color-error, #dc2626)',
  warning: 'var(--color-warning, #d97706)',
  concern: 'var(--color-text-secondary)',
}

function resourceIcon(type: SafetyResourceRow['resource_type']) {
  if (type === 'hotline') return Phone
  return ExternalLink
}

export function SafetyFlagDetailModal({
  isOpen,
  onClose,
  flagId,
  memberName,
}: {
  isOpen: boolean
  onClose: () => void
  flagId: string
  memberName?: string
}) {
  const { data: mom } = useFamilyMember()
  const { data: flag } = useSafetyFlag(flagId)
  const { data: resources = [] } = useSafetyResources(flag?.category)
  const updateStatus = useUpdateFlagStatus()

  if (!flag) {
    return (
      <ModalV2 id="safety-flag-detail" isOpen={isOpen} onClose={onClose} type="transient" size="md" title="Safety Flag">
        <div className="p-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading…</div>
      </ModalV2>
    )
  }

  const SeverityIcon = SEVERITY_ICON[flag.severity]
  const color = SEVERITY_COLOR[flag.severity]
  const isCritical = flag.severity === 'critical'
  const canAct = flag.status === 'new'

  return (
    <ModalV2
      id="safety-flag-detail"
      isOpen={isOpen}
      onClose={onClose}
      type="transient"
      size="md"
      title={memberName ? `${memberName} — Safety Flag` : 'Safety Flag'}
    >
      <div className="p-4 space-y-4" data-testid="safety-flag-detail-body">
        {/* Severity banner */}
        <div
          className="rounded-lg p-3 flex items-start gap-3"
          style={{
            backgroundColor: `color-mix(in srgb, ${color} ${isCritical ? 15 : 10}%, transparent)`,
            border: `1px solid color-mix(in srgb, ${color} 35%, transparent)`,
          }}
          data-testid="safety-flag-severity-banner"
        >
          <SeverityIcon size={isCritical ? 22 : 18} style={{ color }} className="shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold" style={{ color }}>
              {SEVERITY_DISPLAY_LABEL[flag.severity]} — {CATEGORY_DISPLAY_LABEL[flag.category]}
            </p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
              {new Date(flag.created_at).toLocaleString(undefined, {
                month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit',
              })}{' '}
              · {surfaceLabel(flag.surface)} · {detectionLayerLabel(flag.detection_layer)}
            </p>
          </div>
        </div>

        {/* How to bring this up */}
        {flag.conversation_starter && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--color-text-tertiary)' }}>
              <MessageCircle size={12} /> How to Bring This Up
            </p>
            <p
              className="text-sm rounded-lg p-3"
              style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)' }}
              data-testid="safety-flag-starter"
            >
              {flag.conversation_starter}
            </p>
          </div>
        )}

        {/* Curated resources */}
        {resources.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-tertiary)' }}>
              Resources
            </p>
            <div className="space-y-1.5">
              {resources.map((r) => {
                const Icon = resourceIcon(r.resource_type)
                const isLink = r.resource_type !== 'hotline' && r.resource_value.startsWith('http')
                return (
                  <div key={r.id} className="flex items-start gap-2 text-sm">
                    <Icon size={14} className="mt-0.5 shrink-0" style={{ color: 'var(--color-text-secondary)' }} />
                    <div>
                      {isLink ? (
                        <a href={r.resource_value} target="_blank" rel="noreferrer" className="font-medium" style={{ color: 'var(--color-btn-primary-bg)' }}>
                          {r.resource_name}
                        </a>
                      ) : (
                        <span className="font-medium" style={{ color: 'var(--color-text-primary)' }}>
                          {r.resource_name} — {r.resource_value}
                        </span>
                      )}
                      {r.description && (
                        <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{r.description}</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Status */}
        {flag.status !== 'new' ? (
          <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {flag.status === 'acknowledged' ? 'Acknowledged' : 'Dismissed'}
            {flag.reviewed_at ? ` on ${new Date(flag.reviewed_at).toLocaleDateString()}` : ''}
          </p>
        ) : (
          canAct && mom && (
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={() => updateStatus.mutate({ flagId: flag.id, status: 'acknowledged', reviewerId: mom.id })}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
                style={{ background: 'var(--surface-primary)', color: 'var(--color-text-on-primary)' }}
                data-testid="safety-flag-acknowledge"
              >
                <Check size={14} /> Acknowledge
              </button>
              <button
                type="button"
                onClick={() => updateStatus.mutate({ flagId: flag.id, status: 'dismissed', reviewerId: mom.id })}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium"
                style={{ backgroundColor: 'var(--color-bg-secondary)', color: 'var(--color-text-primary)', border: '1px solid var(--color-border)' }}
                data-testid="safety-flag-dismiss"
              >
                <X size={14} /> Dismiss (False Positive)
              </button>
            </div>
          )
        )}
      </div>
    </ModalV2>
  )
}
