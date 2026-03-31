// PRD-10 Enhancement: Hook for "Today Is..." fun holidays widget
// Queries daily_holidays table for today's date, applies floating date resolution,
// and returns filtered sub-arrays (kidFriendly, silliest, mostObscure, curated)

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { DailyHoliday } from '@/types/widgets'

// ── Floating date resolver ─────────────────────────────────

function getEasterDate(year: number): Date {
  // Anonymous Gregorian algorithm
  const a = year % 19
  const b = Math.floor(year / 100)
  const c = year % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1 // 0-indexed
  const day = ((h + l - 7 * m + 114) % 31) + 1
  return new Date(year, month, day)
}

function getThanksgivingDate(year: number): Date {
  // 4th Thursday of November
  const nov1 = new Date(year, 10, 1) // November is month 10 (0-indexed)
  const dow = nov1.getDay() // 0=Sun
  const firstThursday = dow <= 4 ? (4 - dow + 1) : (11 - dow + 1)
  return new Date(year, 10, firstThursday + 21) // 4th Thursday = first + 21
}

function resolveFloatingRule(rule: string, year: number): { month: number; day: number } | null {
  // easter+N or easter-N
  const easterMatch = rule.match(/^easter([+-]\d+)$/)
  if (easterMatch) {
    const offset = parseInt(easterMatch[1])
    const easter = getEasterDate(year)
    const resolved = new Date(easter)
    resolved.setDate(resolved.getDate() + offset)
    return { month: resolved.getMonth() + 1, day: resolved.getDate() }
  }

  // thanksgiving+N
  const tgMatch = rule.match(/^thanksgiving([+-]\d+)$/)
  if (tgMatch) {
    const offset = parseInt(tgMatch[1])
    const tg = getThanksgivingDate(year)
    const resolved = new Date(tg)
    resolved.setDate(resolved.getDate() + offset)
    return { month: resolved.getMonth() + 1, day: resolved.getDate() }
  }

  // weekday-N-M (Nth occurrence of weekday M in the month stored on the record)
  const wdMatch = rule.match(/^weekday-(\d+)-(\d+)$/)
  if (wdMatch) {
    const occurrence = parseInt(wdMatch[1])
    const targetWeekday = parseInt(wdMatch[2])
    // We need the month from the record itself — not available here
    // Caller must provide fallback month. Return null to use record's date_month.
    return null
  }

  return null
}

function resolveWeekdayRule(
  rule: string,
  recordMonth: number,
  year: number
): { month: number; day: number } | null {
  const wdMatch = rule.match(/^weekday-(\d+)-(\d+)$/)
  if (!wdMatch) return null

  const occurrence = parseInt(wdMatch[1])
  const targetWeekday = parseInt(wdMatch[2]) // 0=Sun, 1=Mon, ...
  const month = recordMonth - 1 // 0-indexed

  const firstDay = new Date(year, month, 1)
  const dow = firstDay.getDay()
  let firstOccurrence = targetWeekday - dow
  if (firstOccurrence < 0) firstOccurrence += 7
  firstOccurrence += 1 // 1-indexed day

  const day = firstOccurrence + (occurrence - 1) * 7
  // Validate day is still in the month
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  if (day > daysInMonth) return null

  return { month: recordMonth, day }
}

// ── Main hook ─────────────────────────────────────────────

export function useTodayHolidays() {
  const today = new Date()
  const currentMonth = today.getMonth() + 1
  const currentDay = today.getDate()
  const currentYear = today.getFullYear()

  return useQuery({
    queryKey: ['today-holidays', currentMonth, currentDay, currentYear],
    queryFn: async (): Promise<{
      holidays: DailyHoliday[]
      kidFriendly: DailyHoliday[]
      silliest: DailyHoliday[]
      mostObscure: DailyHoliday[]
      curated: DailyHoliday[]
    }> => {
      // 1. Get fixed holidays for today
      const { data: fixedHolidays, error: fixedError } = await supabase
        .from('daily_holidays')
        .select('*')
        .eq('date_month', currentMonth)
        .eq('date_day', currentDay)
        .eq('date_type', 'fixed')
        .eq('is_excluded', false)

      if (fixedError) throw fixedError

      // 2. Get ALL floating holidays and resolve which ones fall today
      const { data: floatingHolidays, error: floatingError } = await supabase
        .from('daily_holidays')
        .select('*')
        .eq('date_type', 'floating')
        .eq('is_excluded', false)

      if (floatingError) throw floatingError

      const resolvedFloating = (floatingHolidays ?? []).filter(h => {
        if (!h.floating_rule) return false

        // Try standard rules first
        let resolved = resolveFloatingRule(h.floating_rule, currentYear)

        // Try weekday rule with record's month
        if (!resolved) {
          resolved = resolveWeekdayRule(h.floating_rule, h.date_month, currentYear)
        }

        if (!resolved) return false
        return resolved.month === currentMonth && resolved.day === currentDay
      })

      // 3. Combine and sort
      const all: DailyHoliday[] = [...(fixedHolidays ?? []), ...resolvedFloating]
        .sort((a, b) => {
          // Kid-friendly first, then by silliness desc
          if (a.is_kid_friendly !== b.is_kid_friendly) return a.is_kid_friendly ? -1 : 1
          return b.silliness_score - a.silliness_score
        })

      // 4. Build filtered arrays
      const kidFriendly = all
        .filter(h => h.is_kid_friendly)
        .sort((a, b) => b.silliness_score - a.silliness_score)
        .slice(0, 3)

      const silliest = [...all]
        .sort((a, b) => b.silliness_score - a.silliness_score)
        .slice(0, 3)

      const mostObscure = [...all]
        .sort((a, b) => b.obscurity_score - a.obscurity_score)
        .slice(0, 3)

      // Curated: 1 kid-friendly + 1 silly + 1 obscure (deduplicated)
      const curated: DailyHoliday[] = []
      const usedIds = new Set<string>()

      const bestKid = all.find(h => h.is_kid_friendly && !usedIds.has(h.id))
      if (bestKid) { curated.push(bestKid); usedIds.add(bestKid.id) }

      const bestSilly = [...all]
        .sort((a, b) => b.silliness_score - a.silliness_score)
        .find(h => !usedIds.has(h.id))
      if (bestSilly) { curated.push(bestSilly); usedIds.add(bestSilly.id) }

      const bestObscure = [...all]
        .sort((a, b) => b.obscurity_score - a.obscurity_score)
        .find(h => !usedIds.has(h.id))
      if (bestObscure) { curated.push(bestObscure); usedIds.add(bestObscure.id) }

      return { holidays: all, kidFriendly, silliest, mostObscure, curated }
    },
    staleTime: 1000 * 60 * 60, // Cache for 1 hour (holidays don't change intraday)
    gcTime: 1000 * 60 * 60 * 24, // Keep in cache for 24 hours
  })
}
