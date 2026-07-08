// MyAIM Central — safety-classify Edge Function
// PRD-30 Safety Monitoring — SM-A detection foundation.
//
// Cron-invoked (Convention #246, util.invoke_edge_function every minute),
// deployed --no-verify-jwt with an in-code service-role bearer check — the
// exact pattern as `embed`, `validate-ai-output`, `fire-painted-schedules`.
//
// Architecture (founder-approved D1, feature decision file
// claude/feature-decisions/PRD-30-Safety-Monitoring.md): BOTH detection
// layers run via this polled sweep, not request-path hooks. Zero retrofit
// of the 14 lila_messages writer functions or bookshelf-discuss.
//
// Per invocation:
//   LAYER 1 (keyword/phrase matching, every unscanned user message from a
//   monitored member, across lila_messages AND bookshelf_discussion_messages):
//     1. Claim a batch of safety_scanned=false user-role rows whose author
//        is an actively-monitored member.
//     2. Run matchSafetyKeywords() against the active safety_keywords
//        library (word-boundary, case-insensitive, negation still triggers).
//     3. For each match, resolve effective sensitivity for that member+
//        category and check passesSensitivityThreshold.
//     4. Passing detections upsert a safety_flags row via the dedup/
//        consolidation decision in decideDedup().
//     5. Mark the message safety_scanned=true; if the parent conversation
//        was already classified (safety_scanned=true on lila_conversations/
//        bookshelf_discussions), clear it so Layer 2 re-evaluates.
//
//   LAYER 2 (Haiku conversation classification, conversations/discussions
//   quiet >= 30 minutes with >=1 user message from a monitored member):
//     1. Claim candidates where safety_scanned=false.
//     2. One Haiku call per conversation (PRD's classification prompt,
//        8 categories, JSON verdict).
//     3. Each concern passing the sensitivity gate upserts a flag
//        (detection_layer='classification').
//     4. Layer-disagreement rule (Key PRD Decision #4): existing
//        Layer-1-only 'new' flags in this conversation whose category
//        Layer 2 did NOT corroborate get downgraded to 'concern' with a
//        note, detection_layer='both'.
//     5. Mark the conversation/discussion safety_scanned=true.
//
//   Both layers: genuinely NEW flags get a content-free conversation-starter
//   Haiku call (category + severity + age ONLY — never conversation
//   content, feature decision file §J2/D2), and one CONSOLIDATED
//   notification per conversation is sent to every active recipient
//   (severity->priority per D3: critical/warning bypass DND, concern-only
//   does not).
//
// Failure handling: a Haiku call failure for Layer 2 leaves the
// conversation unscanned (safety_scanned stays false) so the next minute's
// sweep retries automatically — no explicit retry-count/park bookkeeping
// table this build (documented simplification; see the active build file's
// progress log). Structured per-invocation count logging (Silent Tooling
// Failure discipline) so this pipeline can never die silently.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://esm.sh/zod@3.23.8'
import { jsonHeaders } from '../_shared/cors.ts'
import { logAICost } from '../_shared/cost-logger.ts'
import { callOpenRouter } from '../_shared/openrouter-client.ts'
import {
  CATEGORY_LIST,
  CATEGORY_DESCRIPTION,
  effectiveSensitivity,
  passesSensitivityThreshold,
  matchSafetyKeywords,
  decideDedup,
  severityToPriority,
  buildConsolidatedNotificationBody,
  buildContextSnippetFromIndex,
  buildContextSnippetFromIndices,
  maxSeverity,
} from '../_shared/safety-classify-match.ts'
import type {
  SafetyCategory,
  SafetySeverity,
  SafetySensitivity,
  SafetyKeywordRow,
  ExistingFlagSummary,
  SnippetMessage,
} from '../_shared/safety-classify-match.ts'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// NOTE (found live via SM-C, 2026-07-08): 'anthropic/claude-haiku-4-5-20251001'
// is NOT a valid OpenRouter model ID (confirmed via a live 400: "...is not
// a valid model ID"). This means EVERY Haiku call in this file — Layer 2
// classification AND conversation-starter generation — has been silently
// failing since SM-A shipped (zero ai_usage_tracking rows for
// feature_key='safety_classification' ever existed, confirmed by direct
// query). Layer 2 failures are invisible by design (the sweep just leaves
// the conversation unscanned and retries next tick — Convention: silent
// tooling failure), and a failed starter is silently skipped
// (`if (starter) { UPDATE ... }`), so no flag has ever gotten a real
// "How to Bring This Up" starter, and no conversation has ever actually
// been Layer-2-classified in production. The correct, proven-working id —
// used successfully by mindsweep-sort/-scan, calendar-extract,
// bookshelf-extract/-process, wishlist-extract — is
// 'anthropic/claude-haiku-4.5'.
const HAIKU_MODEL = 'anthropic/claude-haiku-4.5'
const LAYER1_BATCH_SIZE = 150
const LAYER2_BATCH_SIZE = 15
const QUIET_MINUTES = 30
const DEDUP_WINDOW_HOURS = 24
// Layer 2 input bounding — a conversation with an unbounded message count
// would otherwise be fetched and sent to Haiku whole. Two independent
// bounds: (1) message-count cap at the fetch (most-recent-first, reversed
// back to chronological order — protects against a pathologically long-
// running never-closed conversation thread); (2) a character-count
// backstop inside classifyTranscript for pathologically verbose individual
// messages within that window. Without this, a conversation that ever
// exceeds Haiku's context would fail EVERY sweep and, combined with the
// "leave unscanned, retry next tick" simplification above, become an
// infinite once-a-minute retry loop that never resolves.
const MAX_LAYER2_MESSAGES = 150
const MAX_TRANSCRIPT_CHARS = 60000

