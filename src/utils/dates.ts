// ─── Local date/time utilities ──────────────────────────────────────────────
//
// This module exists because `new Date().toISOString().split('T')[0]` returns
// the UTC date, NOT the user's local date. For users in negative-offset
// timezones (US Central, Pacific, etc.), that pattern caused off-by-one bugs
// in the late evening: at 9 PM Central, UTC has already ticked over to the
// next day, so any date string computed from the UTC rollover was tomorrow.
//
// First surfaced by beta_glitch_reports row 8dc4b2bd-13ef-4c0d-8d3f-46c3f9cbad50
// ("reflections dated April 7th when it's still April 6 in my timezone") and
// then found in 30+ files across the codebase — trackers, tasks, victories,
// scheduling, exports. This module is the single source of truth.
//
// NEVER write `new Date().toISOString().split('T')[0]` anywhere. Always import
// from here. If you need "today's local date as YYYY-MM-DD", use `todayLocalIso()`.
// If you need "local date N days from today", use `localIsoDaysFromToday(n)`.
// If you need a DB query range of "today in local time" against a TIMESTAMPTZ
// column, use `startOfLocalDayUtc()` + `endOfLocalDayUtc()`.
//
// The DB DATE type has no timezone, so writing a local-date string to a DATE
// column is unambiguous — the user sees the date they expect on their wall
// clock. For TIMESTAMPTZ columns, local-midnight-to-local-midnight queries
// require proper UTC timestamps that represent the local wall-clock boundary.

// ─── YYYY-MM-DD helpers (for DATE columns and date-keyed query keys) ────────

/**
 * Today's date as YYYY-MM-DD in the user's local timezone.
 *
 * Drop-in replacement for `new Date().toISOString().split('T')[0]` — but
 * returns LOCAL date instead of UTC date. This is what you want 99% of the
 * time when writing to a `DATE` column or keying a React Query cache by day.
 */
export function todayLocalIso(): string {
  return localIso(new Date())
}

/**
 * Convert any Date to YYYY-MM-DD in local time (not UTC).
 *
 * Use this when you have a Date object that's not "now" — e.g. a calendar
 * event date, a rhythm period boundary, a week-ago filter cutoff.
 */
export function localIso(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * Today's date offset by N days, in local time. Negative N for past dates.
 *
 * Examples:
 *   localIsoDaysFromToday(-1)  // yesterday (local)
 *   localIsoDaysFromToday(7)   // one week from today (local)
 */
export function localIsoDaysFromToday(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return localIso(d)
}

// ─── Period helpers (week / month / quarter) ────────────────────────────────
//
// These mirror the algorithms used in `periodForRhythm()` in src/types/rhythms.ts
// so rhythms and other features stay consistent. Week uses ISO 8601 (Mon-Sun,
// week 1 contains the first Thursday of the year).

/**
 * ISO week identifier in local time, e.g. "2026-W14".
 *
 * Uses ISO 8601 definition: weeks start Monday, week 1 is the week containing
 * the first Thursday of the year. Week calculation uses local time — a user
 * in Central sees the same week number on their wall clock as this returns.
 */
export function localWeekIso(date: Date = new Date()): string {
  // Normalize to local midnight, then shift to the Thursday of this ISO week.
  // Algorithm: dayNum 1=Mon..7=Sun; add (4 - dayNum) days to land on Thursday.
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const dayNum = d.getDay() || 7 // Sun=0 → 7
  d.setDate(d.getDate() + 4 - dayNum)
  const yearStart = new Date(d.getFullYear(), 0, 1)
  const diffMs = d.getTime() - yearStart.getTime()
  const weekNum = Math.ceil((diffMs / 86400000 + 1) / 7)
  return `${d.getFullYear()}-W${String(weekNum).padStart(2, '0')}`
}

/** Local month identifier, e.g. "2026-04". */
export function localMonthIso(date: Date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

/** Local quarter identifier, e.g. "2026-Q2". */
export function localQuarterIso(date: Date = new Date()): string {
  const year = date.getFullYear()
  const quarter = Math.floor(date.getMonth() / 3) + 1
  return `${year}-Q${quarter}`
}

// ─── TIMESTAMPTZ range helpers (for created_at / updated_at queries) ────────
//
// Use these when querying a TIMESTAMPTZ column and you want "items created
// today in the user's local time". The returned strings are proper UTC ISO
// timestamps representing the local wall-clock boundary — they work correctly
// with Supabase `.gte()` / `.lte()` filters against TIMESTAMPTZ columns.

/**
 * Start-of-day UTC ISO timestamp for the given YYYY-MM-DD in local time.
 * Defaults to today. Use with `.gte('created_at', ...)` on TIMESTAMPTZ columns.
 *
 * Example (Central time, April 6):
 *   startOfLocalDayUtc()  // "2026-04-06T05:00:00.000Z" (local midnight in UTC)
 */
export function startOfLocalDayUtc(localDateStr?: string): string {
  const [y, m, d] = (localDateStr ?? todayLocalIso()).split('-').map(Number)
  return new Date(y, m - 1, d, 0, 0, 0, 0).toISOString()
}

/**
 * End-of-day UTC ISO timestamp for the given YYYY-MM-DD in local time.
 * Defaults to today. Use with `.lte('created_at', ...)` on TIMESTAMPTZ columns.
 */
export function endOfLocalDayUtc(localDateStr?: string): string {
  const [y, m, d] = (localDateStr ?? todayLocalIso()).split('-').map(Number)
  return new Date(y, m - 1, d, 23, 59, 59, 999).toISOString()
}

// ─── datetime-local HTML input helper ───────────────────────────────────────
//
// `<input type="datetime-local">` expects `YYYY-MM-DDTHH:mm` in LOCAL time and
// interprets whatever value it receives as local. Converting a stored UTC
// timestamp (from a TIMESTAMPTZ column) via `.toISOString().slice(0, 16)`
// shows the user the UTC wall clock, which is wrong by their offset. Use
// this helper on the read side. The save side is already correct because
// `new Date("2026-04-10T14:30")` with no timezone suffix is parsed as local
// and `.toISOString()` converts it to a proper UTC timestamp for the DB.

/**
 * Format a Date or ISO timestamp string for an `<input type="datetime-local">`.
 * Returns `YYYY-MM-DDTHH:mm` in the user's LOCAL timezone.
 *
 * Example (Central time):
 *   toDatetimeLocalInput("2026-04-10T05:00:00.000Z")  // "2026-04-10T00:00"
 */
export function toDatetimeLocalInput(input: Date | string): string {
  const d = typeof input === 'string' ? new Date(input) : input
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hh = String(d.getHours()).padStart(2, '0')
  const mm = String(d.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hh}:${mm}`
}
