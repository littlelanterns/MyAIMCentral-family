// MyAIM Central — AI Parse Edge Function
// Non-streaming utility AI calls: parsing, sorting, classifying, bulk add.
// Used by BulkAddWithAI, family setup, and other features that need
// structured AI output without streaming.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://esm.sh/zod@3.23.8'
import { handleCors, jsonHeaders } from '../_shared/cors.ts'
import { logAICost } from '../_shared/cost-logger.ts'

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
    const body = await req.json()
    const parsed = InputSchema.safeParse(body)
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Missing system_prompt or messages' }), { status: 400, headers: jsonHeaders })
    }
    const { system_prompt, messages, max_tokens, model_tier, family_id, member_id, feature_key } = parsed.data

    const modelId = MODELS[model_tier || 'haiku']

    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://myaimcentral.com',
        'X-Title': 'MyAIM Central',
      },
      body: JSON.stringify({
        model: modelId,
        messages: [{ role: 'system', content: system_prompt }, ...messages],
        max_tokens: max_tokens || 2048,
      }),
    })

    if (!aiResponse.ok) {
      const errText = await aiResponse.text()
      console.error('OpenRouter error:', aiResponse.status, errText)
      return new Response(JSON.stringify({ error: 'AI service error', details: errText }), { status: 502, headers: jsonHeaders })
    }

    const result = await aiResponse.json()
    const content = result.choices?.[0]?.message?.content || ''
    const inputTokens = result.usage?.prompt_tokens || 0
    const outputTokens = result.usage?.completion_tokens || 0

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
