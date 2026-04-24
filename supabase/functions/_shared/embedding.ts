/**
 * Shared OpenAI embedding helper for synchronous in-function use.
 *
 * Used by:
 *   - `generate-query-embedding` (ad-hoc query embedding from the frontend)
 *   - `lila-board-of-directors` (embedding pre-screen per PRD-34 §4)
 *
 * For async batch embedding (on-write persistence), keep using the pgmq
 * queue + `embed` Edge Function pattern. This helper is for the
 * "user is waiting, we need an embedding now" case only.
 */

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!
const EMBEDDING_MODEL = 'text-embedding-3-small'
const EMBEDDING_DIMENSIONS = 1536

/**
 * Generate a 1536-dim embedding for the given text via OpenAI.
 * Truncates input to 8000 chars (same cap as existing embed + bookshelf-search).
 *
 * Returns null on API error or unexpected shape — callers should treat null
 * as "pre-screen unavailable" and skip, not fail-closed block. The harm
 * screen downstream is the actual safety gate.
 */
export async function embedText(text: string): Promise<number[] | null> {
  const trimmed = text.trim()
  if (!trimmed) return null
  const truncated = trimmed.slice(0, 8000)

  try {
    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: EMBEDDING_MODEL,
        input: truncated,
      }),
    })

    if (!response.ok) {
      console.error('embedText OpenAI error:', response.status, await response.text())
      return null
    }

    const data = await response.json()
    const embedding = data.data?.[0]?.embedding as number[] | undefined
    if (!embedding || embedding.length !== EMBEDDING_DIMENSIONS) {
      console.error('embedText unexpected shape:', embedding?.length)
      return null
    }

    return embedding
  } catch (err) {
    console.error('embedText threw:', err)
    return null
  }
}

export const EMBEDDING_HALFVEC_DIMENSIONS = EMBEDDING_DIMENSIONS
