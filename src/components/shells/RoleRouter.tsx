import type { ReactNode } from 'react'
import { useShell } from './ShellProvider'
import { MomShell } from './MomShell'
import { AdultShell } from './AdultShell'
import { IndependentShell } from './IndependentShell'
import { GuidedShell } from './GuidedShell'
import { PlayShell } from './PlayShell'

interface RoleRouterProps {
  children: ReactNode
}

export function RoleRouter({ children }: RoleRouterProps) {
  const { shell } = useShell()

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
