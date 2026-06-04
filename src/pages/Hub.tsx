/**
 * HubPage — PRD-14D Standalone Family Hub
 *
 * Renders FamilyHub in standalone mode (full viewport, no shell chrome).
 * This is the entry point for shared family tablets and the /hub PWA bookmark.
 * Hub Mode (kiosk lock) is managed within the FamilyHub component.
 *
 * ViewAsModal is mounted here so the hub member_session flow (a kid taps their
 * avatar and authenticates with their PIN — HubMemberAuthModal calls
 * startViewAs(..., { origin: 'member_session' })) actually renders the target's
 * shell over the hub. The /hub route uses ProtectedRouteNoShell (no RoleRouter),
 * so the ViewAsModal mounted inside RoleRouter never appears here. /hub and the
 * shell routes are mutually exclusive — the user is on one or the other, never
 * both — so this second mount can never double-render with RoleRouter's instance.
 * ViewAsModal returns null when no View-As session is active and carries its own
 * shells + SettingsProvider, so it is self-sufficient outside ShellProvider.
 */

import { FamilyHub } from '@/components/hub/FamilyHub'
import { ViewAsModal } from '@/features/permissions/ViewAsModal'

export function HubPage() {
  return (
    <>
      <FamilyHub context="standalone" />
      <ViewAsModal />
    </>
  )
}
