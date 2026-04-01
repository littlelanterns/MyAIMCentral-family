/**
 * bookshelf-search Edge Function (PRD-23)
 * Semantic similarity search across BookShelf chunks and extraction tables.
 * Uses OpenAI text-embedding-3-small to embed the query, then RPC functions for vector search.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://esm.sh/zod@3.23.8'
import { corsHeaders, handleCors, jsonHeaders } from '../_shared/cors.ts'
import { authenticateRequest } from '../_shared/auth.ts'
import { logAICost } from '../_shared/cost-logger.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const InputSchema = z.object({
  query: z.string().min(1),
  family_id: z.string().uuid(),
  member_id: z.string().uuid(),
  scope: z.enum(['chunks', 'extractions', 'both']).default('both'),
  book_ids: z.array(z.string().uuid()).optional(),
  limit: z.number().int().min(1).max(100).default(20),
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
        JSON.stringify({ error: 'Invalid input', details: parsed.error.flatten() }),
        { status: 400, headers: jsonHeaders }
      )
    }

    const { query, scope: searchScope, family_id, member_id, book_ids, limit } = parsed.data

    // Generate query embedding
    const embeddingResponse = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'text-embedding-3-small',
        input: query,
      }),
    })

    if (!embeddingResponse.ok) {
      const errText = await embeddingResponse.text()
      console.error('OpenAI embedding error:', errText)
      return new Response(
        JSON.stringify({ error: 'Failed to generate query embedding' }),
        { status: 500, headers: jsonHeaders }
      )
    }

    const embeddingData = await embeddingResponse.json()
    const queryEmbedding = embeddingData.data[0].embedding

    // Log cost (fire-and-forget)
    logAICost({
      familyId: family_id,
      memberId: member_id,
      featureKey: 'bookshelf_search',
      model: 'text-embedding-3-small',
      inputTokens: Math.ceil(query.length / 4), // rough estimate
      outputTokens: 0,
    })

    // Run searches based on scope — parallel when both
    type SearchResult = {
      id: string; table_name: string; bookshelf_item_id: string
      book_title: string; content_type: string; item_text: string
      section_title: string | null; similarity: number
    }

    const bookIdArray = book_ids?.length ? book_ids : null

    async function searchChunks(): Promise<SearchResult[]> {
      const { data, error } = await supabase.rpc('match_bookshelf_chunks', {
        query_embedding: queryEmbedding, p_family_id: family_id,
        p_book_ids: bookIdArray, match_threshold: 0.3, match_count: limit,
      })
      if (error || !data) return []
      return data.map((r: Record<string, unknown>) => ({
        id: r.id as string, table_name: 'bookshelf_chunks',
        bookshelf_item_id: r.bookshelf_item_id as string,
        book_title: r.book_title as string, content_type: 'passage',
        item_text: ((r.chunk_text as string) || '').slice(0, 500),
        section_title: r.chapter_title as string | null,
        similarity: r.similarity as number,
      }))
    }

    async function searchExtractions(): Promise<SearchResult[]> {
      const { data, error } = await supabase.rpc('match_bookshelf_extractions', {
        query_embedding: queryEmbedding, p_family_id: family_id,
        p_member_id: member_id, p_book_ids: bookIdArray,
        match_threshold: 0.3, match_count: limit,
      })
      if (error || !data) return []
      return data.map((r: Record<string, unknown>) => ({
        id: r.id as string, table_name: r.table_name as string,
        bookshelf_item_id: r.bookshelf_item_id as string,
        book_title: r.book_title as string, content_type: (r.content_type as string) || '',
        item_text: ((r.item_text as string) || '').slice(0, 500),
        section_title: r.section_title as string | null,
        similarity: r.similarity as number,
      }))
    }

    let results: SearchResult[]
    if (searchScope === 'both') {
      const [chunks, extractions] = await Promise.all([searchChunks(), searchExtractions()])
      results = [...chunks, ...extractions]
    } else if (searchScope === 'chunks') {
      results = await searchChunks()
    } else {
      results = await searchExtractions()
    }

    // Sort by similarity descending, deduplicate, limit
    results.sort((a, b) => b.similarity - a.similarity)
    const seen = new Set<string>()
    const deduplicated = results.filter(r => {
      const key = `${r.table_name}-${r.id}`
      if (seen.has(key)) return false
      seen.add(key)
      return true
    }).slice(0, limit)

    return new Response(
      JSON.stringify({ results: deduplicated }),
      { headers: jsonHeaders }
    )
  } catch (err) {
    console.error('bookshelf-search error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: jsonHeaders }
    )
  }
})
