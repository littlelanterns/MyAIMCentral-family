/**
 * .ics (iCalendar) file parser for MyAIM MindSweep calendar import.
 *
 * Parses VEVENT blocks from standard .ics files exported by
 * Google Calendar, Apple Calendar, Outlook, school portals, etc.
 *
 * Only extracts fields that map to MyAIM calendar_events columns.
 * Does NOT attempt full RFC 5545 compliance — handles the common
 * patterns that real-world calendar exports actually produce.
 */

export interface ParsedCalendarEvent {
  title: string
  event_date: string          // YYYY-MM-DD
  start_time: string | null   // HH:MM (null = all-day)
  end_time: string | null     // HH:MM (null = all-day)
  end_date: string | null     // YYYY-MM-DD (null = same day)
  is_all_day: boolean
  location: string | null
  description: string | null
  recurrence_rule: string | null   // raw RRULE string
  reminder_minutes: number | null  // from VALARM
  ics_uid: string | null           // original UID for dedup
}

export interface ICSParseResult {
  events: ParsedCalendarEvent[]
  errors: string[]
  skipped: number
}

/**
 * Parse an .ics file's text content into structured calendar events.
 */
export function parseICS(content: string): ICSParseResult {
  const events: ParsedCalendarEvent[] = []
  const errors: string[] = []
  let skipped = 0

  // Unfold lines per RFC 5545 (continuation lines start with space/tab)
  const unfolded = content.replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '')
  const lines = unfolded.split(/\r?\n/)

  let inEvent = false
  let inAlarm = false
  let eventLines: string[] = []

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed === 'BEGIN:VEVENT') {
      inEvent = true
      inAlarm = false
      eventLines = []
      continue
    }

    if (trimmed === 'END:VEVENT') {
      inEvent = false
      inAlarm = false
      try {
        const parsed = parseVEvent(eventLines)
        if (parsed) {
          events.push(parsed)
        } else {
          skipped++
        }
      } catch (e) {
        errors.push(`Failed to parse event: ${e instanceof Error ? e.message : String(e)}`)
        skipped++
      }
      continue
    }

    if (inEvent) {
      if (trimmed === 'BEGIN:VALARM') {
        inAlarm = true
      } else if (trimmed === 'END:VALARM') {
        inAlarm = false
      }

      // Collect alarm lines with a prefix so we can distinguish them
      if (inAlarm) {
        eventLines.push('ALARM:' + trimmed)
      } else {
        eventLines.push(trimmed)
      }
    }
  }

  return { events, errors, skipped }
}

/**
 * Parse a single VEVENT block's lines into a structured event.
 * Returns null if the event has no title or date (skip it).
 */
function parseVEvent(lines: string[]): ParsedCalendarEvent | null {
  const props = new Map<string, string>()
  const alarmProps: string[] = []

  for (const line of lines) {
    if (line.startsWith('ALARM:')) {
      alarmProps.push(line.slice(6))
      continue
    }

    // Split on first colon, but handle properties with params (DTSTART;TZID=...:value)
    const colonIdx = line.indexOf(':')
    if (colonIdx === -1) continue

    const fullKey = line.slice(0, colonIdx)
    const value = line.slice(colonIdx + 1)

    // Extract the base property name (before any ;PARAM=value)
    const baseName = fullKey.split(';')[0]

    // Store both the full key (for param extraction) and the value
    // Use the base name as key, but keep the full key for param parsing
    if (!props.has(baseName)) {
      props.set(baseName, value)
      props.set('_full_' + baseName, fullKey)
    }
  }

  const title = unescapeICS(props.get('SUMMARY') || '')
  if (!title) return null

  // Parse start date/time
  const dtStart = parseDTValue(props.get('DTSTART'), props.get('_full_DTSTART'))
  if (!dtStart) return null

  // Parse end date/time
  const dtEnd = parseDTValue(props.get('DTEND'), props.get('_full_DTEND'))

  // Duration-based events (some .ics use DURATION instead of DTEND)
  // We skip duration calculation for simplicity — end time will be null

  const isAllDay = dtStart.isDate
  const location = unescapeICS(props.get('LOCATION') || '') || null
  const description = unescapeICS(props.get('DESCRIPTION') || '') || null
  const rrule = props.get('RRULE') || null
  const uid = props.get('UID') || null

  // Parse reminder from VALARM
  let reminderMinutes: number | null = null
  for (const alarmLine of alarmProps) {
    if (alarmLine.startsWith('TRIGGER')) {
      reminderMinutes = parseTriggerDuration(alarmLine)
      break
    }
  }

  // Determine end date
  let endDate: string | null = null
  if (dtEnd) {
    if (dtEnd.date !== dtStart.date) {
      endDate = dtEnd.date
      // All-day events in .ics: DTEND is exclusive (the day AFTER the last day)
      // e.g., 2-day event Apr 15-16 is DTSTART=20260415 DTEND=20260417
      if (isAllDay && endDate) {
        endDate = subtractOneDay(endDate)
        // If it collapses to same day, it's a single-day all-day event
        if (endDate === dtStart.date) endDate = null
      }
    }
  }

  return {
    title,
    event_date: dtStart.date,
    start_time: isAllDay ? null : dtStart.time,
    end_time: isAllDay ? null : (dtEnd?.time || null),
    end_date: endDate,
    is_all_day: isAllDay,
    location,
    description,
    recurrence_rule: rrule,
    reminder_minutes: reminderMinutes,
    ics_uid: uid,
  }
}

