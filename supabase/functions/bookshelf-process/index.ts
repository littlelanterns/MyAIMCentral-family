/**
 * bookshelf-process Edge Function (PRD-23)
 *
 * Handles text extraction, chunking, and embedding for uploaded BookShelf files.
 * Adapted from StewardShip's manifest-process reference implementation for the
 * MyAIM v2 architecture (bookshelf_items / bookshelf_chunks / bookshelf_chapters,
 * family_id + member_id identity, bookshelf-files storage bucket).
 *
 * Phases (run sequentially within a single invocation, self-invoking for phase 2):
 *   Phase 1 — Text extraction (PDF/EPUB/DOCX/TXT/MD/image)
 *   Phase 2 — AI classification via Haiku (title, author, genres, tags, summary)
 *   Phase 3 — Chapter-aware chunking + quality filtering
 *   Phase 4 — Chunk DB insert (without embeddings)
 *   Phase 5 — Self-invoke bookshelf-embed for async embedding backfill
 *
 * Status tracking: bookshelf_items.processing_status ('pending' → 'processing'
 *   → 'completed'/'failed') and processing_detail for real-time progress.
 *
 * Request body:
 *   { bookshelf_item_id: string, family_id: string, member_id: string, phase?: string }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://esm.sh/zod@3.23.8'
import { handleCors, jsonHeaders } from '../_shared/cors.ts'
import { authenticateRequest } from '../_shared/auth.ts'
import {
  extractRawTextFromPDF,
  cleanExtractedText,
  extractPDFMetadata,
} from '../_shared/pdf-utils.ts'

// ============================================================
// Environment
// ============================================================

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!

const HAIKU_MODEL = 'anthropic/claude-haiku-4.5'
const STORAGE_BUCKET = 'bookshelf-files'
const MAX_CHUNKS = 500

// Service role client — needed for all bookshelf writes
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// ============================================================
// Input Validation
// ============================================================

const RequestSchema = z.object({
  bookshelf_item_id: z.string().uuid(),
  family_id: z.string().uuid(),
  member_id: z.string().uuid(),
  phase: z.enum(['extract', 'chunk']).optional(),
  book_library_id: z.string().uuid().optional(),
})

// ============================================================
// Types
// ============================================================

interface TocEntry {
  title: string
  level: number
}

interface ChunkRecord {
  text: string
  tokenCount: number
  index: number
  chapterTitle: string | null
  chapterIndex: number
}

interface BookshelfItem {
  id: string
  family_id: string
  uploaded_by: string
  title: string
  author: string | null
  file_type: string
  file_url: string | null
  storage_path: string | null
  processing_status: string
  genres: string[] | null
  tags: string[] | null
  ai_summary: string | null
  book_library_id: string | null
  parent_bookshelf_item_id: string | null
  isbn: string | null
}

/** Resolve the storage path from either file_url or storage_path */
function resolveFilePath(item: BookshelfItem): string | null {
  return item.file_url || item.storage_path || null
}

