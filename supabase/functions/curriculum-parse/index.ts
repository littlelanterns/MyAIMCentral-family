// MyAIM Central — curriculum-parse Edge Function
// Build J — PRD-09A/09B Linked Steps, Mastery & Practice Advancement (addendum Enhancement E)
//
// AI-assisted list creation from pasted curriculum text. Mom pastes a block of
// curriculum (badge requirements, chapter list, scope-and-sequence, syllabus),
// LiLa structures it into items with suggested advancement modes. Nothing saves
// until mom reviews and approves (Human-in-the-Mix).
//
// Pattern: follows task-breaker exactly — Haiku via OpenRouter, Zod-validated
// input, JSON-only output with markdown-fence fallback, cost logging.
//
// Same UX pattern as RoutineBrainDump but dedicated Edge Function per the
// founder convention (confirmed Build H — "each AI tool gets its own Edge
// Function").

import { z } from 'https://esm.sh/zod@3.23.8'
import { handleCors, jsonHeaders } from '../_shared/cors.ts'
import { logAICost } from '../_shared/cost-logger.ts'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!

const MODEL = 'anthropic/claude-haiku-4.5'

const SYSTEM_PROMPT = `You are a curriculum parsing assistant for a homeschool family management app. You receive pasted curriculum text (badge requirements, chapter lists, scope-and-sequence documents, syllabi, lesson plans) and structure it into a list of items with suggested advancement modes.

Your job is structured extraction. You do NOT write new content. You do NOT add items that are not in the source text. You only clean up numbering prefixes and separate stray joined items.

RULES:

1. EXTRACT items from the source text. Preserve the original order. Do not invent, merge, or skip.
2. CLEAN titles: remove leading numbering ("1.", "A.", "Chapter 1:", "Requirement 3:") but KEEP the descriptive portion. Example: "Chapter 1: Introduction to Fractions" becomes "Introduction to Fractions".
3. DETECT URLs embedded in the item text. Move them into the \`url\` field. Leave the title clean.
4. FLAG required / starred / mandatory items. If an item has a star (*), "(required)", "must be completed", or similar marker, set \`is_required: true\`.
5. SUGGEST an advancement mode per item based on language patterns:
   - One-time activity or discrete deliverable → \`complete\`. Examples: "Read Chapter 3", "Watch the video", "Visit a museum", "Write a 2-page report", "Complete worksheet 7".
   - Something to be done multiple times → \`practice_count\`. Look for phrases like "practice 5 times", "do 3 sets", "complete 10 problems", "repeat daily for 2 weeks". Set \`suggested_practice_target\` to the number.
   - Open-ended skill or demonstration → \`mastery\`. Look for phrases like "demonstrate", "memorize", "be able to", "show mastery of", "perform from memory", "know by heart", "learn to identify". Set \`suggested_require_approval\` to true for items that need parent verification (skill demonstrations, memorization checks).
6. DETECT prerequisite references. If an item says "requires completion of Level 2" or "after finishing the beginner set" or "prerequisite: Chapter 5", include a short \`prerequisite_note\` explaining. Do NOT try to link items — that's mom's job.
7. DETECT metadata in the overall text:
   - source_name: title / name of the curriculum if mentioned in the text (e.g., "Frontier Girls Level 3 Life Skills", "Saxon Math 6")
   - total_required: if the text says "do six requirements" or "complete 4 of the 8", extract the required count
   - pick_n_of_m: if the text has a pick-N-of-M pattern like "pick 6 of 10 requirements, including the 2 starred ones", populate \`{n, m, required_count}\`. This is informational only — the list is still created flat; the pick-N logic belongs in BigPlans.
8. DO NOT use emoji anywhere in output — not in titles, notes, source_name, or anywhere.
9. DO NOT invent items not in the source text.
10. Keep notes short — only fill if there's genuinely useful extra context beyond the title.

Respond with ONLY a valid JSON object. No markdown, no code fences, no explanation outside the JSON.

Format:
{
  "items": [
    {
      "title": "string",
      "notes": "string or null",
      "url": "string or null",
      "is_required": false,
      "suggested_advancement_mode": "complete" | "practice_count" | "mastery",
      "suggested_practice_target": number | null,
      "suggested_require_approval": boolean | null,
      "prerequisite_note": "string or null",
      "sort_order": 1
    }
  ],
  "detected_metadata": {
    "source_name": "string or null",
    "total_required": number | null,
    "pick_n_of_m": { "n": number, "m": number, "required_count": number | null } | null
  }
}`

