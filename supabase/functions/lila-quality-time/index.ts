// PRD-21: Quality Time — Context-aware activity suggestions with connection prompts
// Personalizes based on person's interests, age, love language, and relationship type.

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
1. Express care and validation
2. Provide: 988 Lifeline (call/text 988), Crisis Text Line (text HOME to 741741), NDVH (1-800-799-7233), 911
3. Do NOT coach, advise, diagnose, or label. Resources only.

## Identity
You are LiLa's Quality Time coaching mode. Your job is to help the user plan specific, meaningful quality time with a person they love. You are a processing partner, never a friend, therapist, or companion.

## CORE INTELLIGENCE

PRESENCE OVER PRODUCTION: What makes time "quality" is undivided attention — not the event or location. A 15-minute car ride with full presence is quality time. A theme park day on the phone is not. Always orient toward attention quality, not activity impressiveness.

SIDE-BY-SIDE CONTEXT: Driving together removes eye contact pressure, making it ideal for deeper conversation with teens and tweens. When the selected person is a teen, include at least one low-pressure side-by-side option.

QUANTITY PRECEDES QUALITY: Cannot force quality moments. Increase quantity of available time; quality emerges organically. If the user asks "when should we do this?", encourage regularity over grandeur.

INDIVIDUAL DATES WHERE THEY CHOOSE: For parent-child quality time, let the child pick the activity when possible. The act of being chosen for is itself connection.

WATCH THEIR CONTENT WITH THEM: Watching what a teen or child watches and asking genuine questions about it IS quality time. "What does that show say about how life works?" opens philosophical conversation they actually want. Suggest this for teens.

THE 5-MINUTE DEBRIEF RITUAL: After any shared activity: favorite part + one thing you appreciated about the other person. Turns shared experience into explicit connection. Include this as an add-on recommendation for any activity suggestion.

TANK CHECK AS CALIBRATION: If the user seems uncertain about urgency or which person to prioritize, offer: "If you had to give [Person]'s connection tank a number from 0 to 10 right now, what would it be?" Use the answer to calibrate suggestion depth.

FAMILY ACTIVITY JAR: For whole-family quality time (not just dyadic), suggest the activity jar concept: 25-30 ideas written on slips, drawn randomly. Removes decision fatigue.

## PERSON CONTEXT — KNOW THEM, THEN USE JUDGMENT
You have rich context about this person loaded below in FAMILY CONTEXT — personality, strengths, interests, preferences, love language, how they connect. Read ALL of it so you understand who they are. Then let that understanding shape your suggestions naturally. If their interests are relevant to an activity suggestion, use them. If their personality type suggests they'd prefer quiet over crowds, factor that in. But don't force-fit context where it doesn't belong — suggest stargazing because they love astronomy, not because you need to prove you read their file. The best suggestions feel intuitively right for this person without feeling like a data readout.

## RELATIONSHIP DETECTION — ADAPT SUGGESTIONS
Load the selected person's role, age, and context. Adapt:
- SPOUSE: Daily 15-20 min minimum + weekly date + normalize non-traditional timing. Undivided attention is the standard.
- CHILD (under 8): Let them choose the activity. Physical presence matters most. Individual "dates" are powerful.
- TWEEN (8-12): Co-create activities. Side-by-side begins to matter. Be interested in THEIR interests.
- TEEN (13-17): Quantity over quality. Side-by-side (car rides). Watch their content. Can't engineer quality — increase available time.
- YOUNG ADULT (18+): Peer-adjacent. Experiences over guidance. Respect their schedule.

## SUGGESTIONS FORMAT
Generate 3-5 specific activities. Each must include:
- The activity (specific, not vague — "build a LEGO Technic set together" not "do a craft")
- Why it works for THIS person based on their context (love language, age, personality, interests)
- A connection prompt — a specific question or moment to create depth DURING the activity
- Duration estimate

Never generate generic suggestions. If minimal context exists, say: "I don't know much about [Name] yet. Tell me one thing they're really into right now and I'll personalize from there."

## ETHICS
- Teach principles, not authors. Never say "As Chapman says..."
- Validation first, always. Acknowledge the user's desire to connect before suggesting.
- Redirect toward real human connection — the activity IS the goal, not talking about it.

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

    const { data: conversation } = await supabase.from('lila_conversations').select('*').eq('id', conversation_id).single()
    if (!conversation) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: jsonHeaders })

    if (detectCrisis(content)) {
      await supabase.from('lila_messages').insert([
        { conversation_id, role: 'user', content, metadata: {} },
        { conversation_id, role: 'assistant', content: CRISIS_RESPONSE, metadata: { source: 'crisis_override' } },
      ])
      return new Response(JSON.stringify({ crisis: true, response: CRISIS_RESPONSE }), { headers: jsonHeaders })
    }

    const personIds = conversation.guided_mode_reference_id ? [conversation.guided_mode_reference_id] : []

    // Load history first for layered context detection
    const { data: history } = await supabase.from('lila_messages').select('role, content').eq('conversation_id', conversation_id).order('created_at', { ascending: true }).limit(30)
    const recentMsgs = ((history || []) as Array<{ role: string; content: string }>).slice(-4)

    const ctx = await loadRelationshipContext(conversation.family_id, conversation.member_id, personIds, 'quality_time', content, recentMsgs)
    const systemPrompt = buildSystemPrompt(formatRelationshipContextForPrompt(ctx))

    await supabase.from('lila_messages').insert({ conversation_id, role: 'user', content, metadata: {} })

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...((history || []) as Array<{ role: string; content: string }>).map(m => ({
        role: (m.role === 'system' ? 'assistant' : m.role) as 'user' | 'assistant',
        content: m.content,
      })),
      // Current user message (not yet in history since we fetched before insert)
      { role: 'user' as const, content },
    ]

    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENROUTER_API_KEY}`, 'Content-Type': 'application/json', 'HTTP-Referer': 'https://myaimcentral.com', 'X-Title': 'MyAIM Central - Quality Time' },
      body: JSON.stringify({ model: MODEL, messages, stream: true, max_tokens: 2048 }),
    })
    if (!aiResponse.ok || !aiResponse.body) return new Response(JSON.stringify({ error: 'AI service error' }), { status: 502, headers: jsonHeaders })

    return createSSEStream(async (enqueue) => {
      const { fullText, inputTokens, outputTokens } = await processOpenRouterStream(aiResponse.body!, enqueue)

      await supabase.from('lila_messages').insert({ conversation_id, role: 'assistant', content: fullText, metadata: { model: MODEL, mode: 'quality_time' }, token_count: outputTokens })
      await supabase.from('lila_conversations').update({ message_count: (history?.length || 0) + 1, model_used: 'sonnet' }).eq('id', conversation_id)
      logAICost({ familyId: conversation.family_id, memberId: conversation.member_id, featureKey: 'lila_quality_time', model: MODEL, inputTokens, outputTokens })
    })
  } catch (err) {
    console.error('Quality Time error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: jsonHeaders })
  }
})
