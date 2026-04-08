/**
 * embed-text-admin Edge Function (Build M Sub-phase A — admin embedding tool)
 *
 * Service-role-only wrapper around OpenAI text-embedding-3-small for one-shot
 * admin scripts that need to embed text without an end-user auth context.
 *
 * The existing `generate-query-embedding` function requires end-user auth
 * (calls authenticateRequest which uses the anon client). Admin scripts that
 * run with the service role key would 401 against it. This function exists
 * specifically for those scripts — currently used by:
 *   - scripts/ingest-cdef-icons.cjs (Build M Sub-phase A icon ingestion)
 *
 * Returns the same shape as generate-query-embedding: { embedding: number[] }
 * with the full 1536-dim float array.
 *
 * ADMIN-ONLY — rejects all non-service-role auth.
 */
import { handleCors, jsonHeaders } from '../_shared/cors.ts'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

interface RequestBody {
  text?: string
}

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  // Service role gate — admin-only
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
    const text = body.text?.trim()
    if (!text) {
      return new Response(
        JSON.stringify({ error: 'text is required' }),
        { status: 400, headers: jsonHeaders },
      )
    }

    // Same length cap as generate-query-embedding for consistency
    const truncated = text.slice(0, 8000)

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
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
        JSON.stringify({ error: 'Failed to generate embedding', detail: errText }),
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

    return new Response(
      JSON.stringify({ embedding }),
      { headers: jsonHeaders },
    )
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('embed-text-admin error:', msg)
    return new Response(
      JSON.stringify({ error: `Server error: ${msg}` }),
      { status: 500, headers: jsonHeaders },
    )
  }
})
