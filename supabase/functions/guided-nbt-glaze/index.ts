// MyAIM Central — Guided NBT Glaze Edge Function
// Non-streaming utility AI call for PRD-25 Guided Dashboard.
// Generates a single encouraging sentence (10-20 words) for a child's
// "Next Best Thing" suggestion card.

import { z } from 'https://esm.sh/zod@3.23.8'
import { handleCors, jsonHeaders } from '../_shared/cors.ts'
import { logAICost } from '../_shared/cost-logger.ts'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!

const MODEL = 'anthropic/claude-haiku-4.5'

const SYSTEM_PROMPT = `You generate one encouraging sentence (10-20 words) for a child's dashboard.
Connect the suggestion to the context provided. Be warm, specific, and brief.
Never be generic ("Great job!" is forbidden). Always connect to something concrete.
Examples:
- "Math first thing — you've done 12 days in a row!"
- "Reading time! Pick up where you left off yesterday."
- "Dinner prep is worth 15 stars — the biggest reward today!"
Respond with ONLY the sentence. No quotes, no explanation.`

const InputSchema = z.object({
  taskTitle: z.string().min(1),
  timeOfDay: z.enum(['morning', 'afternoon', 'evening']),
  memberName: z.string().min(1),
  streakCount: z.number(),
  currencyName: z.string().optional(),
  suggestionType: z.string().min(1),
  pointValue: z.number().optional(),
  family_id: z.string().uuid().optional(),
  member_id: z.string().uuid().optional(),
})

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const body = await req.json()
    const parsed = InputSchema.safeParse(body)
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: parsed.error.issues }), { status: 400, headers: jsonHeaders })
    }
    const { taskTitle, timeOfDay, memberName, streakCount, currencyName, suggestionType, pointValue, family_id, member_id } = parsed.data

    const userMessage = [
      `Task: ${taskTitle}`,
      `Type: ${suggestionType}`,
      `Child's name: ${memberName}`,
      `Time of day: ${timeOfDay}`,
      `Current streak: ${streakCount} days`,
      currencyName ? `Currency name: ${currencyName}` : null,
      pointValue != null ? `Point value: ${pointValue} ${currencyName || 'points'}` : null,
    ].filter(Boolean).join('\n')

    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://myaimcentral.com',
        'X-Title': 'MyAIM Central',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 100,
      }),
    })

    if (!aiResponse.ok) {
      const errText = await aiResponse.text()
      console.error('OpenRouter error:', aiResponse.status, errText)
      return new Response(JSON.stringify({ error: 'AI service error', details: errText }), { status: 502, headers: jsonHeaders })
    }

    const result = await aiResponse.json()
    const glazeText = (result.choices?.[0]?.message?.content || '').trim()
    const inputTokens = result.usage?.prompt_tokens || 0
    const outputTokens = result.usage?.completion_tokens || 0

    if (family_id && member_id) {
      logAICost({
        familyId: family_id,
        memberId: member_id,
        featureKey: 'guided_nbt_glaze',
        model: MODEL,
        inputTokens,
        outputTokens,
      })
    }

    return new Response(JSON.stringify({ glazeText }), { headers: jsonHeaders })
  } catch (err) {
    console.error('guided-nbt-glaze error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: jsonHeaders })
  }
})
