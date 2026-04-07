// Local date helpers for e2e tests.
//
// Mirrors the relevant subset of src/utils/dates.ts so tests don't need
// the `@/` path alias (the tests/ directory is not in tsconfig.app.json).
// Keep these in sync with src/utils/dates.ts if the algorithms change.
//
// Why this exists: `new Date().toISOString().split('T')[0]` returns the UTC
// date, which mismatches what the app writes (local date). Tests must use
// local time so they compare against the same date strings the app emits.

export function todayLocalIso(): string {
  return localIso(new Date())
}

export function localIso(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function localIsoDaysFromToday(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return localIso(d)
}
