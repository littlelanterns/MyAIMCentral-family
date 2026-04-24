/**
 * Hardcoded super-admin emails. Always have admin-console access regardless of
 * `staff_permissions` rows. Source of truth: PRD-32 Screen 1.
 *
 * All values MUST be lowercase. Compare against `user.email?.toLowerCase().trim()`.
 */
export const SUPER_ADMIN_EMAILS = [
  'tenisewertman@gmail.com',
  'aimagicformoms@gmail.com',
  '3littlelanterns@gmail.com',
] as const

export function isSuperAdminEmail(email: string | null | undefined): boolean {
  const normalized = email?.toLowerCase().trim()
  if (!normalized) return false
  return (SUPER_ADMIN_EMAILS as readonly string[]).includes(normalized)
}
