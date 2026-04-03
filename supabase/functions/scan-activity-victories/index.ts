// PRD-11 Phase 12B: scan-activity-victories Edge Function
// Haiku-powered scan of activity_log_entries to surface potential victories.
// Returns JSON array of suggestions — user claims what matters.

import { z } from 'https://esm.sh/zod@3.23.8'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors, jsonHeaders } from '../_shared/cors.ts'
import { authenticateRequest } from '../_shared/auth.ts'
import { logAICost } from '../_shared/cost-logger.ts'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const MODEL = 'anthropic/claude-haiku-4.5'

const RequestSchema = z.object({
  family_member_id: z.string().uuid(),
  period: z.enum(['today', 'this_week', 'this_month', 'custom']),
  custom_start: z.string().optional(),
  custom_end: z.string().optional(),
})

// ─── Period Calculation ──────────────────────────────────────

function getPeriodRange(period: string, customStart?: string, customEnd?: string) {
  const now = new Date()
  const todayStr = now.toISOString().slice(0, 10)

  switch (period) {
    case 'today':
      return { start: `${todayStr}T00:00:00`, end: `${todayStr}T23:59:59.999` }
    case 'this_week': {
      const day = now.getDay()
      const weekStart = new Date(now)
      weekStart.setDate(now.getDate() - day)
      return { start: `${weekStart.toISOString().slice(0, 10)}T00:00:00`, end: `${todayStr}T23:59:59.999` }
    }
    case 'this_month': {
      const monthStart = `${todayStr.slice(0, 7)}-01`
      return { start: `${monthStart}T00:00:00`, end: `${todayStr}T23:59:59.999` }
    }
    case 'custom':
      if (customStart && customEnd) {
        return { start: `${customStart}T00:00:00`, end: `${customEnd}T23:59:59.999` }
      }
      return { start: `${todayStr}T00:00:00`, end: `${todayStr}T23:59:59.999` }
    default:
      return { start: `${todayStr}T00:00:00`, end: `${todayStr}T23:59:59.999` }
  }
}

// ─── Data Loaders ────────────────────────────────────────────

async function loadActivityLog(memberId: string, familyId: string, start: string, end: string) {
  const { data } = await supabase
    .from('activity_log_entries')
    .select('id, event_type, display_text, description, metadata, created_at')
    .eq('family_id', familyId)
    .eq('member_id', memberId)
    .gte('created_at', start)
    .lte('created_at', end)
    .order('created_at', { ascending: true })
    .limit(100)
  return data ?? []
}

async function loadExistingVictories(memberId: string, familyId: string, start: string, end: string) {
  const { data } = await supabase
    .from('victories')
    .select('description, source, source_reference_id')
    .eq('family_id', familyId)
    .eq('family_member_id', memberId)
    .gte('created_at', start)
    .lte('created_at', end)
    .is('archived_at', null)
  return data ?? []
}

async function loadGuidingStars(memberId: string, familyId: string) {
  const { data } = await supabase
    .from('guiding_stars')
    .select('id, content, category, title')
    .eq('family_id', familyId)
    .eq('member_id', memberId)
    .eq('is_included_in_ai', true)
    .is('archived_at', null)
    .limit(10)
  return data ?? []
}

async function loadBestIntentions(memberId: string, familyId: string) {
  const { data } = await supabase
    .from('best_intentions')
    .select('id, statement, description')
    .eq('family_id', familyId)
    .eq('member_id', memberId)
    .eq('is_active', true)
    .eq('is_included_in_ai', true)
    .is('archived_at', null)
    .limit(10)
  return data ?? []
}

async function getMemberInfo(memberId: string) {
  const { data } = await supabase
    .from('family_members')
    .select('id, family_id, display_name, role')
    .eq('id', memberId)
    .single()
  return data
}

// ─── System Prompt ───────────────────────────────────────────

