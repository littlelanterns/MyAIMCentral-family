/**
 * useEffectiveShell — returns the ShellType for the current render.
 *
 * Inside a View-As modal scope, returns the View-As target's shell.
 * Outside, delegates to `useShell()` and returns the auth user's shell.
 *
 * Contract: ALWAYS returns a `ShellType`, never a raw `dashboard_mode`
 * string. Worker 2 (sidebar/bottom-nav rewrite) must be able to
 * drop-in replace `useShell()` with `useEffectiveShell()` at every
 * call site without re-deriving the shell key. If you find yourself
 * post-processing this return value, you have built (or are calling)
 * the wrong contract.
 *
 * The mapping `(role, dashboard_mode) → ShellType` lives exclusively
 * in `getShellForMember()` in `ShellProvider.tsx`. We do NOT
 * reimplement the mapping here. Single source of truth.
 *
 * Convention #39 (View As Identity-Scope Architecture).
 */

import { useShell } from '@/components/shells/ShellProvider'
import { getShellForMember } from '@/components/shells/ShellProvider'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import type { ShellType } from '@/lib/theme'

export function useEffectiveShell(): ShellType {
  const { shell: realShell } = useShell()
  const { isViewingAs, viewingAsMember } = useViewAs()

  if (!isViewingAs || !viewingAsMember) return realShell

  return getShellForMember(viewingAsMember.role, viewingAsMember.dashboard_mode)
}
