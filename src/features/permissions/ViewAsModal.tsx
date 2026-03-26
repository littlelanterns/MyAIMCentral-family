import { useEffect } from 'react'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { ViewAsBanner } from './ViewAsBanner'
import { Dashboard } from '@/pages/Dashboard'

/**
 * ViewAsModal — full-screen modal overlay for View As mode (PRD-02 Screen 5).
 *
 * Mom's URL never changes. The child's dashboard experience renders inside
 * a full-screen modal. Mom can switch members or exit to return exactly
 * where she was.
 *
 * Always opens to the viewed member's dashboard — never inherits mom's page.
 * LiLa is NOT available inside View As (per PRD-02).
 */
export function ViewAsModal() {
  const { isViewingAs, viewingAsMember } = useViewAs()

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isViewingAs) {
      document.body.style.overflow = 'hidden'
      return () => {
        document.body.style.overflow = ''
      }
    }
  }, [isViewingAs])

  // Escape key handled by ViewAsBanner's member picker (already has Escape)
  // Exit handled by ViewAsBanner's Exit button

  if (!isViewingAs || !viewingAsMember) return null

  return (
    <div
      className="fixed inset-0 flex flex-col"
      style={{
        zIndex: 55, // Above notepad (z-40), below member picker modal (z-60)
        backgroundColor: 'var(--color-bg-primary)',
      }}
    >
      {/* Persistent banner at top */}
      <div
        className="shrink-0"
        style={{
          position: 'relative',
          zIndex: 2,
        }}
      >
        <ViewAsBanner />
      </div>

      {/* Scrollable content area — renders the viewed member's dashboard */}
      <div
        className="flex-1 overflow-y-auto"
        style={{
          paddingTop: 40, // Height of the banner
        }}
      >
        <div className="max-w-4xl mx-auto p-4 md:p-6 lg:p-8">
          <Dashboard />
        </div>
      </div>
    </div>
  )
}