// Convention #10 beta bypass — mirrors src/lib/permissions/useCanAccess.ts
// exactly. During beta ALL features are unlocked platform-wide; no Edge
// Function anywhere else implements server-side tier resolution either.
// Flip to true (and implement the feature_access_v2 lookup) when
// subscription billing goes live.
const TIER_GATE_ENABLED = false

// ============================================================
// Types
// ============================================================

interface MonitoredMember {
  id: string
  family_id: string
  display_name: string
  role: string
  dashboard_mode: string | null
  date_of_birth: string | null
  age: number | null
}

interface FlagBatchEntry {
  category: SafetyCategory
  severity: SafetySeverity
  isNew: boolean
}

// ============================================================
// Layer 2 classification schema
// ============================================================

const ConcernSchema = z.object({
  category: z.enum(CATEGORY_LIST as [SafetyCategory, ...SafetyCategory[]]),
  severity: z.enum(['concern', 'warning', 'critical']),
  key_message_indices: z.array(z.number().int().min(0)),
  reasoning: z.string(),
})
const ClassificationSchema = z.object({ concerns: z.array(ConcernSchema) })

const TIER2_SYSTEM_PROMPT = `You are a safety classification system for a family management platform. Analyze the following conversation between a family member and LiLa (an AI assistant) for concerning patterns.

Evaluate across these categories:
- self_harm: Self-harm, suicidal ideation, "unalive" references
- abuse: Physical, emotional, or sexual abuse indicators
- sexual_predatory: Sexual content, grooming patterns, age-inappropriate sexual content
- substance: Alcohol, drug use, peer pressure around substances
- eating_disorder: Restriction, purging, body dysmorphia
- bullying: Being bullied, cyberbullying, social exclusion
- profanity: Excessive profanity, violent/aggressive language
- other: Isolation, withdrawal, persistent hopelessness, running away

For each detected concern, provide:
- category (from above)
- severity: "concern" (mild indicators), "warning" (clear concerning patterns), "critical" (immediate safety risk)
- key_message_indices: which messages raised the concern (0-indexed)
- reasoning: brief explanation

Respond ONLY with valid JSON: {"concerns": [...]}. If no concerns detected, respond with {"concerns": []}.`

// ============================================================
// Shared lookups (loaded once per invocation)
// ============================================================

async function loadActiveKeywords(): Promise<SafetyKeywordRow[]> {
  const { data, error } = await supabase
    .from('safety_keywords')
    .select('keyword, category, base_severity, is_phrase')
    .eq('is_active', true)
  if (error) {
    console.error('safety-classify: loadActiveKeywords error:', error.message)
    return []
  }
  return (data ?? []) as SafetyKeywordRow[]
}

async function loadMonitoredMembers(): Promise<Map<string, MonitoredMember>> {
  // safety_monitoring_configs has TWO FKs to family_members (monitored_member_id
  // AND created_by) — the embed shorthand `family_members!inner(...)` is
  // ambiguous (PGRST201) and PostgREST rejects it. Disambiguate by FK
  // constraint name.
  const { data, error } = await supabase
    .from('safety_monitoring_configs')
    .select('monitored_member_id, family_members!safety_monitoring_configs_monitored_member_id_fkey(id, family_id, display_name, role, dashboard_mode, date_of_birth, age)')
    .eq('is_active', true)
  if (error) {
    console.error('safety-classify: loadMonitoredMembers error:', error.message)
    return new Map()
  }
  const map = new Map<string, MonitoredMember>()
  // deno-lint-ignore no-explicit-any
  for (const row of (data ?? []) as any[]) {
    const fm = row.family_members
    if (!fm) continue
    map.set(fm.id, {
      id: fm.id,
      family_id: fm.family_id,
      display_name: fm.display_name,
      role: fm.role,
      dashboard_mode: fm.dashboard_mode,
      date_of_birth: fm.date_of_birth,
      age: fm.age,
    })
  }
  return map
}

async function loadSensitivityOverrides(memberIds: string[]): Promise<Map<string, SafetySensitivity>> {
  const map = new Map<string, SafetySensitivity>()
  if (memberIds.length === 0) return map
  const { data, error } = await supabase
    .from('safety_sensitivity_configs')
    .select('monitored_member_id, category, sensitivity')
    .in('monitored_member_id', memberIds)
  if (error) {
    console.error('safety-classify: loadSensitivityOverrides error:', error.message)
    return map
  }
  for (const row of data ?? []) {
    map.set(`${row.monitored_member_id}:${row.category}`, row.sensitivity as SafetySensitivity)
  }
  return map
}

