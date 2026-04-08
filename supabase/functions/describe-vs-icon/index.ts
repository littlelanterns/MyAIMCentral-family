/**
 * describe-vs-icon Edge Function (Build M Sub-phase A — icon ingestion)
 *
 * One-shot admin tool for the visual_schedule icon ingestion pipeline.
 * Takes a base64-encoded paper-craft icon image, returns a 1-2 sentence
 * description matching the existing platform_assets.visual_schedule library
 * style ("A child holding a cup of water with both hands, paper-craft
 * dimensional style.") plus a suggested tags array.
 *
 * Used by scripts/ingest-cdef-icons.cjs which uploads the 64 Grids C/D/E/F
 * icons to platform_assets after generating descriptions, tags, and
 * embeddings for each.
 *
 * SERVICE ROLE ONLY — this function is admin-only and rejects all
 * end-user auth. The ingestion script invokes it with the service role
 * key. NOT exposed to the client.
 *
 * Vision model: Claude Sonnet 4 via OpenRouter (Haiku does not support
 * vision per mindsweep-scan/index.ts:16-17 comment).
 */
import { handleCors, jsonHeaders } from '../_shared/cors.ts'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const VISION_MODEL = 'anthropic/claude-sonnet-4'

interface RequestBody {
  image_base64: string
  mime_type?: string
  subject_name: string  // e.g., "drink_water" — used in the prompt for context
}

interface Description {
  description: string
  suggested_tags: string[]
}

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  // Service role gate — admin-only function
  const authHeader = req.headers.get('Authorization') || ''
  const token = authHeader.replace('Bearer ', '')
  if (token !== SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(
      JSON.stringify({ error: 'Forbidden — admin-only function' }),
      { status: 403, headers: jsonHeaders },
    )
  }

  try {
    const body = (await req.json()) as RequestBody
    const { image_base64, mime_type, subject_name } = body

    if (!image_base64) {
      return new Response(
        JSON.stringify({ error: 'image_base64 is required' }),
        { status: 400, headers: jsonHeaders },
      )
    }

    if (!subject_name) {
      return new Response(
        JSON.stringify({ error: 'subject_name is required' }),
        { status: 400, headers: jsonHeaders },
      )
    }

    const mimeType = mime_type || 'image/jpeg'
    const dataUri = `data:${mimeType};base64,${image_base64}`

    // Style references from existing visual_schedule library descriptions:
    //   "A child playing an arcade game, joystick, minimal background"
    //   "A blonde girl smoothing out the pillow on her bed, paper-craft dimensional style."
    //   "A dark-skinned child squeezing toothpaste onto a toothbrush, paper-craft dimensional style."
    //   "A baby badger who found its very first mushroom and is enormously proud."
    const systemPrompt = `You are a visual asset cataloger for a children's app. You will receive a paper-craft style illustration. Your job is to describe what is visually shown in the image, in 1-2 short sentences, in the same style as these reference descriptions:

  - "A child playing an arcade game, joystick, minimal background"
  - "A blonde girl smoothing out the pillow on her bed, paper-craft dimensional style."
  - "A dark-skinned child squeezing toothpaste onto a toothbrush, paper-craft dimensional style."
  - "A baby badger who found its very first mushroom and is enormously proud."

Focus on:
- What the child or subject is physically doing
- Visual details that would help match this image to a task title (objects held, pose, expression)
- The paper-craft / dimensional / felt aesthetic when relevant
- Skin tone and hair color ONLY if clearly visible (don't guess)

Avoid:
- Generic phrases like "ready to start the day"
- Over-interpretation of meaning or feeling beyond what's visible
- Quoting the subject_name verbatim as the description

You will also output a tags array — 5-10 lowercase keywords that would help mom find this image when typing a related task title. Include the obvious nouns + verbs from the scene. NEVER include "variant_A" / "variant_B" tags. Return ONLY a JSON object with this exact shape:

{"description": "...", "suggested_tags": ["...", "..."]}

No commentary, no markdown fences, no extra fields.`

    const userText = `The subject ID for this image is "${subject_name}". Look at the image and produce the description + tags JSON.`

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://myaimcentral.com',
        'X-Title': 'MyAIM Central icon ingestion',
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        max_tokens: 600,
        temperature: 0.3,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: userText },
              { type: 'image_url', image_url: { url: dataUri } },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Vision API error:', response.status, errText)
      return new Response(
        JSON.stringify({ error: `Vision API failed (${response.status})`, detail: errText }),
        { status: 502, headers: jsonHeaders },
      )
    }

    const data = await response.json()
    const rawContent = data.choices?.[0]?.message?.content || ''

    // Parse JSON from response — strip markdown fences if present
    let parsed: Description
    try {
      const stripped = rawContent
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```\s*$/i, '')
        .trim()
      parsed = JSON.parse(stripped)
    } catch (parseErr) {
      console.error('Failed to parse vision response as JSON:', rawContent)
      return new Response(
        JSON.stringify({
          error: 'Vision response was not valid JSON',
          raw: rawContent,
        }),
        { status: 502, headers: jsonHeaders },
      )
    }

    if (!parsed.description || !Array.isArray(parsed.suggested_tags)) {
      return new Response(
        JSON.stringify({
          error: 'Vision response missing required fields',
          parsed,
        }),
        { status: 502, headers: jsonHeaders },
      )
    }

    // Sanitize tags — lowercase, dedupe, strip variant_X if model leaked it
    const cleanTags = Array.from(
      new Set(
        parsed.suggested_tags
          .map((t) => String(t).toLowerCase().trim())
          .filter((t) => t.length > 0 && !t.match(/^variant_/)),
      ),
    )

    const usage = data.usage || {}

    return new Response(
      JSON.stringify({
        description: parsed.description.trim(),
        suggested_tags: cleanTags,
        usage: {
          input_tokens: usage.prompt_tokens || 0,
          output_tokens: usage.completion_tokens || 0,
        },
      }),
      { headers: jsonHeaders },
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('describe-vs-icon error:', msg)
    return new Response(
      JSON.stringify({ error: `Server error: ${msg}` }),
      { status: 500, headers: jsonHeaders },
    )
  }
})
