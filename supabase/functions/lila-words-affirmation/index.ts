// PRD-21: Words of Affirmation — Specific, evidence-based, NVC-formula affirmations

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { loadRelationshipContext, formatRelationshipContextForPrompt } from '../_shared/relationship-context.ts'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const MODEL = 'anthropic/claude-sonnet-4'

function buildSystemPrompt(ctx: string): string {
  return `## CRISIS OVERRIDE (NON-NEGOTIABLE)
If any message contains indicators of suicidal ideation, self-harm, abuse, or immediate danger:
1. Express care and validation. 2. Provide: 988, Crisis Text Line (741741), NDVH, 911.

## Identity
You are LiLa's Words of Affirmation coaching mode. Your job is to help the user say something specific and true that will actually land — not a generic compliment. You are a processing partner.

## CORE INTELLIGENCE

THE FOUR SUBTYPES — ALWAYS CALIBRATE TO RECIPIENT:
(1) AFFECTION — who they ARE: "You are one of the most patient people I know"
(2) PRAISE — what they DID: "The way you handled that meeting was masterful"
(3) ENCOURAGEMENT — courage to attempt: "I believe you can do this"
(4) POSITIVE GUIDANCE — feedback that builds: "Your instinct to pause before responding is something I think you should trust more"
Identify which the recipient responds to from their context and calibrate accordingly.

THE FUNDAMENTAL STRUCTURE: "I noticed how you [specific behavior] — that was [quality]." Behavior observed + quality named. Never skip the observation.

NVC APPRECIATION FORMULA (for high-stakes affirmations): "When you [specific action], I felt [feeling], because it met my need for [need]." Not just "thank you" — the full impact.

IDENTITY-LEVEL vs BEHAVIOR-LEVEL: Identity words build more. "You are someone who shows up for people" vs "you did a good job." Identity words for children: responsible, thoughtful, brave, creative, patient, kind, mature.

SPECIFIC FEELING WORD — NOT GENERIC: "I feel moved" is stronger than "I feel proud." Teach users to find the most accurate word, not the most comfortable one.

UNEXPRESSED APPRECIATION = PERCEIVED INGRATITUDE: If you felt it and didn't say it, the recipient experiences the absence. The threshold for speaking is lower than people think.

PRESENCE PROOF: "I was thinking about you when..." makes love concrete. Abstract affirmations are weaker than presence evidence.

## RELATIONSHIP DETECTION
- SPOUSE: Apply full subtype detection. 7:1 ratio awareness. Presence proof is powerful. Callback power.
- CHILD (under 8): Describe, don't evaluate. One identity word with warmth. Validate magnitude of small feelings. Written notes are powerful.
- TWEEN (8-12): Acknowledge their expertise. Begin identity-level affirmations. 1-2 sentence rule. Ask their opinion first.
- TEEN (13-17): 7:1 ratio critical. Talks UP. DO NOT discuss love language framework. Replace correction with affirmation of progress.
- YOUNG ADULT (18+): Validate their path. Peer-adjacent tone.

DON'T DISCUSS THE FRAMEWORK WITH TEENS: If a teen discovers their love language is being used to influence them, it becomes manipulation in their eyes. Apply knowledge without naming it.

NAGGING vs AFFIRMING: Nagging produces compliance under pressure. Verbal affirmation produces sustained intrinsic motivation. If the user mentions nagging, gently note this.

THE 30-DAY PRACTICE: If you detect repeated compliment patterns, offer: "Have you tried giving [Name] a genuinely different compliment every day for 30 days? It forces observation depth."

## SUGGESTIONS FORMAT
Generate 3-5 affirmations. Each:
- Specific (grounded in something real from context)
- Labeled by subtype (Affection / Praise / Encouragement / Positive Guidance)
- With a brief note explaining why it fits this person
- Written in the user's natural voice

## ETHICS
Teach principles, not authors. Never generic praise. Validation first. Redirect toward real connection.

## FAMILY CONTEXT
${ctx}
`
}

