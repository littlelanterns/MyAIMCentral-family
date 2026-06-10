import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useShell } from './ShellProvider'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { MomShell } from './MomShell'
import { AdultShell } from './AdultShell'
import { IndependentShell } from './IndependentShell'
import { GuidedShell } from './GuidedShell'
import { PlayShell } from './PlayShell'
import { ViewAsModal } from '@/features/permissions/ViewAsModal'
import type { ShellType } from '@/lib/theme'

interface RoleRouterProps {
  children: ReactNode
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
  const { data: currentMember } = useFamilyMember()

  // Family identity sessions (role='family' — hub-resting family devices,
  // Family-Auth-Two-Door) have no personal shell. Any shell-route navigation
  // goes to the Hub instead.
  if (currentMember?.role === 'family') {
    return <Navigate to="/hub" replace />
  }

  // View As is now a modal overlay (PRD-02 Screen 5) — mom's shell stays
  // underneath, URL never changes. The ViewAsModal renders on top when active.
  return (
    <>
      {renderShell(shell, children)}
      <ViewAsModal />
    </>
  )
}
