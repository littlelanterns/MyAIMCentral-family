// PRD-34: Board of Directors — Multi-persona advisory panel
// Model: Sonnet (one call per advisor per user turn)
// Streams each advisor response individually as it completes.
// Each advisor call receives full history INCLUDING prior advisor responses from current turn.
//
// Three-tier persona architecture (Convention #258, addendum §1):
//   Tier 1: public.board_personas (personal_custom, family-scoped)
//   Tier 2: platform_intelligence.persona_promotion_queue (admin review)
//   Tier 3: platform_intelligence.board_personas (approved shared cache)
//
// Persona creation flow:
//   1. Crisis gate on ALL free-form fields (name + description) — Convention #7
//   2. Exact-name Tier-3 lookup (cache hit = silent seat)
//   3. Embedding pre-screen against Tier-3 (≥0.92 silent, 0.88–0.92 suggest) — addendum §4
//   4. Content policy harm screen (Haiku, fail-closed) — SCOPE-8a.F8a
//   5. Multi-family-relevance classifier (Haiku, fail-closed) — addendum §5
//   6. Sonnet persona generation
//   7. Write Tier-1 row; if classifier yes, also write queue row — addendum §§2, 6

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://esm.sh/zod@3.23.8'
import { handleCors, jsonHeaders, sseHeaders } from '../_shared/cors.ts'
import { authenticateRequest } from '../_shared/auth.ts'
import { detectCrisis, CRISIS_RESPONSE } from '../_shared/crisis-detection.ts'
import { logAICost } from '../_shared/cost-logger.ts'
import { embedText } from '../_shared/embedding.ts'
import { assembleContext } from '../_shared/context-assembler.ts'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const MODEL_SONNET = 'anthropic/claude-sonnet-4'
const MODEL_HAIKU = 'anthropic/claude-haiku-4-5-20251001'

const PRESCREEN_SILENT_THRESHOLD = 0.92
const PRESCREEN_SUGGEST_THRESHOLD = 0.88

// ── Zod input schema ────────────────────────────────────────

const InputSchema = z.object({
  conversation_id: z.string().uuid(),
  content: z.string().optional(),
  action: z.enum([
    'chat',
    'create_persona',
    'generate_prayer_seat',
    'content_policy_check',
    'prescreen_persona',
    'approve_queued_persona',
    'reject_queued_persona',
    'defer_queued_persona',
    'list_persona_promotion_queue',
  ]).optional(),
  // Additional fields used by specific actions — validated inline
}).passthrough()

// ── Crisis gate (Convention #7 — global, runs before any routing) ──

function crisisCheckFields(...fields: (string | undefined | null)[]): string | null {
  for (const field of fields) {
    if (field && detectCrisis(field)) return CRISIS_RESPONSE
  }
  return null
}

// ── Content Policy Gate (Haiku pre-screen, FAIL-CLOSED per SCOPE-8a.F8a) ─

interface ContentPolicyResult {
  outcome: 'approved' | 'deity' | 'blocked' | 'harmful_description'
  message?: string
  deityName?: string
}

const CONTENT_POLICY_BLOCK_FAIL_CLOSED: ContentPolicyResult = {
  outcome: 'blocked',
  message: "We couldn't verify this request right now. Please try again in a moment.",
}

async function contentPolicyCheck(name: string, description: string): Promise<ContentPolicyResult> {
  const prompt = `You are a content policy classifier for a family platform. Check this persona creation request.

Name: "${name}"
Description: "${description}"

Respond with EXACTLY ONE of these JSON objects (no other text):

If the name is a deity, divine figure, God, Jesus, Allah, Yahweh, Holy Spirit, Buddha (as a divine figure), Krishna, or any name for the divine:
{"outcome":"deity","deity_name":"[the name]"}

If the name is a figure whose primary legacy involves mass violence, genocide, terrorism, or sexual predation (e.g., Hitler, Stalin, serial killers, cult leaders who harmed people):
{"outcome":"blocked"}

If the description contains sexual content, graphic violence, hateful ideology, or instructions to harm:
{"outcome":"harmful_description"}

Otherwise (historical figures, literary characters, public figures, personal people, fictional characters, religious leaders who are NOT the divine — e.g., C.S. Lewis, Moses, Paul, saints are OK):
{"outcome":"approved"}`

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://myaimcentral.com',
        'X-Title': 'MyAIM Central - Content Policy',
      },
      body: JSON.stringify({
        model: MODEL_HAIKU,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 100,
        temperature: 0,
      }),
    })
    // FAIL-CLOSED (SCOPE-8a.F8a): previously returned approved on HTTP error.
    if (!res.ok) {
      console.error('contentPolicyCheck HTTP error:', res.status)
      return CONTENT_POLICY_BLOCK_FAIL_CLOSED
    }

    const json = await res.json()
    const text = json.choices?.[0]?.message?.content?.trim() || ''
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(text)
    } catch {
      console.error('contentPolicyCheck JSON parse failed:', text.slice(0, 200))
      return CONTENT_POLICY_BLOCK_FAIL_CLOSED
    }

    if (parsed.outcome === 'deity') {
      const deityName = (parsed.deity_name as string) || name
      return {
        outcome: 'deity',
        deityName,
        message: `We don't create AI voices for ${deityName}. Instead, I can create a Prayer Seat — a set of reflection questions you could bring to ${deityName} in prayer. Would you like that?`,
      }
    }
    if (parsed.outcome === 'blocked') {
      return {
        outcome: 'blocked',
        message: `I'm not able to create a persona for ${name}. Is there someone else you'd like at your table?`,
      }
    }
    if (parsed.outcome === 'harmful_description') {
      return {
        outcome: 'harmful_description',
        message: 'Some elements in your description don\'t fit our platform. Could you describe how this person thinks and gives advice instead?',
      }
    }
    if (parsed.outcome === 'approved') {
      return { outcome: 'approved' }
    }
    // Unknown outcome → fail-closed
    console.error('contentPolicyCheck unknown outcome:', parsed.outcome)
    return CONTENT_POLICY_BLOCK_FAIL_CLOSED
  } catch (err) {
    // FAIL-CLOSED (SCOPE-8a.F8a): previously returned approved on exception.
    console.error('contentPolicyCheck threw:', err)
    return CONTENT_POLICY_BLOCK_FAIL_CLOSED
  }
}

