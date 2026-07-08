// MyAIM Central — recipe-extract Edge Function
// PRD-42 KitchenCompass, Phase A, Slice A2
//
// Category-2 native utility (own dedicated Edge Function, NOT registered in
// lila_guided_modes — Convention #248). Modes: link, photo, paste, went_well,
// scale_assist. Every mode returns a structured proposal only — nothing
// persists to `recipes` until the client-side HITM review card is Approved
// (Convention #4). Full SAFETY-BETA-GATE scaffold: authenticateRequest,
// detectCrisis on all free-text input, buildSafetyPreamble on the prompt,
// shared no-training OpenRouter client, PRD-41 ethics-guard input/output
// scan, cost logging.

import { z } from 'https://esm.sh/zod@3.23.8'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors, jsonHeaders } from '../_shared/cors.ts'
import { authenticateRequest } from '../_shared/auth.ts'
import { detectCrisis, CRISIS_RESPONSE } from '../_shared/crisis-detection.ts'
import { buildSafetyPreamble } from '../_shared/safety-preamble.ts'
import { logAICost } from '../_shared/cost-logger.ts'
import { callOpenRouter } from '../_shared/openrouter-client.ts'
import { scanUtilityInput, scanUtilityOutput, enqueueOutputScan } from '../_shared/ethics-guard.ts'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const MODEL = 'anthropic/claude-haiku-4.5'

// ============================================================
// Schemas
// ============================================================

const IngredientSchema = z.object({
  text: z.string(),
  quantity: z.number().nullable().optional(),
  unit: z.string().nullable().optional(),
  item: z.string(),
  store_category: z.string().nullable().optional(),
  optional: z.boolean().optional(),
  scaling_note: z.string().nullable().optional(),
})

const InstructionStepSchema = z.object({
  step: z.number(),
  text: z.string(),
})

const RecipeExtractOutputSchema = z.object({
  title: z.string(),
  description: z.string().nullable().optional(),
  ingredients: z.array(IngredientSchema),
  instructions: z.array(InstructionStepSchema),
  prep_minutes: z.number().nullable().optional(),
  cook_minutes: z.number().nullable().optional(),
  total_minutes: z.number().nullable().optional(),
  servings_base: z.number().nullable().optional(),
  effort_level: z.enum(['quick', 'standard', 'project']).nullable().optional(),
  equipment_tags: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  low_confidence_fields: z.array(z.string()).optional(),
})

const ScaleAssistOutputSchema = z.object({
  ingredients: z.array(IngredientSchema),
})

const InputSchema = z.object({
  mode: z.enum(['link', 'photo', 'paste', 'went_well', 'scale_assist']),
  url: z.string().url().optional(),
  text: z.string().max(20_000).optional(),
  photo_base64: z.array(z.string()).max(6).optional(),
  photo_mime_type: z.string().optional(),
  went_well_description: z.string().max(4000).optional(),
  ingredients: z.array(IngredientSchema).optional(),
  scale_factor: z.number().positive().optional(),
  family_id: z.string().uuid().optional(),
  member_id: z.string().uuid().optional(),
})

// ============================================================
// Extraction system prompt (shared across link/photo/paste/went_well)
// ============================================================