async function loadActiveRecipients(familyId: string): Promise<{ recipient_member_id: string }[]> {
  const { data, error } = await supabase
    .from('safety_notification_recipients')
    .select('recipient_member_id')
    .eq('family_id', familyId)
    .eq('is_active', true)
  if (error) {
    console.error('safety-classify: loadActiveRecipients error:', error.message)
    return []
  }
  return data ?? []
}

function computeAgeAndLabel(member: MonitoredMember): { age: number | null; label: string } {
  let age = member.age
  if (member.date_of_birth) {
    const dob = new Date(member.date_of_birth)
    if (!Number.isNaN(dob.getTime())) {
      const now = new Date()
      let years = now.getFullYear() - dob.getFullYear()
      const monthDiff = now.getMonth() - dob.getMonth()
      if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < dob.getDate())) years--
      age = years
    }
  }
  const label = member.dashboard_mode === 'independent' ? 'teen'
    : member.dashboard_mode === 'guided' || member.dashboard_mode === 'play' ? 'child'
    : 'family member'
  return { age: age ?? null, label }
}

// ============================================================
// Flag upsert (dedup + alert-fatigue consolidation)
// ============================================================

interface UpsertFlagParams {
  familyId: string
  memberId: string
  category: SafetyCategory
  severity: SafetySeverity
  detectionLayer: 'keyword' | 'classification'
  surface: string
  conversationTable: 'lila_conversations' | 'bookshelf_discussions'
  conversationId: string
  contextSnippet: SnippetMessage[]
  matchedKeywords: string[]
  classificationReasoning: string | null
  isSafeHarbor: boolean
}

interface UpsertFlagResult {
  flagId: string
  isNew: boolean
  severity: SafetySeverity
}

async function upsertSafetyFlag(params: UpsertFlagParams): Promise<UpsertFlagResult | null> {
  const since = new Date(Date.now() - DEDUP_WINDOW_HOURS * 60 * 60 * 1000).toISOString()
  const { data: existingRows, error: existingError } = await supabase
    .from('safety_flags')
    .select('id, severity, created_at')
    .eq('family_id', params.familyId)
    .eq('flagged_member_id', params.memberId)
    .eq('category', params.category)
    .gte('created_at', since)
    .order('created_at', { ascending: false })

  if (existingError) {
    console.error('safety-classify: upsertSafetyFlag lookup error:', existingError.message)
    return null
  }

  const existing = (existingRows ?? []) as ExistingFlagSummary[]
  const decision = decideDedup(params.severity, existing)

  if (decision.action === 'update_context') {
    const { error } = await supabase
      .from('safety_flags')
      .update({
        context_snippet: params.contextSnippet,
        matched_keywords: params.matchedKeywords,
        classification_reasoning: params.classificationReasoning,
        detection_layer: params.detectionLayer,
      })
      .eq('id', decision.targetId)
    if (error) {
      console.error('safety-classify: upsertSafetyFlag update_context error:', error.message)
      return null
    }
    return { flagId: decision.targetId, isNew: false, severity: existing[0].severity }
  }

  if (decision.action === 'consolidate') {
    const { error } = await supabase
      .from('safety_flags')
      .update({
        severity: maxSeverity(existing[0].severity, params.severity),
        classification_reasoning: `Multiple ${params.category} indicators detected today (consolidated).`,
      })
      .eq('id', decision.targetId)
    if (error) {
      console.error('safety-classify: upsertSafetyFlag consolidate error:', error.message)
      return null
    }
    // Consolidation does not spam a fresh notification — the family was
    // already notified for this category today (Key PRD Decision #7).
    return null
  }

  // 'insert' or 'insert_escalation' — genuinely new row.
  const { data: inserted, error: insertError } = await supabase
    .from('safety_flags')
    .insert({
      family_id: params.familyId,
      flagged_member_id: params.memberId,
      conversation_table: params.conversationTable,
      conversation_id: params.conversationId,
      surface: params.surface,
      category: params.category,
      severity: params.severity,
      detection_layer: params.detectionLayer,
      context_snippet: params.contextSnippet,
      matched_keywords: params.matchedKeywords,
      classification_reasoning: params.classificationReasoning,
      is_safe_harbor: params.isSafeHarbor,
    })
    .select('id')
    .single()

  if (insertError || !inserted) {
    console.error('safety-classify: upsertSafetyFlag insert error:', insertError?.message)
    return null
  }

  return { flagId: inserted.id, isNew: true, severity: params.severity }
}

// ============================================================
// Content-free conversation starter (J2/D2 — category + severity + age
// ONLY, never conversation content)
// ============================================================

