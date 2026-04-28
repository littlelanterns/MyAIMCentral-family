/**
 * PRD-09A Addendum §3.4 — Aggregation display formatting.
 *
 * Formats session count + total duration into a single subtitle string.
 * Handles all scales: "1 session · 15 min" to "1,247 sessions · 2,667 hours".
 */

function formatCount(n: number): string {
  return n.toLocaleString('en-US')
}

export function formatDurationMinutes(totalMinutes: number): string {
  if (totalMinutes < 60) {
    return `${totalMinutes} min`
  }
  if (totalMinutes < 120) {
    const remainingMin = totalMinutes - 60
    return remainingMin === 0 ? '1 hour' : `1 hr ${remainingMin} min`
  }
  const hours = Math.round(totalMinutes / 60)
  return `${formatCount(hours)} hours`
}

export function formatPracticeAggregation(
  totalSessions: number,
  totalDurationMinutes: number | null,
): string {
  if (totalSessions === 0) return ''

  const sessionText = `${formatCount(totalSessions)} ${totalSessions === 1 ? 'session' : 'sessions'}`

  if (totalDurationMinutes == null || totalDurationMinutes === 0) {
    return sessionText
  }

  return `${sessionText} · ${formatDurationMinutes(totalDurationMinutes)}`
}