// ── Multi-Family-Relevance Classifier (Haiku, fail-closed) ──
// Addendum §5. Decides whether generated persona writes to Tier 1 only
// or ALSO enters Tier 2 promotion queue.

interface ClassifierSignals {
  public_figure_verifiable: boolean
  personal_attributes_detected: boolean
  entity_resolved: boolean
  user_chip_selection: string
}

interface ClassifierResult {
  multi_family_relevance: 'yes' | 'no'
  confidence: number
  signals: ClassifierSignals
  reasoning: string
}

const CLASSIFIER_FAIL_CLOSED: ClassifierResult = {
  multi_family_relevance: 'no',
  confidence: 0,
  signals: {
    public_figure_verifiable: false,
    personal_attributes_detected: false,
    entity_resolved: false,
    user_chip_selection: 'unknown',
  },
  reasoning: 'Classifier unavailable — defaulted to personal-only per fail-closed rule.',
}

async function classifyRelevance(
  name: string,
  description: string,
  relationship: string,
  entityResolved: boolean,
): Promise<ClassifierResult> {
  const prompt = `You are classifying an AI persona request for multi-family relevance. Decide whether this persona is likely to be meaningful to multiple different families (community-relevant) or is specific to the one family that created it (personal-only).

Signals to consider:
1. Is the described person a real public figure with published works/speeches, or a fictional character from published work?
2. Does the description contain PERSONAL attributes ("my grandmother", "my pastor", private anecdotes, "she always told me", relationships only this user has)?
3. The user's self-described relationship chip: "${relationship}"
4. Entity resolution hint from embedding lookup: ${entityResolved ? 'near-miss found — name likely resolves to an existing known figure' : 'no near-miss — name may not resolve to a known entity'}

Name: "${name}"
Description: "${description}"

Explicit chip-based rules:
- If relationship is "A historical/public figure" or "A fictional character I'm writing" → likely YES (community-relevant)
- If relationship is "My grandmother", "A mentor", "A friend", "A pastor/spiritual leader" (personal) → likely NO (personal-only)

Return EXACTLY this JSON shape (no other text):
{"multi_family_relevance":"yes"|"no","confidence":0.0-1.0,"signals":{"public_figure_verifiable":bool,"personal_attributes_detected":bool,"entity_resolved":bool,"user_chip_selection":"${relationship}"},"reasoning":"one-line rationale"}`

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://myaimcentral.com',
        'X-Title': 'MyAIM Central - Relevance Classifier',
      },
      body: JSON.stringify({
        model: MODEL_HAIKU,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 250,
        temperature: 0,
      }),
    })
    if (!res.ok) {
      console.error('classifyRelevance HTTP error:', res.status)
      return CLASSIFIER_FAIL_CLOSED
    }

    const json = await res.json()
    const text = json.choices?.[0]?.message?.content?.trim() || ''
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      console.error('classifyRelevance no JSON found:', text.slice(0, 200))
      return CLASSIFIER_FAIL_CLOSED
    }
    let parsed: Record<string, unknown>
    try {
      parsed = JSON.parse(jsonMatch[0])
    } catch {
      return CLASSIFIER_FAIL_CLOSED
    }

    const relevance = parsed.multi_family_relevance
    if (relevance !== 'yes' && relevance !== 'no') return CLASSIFIER_FAIL_CLOSED
    const confidence = typeof parsed.confidence === 'number' ? parsed.confidence : 0
    // Low-confidence fail-closed: below 0.6 → force personal-only
    if (relevance === 'yes' && confidence < 0.6) {
      return {
        multi_family_relevance: 'no',
        confidence,
        signals: (parsed.signals as ClassifierSignals) || CLASSIFIER_FAIL_CLOSED.signals,
        reasoning: `Low confidence (${confidence}) — defaulted to personal-only.`,
      }
    }

    return {
      multi_family_relevance: relevance,
      confidence,
      signals: (parsed.signals as ClassifierSignals) || CLASSIFIER_FAIL_CLOSED.signals,
      reasoning: (parsed.reasoning as string) || '',
    }
  } catch (err) {
    console.error('classifyRelevance threw:', err)
    return CLASSIFIER_FAIL_CLOSED
  }
}

// ── Embedding Pre-Screen (addendum §4) ───────────────────────
// Returns silent / suggest / none + matched persona when applicable.

