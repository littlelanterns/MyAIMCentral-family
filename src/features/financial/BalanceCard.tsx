// PRD-28: Balance Card for Independent teen dashboard
// Shows when allowance_configs.child_can_see_finances = true for this member.
// Compact card with current balance + this week's completion %.

import { DollarSign } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAllowanceConfig, useActivePeriod, useRunningBalance } from '@/hooks/useFinancial'

interface BalanceCardProps {
  memberId: string
}

export function BalanceCard({ memberId }: BalanceCardProps) {
  const { data: config } = useAllowanceConfig(memberId)
  const { data: period } = useActivePeriod(config?.enabled ? memberId : undefined)
  const { data: balance } = useRunningBalance(config?.enabled ? memberId : undefined)

  // Only show when allowance is configured AND child can see finances
  if (!config?.enabled || !config.child_can_see_finances) return null

  const currentBalance = balance ?? 0
  const pct = period?.completion_percentage ?? 0

  return (
    <Link
      to="/finances/history"
      className="block rounded-xl p-4 transition-colors"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, transparent)',
          }}
        >
          <DollarSign size={20} style={{ color: 'var(--color-btn-primary-bg)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium" style={{ color: 'var(--color-text-heading)' }}>
            My Balance
          </div>
          <div className="text-lg font-bold" style={{ color: 'var(--color-text-heading)' }}>
            ${currentBalance.toFixed(2)}
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs" style={{ color: 'var(--color-text-muted)' }}>
            This week
          </div>
          <div
            className="text-sm font-semibold"
            style={{
              color: pct >= 80 ? 'var(--color-success)' : pct >= 50 ? 'var(--color-warning)' : 'var(--color-text-secondary)',
            }}
          >
            {pct.toFixed(0)}%
          </div>
        </div>
      </div>
    </Link>
  )
}
