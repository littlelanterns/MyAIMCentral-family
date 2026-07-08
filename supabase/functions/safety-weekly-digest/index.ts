// MyAIM Central — safety-weekly-digest Edge Function
// PRD-30 Safety Monitoring — SM-C, Build Item 13 (weekly pattern summaries).
//
// Cron-invoked (Convention #246, util.invoke_edge_function, weekly Sunday
// night), deployed --no-verify-jwt with an in-code service-role bearer
// check — the exact pattern as safety-classify, embed, validate-ai-output.
//
// For every actively-monitored member (safety_monitoring_configs.is_active
// = true), once per family-local week (idempotent via the UNIQUE
// (monitored_member_id, period_end) constraint, migration 00000000100303):
//   1. Compute period_end = yesterday in the family's local timezone,
//      period_start = period_end - 6 days (a rolling 7-day window ending
//      the day before this run).
//   2. Count safety_flags in that window (is_safe_harbor=false excluded
//      per J5 — "excluded from pattern summaries and any future
//      aggregation") — category_counts, severity_breakdown, total_flags.
//   3. Compute trend against the prior 7-day window's total.
//   4. Zero flags -> narrative is the PRD's literal edge-case string, no
//      Haiku call (cost + PRD §Edge Cases "No Flags Generated"). Non-zero
//      -> one Haiku call, COUNTS ONLY, never conversation content (J2/D2).
//   5. Insert the safety_pattern_summaries row.
//   6. If the family has >=1 active safety_notification_recipients, send
//      one quiet (priority='normal' per J3/D3 — trend review, not an
//      alert) notification per recipient linking to /safety-flags (the
//      digest renders inline there — SafetyFlagsPage "Weekly Pattern
//      Summary" section).

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { jsonHeaders } from '../_shared/cors.ts'
import { logAICost } from '../_shared/cost-logger.ts'
import { callOpenRouter } from '../_shared/openrouter-client.ts'
import { scanUtilityOutput, enqueueOutputScan } from '../_shared/ethics-guard.ts'
import {
  CATEGORY_LIST,
  CATEGORY_DISPLAY_LABEL,
  buildWeeklySummaryData,
  timezoneOffsetMinutesAt,
  familyLocalDayBoundsUtc,
  shiftLocalDate,
  ZERO_FLAG_NARRATIVE,
} from '../_shared/safety-classify-match.ts'

// PRD-41 output-scan fallback — the narrative is content-free by
// construction (J2/D2: the Haiku prompt receives only counts, never
// conversation content), so a real facilitation-pattern hit here is a
// theoretical edge, not an expected one. Still wired for consistency with
// every other member-facing generative surface on the platform (the
// redteam FULL MATRIX pin does not carve out an exception for "unlikely").
const NARRATIVE_SAFE_FALLBACK = "This week's summary couldn't be generated automatically this time — see the flag history below for details."
import type { SafetyCategory, SafetySeverity } from '../_shared/safety-classify-match.ts'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// NOTE (found live, 2026-07-08): 'anthropic/claude-haiku-4-5-20251001' is
// NOT a valid OpenRouter model ID (confirmed via a live 400: "...is not a
// valid model ID"). The correct, proven-working id — used successfully by
// mindsweep-sort/-scan, calendar-extract, bookshelf-extract/-process,
// wishlist-extract — is 'anthropic/claude-haiku-4.5'. This same wrong
// string is also in safety-classify/index.ts (fixed alongside this file,
// same PRD-30 feature) and validate-ai-output/index.ts (PRD-41, a
// different in-flight build — flagged, not touched, in the SM-C progress
// log).
const HAIKU_MODEL = 'anthropic/claude-haiku-4.5'

interface MonitoredConfigRow {
  monitored_member_id: string
  family_id: string
  family_members: { id: string; display_name: string } | null
  families: { id: string; timezone: string | null } | null
}

interface FlagCountRow {
  category: SafetyCategory
  severity: SafetySeverity
}

