/**
 * GamificationSettingsPage — Settings → Gamification
 *
 * Overview page showing all family members with their gamification status.
 * Mom taps a member card to open the full GamificationSettingsModal for
 * that child. Also provides a preview section linking to the visual showcase.
 *
 * Pattern follows AllowanceSettingsPage / HomeworkSettingsPage.
 */

import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Sparkles, Star, Trophy, Eye } from 'lucide-react'
import { useFamily } from '@/hooks/useFamily'
import { useFamilyMembers } from '@/hooks/useFamilyMember'
import { useGamificationConfig } from '@/hooks/useGamificationSettings'
import { getMemberColor } from '@/lib/memberColors'
import { GamificationSettingsModal } from '@/components/gamification/settings/GamificationSettingsModal'

export function GamificationSettingsPage() {
  const { data: family } = useFamily()
  const { data: membersData } = useFamilyMembers(family?.id)
  const members = membersData ?? []
  const [selectedMember, setSelectedMember] = useState<{
    id: string
    name: string
    familyId: string
  } | null>(null)

  // All active members (gamification is available across all shells per convention #220)
  const activeMembers = members.filter(m => m.is_active)

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
            Gamification
          </h1>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Configure points, creatures, sticker books, and rewards for each family member
          </p>
        </div>
      </div>

      {/* Member Cards */}
      <div className="space-y-3">
        {activeMembers.map(member => (
          <MemberGamificationCard
            key={member.id}
            memberId={member.id}
            memberName={member.display_name}
            memberColor={getMemberColor(member)}
            role={member.role}
            dashboardMode={member.dashboard_mode}
            onConfigure={() =>
              setSelectedMember({
                id: member.id,
                name: member.display_name,
                familyId: member.family_id,
              })
            }
          />
        ))}
      </div>

      {/* Preview & Showcase Link */}
      <div
        className="rounded-xl p-4"
        style={{
          backgroundColor: 'var(--color-bg-card)',
          border: '1px solid var(--color-border)',
        }}
      >
        <div className="flex items-center gap-2 mb-2">
          <Eye size={18} style={{ color: 'var(--color-btn-primary-bg)' }} />
          <h3
            className="font-semibold text-sm"
            style={{ color: 'var(--color-text-heading)' }}
          >
            Preview Animations & Reveals
          </h3>
        </div>
        <p className="text-sm mb-3" style={{ color: 'var(--color-text-secondary)' }}>
          See all the creature reveals, celebrations, treasure boxes, and visual effects
          your kids will experience.
        </p>
        <Link
          to="/dev/gamification"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{
            backgroundColor: 'var(--color-bg-secondary)',
            color: 'var(--color-text-primary)',
            border: '1px solid var(--color-border)',
          }}
        >
          <Sparkles size={16} />
          Open Visual Showcase
        </Link>
      </div>

      {/* Gamification Settings Modal */}
      {selectedMember && (
        <GamificationSettingsModal
          isOpen={!!selectedMember}
          onClose={() => setSelectedMember(null)}
          memberId={selectedMember.id}
          memberName={selectedMember.name}
          familyId={selectedMember.familyId}
        />
      )}
    </div>
  )
}

// ── Per-Member Summary Card ─────────────────────────────────────────

function MemberGamificationCard({
  memberId,
  memberName,
  memberColor,
  role,
  dashboardMode,
  onConfigure,
}: {
  memberId: string
  memberName: string
  memberColor: string
  role: string
  dashboardMode: string | null
  onConfigure: () => void
}) {
  const { data: config } = useGamificationConfig(memberId)

  const isEnabled = config?.enabled ?? false
  const roleLabel =
    role === 'primary_parent'
      ? 'Mom'
      : role === 'additional_adult'
        ? 'Adult'
        : role === 'special_adult'
          ? 'Special Adult'
          : dashboardMode === 'play'
            ? 'Play'
            : dashboardMode === 'guided'
              ? 'Guided'
              : dashboardMode === 'independent'
                ? 'Independent'
                : 'Member'

  return (
    <button
      onClick={onConfigure}
      className="w-full text-left rounded-xl p-4 transition-colors"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
          style={{ backgroundColor: memberColor, color: '#fff' }}
        >
          {memberName.charAt(0).toUpperCase()}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <p
              className="text-sm font-semibold truncate"
              style={{ color: 'var(--color-text-heading)' }}
            >
              {memberName}
            </p>
            <span
              className="text-xs px-1.5 py-0.5 rounded-full shrink-0"
              style={{
                backgroundColor: 'color-mix(in srgb, var(--color-btn-primary-bg) 12%, transparent)',
                color: 'var(--color-btn-primary-bg)',
              }}
            >
              {roleLabel}
            </span>
          </div>

          {/* Status summary */}
          <div className="flex items-center gap-3 mt-1">
            {isEnabled ? (
              <>
                <StatusPill
                  icon={Star}
                  label={`${config?.base_points_per_task ?? 10} pts/task`}
                />
                <StatusPill
                  icon={Trophy}
                  label={config?.currency_name ?? 'Stars'}
                />
              </>
            ) : (
              <span className="text-xs" style={{ color: 'var(--color-text-tertiary)' }}>
                Not configured
              </span>
            )}
          </div>
        </div>

        {/* Enable indicator */}
        <div
          className="w-2.5 h-2.5 rounded-full shrink-0"
          style={{
            backgroundColor: isEnabled
              ? 'var(--color-status-success, #22c55e)'
              : 'var(--color-text-tertiary)',
          }}
        />
      </div>
    </button>
  )
}

// ── Status Pill ─────────────────────────────────────────────────────

function StatusPill({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <span
      className="inline-flex items-center gap-1 text-xs"
      style={{ color: 'var(--color-text-secondary)' }}
    >
      <Icon size={12} />
      {label}
    </span>
  )
}