const EXTRACTION_INSTRUCTIONS = `You are a recipe extraction assistant for a family meal-planning app. You receive a recipe (from a pasted webpage, a photo of a recipe card or handwritten note, pasted text, or a description of a meal someone made from memory) and structure it into a clean recipe.

RULES:

1. EXTRACT what is actually present. Do not invent ingredients, quantities, or steps that were not given.
2. For "went well" descriptions (a parent describing what they made from memory, often loosely): preserve the person's own words and structure as closely as possible. Loose is fine — do not tighten it into a polished recipe-card voice they didn't use. If quantities are vague ("a splash of oil", "some garlic"), keep them vague — do NOT invent precise measurements.
3. Ingredients: split each ingredient line into { text (the original line), quantity, unit, item, store_category, optional, scaling_note }. store_category should be a grocery-store aisle/section guess (produce, dairy, meat, pantry, frozen, bakery, household, other) to help with the shopping-list handoff — best guess, never blocking.
4. scaling_note: fill this ONLY for ingredients that resist simple multiplication (e.g. "1 egg", "1 can", "salt to taste", "a pinch"). Leave null for anything that scales cleanly by multiplying the quantity (e.g. "2 cups flour").
5. Instructions: number sequentially starting at 1. Keep each step's original wording where reasonable — do not rewrite technique_flavor.
6. Infer prep_minutes / cook_minutes / total_minutes / servings_base only when stated or clearly implied; otherwise null. Never guess a specific number with false confidence — leave null instead.
7. effort_level: "quick" (≤30 min, few steps), "standard" (typical weeknight complexity), or "project" (long/multi-stage/special-occasion). Infer from time + step count + equipment; null if you truly cannot tell.
8. equipment_tags: any of slow_cooker, instant_pot, oven, no_cook, grill, stovetop, air_fryer — only what's actually used.
9. tags: cuisine or meal-type free tags (e.g. "italian", "one_pot", "freezer_friendly") — only obvious ones, do not overreach.
10. low_confidence_fields: list the field names you are genuinely unsure about (e.g. ["servings_base","total_minutes"]) so the reviewer can double-check them. Empty array if confident throughout.
11. NEVER include diet-culture language, calorie counts, or macro numbers anywhere in your output, even if the source text has them — omit them, do not summarize them.
12. NEVER use emoji anywhere in your output.
13. If the source material does not look like a recipe at all (e.g. a random webpage with no food content, or an unreadable photo), return a title of "Unrecognized" with empty ingredients and instructions arrays, and put "not_a_recipe" in low_confidence_fields.

Respond with ONLY a valid JSON object matching this shape. No markdown, no code fences, no explanation outside the JSON.

{
  "title": "string",
  "description": "string or null",
  "ingredients": [{ "text": "string", "quantity": number|null, "unit": "string|null", "item": "string", "store_category": "string|null", "optional": false, "scaling_note": "string|null" }],
  "instructions": [{ "step": 1, "text": "string" }],
  "prep_minutes": number|null,
  "cook_minutes": number|null,
  "total_minutes": number|null,
  "servings_base": number|null,
  "effort_level": "quick"|"standard"|"project"|null,
  "equipment_tags": ["string"],
  "tags": ["string"],
  "low_confidence_fields": ["string"]
}`

const SCALE_ASSIST_INSTRUCTIONS = `You help scale awkward recipe ingredient quantities that cannot be cleanly multiplied. You receive a list of ingredients (already scaled where the math was simple) and a scale factor. For each ingredient that has a scaling_note (meaning simple multiplication didn't work — things like "1 egg", "1 can", "salt to taste", "a pinch"), propose a sensible scaled version and CLEAR the scaling_note once resolved. Ingredients WITHOUT a scaling_note should be returned completely unchanged (do not touch their quantity).

Never invent a false-precision number for genuinely to-taste items ("salt to taste" stays "salt to taste" at any scale — do not turn it into a gram measurement). For discrete items like eggs or cans, propose a sensible rounded range when the scaled amount isn't a clean whole number (e.g. scaling 1 egg by 1.5 → "1-2 eggs").

Respond with ONLY a valid JSON object: { "ingredients": [ ...same shape as input... ] }. No markdown, no explanation.`

type ContentPart = { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } }

// Minimal SSRF guard for link mode — reject non-http(s) schemes and obvious
// local/private targets. Best-effort (no DNS resolution check), matching the
// low-risk profile of a mom-supplied recipe URL, not a general-purpose fetch
// proxy.
function isSafeExternalUrl(raw: string): boolean {
  try {
    const u = new URL(raw)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') return false
    const host = u.hostname.toLowerCase()
    if (host === 'localhost' || host === '0.0.0.0' || host.endsWith('.local')) return false
    if (/^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host)) return false
    if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(host)) return false
    if (host === '::1' || host.startsWith('fc') || host.startsWith('fd')) return false
    return true
  } catch {
    return false
  }
}