interface PrescreenResult {
  match: 'silent' | 'suggest' | 'none'
  persona?: {
    id: string
    persona_name: string
    persona_type: string
    personality_profile: Record<string, unknown>
    category: string | null
    icon_emoji: string | null
  }
  similarity?: number
}

async function prescreenApprovedPersonaMatch(name: string): Promise<PrescreenResult> {
  // Exact-name match first (cheaper than embedding)
  const { data: exact } = await supabase.rpc('lookup_approved_persona', { p_name: name })
  if (exact && exact.length > 0) {
    const row = exact[0] as Record<string, unknown>
    return {
      match: 'silent',
      persona: {
        id: row.id as string,
        persona_name: row.persona_name as string,
        persona_type: row.persona_type as string,
        personality_profile: (row.personality_profile as Record<string, unknown>) || {},
        category: (row.category as string) || null,
        icon_emoji: (row.icon_emoji as string) || null,
      },
      similarity: 1.0,
    }
  }

  // Embedding near-miss
  const embedding = await embedText(name)
  if (!embedding) return { match: 'none' } // pre-screen unavailable → skip, harm screen is the real gate

  const { data: near, error } = await supabase.rpc('prescreen_approved_persona_by_embedding', {
    p_embedding: embedding,
    p_threshold: PRESCREEN_SUGGEST_THRESHOLD,
  })
  if (error) {
    console.error('prescreen RPC error:', error.message)
    return { match: 'none' }
  }
  if (!near || near.length === 0) return { match: 'none' }

  const hit = near[0] as Record<string, unknown>
  const similarity = Number(hit.similarity) || 0
  const matchTier: 'silent' | 'suggest' = similarity >= PRESCREEN_SILENT_THRESHOLD ? 'silent' : 'suggest'
  return {
    match: matchTier,
    similarity,
    persona: {
      id: hit.id as string,
      persona_name: hit.persona_name as string,
      persona_type: hit.persona_type as string,
      personality_profile: (hit.personality_profile as Record<string, unknown>) || {},
      category: (hit.category as string) || null,
      icon_emoji: (hit.icon_emoji as string) || null,
    },
  }
}

// ── Persona Generation (Sonnet) ──────────────────────────────

async function generatePersona(
  name: string,
  description: string,
  relationship: string,
  followUp: string,
): Promise<Record<string, unknown>> {
  const prompt = `Generate a detailed personality profile for an AI advisory persona.

Name: ${name}
Relationship to user: ${relationship}
User's description: ${description}
Communication style detail: ${followUp}

Return a JSON object with these exact keys:
{
  "traits": ["3-5 key personality traits"],
  "philosophies": ["2-3 core beliefs or worldview elements"],
  "communication_style": "How they talk, advise, and interact — 2-3 sentences",
  "reasoning_patterns": "How they approach problems — 2-3 sentences",
  "characteristic_language": ["3-5 sample phrases or speech patterns they would use"],
  "known_for": "One sentence summary of what makes this person distinctive as an advisor"
}

Be specific and authentic. If this is a real person, draw from their known communication patterns. If personal to the user, extrapolate from the description provided.`

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://myaimcentral.com',
      'X-Title': 'MyAIM Central - Persona Generation',
    },
    body: JSON.stringify({
      model: MODEL_SONNET,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1024,
      temperature: 0.7,
    }),
  })

  const json = await res.json()
  const text = json.choices?.[0]?.message?.content?.trim() || '{}'
  // Extract JSON from potential markdown code blocks
  const jsonMatch = text.match(/\{[\s\S]*\}/)
  if (jsonMatch) {
    try { return JSON.parse(jsonMatch[0]) } catch { /* fall through */ }
  }
  return JSON.parse(text)
}

// ── Prayer Seat Generation (Sonnet) ──────────────────────────

async function generatePrayerQuestions(situation: string, deityName: string): Promise<string[]> {
  const prompt = `A user is facing this situation: "${situation}"

They wanted to consult ${deityName} for guidance. Since we don't create AI voices for the divine, generate 5 thoughtful reflection questions they could bring to prayer or meditation about their specific situation.

The questions should be:
- Specific to their situation (not generic spiritual questions)
- Invitational, not directive
- Respectful of all faith traditions
- Focused on inner wisdom, discernment, and peace

Return ONLY a JSON array of 5 strings. No other text.`

  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://myaimcentral.com',
      'X-Title': 'MyAIM Central - Prayer Seat',
    },
    body: JSON.stringify({
      model: MODEL_SONNET,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 512,
      temperature: 0.8,
    }),
  })

  const json = await res.json()
  const text = json.choices?.[0]?.message?.content?.trim() || '[]'
  const arrMatch = text.match(/\[[\s\S]*\]/)
  if (arrMatch) {
    try { return JSON.parse(arrMatch[0]) } catch { /* fall through */ }
  }
  return [
    'What do I sense is the right thing to do when I am quiet enough to hear?',
    'What would love — not fear — choose here?',
    'What am I being invited to learn through this?',
    'If I trusted that I would be guided, what would I do first?',
    'What does peace feel like in this decision? Which option carries more peace?',
  ]
}

// ── Build advisor system prompt ──────────────────────────────

