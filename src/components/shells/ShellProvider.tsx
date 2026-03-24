import { createContext, useContext, type ReactNode } from 'react'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import type { ShellType } from '@/lib/theme'

interface ShellContextType {
  shell: ShellType
  role: string | null
  memberId: string | null
  memberName: string | null
}

const ShellContext = createContext<ShellContextType>({
  shell: 'mom',
  role: null,
  memberId: null,
  memberName: null,
})

export function useShell() {
  return useContext(ShellContext)
}

/**
 * Shell routing: PRD-01 Founder Ruling
 * Role = structural identity (4 values). Dashboard mode = experience shell.
 * primary_parent always gets MomShell (no dashboard_mode needed).
 * All others use dashboard_mode to determine shell.
 */
function getShellForMember(role: string, dashboardMode: string | null): ShellType {
  if (role === 'primary_parent') return 'mom'
  if (dashboardMode === 'independent') return 'independent'
  if (dashboardMode === 'guided') return 'guided'
  if (dashboardMode === 'play') return 'play'
  // additional_adult, special_adult, or member with 'adult' dashboard_mode
  return 'adult'
}

interface ShellProviderProps {
  children: ReactNode
}

export function ShellProvider({ children }: ShellProviderProps) {
  const { data: member } = useFamilyMember()

  const shell = member ? getShellForMember(member.role, member.dashboard_mode) : 'mom'

  return (
    <ShellContext.Provider
      value={{
        shell,
        role: member?.role ?? null,
        memberId: member?.id ?? null,
        memberName: member?.display_name ?? null,
      }}
    >
      {children}
    </ShellContext.Provider>
  )
}