async function countFlagsInWindow(
  familyId: string,
  memberId: string,
  startUtc: string,
  endUtc: string,
): Promise<FlagCountRow[]> {
  const { data, error } = await supabase
    .from('safety_flags')
    .select('category, severity')
    .eq('family_id', familyId)
    .eq('flagged_member_id', memberId)
    .eq('is_safe_harbor', false)
    .gte('created_at', startUtc)
    .lte('created_at', endUtc)
  if (error) {
    console.error('safety-weekly-digest: countFlagsInWindow error:', error.message)
    return []
  }
  return (data ?? []) as FlagCountRow[]
}

async function generateNarrative(
  summaryData: ReturnType<typeof buildWeeklySummaryData>,
  familyId: string,
  monitoredMemberId: string,
): Promise<string | null> {
  const nonZero = CATEGORY_LIST.filter(c => summaryData.category_counts[c] > 0)
  const countsText = nonZero.length > 0
    ? nonZero.map(c => `${CATEGORY_DISPLAY_LABEL[c]}: ${summaryData.category_counts[c]}`).join(', ')
    : 'none'

  const prompt = `Summarize this week's family-safety-monitoring flag counts into a brief, warm, human-readable narrative for a parent, with a trend comparison to the prior week.

This week's flag counts by category: ${countsText}
Total flags this week: ${summaryData.total_flags}
Severity breakdown: concern=${summaryData.severity_breakdown.concern}, warning=${summaryData.severity_breakdown.warning}, critical=${summaryData.severity_breakdown.critical}
Trend vs. prior week: ${summaryData.trend}

Rules:
- 1-2 sentences, plain language, no clinical jargon
- Mention the trend naturally (e.g. "down from two last week")
- If there are no critical flags, you may reassure the parent of that
- Do not invent details you were not given — you were given counts only, never any conversation content`

  try {
    const res = await callOpenRouter(
      OPENROUTER_API_KEY,
      {
        model: HAIKU_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.3,
      },
      { title: 'MyAIM Central - Safety Weekly Digest' },
    )
    if (!res.ok) {
      console.error('safety-weekly-digest: generateNarrative HTTP error:', res.status)
      return null
    }
    const json = await res.json()
    const text = (json.choices?.[0]?.message?.content || '').trim()
    logAICost({
      familyId,
      memberId: '00000000-0000-0000-0000-000000000000',
      featureKey: 'safety_classification',
      model: HAIKU_MODEL,
      inputTokens: json.usage?.prompt_tokens || 0,
      outputTokens: json.usage?.completion_tokens || 0,
    })
    if (!text) return null

    // PRD-41 Tier-0 output scan (member-facing generative prose, not a
    // structured verdict — the FULL MATRIX drift pin does not exempt this
    // surface). Enqueue always; a hit in enforcing mode replaces the
    // narrative with a safe, non-alarming fallback rather than persisting
    // it (shadow mode never replaces — logged_only).
    const ctx = { familyId, memberId: monitoredMemberId, surface: 'safety-weekly-digest' }
    const outScan = await scanUtilityOutput(supabase, text, ctx)
    await enqueueOutputScan(supabase, { ...ctx, content: text })
    if (outScan.replaced) return NARRATIVE_SAFE_FALLBACK

    return text
  } catch (err) {
    console.error('safety-weekly-digest: generateNarrative failed:', (err as Error).message)
    return null
  }
}

async function sendDigestNotifications(familyId: string, memberName: string, summaryId: string, totalFlags: number): Promise<void> {
  const { data: recipients, error } = await supabase
    .from('safety_notification_recipients')
    .select('recipient_member_id')
    .eq('family_id', familyId)
    .eq('is_active', true)
  if (error) {
    console.error('safety-weekly-digest: loadActiveRecipients error:', error.message)
    return
  }
  if (!recipients || recipients.length === 0) return

  const title = `Weekly safety summary for ${memberName}`
  const body = totalFlags === 0
    ? `No concerns detected for ${memberName} this week.`
    : `${totalFlags} safety flag${totalFlags === 1 ? '' : 's'} this week for ${memberName}. Tap to see the trend.`

  const rows = (recipients as { recipient_member_id: string }[]).map(r => ({
    family_id: familyId,
    recipient_member_id: r.recipient_member_id,
    notification_type: 'safety_digest',
    category: 'safety',
    title,
    body,
    source_type: 'safety_pattern_summaries',
    source_reference_id: summaryId,
    action_url: '/safety-flags',
    priority: 'normal',
  }))
  const { error: insertError } = await supabase.from('notifications').insert(rows)
  if (insertError) console.error('safety-weekly-digest: notification insert error:', insertError.message)
}