// ============================================================
// OpenAI Embedding (title+author for cache-hit)
// ============================================================
async function getOpenAIEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text,
    }),
  })
  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI embedding API error: ${response.status} ${error}`)
  }
  const data = await response.json()
  return data.data[0].embedding
}

// ============================================================
// Platform Library cache-hit check + link
// ============================================================
async function linkToBookLibrary(
  bookshelfItemId: string,
  item: BookshelfItem,
): Promise<{ libraryId: string; wasCacheHit: boolean; similarity: number }> {
  // Re-read the item to get the latest title/author (runClassification may have updated them)
  const { data: fresh } = await supabase
    .from('bookshelf_items')
    .select('title, author, isbn, genres, tags, ai_summary')
    .eq('id', bookshelfItemId)
    .single()

  const title = (fresh?.title as string) || item.title
  const author = (fresh?.author as string | null) || item.author
  const isbn = (fresh?.isbn as string | null) || item.isbn || null
  const genres = (fresh?.genres as string[]) || item.genres || []
  const tags = (fresh?.tags as string[]) || item.tags || []
  const aiSummary = (fresh?.ai_summary as string | null) || item.ai_summary || null

  // Generate title+author embedding
  const embeddingText = author ? `${title} by ${author}` : title
  let embeddingJson: string | null = null
  try {
    const embedding = await getOpenAIEmbedding(embeddingText)
    embeddingJson = JSON.stringify(embedding)
  } catch (err) {
    console.error('[bookshelf-process] Title+author embedding failed (non-fatal):', err)
  }

  // Call the upsert RPC for atomic cache-hit check
  const { data, error } = await supabase.rpc('upsert_book_library', {
    p_title: title,
    p_author: author,
    p_isbn: isbn,
    p_genres: genres,
    p_tags: tags,
    p_ai_summary: aiSummary,
    p_toc: null,
    p_title_author_embedding: embeddingJson,
  })

  if (error || !data || data.length === 0) {
    throw new Error(`upsert_book_library failed: ${error?.message || 'no data returned'}`)
  }

  const result = data[0] as { library_id: string; was_cache_hit: boolean; matched_similarity: number }
  const { library_id, was_cache_hit, matched_similarity } = result

  console.log(
    `[bookshelf-process] Library ${was_cache_hit ? 'CACHE HIT' : 'CACHE MISS'}: ` +
      `library_id=${library_id}, similarity=${matched_similarity?.toFixed(4) ?? 'N/A'}, ` +
      `title="${title}"`,
  )

  // Link bookshelf_items → book_library
  const { error: linkErr } = await supabase.rpc('set_bookshelf_item_library_id', {
    p_item_id: bookshelfItemId,
    p_library_id: library_id,
    p_extraction_status: was_cache_hit ? 'completed' : 'none',
    p_chunk_count: 0,
  })
  if (linkErr) {
    console.error('[bookshelf-process] set_bookshelf_item_library_id failed:', linkErr)
  }

  return { libraryId: library_id, wasCacheHit: was_cache_hit, similarity: matched_similarity ?? 0 }
}

// ============================================================
// Main Handler
// ============================================================

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    // Authenticate — supports both user JWT and service role (for self-invoke)
    const auth = await authenticateRequest(req)
    if (auth instanceof Response) return auth

    // Parse and validate input
    const body = await req.json()
    const parsed = RequestSchema.safeParse(body)
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: parsed.error.flatten() }),
        { status: 400, headers: jsonHeaders },
      )
    }

    const { bookshelf_item_id, family_id, member_id, phase, book_library_id: passedLibraryId } = parsed.data

    // Fetch the bookshelf item
    const { data: item, error: fetchErr } = await supabase
      .from('bookshelf_items')
      .select('*')
      .eq('id', bookshelf_item_id)
      .eq('family_id', family_id)
      .single()

    if (fetchErr || !item) {
      return new Response(
        JSON.stringify({ error: 'BookShelf item not found' }),
        { status: 404, headers: jsonHeaders },
      )
    }

    const bookItem = item as BookshelfItem

    // Helper: update processing_detail for real-time progress feedback
    const setDetail = (detail: string) =>
      supabase
        .from('bookshelf_items')
        .update({ processing_detail: detail })
        .eq('id', bookshelf_item_id)

    // Mark as processing
    await supabase
      .from('bookshelf_items')
      .update({ processing_status: 'processing', processing_detail: 'Starting...' })
      .eq('id', bookshelf_item_id)

    // ============================================================
    // Phase 2 (chunk): read text already saved to DB and chunk it
    // ============================================================
    if (phase === 'chunk') {
      const { data: freshItem } = await supabase
        .from('bookshelf_items')
        .select('text_content, title, author, book_library_id')
        .eq('id', bookshelf_item_id)
        .single()

      if (!freshItem?.text_content) {
        await supabase
          .from('bookshelf_items')
          .update({
            processing_status: 'failed',
            processing_detail: 'No text content found for chunking.',
          })
          .eq('id', bookshelf_item_id)
        return new Response(
          JSON.stringify({ error: 'No text content to chunk' }),
          { status: 400, headers: jsonHeaders },
        )
      }

      // Resolve book_library_id: prefer passed value, then DB value
      const resolvedLibraryId = passedLibraryId
        || (freshItem.book_library_id as string | null)
        || null

      return await runChunkPhase(
        bookshelf_item_id,
        family_id,
        member_id,
        freshItem.text_content as string,
        setDetail,
        resolvedLibraryId,
      )
    }

    // ============================================================
    // Phase 1: Text extraction
    // ============================================================
    await setDetail('Downloading file...')

    let fullText = (item.text_content as string | null) || ''

    if (bookItem.file_type === 'pdf') {
      const result = await extractPDF(bookshelf_item_id, bookItem, setDetail)
      if (result instanceof Response) return result
      fullText = result
    } else if (bookItem.file_type === 'epub') {
      const result = await extractEPUB(bookshelf_item_id, bookItem, setDetail)
      if (result instanceof Response) return result
      fullText = result
    } else if (bookItem.file_type === 'docx') {
      const result = await extractDOCX(bookshelf_item_id, bookItem, setDetail)
      if (result instanceof Response) return result
      fullText = result
    } else if (bookItem.file_type === 'txt' || bookItem.file_type === 'md') {
      const result = await extractPlainText(bookshelf_item_id, bookItem, setDetail)
      if (result instanceof Response) return result
      fullText = result
    } else if (bookItem.file_type === 'image') {
      const result = await extractImage(bookshelf_item_id, bookItem, setDetail)
      if (result instanceof Response) return result
      fullText = result
    }
    // text_note: fullText already in item.text_content from upload

    // Guard: no extractable text
    if (!fullText || fullText.trim().length === 0) {
      const failMessage =
        bookItem.file_type === 'pdf'
          ? 'This PDF appears to be scanned or image-only — text extraction and AI vision OCR both failed to recover usable text. Try uploading an EPUB or text version instead.'
          : 'No text content could be extracted from this file.'
      await supabase
        .from('bookshelf_items')
        .update({ processing_status: 'failed', processing_detail: failMessage })
        .eq('id', bookshelf_item_id)
      return new Response(
        JSON.stringify({ error: failMessage, file_type: bookItem.file_type }),
        { status: 400, headers: jsonHeaders },
      )
    }

    // AI classification (Haiku) — run before chunking while text is in memory
    await setDetail('Classifying with AI...')
    try {
      await runClassification(bookshelf_item_id, bookItem, fullText)
    } catch (classErr) {
      // Non-fatal — classification failure doesn't block chunking
      console.error('[bookshelf-process] Classification failed (non-fatal):', classErr)
    }

    // Platform library cache-hit check + link (Phase 1b-B)
    let libraryId: string | null = null
    let wasCacheHit = false
    await setDetail('Checking platform library...')
    try {
      const linkResult = await linkToBookLibrary(bookshelf_item_id, bookItem)
      libraryId = linkResult.libraryId
      wasCacheHit = linkResult.wasCacheHit
    } catch (linkErr) {
      // Non-fatal — library linking failure doesn't block chunking
      console.error('[bookshelf-process] Library linking failed (non-fatal):', linkErr)
    }

    // If cache hit, skip chunking entirely — reuse existing platform chunks
    if (wasCacheHit && libraryId) {
      // Find chunk count from another bookshelf_items row sharing this library
      const { data: siblingItem } = await supabase
        .from('bookshelf_items')
        .select('chunk_count')
        .eq('book_library_id', libraryId)
        .not('id', 'eq', bookshelf_item_id)
        .gt('chunk_count', 0)
        .limit(1)
        .single()
      const existingChunkCount = (siblingItem?.chunk_count as number) || 0

      // Update the current item with the library's chunk count and mark complete
      await supabase
        .from('bookshelf_items')
        .update({
          processing_status: 'completed',
          extraction_status: 'completed',
          chunk_count: existingChunkCount,
          intake_completed: true,
          processing_detail: null,
        })
        .eq('id', bookshelf_item_id)

      console.log(
        `[bookshelf-process] Cache hit — skipped chunking. Reusing library ${libraryId} (${existingChunkCount} chunks)`,
      )

      return new Response(
        JSON.stringify({
          success: true,
          cache_hit: true,
          library_id: libraryId,
          text_length: fullText.trim().length,
        }),
        { headers: jsonHeaders },
      )
    }

    // Self-invoke chunk phase (separate CPU budget) and return immediately
    await supabase
      .from('bookshelf_items')
      .update({ processing_detail: 'Text extracted. Chunking...' })
      .eq('id', bookshelf_item_id)

    supabase.functions
      .invoke('bookshelf-process', {
        body: {
          bookshelf_item_id,
          family_id,
          member_id,
          phase: 'chunk',
          book_library_id: libraryId,
        },
      })
      .catch((err: unknown) => {
        console.warn('[bookshelf-process] Self-invoke chunk phase failed (client will retry):', err)
      })

    return new Response(
      JSON.stringify({
        success: true,
        needs_chunking: true,
        library_id: libraryId,
        text_length: fullText.trim().length,
      }),
      { headers: jsonHeaders },
    )
  } catch (err) {
    console.error('[bookshelf-process] Unhandled error:', err)
    return new Response(
      JSON.stringify({ error: `Processing failed: ${(err as Error).message}` }),
      { status: 500, headers: jsonHeaders },
    )
  }
})

// ============================================================
// Phase 2: Chunking + Chapter Extraction + DB Insert + Embed
// ============================================================

async function runChunkPhase(
  bookshelfItemId: string,
  familyId: string,
  memberId: string,
  fullText: string,
  setDetail: (detail: string) => Promise<unknown>,
  bookLibraryId: string | null = null,
): Promise<Response> {
  await setDetail('Chunking content...')

  const rawChunks = chunkTextWithChapters(fullText)
  let chunks = rawChunks.filter((c) => isQualityChunk(c.text))
  console.log(
    `[bookshelf-process] Chunking: ${rawChunks.length} raw → ${chunks.length} quality chunks (filtered ${rawChunks.length - chunks.length})`,
  )

  // Cap chunks for very large books to stay within Edge Function memory/timeout
  if (chunks.length > MAX_CHUNKS) {
    console.log(
      `[bookshelf-process] Capping ${chunks.length} chunks to ${MAX_CHUNKS} (evenly sampled)`,
    )
    const step = chunks.length / MAX_CHUNKS
    const sampled: typeof chunks = []
    for (let s = 0; s < MAX_CHUNKS; s++) {
      sampled.push(chunks[Math.floor(s * step)])
    }
    chunks = sampled.map((c, idx) => ({ ...c, index: idx }))
  }

  await setDetail(`Chunked into ${chunks.length} segments`)

  if (chunks.length === 0) {
    await supabase
      .from('bookshelf_items')
      .update({
        processing_status: 'failed',
        processing_detail: 'No usable text content found after quality filtering.',
      })
      .eq('id', bookshelfItemId)
    return new Response(
      JSON.stringify({
        error:
          'No usable text content found after quality filtering. The file may contain only images or non-text data.',
      }),
      { status: 400, headers: jsonHeaders },
    )
  }

  // Extract and save chapters
  await setDetail('Saving chapter structure...')
  const chapters = extractChaptersFromChunks(chunks)
  if (chapters.length > 0) {
    // Delete any existing chapters first (re-processing case)
    await supabase
      .from('bookshelf_chapters')
      .delete()
      .eq('bookshelf_item_id', bookshelfItemId)

    const chapterRecords = chapters.map((ch) => ({
      bookshelf_item_id: bookshelfItemId,
      chapter_index: ch.chapterIndex,
      chapter_title: ch.title,
      start_chunk_index: ch.startChunkIndex,
      end_chunk_index: ch.endChunkIndex,
    }))
    const { error: chapErr } = await supabase
      .from('bookshelf_chapters')
      .insert(chapterRecords)
    if (chapErr) {
      console.error('[bookshelf-process] Chapter insert failed (non-fatal):', chapErr)
    }
  }

  // Delete any existing chunks (re-processing case)
  // bookshelf_chunks uses book_cache_id, not bookshelf_item_id
  const chunkDeleteKey = bookLibraryId || bookshelfItemId
  await supabase
    .from('bookshelf_chunks')
    .delete()
    .eq('book_cache_id', chunkDeleteKey)

  // Insert chunks in batches — without embeddings (backfilled async by embed Edge Function)
  const INSERT_BATCH = 200
  let totalChunksInserted = 0
  let totalTokens = 0

  for (let i = 0; i < chunks.length; i += INSERT_BATCH) {
    const batchNum = Math.floor(i / INSERT_BATCH) + 1
    const totalBatches = Math.ceil(chunks.length / INSERT_BATCH)
    await setDetail(`Saving chunks (batch ${batchNum} of ${totalBatches})...`)
    const batch = chunks.slice(i, i + INSERT_BATCH)

    // bookshelf_chunks columns: book_cache_id, chunk_index, chunk_text, token_count
    const batchRecords = batch.map((chunk) => ({
      book_cache_id: chunkDeleteKey,
      chunk_index: chunk.index,
      chunk_text: chunk.text,
      token_count: chunk.tokenCount,
      chapter_title: chunk.chapterTitle,
      chapter_index: chunk.chapterIndex,
    }))

    const { error: insertErr } = await supabase
      .from('bookshelf_chunks')
      .insert(batchRecords)

    if (insertErr) {
      console.error(
        `[bookshelf-process] Chunk insert failed (batch ${batchNum}):`,
        insertErr,
      )
    } else {
      totalChunksInserted += batchRecords.length
      totalTokens += batchRecords.reduce((sum, c) => sum + c.token_count, 0)
    }
  }

  // Phase 1b-B: Dual-write chunks to platform_intelligence.book_chunks
  if (bookLibraryId && totalChunksInserted > 0) {
    await setDetail('Saving to platform library...')
    try {
      // Build JSONB array for the RPC
      const platformChunks = chunks.map((chunk) => ({
        chunk_index: chunk.index,
        text: chunk.text,
        tokens_count: chunk.tokenCount,
        chapter_title: chunk.chapterTitle,
        chapter_index: chunk.chapterIndex,
      }))

      // Insert in batches to avoid oversized RPC payloads
      const PLATFORM_BATCH = 100
      let platformTotal = 0
      for (let i = 0; i < platformChunks.length; i += PLATFORM_BATCH) {
        const batch = platformChunks.slice(i, i + PLATFORM_BATCH)
        const { data: inserted, error: piErr } = await supabase.rpc('insert_book_chunks', {
          p_book_library_id: bookLibraryId,
          p_chunks: batch,
        })
        if (piErr) {
          console.error(
            `[bookshelf-process] Platform chunk insert failed (batch ${Math.floor(i / PLATFORM_BATCH) + 1}):`,
            piErr.message,
          )
        } else {
          platformTotal += (inserted as number) || batch.length
        }
      }
      console.log(
        `[bookshelf-process] Platform chunks dual-write: ${platformTotal} rows to book_library_id=${bookLibraryId}`,
      )
    } catch (piErr) {
      console.error('[bookshelf-process] Platform chunk dual-write failed (non-fatal):', piErr)
    }
  }

  // Trigger embedding backfill via the generic embed function (non-fatal)
  if (OPENAI_API_KEY && totalChunksInserted > 0) {
    await setDetail('Generating embeddings...')
    try {
      await supabase.functions.invoke('embed', {
        body: { bookshelf_item_id: bookshelfItemId, table: 'bookshelf_chunks' },
      })
    } catch (embedErr) {
      console.warn('[bookshelf-process] Async embedding invocation failed (non-fatal):', embedErr)
    }
  }

  // Mark complete
  await supabase
    .from('bookshelf_items')
    .update({
      processing_status: 'completed',
      chunk_count: totalChunksInserted,
      processing_detail: null,
    })
    .eq('id', bookshelfItemId)

  console.log(
    `[bookshelf-process] Complete: ${totalChunksInserted} chunks, ${totalTokens} tokens, ${chapters.length} chapters`,
  )

  return new Response(
    JSON.stringify({
      success: true,
      chunks_created: totalChunksInserted,
      total_tokens: totalTokens,
      chapters_created: chapters.length,
    }),
    { headers: jsonHeaders },
  )
}

// ============================================================
// Extraction: PDF
// ============================================================

async function extractPDF(
  bookshelfItemId: string,
  item: BookshelfItem,
  setDetail: (d: string) => Promise<unknown>,
): Promise<string | Response> {
  try {
    if (!resolveFilePath(item)) throw new Error('No file_url or storage_path for PDF item')

    await setDetail('Downloading PDF...')
    const { data: fileData, error: downloadErr } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(getStoragePath(resolveFilePath(item)!))

    if (downloadErr || !fileData) {
      throw new Error(`Failed to download PDF: ${downloadErr?.message}`)
    }

    const arrayBuffer = await fileData.arrayBuffer()
    const pdfBytes = new Uint8Array(arrayBuffer)

    // Large PDFs: skip unpdf to avoid CPU/memory exhaustion
    const isLargePDF = pdfBytes.length > 1_500_000
    await setDetail(
      isLargePDF
        ? 'Extracting text from large PDF (lightweight mode)...'
        : 'Extracting text from PDF...',
    )

    // Extract raw text and save to DB immediately — if CPU times out, chunk phase can still read it
    const rawText = await extractRawTextFromPDF(pdfBytes, { skipUnpdf: isLargePDF })

    if (rawText && rawText.trim().length > 0) {
      await supabase
        .from('bookshelf_items')
        .update({ text_content: rawText })
        .eq('id', bookshelfItemId)
      console.log(
        `[bookshelf-process/PDF] Saved raw text (${rawText.length} chars) to DB`,
      )

      const cleaned = cleanExtractedText(rawText)
      const fullText = cleaned && cleaned.length > 0 ? cleaned : rawText

      await supabase
        .from('bookshelf_items')
        .update({ text_content: fullText })
        .eq('id', bookshelfItemId)

      // Vision OCR fallback for scanned PDFs
      const minExpectedChars = 200
      if (fullText.trim().length < minExpectedChars && pdfBytes.length > 100_000) {
        console.log(
          `[bookshelf-process/PDF] Only ${fullText.trim().length} chars from ${pdfBytes.length} byte PDF — trying vision OCR`,
        )
        await setDetail('Scanned PDF detected — extracting text via AI vision...')
        const visionText = await extractPDFViaVision(pdfBytes)
        if (visionText && visionText.trim().length > fullText.trim().length) {
          await supabase
            .from('bookshelf_items')
            .update({ text_content: visionText })
            .eq('id', bookshelfItemId)
          return visionText
        }
      }

      // Metadata + TOC (non-fatal, only for smaller PDFs to preserve CPU budget)
      if (pdfBytes.length < 3_000_000) {
        try {
          const pdfMeta = await extractPDFMetadata(pdfBytes)
          const metaUpdate: Record<string, unknown> = {}
          if (pdfMeta.author) metaUpdate.author = pdfMeta.author
          const filenameTitle = getFilenameTitle(resolveFilePath(item) || '')
          const pdfTitleGarbled = isProbablyGarbledTitle(pdfMeta.title)
          const currentTitleLooksGood = item.title && /\s/.test(item.title) && !isProbablyGarbledTitle(item.title)
          if (
            pdfMeta.title &&
            !pdfTitleGarbled &&
            !currentTitleLooksGood &&
            item.title === filenameTitle
          ) {
            metaUpdate.title = pdfMeta.title
          }
          if (Object.keys(metaUpdate).length > 0) {
            await supabase
              .from('bookshelf_items')
              .update(metaUpdate)
              .eq('id', bookshelfItemId)
          }
        } catch (metaErr) {
          console.error('[bookshelf-process/PDF] Metadata extraction failed (non-fatal):', metaErr)
        }
      }

      return fullText
    }

    // rawText was empty — try vision OCR
    if (pdfBytes.length > 100_000) {
      await setDetail('Scanned PDF detected — extracting text via AI vision...')
      const visionText = await extractPDFViaVision(pdfBytes)
      if (visionText && visionText.trim().length > 0) {
        await supabase
          .from('bookshelf_items')
          .update({ text_content: visionText })
          .eq('id', bookshelfItemId)
        return visionText
      }
    }

    return ''
  } catch (pdfErr) {
    console.error('[bookshelf-process/PDF] Extraction failed:', pdfErr)
    await supabase
      .from('bookshelf_items')
      .update({ processing_status: 'failed' })
      .eq('id', bookshelfItemId)
    return new Response(
      JSON.stringify({
        error: `PDF processing failed: ${(pdfErr as Error).message}`,
      }),
      { status: 500, headers: jsonHeaders },
    )
  }
}

// ============================================================
// Extraction: EPUB
// ============================================================

async function extractEPUB(
  bookshelfItemId: string,
  item: BookshelfItem,
  setDetail: (d: string) => Promise<unknown>,
): Promise<string | Response> {
  try {
    if (!resolveFilePath(item)) throw new Error('No file_url or storage_path for EPUB item')

    await setDetail('Downloading EPUB...')
    const { data: fileData, error: downloadErr } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(getStoragePath(resolveFilePath(item)!))

    if (downloadErr || !fileData) {
      throw new Error(`Failed to download EPUB: ${downloadErr?.message}`)
    }

    const blobSize = fileData.size
    console.log(
      `[bookshelf-process/EPUB] Downloaded ${blobSize} bytes (${Math.round(blobSize / 1024 / 1024)}MB)`,
    )

    await setDetail(
      blobSize > 20_000_000
        ? `Extracting text from large EPUB (${Math.round(blobSize / 1024 / 1024)}MB) — skipping images...`
        : 'Extracting text from EPUB...',
    )

    const arrayBuffer = await fileData.arrayBuffer()
    const epubFiles = await unzipEPUBContentOnly(new Uint8Array(arrayBuffer))
    const entryCount = Object.keys(epubFiles).length
    const decompressedSize = Object.values(epubFiles).reduce((sum, v) => sum + v.length, 0)
    console.log(
      `[bookshelf-process/EPUB] Unzipped ${entryCount} content entries (${Math.round(decompressedSize / 1024)}KB text) from ${Math.round(blobSize / 1024 / 1024)}MB archive`,
    )

    const fullText = extractTextFromEPUBFiles(epubFiles)

    await supabase
      .from('bookshelf_items')
      .update({ text_content: fullText })
      .eq('id', bookshelfItemId)

    // Metadata extraction (non-fatal)
    try {
      const epubMeta = extractMetadataFromEPUBFiles(epubFiles)
      const metaUpdate: Record<string, unknown> = {}
      if (epubMeta.author) metaUpdate.author = epubMeta.author
      if (epubMeta.isbn) metaUpdate.isbn = epubMeta.isbn
      const filenameTitle = getFilenameTitle(resolveFilePath(item) || '')
      const epubTitleGarbled = isProbablyGarbledTitle(epubMeta.title)
      const currentTitleLooksGood = item.title && /\s/.test(item.title) && !isProbablyGarbledTitle(item.title)
      if (
        epubMeta.title &&
        !epubTitleGarbled &&
        !currentTitleLooksGood &&
        item.title === filenameTitle
      ) {
        metaUpdate.title = epubMeta.title
      }
      if (Object.keys(metaUpdate).length > 0) {
        await supabase
          .from('bookshelf_items')
          .update(metaUpdate)
          .eq('id', bookshelfItemId)
      }
    } catch (metaErr) {
      console.error('[bookshelf-process/EPUB] Metadata extraction failed (non-fatal):', metaErr)
    }

    return fullText
  } catch (epubErr) {
    console.error('[bookshelf-process/EPUB] Extraction failed:', epubErr)
    await supabase
      .from('bookshelf_items')
      .update({ processing_status: 'failed' })
      .eq('id', bookshelfItemId)
    return new Response(
      JSON.stringify({
        error: `EPUB processing failed: ${(epubErr as Error).message}`,
      }),
      { status: 500, headers: jsonHeaders },
    )
  }
}

// ============================================================
// Extraction: DOCX
// ============================================================

async function extractDOCX(
  bookshelfItemId: string,
  item: BookshelfItem,
  setDetail: (d: string) => Promise<unknown>,
): Promise<string | Response> {
  try {
    if (!resolveFilePath(item)) throw new Error('No file_url or storage_path for DOCX item')

    await setDetail('Downloading DOCX...')
    const { data: fileData, error: downloadErr } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(getStoragePath(resolveFilePath(item)!))

    if (downloadErr || !fileData) {
      throw new Error(`Failed to download DOCX: ${downloadErr?.message}`)
    }

    await setDetail('Extracting text from DOCX...')
    const arrayBuffer = await fileData.arrayBuffer()
    const docxFiles = await unzipDOCXContentOnly(new Uint8Array(arrayBuffer))
    const fullText = extractTextFromDOCXFiles(docxFiles)

    await supabase
      .from('bookshelf_items')
      .update({ text_content: fullText })
      .eq('id', bookshelfItemId)

    // Metadata extraction (non-fatal)
    try {
      const docxMeta = extractMetadataFromDOCXFiles(docxFiles)
      const metaUpdate: Record<string, unknown> = {}
      if (docxMeta.author) metaUpdate.author = docxMeta.author
      const filenameTitle = getFilenameTitle(resolveFilePath(item) || '')
      if (docxMeta.title && item.title === filenameTitle) {
        metaUpdate.title = docxMeta.title
      }
      if (Object.keys(metaUpdate).length > 0) {
        await supabase
          .from('bookshelf_items')
          .update(metaUpdate)
          .eq('id', bookshelfItemId)
      }
    } catch (metaErr) {
      console.error('[bookshelf-process/DOCX] Metadata extraction failed (non-fatal):', metaErr)
    }

    return fullText
  } catch (docxErr) {
    console.error('[bookshelf-process/DOCX] Extraction failed:', docxErr)
    await supabase
      .from('bookshelf_items')
      .update({ processing_status: 'failed' })
      .eq('id', bookshelfItemId)
    return new Response(
      JSON.stringify({
        error: `DOCX processing failed: ${(docxErr as Error).message}`,
      }),
      { status: 500, headers: jsonHeaders },
    )
  }
}

// ============================================================
// Extraction: Plain Text / Markdown
// ============================================================

async function extractPlainText(
  bookshelfItemId: string,
  item: BookshelfItem,
  setDetail: (d: string) => Promise<unknown>,
): Promise<string | Response> {
  try {
    if (!resolveFilePath(item)) throw new Error('No file_url or storage_path for text item')

    await setDetail('Downloading file...')
    const { data: fileData, error: downloadErr } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(getStoragePath(resolveFilePath(item)!))

    if (downloadErr || !fileData) {
      throw new Error(`Failed to download file: ${downloadErr?.message}`)
    }

    const fullText = await fileData.text()

    await supabase
      .from('bookshelf_items')
      .update({ text_content: fullText })
      .eq('id', bookshelfItemId)

    return fullText
  } catch (txtErr) {
    console.error('[bookshelf-process/TXT] Extraction failed:', txtErr)
    await supabase
      .from('bookshelf_items')
      .update({ processing_status: 'failed' })
      .eq('id', bookshelfItemId)
    return new Response(
      JSON.stringify({
        error: `Text processing failed: ${(txtErr as Error).message}`,
      }),
      { status: 500, headers: jsonHeaders },
    )
  }
}

// ============================================================
// Extraction: Image (vision OCR)
// ============================================================

async function extractImage(
  bookshelfItemId: string,
  item: BookshelfItem,
  setDetail: (d: string) => Promise<unknown>,
): Promise<string | Response> {
  try {
    if (!resolveFilePath(item)) throw new Error('No file_url or storage_path for image item')

    await setDetail('Analyzing image with AI vision...')
    const visionText = await extractViaVision(resolveFilePath(item)!)

    if (visionText) {
      await supabase
        .from('bookshelf_items')
        .update({ text_content: visionText })
        .eq('id', bookshelfItemId)
      return visionText
    }

    return ''
  } catch (imgErr) {
    console.error('[bookshelf-process/Image] Extraction failed:', imgErr)
    await supabase
      .from('bookshelf_items')
      .update({ processing_status: 'failed' })
      .eq('id', bookshelfItemId)
    return new Response(
      JSON.stringify({
        error: `Image processing failed: ${(imgErr as Error).message}`,
      }),
      { status: 500, headers: jsonHeaders },
    )
  }
}

// ============================================================
// AI Classification (Haiku)
// ============================================================

async function runClassification(
  bookshelfItemId: string,
  item: BookshelfItem,
  fullText: string,
): Promise<void> {
  if (!OPENROUTER_API_KEY) return

  // Use first ~2000 chars for classification (title page, intro, opening content)
  const sample = fullText.substring(0, 2000)

  const prompt = `Analyze this book excerpt and return a JSON object with these fields:
