// PRD-30 Safety Monitoring — SM-C, D5 crisis-hit flag wiring.
// (feature decision file §J4/D5 — Convention #7's crisis override already
// shows resources to the MEMBER on every AI-calling surface; three
// surfaces — mindsweep-sort, mindsweep-scan, message-coach — process a
// monitored member's free text but never persist it anywhere the
// safety-classify sweep can see. A crisis hit there never reached mom.
// This is a thin fire-and-forget flag write at the same detectCrisis()
// hit sites those three files already have — it must NEVER block or
// throw in a way that could keep the crisis response from reaching the
// member (that response is Convention #7's job and always wins).
//
// Scope discipline: this helper must be imported by EXACTLY three Edge
// Function files. tests/safety-crisis-flag.test.ts pins the exact set —
// closing this gap must never silently spread to other surfaces.

import { CRISIS_KEYWORDS } from './crisis-detection.ts'
import { buildConsolidatedNotificationBody, severityToPriority } from './safety-classify-match.ts'
import type { SafetyCategory } from './safety-classify-match.ts'

// Mirrors the exact category assignment the safety-classify keyword seed
// (migration 00000000100289) gave these same CRISIS_KEYWORDS strings when
// building the persisted-pipeline safety_keywords library. Kept in sync
// deliberately (not derived from a DB read) — crisis-detection.ts is used
// by many non-safety-monitoring surfaces and intentionally carries no
// PRD-30 category dependency of its own.
const HARM_TO_OTHERS = new Set<string>([
  'kill him', 'kill her', 'kill them', 'going to kill', 'want to hurt', 'going to hurt',
])
const ABUSE_EXPERIENCED = new Set<string>([
  'being abused', 'abusing me', 'hits me', 'hitting me', 'molest', 'molested', 'molesting',
])

/** Pure — which CRISIS_KEYWORDS entry (if any) matched, word-boundary/case-insensitive. */
export function findMatchedCrisisKeyword(content: string): string | null {
  if (!content) return null
  const lower = content.toLowerCase()
  for (const k of CRISIS_KEYWORDS) {
    const escaped = k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    if (new RegExp(`\\b${escaped}\\b`).test(lower)) return k
  }
  return null
}

/** Pure — maps a matched crisis keyword to its safety_flags category. */
export function categorizeCrisisMatch(matchedKeyword: string | null): SafetyCategory {
  if (matchedKeyword && HARM_TO_OTHERS.has(matchedKeyword)) return 'other'
  if (matchedKeyword && ABUSE_EXPERIENCED.has(matchedKeyword)) return 'abuse'
  return 'self_harm'
}

// deno-lint-ignore no-explicit-any
type AnySupabaseClient = any

/**
 * Fire-and-forget: writes a Critical safety_flags row (conversation_table
 * NULL — no conversation store exists for these surfaces, per the
 * polymorphic-ref schema built for exactly this) + a consolidated
 * notification to every active recipient, IF the member is actively
 * monitored. Mom herself has no safety_monitoring_configs row at all (Key
 * PRD Decision #2), so this naturally never fires for her own typed
 * content. Never throws — every failure is swallowed after logging so a
 * DB hiccup can never keep the crisis response from reaching the member.
 */
export async function flagCrisisEvent(
  supabase: AnySupabaseClient,
  params: { familyId?: string | null; memberId?: string | null; surface: string; content: string },
): Promise<void> {
  try {
    const { familyId, memberId, surface, content } = params
    if (!familyId || !memberId) return

    const { data: config } = await supabase
      .from('safety_monitoring_configs')
      .select('is_active')
      .eq('family_id', familyId)
      .eq('monitored_member_id', memberId)
      .maybeSingle()
    if (!config?.is_active) return

    const matched = findMatchedCrisisKeyword(content)
    const category = categorizeCrisisMatch(matched)

    // Dedup (Key PRD Decision #6): same member+category within 24h ->
    // no new row, no new notification. A Critical flag already exists;
    // there is nothing higher to escalate to.
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { data: existing } = await supabase
      .from('safety_flags')
      .select('id')
      .eq('family_id', familyId)
      .eq('flagged_member_id', memberId)
      .eq('category', category)
      .gte('created_at', since)
      .limit(1)
    if (existing && existing.length > 0) return

    const { data: flag, error: insertError } = await supabase
      .from('safety_flags')
      .insert({
        family_id: familyId,
        flagged_member_id: memberId,
        conversation_table: null,
        conversation_id: null,
        surface,
        category,
        severity: 'critical',
        detection_layer: 'keyword',
        matched_keywords: matched ? [matched] : [],
        status: 'new',
        is_safe_harbor: false,
      })
      .select('id')
      .single()
    if (insertError || !flag) {
      console.error('flagCrisisEvent: insert failed:', insertError?.message)
      return
    }

    const { data: recipients } = await supabase
      .from('safety_notification_recipients')
      .select('recipient_member_id')
      .eq('family_id', familyId)
      .eq('is_active', true)
    if (!recipients || recipients.length === 0) return

    const { data: member } = await supabase
      .from('family_members')
      .select('display_name')
      .eq('id', memberId)
      .single()

    const { title, body } = buildConsolidatedNotificationBody(member?.display_name ?? 'your family member', [
      { category, severity: 'critical' },
    ])
    const priority = severityToPriority('critical')

    const rows = (recipients as { recipient_member_id: string }[]).map(r => ({
      family_id: familyId,
      recipient_member_id: r.recipient_member_id,
      notification_type: 'safety_flag',
      category: 'safety',
      title,
      body,
      source_type: 'safety_flags',
      source_reference_id: flag.id,
      action_url: `/safety-flags?flag=${flag.id}`,
      priority,
    }))
    const { error: notifyError } = await supabase.from('notifications').insert(rows)
    if (notifyError) console.error('flagCrisisEvent: notification insert failed:', notifyError.message)
  } catch (err) {
    console.error('flagCrisisEvent failed:', (err as Error).message)
  }
}
