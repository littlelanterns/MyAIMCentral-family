/**
 * generate-query-embedding Edge Function (PRD-18 Phase C Enhancement 3)
 *
 * Thin wrapper around OpenAI text-embedding-3-small for ad-hoc query
 * embedding generation from the frontend. The existing `embed` Edge
 * Function is queue-driven (processes rows with NULL embeddings); it
 * doesn't expose an ad-hoc "embed this text" endpoint.
 *
 * Used by the Morning Insight section (MorningInsightSection) to embed
 * the rotating question + the user's freeform response, then call
 * `match_book_extractions` RPC for passive + active semantic matches
 * against the family's BookShelf library.
 *
 * Returns the full 1536-dim embedding array as number[]. Callers pass
 * this to RPCs that accept `halfvec(1536)` via Supabase's JS client
 * (Supabase handles the halfvec serialization).
 */
import { handleCors, jsonHeaders } from '../_shared/cors.ts'
import { authenticateRequest } from '../_shared/auth.ts'
import { logAICost } from '../_shared/cost-logger.ts'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!

interface RequestBody {
  text?: string
  family_id?: string
  member_id?: string
  feature_key?: string
}

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const auth = await authenticateRequest(req)
    if (auth instanceof Response) return auth

    const body = (await req.json()) as RequestBody
    const text = body.text?.trim()
    if (!text) {
      return new Response(
        JSON.stringify({ error: 'text is required' }),
        { status: 400, headers: jsonHeaders },
      )
    }

    // Limit input length (same pattern as existing embed + bookshelf-search)
    const truncated = text.slice(0, 8000)

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: truncated,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('OpenAI embedding error:', errText)
      return new Response(
        JSON.stringify({ error: 'Failed to generate embedding' }),
        { status: 500, headers: jsonHeaders },
      )
    }

    const data = await response.json()
    const embedding = data.data?.[0]?.embedding as number[] | undefined
    if (!embedding || embedding.length !== 1536) {
      return new Response(
        JSON.stringify({ error: 'Unexpected embedding shape' }),
        { status: 500, headers: jsonHeaders },
      )
    }

    // Log cost (fire-and-forget)
    if (body.family_id && body.member_id) {
      logAICost({
        familyId: body.family_id,
        memberId: body.member_id,
        featureKey: body.feature_key || 'generate_query_embedding',
        model: 'text-embedding-3-small',
        inputTokens: Math.ceil(truncated.length / 4),
        outputTokens: 0,
      })
    }

    return new Response(
      JSON.stringify({ embedding }),
      { headers: jsonHeaders },
    )
  } catch (err) {
    console.error('generate-query-embedding error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: jsonHeaders },
    )
  }
})
