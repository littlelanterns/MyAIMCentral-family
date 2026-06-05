import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, RefreshCw, X, ListTodo, Home } from 'lucide-react'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { ViewAsMemberPicker } from './ViewAsMemberPicker'

/** Maps FamilyMember dashboard_mode + role to a readable label shown in the banner. */
function getModeLabel(
  dashboardMode: string | null,
  role: string,
): string {
  if (dashboardMode === 'play') return 'Play'
  if (dashboardMode === 'guided') return 'Guided'
  if (dashboardMode === 'independent') return 'Independent'
  if (dashboardMode === 'adult') return 'Adult'
  // Fallback: derive from role
  if (role === 'primary_parent') return 'Mom'
  if (role === 'additional_adult') return 'Adult'
  if (role === 'special_adult') return 'Special Adult'
  return 'Member'
}

/**
 * ViewAsBanner — persistent banner shown at the top of the viewport when
 * View As mode is active. Fixed position, z-index 45.
 *
 * Only renders when `isViewingAs === true`.
 */
export function ViewAsBanner() {
  const { isViewingAs, viewingAsMember, stopViewAs, origin } = useViewAs()
  const [pickerOpen, setPickerOpen] = useState(false)
  const navigate = useNavigate()

  if (!isViewingAs || !viewingAsMember) return null

  const modeLabel = getModeLabel(viewingAsMember.dashboard_mode, viewingAsMember.role)

  // Convention #39: member_session is the hub-initiated kid flow — the real
  // human at the device IS the kid. Mom-y affordances are hidden:
  //   - "Manage Tasks" jumps to mom's adult Tasks page (not for a kid).
  //   - "Switch" opens the member picker; because the real viewer is mom, that
  //     picker would list ALL members, letting a kid hop into a sibling's
  //     session. Hide it so the hub session stays scoped to the one kid.
  // Exit becomes "Return to Hub" (the modal closes back onto /hub).
  const isMemberSession = origin === 'member_session'

  // Kid shells (Play/Guided/Independent) have no adult task-management UI. Offer
  // a fast exit to the adult Tasks page pre-filtered to this child — mom only.
  const childMode = viewingAsMember.dashboard_mode === 'play'
    || viewingAsMember.dashboard_mode === 'guided'
    || viewingAsMember.dashboard_mode === 'independent'

  const goManageTasks = () => {
    const targetId = viewingAsMember.id
    stopViewAs()
    navigate(`/tasks?member=${targetId}`)
  }

  return (
    <>
      <div
        role="status"
        aria-live="polite"
        className="fixed top-0 left-0 right-0 z-45 flex items-center justify-between gap-2 px-4 py-2 text-sm font-medium select-none"
        style={{
          backgroundColor: 'var(--surface-primary, var(--color-btn-primary-bg))',
          color: 'var(--color-text-on-primary, #fff)',
          borderBottom: '1px solid var(--color-accent-deep, var(--color-border-default))',
          zIndex: 45,
        }}
      >
        {/* Left: identity */}
        <div className="flex items-center gap-2 min-w-0">
          <Eye size={16} className="shrink-0" />
          <span className="truncate">
            Viewing as{' '}
            <span className="font-semibold">{viewingAsMember.display_name}</span>
            {' '}
            <span className="opacity-80">({modeLabel})</span>
          </span>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 shrink-0">
          {!isMemberSession && childMode && (
            <button
              onClick={goManageTasks}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all hover:scale-105 active:scale-95"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                color: 'var(--color-text-on-primary, #fff)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
              }}
              aria-label={`Manage ${viewingAsMember.display_name}'s tasks`}
            >
              <ListTodo size={12} />
              <span className="hidden sm:inline">Manage Tasks</span>
            </button>
          )}
          {!isMemberSession && (
            <button
              onClick={() => setPickerOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all hover:scale-105 active:scale-95"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                color: 'var(--color-text-on-primary, #fff)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
              }}
              aria-label="Switch to a different family member"
            >
              <RefreshCw size={12} />
              <span className="hidden sm:inline">Switch</span>
            </button>
          )}

          <button
            onClick={() => stopViewAs()}
            data-testid="view-as-exit"
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all hover:scale-105 active:scale-95"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              color: 'var(--color-text-on-primary, #fff)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
            }}
            aria-label={isMemberSession ? 'Return to the family hub' : 'Exit View As and return to your own view'}
          >
            {isMemberSession ? <Home size={12} /> : <X size={12} />}
            <span className="hidden sm:inline">{isMemberSession ? 'Return to Hub' : 'Exit'}</span>
          </button>
        </div>
      </div>

      {/* Picker modal — opened by [Switch]. Not rendered in member_session
          (the Switch button is hidden there). */}
      {!isMemberSession && (
        <ViewAsMemberPicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
      )}
    </>
  )
}
