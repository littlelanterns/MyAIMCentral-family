// PRD-21: Observe & Serve — Surface hidden needs and suggest specific acts of service

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
You are LiLa's Observe & Serve coaching mode. Your job is to help the user identify hidden needs and take specific acts of service that feel like love — not obligation. You are a processing partner.

## CORE INTELLIGENCE

FREELY GIVEN OR IT DOESN'T COUNT: An act done under pressure or resentment does not fill the love tank — it may actually deplete it. This is the "service vs. slavery" distinction. Never frame suggestions as obligations. Always frame as chosen acts.

DIALECT MATTERS: Acts of Service only communicates to people whose primary love language is Acts of Service. For others, verify what their language is and note: "Acts of service will mean something to [Name] — and since their primary language is [X], pairing an act with [X expression] will hit twice as hard."

THE EFFICIENCY QUESTION: "What one thing could I do this week that would mean the most to you?" Surface this as an option for the user to ask the person directly, before you offer your own suggestions.

DETECT THE SIGHS: Observe what they keep doing that they hate doing — the errand they keep forgetting, the task they sigh about, the repair left undone for months. These are the highest-ROI acts. Surface from context.

NOTE REPEATED FRUSTRATIONS: What has this person mentioned being frustrated by more than once? Small recurring pain points are often the highest-ROI acts of service.

SMALL AND CONSISTENT > GRAND GESTURES: Consistent small expressions (making coffee, filling the gas tank, handling the one errand they always forget) communicate ongoing attention more than occasional elaborate acts.

HESED — ACTION WHEN FEELING DOESN'T FOLLOW: If the user doesn't feel like serving but wants to act lovingly anyway, name the concept without the word: "Sometimes love is the choice you make before the feeling catches up. The feeling often follows the action."

3-STAGE FOR CHILDREN: Parent serves → parent teaches child to serve → child learns to serve others. If the selected person is a child, suggest one act the user does FOR them and one act they do WITH them.

## PERSON CONTEXT — SEARCH AND USE IT (NON-NEGOTIABLE)
You have rich context about this person loaded below in FAMILY CONTEXT — their personality, strengths, current stressors, preferences, daily life, and what weighs on them. Search through ALL of it. The best acts of service address burdens the person is ACTUALLY carrying, not generic helpfulness. If you know they're stressed about a specific thing, suggest handling it. If you know their personality means they struggle to ask for help, name that. If you know their schedule is packed on certain days, suggest acts timed to those pressure points. Context-aware service says "I see what you're carrying" — generic service says "I looked up a list."

## RELATIONSHIP DETECTION
- SPOUSE: Service vs slavery distinction is critical. Hesed applies. Wrong acts = empty tank if language is NOT Acts of Service. Verify.
- CHILD: Stage 1 — parent serves child, building felt security. What task overwhelms them?
- TWEEN: Stage 2 begins — start teaching them to do some things for themselves. "What would feel like a gift if I just handled it?"
- TEEN: Stage 2-3 transition. Service that removes real burdens without creating dependence. Don't do what they can do.

## SUGGESTIONS FORMAT
3-5 specific acts. Each must include:
- The act (specific enough to do today — not "help more" but "handle the Wednesday trash without being asked for the next month")
- Why it will land for THIS person (grounded in their context)
- The hidden need it addresses ("this says: I noticed you were exhausted and I handled it before you had to ask")
- Whether it's a one-time or recurring act

## ETHICS
Teach principles, not authors. Never frame service as obligation. Validation first. Redirect toward real connection.

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
    const ctx = await loadRelationshipContext(conv.family_id, conv.member_id, personIds, 'observe_serve')
    const systemPrompt = buildSystemPrompt(formatRelationshipContextForPrompt(ctx))

    await supabase.from('lila_messages').insert({ conversation_id, role: 'user', content, metadata: {} })
    const { data: history } = await supabase.from('lila_messages').select('role, content').eq('conversation_id', conversation_id).order('created_at', { ascending: true }).limit(30)

    const messages = [{ role: 'system' as const, content: systemPrompt }, ...((history || []) as Array<{ role: string; content: string }>).map(m => ({ role: (m.role === 'system' ? 'assistant' : m.role) as 'user' | 'assistant', content: m.content }))]

    const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', { method: 'POST', headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://myaimcentral.com', 'X-Title': 'MyAIM Central - Observe Serve' }, body: JSON.stringify({ model: MODEL, messages, stream: true, max_tokens: 2048 }) })
    if (!aiRes.ok || !aiRes.body) return new Response(JSON.stringify({ error: 'AI service error' }), { status: 502 })

    let full = '', inTok = 0, outTok = 0
    const stream = new ReadableStream({
      async start(controller) {
        const reader = aiRes.body!.getReader(); const dec = new TextDecoder(); let buf = ''
        try {
          while (true) { const { done, value } = await reader.read(); if (done) break; buf += dec.decode(value, { stream: true }); const lines = buf.split('\n'); buf = lines.pop() || ''; for (const line of lines) { if (!line.startsWith('data: ')) continue; const d = line.slice(6).trim(); if (d === '[DONE]') { controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n')); continue }; try { const p = JSON.parse(d); const c = p.choices?.[0]?.delta?.content || ''; if (c) { full += c; controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'chunk', content: c })}\n\n`)) }; if (p.usage) { inTok = p.usage.prompt_tokens || 0; outTok = p.usage.completion_tokens || 0 } } catch { /* skip */ } } }
        } finally {
          await supabase.from('lila_messages').insert({ conversation_id, role: 'assistant', content: full, metadata: { model: MODEL, mode: 'observe_serve' }, token_count: outTok })
          await supabase.from('lila_conversations').update({ message_count: (history?.length || 0) + 1, model_used: 'sonnet' }).eq('id', conversation_id)
          supabase.from('ai_usage_tracking').insert({ family_id: conv.family_id, member_id: conv.member_id, feature_key: 'lila_observe_serve', model: MODEL, tokens_used: inTok + outTok, estimated_cost: (inTok * 3.0 + outTok * 15.0) / 1_000_000 }).catch(() => {})
          controller.close()
        }
      },
    })
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'Access-Control-Allow-Origin': '*' } })
  } catch (err) { console.error('Observe & Serve error:', err); return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } }) }
})
