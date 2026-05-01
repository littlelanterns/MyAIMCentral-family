/**
 * bookshelf-study-guide Edge Function (PRD-23 — Reworked)
 *
 * Backfills guided_text + independent_text columns on existing extraction rows
 * for books that were extracted before the age-adaptation capability existed.
 *
 * Approach: reads raw book text from bookshelf_chunks (same
 * source as bookshelf-extract), sends it to Sonnet alongside the existing adult
 * extractions as structural context, and UPDATEs the two empty columns on the
 * existing audience='original' rows. No new rows are created.
 *
 * For books extracted by the new pipeline (bookshelf-extract), guided_text and
 * independent_text are already populated during initial extraction — this
 * function is only needed for the ~577 legacy books.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://esm.sh/zod@3.23.8'
import { handleCors, jsonHeaders } from '../_shared/cors.ts'
import { authenticateRequest } from '../_shared/auth.ts'
import { logAICost } from '../_shared/cost-logger.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!

const SONNET_MODEL = 'anthropic/claude-sonnet-4'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const InputSchema = z.object({
  bookshelf_item_id: z.string().uuid(),
  family_id: z.string().uuid(),
  member_id: z.string().uuid(),
})

// Same YOUTH_ADAPTATION_ADDENDUM used by bookshelf-extract
const YOUTH_ADAPTATION_PROMPT = `You are generating age-adapted versions of book extractions.

You will receive:
1. The RAW BOOK TEXT for a section (this is the source of truth — use it for accuracy)
2. The EXISTING ADULT EXTRACTIONS for that section (these tell you what items need kid/teen versions)

For EACH existing extraction item, generate TWO adapted versions:

- "guided_text": Rewritten for ages 8-12 (Guided shell). Use simple vocabulary, concrete examples a child can picture, warm encouraging tone. Replace abstract concepts with relatable imagery. For stories, focus on what the character learned. For principles, say what it means in kid terms. 1-2 sentences max. For declarations, rewrite as something a kid would genuinely say — "I want to be someone who..." not "I choose to embody..."
- "independent_text": Rewritten for ages 13-16 (Independent teen shell). Use age-appropriate vocabulary, relatable examples (school, friendships, identity, future). Preserve the core meaning but frame it through a teen's world. Can be slightly longer than guided (2-3 sentences). For declarations, teens can handle more sophisticated language but should still sound authentic to a teenager.

CONTENT SAFETY FOR YOUTH VERSIONS:
- Never encourage secrecy, exclusivity, or hidden relationships
- Never suggest hiding things from parents or trusted adults
- Frame all relationship advice around openness, kindness, and inclusion
- If the original content promotes unhealthy dynamics, rewrite the youth version to model the POSITIVE alternative
- For fiction: focus on what the CHARACTER LEARNED, not on imitating morally complex behaviors
- Prioritize lessons about courage, integrity, kindness, resilience, and growth

If the original item's content is genuinely not age-appropriate for a particular level (e.g., marital intimacy), set that level's text to null.

IMPORTANT: Your output MUST map 1:1 to the input items by index. Item 0 in your output = item 0 in the input.

Return ONLY a JSON object:
{
  "items": [
    { "index": 0, "guided_text": "Kid version or null", "independent_text": "Teen version or null" },
    { "index": 1, "guided_text": "...", "independent_text": "..." }
  ]
}

No markdown backticks, no preamble.`

// ── Safe JSON Parser (same pattern as bookshelf-extract) ──

function safeParseJSON(raw: string): { parsed: unknown; error?: string } {
  if (!raw || !raw.trim()) return { parsed: null, error: 'Empty AI response' }

  let cleaned = raw.trim()
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '')
  cleaned = cleaned.trim()

  try { return { parsed: JSON.parse(cleaned) } } catch { /* fall through */ }

  const objMatch = cleaned.match(/\{[\s\S]*\}/)
  if (objMatch) {
    try { return { parsed: JSON.parse(objMatch[0]) } } catch { /* fall through */ }
  }

  return { parsed: null, error: 'Could not parse JSON from AI response' }
}

// ── Retry Helper ──

async function fetchWithRetry(
  url: string, init: RequestInit, maxRetries = 3,
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, init)
    if (response.ok || attempt === maxRetries) return response
    const status = response.status
    if (status !== 429 && status !== 502 && status !== 503) return response
    const delay = Math.pow(2, attempt + 1) * 1000
    const retryAfter = response.headers.get('retry-after')
    const waitMs = retryAfter ? Math.min(parseInt(retryAfter, 10) * 1000, 15000) : delay
    console.log(`[study-guide] Retry ${attempt + 1}/${maxRetries} after ${status}, waiting ${waitMs}ms`)
    await new Promise(r => setTimeout(r, waitMs))
  }
  throw new Error('fetchWithRetry exhausted retries')
}

const openRouterHeaders = {
  Authorization: `Bearer ${OPENROUTER_API_KEY}`,
  'Content-Type': 'application/json',
  'HTTP-Referer': 'https://myaimcentral.com',
  'X-Title': 'MyAIM Central BookShelf Study Guide',
}