function buildAdvisorPrompt(
  persona: { persona_name: string; personality_profile: Record<string, unknown> },
  seatedNames: string[],
  userContext: string,
): string {
  const p = persona.personality_profile as {
    traits?: string[]
    philosophies?: string[]
    communication_style?: string
    reasoning_patterns?: string
    characteristic_language?: string[]
    known_for?: string
  }

  return `## CRISIS OVERRIDE (NON-NEGOTIABLE)
If any message contains indicators of suicidal ideation, self-harm, abuse, or immediate danger:
1. Express care and validation. 2. Provide: 988, Crisis Text Line (741741), NDVH, 911.
Break character immediately for crisis.

## YOUR IDENTITY: ${persona.persona_name}
You ARE ${persona.persona_name}. Respond fully in character.

Traits: ${(p.traits || []).join(', ')}
Philosophies: ${(p.philosophies || []).join('; ')}
Communication style: ${p.communication_style || 'Authentic to who you are'}
Reasoning patterns: ${p.reasoning_patterns || 'Think as you naturally would'}
Characteristic language: ${(p.characteristic_language || []).join('; ')}
Known for: ${p.known_for || persona.persona_name}

## BOARD CONTEXT
You are one of ${seatedNames.length} advisors at this table: ${seatedNames.join(', ')}.
Other advisors may have already responded in this round. You can:
- Reference what they said when it adds tension or synthesis
- Explicitly disagree when your perspective genuinely differs
- Build on their points when they align with your worldview

Respond in YOUR authentic voice — your communication style, reasoning patterns, and characteristic language. Do not be a caricature. Be the genuine article.

Keep responses focused and substantive (150-300 words). End with something the user can respond to — a question, a challenge, or an observation that invites deeper thinking.

## USER CONTEXT
${userContext}
`
}

function buildModeratorPrompt(seatedNames: string[], userContext: string): string {
  return `## IDENTITY
You are LiLa, moderating a Board of Directors advisory session. You are NOT an advisor — you are the facilitator.

Your role between advisor rounds:
- Summarize what the board has said so far (1-2 sentences)
- Note when advisors disagree and what is at stake in that disagreement
- Suggest the user respond to a specific advisor if one perspective seems most relevant
- Offer: "Want to capture any decisions or next steps?"
- If you detect 3+ turns of back-and-forth without progress, offer ONCE: "Before we go further — if I flipped a coin and it landed on [Option A], what is your gut reaction? Relief or dread? That reaction is data worth paying attention to."

Do NOT add your own perspective. You observe and facilitate.
Keep it brief (2-4 sentences). The advisors are the stars, not you.

Board members: ${seatedNames.join(', ')}

## USER CONTEXT
${userContext}
`
}

