import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, X, Share2, Lock, Info } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import { FeatureGuide } from '@/components/shared'

/**
 * PRD-02 Screen 4 — Teen-facing transparency panel.
 * Shows teens exactly what each audience (Mom / Dad / Family) can see about them.
 *
 * Rules:
 *  - Mom column: ✓ by default; ✗ if mom placed a self-restriction on that feature for this teen
 *  - Dad column: ✓ if member_permissions grants view/contribute/manage for this teen; ✗ otherwise
 *  - Family column: ✓ if teen has an active teen_sharing_override; [Share] button if not
 *    (teen can only share UP — they cannot un-share once shared)
 *  - Teen cannot change Mom or Dad columns — read-only display only
 */

// ─── Feature definitions shown in the grid ───────────────────────────────────

const TEEN_FEATURES: { key: string; display: string }[] = [
  { key: 'journal_basic', display: 'Journal' },
  { key: 'innerworkings_basic', display: 'InnerWorkings' },
  { key: 'guiding_stars_basic', display: 'Guiding Stars' },
  { key: 'best_intentions', display: 'Best Intentions' },
  { key: 'victory_recorder_basic', display: 'Victories' },
  { key: 'tasks_basic', display: 'Tasks' },
  { key: 'calendar_basic', display: 'Calendar' },
]

// ─── Types ────────────────────────────────────────────────────────────────────

interface MomRestriction {
  id: string
  feature_key: string
  restriction_type: 'full' | 'tag'
}

interface MemberPermissionRow {
  id: string
  permission_key: string
  access_level: 'none' | 'view' | 'contribute' | 'manage'
}

interface TeenSharingOverride {
  id: string
  feature_key: string
}

// ─── Visibility cell components ───────────────────────────────────────────────

function CheckCell() {
  return (
    <span
      className="inline-flex items-center justify-center w-8 h-8 rounded-full"
      style={{ backgroundColor: 'color-mix(in srgb, var(--color-sage-teal, #68a395) 15%, transparent)' }}
      aria-label="Can see"
    >
      <Check
        size={15}
        strokeWidth={2.5}
        style={{ color: 'var(--color-sage-teal, #68a395)' }}
      />
    </span>
  )
}

function CrossCell() {
  return (
    <span
      className="inline-flex items-center justify-center w-8 h-8 rounded-full"
      style={{ backgroundColor: 'color-mix(in srgb, var(--color-text-secondary, #9ca3af) 10%, transparent)' }}
      aria-label="Cannot see"
    >
      <X
        size={15}
        strokeWidth={2.5}
        style={{ color: 'var(--color-text-secondary, #9ca3af)', opacity: 0.6 }}
      />
    </span>
  )
}

