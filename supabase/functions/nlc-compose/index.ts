// MyAIM Central — nlc-compose Edge Function
// STUDIO-EXPERIENCE ST-B, Convention 253 (Natural Language Composition)
//
// Category-2 native utility (own dedicated Edge Function, NOT registered in
// lila_guided_modes — Convention #248). One job: given mom's free-text
// description of what she wants to create, identify which Studio wizard
// best matches and extract whatever pre-fillable fields the description
// actually contains. Never persists anything — the client always opens the
// matched wizard for mom's own review before any record is created
// (Convention #4/#253 — Haiku never auto-assigns, auto-activates, or
// auto-includes anything; it only proposes a starting point).
//
// Full SAFETY-BETA-GATE scaffold, mirrored from recipe-extract:
// authenticateRequest, detectCrisis on the free-text input, buildSafetyPreamble
// on the system prompt, shared no-training OpenRouter client, PRD-41
// ethics-guard input/output scan, cost logging, and json-extract.ts for
// tolerant JSON parsing (never a bare fence-strip regex — see that file's
// header for why).

import { z } from 'https://esm.sh/zod@3.23.8'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors, jsonHeaders } from '../_shared/cors.ts'
import { authenticateRequest } from '../_shared/auth.ts'
import { detectCrisis, CRISIS_RESPONSE } from '../_shared/crisis-detection.ts'
import { buildSafetyPreamble } from '../_shared/safety-preamble.ts'
import { logAICost } from '../_shared/cost-logger.ts'
import { callOpenRouter } from '../_shared/openrouter-client.ts'
import { scanUtilityInput, scanUtilityOutput, enqueueOutputScan } from '../_shared/ethics-guard.ts'
import { extractJsonObject } from '../_shared/json-extract.ts'
import { NLC_WIZARD_TYPES, buildNLCSystemPrompt } from '../_shared/nlc-router-prompt.ts'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const MODEL = 'anthropic/claude-haiku-4.5'
const SURFACE = 'nlc-compose'

// ============================================================
// The full creation catalog + system prompt live in the zero-import
// _shared/nlc-router-prompt.ts module so the router and its live-model
// vitest pin (tests/nlc-router.test.ts) can never drift onto two different
// prompts. A `none_confident` outcome (never a hard failure) is what mom
// sees when nothing fits, per Composition doc §2.9's fallback contract.
// ============================================================

const NLCOutputSchema = z.object({
  wizardType: z.enum(NLC_WIZARD_TYPES),
  confidence: z.enum(['high', 'medium', 'low']),
  description: z.string(),
  preFill: z.record(z.unknown()).optional(),
})

const InputSchema = z.object({
  text: z.string().min(1).max(2000),
  familyMemberNames: z.array(z.string()).max(30).optional(),
  family_id: z.string().uuid().optional(),
  member_id: z.string().uuid().optional(),
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
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: parsed.error.issues }),
        { status: 400, headers: jsonHeaders },
      )
    }

    const { text, familyMemberNames, family_id, member_id } = parsed.data

    // Convention #7 — crisis override is global, checked before any model call.
    if (detectCrisis(text)) {
      return new Response(JSON.stringify({ crisis: true, response: CRISIS_RESPONSE }), { headers: jsonHeaders })
    }

    // PRD-41 Tier-0 ethics input pre-flight (utility surface).
    if (family_id && member_id) {
      const inBlock = await scanUtilityInput(supabase, text, { familyId: family_id, memberId: member_id, surface: SURFACE })
      if (inBlock) {
        return new Response(JSON.stringify({ error: inBlock.reframe }), { headers: jsonHeaders })
      }
    }

    const systemPrompt = `${buildSafetyPreamble()}\n\n${buildNLCSystemPrompt(familyMemberNames ?? [])}`

    const aiResponse = await callOpenRouter(OPENROUTER_API_KEY, {
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: text },
      ],
      max_tokens: 1024,
      // Routing + field extraction is a deterministic-by-intent operation:
      // the same description must reach the same wizard with the same
      // extracted fields every time, or a regression pin can never hold.
      // Matches the platform convention for every other extraction /
      // classification function (calendar-extract, validate-ai-output,
      // safety-classify's classifier path, the board-of-directors gates).
      // Without it the router ran at the model default and re-decided
      // borderline extractions run-to-run — a phrase naming two plausible
      // titles ("chore board ... extra jobs") returned either one.
      temperature: 0,
    })

    if (!aiResponse.ok) {
      const errText = await aiResponse.text()
      console.error('nlc-compose OpenRouter error:', aiResponse.status, errText)
      return new Response(JSON.stringify({ error: 'AI service error' }), { status: 502, headers: jsonHeaders })
    }

    const result = await aiResponse.json()
    const content = (result.choices?.[0]?.message?.content || '').trim()
    const inputTokens = result.usage?.prompt_tokens || 0
    const outputTokens = result.usage?.completion_tokens || 0

    if (family_id && member_id) {
      const outScan = await scanUtilityOutput(supabase, content, { familyId: family_id, memberId: member_id, surface: SURFACE })
      await enqueueOutputScan(supabase, { familyId: family_id, memberId: member_id, surface: SURFACE, content })
      if (outScan.replaced) {
        return new Response(JSON.stringify({ error: "I couldn't work with that safely. Try describing it differently?" }), { headers: jsonHeaders })
      }
    }

    const jsonText = extractJsonObject(content)
    if (!jsonText) {
      console.error('nlc-compose failed to locate a JSON object in AI response:', content)
      return new Response(JSON.stringify({ error: 'Failed to parse AI response' }), { status: 502, headers: jsonHeaders })
    }

    let parsedOutput: unknown
    try {
      parsedOutput = JSON.parse(jsonText)
    } catch {
      console.error('nlc-compose failed to JSON.parse AI response:', jsonText)
      return new Response(JSON.stringify({ error: 'Failed to parse AI response' }), { status: 502, headers: jsonHeaders })
    }

    const validation = NLCOutputSchema.safeParse(parsedOutput)
    if (!validation.success) {
      console.error('nlc-compose AI output failed schema validation:', validation.error.issues)
      return new Response(JSON.stringify({ error: 'AI response did not match expected schema', details: validation.error.issues }), { status: 502, headers: jsonHeaders })
    }

    if (family_id && member_id) {
      logAICost({ familyId: family_id, memberId: member_id, featureKey: 'nlc_compose', model: MODEL, inputTokens, outputTokens })
    }

    return new Response(JSON.stringify({ result: validation.data }), { headers: jsonHeaders })
  } catch (err) {
    console.error('nlc-compose error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: jsonHeaders })
  }
})
