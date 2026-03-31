// PRD-21: Observe & Serve — Surface hidden needs and suggest specific acts of service

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://esm.sh/zod@3.23.8'
import { handleCors, jsonHeaders } from '../_shared/cors.ts'
import { authenticateRequest } from '../_shared/auth.ts'
import { detectCrisis, CRISIS_RESPONSE } from '../_shared/crisis-detection.ts'
import { createSSEStream, processOpenRouterStream } from '../_shared/streaming.ts'
import { logAICost } from '../_shared/cost-logger.ts'
import { loadRelationshipContext, formatRelationshipContextForPrompt } from '../_shared/relationship-context.ts'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const MODEL = 'anthropic/claude-sonnet-4'

const InputSchema = z.object({
  conversation_id: z.string().uuid(),
  content: z.string().min(1),
})

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

## PERSON CONTEXT — KNOW THEM, THEN USE JUDGMENT
You have rich context about this person loaded below in FAMILY CONTEXT — personality, strengths, stressors, preferences, daily life. Read ALL of it so you understand what they carry. Acts of service is where context matters most practically — the best service addresses burdens the person is ACTUALLY dealing with, not generic helpfulness. If you know something specific weighing on them, suggest handling it. If their personality means they won't ask for help, factor that in. But keep it natural — suggest what genuinely helps, don't list everything you know about them.

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

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const auth = await authenticateRequest(req)
    if (auth instanceof Response) return auth

    const body = await req.json()
    const parsed = InputSchema.safeParse(body)
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Missing params' }), { status: 400, headers: jsonHeaders })
    }
    const { conversation_id, content } = parsed.data

    const { data: conv } = await supabase.from('lila_conversations').select('*').eq('id', conversation_id).single()
    if (!conv) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: jsonHeaders })

    if (detectCrisis(content)) {
      await supabase.from('lila_messages').insert([
        { conversation_id, role: 'user', content, metadata: {} },
        { conversation_id, role: 'assistant', content: CRISIS_RESPONSE, metadata: { source: 'crisis_override' } },
      ])
      return new Response(JSON.stringify({ crisis: true, response: CRISIS_RESPONSE }), { headers: jsonHeaders })
    }

    const personIds = conv.guided_mode_reference_id ? [conv.guided_mode_reference_id] : []
    const ctx = await loadRelationshipContext(conv.family_id, conv.member_id, personIds, 'observe_serve')
    const systemPrompt = buildSystemPrompt(formatRelationshipContextForPrompt(ctx))

    await supabase.from('lila_messages').insert({ conversation_id, role: 'user', content, metadata: {} })
    const { data: history } = await supabase.from('lila_messages').select('role, content').eq('conversation_id', conversation_id).order('created_at', { ascending: true }).limit(30)

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...((history || []) as Array<{ role: string; content: string }>).map(m => ({
        role: (m.role === 'system' ? 'assistant' : m.role) as 'user' | 'assistant',
        content: m.content,
      })),
    ]

    const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://myaimcentral.com', 'X-Title': 'MyAIM Central - Observe Serve' },
      body: JSON.stringify({ model: MODEL, messages, stream: true, max_tokens: 2048 }),
    })
    if (!aiRes.ok || !aiRes.body) return new Response(JSON.stringify({ error: 'AI service error' }), { status: 502, headers: jsonHeaders })

    return createSSEStream(async (enqueue) => {
      const { fullText, inputTokens, outputTokens } = await processOpenRouterStream(aiRes.body!, enqueue)

      await supabase.from('lila_messages').insert({ conversation_id, role: 'assistant', content: fullText, metadata: { model: MODEL, mode: 'observe_serve' }, token_count: outputTokens })
      await supabase.from('lila_conversations').update({ message_count: (history?.length || 0) + 1, model_used: 'sonnet' }).eq('id', conversation_id)
      logAICost({ familyId: conv.family_id, memberId: conv.member_id, featureKey: 'lila_observe_serve', model: MODEL, inputTokens, outputTokens })
    })
  } catch (err) {
    console.error('Observe & Serve error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: jsonHeaders })
  }
})