function ShareButton({ onClick, loading }: { onClick: () => void; loading: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all disabled:opacity-50"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-golden-honey, #d6a461) 15%, transparent)',
        color: 'var(--color-golden-honey, #d6a461)',
        border: '1px solid color-mix(in srgb, var(--color-golden-honey, #d6a461) 35%, transparent)',
      }}
      aria-label="Share with family"
    >
      <Share2 size={11} strokeWidth={2.5} />
      {loading ? '…' : 'Share'}
    </button>
  )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function TeenTransparencyPanel() {
  const { data: member } = useFamilyMember()
  const { data: allMembers } = useFamilyMembers(member?.family_id)

  // Only renders for independent-dashboard members (teens)
  if (!member) return null
  if (member.dashboard_mode !== 'independent' && member.role !== 'member') return null

  // Find dad/additional adult in the family (first one for now; a family may have one)
  const dad = allMembers?.find((m) => m.role === 'additional_adult') ?? null

  return (
    <div
      className="rounded-2xl p-5 space-y-5"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
      }}
    >
      <FeatureGuide
        featureKey="teen_transparency_panel"
        title="What's Shared About You"
        description="This shows what your parents can see. You can share MORE with family, but you can never take it back once shared. Mom's access is controlled by Mom."
        bullets={[
          'Green check = they can see this feature for you',
          'Gray X = they cannot see it',
          'Tap Share to let the whole family see a feature',
        ]}
      />

      <div>
        <h2
          className="text-lg font-bold mb-1"
          style={{ color: 'var(--color-text-heading)', fontFamily: 'var(--font-heading)' }}
        >
          What's Shared About You
        </h2>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
          This shows what your parents can see. You can share{' '}
          <em>more</em> with family but never less. Tap{' '}
          <span
            className="inline-flex items-center gap-0.5 text-xs font-medium px-1.5 py-0.5 rounded"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-golden-honey, #d6a461) 15%, transparent)',
              color: 'var(--color-golden-honey, #d6a461)',
            }}
          >
            <Share2 size={9} /> Share
          </span>{' '}
          to share with family.
        </p>
      </div>

      <TransparencyGrid
        teenId={member.id}
        familyId={member.family_id}
        dadId={dad?.id ?? null}
      />

      {/* Legend */}
      <div
        className="flex flex-wrap items-center gap-x-4 gap-y-1 pt-2 border-t text-xs"
        style={{
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-secondary)',
        }}
      >
        <span className="flex items-center gap-1.5">
          <CheckCell /> Can see
        </span>
        <span className="flex items-center gap-1.5">
          <CrossCell /> Can't see
        </span>
        <span className="flex items-center gap-1.5">
          <span
            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-golden-honey, #d6a461) 15%, transparent)',
              color: 'var(--color-golden-honey, #d6a461)',
            }}
          >
            <Share2 size={9} /> Share
          </span>
          Tap to share with family
        </span>
      </div>
    </div>
  )
}

// ─── Grid: fetches all three data sources and renders the table ───────────────

