// PRD-28 Screen 1: Allowance & Finances Settings (All Children)
// Entry: Settings → Allowance & Finances

import { useState } from 'react'
import { ArrowLeft, Plus, Settings, Users } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { useFamily } from '@/hooks/useFamily'
import { useFamilyMembers } from '@/hooks/useFamilyMember'
import { useAllowanceConfigs, useRunningBalance } from '@/hooks/useFinancial'
import { getMemberColor } from '@/lib/memberColors'
import { CALCULATION_APPROACH_LABELS } from '@/types/financial'
import { BulkConfigureAllowanceModal } from './BulkConfigureAllowanceModal'

export function AllowanceSettingsPage() {
  const { data: family } = useFamily()
  const { data: membersData } = useFamilyMembers(family?.id)
  const members = membersData ?? []
  const { data: configs } = useAllowanceConfigs(family?.id)
  const navigate = useNavigate()
  const [bulkOpen, setBulkOpen] = useState(false)

  // Filter to children only (role = 'member')
  const children = members.filter(m => m.role === 'member' && m.is_active)
  const configuredIds = new Set((configs ?? []).map(c => c.family_member_id))
  const unconfigured = children.filter(m => !configuredIds.has(m.id))

  return (
    <div className="density-comfortable max-w-2xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          to="/settings"
          className="p-2 rounded-lg transition-colors hidden md:flex"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--color-text-heading)' }}>
            Allowance & Finances
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Configure allowance and track finances for each child
          </p>
        </div>
      </div>

      {/* Bulk Configure entry (Path X) */}
      {children.length > 1 && (
        <button
          type="button"
          onClick={() => setBulkOpen(true)}
          data-testid="open-bulk-configure"
          className="w-full flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-colors"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 8%, transparent)',
            color: 'var(--color-btn-primary-bg)',
            border: '1px dashed var(--color-btn-primary-bg)',
          }}
        >
          <Users size={16} />
          Bulk Configure — set multiple kids at once
        </button>
      )}

      {/* Child Cards */}
      <div className="space-y-3">
        {children.map(child => {
          const config = (configs ?? []).find(c => c.family_member_id === child.id)
          return (
            <ChildSummaryCard
              key={child.id}
              memberId={child.id}
              memberName={child.display_name}
              memberColor={getMemberColor(child)}
              age={child.age}
              config={config}
              onConfigure={() => navigate(`/settings/allowance/${child.id}`)}
            />
          )
        })}
      </div>

      {/* Add allowance for unconfigured children */}
      {unconfigured.length > 0 && (
        <div
          className="rounded-xl p-4"
          style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
        >
          <button
            onClick={() => navigate(`/settings/allowance/${unconfigured[0].id}`)}
            className="flex items-center gap-2 text-sm font-medium w-full"
            style={{ color: 'var(--color-btn-primary-bg)' }}
          >
            <Plus size={16} />
            Set Up Allowance for {unconfigured.map(m => m.display_name).join(', ')}
          </button>
        </div>
      )}

      {/* Family Financial Summary */}
      <FamilyFinancialSummary familyId={family?.id} />

      {/* Bulk Configure modal */}
      {family?.id && (
        <BulkConfigureAllowanceModal
          familyId={family.id}
          isOpen={bulkOpen}
          onClose={() => setBulkOpen(false)}
        />
      )}
    </div>
  )
}

// ── Child Summary Card ──────────────────────────────────────

function ChildSummaryCard({
  memberId,
  memberName,
  memberColor,
  age,
  config,
  onConfigure,
}: {
  memberId: string
  memberName: string
  memberColor: string
  age?: number | null
  config?: { enabled: boolean; weekly_amount: number; calculation_approach: string } | null
  onConfigure: () => void
}) {
  const { data: balance } = useRunningBalance(memberId)

  const approachLabel = config
    ? CALCULATION_APPROACH_LABELS[config.calculation_approach as keyof typeof CALCULATION_APPROACH_LABELS]?.label ?? config.calculation_approach
    : null

  return (
    <div
      className="rounded-xl p-4"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: `2px solid ${memberColor}`,
      }}
    >
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold" style={{ color: 'var(--color-text-heading)' }}>
              {memberName}
            </h3>
            {age && (
              <span className="text-xs px-2 py-0.5 rounded-full" style={{
                backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, transparent)',
                color: 'var(--color-text-secondary)',
              }}>
                age {age}
              </span>
            )}
          </div>
          {config?.enabled ? (
            <div className="mt-1 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
              ${Number(config.weekly_amount).toFixed(2)}/week · {approachLabel}
            </div>
          ) : (
            <div className="mt-1 text-sm" style={{ color: 'var(--color-text-muted)' }}>
              {config ? 'Allowance paused' : 'No allowance configured'}
            </div>
          )}
          <div className="mt-1 text-sm font-medium" style={{
            color: (balance ?? 0) > 0 ? 'var(--color-text-heading)' : 'var(--color-text-secondary)',
          }}>
            Balance: {(balance ?? 0) > 0 ? `$${(balance ?? 0).toFixed(2)} owed` : '$0.00 (paid up)'}
          </div>
        </div>
        <button
          onClick={onConfigure}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 10%, transparent)',
            color: 'var(--color-btn-primary-bg)',
          }}
        >
          <Settings size={14} />
          Configure
        </button>
      </div>
    </div>
  )
}

// ── Family Financial Summary ────────────────────────────────

function FamilyFinancialSummary({ familyId }: { familyId?: string }) {
  if (!familyId) return null

  return (
    <div
      className="rounded-xl p-4"
      style={{ backgroundColor: 'var(--color-bg-card)', border: '1px solid var(--color-border)' }}
    >
      <h3 className="font-semibold text-sm mb-2" style={{ color: 'var(--color-text-heading)' }}>
        Family Financial Summary
      </h3>
      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
        View detailed balances and recent transactions on the{' '}
        <Link
          to="/tasks?tab=finances"
          className="font-medium underline"
          style={{ color: 'var(--color-btn-primary-bg)' }}
        >
          Tasks → Finances tab
        </Link>
      </p>
    </div>
  )
}