async function generateConversationStarter(
  category: SafetyCategory,
  severity: SafetySeverity,
  ageLabel: string,
  age: number | null,
  familyId: string,
): Promise<string | null> {
  if (!TIER_GATE_ENABLED) {
    // beta bypass — proceed unconditionally
  }
  const ageText = age !== null ? `${age}-year-old ` : ''
  const prompt = `A parent has been notified that their ${ageText}${ageLabel} discussed ${CATEGORY_DESCRIPTION[category]} with an AI assistant. Generate a brief, warm, non-confrontational conversation starter the parent could use to bring this up.

Rules:
- Lead with curiosity and empathy, not rules or consequences
- Don't reference the AI conversation directly (the child should not feel surveilled)
- Keep it to 2-3 sentences
- Match the parent's likely emotional state (concerned but wanting to help)
- The severity of this concern is: ${severity}`

  try {
    const res = await callOpenRouter(
      OPENROUTER_API_KEY,
      {
        model: HAIKU_MODEL,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 150,
        temperature: 0.4,
      },
      { title: 'MyAIM Central - Safety Starter' },
    )
    if (!res.ok) {
      console.error('safety-classify: generateConversationStarter HTTP error:', res.status)
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
    return text || null
  } catch (err) {
    console.error('safety-classify: generateConversationStarter failed:', (err as Error).message)
    return null
  }
}

// ============================================================
// Notification consolidation
// ============================================================

async function sendConsolidatedNotification(
  familyId: string,
  member: MonitoredMember,
  flags: FlagBatchEntry[],
  topFlagId: string,
): Promise<void> {
  if (flags.length === 0) return
  const { title, body, highestSeverity } = buildConsolidatedNotificationBody(
    member.display_name,
    flags.map(f => ({ category: f.category, severity: f.severity })),
  )
  const priority = severityToPriority(highestSeverity)
  const recipients = await loadActiveRecipients(familyId)
  if (recipients.length === 0) return

  const rows = recipients.map(r => ({
    family_id: familyId,
    recipient_member_id: r.recipient_member_id,
    notification_type: 'safety_flag',
    category: 'safety',
    title,
    body,
    source_type: 'safety_flags',
    source_reference_id: topFlagId,
    action_url: `/safety-flags?flag=${topFlagId}`,
    priority,
  }))

  const { error } = await supabase.from('notifications').insert(rows)
  if (error) console.error('safety-classify: sendConsolidatedNotification insert error:', error.message)
}

// ============================================================
// LAYER 1 — lila_messages
// ============================================================

interface CandidateLilaMessage {
  id: string
  conversation_id: string
  content: string
  created_at: string
  lila_conversations: { id: string; member_id: string; is_safe_harbor: boolean; safety_scanned: boolean }
}

async function processLilaMessagesLayer1(
  keywords: SafetyKeywordRow[],
  monitored: Map<string, MonitoredMember>,
  sensitivityOverrides: Map<string, SafetySensitivity>,
): Promise<{ scanned: number; flagged: number }> {
  const memberIds = Array.from(monitored.keys())
  if (memberIds.length === 0) return { scanned: 0, flagged: 0 }

  const { data, error } = await supabase
    .from('lila_messages')
    .select('id, conversation_id, content, created_at, lila_conversations!inner(id, member_id, is_safe_harbor, safety_scanned)')
    .eq('role', 'user')
    .eq('safety_scanned', false)
    .in('lila_conversations.member_id', memberIds)
    .order('created_at', { ascending: true })
    .limit(LAYER1_BATCH_SIZE)

  if (error) {
    console.error('safety-classify: processLilaMessagesLayer1 query error:', error.message)
    return { scanned: 0, flagged: 0 }
  }

  const rows = (data ?? []) as unknown as CandidateLilaMessage[]
  if (rows.length === 0) return { scanned: 0, flagged: 0 }

  // Group by conversation so context snippets + notifications consolidate.
  const byConversation = new Map<string, CandidateLilaMessage[]>()
  for (const row of rows) {
    const list = byConversation.get(row.conversation_id) ?? []
    list.push(row)
    byConversation.set(row.conversation_id, list)
  }

  let flagged = 0

  for (const [conversationId, msgs] of byConversation) {
    const conv = msgs[0].lila_conversations
    const member = monitored.get(conv.member_id)
    if (!member) continue

    const conversationFlags: FlagBatchEntry[] = []
    let topFlagId: string | null = null

    // Fetch a small recent window for context-snippet building (up to 10
    // most-recent messages ending at the last candidate, ascending order).
    const { data: recentWindow } = await supabase
      .from('lila_messages')
      .select('id, role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(200)
    const windowMsgs: SnippetMessage[] = ((recentWindow ?? []) as { id: string; role: string; content: string }[]).map(m => ({
      role: m.role,
      content: m.content,
      message_id: m.id,
    }))

    for (const msg of msgs) {
      const matches = matchSafetyKeywords(msg.content, keywords)

      // Group matches by category (a single message can match multiple
      // distinct categories — each gets its own flag).
      const byCategory = new Map<SafetyCategory, SafetySeverity>()
      for (const m of matches) {
        const sensKey = `${member.id}:${m.category}`
        const explicit = sensitivityOverrides.get(sensKey) ?? null
        const sensitivity = effectiveSensitivity(m.category, member.dashboard_mode, explicit)
        if (!passesSensitivityThreshold(m.base_severity, sensitivity)) continue
        const prior = byCategory.get(m.category)
        byCategory.set(m.category, prior ? maxSeverity(prior, m.base_severity) : m.base_severity)
      }

      const msgIndex = windowMsgs.findIndex(w => w.message_id === msg.id)
      const snippet = msgIndex >= 0 ? buildContextSnippetFromIndex(windowMsgs, msgIndex) : []

      for (const [category, severity] of byCategory) {
        const catMatchedKeywords = matches.filter(m => m.category === category).map(m => m.keyword)
        const result = await upsertSafetyFlag({
          familyId: member.family_id,
          memberId: member.id,
          category,
          severity,
          detectionLayer: 'keyword',
          surface: 'lila-chat',
          conversationTable: 'lila_conversations',
          conversationId,
          contextSnippet: snippet,
          matchedKeywords: catMatchedKeywords,
          classificationReasoning: null,
          isSafeHarbor: conv.is_safe_harbor,
        })
        if (result) {
          flagged++
          conversationFlags.push({ category, severity: result.severity, isNew: result.isNew })
          if (result.isNew) topFlagId = result.flagId
          if (result.isNew) {
            const { age, label } = computeAgeAndLabel(member)
            const starter = await generateConversationStarter(category, severity, label, age, member.family_id)
            if (starter) {
              await supabase.from('safety_flags').update({ conversation_starter: starter }).eq('id', result.flagId)
            }
          }
        }
      }
    }

    // Mark every processed message scanned=true in this conversation batch.
    const messageIds = msgs.map(m => m.id)
    const { error: markError } = await supabase
      .from('lila_messages')
      .update({ safety_scanned: true })
      .in('id', messageIds)
    if (markError) console.error('safety-classify: mark lila_messages scanned error:', markError.message)

    // Re-open Layer 2 classification if this conversation was already
    // classified and a new message just arrived.
    if (conv.safety_scanned) {
      await supabase.from('lila_conversations').update({ safety_scanned: false }).eq('id', conversationId).eq('safety_scanned', true)
    }

    const newFlags = conversationFlags.filter(f => f.isNew)
    if (newFlags.length > 0 && topFlagId) {
      await sendConsolidatedNotification(member.family_id, member, newFlags, topFlagId)
    }
  }

  return { scanned: rows.length, flagged }
}

// ============================================================
// LAYER 1 — bookshelf_discussion_messages
// ============================================================

interface CandidateBookshelfMessage {
  id: string
  discussion_id: string
  content: string
  created_at: string
  bookshelf_discussions: { id: string; family_member_id: string; safety_scanned: boolean }
}

async function processBookshelfMessagesLayer1(
  keywords: SafetyKeywordRow[],
  monitored: Map<string, MonitoredMember>,
  sensitivityOverrides: Map<string, SafetySensitivity>,
): Promise<{ scanned: number; flagged: number }> {
  const memberIds = Array.from(monitored.keys())
  if (memberIds.length === 0) return { scanned: 0, flagged: 0 }

  const { data, error } = await supabase
    .from('bookshelf_discussion_messages')
    .select('id, discussion_id, content, created_at, bookshelf_discussions!inner(id, family_member_id, safety_scanned)')
    .eq('role', 'user')
    .eq('safety_scanned', false)
    .in('bookshelf_discussions.family_member_id', memberIds)
    .order('created_at', { ascending: true })
    .limit(LAYER1_BATCH_SIZE)

  if (error) {
    console.error('safety-classify: processBookshelfMessagesLayer1 query error:', error.message)
    return { scanned: 0, flagged: 0 }
  }

  const rows = (data ?? []) as unknown as CandidateBookshelfMessage[]
  if (rows.length === 0) return { scanned: 0, flagged: 0 }

  const byDiscussion = new Map<string, CandidateBookshelfMessage[]>()
  for (const row of rows) {
    const list = byDiscussion.get(row.discussion_id) ?? []
    list.push(row)
    byDiscussion.set(row.discussion_id, list)
  }

  let flagged = 0

  for (const [discussionId, msgs] of byDiscussion) {
    const disc = msgs[0].bookshelf_discussions
    const member = monitored.get(disc.family_member_id)
    if (!member) continue

    const conversationFlags: FlagBatchEntry[] = []
    let topFlagId: string | null = null

    const { data: recentWindow } = await supabase
      .from('bookshelf_discussion_messages')
      .select('id, role, content, created_at')
      .eq('discussion_id', discussionId)
      .order('created_at', { ascending: true })
      .limit(200)
    const windowMsgs: SnippetMessage[] = ((recentWindow ?? []) as { id: string; role: string; content: string }[]).map(m => ({
      role: m.role,
      content: m.content,
      message_id: m.id,
    }))

    for (const msg of msgs) {
      const matches = matchSafetyKeywords(msg.content, keywords)
      const byCategory = new Map<SafetyCategory, SafetySeverity>()
      for (const m of matches) {
        const sensKey = `${member.id}:${m.category}`
        const explicit = sensitivityOverrides.get(sensKey) ?? null
        const sensitivity = effectiveSensitivity(m.category, member.dashboard_mode, explicit)
        if (!passesSensitivityThreshold(m.base_severity, sensitivity)) continue
        const prior = byCategory.get(m.category)
        byCategory.set(m.category, prior ? maxSeverity(prior, m.base_severity) : m.base_severity)
      }

      const msgIndex = windowMsgs.findIndex(w => w.message_id === msg.id)
      const snippet = msgIndex >= 0 ? buildContextSnippetFromIndex(windowMsgs, msgIndex) : []

      for (const [category, severity] of byCategory) {
        const catMatchedKeywords = matches.filter(m => m.category === category).map(m => m.keyword)
        const result = await upsertSafetyFlag({
          familyId: member.family_id,
          memberId: member.id,
          category,
          severity,
          detectionLayer: 'keyword',
          surface: 'bookshelf-discuss',
          conversationTable: 'bookshelf_discussions',
          conversationId: discussionId,
          contextSnippet: snippet,
          matchedKeywords: catMatchedKeywords,
          classificationReasoning: null,
          isSafeHarbor: false,
        })
        if (result) {
          flagged++
          conversationFlags.push({ category, severity: result.severity, isNew: result.isNew })
          if (result.isNew) topFlagId = result.flagId
          if (result.isNew) {
            const { age, label } = computeAgeAndLabel(member)
            const starter = await generateConversationStarter(category, severity, label, age, member.family_id)
            if (starter) {
              await supabase.from('safety_flags').update({ conversation_starter: starter }).eq('id', result.flagId)
            }
          }
        }
      }
    }

    const messageIds = msgs.map(m => m.id)
    const { error: markError } = await supabase
      .from('bookshelf_discussion_messages')
      .update({ safety_scanned: true })
      .in('id', messageIds)
    if (markError) console.error('safety-classify: mark bookshelf_discussion_messages scanned error:', markError.message)

    if (disc.safety_scanned) {
      await supabase.from('bookshelf_discussions').update({ safety_scanned: false }).eq('id', discussionId).eq('safety_scanned', true)
    }

    const newFlags = conversationFlags.filter(f => f.isNew)
    if (newFlags.length > 0 && topFlagId) {
      await sendConsolidatedNotification(member.family_id, member, newFlags, topFlagId)
    }
  }

  return { scanned: rows.length, flagged }
}

// ============================================================
// LAYER 2 — Haiku conversation classification
// ============================================================

interface FetchedMessage {
  id: string
  role: string
  content: string
  created_at: string
}

/**
 * Bounded transcript fetch for Layer 2 classification. Fetches the MOST
 * RECENT MAX_LAYER2_MESSAGES rows (descending), then reverses back to
 * chronological order — so a conversation with an unbounded message
 * history never grows the Haiku input unbounded. This is bound #1 of 2
 * (see MAX_TRANSCRIPT_CHARS in classifyTranscript for bound #2, a
 * character-count backstop against pathologically verbose individual
 * messages within the window).
 */
async function fetchBoundedConversationMessages(
  table: 'lila_messages' | 'bookshelf_discussion_messages',
  fkColumn: 'conversation_id' | 'discussion_id',
  fkValue: string,
): Promise<FetchedMessage[]> {
  const { data, error } = await supabase
    .from(table)
    .select('id, role, content, created_at')
    .eq(fkColumn, fkValue)
    .order('created_at', { ascending: false })
    .limit(MAX_LAYER2_MESSAGES)
  if (error || !data) return []
  return (data as FetchedMessage[]).reverse()
}

async function classifyTranscript(
  transcript: { role: string; content: string }[],
  familyId: string,
): Promise<z.infer<typeof ClassificationSchema> | null> {
  let userParts = transcript.map((m, i) => `[${i}] ${m.role}: ${m.content}`).join('\n')
  if (userParts.length > MAX_TRANSCRIPT_CHARS) {
    // Bound #2: keep the TAIL (most recent content) — the classification
    // prompt's own index labels ([0], [1], ...) stay valid for whatever
    // range survives the truncation; Haiku simply won't see indices below
    // whatever cut point remains, which is the same trade-off as bound #1.
    userParts = `[transcript truncated to the most recent ~${MAX_TRANSCRIPT_CHARS} characters]\n` + userParts.slice(-MAX_TRANSCRIPT_CHARS)
  }
  try {
    const res = await callOpenRouter(
      OPENROUTER_API_KEY,
      {
        model: HAIKU_MODEL,
        messages: [
          { role: 'system', content: TIER2_SYSTEM_PROMPT },
          { role: 'user', content: userParts },
        ],
        max_tokens: 800,
        temperature: 0,
      },
      { title: 'MyAIM Central - Safety Classification' },
    )
    if (!res.ok) {
      console.error('safety-classify: classifyTranscript HTTP error:', res.status)
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

    let parsed: unknown
    try {
      const cleaned = text.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
      parsed = JSON.parse(cleaned)
    } catch {
      console.error('safety-classify: classifyTranscript JSON parse failed:', text.slice(0, 200))
      return null
    }
    const validated = ClassificationSchema.safeParse(parsed)
    if (!validated.success) {
      console.error('safety-classify: classifyTranscript schema validation failed:', validated.error.issues)
      return null
    }
    return validated.data
  } catch (err) {
    console.error('safety-classify: classifyTranscript failed:', (err as Error).message)
    return null
  }
}

async function applyLayerDisagreement(
  familyId: string,
  memberId: string,
  conversationId: string,
  corroboratedCategories: Set<SafetyCategory>,
): Promise<void> {
  const since = new Date(Date.now() - DEDUP_WINDOW_HOURS * 60 * 60 * 1000).toISOString()
  const { data, error } = await supabase
    .from('safety_flags')
    .select('id, category, severity')
    .eq('family_id', familyId)
    .eq('flagged_member_id', memberId)
    .eq('conversation_id', conversationId)
    .eq('detection_layer', 'keyword')
    .eq('status', 'new')
    .gte('created_at', since)

  if (error || !data) return

  for (const flag of data) {
    if (corroboratedCategories.has(flag.category as SafetyCategory)) continue
    if (flag.severity === 'concern') continue // already at the floor
    await supabase
      .from('safety_flags')
      .update({
        severity: 'concern',
        detection_layer: 'both',
        classification_reasoning: 'Pattern-level review found no broader concern for this category.',
      })
      .eq('id', flag.id)
  }
}

async function processLilaConversationsLayer2(
  monitored: Map<string, MonitoredMember>,
  sensitivityOverrides: Map<string, SafetySensitivity>,
): Promise<{ scanned: number; flagged: number }> {
  const memberIds = Array.from(monitored.keys())
  if (memberIds.length === 0) return { scanned: 0, flagged: 0 }
  if (TIER_GATE_ENABLED) return { scanned: 0, flagged: 0 } // Layer 2 gated behind safety_monitoring_ai when tier gating is live

  const quietBefore = new Date(Date.now() - QUIET_MINUTES * 60 * 1000).toISOString()

  const { data, error } = await supabase
    .from('lila_conversations')
    .select('id, member_id, family_id, is_safe_harbor, updated_at')
    .eq('safety_scanned', false)
    .in('status', ['active', 'archived'])
    .in('member_id', memberIds)
    .lt('updated_at', quietBefore)
    .limit(LAYER2_BATCH_SIZE)

  if (error) {
    console.error('safety-classify: processLilaConversationsLayer2 query error:', error.message)
    return { scanned: 0, flagged: 0 }
  }

  const conversations = data ?? []
  let scanned = 0
  let flagged = 0

  for (const conv of conversations) {
    const member = monitored.get(conv.member_id)
    if (!member) continue

    const messages = await fetchBoundedConversationMessages('lila_messages', 'conversation_id', conv.id)

    if (messages.length === 0) continue
    const hasUserMessage = messages.some(m => m.role === 'user')
    if (!hasUserMessage) {
      // Nothing to classify — mark scanned so it doesn't loop forever.
      await supabase.from('lila_conversations').update({ safety_scanned: true }).eq('id', conv.id)
      continue
    }

    const classification = await classifyTranscript(
      messages.map(m => ({ role: m.role, content: m.content })),
      member.family_id,
    )
    if (!classification) {
      // Leave unscanned — retries on the next tick (documented simplification).
      continue
    }

    const windowMsgs: SnippetMessage[] = (messages as { id: string; role: string; content: string }[]).map(m => ({
      role: m.role,
      content: m.content,
      message_id: m.id,
    }))

    const conversationFlags: FlagBatchEntry[] = []
    let topFlagId: string | null = null
    const corroborated = new Set<SafetyCategory>()

    for (const concern of classification.concerns) {
      corroborated.add(concern.category)
      const sensKey = `${member.id}:${concern.category}`
      const explicit = sensitivityOverrides.get(sensKey) ?? null
      const sensitivity = effectiveSensitivity(concern.category, member.dashboard_mode, explicit)
      if (!passesSensitivityThreshold(concern.severity, sensitivity)) continue

      const snippet = buildContextSnippetFromIndices(windowMsgs, concern.key_message_indices)
      const result = await upsertSafetyFlag({
        familyId: member.family_id,
        memberId: member.id,
        category: concern.category,
        severity: concern.severity,
        detectionLayer: 'classification',
        surface: 'lila-chat',
        conversationTable: 'lila_conversations',
        conversationId: conv.id,
        contextSnippet: snippet,
        matchedKeywords: [],
        classificationReasoning: concern.reasoning,
        isSafeHarbor: conv.is_safe_harbor,
      })
      if (result) {
        flagged++
        conversationFlags.push({ category: concern.category, severity: result.severity, isNew: result.isNew })
        if (result.isNew) topFlagId = result.flagId
        if (result.isNew) {
          const { age, label } = computeAgeAndLabel(member)
          const starter = await generateConversationStarter(concern.category, concern.severity, label, age, member.family_id)
          if (starter) {
            await supabase.from('safety_flags').update({ conversation_starter: starter }).eq('id', result.flagId)
          }
        }
      }
    }

    // Key PRD Decision #4 — layer disagreement: downgrade uncorroborated
    // Layer-1-only flags in this conversation.
    await applyLayerDisagreement(member.family_id, member.id, conv.id, corroborated)

    await supabase.from('lila_conversations').update({ safety_scanned: true }).eq('id', conv.id)
    scanned++

    const newFlags = conversationFlags.filter(f => f.isNew)
    if (newFlags.length > 0 && topFlagId) {
      await sendConsolidatedNotification(member.family_id, member, newFlags, topFlagId)
    }
  }

  return { scanned, flagged }
}

async function processBookshelfDiscussionsLayer2(
  monitored: Map<string, MonitoredMember>,
  sensitivityOverrides: Map<string, SafetySensitivity>,
): Promise<{ scanned: number; flagged: number }> {
  const memberIds = Array.from(monitored.keys())
  if (memberIds.length === 0) return { scanned: 0, flagged: 0 }
  if (TIER_GATE_ENABLED) return { scanned: 0, flagged: 0 }

  const quietBefore = new Date(Date.now() - QUIET_MINUTES * 60 * 1000)

  const { data, error } = await supabase
    .from('bookshelf_discussions')
    .select('id, family_member_id, family_id')
    .eq('safety_scanned', false)
    .in('family_member_id', memberIds)
    .limit(LAYER2_BATCH_SIZE)

  if (error) {
    console.error('safety-classify: processBookshelfDiscussionsLayer2 query error:', error.message)
    return { scanned: 0, flagged: 0 }
  }

  let scanned = 0
  let flagged = 0

  for (const disc of data ?? []) {
    const member = monitored.get(disc.family_member_id)
    if (!member) continue

    const messages = await fetchBoundedConversationMessages('bookshelf_discussion_messages', 'discussion_id', disc.id)

    if (messages.length === 0) continue

    const lastMessageAt = new Date(messages[messages.length - 1].created_at)
    if (lastMessageAt > quietBefore) continue // still active, not quiet yet

    const hasUserMessage = messages.some(m => m.role === 'user')
    if (!hasUserMessage) {
      await supabase.from('bookshelf_discussions').update({ safety_scanned: true }).eq('id', disc.id)
      continue
    }

    const classification = await classifyTranscript(
      messages.map(m => ({ role: m.role, content: m.content })),
      member.family_id,
    )
    if (!classification) continue // retries next tick

    const windowMsgs: SnippetMessage[] = (messages as { id: string; role: string; content: string }[]).map(m => ({
      role: m.role,
      content: m.content,
      message_id: m.id,
    }))

    const conversationFlags: FlagBatchEntry[] = []
    let topFlagId: string | null = null
    const corroborated = new Set<SafetyCategory>()

    for (const concern of classification.concerns) {
      corroborated.add(concern.category)
      const sensKey = `${member.id}:${concern.category}`
      const explicit = sensitivityOverrides.get(sensKey) ?? null
      const sensitivity = effectiveSensitivity(concern.category, member.dashboard_mode, explicit)
      if (!passesSensitivityThreshold(concern.severity, sensitivity)) continue

      const snippet = buildContextSnippetFromIndices(windowMsgs, concern.key_message_indices)
      const result = await upsertSafetyFlag({
        familyId: member.family_id,
        memberId: member.id,
        category: concern.category,
        severity: concern.severity,
        detectionLayer: 'classification',
        surface: 'bookshelf-discuss',
        conversationTable: 'bookshelf_discussions',
        conversationId: disc.id,
        contextSnippet: snippet,
        matchedKeywords: [],
        classificationReasoning: concern.reasoning,
        isSafeHarbor: false,
      })
      if (result) {
        flagged++
        conversationFlags.push({ category: concern.category, severity: result.severity, isNew: result.isNew })
        if (result.isNew) topFlagId = result.flagId
        if (result.isNew) {
          const { age, label } = computeAgeAndLabel(member)
          const starter = await generateConversationStarter(concern.category, concern.severity, label, age, member.family_id)
          if (starter) {
            await supabase.from('safety_flags').update({ conversation_starter: starter }).eq('id', result.flagId)
          }
        }
      }
    }

    await applyLayerDisagreement(member.family_id, member.id, disc.id, corroborated)
    await supabase.from('bookshelf_discussions').update({ safety_scanned: true }).eq('id', disc.id)
    scanned++

    const newFlags = conversationFlags.filter(f => f.isNew)
    if (newFlags.length > 0 && topFlagId) {
      await sendConsolidatedNotification(member.family_id, member, newFlags, topFlagId)
    }
  }

  return { scanned, flagged }
}

// ============================================================
// Entry point
// ============================================================

Deno.serve(async req => {
  // Cron-invoked function (Convention #246): deployed with --no-verify-jwt
  // because the sb_secret_... service key is not a JWT. The function code
  // validates the service-role bearer itself.
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.includes(SUPABASE_SERVICE_ROLE_KEY)) {
    return new Response('Unauthorized', { status: 401 })
  }

  try {
    const [keywords, monitored] = await Promise.all([loadActiveKeywords(), loadMonitoredMembers()])
    const memberIds = Array.from(monitored.keys())
    const sensitivityOverrides = await loadSensitivityOverrides(memberIds)

    const [lilaLayer1, bookshelfLayer1] = await Promise.all([
      processLilaMessagesLayer1(keywords, monitored, sensitivityOverrides),
      processBookshelfMessagesLayer1(keywords, monitored, sensitivityOverrides),
    ])

    const [lilaLayer2, bookshelfLayer2] = await Promise.all([
      processLilaConversationsLayer2(monitored, sensitivityOverrides),
      processBookshelfDiscussionsLayer2(monitored, sensitivityOverrides),
    ])

    const summary = {
      monitored_members: monitored.size,
      layer1_messages_scanned: lilaLayer1.scanned + bookshelfLayer1.scanned,
      layer1_flags: lilaLayer1.flagged + bookshelfLayer1.flagged,
      layer2_conversations_scanned: lilaLayer2.scanned + bookshelfLayer2.scanned,
      layer2_flags: lilaLayer2.flagged + bookshelfLayer2.flagged,
    }

    console.log(`safety-classify: ${JSON.stringify(summary)}`)

    return new Response(JSON.stringify(summary), { headers: jsonHeaders })
  } catch (err) {
    console.error('safety-classify fatal error:', err)
    return new Response(JSON.stringify({ error: (err as Error).message }), { status: 500, headers: jsonHeaders })
  }
})
