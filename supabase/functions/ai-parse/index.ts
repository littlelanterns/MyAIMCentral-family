// MyAIM Central — AI Parse Edge Function
// Non-streaming utility AI calls: parsing, sorting, classifying, bulk add.
// Used by BulkAddWithAI, family setup, and other features that need
// structured AI output without streaming.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const MODELS = {
  sonnet: 'anthropic/claude-sonnet-4',
  haiku: 'anthropic/claude-haiku-4.5',
} as const

Deno.serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
      },
    })
  }

  try {
    const { system_prompt, messages, max_tokens, model_tier } = await req.json()

    if (!system_prompt || !messages) {
      return new Response(JSON.stringify({ error: 'Missing system_prompt or messages' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const modelId = MODELS[(model_tier as keyof typeof MODELS)] || MODELS.haiku

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
        messages: [
          { role: 'system', content: system_prompt },
          ...messages,
        ],
        max_tokens: max_tokens || 2048,
      }),
    })

    if (!aiResponse.ok) {
      const errText = await aiResponse.text()
      console.error('OpenRouter error:', aiResponse.status, errText)
      return new Response(JSON.stringify({ error: 'AI service error', details: errText }), {
        status: 502,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const result = await aiResponse.json()
    const content = result.choices?.[0]?.message?.content || ''

    // Log usage (fire-and-forget)
    const inputTokens = result.usage?.prompt_tokens || 0
    const outputTokens = result.usage?.completion_tokens || 0

    return new Response(JSON.stringify({ content, input_tokens: inputTokens, output_tokens: outputTokens }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (err) {
    console.error('ai-parse error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})
