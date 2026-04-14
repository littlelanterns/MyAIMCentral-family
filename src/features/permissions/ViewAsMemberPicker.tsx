import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import MemberSortToggle from '@/components/shared/MemberSortToggle'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { useFamilyMember, useFamilyMembers } from '@/hooks/useFamilyMember'
import type { FamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { supabase } from '@/lib/supabase/client'

export interface ViewAsMemberPickerProps {
  open: boolean
  onClose: () => void
}

/** Maps dashboard_mode + role to the short label shown under each avatar. */
function getModeLabel(
  dashboardMode: string | null,
  role: string,
): string {
  if (dashboardMode === 'play') return 'Play'
  if (dashboardMode === 'guided') return 'Guided'
  if (dashboardMode === 'independent') return 'Teen'
  if (dashboardMode === 'adult') return 'Adult'
  if (role === 'primary_parent') return 'Mom'
  if (role === 'additional_adult') return 'Adult'
  if (role === 'special_adult') return 'Special'
  return 'Member'
}

/** Single member card inside the picker grid. */
function MemberCard({
  member,
  isCurrentlyViewing,
  onClick,
}: {
  member: FamilyMember
  isCurrentlyViewing: boolean
  onClick: () => void
}) {
  const initial = member.display_name.charAt(0).toUpperCase()
  const avatarBg = member.member_color || 'var(--color-btn-primary-bg, #68a395)'
  const modeLabel = getModeLabel(member.dashboard_mode, member.role)

  return (
    <button
      onClick={onClick}
      disabled={isCurrentlyViewing}
      className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-default disabled:hover:scale-100"
      style={{
        backgroundColor: isCurrentlyViewing
          ? 'var(--color-bg-secondary, #f3f4f6)'
          : 'transparent',
        border: isCurrentlyViewing
          ? '2px solid var(--color-golden-honey, #d6a461)'
          : '2px solid transparent',
      }}
      aria-label={`View as ${member.display_name}`}
      aria-pressed={isCurrentlyViewing}
    >
      {/* Avatar circle */}
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center text-xl font-bold text-white shrink-0 overflow-hidden"
        style={{ backgroundColor: avatarBg }}
      >
        {member.avatar_url ? (
          <img
            src={member.avatar_url}
            alt={member.display_name}
            className="w-full h-full object-cover"
          />
        ) : (
          initial
        )}
      </div>

      {/* Name */}
      <span
        className="text-xs font-semibold text-center leading-tight max-w-[72px] truncate"
        style={{ color: 'var(--color-text-primary)' }}
      >
        {member.display_name}
      </span>

      {/* Shell label */}
      <span
        className="text-[10px] font-medium px-2 py-0.5 rounded-full"
        style={{
          backgroundColor: 'var(--color-bg-secondary, #f3f4f6)',
          color: 'var(--color-text-secondary)',
        }}
      >
        {modeLabel}
      </span>
    </button>
  )
}

/**
 * ViewAsMemberPicker — modal overlay for selecting which family member to view as.
 *
 * Excludes the real viewer (mom herself) and inactive members.
 * Handles both "start fresh" and "switch while already in View As" flows.
 */
export function ViewAsMemberPicker({ open, onClose }: ViewAsMemberPickerProps) {
  const { data: selfMember } = useFamilyMember()
  const { data: family } = useFamily()
  const { data: allMembers = [] } = useFamilyMembers(family?.id)
  const { isViewingAs, viewingAsMember, realViewerId, startViewAs, switchViewAs } = useViewAs()

  const overlayRef = useRef<HTMLDivElement>(null)
  const dialogRef = useRef<HTMLDivElement>(null)

  // Close on Escape
  useEffect(() => {
    if (!open) return
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  // Trap focus inside the dialog when open
  useEffect(() => {
    if (open) {
      // Small delay to let the DOM settle before focusing
      const id = setTimeout(() => dialogRef.current?.focus(), 50)
      return () => clearTimeout(id)
    }
  }, [open])

  // Load view_as_permissions for non-mom viewers
  const [permittedMemberIds, setPermittedMemberIds] = useState<Set<string> | null>(null)
  const isMom = selfMember?.role === 'primary_parent'

  useEffect(() => {
    if (!open || !selfMember || !family) return
    // Mom has implicit full access — skip permission check
    if (isMom) {
      setPermittedMemberIds(null) // null = no filtering
      return
    }
    // Non-mom: check view_as_permissions
    supabase
      .from('view_as_permissions')
      .select('target_member_id')
      .eq('family_id', family.id)
      .eq('viewer_id', selfMember.id)
      .eq('enabled', true)
      .then(({ data }) => {
        if (data) {
          setPermittedMemberIds(new Set(data.map(r => r.target_member_id)))
        } else {
          setPermittedMemberIds(new Set()) // no permissions = can't view anyone
        }
      })
  }, [open, selfMember?.id, family?.id, isMom])

  if (!open) return null

  // The real viewer is: realViewerId when already in View As, otherwise selfMember.id
  const realId = realViewerId ?? selfMember?.id

  // Exclude: the real viewer themselves, out-of-nest members, inactive members
  // Non-mom: also filter by view_as_permissions
  const pickableMembers = allMembers.filter(
    (m) =>
      m.id !== realId &&
      m.is_active &&
      !m.out_of_nest &&
      (isMom || permittedMemberIds === null || permittedMemberIds.has(m.id)),
  )

  function handleSelect(member: FamilyMember) {
    if (!selfMember || !family) return

    if (isViewingAs) {
      // Already viewing someone — switch to the new member
      switchViewAs(member)
    } else {
      // Fresh start — use selfMember as the real viewer
      startViewAs(member, selfMember.id, family.id)
    }
    onClose()
  }

  return (
    /* Backdrop */
    <div
      ref={overlayRef}
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{
        zIndex: 60,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(2px)',
      }}
      onClick={(e) => {
        // Close when clicking the backdrop, not the dialog
        if (e.target === overlayRef.current) onClose()
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Choose a family member to view as"
    >
      {/* Dialog card */}
      <div
        ref={dialogRef}
        tabIndex={-1}
        className="relative w-full max-w-sm rounded-2xl p-5 shadow-2xl outline-none"
        style={{
          backgroundColor: 'var(--color-bg-card, #ffffff)',
          border: '1px solid var(--color-border)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center"
              style={{ backgroundColor: 'var(--color-golden-honey, #d6a461)' }}
            >
              <span style={{ color: 'var(--color-text-on-primary, #fff)', fontSize: 14 }}>👁</span>
            </div>
            <h2
              className="text-base font-semibold"
              style={{ color: 'var(--color-text-heading)' }}
            >
              View As…
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-text-secondary)' }}
            aria-label="Close member picker"
          >
            <X size={18} />
          </button>
        </div>

        {/* Sort toggle + Member grid */}
        {pickableMembers.length > 2 && (
          <div className="flex justify-end mb-2">
            <MemberSortToggle />
          </div>
        )}
        {pickableMembers.length === 0 ? (
          <p
            className="text-sm text-center py-6"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            No other active family members to view as.
          </p>
        ) : (
          <div className="grid grid-cols-3 gap-1 mb-4">
            {pickableMembers.map((member) => (
              <MemberCard
                key={member.id}
                member={member}
                isCurrentlyViewing={viewingAsMember?.id === member.id}
                onClick={() => handleSelect(member)}
              />
            ))}
          </div>
        )}

        {/* Instructional footer */}
        <p
          className="text-xs text-center leading-relaxed"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Tap a family member to see their experience.
          <br />
          All actions will be logged as them.
        </p>
      </div>
    </div>
  )
}
