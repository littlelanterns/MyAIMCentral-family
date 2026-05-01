/**
 * Computes the next period start for a routine section's frequency.
 * Used at staging time so the cron job just checks trigger_at <= now().
 *
 * Returns null if the frequency can't be resolved (caller falls back
 * to manual_apply).
 */
export function computeNextTriggerAt(
  frequencyRule: string,
  frequencyDays?: number[],
  timezone?: string,
): Date | null {
  const tz = timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone
  const now = new Date()

  const localParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
  const [year, month, day] = localParts.split('-').map(Number)

  const localDow = localDayOfWeek(now, tz)

  switch (frequencyRule) {
    case 'daily': {
      return midnightInTz(year, month, day + 1, tz)
    }

    case 'mwf': {
      return nextMatchingDay(year, month, day, localDow, [1, 3, 5], tz)
    }

    case 't_th': {
      return nextMatchingDay(year, month, day, localDow, [2, 4], tz)
    }

    case 'weekdays': {
      return nextMatchingDay(year, month, day, localDow, [1, 2, 3, 4, 5], tz)
    }

    case 'weekends': {
      return nextMatchingDay(year, month, day, localDow, [0, 6], tz)
    }

    case 'weekly': {
      return midnightInTz(year, month, day + (7 - localDow), tz)
    }

    case 'monthly': {
      if (month === 12) {
        return midnightInTz(year + 1, 1, 1, tz)
      }
      return midnightInTz(year, month + 1, 1, tz)
    }

    case 'custom': {
      if (!frequencyDays || frequencyDays.length === 0) return null
      return nextMatchingDay(year, month, day, localDow, frequencyDays, tz)
    }

    default:
      return null
  }
}

function nextMatchingDay(
  year: number,
  month: number,
  day: number,
  currentDow: number,
  targetDays: number[],
  tz: string,
): Date {
  const sorted = [...targetDays].sort((a, b) => a - b)
  for (const d of sorted) {
    if (d > currentDow) {
      return midnightInTz(year, month, day + (d - currentDow), tz)
    }
  }
  const daysUntil = 7 - currentDow + sorted[0]
  return midnightInTz(year, month, day + daysUntil, tz)
}

function midnightInTz(year: number, month: number, day: number, tz: string): Date {
  const probe = new Date(Date.UTC(year, month - 1, day, 12, 0, 0))

  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
  const parts = formatter.formatToParts(probe)
  const get = (t: string) => Number(parts.find(p => p.type === t)?.value ?? '0')

  const resolvedYear = get('year')
  const resolvedMonth = get('month')
  const resolvedDay = get('day')

  const utcNoon = new Date(Date.UTC(resolvedYear, resolvedMonth - 1, resolvedDay, 12, 0, 0))
  const offsetMs = utcNoon.getTime() - new Date(
    resolvedYear, resolvedMonth - 1, resolvedDay, 12, 0, 0,
  ).getTime()
  return new Date(Date.UTC(resolvedYear, resolvedMonth - 1, resolvedDay, 0, 0, 0) + offsetMs)
}

function localDayOfWeek(date: Date, tz: string): number {
  const formatted = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    weekday: 'short',
  }).format(date)
  const map: Record<string, number> = {
    Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6,
  }
  return map[formatted] ?? 0
}
