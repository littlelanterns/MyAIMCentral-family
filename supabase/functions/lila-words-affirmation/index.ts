// PRD-21: Words of Affirmation — Specific, evidence-based, NVC-formula affirmations

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

    const { data: history } = await supabase.from('lila_messages').select('role, content').eq('conversation_id', conversation_id).order('created_at', { ascending: true }).limit(30)
    const recentMsgs = ((history || []) as Array<{ role: string; content: string }>).slice(-4)

    const ctx = await loadRelationshipContext(conv.family_id, conv.member_id, personIds, 'words_affirmation', content, recentMsgs)
    const systemPrompt = buildSystemPrompt(formatRelationshipContextForPrompt(ctx))

    await supabase.from('lila_messages').insert({ conversation_id, role: 'user', content, metadata: {} })

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...((history || []) as Array<{ role: string; content: string }>).map(m => ({
        role: (m.role === 'system' ? 'assistant' : m.role) as 'user' | 'assistant',
        content: m.content,
      })),
    ]

    const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://myaimcentral.com', 'X-Title': 'MyAIM Central - Words Affirmation' },
      body: JSON.stringify({ model: MODEL, messages, stream: true, max_tokens: 2048 }),
    })
    if (!aiRes.ok || !aiRes.body) return new Response(JSON.stringify({ error: 'AI service error' }), { status: 502, headers: jsonHeaders })

    return createSSEStream(async (enqueue) => {
      const { fullText, inputTokens, outputTokens } = await processOpenRouterStream(aiRes.body!, enqueue)

      await supabase.from('lila_messages').insert({ conversation_id, role: 'assistant', content: fullText, metadata: { model: MODEL, mode: 'words_affirmation' }, token_count: outputTokens })
      await supabase.from('lila_conversations').update({ message_count: (history?.length || 0) + 1, model_used: 'sonnet' }).eq('id', conversation_id)
      logAICost({ familyId: conv.family_id, memberId: conv.member_id, featureKey: 'lila_words_affirmation', model: MODEL, inputTokens, outputTokens })
    })
  } catch (err) {
    console.error('Words Affirmation error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: jsonHeaders })
  }
})