function buildSystemPrompt(
  memberName: string,
  guidingStars: { id: string; content: string; title?: string }[],
  bestIntentions: { id: string; statement: string }[],
  existingVictories: { description: string }[],
) {
  const gsSection = guidingStars.length > 0
    ? `\n\n${memberName}'s Guiding Stars (values/declarations they live by):\n${guidingStars.map(gs => `- [${gs.id}] ${gs.title || gs.content}`).join('\n')}`
    : ''

  const biSection = bestIntentions.length > 0
    ? `\n\n${memberName}'s Best Intentions (what they're actively working on):\n${bestIntentions.map(bi => `- [${bi.id}] ${bi.statement}`).join('\n')}`
    : ''

  const existingSection = existingVictories.length > 0
    ? `\n\nVictories already recorded for this period (DO NOT suggest duplicates):\n${existingVictories.map(v => `- ${v.description}`).join('\n')}`
    : ''

  return `You analyze a person's activity log to surface accomplishments worth celebrating.

LOOK FOR:
- Consistency patterns ("logged water 5 days straight", "worked on project every morning")
- Effort on hard things (even partial — starting counts)
- Multiple small acts that add up to something meaningful
- Things that connect to their stated values and intentions
- Anything that shows growth, courage, patience, or persistence
- Invisible labor (managing appointments, coordinating schedules, handling crises)

DON'T SUGGEST:
- Things already in their victory list for this period
- Trivial automated events that don't reflect personal effort
- More than 8 suggestions (quality over quantity)
- Anything that sounds generic rather than specific to what happened

For each suggestion, provide:
- description: A warm, specific description of the accomplishment (1-2 sentences)
- pattern_note: What pattern this reveals, if genuine (optional — only when there IS a pattern)
- life_area_tag: Best matching area from: family, health, education, creativity, community, character, home, spirituality, personal_growth, career (or null)
- guiding_star_id: ID of a connected Guiding Star if the connection is natural (or null)
- best_intention_id: ID of a connected Best Intention if the connection is natural (or null)
- source_log_ids: Array of activity_log_entries IDs this draws from

Respond with ONLY a valid JSON object: {"suggestions": [...]}
${gsSection}${biSection}${existingSection}`
}

// ─── Main Handler ────────────────────────────────────────────

Deno.serve(async (req: Request) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const auth = await authenticateRequest(req)
    if (auth instanceof Response) return auth

    const body = await req.json()
    const parsed = RequestSchema.safeParse(body)
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid request', details: parsed.error.format() }), { status: 400, headers: jsonHeaders })
    }
    const input = parsed.data

    const member = await getMemberInfo(input.family_member_id)
    if (!member) {
      return new Response(JSON.stringify({ error: 'Member not found' }), { status: 404, headers: jsonHeaders })
    }

    const range = getPeriodRange(input.period, input.custom_start, input.custom_end)

    // Load all data in parallel
    const [activityLog, existingVictories, guidingStars, bestIntentions] = await Promise.all([
      loadActivityLog(member.id, member.family_id, range.start, range.end),
      loadExistingVictories(member.id, member.family_id, range.start, range.end),
      loadGuidingStars(member.id, member.family_id),
      loadBestIntentions(member.id, member.family_id),
    ])

    // If no activity log entries, return empty suggestions
    if (activityLog.length === 0) {
      return new Response(JSON.stringify({
        suggestions: [],
        model_used: MODEL,
        token_count: { input: 0, output: 0 },
      }), { headers: jsonHeaders })
    }

    // Build activity log text for the prompt
    const activityText = activityLog.map(entry => {
      const meta = entry.metadata as Record<string, unknown> | null
      const parts = [
        `[${entry.id}]`,
        entry.event_type,
        entry.display_text || entry.description || '',
        meta?.task_title ? `(${meta.task_title})` : '',
        meta?.has_note ? '[has note]' : '',
      ].filter(Boolean).join(' — ')
      return `- ${entry.created_at?.slice(0, 16)} ${parts}`
    }).join('\n')

    const systemPrompt = buildSystemPrompt(
      member.display_name,
      guidingStars as { id: string; content: string; title?: string }[],
      bestIntentions as { id: string; statement: string }[],
      existingVictories as { description: string }[],
    )

    // Call Haiku via OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://myaimcentral.com',
        'X-Title': 'MyAIM Central - Victory Scan',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Here is ${member.display_name}'s activity log for this period:\n\n${activityText}\n\nSurface the accomplishments worth celebrating.` },
        ],
        temperature: 0.3,
        max_tokens: 1500,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('OpenRouter error:', errText)
      return new Response(JSON.stringify({ error: 'AI service error' }), { status: 502, headers: jsonHeaders })
    }

    const result = await response.json()
    const content = result.choices?.[0]?.message?.content ?? '{}'
    const inputTokens = result.usage?.prompt_tokens ?? 0
    const outputTokens = result.usage?.completion_tokens ?? 0

    // Parse the JSON response
    let suggestions: unknown[] = []
    try {
      // Strip markdown code fences if present
      const cleaned = content.replace(/^```(?:json)?\s*/m, '').replace(/\s*```$/m, '').trim()
      const parsed = JSON.parse(cleaned)
      suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : []
    } catch {
      console.warn('Failed to parse scan response, returning empty:', content.slice(0, 200))
      suggestions = []
    }

    // Log cost (fire-and-forget)
    logAICost({
      familyId: member.family_id,
      memberId: member.id,
      featureKey: 'victory_recorder_scan',
      model: MODEL,
      inputTokens,
      outputTokens,
    })

    return new Response(JSON.stringify({
      suggestions,
      model_used: MODEL,
      token_count: { input: inputTokens, output: outputTokens },
    }), { headers: jsonHeaders })

  } catch (err) {
    if (err instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: err.errors }), {
        status: 400, headers: jsonHeaders,
      })
    }
    console.error('scan-activity-victories error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: jsonHeaders,
    })
  }
})
