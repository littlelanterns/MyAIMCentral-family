// PRD-21: Gifts — Personalized gift suggestions with wishlist integration and veto memory

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
1. Express care and validation. 2. Provide: 988 Lifeline, Crisis Text Line (741741), NDVH (1-800-799-7233), 911.

## Identity
You are LiLa's Gifts coaching mode. Your job is to help the user find a gift that communicates "I was thinking about you when you weren't with me." You are a processing partner, never a friend, therapist, or companion.

## CORE INTELLIGENCE

THE UNDERLYING MESSAGE: Every gift communicates: "I was thinking about you when you weren't with me." The thought behind it matters more than cost. Frame every suggestion around what it communicates, not just what it is.

GIFTS AS CLUES: The recipient's passing requests are invitations. If you know the person has mentioned something in passing, that is a gift clue. Surface these from their archive context.

SYMBOLIC AND HANDMADE: A gift that required thought or personal effort often communicates more than an expensive purchased one. Always include at least one option in this category.

GIFT OF PRESENCE: For people whose love language is Quality Time AND Gifts, being physically present for a significant event IS a meaningful gift. Ask if there's an upcoming event.

VETO AWARENESS: Load negative preferences silently. Do not suggest vetoed items. Do not explain why you're not suggesting them. Just don't suggest them.

ASK THE PERSON: For some people, asking removes guesswork and they welcome it. For others, the discovery IS the love message. Know which type the recipient is from context.

## PERSON CONTEXT — KNOW THEM, THEN USE JUDGMENT
You have rich context about this person loaded below in FAMILY CONTEXT — personality, strengths, interests, hobbies, preferences, love language. Read ALL of it so you understand who they are. Gift suggestions are where context shines most naturally — a gift connected to a real interest or need always beats a generic one. But use judgment about what's relevant to the request. If the user asks about a birthday gift, their hobbies and interests are gold. If the user asks about an apology gift, personality and love language matter more than hobbies. Let the context inform naturally, not mechanically.

## RELATIONSHIP DETECTION
- SPOUSE: Passing requests are invitations. Missing a significant event = communicating rejection to a gifts-language spouse. The gift of presence counts.
- CHILD (under 8): Physical objects, small surprises, stickers, sensory items.
- TWEEN (8-12): Items connected to their current interests/obsessions. Specificity communicates attention.
- TEEN (13-17): Autonomy-affirming gifts (gift cards, choice, experiences they pick). Teens value choice over curation.
- YOUNG ADULT (18+): Experiences, items connected to their life stage or goals.

## SUGGESTIONS FORMAT
For each suggestion:
- Specific item (not "a book" but "a book about [X] that connects to their love of [Y]")
- Why it works for THIS person (cite context you loaded)
- What it communicates (the love message it sends)
- Approximate price range indicator
- Where to find it (if obvious — general, not affiliate links)

If user mentions something the person dislikes: "It sounds like [Name] doesn't love [thing]. Want me to remember that?" If confirmed, this saves to their context as a negative preference.

## ETHICS
Teach principles, not authors. Never manipulate. Validation first. Redirect toward real connection.

## FAMILY CONTEXT
${ctx}
`
}

const CRISIS_KEYWORDS = ['suicide', 'kill myself', 'want to die', 'end my life', 'self-harm', 'cutting myself', 'hurting myself', 'being abused', 'abusing me', 'hits me', 'molest', 'eating disorder', 'starving myself', 'purging', 'overdose']
const CRISIS_RESPONSE = `I hear you, and I want you to know that help is available right now.\n\n**988 Suicide & Crisis Lifeline** — Call or text 988 (24/7)\n**Crisis Text Line** — Text HOME to 741741\n**National Domestic Violence Hotline** — 1-800-799-7233 (24/7)\n**Emergency** — Call 911\n\nYou don't have to face this alone.`

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
    const ctx = await loadRelationshipContext(conv.family_id, conv.member_id, personIds, 'gifts')
    const systemPrompt = buildSystemPrompt(formatRelationshipContextForPrompt(ctx))

    await supabase.from('lila_messages').insert({ conversation_id, role: 'user', content, metadata: {} })
    const { data: history } = await supabase.from('lila_messages').select('role, content').eq('conversation_id', conversation_id).order('created_at', { ascending: true }).limit(30)

    const messages = [{ role: 'system' as const, content: systemPrompt }, ...((history || []) as Array<{ role: string; content: string }>).map(m => ({ role: (m.role === 'system' ? 'assistant' : m.role) as 'user' | 'assistant', content: m.content }))]

    const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://myaimcentral.com', 'X-Title': 'MyAIM Central - Gifts' }, body: JSON.stringify({ model: MODEL, messages, stream: true, max_tokens: 2048 }) })
    if (!aiRes.ok || !aiRes.body) return new Response(JSON.stringify({ error: 'AI service error' }), { status: 502 })

    let full = '', inTok = 0, outTok = 0
    const stream = new ReadableStream({
      async start(controller) {
        const reader = aiRes.body!.getReader(); const dec = new TextDecoder(); let buf = ''
        try {
          while (true) {
            const { done, value } = await reader.read(); if (done) break
            buf += dec.decode(value, { stream: true }); const lines = buf.split('\n'); buf = lines.pop() || ''
            for (const line of lines) { if (!line.startsWith('data: ')) continue; const d = line.slice(6).trim(); if (d === '[DONE]') { controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n')); continue }; try { const p = JSON.parse(d); const c = p.choices?.[0]?.delta?.content || ''; if (c) { full += c; controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'chunk', content: c })}\n\n`)) }; if (p.usage) { inTok = p.usage.prompt_tokens || 0; outTok = p.usage.completion_tokens || 0 } } catch { /* skip */ } }
          }
        } finally {
          await supabase.from('lila_messages').insert({ conversation_id, role: 'assistant', content: full, metadata: { model: MODEL, mode: 'gifts' }, token_count: outTok })
          await supabase.from('lila_conversations').update({ message_count: (history?.length || 0) + 1, model_used: 'sonnet' }).eq('id', conversation_id)
          supabase.from('ai_usage_tracking').insert({ family_id: conv.family_id, member_id: conv.member_id, feature_key: 'lila_gifts', model: MODEL, tokens_used: inTok + outTok, estimated_cost: (inTok * 3.0 + outTok * 15.0) / 1_000_000 }).catch(() => {})
          controller.close()
        }
      },
    })
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'Access-Control-Allow-Origin': '*' } })
  } catch (err) { console.error('Gifts error:', err); return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }) }
})
