// Phase 3.5 D2 — Key Decision 16
// Compute-then-prompt: when recalculation produces a LOWER amount, mom
// chooses what to do BEFORE anything is written. Three options:
//
//   apply  → write period update + negative adjustment transaction
//   zero   → write period update (new percentages) but NO adjustment
//            (the original earned amount on the period row stays)
//   cancel → nothing changes
//
// This modal is reused for both single-pool and multi-pool recalculate.
// For multi-pool the caller passes the combined-delta values so the
// pool-by-pool breakdown can render alongside the headline number.

import { ModalV2 } from '@/components/shared/ModalV2'

export type RecalcChoice = 'apply' | 'zero' | 'cancel'

export interface RecalcPoolBreakdown {
  pool_name: string
  old_amount: number
  new_amount: number
  delta: number
}

export function NegativeRecalculateModal({
  isOpen,
  onClose,
  oldTotal,
  newTotal,
  delta,
  combinedOldPercentage,
  combinedNewPercentage,
  poolBreakdowns,
  onChoice,
  isApplying,
}: {
  isOpen: boolean
  onClose: () => void
  oldTotal: number
  newTotal: number
  /** Negative number — already computed by caller. */
  delta: number
  /** Optional — only shown for multi-pool recalculate. */
  combinedOldPercentage?: number | null
  /** Optional — only shown for multi-pool recalculate. */
  combinedNewPercentage?: number | null
  /** Optional — pool-by-pool breakdown for multi-pool recalculate. */
  poolBreakdowns?: RecalcPoolBreakdown[]
  onChoice: (choice: RecalcChoice) => void | Promise<void>
  isApplying: boolean
}) {
  const lessAmount = Math.abs(delta)
  const isMultiPool = (poolBreakdowns?.length ?? 0) > 1

  const handleClick = (choice: RecalcChoice) => {
    void onChoice(choice)
  }

  return (
    <ModalV2
      id="negative-recalculate-modal"
      isOpen={isOpen}
      onClose={onClose}
      title="Recalculation shows less"
      type="transient"
      size="sm"
    >
      <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div
          style={{
            padding: '0.875rem 1rem',
            borderRadius: 'var(--vibe-radius-input, 8px)',
            background: 'color-mix(in srgb, var(--color-warning, var(--color-btn-primary-bg)) 8%, transparent)',
            border: '1px solid color-mix(in srgb, var(--color-warning, var(--color-btn-primary-bg)) 30%, transparent)',
            fontSize: 'var(--font-size-sm)',
            color: 'var(--color-text-primary)',
            lineHeight: 1.5,
          }}
        >
          <div style={{ marginBottom: '0.375rem' }}>
            Recalculation shows <strong>${newTotal.toFixed(2)}</strong> instead of{' '}
            <strong>${oldTotal.toFixed(2)}</strong>.
          </div>
          <div style={{ fontWeight: 600, color: 'var(--color-text-heading)' }}>
            That's ${lessAmount.toFixed(2)} less than originally calculated.
          </div>
        </div>

        {/* Combined percentage delta (multi-pool only) */}
        {isMultiPool && combinedOldPercentage != null && combinedNewPercentage != null && (
          <div
            style={{
              fontSize: 'var(--font-size-xs)',
              color: 'var(--color-text-secondary)',
            }}
          >
            Combined percentage: {combinedOldPercentage.toFixed(1)}% →{' '}
            {combinedNewPercentage.toFixed(1)}%
          </div>
        )}

        {/* Pool breakdown */}
        {isMultiPool && poolBreakdowns && (
          <div
            style={{
              borderRadius: 'var(--vibe-radius-input, 8px)',
              border: '1px solid var(--color-border-default, var(--color-border))',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '0.5rem 0.75rem',
                background: 'var(--color-bg-secondary)',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              Per pool
            </div>
            {poolBreakdowns.map(p => {
              const isNeg = p.delta < 0
              const isZero = Math.abs(p.delta) < 0.01
              return (
                <div
                  key={p.pool_name}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.5rem 0.75rem',
                    fontSize: 'var(--font-size-sm)',
                    borderTop: '1px solid var(--color-border-default, var(--color-border))',
                  }}
                >
                  <span style={{ flex: 1, color: 'var(--color-text-primary)' }}>
                    {p.pool_name === 'default' ? 'Main pool' : p.pool_name}
                  </span>
                  <span style={{ color: 'var(--color-text-muted)', fontVariantNumeric: 'tabular-nums' }}>
                    ${p.old_amount.toFixed(2)} → ${p.new_amount.toFixed(2)}
                  </span>
                  <span
                    style={{
                      minWidth: '4.5rem',
                      textAlign: 'right',
                      fontWeight: 600,
                      fontVariantNumeric: 'tabular-nums',
                      color: isZero
                        ? 'var(--color-text-muted)'
                        : isNeg
                          ? 'var(--color-error, var(--color-text-primary))'
                          : 'var(--color-success, var(--color-text-primary))',
                    }}
                  >
                    {isZero ? '—' : (isNeg ? '' : '+') + `$${p.delta.toFixed(2)}`}
                  </span>
                </div>
              )
            })}
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <ChoiceButton
            label="Apply correction"
            sublabel={`Updates the period and records a -$${lessAmount.toFixed(2)} adjustment to the ledger.`}
            onClick={() => handleClick('apply')}
            disabled={isApplying}
            variant="primary"
          />
          <ChoiceButton
            label="Zero it out"
            sublabel="Updates the period percentages but writes no financial correction. The original earned amount stands."
            onClick={() => handleClick('zero')}
            disabled={isApplying}
            variant="secondary"
          />
          <ChoiceButton
            label="Cancel"
            sublabel="Nothing changes. Period stays as-is."
            onClick={() => handleClick('cancel')}
            disabled={isApplying}
            variant="ghost"
          />
        </div>
      </div>
    </ModalV2>
  )
}

function ChoiceButton({
  label,
  sublabel,
  onClick,
  disabled,
  variant,
}: {
  label: string
  sublabel: string
  onClick: () => void
  disabled: boolean
  variant: 'primary' | 'secondary' | 'ghost'
}) {
  const styles: Record<typeof variant, React.CSSProperties> = {
    primary: {
      background: 'var(--color-btn-primary-bg)',
      color: 'var(--color-btn-primary-text)',
      border: '1px solid var(--color-btn-primary-bg)',
    },
    secondary: {
      background: 'var(--color-bg-secondary)',
      color: 'var(--color-text-primary)',
      border: '1px solid var(--color-border-default, var(--color-border))',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--color-text-secondary)',
      border: '1px solid transparent',
    },
  }
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        padding: '0.75rem 1rem',
        borderRadius: 'var(--vibe-radius-input, 8px)',
        textAlign: 'left',
        cursor: disabled ? 'wait' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        ...styles[variant],
      }}
    >
      <div style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600 }}>{label}</div>
      <div
        style={{
          fontSize: 'var(--font-size-xs)',
          marginTop: '0.125rem',
          opacity: 0.85,
          lineHeight: 1.35,
        }}
      >
        {sublabel}
      </div>
    </button>
  )
}