function stripHtmlToReadableText(html: string): string {
  // Best-effort readability strip — drop script/style/nav/footer blocks and
  // tags, collapse whitespace. Not a full readability algorithm, but this is
  // a Haiku extraction target, not a rendering target — noisy surrounding
  // markup costs tokens, not correctness, as long as the recipe text itself
  // survives (which it does, since we only strip tag markup, not content).
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
    .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 30_000)
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
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: parsed.error.issues }),
        { status: 400, headers: jsonHeaders },
      )
    }

    const {
      mode, url, text, photo_base64, photo_mime_type, went_well_description,
      ingredients, scale_factor, family_id, member_id,
    } = parsed.data

    const surface = `recipe-extract:${mode}`

    // ---- scale_assist: small, separate path ----
    if (mode === 'scale_assist') {
      if (!ingredients || !scale_factor) {
        return new Response(JSON.stringify({ error: 'ingredients and scale_factor are required for scale_assist' }), { status: 400, headers: jsonHeaders })
      }

      const userMessage = `Scale factor: ${scale_factor}x\n\nIngredients:\n${JSON.stringify(ingredients, null, 2)}`

      if (family_id && member_id) {
        const inBlock = await scanUtilityInput(supabase, userMessage, { familyId: family_id, memberId: member_id, surface })
        if (inBlock) {
          return new Response(JSON.stringify({ error: inBlock.reframe }), { headers: jsonHeaders })
        }
      }

      const systemPrompt = `${buildSafetyPreamble()}\n\n${SCALE_ASSIST_INSTRUCTIONS}`
      const aiResponse = await callOpenRouter(OPENROUTER_API_KEY, {
        model: MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 2048,
      })

      if (!aiResponse.ok) {
        const errText = await aiResponse.text()
        console.error('recipe-extract scale_assist OpenRouter error:', aiResponse.status, errText)
        return new Response(JSON.stringify({ error: 'AI service error' }), { status: 502, headers: jsonHeaders })
      }

      const result = await aiResponse.json()
      const content = (result.choices?.[0]?.message?.content || '').trim()
      const inputTokens = result.usage?.prompt_tokens || 0
      const outputTokens = result.usage?.completion_tokens || 0

      if (family_id && member_id) {
        const outScan = await scanUtilityOutput(supabase, content, { familyId: family_id, memberId: member_id, surface })
        await enqueueOutputScan(supabase, { familyId: family_id, memberId: member_id, surface, content })
        if (outScan.replaced) {
          return new Response(JSON.stringify({ error: "I couldn't scale those safely. Try adjusting them by hand." }), { headers: jsonHeaders })
        }
      }

      let parsedOutput: unknown
      try {
        const cleaned = content.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
        parsedOutput = JSON.parse(cleaned)
      } catch {
        return new Response(JSON.stringify({ error: 'Failed to parse AI response' }), { status: 502, headers: jsonHeaders })
      }

      const validation = ScaleAssistOutputSchema.safeParse(parsedOutput)
      if (!validation.success) {
        return new Response(JSON.stringify({ error: 'AI response did not match expected schema', details: validation.error.issues }), { status: 502, headers: jsonHeaders })
      }

      if (family_id && member_id) {
        logAICost({ familyId: family_id, memberId: member_id, featureKey: 'recipe_extract', model: MODEL, inputTokens, outputTokens })
      }

      return new Response(JSON.stringify({ result: { ingredients: validation.data.ingredients } }), { headers: jsonHeaders })
    }

    // ---- link / photo / paste / went_well: full extraction ----

    let userContent: string | ContentPart[]
    let crisisCheckText = ''

    if (mode === 'link') {
      if (!url) {
        return new Response(JSON.stringify({ error: 'url is required for link mode' }), { status: 400, headers: jsonHeaders })
      }
      if (!isSafeExternalUrl(url)) {
        return new Response(JSON.stringify({ error: "That link isn't one I can fetch. Copy the recipe text and paste it instead?" }), { headers: jsonHeaders })
      }
      let pageText: string
      try {
        const fetched = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MyAIMCentral-RecipeBot/1.0)' } })
        if (!fetched.ok) {
          return new Response(JSON.stringify({ error: "That site wouldn't share. Copy the recipe text and paste it instead?" }), { headers: jsonHeaders })
        }
        const html = await fetched.text()
        pageText = stripHtmlToReadableText(html)
      } catch (err) {
        console.error('recipe-extract link fetch failed:', err)
        return new Response(JSON.stringify({ error: "That site wouldn't share. Copy the recipe text and paste it instead?" }), { headers: jsonHeaders })
      }
      crisisCheckText = pageText
      userContent = `Source URL: ${url}\n\nPage content:\n---\n${pageText}\n---`
    } else if (mode === 'photo') {
      if (!photo_base64 || photo_base64.length === 0) {
        return new Response(JSON.stringify({ error: 'photo_base64 is required for photo mode' }), { status: 400, headers: jsonHeaders })
      }
      const mimeType = photo_mime_type || 'image/jpeg'
      const parts: ContentPart[] = photo_base64.map((b64) => ({
        type: 'image_url',
        image_url: { url: b64.startsWith('data:') ? b64 : `data:${mimeType};base64,${b64}` },
      }))
      parts.push({ type: 'text', text: 'Extract the recipe shown in the photo(s) above (they may be the front and back of a recipe card, or multiple pages).' })
      userContent = parts
      crisisCheckText = '' // no free-text to scan; the model output itself is scanned below
    } else if (mode === 'paste') {
      if (!text) {
        return new Response(JSON.stringify({ error: 'text is required for paste mode' }), { status: 400, headers: jsonHeaders })
      }
      crisisCheckText = text
      userContent = `Pasted recipe text:\n---\n${text}\n---`
    } else {
      // went_well
      if (!went_well_description) {
        return new Response(JSON.stringify({ error: 'went_well_description is required for went_well mode' }), { status: 400, headers: jsonHeaders })
      }
      crisisCheckText = went_well_description
      const parts: ContentPart[] = []
      if (photo_base64 && photo_base64.length > 0) {
        const mimeType = photo_mime_type || 'image/jpeg'
        for (const b64 of photo_base64) {
          parts.push({ type: 'image_url', image_url: { url: b64.startsWith('data:') ? b64 : `data:${mimeType};base64,${b64}` } })
        }
      }
      parts.push({
        type: 'text',
        text: `This is a "this went well" capture — the person is describing, in their own words and possibly loosely, what they made. Preserve their voice per rule 2. Description:\n---\n${went_well_description}\n---`,
      })
      userContent = parts
    }

    // Convention #7 — crisis override is global, checked before any model call.
    if (crisisCheckText && detectCrisis(crisisCheckText)) {
      return new Response(JSON.stringify({ crisis: true, response: CRISIS_RESPONSE }), { headers: jsonHeaders })
    }

    // PRD-41 Tier-0 ethics input pre-flight (utility surface).
    if (family_id && member_id && crisisCheckText) {
      const inBlock = await scanUtilityInput(supabase, crisisCheckText, { familyId: family_id, memberId: member_id, surface })
      if (inBlock) {
        return new Response(JSON.stringify({ error: inBlock.reframe }), { headers: jsonHeaders })
      }
    }

    const systemPrompt = `${buildSafetyPreamble()}\n\n${EXTRACTION_INSTRUCTIONS}`

    const aiResponse = await callOpenRouter(OPENROUTER_API_KEY, {
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userContent },
      ],
      max_tokens: 4096,
    })

    if (!aiResponse.ok) {
      const errText = await aiResponse.text()
      console.error('recipe-extract OpenRouter error:', aiResponse.status, errText)
      return new Response(JSON.stringify({ error: 'AI service error' }), { status: 502, headers: jsonHeaders })
    }

    const result = await aiResponse.json()
    const content = (result.choices?.[0]?.message?.content || '').trim()
    const inputTokens = result.usage?.prompt_tokens || 0
    const outputTokens = result.usage?.completion_tokens || 0

    if (family_id && member_id) {
      const outScan = await scanUtilityOutput(supabase, content, { familyId: family_id, memberId: member_id, surface })
      await enqueueOutputScan(supabase, { familyId: family_id, memberId: member_id, surface, content })
      if (outScan.replaced) {
        return new Response(JSON.stringify({ error: "I couldn't extract that safely. Want to try a different source?" }), { headers: jsonHeaders })
      }
    }

    let parsedOutput: unknown
    try {
      const cleaned = content.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
      parsedOutput = JSON.parse(cleaned)
    } catch {
      console.error('recipe-extract failed to parse AI JSON response:', content)
      return new Response(JSON.stringify({ error: 'Failed to parse AI response' }), { status: 502, headers: jsonHeaders })
    }

    const validation = RecipeExtractOutputSchema.safeParse(parsedOutput)
    if (!validation.success) {
      console.error('recipe-extract AI output failed schema validation:', validation.error.issues)
      return new Response(JSON.stringify({ error: 'AI response did not match expected schema', details: validation.error.issues }), { status: 502, headers: jsonHeaders })
    }

    if (family_id && member_id) {
      logAICost({ familyId: family_id, memberId: member_id, featureKey: 'recipe_extract', model: MODEL, inputTokens, outputTokens })
    }

    const data = validation.data
    const isNotARecipe = (data.low_confidence_fields ?? []).includes('not_a_recipe')

    return new Response(
      JSON.stringify({
        result: {
          title: data.title,
          description: data.description ?? null,
          ingredients: data.ingredients,
          instructions: data.instructions,
          prep_minutes: data.prep_minutes ?? null,
          cook_minutes: data.cook_minutes ?? null,
          total_minutes: data.total_minutes ?? null,
          servings_base: data.servings_base ?? null,
          effort_level: data.effort_level ?? null,
          equipment_tags: data.equipment_tags ?? [],
          tags: data.tags ?? [],
          low_confidence_fields: data.low_confidence_fields ?? [],
        },
        not_a_recipe: isNotARecipe,
      }),
      { headers: jsonHeaders },
    )
  } catch (err) {
    console.error('recipe-extract error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), { status: 500, headers: jsonHeaders })
  }
})