interface DTResult {
  date: string    // YYYY-MM-DD
  time: string | null  // HH:MM
  isDate: boolean // true if DATE-only (all-day)
}

/**
 * Parse a DTSTART/DTEND value, handling:
 * - DATE only: 20260415 (all-day)
 * - DATETIME local: 20260415T160000
 * - DATETIME UTC: 20260415T160000Z
 * - With TZID param: DTSTART;TZID=America/Chicago:20260415T160000
 */
function parseDTValue(value: string | undefined, fullKey: string | undefined): DTResult | null {
  if (!value) return null

  // Check if this is a DATE-only value
  const isDateOnly = fullKey?.includes('VALUE=DATE') || value.length === 8

  if (isDateOnly) {
    const d = value.replace(/[^0-9]/g, '')
    if (d.length < 8) return null
    return {
      date: `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`,
      time: null,
      isDate: true,
    }
  }

  // DATETIME value: 20260415T160000 or 20260415T160000Z
  const cleaned = value.replace('Z', '').replace(/[^0-9T]/g, '')
  const tIdx = cleaned.indexOf('T')
  if (tIdx === -1 || tIdx < 8) return null

  const datePart = cleaned.slice(0, tIdx)
  const timePart = cleaned.slice(tIdx + 1)

  return {
    date: `${datePart.slice(0, 4)}-${datePart.slice(4, 6)}-${datePart.slice(6, 8)}`,
    time: timePart.length >= 4 ? `${timePart.slice(0, 2)}:${timePart.slice(2, 4)}` : null,
    isDate: false,
  }
}

/**
 * Parse a VALARM TRIGGER duration like -PT15M, -PT1H, -P1D
 * Returns minutes (positive number).
 */
function parseTriggerDuration(line: string): number | null {
  const match = line.match(/TRIGGER[^:]*:(-?)P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?/)
  if (!match) return null

  const days = parseInt(match[2] || '0', 10)
  const hours = parseInt(match[3] || '0', 10)
  const minutes = parseInt(match[4] || '0', 10)

  const total = days * 1440 + hours * 60 + minutes
  return total > 0 ? total : null
}

/**
 * Unescape .ics text values (reverse of RFC 5545 escaping).
 */
function unescapeICS(value: string): string {
  return value
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\')
    .trim()
}

/**
 * Subtract one day from a YYYY-MM-DD date string.
 * Used for all-day event end date correction (.ics uses exclusive end dates).
 */
function subtractOneDay(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  d.setDate(d.getDate() - 1)
  return d.toISOString().slice(0, 10)
}

/**
 * Detect if a text string is likely .ics content.
 */
export function isICSContent(text: string): boolean {
  return text.includes('BEGIN:VCALENDAR') || text.includes('BEGIN:VEVENT')
}

/**
 * User-friendly summary of parsed results for toast/status display.
 */
export function formatParseResultMessage(result: ICSParseResult): string {
  const { events, skipped } = result
  if (events.length === 0) {
    return 'No calendar events found in this file.'
  }
  if (events.length === 1) {
    return `Found 1 event: "${events[0].title}"`
  }
  const msg = `Found ${events.length} events`
  return skipped > 0 ? `${msg} (${skipped} skipped)` : msg
}
