import { useState } from 'react'
import { Eye, RefreshCw, X } from 'lucide-react'
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
  const { isViewingAs, viewingAsMember, stopViewAs } = useViewAs()
  const [pickerOpen, setPickerOpen] = useState(false)

  if (!isViewingAs || !viewingAsMember) return null

  const modeLabel = getModeLabel(viewingAsMember.dashboard_mode, viewingAsMember.role)

  return (
    <>
      <div
        role="status"
        aria-live="polite"
        className="fixed top-0 left-0 right-0 z-45 flex items-center justify-between gap-2 px-4 py-2 text-sm font-medium select-none"
        style={{
          backgroundColor: 'var(--color-golden-honey, #d6a461)',
          color: 'var(--color-text-on-primary, #fff)',
          zIndex: 45,
        }}
      >
        {/* Left: identity */}
        <div className="flex items-center gap-2 min-w-0">
          <Eye size={16} className="flex-shrink-0" />
          <span className="truncate">
            Viewing as{' '}
            <span className="font-semibold">{viewingAsMember.display_name}</span>
            {' '}
            <span className="opacity-80">({modeLabel})</span>
          </span>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
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

          <button
            onClick={() => stopViewAs()}
            className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold transition-all hover:scale-105 active:scale-95"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.25)',
              color: 'var(--color-text-on-primary, #fff)',
              border: '1px solid rgba(255, 255, 255, 0.4)',
            }}
            aria-label="Exit View As and return to your own view"
          >
            <X size={12} />
            <span className="hidden sm:inline">Exit</span>
          </button>
        </div>
      </div>

      {/* Picker modal — opened by [Switch] */}
      <ViewAsMemberPicker open={pickerOpen} onClose={() => setPickerOpen(false)} />
    </>
  )
}
