// MyAIM Central — Spelling Coach Edge Function (PRD-25 Phase B)
// Generates kid-friendly spelling/grammar coaching explanations via Haiku.
// Writes results back to spelling_coaching_cache table for future lookups.

import { z } from 'https://esm.sh/zod@3.23.8'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1'
import { handleCors, jsonHeaders } from '../_shared/cors.ts'
import { authenticateRequest } from '../_shared/auth.ts'
import { logAICost } from '../_shared/cost-logger.ts'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const MODEL = 'anthropic/claude-haiku-4.5'

const SYSTEM_PROMPT = `You write brief, kid-friendly spelling and grammar explanations for children ages 8-12.

Rules:
- One to two sentences maximum
- Use a memory trick, rhyme, or pattern when possible
- Be encouraging, never condescending
- Focus on WHY the correct spelling is correct, not just what's wrong
- Use concrete examples a kid would understand

Respond with ONLY the explanation text. No quotes, no labels, no preamble.`

const InputSchema = z.object({
  misspelling: z.string().min(1).max(100),
  correction: z.string().min(1).max(100),
  language: z.string().default('en'),
})

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  // Authenticate
  const authResult = await authenticateRequest(req)
  if (authResult instanceof Response) return authResult
  const { user } = authResult

  try {
    const body = await req.json()
    const parsed = InputSchema.safeParse(body)
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: parsed.error.issues }),
        { status: 400, headers: jsonHeaders },
      )
    }

    const { misspelling, correction, language } = parsed.data
    const key = misspelling.toLowerCase()

    // Service-role client for DB writes
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Check if already cached (another request may have filled it)
    const { data: existing } = await supabaseAdmin
      .from('spelling_coaching_cache')
      .select('explanation, usage_count')
      .ilike('misspelling', key)
      .eq('language', language)
      .maybeSingle()

    if (existing) {
      // Increment usage count
      await supabaseAdmin
        .from('spelling_coaching_cache')
        .update({ usage_count: existing.usage_count + 1 })
        .ilike('misspelling', key)
        .eq('language', language)

      return new Response(
        JSON.stringify({ explanation: existing.explanation, cached: true }),
        { headers: jsonHeaders },
      )
    }

    // Generate via Haiku
    const userMessage = `The child misspelled "${misspelling}" — the correct word is "${correction}". Write a brief teaching explanation.`

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
        max_tokens: 150,
      }),
    })

    if (!aiResponse.ok) {
      const errText = await aiResponse.text()
      console.error('OpenRouter error:', aiResponse.status, errText)
      return new Response(
        JSON.stringify({ error: 'AI service error', details: errText }),
        { status: 502, headers: jsonHeaders },
      )
    }

    const result = await aiResponse.json()
    const explanation = (result.choices?.[0]?.message?.content || '').trim()
    const inputTokens = result.usage?.prompt_tokens || 0
    const outputTokens = result.usage?.completion_tokens || 0

    if (!explanation) {
      return new Response(
        JSON.stringify({ error: 'No explanation generated' }),
        { status: 500, headers: jsonHeaders },
      )
    }

    // Write back to cache (upsert — if another concurrent request won, just update)
    await supabaseAdmin
      .from('spelling_coaching_cache')
      .upsert(
        {
          misspelling: key,
          correction,
          explanation,
          source: 'ai_generated',
          language,
          usage_count: 1,
        },
        { onConflict: 'lower(misspelling),language', ignoreDuplicates: false },
      )
      .then(() => {})
      .catch((err: unknown) => {
        // Non-critical — the explanation was already generated
        console.warn('Cache write-back failed:', err)
      })

    // Log cost (fire-and-forget) — resolve user to family/member
    const { data: memberRow } = await supabaseAdmin
      .from('family_members')
      .select('id, family_id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (memberRow) {
      logAICost({
        familyId: memberRow.family_id,
        memberId: memberRow.id,
        featureKey: 'spelling_coach',
        model: MODEL,
        inputTokens,
        outputTokens,
      })
    }

    return new Response(
      JSON.stringify({ explanation, cached: false }),
      { headers: jsonHeaders },
    )
  } catch (err) {
    console.error('spelling-coach error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: jsonHeaders },
    )
  }
})
