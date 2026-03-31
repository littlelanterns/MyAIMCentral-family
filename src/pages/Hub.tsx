/**
 * HubPage — PRD-14D Standalone Family Hub
 *
 * Renders FamilyHub in standalone mode (full viewport, no shell chrome).
 * This is the entry point for shared family tablets and the /hub PWA bookmark.
 * Hub Mode (kiosk lock) is managed within the FamilyHub component.
 */

import { FamilyHub } from '@/components/hub/FamilyHub'

export function HubPage() {
  return <FamilyHub context="standalone" />
}