- title: string (the book's title, or null if already clear from metadata)
- author: string (the author's name, or null if not found)
- genres: string[] (1-3 genre tags, e.g. ["personal development", "faith", "parenting"])
- tags: string[] (3-6 descriptive tags, e.g. ["marriage", "communication", "habits"])
- ai_summary: string (1-2 sentence summary of what this book is about)

Current title: "${item.title}"
Current author: "${item.author || 'unknown'}"

Book excerpt:
${sample}

Return ONLY a valid JSON object. No markdown, no explanation.`

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://myaimcentral.com',
      'X-Title': 'MyAIM Central BookShelf',
    },
    body: JSON.stringify({
      model: HAIKU_MODEL,
      max_tokens: 512,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!response.ok) {
    throw new Error(`Haiku classification API error: ${response.status}`)
  }

  const data = await response.json()
  const content = (data.choices?.[0]?.message?.content as string) || ''

  try {
    // Strip any markdown fences if present
    const jsonStr = content.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim()
    const classification = JSON.parse(jsonStr) as {
      title?: string
      author?: string
      genres?: string[]
      tags?: string[]
      ai_summary?: string
    }

    const update: Record<string, unknown> = {}

    // Only update title/author if current value looks like a raw filename
    const filenameTitle = getFilenameTitle(resolveFilePath(item) || '')
    // Also check: title has no spaces and contains underscores/hyphens → likely a filename
    const looksLikeFilename = item.title && !/\s/.test(item.title) && /[_-]/.test(item.title)
    const currentTitleIsFilename = !item.title || item.title === filenameTitle || looksLikeFilename
    if (classification.title && currentTitleIsFilename) {
      update.title = classification.title
    }
    if (classification.author && !item.author) {
      update.author = classification.author
    }
    if (classification.genres && classification.genres.length > 0) {
      update.genres = classification.genres
    }
    if (classification.tags && classification.tags.length > 0) {
      update.tags = classification.tags
    }
    if (classification.ai_summary) {
      update.ai_summary = classification.ai_summary
    }

    if (Object.keys(update).length > 0) {
      await supabase
        .from('bookshelf_items')
        .update(update)
        .eq('id', bookshelfItemId)
      console.log(
        `[bookshelf-process] Classification saved: ${JSON.stringify(Object.keys(update))}`,
      )
    }
  } catch (parseErr) {
    console.error('[bookshelf-process] Classification JSON parse failed (non-fatal):', parseErr)
  }
}

// ============================================================
// Vision OCR: PDF (bytes → base64 → Haiku)
// ============================================================

async function extractPDFViaVision(pdfBytes: Uint8Array): Promise<string | null> {
  if (!OPENROUTER_API_KEY) {
    console.error('[bookshelf-process/PDFVision] No OPENROUTER_API_KEY')
    return null
  }

  try {
    const MAX_PDF_VISION_BYTES = 10_000_000 // 10MB cap
    const bytesToSend =
      pdfBytes.length > MAX_PDF_VISION_BYTES
        ? pdfBytes.subarray(0, MAX_PDF_VISION_BYTES)
        : pdfBytes

    // Encode in chunks to avoid stack overflow on large files
    let binary = ''
    const chunkSize = 8192
    for (let i = 0; i < bytesToSend.length; i += chunkSize) {
      binary += String.fromCharCode(...bytesToSend.subarray(i, i + chunkSize))
    }
    const base64 = btoa(binary)
    const dataUri = `data:application/pdf;base64,${base64}`

    console.log(
      `[bookshelf-process/PDFVision] Sending ${bytesToSend.length} bytes to Haiku vision`,
    )

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://myaimcentral.com',
        'X-Title': 'MyAIM Central BookShelf',
      },
      body: JSON.stringify({
        model: HAIKU_MODEL,
        max_tokens: 16384,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'This is a scanned or image-based PDF book. Extract ALL readable text from every page, preserving the reading order, paragraph structure, and chapter/section headings. Include page numbers if visible. Return only the extracted text as structured plain text. Do not add commentary, interpretation, or summaries.',
              },
              { type: 'image_url', image_url: { url: dataUri } },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      console.error(`[bookshelf-process/PDFVision] API error (${response.status}):`, await response.text())
      return null
    }

    const data = await response.json()
    const content = (data.choices?.[0]?.message?.content as string) || ''
    console.log(`[bookshelf-process/PDFVision] Extracted ${content.length} chars via vision OCR`)
    return content.trim() || null
  } catch (err) {
    console.error('[bookshelf-process/PDFVision] Extraction failed:', err)
    return null
  }
}

// ============================================================
// Vision OCR: Image (URL → download → base64 → Haiku)
// ============================================================

async function extractViaVision(fileUrl: string): Promise<string | null> {
  if (!OPENROUTER_API_KEY) {
    console.error('[bookshelf-process/ImageVision] No OPENROUTER_API_KEY')
    return null
  }

  try {
    const { data: fileData, error: downloadErr } = await supabase.storage
      .from(STORAGE_BUCKET)
      .download(getStoragePath(fileUrl))

    if (downloadErr || !fileData) {
      console.error('[bookshelf-process/ImageVision] Download failed:', downloadErr?.message)
      return null
    }

    const ext = fileUrl.split('.').pop()?.toLowerCase() || ''
    const mimeMap: Record<string, string> = {
      png: 'image/png',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      webp: 'image/webp',
    }
    const mimeType = mimeMap[ext]
    if (!mimeType) {
      console.error(
        `[bookshelf-process/ImageVision] Unsupported format "${ext}" — only PNG/JPG/WEBP supported`,
      )
      return null
    }

    const arrayBuffer = await fileData.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    let binary = ''
    const chunkSize = 8192
    for (let i = 0; i < bytes.length; i += chunkSize) {
      binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
    }
    const base64 = btoa(binary)
    const dataUri = `data:${mimeType};base64,${base64}`

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://myaimcentral.com',
        'X-Title': 'MyAIM Central BookShelf',
      },
      body: JSON.stringify({
        model: HAIKU_MODEL,
        max_tokens: 4096,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Extract all text, data, and information from this image. If it contains a chart or graph, describe the data points, axes, labels, values, and trends in structured plain text. If it contains a table, reproduce the table data. If it contains handwritten or printed text, transcribe it. Return only the extracted content as plain text, structured for readability. Do not add commentary or interpretation.',
              },
              { type: 'image_url', image_url: { url: dataUri } },
            ],
          },
        ],
      }),
    })

    if (!response.ok) {
      console.error(`[bookshelf-process/ImageVision] API error (${response.status}):`, await response.text())
      return null
    }

    const data = await response.json()
    const content = (data.choices?.[0]?.message?.content as string) || ''
    return content.trim() || null
  } catch (err) {
    console.error('[bookshelf-process/ImageVision] Extraction failed:', err)
    return null
  }
}

// ============================================================
// EPUB Helpers
// ============================================================

async function unzipEPUBContentOnly(bytes: Uint8Array): Promise<Record<string, Uint8Array>> {
  const { unzipSync } = await import('https://esm.sh/fflate@0.8.2')

  const CONTENT_EXTENSIONS = ['.xml', '.xhtml', '.html', '.htm', '.opf', '.ncx']
  const SKIP_EXTENSIONS = [
    '.jpg', '.jpeg', '.png', '.gif', '.svg', '.webp', '.bmp', '.tiff', '.ico',
    '.ttf', '.otf', '.woff', '.woff2', '.eot',
    '.css', '.js',
    '.mp3', '.mp4', '.ogg', '.wav', '.m4a',
    '.pdf',
  ]

  const files = unzipSync(bytes, {
    filter(file: { name: string }) {
      const name = file.name.toLowerCase()
      if (name.startsWith('meta-inf/')) return true
      if (SKIP_EXTENSIONS.some((ext) => name.endsWith(ext))) return false
      if (CONTENT_EXTENSIONS.some((ext) => name.endsWith(ext))) return true
      if (name.endsWith('/')) return false
      return false
    },
  })

  console.log(
    `[bookshelf-process/EPUB] Unzipped ${Object.keys(files).length} content files`,
  )
  return files
}

function extractTextFromEPUBFiles(files: Record<string, Uint8Array>): string {
  const containerBytes = files['META-INF/container.xml']
  if (!containerBytes) throw new Error('Invalid EPUB: no META-INF/container.xml')

  const containerXml = new TextDecoder().decode(containerBytes)
  const opfPathMatch = containerXml.match(/full-path="([^"]+)"/)
  const opfPath = opfPathMatch?.[1] || ''
  if (!opfPath || !files[opfPath]) throw new Error('Invalid EPUB: cannot locate OPF file')

  const opfContent = new TextDecoder().decode(files[opfPath])
  const opfDir = opfPath.substring(0, opfPath.lastIndexOf('/') + 1)

  // Build manifest: id → href for XHTML content
  const manifestItems = new Map<string, string>()
  const itemRegex = /<item\s+([^>]*)\/?\s*>/g
  let match: RegExpExecArray | null

  while ((match = itemRegex.exec(opfContent)) !== null) {
    const attrs = match[1]
    const idMatch = attrs.match(/id="([^"]+)"/)
    const hrefMatch = attrs.match(/href="([^"]+)"/)
    const typeMatch = attrs.match(/media-type="([^"]+)"/)
    if (idMatch && hrefMatch && typeMatch) {
      const mediaType = typeMatch[1]
      if (
        mediaType === 'application/xhtml+xml' ||
        mediaType === 'text/html'
      ) {
        manifestItems.set(idMatch[1], hrefMatch[1])
      }
    }
  }

  // Spine order
  const spineRegex = /<itemref\s+idref="([^"]+)"[^>]*\/?>/g
  const spineOrder: string[] = []
  while ((match = spineRegex.exec(opfContent)) !== null) {
    spineOrder.push(match[1])
  }

  const textParts: string[] = []

  for (const itemId of spineOrder) {
    const href = manifestItems.get(itemId)
    if (!href) continue
    const filePath = opfDir + decodeURIComponent(href)
    const fileBytes = files[filePath]
    if (!fileBytes) continue
    const html = new TextDecoder().decode(fileBytes)
    const text = stripHtmlTags(html)
    if (text.trim().length > 0) textParts.push(text.trim())
  }

  // Fallback: alphabetical XHTML files
  if (textParts.length === 0) {
    const xhtmlPaths = Object.keys(files)
      .filter((p) => p.endsWith('.xhtml') || p.endsWith('.html') || p.endsWith('.htm'))
      .sort()
    for (const path of xhtmlPaths) {
      const html = new TextDecoder().decode(files[path])
      const text = stripHtmlTags(html)
      if (text.trim().length > 50) textParts.push(text.trim())
    }
  }

  return textParts.join('\n\n---\n\n')
}

interface EpubMetadata {
  title: string | null
  author: string | null
  isbn: string | null
}

function extractMetadataFromEPUBFiles(files: Record<string, Uint8Array>): EpubMetadata {
  try {
    const containerBytes = files['META-INF/container.xml']
    if (!containerBytes) return { title: null, author: null, isbn: null }

    const containerXml = new TextDecoder().decode(containerBytes)
    const opfPathMatch = containerXml.match(/full-path="([^"]+)"/)
    const opfPath = opfPathMatch?.[1] || ''
    if (!opfPath || !files[opfPath]) return { title: null, author: null, isbn: null }

    const opfContent = new TextDecoder().decode(files[opfPath])

    const titleMatch = opfContent.match(/<dc:title[^>]*>([^<]+)<\/dc:title>/i)
    const title = titleMatch?.[1]?.trim() || null

    const authorRegex = /<dc:creator[^>]*>([^<]+)<\/dc:creator>/gi
    const authors: string[] = []
    let authorMatch: RegExpExecArray | null
    while ((authorMatch = authorRegex.exec(opfContent)) !== null) {
      const a = authorMatch[1].trim()
      if (a) authors.push(a)
    }
    const author = authors.length > 0 ? authors.join(', ') : null

    const identifierRegex = /<dc:identifier[^>]*>([^<]+)<\/dc:identifier>/gi
    let isbn: string | null = null
    let idMatch: RegExpExecArray | null
    while ((idMatch = identifierRegex.exec(opfContent)) !== null) {
      const fullTag = opfContent.substring(
        opfContent.lastIndexOf('<dc:identifier', idMatch.index),
        idMatch.index + idMatch[0].length,
      )
      const value = idMatch[1].trim()
      if (
        /scheme\s*=\s*["']ISBN["']/i.test(fullTag) ||
        /opf:scheme\s*=\s*["']ISBN["']/i.test(fullTag)
      ) {
        isbn = value.replace(/^urn:isbn:/i, '').replace(/[^0-9X-]/gi, '')
        break
      }
      const cleaned = value.replace(/^urn:isbn:/i, '').replace(/[^0-9X]/gi, '')
      if (/^(\d{10}|\d{13}|\d{9}X)$/i.test(cleaned)) {
        isbn = cleaned
      }
    }

    return { title, author, isbn }
  } catch (err) {
    console.error('[bookshelf-process/EPUB] Metadata extraction failed (non-fatal):', err)
    return { title: null, author: null, isbn: null }
  }
}

// ============================================================
// DOCX Helpers
// ============================================================

async function unzipDOCXContentOnly(bytes: Uint8Array): Promise<Record<string, Uint8Array>> {
  const { unzipSync } = await import('https://esm.sh/fflate@0.8.2')

  const files = unzipSync(bytes, {
    filter(file: { name: string }) {
      const name = file.name.toLowerCase()
      if (name.endsWith('.xml') || name.endsWith('.rels')) return true
      return false
    },
  })

  console.log(
    `[bookshelf-process/DOCX] Unzipped ${Object.keys(files).length} content files`,
  )
  return files
}

function extractTextFromDOCXFiles(files: Record<string, Uint8Array>): string {
  const documentXml = files['word/document.xml']
  if (!documentXml) throw new Error('Invalid DOCX: no word/document.xml found')

  const xml = new TextDecoder().decode(documentXml)
  const textParts: string[] = []
  const paragraphs = xml.split(/<w:p[ >]/)

  for (const para of paragraphs) {
    const textRunRegex = /<w:t[^>]*>([^<]*)<\/w:t>/g
    let runMatch: RegExpExecArray | null
    const paraText: string[] = []
    while ((runMatch = textRunRegex.exec(para)) !== null) {
      paraText.push(runMatch[1])
    }
    if (paraText.length > 0) textParts.push(paraText.join(''))
  }

  return textParts.join('\n').replace(/\n{3,}/g, '\n\n').trim()
}

interface DocxMetadata {
  title: string | null
  author: string | null
}

function extractMetadataFromDOCXFiles(files: Record<string, Uint8Array>): DocxMetadata {
  try {
    const coreXml = files['docProps/core.xml'] || files['docprops/core.xml']
    if (!coreXml) return { title: null, author: null }

    const xml = new TextDecoder().decode(coreXml)

    const titleMatch = xml.match(/<dc:title>([^<]+)<\/dc:title>/i)
    const rawTitle = titleMatch?.[1]?.trim() || null

    const creatorMatch = xml.match(/<dc:creator>([^<]+)<\/dc:creator>/i)
    const rawAuthor = creatorMatch?.[1]?.trim() || null

    const author =
      rawAuthor && !/^(Microsoft Office User|Unknown|Author)$/i.test(rawAuthor)
        ? rawAuthor
        : null
    const title = rawTitle && rawTitle.length > 1 ? rawTitle : null

    return { title, author }
  } catch (err) {
    console.error('[bookshelf-process/DOCX] Metadata extraction failed (non-fatal):', err)
    return { title: null, author: null }
  }
}

// ============================================================
// HTML Stripping (EPUB)
// ============================================================

function stripHtmlTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<\/?(p|div|br|h[1-6]|li|tr)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#x27;/g, "'")
    .replace(/&#(\d+);/g, (_m, code) => String.fromCharCode(parseInt(code, 10)))
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// ============================================================
// Chunking (chapter-aware)
// ============================================================

/**
 * Chapter heading patterns — used to detect chapter boundaries and annotate chunks.
 * Matches: "Chapter 1", "CHAPTER ONE", "Part II", "1.", "Introduction", "Epilogue", etc.
 */
const CHAPTER_PATTERNS = [
  /^chapter\s+[\divxlcIVXLC]+/i,
  /^part\s+[\divxlcIVXLC]+/i,
  /^section\s+[\divxlcIVXLC]+/i,
  /^\d{1,2}\.\s+[A-Z]/,
  /^introduction$/i,
  /^prologue$/i,
  /^epilogue$/i,
  /^conclusion$/i,
  /^afterword$/i,
  /^foreword$/i,
  /^preface$/i,
  /^acknowledgments?$/i,
]

function detectChapterTitle(line: string): boolean {
  const trimmed = line.trim()
  if (trimmed.length < 3 || trimmed.length > 100) return false
  return CHAPTER_PATTERNS.some((p) => p.test(trimmed))
}

/**
 * Chapter-aware chunking.
 * Chunks NEVER cross chapter boundaries. Within each chapter, uses
 * target ~750 tokens (~3000 chars) with 100 token (~400 char) overlap.
 * Break preference: paragraph > sentence > hard cut.
 */
function chunkTextWithChapters(
  text: string,
  targetTokens = 750,
  overlapTokens = 100,
): ChunkRecord[] {
  const targetChars = targetTokens * 4
  const overlapChars = overlapTokens * 4

  // Split text into chapter segments
  const lines = text.split('\n')
  const segments: Array<{ title: string | null; text: string }> = []
  let currentTitle: string | null = null
  let currentLines: string[] = []

  for (const line of lines) {
    if (detectChapterTitle(line)) {
      if (currentLines.length > 0) {
        segments.push({ title: currentTitle, text: currentLines.join('\n') })
      }
      currentTitle = line.trim()
      currentLines = []
    } else {
      currentLines.push(line)
    }
  }
  if (currentLines.length > 0) {
    segments.push({ title: currentTitle, text: currentLines.join('\n') })
  }

  // If no chapters detected, treat entire text as a single segment
  if (segments.length === 0) {
    segments.push({ title: null, text })
  }

  const allChunks: ChunkRecord[] = []
  let globalIndex = 0
  let chapterIndex = 0

  for (const segment of segments) {
    const segText = segment.text.trim()
    if (!segText) continue

    if (segText.length <= targetChars) {
      allChunks.push({
        text: segText,
        tokenCount: Math.ceil(segText.length / 4),
        index: globalIndex++,
        chapterTitle: segment.title,
        chapterIndex,
      })
    } else {
      // Chunk this segment without crossing its boundary
      let start = 0
      while (start < segText.length) {
        let end = Math.min(start + targetChars, segText.length)

        if (end < segText.length) {
          const paraBreak = segText.lastIndexOf('\n\n', end)
          if (paraBreak > start + targetChars * 0.5) {
            end = paraBreak + 2
          } else {
            const sentBreak = segText.lastIndexOf('. ', end)
            if (sentBreak > start + targetChars * 0.5) {
              end = sentBreak + 2
            }
          }
        }

        const chunk = segText.slice(start, end).trim()
        if (chunk.length > 0) {
          allChunks.push({
            text: chunk,
            tokenCount: Math.ceil(chunk.length / 4),
            index: globalIndex++,
            chapterTitle: segment.title,
            chapterIndex,
          })
        }

        const nextStart = end - overlapChars
        start = nextStart > start ? nextStart : end
      }
    }

    chapterIndex++
  }

  return allChunks
}

// ============================================================
// Chapter Record Extraction (for bookshelf_chapters table)
// ============================================================

interface ChapterRecord {
  chapterIndex: number
  title: string
  startChunkIndex: number
  endChunkIndex: number
}

function extractChaptersFromChunks(chunks: ChunkRecord[]): ChapterRecord[] {
  const chapterMap = new Map<number, { title: string; startIdx: number; endIdx: number }>()

  for (const chunk of chunks) {
    if (chunk.chapterTitle === null) continue
    const existing = chapterMap.get(chunk.chapterIndex)
    if (!existing) {
      chapterMap.set(chunk.chapterIndex, {
        title: chunk.chapterTitle,
        startIdx: chunk.index,
        endIdx: chunk.index,
      })
    } else {
      existing.endIdx = chunk.index
    }
  }

  const records: ChapterRecord[] = []
  for (const [chapterIndex, data] of chapterMap) {
    records.push({
      chapterIndex,
      title: data.title,
      startChunkIndex: data.startIdx,
      endChunkIndex: data.endIdx,
    })
  }

  return records.sort((a, b) => a.chapterIndex - b.chapterIndex)
}

// ============================================================
// Quality Filter
// ============================================================

/**
 * Filter out garbage chunks — PDF metadata, ICC color profiles, binary artifacts.
 * Quality text has mostly letters/spaces and forms coherent sentences.
 */
function isQualityChunk(text: string): boolean {
  if (text.length < 50) return false

  const letters = text.replace(/[^a-zA-Z\s]/g, '').length
  const ratio = letters / text.length
  if (ratio < 0.5) return false

  const garbagePatterns = [
    /ICCBased|ColorSpace|\/Filter/i,
    /Hewlett-Packard|Copyright.*HP/i,
    /IEC\s*61966/i,
    /Reference Viewing Condition/i,
    /\/Type\s*\/\w+/,
    /obj\s*<<|endobj|xref|trailer/,
    /stream\r?\nendstream/,
    /\/Length\s+\d+\s*\/Filter/,
    /\/FontDescriptor|\/BaseFont|\/Encoding/,
    /sRGB\s*IEC/i,
  ]
  for (const pattern of garbagePatterns) {
    if (pattern.test(text)) return false
  }

  const words = text.split(/\s+/).filter((w) => w.length > 1)
  if (words.length < 5) return false

  return true
}

// ============================================================
// Utility Helpers
// ============================================================

/**
 * Extract the storage path from a full public URL or return as-is if already a path.
 * Supabase Storage URLs look like: https://<project>.supabase.co/storage/v1/object/public/bookshelf-files/<path>
 */
function getStoragePath(fileUrl: string): string {
  if (!fileUrl.startsWith('http')) return fileUrl
  const marker = `/object/public/${STORAGE_BUCKET}/`
  const idx = fileUrl.indexOf(marker)
  if (idx !== -1) return fileUrl.substring(idx + marker.length)
  // Fallback: return everything after the last bucket name occurrence
  const bucketMarker = `/${STORAGE_BUCKET}/`
  const bidx = fileUrl.lastIndexOf(bucketMarker)
  if (bidx !== -1) return fileUrl.substring(bidx + bucketMarker.length)
  return fileUrl
}

/**
 * Extract filename-based title (strips extension).
 * Used to detect whether a title is still the auto-assigned filename default.
 */
function getFilenameTitle(fileUrl: string): string {
  const parts = fileUrl.split('/')
  const filename = parts[parts.length - 1] || ''
  return filename.replace(/\.[^.]+$/, '')
}

/**
 * Detect garbled title values (Kindle IDs, .azw extensions, all-caps with no spaces).
 */
function isProbablyGarbledTitle(title: string | null | undefined): boolean {
  if (!title) return true
  if (!/\s/.test(title) && /[!@#$%^&]|^[A-Z0-9]{20,}/.test(title)) return true
  if (/^CR![A-Z0-9]+/i.test(title)) return true
  if (/\.(azw|mobi|azw3)$/i.test(title)) return true
  return false
}