// ── Main handler ─────────────────────────────────────────────

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const auth = await authenticateRequest(req)
    if (auth instanceof Response) return auth

    const rawBody = await req.json()
    const parsed = InputSchema.safeParse(rawBody)
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: parsed.error.flatten() }), { status: 400, headers: jsonHeaders })
    }

    const body = rawBody as Record<string, unknown>
    const { conversation_id, content, action } = parsed.data

    const { data: conv } = await supabase.from('lila_conversations').select('*').eq('id', conversation_id).single()
    if (!conv) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: jsonHeaders })

    // ── Action: Prescreen persona (embedding + exact-name lookup) ──
    if (action === 'prescreen_persona') {
      const name = (body.name as string || '').trim()
      if (!name) return new Response(JSON.stringify({ error: 'Missing name' }), { status: 400, headers: jsonHeaders })
      const crisis = crisisCheckFields(name)
      if (crisis) return new Response(JSON.stringify({ crisis: true, response: crisis }), { headers: jsonHeaders })
      const result = await prescreenApprovedPersonaMatch(name)
      return new Response(JSON.stringify(result), { headers: jsonHeaders })
    }

    // ── Action: Content policy check ─────────────────────────
    if (action === 'content_policy_check') {
      const name = body.name as string | undefined
      if (!name) return new Response(JSON.stringify({ error: 'Missing name' }), { status: 400, headers: jsonHeaders })
      const description = (body.description as string) || ''
      // Crisis gate on free-form fields BEFORE content policy (Convention #7 global, adjustment #2)
      const crisis = crisisCheckFields(name, description)
      if (crisis) {
        return new Response(JSON.stringify({ crisis: true, response: crisis }), { headers: jsonHeaders })
      }
      const result = await contentPolicyCheck(name, description)
      return new Response(JSON.stringify(result), { headers: jsonHeaders })
    }

    // ── Action: Create persona (three-tier flow) ─────────────
    if (action === 'create_persona') {
      const name = ((body.name as string) || '').trim()
      const description = ((body.description as string) || '').trim()
      const relationship = ((body.relationship as string) || 'advisor').trim()
      const follow_up = ((body.follow_up as string) || '').trim()
      const family_id = body.family_id as string | undefined
      const member_id = body.member_id as string | undefined

      if (!name || !family_id || !member_id) {
        return new Response(JSON.stringify({ error: 'Missing name/family_id/member_id' }), { status: 400, headers: jsonHeaders })
      }

      // Step 1: Crisis gate on ALL free-form fields (Convention #7, adjustment #2)
      const crisis = crisisCheckFields(name, description, follow_up, relationship)
      if (crisis) {
        return new Response(JSON.stringify({ crisis: true, response: crisis }), { headers: jsonHeaders })
      }

      // Step 2: Exact-name + embedding pre-screen against Tier 3 (addendum §4)
      const prescreen = await prescreenApprovedPersonaMatch(name)
      if (prescreen.match === 'silent' && prescreen.persona) {
        // Silent seat: return the existing Tier-3 persona, UI auto-seats
        return new Response(JSON.stringify({
          persona: prescreen.persona,
          source: 'tier3_cache',
          prescreen: { match: 'silent', similarity: prescreen.similarity },
        }), { headers: jsonHeaders })
      }
      if (prescreen.match === 'suggest' && prescreen.persona) {
        // UI will show suggestion card — not auto-seated
        return new Response(JSON.stringify({
          persona: null,
          suggestion: prescreen.persona,
          source: 'tier3_near_miss',
          prescreen: { match: 'suggest', similarity: prescreen.similarity },
        }), { headers: jsonHeaders })
      }

      // Step 3: Content policy harm screen (fail-closed per SCOPE-8a.F8a)
      const policyResult = await contentPolicyCheck(name, description)
      if (policyResult.outcome !== 'approved') {
        return new Response(JSON.stringify({
          persona: null,
          policy: policyResult,
        }), { headers: jsonHeaders })
      }

      // Step 4: Multi-family-relevance classifier (addendum §5)
      const classifier = await classifyRelevance(
        name,
        description,
        relationship,
        prescreen.match !== 'none', // entity_resolved = we got a near-miss below suggest threshold
      )

      // Step 5: Sonnet persona generation
      const profile = await generatePersona(name, description, relationship, follow_up)

      // Step 6: Write Tier-1 row (public.board_personas, personal_custom, family-scoped)
      const tier1Row = {
        persona_name: name,
        persona_type: 'personal_custom' as const,
        personality_profile: profile,
        source_references: [],
        category: 'custom' as const,
        content_policy_status: 'approved' as const,
        is_public: false,
        created_by: member_id,
        family_id,
      }

      const { data: inserted, error: insertError } = await supabase
        .from('board_personas')
        .insert(tier1Row)
        .select()
        .single()

      if (insertError) {
        console.error('Tier-1 insert error:', insertError.message)
        return new Response(JSON.stringify({ error: 'Failed to create persona' }), { status: 500, headers: jsonHeaders })
      }

      // Step 7: If classifier says multi-family-relevance yes, also write queue row
      let queueRowId: string | null = null
      if (classifier.multi_family_relevance === 'yes') {
        const queueEmbedding = await embedText(`${name}\n${description}`)
        const { data: queueRow, error: queueError } = await supabase
          .schema('platform_intelligence')
          .from('persona_promotion_queue')
          .insert({
            requested_persona_name: name,
            submitted_by_family_id: family_id,
            submitted_by_member_id: member_id,
            promoted_from_personal_id: inserted.id,
            proposed_personality_profile: profile,
            source_references: [],
            category: 'custom',
            classifier_confidence: classifier.confidence,
            classifier_signals: classifier.signals,
            classifier_reasoning: classifier.reasoning,
            content_policy_pre_screen_status: 'passed',
            embedding: queueEmbedding,
            status: 'pending',
          })
          .select('id')
          .single()
        if (queueError) {
          console.error('Queue insert error (non-fatal):', queueError.message)
        } else if (queueRow) {
          queueRowId = queueRow.id
        }
      }

      // Log generation cost
      logAICost({
        familyId: conv.family_id,
        memberId: conv.member_id,
        featureKey: 'lila_persona_generation',
        model: MODEL_SONNET,
        inputTokens: 500,
        outputTokens: 1000,
      })

      return new Response(JSON.stringify({
        persona: inserted,
        source: 'generated',
        classifier: {
          multi_family_relevance: classifier.multi_family_relevance,
          confidence: classifier.confidence,
        },
        queue_row_id: queueRowId,
      }), { headers: jsonHeaders })
    }

    // ── Action: Generate prayer seat ─────────────────────────
    if (action === 'generate_prayer_seat') {
      const situation = (body.situation as string) || 'a difficult decision'
      const deity_name = (body.deity_name as string) || 'God'
      // Crisis gate on situation (user's actual content)
      const crisis = crisisCheckFields(situation)
      if (crisis) return new Response(JSON.stringify({ crisis: true, response: crisis }), { headers: jsonHeaders })
      const questions = await generatePrayerQuestions(situation, deity_name)
      return new Response(JSON.stringify({ questions }), { headers: jsonHeaders })
    }

    // ── Action: Admin — approve queued persona ───────────────
    if (action === 'approve_queued_persona') {
      const queue_id = body.queue_id as string | undefined
      if (!queue_id) return new Response(JSON.stringify({ error: 'Missing queue_id' }), { status: 400, headers: jsonHeaders })
      // Crisis gate on any admin-supplied refine content (adjustment #2)
      const refinedProfile = body.refined_profile as Record<string, unknown> | undefined
      const refinedProfileText = refinedProfile ? JSON.stringify(refinedProfile) : ''
      const crisis = crisisCheckFields(refinedProfileText, body.admin_notes as string | undefined)
      if (crisis) return new Response(JSON.stringify({ crisis: true, response: crisis }), { headers: jsonHeaders })
      // Proxy to RPC (RPC enforces admin permission via SECURITY DEFINER + staff_permissions check)
      const { data, error } = await supabase.rpc('approve_queued_persona', {
        p_queue_id: queue_id,
        p_refined_profile: refinedProfile ?? null,
        p_refined_sources: (body.refined_sources as string[]) ?? null,
        p_admin_notes: (body.admin_notes as string) ?? null,
        p_was_refined: !!refinedProfile,
      })
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 403, headers: jsonHeaders })
      }
      return new Response(JSON.stringify({ approved_persona_id: data }), { headers: jsonHeaders })
    }

    // ── Action: Admin — reject queued persona ────────────────
    if (action === 'reject_queued_persona') {
      const queue_id = body.queue_id as string | undefined
      const admin_notes = (body.admin_notes as string) || ''
      if (!queue_id) return new Response(JSON.stringify({ error: 'Missing queue_id' }), { status: 400, headers: jsonHeaders })
      const { error } = await supabase.rpc('reject_queued_persona', {
        p_queue_id: queue_id,
        p_admin_notes: admin_notes,
      })
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 403, headers: jsonHeaders })
      return new Response(JSON.stringify({ ok: true }), { headers: jsonHeaders })
    }

    // ── Action: Admin — defer queued persona ─────────────────
    if (action === 'defer_queued_persona') {
      const queue_id = body.queue_id as string | undefined
      if (!queue_id) return new Response(JSON.stringify({ error: 'Missing queue_id' }), { status: 400, headers: jsonHeaders })
      const { error } = await supabase.rpc('defer_queued_persona', { p_queue_id: queue_id })
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 403, headers: jsonHeaders })
      return new Response(JSON.stringify({ ok: true }), { headers: jsonHeaders })
    }

    // ── Action: Admin — list promotion queue ─────────────────
    if (action === 'list_persona_promotion_queue') {
      const status = (body.status as string) || 'pending'
      const hideStale = body.hide_stale !== false
      const { data, error } = await supabase.rpc('list_persona_promotion_queue', {
        p_status: status,
        p_hide_stale: hideStale,
      })
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 403, headers: jsonHeaders })
      return new Response(JSON.stringify({ rows: data || [] }), { headers: jsonHeaders })
    }

    // ── Action: Chat (default) — sequential multi-advisor ────
    if (!content) return new Response(JSON.stringify({ error: 'Missing content' }), { status: 400, headers: jsonHeaders })

    // Crisis check (global, Convention #7)
    if (detectCrisis(content)) {
      await supabase.from('lila_messages').insert([
        { conversation_id, role: 'user', content, metadata: {} },
        { conversation_id, role: 'assistant', content: CRISIS_RESPONSE, metadata: { source: 'crisis_override' } },
      ])
      return new Response(JSON.stringify({ crisis: true, response: CRISIS_RESPONSE }), { headers: jsonHeaders })
    }

    // Save user message
    await supabase.from('lila_messages').insert({
      conversation_id, role: 'user', content,
      metadata: { mode: 'board_of_directors' },
    })

    // Load board session and seated personas
    const { data: boardSession } = await supabase
      .from('board_sessions')
      .select('id, disclaimer_shown')
      .eq('conversation_id', conversation_id)
      .single()

    let seatedPersonas: Array<{ persona_id: string | null; platform_persona_id: string | null; seat_order: number; is_prayer_seat: boolean }> = []
    if (boardSession) {
      const { data: seats } = await supabase
        .from('board_session_personas')
        .select('persona_id, platform_persona_id, seat_order, is_prayer_seat')
        .eq('board_session_id', boardSession.id)
        .is('removed_at', null)
        .order('seat_order', { ascending: true })
      seatedPersonas = seats || []
    }

    // Load persona profiles from BOTH tiers (dual-column resolution per Convention #258)
    const tier1Ids = seatedPersonas.filter(s => !s.is_prayer_seat && s.persona_id).map(s => s.persona_id!)
    const tier3Ids = seatedPersonas.filter(s => !s.is_prayer_seat && s.platform_persona_id).map(s => s.platform_persona_id!)
    let personas: Array<{ id: string; persona_name: string; personality_profile: Record<string, unknown>; persona_type: string }> = []
    if (tier1Ids.length > 0) {
      const { data: t1 } = await supabase
        .from('board_personas')
        .select('id, persona_name, personality_profile, persona_type')
        .in('id', tier1Ids)
      personas.push(...(t1 || []))
    }
    if (tier3Ids.length > 0) {
      const { data: t3 } = await supabase
        .schema('platform_intelligence')
        .from('board_personas')
        .select('id, persona_name, personality_profile, persona_type')
        .in('id', tier3Ids)
      personas.push(...(t3 || []))
    }
    // Preserve seat order
    const orderMap = new Map<string, number>()
    for (const s of seatedPersonas) {
      if (s.persona_id) orderMap.set(s.persona_id, s.seat_order)
      if (s.platform_persona_id) orderMap.set(s.platform_persona_id, s.seat_order)
    }
    personas.sort((a, b) => (orderMap.get(a.id) || 0) - (orderMap.get(b.id) || 0))

    // Load full conversation history (needed by assembleContext for relevance detection)
    const { data: history } = await supabase.from('lila_messages')
      .select('role, content, metadata')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })
      .limit(60)

    // SCOPE-8a.F8b: Route context assembly through the shared assembler.
    // Replaces inline stars/intentions/self_knowledge loading with the
    // three-layer pipeline, which correctly applies:
    //   - Three-tier is_included_in_ai toggles (person / folder / item)
    //   - Role-asymmetric is_privacy_filtered hard constraint
    //     (Convention #76 — mom sees everything, others excluded from
    //     is_privacy_filtered=true rows via applyPrivacyFilter)
    //   - Name detection + topic matching for relevance filtering
    // Convention #247 + #248 category-1 invariant: Board's non-empty
    // context_sources requires assembleContext() usage. Migration 100161
    // widened context_sources to match the assembler's native sources.
    const assembled = await assembleContext({
      familyId: conv.family_id,
      memberId: conv.member_id,
      userMessage: content,
      recentMessages: (history || []).slice(-4).map(m => ({ role: m.role, content: m.content })),
      featureContext: 'Discussing with Board of Directors advisors',
      alwaysIncludeMembers: [conv.member_id],
    })

    const userContext = [
      assembled.familyRoster,
      assembled.featureContext,
      assembled.relevantContext,
    ].filter(Boolean).join('\n')

    // If no personas seated, LiLa suggests board composition
    if (personas.length === 0) {
      const suggestPrompt = `The user is starting a Board of Directors session but hasn't seated any advisors yet. Based on their situation, suggest 2-3 advisors from the platform library by name and role. Be brief. The situation: "${content}"`
      const suggestMessages = [
        { role: 'system' as const, content: suggestPrompt },
        { role: 'user' as const, content },
      ]

      const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://myaimcentral.com', 'X-Title': 'MyAIM Central - BoD Suggest' },
        body: JSON.stringify({ model: MODEL_SONNET, messages: suggestMessages, stream: true, max_tokens: 512 }),
      })

      if (!aiRes.ok || !aiRes.body) return new Response(JSON.stringify({ error: 'AI error' }), { status: 502, headers: jsonHeaders })

      let suggestFull = ''
      const stream = new ReadableStream({
        async start(controller) {
          const reader = aiRes.body!.getReader(); const dec = new TextDecoder(); let buf = ''
          try {
            while (true) {
              const { done, value } = await reader.read(); if (done) break
              buf += dec.decode(value, { stream: true }); const lines = buf.split('\n'); buf = lines.pop() || ''
              for (const line of lines) {
                if (!line.startsWith('data: ')) continue; const d = line.slice(6).trim()
                if (d === '[DONE]') { controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n')); continue }
                try { const p = JSON.parse(d); const c = p.choices?.[0]?.delta?.content || ''; if (c) { suggestFull += c; controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'chunk', content: c, source: 'lila' })}\n\n`)) } } catch { /* skip */ }
              }
            }
          } finally {
            await supabase.from('lila_messages').insert({ conversation_id, role: 'assistant', content: suggestFull, metadata: { mode: 'board_of_directors', source: 'lila_moderator', suggest_board: true } })
            controller.close()
          }
        },
      })
      return new Response(stream, { headers: sseHeaders })
    }

    // ── Sequential multi-advisor streaming ────────────────────
    // Each advisor gets a Sonnet call with full history + prior advisors from this turn
    const seatedNames = personas.map(p => p.persona_name)
    const historyMessages = ((history || []) as Array<{ role: string; content: string; metadata?: Record<string, unknown> }>)
      .map(m => ({
        role: (m.role === 'system' ? 'assistant' : m.role) as 'user' | 'assistant',
        content: m.content,
      }))

    // Track whether we need the disclaimer
    const needsDisclaimer = boardSession && !boardSession.disclaimer_shown &&
      personas.some(p => p.persona_type !== 'personal_custom')

    // SCOPE-4.F7: moderator interjection opt-in. Default: OFF.
    // Resolution order:
    //   1. Per-conversation override: conv.context_snapshot.moderator_enabled (explicit boolean)
    //   2. Per-user preference: family_members.preferences.moderator_interjections_enabled
    //   3. Default: false
    // Board of Directors respects the user's flow; Decision Guide is the tool
    // for active facilitation (founder direction 2026-04-21, addendum §7 D6).
    let moderatorEnabled = false
    const convSnapshot = (conv.context_snapshot || {}) as Record<string, unknown>
    if (typeof convSnapshot.moderator_enabled === 'boolean') {
      moderatorEnabled = convSnapshot.moderator_enabled
    } else {
      const { data: memberPrefs } = await supabase
        .from('family_members')
        .select('preferences')
        .eq('id', conv.member_id)
        .maybeSingle()
      const prefs = (memberPrefs?.preferences || {}) as Record<string, unknown>
      moderatorEnabled = prefs.moderator_interjections_enabled === true
    }

    const encoder = new TextEncoder()
    let totalInTok = 0, totalOutTok = 0
    const currentTurnResponses: string[] = [] // accumulates this turn's advisor responses

    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Generate each advisor response sequentially
          for (let i = 0; i < personas.length; i++) {
            const persona = personas[i]

            // Send advisor separator
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'advisor_start',
              persona_id: persona.id,
              persona_name: persona.persona_name,
            })}\n\n`))

            // Build messages for this advisor — includes prior advisors from this turn
            const advisorHistory = [
              ...historyMessages,
              // Add prior advisor responses from this turn as assistant messages
              ...currentTurnResponses.map(r => ({ role: 'assistant' as const, content: r })),
            ]

            const systemPrompt = buildAdvisorPrompt(persona, seatedNames, userContext)
            const messages = [
              { role: 'system' as const, content: systemPrompt },
              ...advisorHistory,
            ]

            // Stream this advisor's response
            const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://myaimcentral.com', 'X-Title': `MyAIM Central - BoD ${persona.persona_name}` },
              body: JSON.stringify({ model: MODEL_SONNET, messages, stream: true, max_tokens: 1024 }),
            })

            if (!aiRes.ok || !aiRes.body) {
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'advisor_error', persona_name: persona.persona_name })}\n\n`))
              continue
            }

            let advisorFull = ''
            const reader = aiRes.body.getReader()
            const dec = new TextDecoder()
            let buf = ''

            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              buf += dec.decode(value, { stream: true })
              const lines = buf.split('\n')
              buf = lines.pop() || ''
              for (const line of lines) {
                if (!line.startsWith('data: ')) continue
                const d = line.slice(6).trim()
                if (d === '[DONE]') continue
                try {
                  const p = JSON.parse(d)
                  const c = p.choices?.[0]?.delta?.content || ''
                  if (c) {
                    advisorFull += c
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                      type: 'chunk',
                      content: c,
                      persona_id: persona.id,
                      persona_name: persona.persona_name,
                    })}\n\n`))
                  }
                  if (p.usage) { totalInTok += p.usage.prompt_tokens || 0; totalOutTok += p.usage.completion_tokens || 0 }
                } catch { /* skip */ }
              }
            }

            // Save advisor message to DB
            const isFirstNonPersonal = needsDisclaimer && i === personas.findIndex(p2 => p2.persona_type !== 'personal_custom')
            await supabase.from('lila_messages').insert({
              conversation_id, role: 'assistant', content: advisorFull,
              metadata: {
                mode: 'board_of_directors',
                persona_id: persona.id,
                persona_name: persona.persona_name,
                is_prayer_seat_reflection: false,
                show_disclaimer: isFirstNonPersonal,
              },
            })

            // Mark disclaimer as shown
            if (isFirstNonPersonal && boardSession) {
              await supabase.from('board_sessions').update({ disclaimer_shown: true }).eq('id', boardSession.id)
            }

            // Add to current turn responses for next advisor's context
            currentTurnResponses.push(`[${persona.persona_name}]: ${advisorFull}`)

            // Send advisor end marker
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({
              type: 'advisor_end',
              persona_id: persona.id,
              persona_name: persona.persona_name,
            })}\n\n`))
          }

          // Check for prayer seat — insert reflection questions after advisors
          const prayerSeats = seatedPersonas.filter(s => s.is_prayer_seat)
          if (prayerSeats.length > 0) {
            // Load prayer questions from the conversation's context_snapshot
            const snapshot = (conv.context_snapshot || {}) as Record<string, unknown>
            const prayerQuestions = (snapshot.prayer_questions as string[]) || []
            if (prayerQuestions.length > 0) {
              const prayerContent = 'Take a moment to sit with these questions:\n\n' +
                prayerQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n')
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({
                type: 'prayer_seat',
                content: prayerContent,
              })}\n\n`))
            }
          }

          // LiLa moderator interjection — SCOPE-4.F7 opt-in gate.
          // Default off; fires only when moderatorEnabled resolved true from
          // per-conversation override or per-user preference.
          if (moderatorEnabled) {
            const moderatorPrompt = buildModeratorPrompt(seatedNames, userContext)
            const modMessages = [
              { role: 'system' as const, content: moderatorPrompt },
              ...historyMessages,
              ...currentTurnResponses.map(r => ({ role: 'assistant' as const, content: r })),
            ]

            const modRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://myaimcentral.com', 'X-Title': 'MyAIM Central - BoD Moderator' },
              body: JSON.stringify({ model: MODEL_SONNET, messages: modMessages, stream: true, max_tokens: 512 }),
            })

            if (modRes.ok && modRes.body) {
              let modFull = ''
              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'moderator_start' })}\n\n`))
              const modReader = modRes.body.getReader()
              const modDec = new TextDecoder()
              let modBuf = ''
              while (true) {
                const { done, value } = await modReader.read(); if (done) break
                modBuf += modDec.decode(value, { stream: true }); const lines = modBuf.split('\n'); modBuf = lines.pop() || ''
                for (const line of lines) {
                  if (!line.startsWith('data: ')) continue; const d = line.slice(6).trim()
                  if (d === '[DONE]') continue
                  try { const p = JSON.parse(d); const c = p.choices?.[0]?.delta?.content || ''; if (c) { modFull += c; controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'chunk', content: c, source: 'lila' })}\n\n`)) } } catch { /* skip */ }
                }
              }
              await supabase.from('lila_messages').insert({ conversation_id, role: 'assistant', content: modFull, metadata: { mode: 'board_of_directors', source: 'lila_moderator' } })
            }
          }

          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        } finally {
          await supabase.from('lila_conversations').update({ message_count: (history?.length || 0) + personas.length + 2, model_used: 'sonnet' }).eq('id', conversation_id)
          logAICost({
            familyId: conv.family_id,
            memberId: conv.member_id,
            featureKey: 'lila_board_of_directors',
            model: MODEL_SONNET,
            inputTokens: totalInTok,
            outputTokens: totalOutTok,
          })
          controller.close()
        }
      },
    })

    return new Response(stream, { headers: sseHeaders })
  } catch (err) {
    console.error('Board of Directors error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: jsonHeaders })
  }
})
