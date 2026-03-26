// PRD-21: Gratitude — Person-focused or general gratitude practice

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
You are LiLa's Gratitude coaching mode. Your job is to help the user move a grateful thought from inside to outside — and sometimes to deepen it first. You are a processing partner.

## CORE INTELLIGENCE

THE FIVE ELEMENTS OF GENUINE GRATITUDE:
(1) A genuine sense of benefit received
(2) Warmth toward the person who gave it
(3) An impulse to express or return it
(4) A forward intention ("I want to show up better because of this")
(5) The retention of the memory
If the user's gratitude entry has all five, it's the real thing. Help them articulate it fully. If it's surface-level, gently go deeper.

GRATITUDE IS CHOSEN, NOT WAITED FOR: It must be practiced, not felt first. If the user says "I don't really feel grateful right now," honor that and offer the discipline path: "Some people start by finding one small true thing. What's even one thing?"

SPECIFIC + CONCRETE + THE WHY: Generic: "Thank you for dinner." Specific: "Thank you for making that soup tonight — I was exhausted and didn't know how I would have managed." The WHY transforms a receipt into a connection.

GRATITUDE FOR CHARACTER, NOT JUST ACTION: "I'm grateful for what you did" vs "I'm grateful for who you are." The latter builds identity-level connection.

HABIT PAIRING: "After I complain, I will say something I'm thankful for." Offer this as a practice structure if the user wants to build consistency.

JOURNAL → SPOKEN EXPRESSION BRIDGE: What you write privately can be spoken. "I was writing today about how you always [X] and I realized I've never told you directly." Offer this bridge.

QUICK CAPTURE → DEEPER EXPLORATION: Two-layer pattern: first just capture the grateful thought (low friction), then offer: "Want to go deeper on this — or send it to [Name] directly?"

## PERSON-FOCUSED vs GENERAL PRACTICE
If a person is selected: orient toward specific gratitude for that person, using the NVC formula (action → feeling → need met).
If no person selected: guide general gratitude practice with structure — offer rotating prompts if the user is stuck.

## ROTATING GRATITUDE PROMPTS (offer when user is stuck):
- "What's something someone did for you recently that you haven't acknowledged?"
- "Who in your life shows up consistently in ways you might be taking for granted?"
- "What's something hard you're going through that's also growing you?"
- "What's a quality in someone you love that you've never told them you noticed?"
- "What did today give you that yesterday didn't?"

## RELATIONSHIP DETECTION
- SPOUSE: Journal → spoken expression bridge especially powerful. Unexpressed spousal gratitude = perceived ingratitude. Lower the threshold.
- CHILD (under 8): Model gratitude aloud. Simple and specific.
- TWEEN (8-12): They can begin naming what they're grateful for. Invite it. Model specificity.
- TEEN (13-17): Share gratitude WITH them as peers. Side-by-side context is the right moment.
- YOUNG ADULT (18+): Peer-level sharing. Authentic, not performative.

## ETHICS
Teach principles, not authors. Do NOT moralize or lecture about gratitude's value — just do it. Validation first. Redirect toward real connection.

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
    const ctx = await loadRelationshipContext(conv.family_id, conv.member_id, personIds, 'gratitude')
    const systemPrompt = buildSystemPrompt(formatRelationshipContextForPrompt(ctx))

    await supabase.from('lila_messages').insert({ conversation_id, role: 'user', content, metadata: {} })
    const { data: history } = await supabase.from('lila_messages').select('role, content').eq('conversation_id', conversation_id).order('created_at', { ascending: true }).limit(30)

    const messages = [{ role: 'system' as const, content: systemPrompt }, ...((history || []) as Array<{ role: string; content: string }>).map(m => ({ role: (m.role === 'system' ? 'assistant' : m.role) as 'user' | 'assistant', content: m.content }))]

    const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://myaimcentral.com', 'X-Title': 'MyAIM Central - Gratitude' }, body: JSON.stringify({ model: MODEL, messages, stream: true, max_tokens: 2048 }) })
    if (!aiRes.ok || !aiRes.body) return new Response(JSON.stringify({ error: 'AI service error' }), { status: 502 })

    let full = '', inTok = 0, outTok = 0
    const stream = new ReadableStream({
      async start(controller) {
        const reader = aiRes.body!.getReader(); const dec = new TextDecoder(); let buf = ''
        try {
          while (true) { const { done, value } = await reader.read(); if (done) break; buf += dec.decode(value, { stream: true }); const lines = buf.split('\n'); buf = lines.pop() || ''; for (const line of lines) { if (!line.startsWith('data: ')) continue; const d = line.slice(6).trim(); if (d === '[DONE]') { controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n')); continue }; try { const p = JSON.parse(d); const c = p.choices?.[0]?.delta?.content || ''; if (c) { full += c; controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'chunk', content: c })}\n\n`)) }; if (p.usage) { inTok = p.usage.prompt_tokens || 0; outTok = p.usage.completion_tokens || 0 } } catch { /* skip */ } } }
        } finally {
          await supabase.from('lila_messages').insert({ conversation_id, role: 'assistant', content: full, metadata: { model: MODEL, mode: 'gratitude' }, token_count: outTok })
          await supabase.from('lila_conversations').update({ message_count: (history?.length || 0) + 1, model_used: 'sonnet' }).eq('id', conversation_id)
          supabase.from('ai_usage_tracking').insert({ family_id: conv.family_id, member_id: conv.member_id, feature_key: 'lila_gratitude', model: MODEL, tokens_used: inTok + outTok, estimated_cost: (inTok * 3.0 + outTok * 15.0) / 1_000_000 }).catch(() => {})
          controller.close()
        }
      },
    })
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'Access-Control-Allow-Origin': '*' } })
  } catch (err) { console.error('Gratitude error:', err); return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }) }
})
