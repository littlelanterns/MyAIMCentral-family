// MyAIM Central — AI Parse Edge Function
// Non-streaming utility AI calls: parsing, sorting, classifying, bulk add.
// Used by BulkAddWithAI, family setup, and other features that need
// structured AI output without streaming.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://esm.sh/zod@3.23.8'
import { handleCors, jsonHeaders } from '../_shared/cors.ts'
import { authenticateRequest } from '../_shared/auth.ts'
import { detectCrisis, CRISIS_RESPONSE } from '../_shared/crisis-detection.ts'
import { logAICost } from '../_shared/cost-logger.ts'
import { callOpenRouter } from '../_shared/openrouter-client.ts'
import { buildSafetyPreamble } from '../_shared/safety-preamble.ts'
import { scanUtilityInput, scanUtilityOutput, enqueueOutputScan } from '../_shared/ethics-guard.ts'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const MODELS = {
  sonnet: 'anthropic/claude-sonnet-4',
  haiku: 'anthropic/claude-haiku-4.5',
} as const

const InputSchema = z.object({
  system_prompt: z.string().min(1),
  messages: z.array(z.object({ role: z.string(), content: z.string() })).min(1),
  max_tokens: z.number().optional(),
  model_tier: z.enum(['sonnet', 'haiku']).optional(),
  family_id: z.string().uuid().optional(),
  member_id: z.string().uuid().optional(),
  feature_key: z.string().optional(),
})

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const auth = await authenticateRequest(req)
    if (auth instanceof Response) return auth

    const body = await req.json()
    const parsed = InputSchema.safeParse(body)
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Missing system_prompt or messages' }), { status: 400, headers: jsonHeaders })
    }
    const { system_prompt, messages, max_tokens, model_tier, family_id, member_id, feature_key } = parsed.data

    // Convention #7 — crisis override is global. ai-parse is a generic
    // passthrough used by bulk-add, sorting, and other structured-output
    // call sites; gate every message's content before the model call so a
    // caller-supplied system_prompt can never bypass crisis screening.
    if (messages.some(m => detectCrisis(m.content))) {
      return new Response(
        JSON.stringify({ crisis: true, content: CRISIS_RESPONSE }),
        { headers: jsonHeaders },
      )
    }

    // PRD-41 Tier-0 ethics input pre-flight. ai-parse is the #1 bypass surface
    // — a caller-supplied system_prompt could otherwise route arbitrary text
    // to the model outside every prompt-side safety layer. Scan the concatenated
    // user message content; on a hit, return the reframe (a caller reading
    // `content` gets the gentle redirect instead of parsed output).
    if (family_id && member_id) {
      const combinedInput = messages.map(m => m.content).join('\n')
      const inScan = await scanUtilityInput(supabase, combinedInput, { familyId: family_id, memberId: member_id, surface: 'ai-parse' })
      if (inScan) {
        return new Response(
          JSON.stringify({ ethics_reframe: true, content: inScan.reframe }),
          { headers: jsonHeaders },
        )
      }
    }

    const modelId = MODELS[model_tier || 'haiku']

    // PRD-41 rider: prepend the canonical safety preamble to the caller-supplied
    // system prompt server-side. A caller cannot omit or override the five
    // auto-reject categories + crisis rules — they ride on top of whatever
    // system_prompt the call site passed.
    const guardedSystemPrompt = `${buildSafetyPreamble()}\n\n${system_prompt}`

    const aiResponse = await callOpenRouter(OPENROUTER_API_KEY, {
      model: modelId,
      messages: [{ role: 'system', content: guardedSystemPrompt }, ...messages],
      max_tokens: max_tokens || 2048,
    })

    if (!aiResponse.ok) {
      const errText = await aiResponse.text()
      console.error('OpenRouter error:', aiResponse.status, errText)
      return new Response(JSON.stringify({ error: 'AI service error', details: errText }), { status: 502, headers: jsonHeaders })
    }

    const result = await aiResponse.json()
    let content = result.choices?.[0]?.message?.content || ''
    const inputTokens = result.usage?.prompt_tokens || 0
    const outputTokens = result.usage?.completion_tokens || 0

    // PRD-41 Tier-0 output scan on the parsed result + async Tier-1/2 enqueue.
    // On a hit (enforcing) return a safe structured refusal (empty content)
    // rather than half-parsed ethics-shaped output; shadow mode logs only.
    if (family_id && member_id) {
      const outScan = await scanUtilityOutput(supabase, content, { familyId: family_id, memberId: member_id, surface: 'ai-parse' })
      await enqueueOutputScan(supabase, { familyId: family_id, memberId: member_id, surface: 'ai-parse', content })
      if (outScan.replaced) content = ''
    }

    if (family_id && member_id) {
      logAICost({
        familyId: family_id,
        memberId: member_id,
        featureKey: feature_key || 'ai_parse',
        model: modelId,
        inputTokens,
        outputTokens,
      })
    }

    return new Response(JSON.stringify({ content, input_tokens: inputTokens, output_tokens: outputTokens }), { headers: jsonHeaders })
  } catch (err) {
    console.error('ai-parse error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: jsonHeaders })
  }
})
