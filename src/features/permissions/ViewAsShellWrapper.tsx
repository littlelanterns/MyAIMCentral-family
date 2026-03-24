import { type ReactNode } from 'react'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { ViewAsBanner } from './ViewAsBanner'

/**
 * Height of the ViewAsBanner in pixels. Content is pushed down by this
 * amount via padding-top when View As mode is active, so the banner never
 * overlaps page content.
 */
const BANNER_HEIGHT = 40

interface ViewAsShellWrapperProps {
  children: ReactNode
}

/**
 * ViewAsShellWrapper — place this inside a shell, wrapping the main content area.
 *
 * When NOT viewing as anyone: renders children unchanged.
 * When viewing as a family member: renders the sticky ViewAsBanner above the
 * children and adds padding-top so the banner does not overlap content.
 *
 * Usage (inside MomShell or any shell's main content div):
 *
 *   <ViewAsShellWrapper>
 *     <main className="flex-1 p-4 md:p-6 lg:p-8 pb-24 md:pb-16">
 *       {children}
 *     </main>
 *   </ViewAsShellWrapper>
 */
export function ViewAsShellWrapper({ children }: ViewAsShellWrapperProps) {
  const { isViewingAs } = useViewAs()

  if (!isViewingAs) {
    // Pass through with no modifications — zero overhead when inactive
    return <>{children}</>
  }

  return (
    <>
      {/* Fixed banner — rendered here so it shares the same stacking context
          as the shell it belongs to. z-index 45 keeps it below modals (z-50+)
          but above all regular shell content. */}
      <ViewAsBanner />

      {/* Push content down by the banner height so nothing is obscured */}
      <div style={{ paddingTop: BANNER_HEIGHT }}>
        {children}
      </div>
    </>
  )
}