const ContextSchema = z.object({
  subject_area: z.string().optional(),
  target_level: z.string().optional(),
})

const InputSchema = z.object({
  raw_text: z.string().min(1).max(50_000),
  list_type: z.enum(['sequential', 'randomizer']),
  context: ContextSchema.optional(),
  family_id: z.string().uuid().optional(),
  member_id: z.string().uuid().optional(),
})

const ItemSchema = z.object({
  title: z.string().min(1),
  notes: z.string().nullable().optional(),
  url: z.string().nullable().optional(),
  is_required: z.boolean().optional(),
  suggested_advancement_mode: z.enum(['complete', 'practice_count', 'mastery']).optional(),
  suggested_practice_target: z.number().nullable().optional(),
  suggested_require_approval: z.boolean().nullable().optional(),
  prerequisite_note: z.string().nullable().optional(),
  sort_order: z.number().optional(),
})

const OutputSchema = z.object({
  items: z.array(ItemSchema),
  detected_metadata: z.object({
    source_name: z.string().nullable().optional(),
    total_required: z.number().nullable().optional(),
    pick_n_of_m: z.object({
      n: z.number(),
      m: z.number(),
      required_count: z.number().nullable().optional(),
    }).nullable().optional(),
  }).optional(),
})

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const body = await req.json()
    const parsed = InputSchema.safeParse(body)
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: parsed.error.issues }),
        { status: 400, headers: jsonHeaders },
      )
    }

    const { raw_text, list_type, context, family_id, member_id } = parsed.data

    // Build the user message with context hints
    const parts: string[] = []
    parts.push(`List type: ${list_type}`)
    if (context?.subject_area) parts.push(`Subject area: ${context.subject_area}`)
    if (context?.target_level) parts.push(`Target level: ${context.target_level}`)
    parts.push(``)
    parts.push(`Curriculum text to parse:`)
    parts.push(`---`)
    parts.push(raw_text)
    parts.push(`---`)

    const userMessage = parts.join('\n')

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
        max_tokens: 4096,
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
    const content = (result.choices?.[0]?.message?.content || '').trim()
    const inputTokens = result.usage?.prompt_tokens || 0
    const outputTokens = result.usage?.completion_tokens || 0

    // Parse JSON response — handle potential markdown fencing
    let parsedOutput: unknown
    try {
      const cleaned = content.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
      parsedOutput = JSON.parse(cleaned)
    } catch {
      console.error('Failed to parse AI JSON response:', content)
      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response', raw: content }),
        { status: 502, headers: jsonHeaders },
      )
    }

    // Validate with Zod to enforce the schema contract
    const validation = OutputSchema.safeParse(parsedOutput)
    if (!validation.success) {
      console.error('AI output failed schema validation:', validation.error.issues)
      return new Response(
        JSON.stringify({
          error: 'AI response did not match expected schema',
          details: validation.error.issues,
          raw: parsedOutput,
        }),
        { status: 502, headers: jsonHeaders },
      )
    }

    // Fire-and-forget cost logging
    if (family_id && member_id) {
      logAICost({
        familyId: family_id,
        memberId: member_id,
        featureKey: 'curriculum_ai_parse',
        model: MODEL,
        inputTokens,
        outputTokens,
      })
    }

    // Apply sort_order if missing
    const items = validation.data.items.map((item, idx) => ({
      ...item,
      sort_order: item.sort_order ?? idx + 1,
      suggested_advancement_mode: item.suggested_advancement_mode ?? 'complete',
      is_required: item.is_required ?? false,
    }))

    return new Response(
      JSON.stringify({
        items,
        detected_metadata: validation.data.detected_metadata ?? null,
        input_tokens: inputTokens,
        output_tokens: outputTokens,
      }),
      { headers: jsonHeaders },
    )
  } catch (err) {
    console.error('curriculum-parse error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: jsonHeaders },
    )
  }
})
