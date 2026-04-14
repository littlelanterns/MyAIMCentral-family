/**
 * Consistent family member sorting utility.
 *
 * Two modes:
 *   - "age" (default): Role tier first (parents → adults → kids),
 *     then by age descending (oldest first) within each tier.
 *     Members without age sort by display_name within their tier.
 *   - "alphabetical": Simple A-Z by display_name, case-insensitive.
 */

export type MemberSortMode = 'age' | 'alphabetical'

interface Sortable {
  display_name: string
  role: string
  age?: number | null
  date_of_birth?: string | null
  created_at?: string
}

const ROLE_TIER: Record<string, number> = {
  primary_parent: 0,
  additional_adult: 1,
  special_adult: 2,
  member: 3,
}

function roleTier(role: string): number {
  return ROLE_TIER[role] ?? 3
}

/**
 * Derive a numeric age for sorting. Uses `age` if present,
 * otherwise computes from `date_of_birth`. Returns null if
 * neither is available.
 */
function effectiveAge(m: Sortable): number | null {
  if (m.age != null) return m.age
  if (m.date_of_birth) {
    const dob = new Date(m.date_of_birth)
    if (!isNaN(dob.getTime())) {
      const now = new Date()
      let years = now.getFullYear() - dob.getFullYear()
      const monthDiff = now.getMonth() - dob.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) {
        years--
      }
      return years
    }
  }
  return null
}

function compareByAge(a: Sortable, b: Sortable): number {
  // 1. Role tier: parents before kids
  const tierDiff = roleTier(a.role) - roleTier(b.role)
  if (tierDiff !== 0) return tierDiff

  // 2. Within same tier: by age descending (oldest first)
  const ageA = effectiveAge(a)
  const ageB = effectiveAge(b)

  if (ageA != null && ageB != null) {
    if (ageA !== ageB) return ageB - ageA // descending
  }
  // Null ages sort after known ages within the same tier
  if (ageA != null && ageB == null) return -1
  if (ageA == null && ageB != null) return 1

  // 3. Fallback: alphabetical by display_name
  return a.display_name.localeCompare(b.display_name, undefined, { sensitivity: 'base' })
}

function compareAlphabetically(a: Sortable, b: Sortable): number {
  return a.display_name.localeCompare(b.display_name, undefined, { sensitivity: 'base' })
}

/**
 * Sort family members by the chosen mode. Returns a new array
 * (does not mutate the input).
 */
export function sortFamilyMembers<T extends Sortable>(
  members: T[],
  mode: MemberSortMode = 'age',
): T[] {
  const sorted = [...members]
  sorted.sort(mode === 'alphabetical' ? compareAlphabetically : compareByAge)
  return sorted
}

// ─── Preference persistence ─────────────────────────────────────────────────

const STORAGE_KEY = 'myaim_member_sort_mode'

export function getMemberSortPreference(): MemberSortMode {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'alphabetical') return 'alphabetical'
  } catch {
    // localStorage unavailable
  }
  return 'age'
}

export function setMemberSortPreference(mode: MemberSortMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    // localStorage unavailable
  }
}
