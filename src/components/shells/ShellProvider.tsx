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

function getShellForRole(role: string): ShellType {
  switch (role) {
    case 'primary_parent': return 'mom'
    case 'additional_adult': return 'adult'
    case 'special_adult': return 'adult'
    case 'independent': return 'independent'
    case 'guided': return 'guided'
    case 'play': return 'play'
    default: return 'mom'
  }
}

interface ShellProviderProps {
  children: ReactNode
}

export function ShellProvider({ children }: ShellProviderProps) {
  const { data: member } = useFamilyMember()

  const shell = member ? getShellForRole(member.role) : 'mom'

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