const CRISIS_KEYWORDS = ['suicide', 'kill myself', 'want to die', 'end my life', 'self-harm', 'cutting myself', 'hurting myself', 'being abused', 'abusing me', 'hits me', 'molest', 'eating disorder', 'starving myself', 'purging', 'overdose']
const CRISIS_RESPONSE = `I hear you, and help is available right now.\n\n**988 Suicide & Crisis Lifeline** — Call or text 988 (24/7)\n**Crisis Text Line** — Text HOME to 741741\n**National Domestic Violence Hotline** — 1-800-799-7233\n**Emergency** — Call 911\n\nYou don't have to face this alone.`

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey' } })

  try {
    const { data: { user }, error } = await anonClient.auth.getUser((req.headers.get('Authorization') || '').replace('Bearer ', ''))
    if (error || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

    const { conversation_id, content } = await req.json()
    if (!conversation_id || !content) return new Response(JSON.stringify({ error: 'Missing params' }), { status: 400 })

    const { data: conv } = await supabase.from('lila_conversations').select('*').eq('id', conversation_id).single()
    if (!conv) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })

    if (CRISIS_KEYWORDS.some(k => content.toLowerCase().includes(k))) {
      await supabase.from('lila_messages').insert([{ conversation_id, role: 'user', content, metadata: {} }, { conversation_id, role: 'assistant', content: CRISIS_RESPONSE, metadata: { source: 'crisis_override' } }])
      return new Response(JSON.stringify({ crisis: true, response: CRISIS_RESPONSE }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
    }

    const personIds = conv.guided_mode_reference_id ? [conv.guided_mode_reference_id] : []
    const ctx = await loadRelationshipContext(conv.family_id, conv.member_id, personIds, 'words_affirmation')
    const systemPrompt = buildSystemPrompt(formatRelationshipContextForPrompt(ctx))

    await supabase.from('lila_messages').insert({ conversation_id, role: 'user', content, metadata: {} })
    const { data: history } = await supabase.from('lila_messages').select('role, content').eq('conversation_id', conversation_id).order('created_at', { ascending: true }).limit(30)

    const messages = [{ role: 'system' as const, content: systemPrompt }, ...((history || []) as Array<{ role: string; content: string }>).map(m => ({ role: (m.role === 'system' ? 'assistant' : m.role) as 'user' | 'assistant', content: m.content }))]

    const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://myaimcentral.com', 'X-Title': 'MyAIM Central - Words Affirmation' }, body: JSON.stringify({ model: MODEL, messages, stream: true, max_tokens: 2048 }) })
    if (!aiRes.ok || !aiRes.body) return new Response(JSON.stringify({ error: 'AI service error' }), { status: 502 })

    let full = '', inTok = 0, outTok = 0
    const stream = new ReadableStream({
      async start(controller) {
        const reader = aiRes.body!.getReader(); const dec = new TextDecoder(); let buf = ''
        try {
          while (true) { const { done, value } = await reader.read(); if (done) break; buf += dec.decode(value, { stream: true }); const lines = buf.split('\n'); buf = lines.pop() || ''; for (const line of lines) { if (!line.startsWith('data: ')) continue; const d = line.slice(6).trim(); if (d === '[DONE]') { controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n')); continue }; try { const p = JSON.parse(d); const c = p.choices?.[0]?.delta?.content || ''; if (c) { full += c; controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'chunk', content: c })}\n\n`)) }; if (p.usage) { inTok = p.usage.prompt_tokens || 0; outTok = p.usage.completion_tokens || 0 } } catch { /* skip */ } } }
        } finally {
          await supabase.from('lila_messages').insert({ conversation_id, role: 'assistant', content: full, metadata: { model: MODEL, mode: 'words_affirmation' }, token_count: outTok })
          await supabase.from('lila_conversations').update({ message_count: (history?.length || 0) + 1, model_used: 'sonnet' }).eq('id', conversation_id)
          supabase.from('ai_usage_tracking').insert({ family_id: conv.family_id, member_id: conv.member_id, feature_key: 'lila_words_affirmation', model: MODEL, tokens_used: inTok + outTok, estimated_cost: (inTok * 3.0 + outTok * 15.0) / 1_000_000 }).catch(() => {})
          controller.close()
        }
      },
    })
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'Access-Control-Allow-Origin': '*' } })
  } catch (err) { console.error('Words Affirmation error:', err); return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }) }
})
