// PRD-34: Board of Directors — Multi-persona advisory panel
// Model: Sonnet (one call per advisor per user turn)
// Streams each advisor response individually as it completes.
// Each advisor call receives full history INCLUDING prior advisor responses from current turn.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://esm.sh/zod@3.23.8'
import { handleCors, jsonHeaders, sseHeaders } from '../_shared/cors.ts'
import { authenticateRequest } from '../_shared/auth.ts'
import { detectCrisis, CRISIS_RESPONSE } from '../_shared/crisis-detection.ts'
import { logAICost } from '../_shared/cost-logger.ts'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const MODEL_SONNET = 'anthropic/claude-sonnet-4'
const MODEL_HAIKU = 'anthropic/claude-haiku-4-5-20251001'

// ── Zod input schema ────────────────────────────────────────

const InputSchema = z.object({
  conversation_id: z.string().uuid(),
  content: z.string().optional(),
  action: z.enum(['chat', 'create_persona', 'generate_prayer_seat', 'content_policy_check']).optional(),
  // Additional fields used by specific actions — validated inline
}).passthrough()

// ── Content Policy Gate (Haiku pre-screen) ──────────────────

interface ContentPolicyResult {
  outcome: 'approved' | 'deity' | 'blocked' | 'harmful_description'
  message?: string
  deityName?: string
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
    if (!res.ok) return { outcome: 'approved' } // fail open on API error

    const json = await res.json()
    const text = json.choices?.[0]?.message?.content?.trim() || ''
    const parsed = JSON.parse(text)

    if (parsed.outcome === 'deity') {
      return {
        outcome: 'deity',
        deityName: parsed.deity_name || name,
        message: `We don't create AI voices for ${parsed.deity_name || name}. Instead, I can create a Prayer Seat — a set of reflection questions you could bring to ${parsed.deity_name || name} in prayer. Would you like that?`,
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
    return { outcome: 'approved' }
  } catch {
    return { outcome: 'approved' } // fail open
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

    // ── Action: Content policy check ─────────────────────────
    if (action === 'content_policy_check') {
      const name = body.name as string | undefined
      if (!name) return new Response(JSON.stringify({ error: 'Missing name' }), { status: 400, headers: jsonHeaders })
      const description = (body.description as string) || ''
      const result = await contentPolicyCheck(name, description)
      return new Response(JSON.stringify(result), { headers: jsonHeaders })
    }

    // ── Action: Create persona ───────────────────────────────
    if (action === 'create_persona') {
      const name = body.name as string | undefined
      const description = (body.description as string) || ''
      const relationship = (body.relationship as string) || 'advisor'
      const follow_up = (body.follow_up as string) || ''
      const persona_type = body.persona_type as string | undefined
      const family_id = body.family_id as string | undefined
      const member_id = body.member_id as string | undefined

      // Persona caching: check by name (case-insensitive) before generating
      const { data: existing } = await supabase
        .from('board_personas')
        .select('*')
        .ilike('persona_name', name || '')
        .eq('content_policy_status', 'approved')
        .limit(1)

      if (existing && existing.length > 0) {
        return new Response(JSON.stringify({ persona: existing[0], cached: true }), { headers: jsonHeaders })
      }

      // Generate personality profile via Sonnet
      const profile = await generatePersona(name || '', description, relationship, follow_up)

      const isPersonal = persona_type === 'personal_custom'
      const newPersona = {
        persona_name: name,
        persona_type: isPersonal ? 'personal_custom' : 'community_generated',
        personality_profile: profile,
        source_references: [],
        category: isPersonal ? 'custom' : null,
        content_policy_status: isPersonal ? 'approved' : 'pending_review',
        is_public: false, // personal_custom: always false. community: false until moderated
        created_by: member_id,
        family_id: isPersonal ? family_id : null,
      }

      const { data: inserted, error: insertError } = await supabase
        .from('board_personas')
        .insert(newPersona)
        .select()
        .single()

      if (insertError) {
        return new Response(JSON.stringify({ error: 'Failed to create persona' }), { status: 500, headers: jsonHeaders })
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

      return new Response(JSON.stringify({ persona: inserted, cached: false }), { headers: jsonHeaders })
    }

    // ── Action: Generate prayer seat ─────────────────────────
    if (action === 'generate_prayer_seat') {
      const situation = (body.situation as string) || 'a difficult decision'
      const deity_name = (body.deity_name as string) || 'God'
      const questions = await generatePrayerQuestions(situation, deity_name)
      return new Response(JSON.stringify({ questions }), { headers: jsonHeaders })
    }

    // ── Action: Chat (default) — sequential multi-advisor ────
    if (!content) return new Response(JSON.stringify({ error: 'Missing content' }), { status: 400, headers: jsonHeaders })

    // Crisis check
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

    let seatedPersonas: Array<{ persona_id: string; seat_order: number; is_prayer_seat: boolean }> = []
    if (boardSession) {
      const { data: seats } = await supabase
        .from('board_session_personas')
        .select('persona_id, seat_order, is_prayer_seat')
        .eq('board_session_id', boardSession.id)
        .is('removed_at', null)
        .order('seat_order', { ascending: true })
      seatedPersonas = seats || []
    }

    // Load persona profiles
    const personaIds = seatedPersonas.filter(s => !s.is_prayer_seat).map(s => s.persona_id)
    let personas: Array<{ id: string; persona_name: string; personality_profile: Record<string, unknown>; persona_type: string }> = []
    if (personaIds.length > 0) {
      const { data: personaData } = await supabase
        .from('board_personas')
        .select('id, persona_name, personality_profile, persona_type')
        .in('id', personaIds)
      personas = personaData || []
    }

    // Load user context (guiding stars, self-knowledge)
    const { data: stars } = await supabase.from('guiding_stars')
      .select('content').eq('family_id', conv.family_id).eq('member_id', conv.member_id)
      .eq('is_included_in_ai', true).is('archived_at', null).limit(10)
    const { data: intentions } = await supabase.from('best_intentions')
      .select('statement').eq('family_id', conv.family_id).eq('member_id', conv.member_id)
      .eq('is_included_in_ai', true).eq('is_active', true).is('archived_at', null).limit(10)
    const { data: sk } = await supabase.from('self_knowledge')
      .select('content, category').eq('family_id', conv.family_id).eq('member_id', conv.member_id)
      .eq('is_included_in_ai', true).is('archived_at', null).limit(10)

    let userContext = ''
    if (stars?.length) userContext += 'Guiding Stars: ' + stars.map(s => s.content).join('; ') + '\n'
    if (intentions?.length) userContext += 'Best Intentions: ' + intentions.map(i => i.statement).join('; ') + '\n'
    if (sk?.length) userContext += 'Self-Knowledge: ' + sk.map(s => `[${s.category}] ${s.content}`).join('; ') + '\n'

    // Load full conversation history
    const { data: history } = await supabase.from('lila_messages')
      .select('role, content, metadata')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })
      .limit(60)

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

          // LiLa moderator interjection
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
                try { const p = JSON.parse(d); const c = p.choices?.[0]?.delta?.content || ''; if (c) { modFull += c; controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: c, source: 'lila' })}\n\n`)) } } catch { /* skip */ }
              }
            }
            await supabase.from('lila_messages').insert({ conversation_id, role: 'assistant', content: modFull, metadata: { mode: 'board_of_directors', source: 'lila_moderator' } })
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
