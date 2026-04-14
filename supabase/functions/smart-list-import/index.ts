// MyAIM Central — smart-list-import Edge Function
// Opportunity-List Unification — Multi-List Smart Import
//
// Takes extracted items (from notepad paste, OCR, or text input) plus the
// family's existing lists, and classifies each item into the best-matching
// list. Items that don't fit any existing list get a "new list" suggestion.
//
// Pattern: follows curriculum-parse exactly — Haiku via OpenRouter, Zod-validated
// input/output, JSON-only response, cost logging.

import { z } from 'https://esm.sh/zod@3.23.8'
import { handleCors, jsonHeaders } from '../_shared/cors.ts'
import { logAICost } from '../_shared/cost-logger.ts'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!

const MODEL = 'anthropic/claude-haiku-4.5'

const SYSTEM_PROMPT = `You are a list sorting assistant for a family management app. A mom has pasted a block of text containing multiple items (activities, chores, tasks, ideas). You receive the items and a list of her existing family lists. Your job is to classify each item into the most appropriate existing list, or suggest a new list if none fit.

RULES:

1. EXTRACT individual items from the raw text. Each line, bullet, numbered item, or comma-separated phrase is a separate item.
2. For each item, decide which existing list is the BEST match based on the list's title and description.
3. If an item clearly fits an existing list, set target_list_id to that list's ID.
4. If an item does NOT fit any existing list well, set target_list_id to null and suggest a new list name in suggested_new_list.
5. Group similar "new list" suggestions under the same suggested_new_list name (don't create a separate list suggestion per item — batch them).
6. Set confidence to "high" (obvious match), "medium" (reasonable guess), or "low" (uncertain).
7. If an item mentions a reward amount (e.g., "$3", "5 stars", "earn 10 points"), extract it into reward_amount and set reward_type.
8. Keep item text clean — remove numbering prefixes, bullets, dashes.
9. DO NOT invent items not in the source text.
10. DO NOT use emoji anywhere.
11. If a note or context is embedded in the item (e.g., "Wash the car (Saturday)"), separate it into notes.

Respond with ONLY valid JSON. No markdown, no code fences, no explanation.

Format:
{
  "items": [
    {
      "text": "clean item text",
      "notes": "any extra context or null",
      "target_list_id": "uuid of matching list or null",
      "target_list_title": "title of matched list or null",
      "suggested_new_list": "suggested new list name or null",
      "confidence": "high" | "medium" | "low",
      "reward_type": "money" | "points" | "privilege" | null,
      "reward_amount": number | null,
      "category": "optional category/section within the list or null"
    }
  ],
  "suggested_new_lists": [
    {
      "title": "suggested list name",
      "description": "brief description of what this list would contain",
      "item_count": number
    }
  ]
}`

const ExistingListSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  description: z.string().nullable().optional(),
  list_type: z.string(),
  is_opportunity: z.boolean().optional(),
})

const InputSchema = z.object({
  raw_text: z.string().min(1).max(50_000),
  existing_lists: z.array(ExistingListSchema),
  source_context: z.string().optional(), // e.g. "book title", "activity guide"
  family_id: z.string().uuid().optional(),
  member_id: z.string().uuid().optional(),
})

const ClassifiedItemSchema = z.object({
  text: z.string().min(1),
  notes: z.string().nullable().optional(),
  target_list_id: z.string().nullable().optional(),
  target_list_title: z.string().nullable().optional(),
  suggested_new_list: z.string().nullable().optional(),
  confidence: z.enum(['high', 'medium', 'low']).optional(),
  reward_type: z.enum(['money', 'points', 'privilege']).nullable().optional(),
  reward_amount: z.number().nullable().optional(),
  category: z.string().nullable().optional(),
})

const SuggestedListSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  item_count: z.number().optional(),
})

const OutputSchema = z.object({
  items: z.array(ClassifiedItemSchema),
  suggested_new_lists: z.array(SuggestedListSchema).optional(),
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

    const { raw_text, existing_lists, source_context, family_id, member_id } = parsed.data

    // Build the user message
    const parts: string[] = []

    if (source_context) {
      parts.push(`Source: ${source_context}`)
      parts.push('')
    }

    parts.push('Existing family lists:')
    if (existing_lists.length === 0) {
      parts.push('  (none — suggest new lists for everything)')
    } else {
      for (const list of existing_lists) {
        const desc = list.description ? ` — ${list.description}` : ''
        const opp = list.is_opportunity ? ' [opportunity list]' : ''
        parts.push(`  - ID: ${list.id} | Title: "${list.title}" | Type: ${list.list_type}${opp}${desc}`)
      }
    }

    parts.push('')
    parts.push('Items to sort:')
    parts.push('---')
    parts.push(raw_text)
    parts.push('---')

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

    // Validate with Zod
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
        featureKey: 'smart_list_import',
        model: MODEL,
        inputTokens,
        outputTokens,
      })
    }

    // Ensure every item has defaults
    const items = validation.data.items.map((item, idx) => ({
      ...item,
      confidence: item.confidence ?? 'medium',
      notes: item.notes ?? null,
      target_list_id: item.target_list_id ?? null,
      target_list_title: item.target_list_title ?? null,
      suggested_new_list: item.suggested_new_list ?? null,
      reward_type: item.reward_type ?? null,
      reward_amount: item.reward_amount ?? null,
      category: item.category ?? null,
      sort_order: idx,
    }))

    return new Response(
      JSON.stringify({
        items,
        suggested_new_lists: validation.data.suggested_new_lists ?? [],
        input_tokens: inputTokens,
        output_tokens: outputTokens,
      }),
      { headers: jsonHeaders },
    )
  } catch (err) {
    console.error('smart-list-import error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: jsonHeaders },
    )
  }
})
