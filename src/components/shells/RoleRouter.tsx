import type { ReactNode } from 'react'
import { useShell } from './ShellProvider'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { ViewAsBanner } from '@/features/permissions/ViewAsBanner'
import { MomShell } from './MomShell'
import { AdultShell } from './AdultShell'
import { IndependentShell } from './IndependentShell'
import { GuidedShell } from './GuidedShell'
import { PlayShell } from './PlayShell'
import type { ShellType } from '@/lib/theme'

interface RoleRouterProps {
  children: ReactNode
}

/** Map member role + dashboard_mode to shell type */
function memberToShell(role: string, dashboardMode: string | null): ShellType {
  if (role === 'primary_parent') return 'mom'
  if (dashboardMode === 'independent') return 'independent'
  if (dashboardMode === 'guided') return 'guided'
  if (dashboardMode === 'play') return 'play'
  return 'adult'
}

function renderShell(shell: ShellType, children: ReactNode): ReactNode {
  switch (shell) {
    case 'mom':
      return <MomShell>{children}</MomShell>
    case 'adult':
      return <AdultShell>{children}</AdultShell>
    case 'independent':
      return <IndependentShell>{children}</IndependentShell>
    case 'guided':
      return <GuidedShell>{children}</GuidedShell>
    case 'play':
      return <PlayShell>{children}</PlayShell>
    default:
      return <MomShell>{children}</MomShell>
  }
}

export function RoleRouter({ children }: RoleRouterProps) {
  const { shell } = useShell()
  const { isViewingAs, viewingAsMember } = useViewAs()

  // When View As is active, render the TARGET member's shell
  // so mom sees exactly what that member sees (PRD-04).
  // ViewAsBanner rendered at this level so it appears in ANY target shell.
  if (isViewingAs && viewingAsMember) {
    const targetShell = memberToShell(viewingAsMember.role, viewingAsMember.dashboard_mode)
    return (
      <>
        <ViewAsBanner />
        <div style={{ paddingTop: 40 }}>
          {renderShell(targetShell, children)}
        </div>
      </>
    )
  }

  return <>{renderShell(shell, children)}</>
}