function TransparencyGrid({
  teenId,
  familyId,
  dadId,
}: {
  teenId: string
  familyId: string
  dadId: string | null
}) {
  const queryClient = useQueryClient()
  const [sharingInFlight, setSharingInFlight] = useState<string | null>(null)

  // 1. Mom self-restrictions for this teen
  const { data: momRestrictions = [] } = useQuery<MomRestriction[]>({
    queryKey: ['mom-self-restrictions-teen', familyId, teenId],
    queryFn: async () => {
      const { data } = await supabase
        .from('mom_self_restrictions')
        .select('id, feature_key, restriction_type')
        .eq('family_id', familyId)
        .eq('target_member_id', teenId)
      return (data ?? []) as MomRestriction[]
    },
  })

  // 2. Dad's member_permissions for this teen (if a dad exists in the family)
  const { data: dadPermissions = [] } = useQuery<MemberPermissionRow[]>({
    queryKey: ['dad-permissions-for-teen', dadId, teenId],
    queryFn: async () => {
      if (!dadId) return []
      const { data } = await supabase
        .from('member_permissions')
        .select('id, permission_key, access_level')
        .eq('family_id', familyId)
        .eq('granted_to', dadId)
        .eq('target_member_id', teenId)
      return (data ?? []) as MemberPermissionRow[]
    },
    enabled: !!dadId,
  })

  // 3. Teen's own sharing overrides (family column)
  //    Guard: if the table doesn't exist, the query catches the error and returns []
  const {
    data: teenOverrides = [],
    isError: overridesTableMissing,
  } = useQuery<TeenSharingOverride[]>({
    queryKey: ['teen-sharing-overrides', teenId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('teen_sharing_overrides')
        .select('id, feature_key')
        .eq('family_id', familyId)
        .eq('teen_id', teenId)

      // Table may not exist yet — treat as empty rather than crashing
      if (error) {
        // Postgres error code 42P01 = undefined_table
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          return []
        }
        throw error
      }
      return (data ?? []) as TeenSharingOverride[]
    },
    retry: false, // don't hammer a missing table
  })

  // ── Derived helpers ──────────────────────────────────────────────────────────

  function momCanSee(featureKey: string): boolean {
    return !momRestrictions.some((r) => r.feature_key === featureKey)
  }

  function dadCanSee(featureKey: string): boolean {
    if (!dadId) return false
    const perm = dadPermissions.find((p) => p.permission_key === featureKey)
    return !!(perm && perm.access_level !== 'none')
  }

  function familyCanSee(featureKey: string): boolean {
    return teenOverrides.some((o) => o.feature_key === featureKey)
  }

  async function shareWithFamily(featureKey: string) {
    // Guard: if the table doesn't exist, show a graceful no-op
    if (overridesTableMissing) return

    setSharingInFlight(featureKey)
    try {
      await supabase.from('teen_sharing_overrides').insert({
        family_id: familyId,
        teen_id: teenId,
        feature_key: featureKey,
      })
      queryClient.invalidateQueries({ queryKey: ['teen-sharing-overrides', teenId] })
    } finally {
      setSharingInFlight(null)
    }
  }

  // ── Column header labels ─────────────────────────────────────────────────────

  const COL_MOM = 'Mom'
  const COL_DAD = dadId ? 'Dad' : null
  const COL_FAMILY = 'Family'

  return (
    <div className="overflow-x-auto -mx-1">
      <table className="w-full min-w-[320px] text-sm border-separate border-spacing-y-0">
        <thead>
          <tr>
            <th
              className="text-left py-2 pr-4 font-semibold text-xs uppercase tracking-wider"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Feature
            </th>
            <th
              className="text-center px-2 py-2 font-semibold text-xs uppercase tracking-wider w-16"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {COL_MOM}
            </th>
            {COL_DAD && (
              <th
                className="text-center px-2 py-2 font-semibold text-xs uppercase tracking-wider w-16"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {COL_DAD}
              </th>
            )}
            <th
              className="text-center px-2 py-2 font-semibold text-xs uppercase tracking-wider w-20"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {COL_FAMILY}
            </th>
          </tr>
        </thead>

        <tbody>
          {TEEN_FEATURES.map(({ key, display }, idx) => {
            const isLast = idx === TEEN_FEATURES.length - 1
            const hasFamily = familyCanSee(key)
            const sharingThis = sharingInFlight === key

            return (
              <tr
                key={key}
                className="transition-colors"
                style={{
                  borderBottom: isLast
                    ? 'none'
                    : '1px solid var(--color-border)',
                }}
              >
                {/* Feature name */}
                <td
                  className="py-3 pr-4 font-medium"
                  style={{ color: 'var(--color-text-primary)' }}
                >
                  {display}
                </td>

                {/* Mom column — read-only, always */}
                <td className="text-center px-2 py-3">
                  {momCanSee(key) ? <CheckCell /> : <CrossCell />}
                </td>

                {/* Dad column — read-only, only if a dad exists */}
                {COL_DAD && (
                  <td className="text-center px-2 py-3">
                    {dadCanSee(key) ? <CheckCell /> : <CrossCell />}
                  </td>
                )}

                {/* Family column — teen can share UP only */}
                <td className="text-center px-2 py-3">
                  {overridesTableMissing ? (
                    // Table doesn't exist yet — show locked state, no crash
                    <span
                      className="inline-flex items-center justify-center w-8 h-8 rounded-full"
                      title="Family sharing coming soon"
                      aria-label="Family sharing coming soon"
                    >
                      <Lock
                        size={13}
                        style={{ color: 'var(--color-text-secondary)', opacity: 0.4 }}
                      />
                    </span>
                  ) : hasFamily ? (
                    <CheckCell />
                  ) : (
                    <ShareButton
                      onClick={() => shareWithFamily(key)}
                      loading={sharingThis}
                    />
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {/* Family sharing coming soon notice — only if table is missing */}
      {overridesTableMissing && (
        <div
          className="mt-3 flex items-start gap-2 rounded-lg px-3 py-2 text-xs"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-text-secondary, #9ca3af) 8%, transparent)',
            color: 'var(--color-text-secondary)',
          }}
        >
          <Info size={13} className="mt-0.5 flex-shrink-0" />
          <span>Family sharing is coming soon. You'll be able to choose what the wider family can see.</span>
        </div>
      )}
    </div>
  )
}