// ── Types ──

interface ExtractionRow {
  id: string
  extraction_type: string
  text: string | null
  guided_text: string | null
  independent_text: string | null
  declaration_text: string | null
  content_type: string | null
  section_title: string | null
  section_index: number | null
  sort_order: number
}

interface ChunkRow {
  chunk_index: number
  chapter_index: number | null
  chapter_title: string | null
  text: string
}

// ── Main Handler ──

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
        { status: 400, headers: jsonHeaders },
      )
    }

    const { bookshelf_item_id, family_id, member_id } = parsed.data

    // 1. Resolve book_library_id from bookshelf_items
    const { data: book, error: bookErr } = await supabase
      .from('bookshelf_items')
      .select('title, author, book_library_id, book_cache_id')
      .eq('id', bookshelf_item_id)
      .eq('family_id', family_id)
      .single()

    if (bookErr || !book) {
      return new Response(
        JSON.stringify({ error: 'Book not found or access denied' }),
        { status: 404, headers: jsonHeaders },
      )
    }

    const bookLibraryId = book.book_library_id as string | null
    if (!bookLibraryId) {
      return new Response(
        JSON.stringify({ error: 'Book has no library link — cannot generate study guide' }),
        { status: 400, headers: jsonHeaders },
      )
    }

    const bookTitle = book.title as string
    const bookAuthor = book.author as string | null
    const bookCacheId = book.book_cache_id as string | null
    const displayTitle = bookAuthor ? `${bookTitle} by ${bookAuthor}` : bookTitle

    // 2. Load ALL chunks from bookshelf_chunks (public table, PostgREST accessible)
    // bookshelf_chunks uses book_cache_id which equals book_library_id or bookshelf_item_id
    const chunkKey = bookCacheId || bookLibraryId
    const { data: rawChunks, error: chunkErr } = await supabase
      .from('bookshelf_chunks')
      .select('chunk_index, chapter_index, chapter_title, chunk_text')
      .eq('book_cache_id', chunkKey)
      .order('chunk_index', { ascending: true })

    if (chunkErr || !rawChunks || rawChunks.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No text chunks found for this book. The book may still be processing.' }),
        { status: 404, headers: jsonHeaders },
      )
    }

    const chunks: ChunkRow[] = (rawChunks as Array<{ chunk_index: number; chapter_index: number | null; chapter_title: string | null; chunk_text: string }>)
      .map(c => ({ chunk_index: c.chunk_index, chapter_index: c.chapter_index, chapter_title: c.chapter_title, text: c.chunk_text }))

    console.log(`[study-guide] Loaded ${chunks.length} chunks for "${displayTitle}"`)

    // 3. Load ALL existing extraction rows that need backfill
    const allExtractions: ExtractionRow[] = []
    let offset = 0
    while (true) {
      const { data, error } = await supabase
        .rpc('get_book_extractions', {
          p_bookshelf_item_ids: [bookshelf_item_id],
          p_member_id: member_id,
          p_audience: 'original',
        })
        .range(offset, offset + 999)

      if (error) {
        console.error('[study-guide] get_book_extractions error:', error.message)
        break
      }
      if (!data || data.length === 0) break
      allExtractions.push(...(data as ExtractionRow[]))
      if (data.length < 1000) break
      offset += 1000
    }

    console.log(`[study-guide] Loaded ${allExtractions.length} extractions for "${displayTitle}"`)

    // Filter to rows that actually need backfill (guided_text is NULL)
    const needsBackfill = allExtractions.filter(e => e.guided_text === null || e.independent_text === null)
    if (needsBackfill.length === 0) {
      return new Response(
        JSON.stringify({ success: true, items_updated: 0, message: 'All extractions already have guided and independent text' }),
        { headers: jsonHeaders },
      )
    }

    console.log(`[study-guide] ${needsBackfill.length} of ${allExtractions.length} extractions need backfill`)

    // 4. Group extractions by section_title
    const sectionMap = new Map<string, ExtractionRow[]>()
    for (const ext of needsBackfill) {
      const key = ext.section_title || '__general__'
      const arr = sectionMap.get(key) || []
      arr.push(ext)
      sectionMap.set(key, arr)
    }

    // Group chunks by chapter_title for section matching
    const fullText = chunks.map(c => c.text).join('\n\n')
    const chunksByChapter = new Map<string, string>()
    for (const chunk of chunks) {
      const key = chunk.chapter_title || '__general__'
      const existing = chunksByChapter.get(key) || ''
      chunksByChapter.set(key, existing + (existing ? '\n\n' : '') + chunk.text)
    }

    // 5. Process each section with Sonnet
    let totalUpdated = 0
    let totalInputTokens = 0
    let totalOutputTokens = 0
    const sectionEntries = Array.from(sectionMap.entries())

    for (let si = 0; si < sectionEntries.length; si++) {
      const [sectionTitle, sectionExtractions] = sectionEntries[si]

      // Find matching chunk text for this section
      let sectionText = chunksByChapter.get(sectionTitle) || ''
      if (!sectionText && sectionTitle !== '__general__') {
        // Fuzzy match: try partial match on chapter titles
        for (const [chTitle, chText] of chunksByChapter.entries()) {
          if (chTitle.includes(sectionTitle) || sectionTitle.includes(chTitle)) {
            sectionText = chText
            break
          }
        }
      }
      if (!sectionText) {
        // Last resort: use full text (truncated)
        sectionText = fullText.substring(0, 80_000)
      }

      // Truncate section text to keep within context limits
      const MAX_CHUNK_CHARS = 60_000
      if (sectionText.length > MAX_CHUNK_CHARS) {
        sectionText = sectionText.substring(0, MAX_CHUNK_CHARS) +
          `\n\n[... ${sectionText.length - MAX_CHUNK_CHARS} characters truncated ...]`
      }

      // Build the extraction context for Sonnet
      const extractionList = sectionExtractions.map((ext, idx) => {
        const text = ext.extraction_type === 'declaration'
          ? (ext.declaration_text || ext.text || '')
          : (ext.text || '')
        return `[${idx}] (${ext.extraction_type}${ext.content_type ? '/' + ext.content_type : ''}): ${text}`
      }).join('\n\n')

      console.log(`[study-guide] Processing section ${si + 1}/${sectionEntries.length}: "${sectionTitle === '__general__' ? 'General' : sectionTitle}" (${sectionExtractions.length} items)`)

      const userContent = `Document: "${displayTitle}"
Section: "${sectionTitle === '__general__' ? 'General' : sectionTitle}"

=== RAW BOOK TEXT (source of truth — use this for accuracy) ===
${sectionText}

=== EXISTING ADULT EXTRACTIONS (generate matching guided_text + independent_text for each) ===
${extractionList}

Generate guided_text and independent_text for each of the ${sectionExtractions.length} items above.`

      try {
        const aiResponse = await fetchWithRetry(
          'https://openrouter.ai/api/v1/chat/completions',
          {
            method: 'POST',
            headers: openRouterHeaders,
            body: JSON.stringify({
              model: SONNET_MODEL,
              max_tokens: 16384,
              messages: [
                { role: 'system', content: YOUTH_ADAPTATION_PROMPT },
                { role: 'user', content: userContent },
              ],
            }),
          },
        )

        const aiData = await aiResponse.json()

        if (!aiResponse.ok) {
          const detail = aiData?.error?.message || JSON.stringify(aiData).substring(0, 300)
          console.error(`[study-guide] AI error for section "${sectionTitle}":`, aiResponse.status, detail)
          continue
        }

        totalInputTokens += aiData.usage?.prompt_tokens ?? 0
        totalOutputTokens += aiData.usage?.completion_tokens ?? 0

        const rawContent = aiData.choices?.[0]?.message?.content || ''
        const { parsed, error: parseErr } = safeParseJSON(rawContent)

        if (!parsed) {
          console.error(`[study-guide] Parse failed for section "${sectionTitle}":`, parseErr)
          continue
        }

        const resultObj = parsed as { items?: Array<{ index: number; guided_text: string | null; independent_text: string | null }> }
        const items = resultObj.items
        if (!items || !Array.isArray(items)) {
          console.error(`[study-guide] No items array in response for section "${sectionTitle}"`)
          continue
        }

        // 6. UPDATE each extraction row
        for (const item of items) {
          if (item.index < 0 || item.index >= sectionExtractions.length) continue
          const extraction = sectionExtractions[item.index]

          const { error: updateErr } = await supabase
            .rpc('update_book_extraction_youth_text', {
              p_extraction_id: extraction.id,
              p_guided_text: item.guided_text || null,
              p_independent_text: item.independent_text || null,
            })

          if (updateErr) {
            console.error(`[study-guide] Update failed for ${extraction.id}:`, updateErr.message)
            continue
          }

          totalUpdated++
        }

        console.log(`[study-guide] Section "${sectionTitle}": updated ${items.length} items`)
      } catch (err) {
        console.error(`[study-guide] Section "${sectionTitle}" failed:`, err)
        continue
      }
    }

    // Log AI cost
    logAICost({
      familyId: family_id,
      memberId: member_id,
      featureKey: 'bookshelf_study_guide',
      model: SONNET_MODEL,
      inputTokens: totalInputTokens,
      outputTokens: totalOutputTokens,
    })

    console.log(`[study-guide] Complete: ${totalUpdated} items updated for "${displayTitle}"`)

    return new Response(
      JSON.stringify({
        success: true,
        items_updated: totalUpdated,
        sections_processed: sectionEntries.length,
      }),
      { headers: jsonHeaders },
    )
  } catch (err) {
    console.error('[study-guide] Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: `Study guide generation failed: ${(err as Error).message}` }),
      { status: 500, headers: jsonHeaders },
    )
  }
})