async function processMonitoredMember(row: MonitoredConfigRow, now: Date): Promise<{ generated: boolean }> {
  const member = row.family_members
  if (!member) return { generated: false }
  const timezone = row.families?.timezone || 'America/Chicago'

  const offsetMinutes = timezoneOffsetMinutesAt(now, timezone)
  const familyTodayStr = new Intl.DateTimeFormat('en-CA', { timeZone: timezone }).format(now)
  const periodEnd = shiftLocalDate(familyTodayStr, -1) // yesterday, family-local
  const periodStart = shiftLocalDate(periodEnd, -6) // 7-day window ending yesterday
  const priorPeriodEnd = shiftLocalDate(periodStart, -1)
  const priorPeriodStart = shiftLocalDate(priorPeriodEnd, -6)

  // Idempotent: one summary per member per family-local week-end.
  const { data: existing } = await supabase
    .from('safety_pattern_summaries')
    .select('id')
    .eq('monitored_member_id', row.monitored_member_id)
    .eq('period_end', periodEnd)
    .maybeSingle()
  if (existing) return { generated: false }

  const { startUtc, endUtc } = familyLocalDayBoundsUtc(periodStart, offsetMinutes)
  const { endUtc: currentEndUtc } = familyLocalDayBoundsUtc(periodEnd, offsetMinutes)
  const currentFlags = await countFlagsInWindow(row.family_id, row.monitored_member_id, startUtc, currentEndUtc)

  const { startUtc: priorStartUtc } = familyLocalDayBoundsUtc(priorPeriodStart, offsetMinutes)
  const { endUtc: priorEndUtc } = familyLocalDayBoundsUtc(priorPeriodEnd, offsetMinutes)
  const priorFlags = await countFlagsInWindow(row.family_id, row.monitored_member_id, priorStartUtc, priorEndUtc)

  const summaryData = buildWeeklySummaryData(currentFlags, priorFlags.length)

  const narrative = summaryData.total_flags === 0
    ? ZERO_FLAG_NARRATIVE
    : await generateNarrative(summaryData, row.family_id, row.monitored_member_id)

  const { data: inserted, error: insertError } = await supabase
    .from('safety_pattern_summaries')
    .insert({
      family_id: row.family_id,
      monitored_member_id: row.monitored_member_id,
      period_start: periodStart,
      period_end: periodEnd,
      summary_data: summaryData,
      narrative,
    })
    .select('id')
    .single()

  if (insertError || !inserted) {
    console.error('safety-weekly-digest: summary insert error:', insertError?.message)
    return { generated: false }
  }

  await sendDigestNotifications(row.family_id, member.display_name, inserted.id, summaryData.total_flags)
  return { generated: true }
}

Deno.serve(async req => {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.includes(SUPABASE_SERVICE_ROLE_KEY)) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const now = new Date()
    const { data, error } = await supabase
      .from('safety_monitoring_configs')
      .select('monitored_member_id, family_id, family_members!safety_monitoring_configs_monitored_member_id_fkey(id, display_name), families(id, timezone)')
      .eq('is_active', true)

    if (error) {
      console.error('safety-weekly-digest: loadMonitoredConfigs error:', error.message)
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: jsonHeaders })
    }

    const rows = (data ?? []) as unknown as MonitoredConfigRow[]
    let generated = 0
    let skipped = 0

    for (const row of rows) {
      const result = await processMonitoredMember(row, now)
      if (result.generated) generated++
      else skipped++
    }

    const summary = { monitored_members: rows.length, summaries_generated: generated, summaries_skipped_existing: skipped }
    console.log(`safety-weekly-digest: ${JSON.stringify(summary)}`)
    return new Response(JSON.stringify(summary), { headers: jsonHeaders })
  } catch (err) {
    console.error('safety-weekly-digest fatal error:', err)
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: jsonHeaders })
  }
})
