// MyAIM Central — Generic Embedding Edge Function
// Polls tables for rows with NULL embeddings, calls OpenAI text-embedding-3-small,
// writes halfvec(1536) back to source table.
// Called by pg_cron every 10 seconds or manually via HTTP POST.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const EMBEDDING_MODEL = 'text-embedding-3-small'
const DEFAULT_BATCH_SIZE = 50

// ============================================================
// Table configuration
// ============================================================
interface TableConfig {
  textColumns: string[]
  embeddingColumn: string
  activeFilter: 'is_deleted' | 'archived_at' | 'none'
}

const TABLE_CONFIG: Record<string, TableConfig> = {
  // === BookShelf tables (PRD-23) ===
  bookshelf_chunks: {
    textColumns: ['chunk_text'],
    embeddingColumn: 'embedding',
    activeFilter: 'none',
  },
  bookshelf_summaries: {
    textColumns: ['text'],
    embeddingColumn: 'embedding',
    activeFilter: 'is_deleted',
  },
  bookshelf_insights: {
    textColumns: ['text'],
    embeddingColumn: 'embedding',
    activeFilter: 'is_deleted',
  },
  bookshelf_declarations: {
    textColumns: ['declaration_text'],
    embeddingColumn: 'embedding',
    activeFilter: 'is_deleted',
  },
  bookshelf_action_steps: {
    textColumns: ['text'],
    embeddingColumn: 'embedding',
    activeFilter: 'is_deleted',
  },
  bookshelf_questions: {
    textColumns: ['text'],
    embeddingColumn: 'embedding',
    activeFilter: 'is_deleted',
  },
  // === Personal growth tables ===
  guiding_stars: {
    textColumns: ['content', 'description'],
    embeddingColumn: 'embedding',
    activeFilter: 'archived_at',
  },
  self_knowledge: {
    textColumns: ['content'],
    embeddingColumn: 'embedding',
    activeFilter: 'archived_at',
  },
  journal_entries: {
    textColumns: ['content'],
    embeddingColumn: 'embedding',
    activeFilter: 'archived_at',
  },
  best_intentions: {
    textColumns: ['statement', 'description'],
    embeddingColumn: 'embedding',
    activeFilter: 'archived_at',
  },
  archive_context_items: {
    textColumns: ['context_field', 'context_value'],
    embeddingColumn: 'embedding',
    activeFilter: 'none',
  },
}

// ============================================================
// OpenAI embedding call
// ============================================================
async function getEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: EMBEDDING_MODEL,
      input: text,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`OpenAI API error: ${response.status} ${error}`)
  }

  const data = await response.json()
  return data.data[0].embedding
}

// ============================================================
// Fetch rows with NULL embeddings from a table
// ============================================================
async function fetchUnembeddedRows(
  tableName: string,
  config: TableConfig,
  limit: number,
): Promise<Array<{ id: string; [key: string]: unknown }>> {
  const selectCols = ['id', ...config.textColumns].join(', ')

  let query = supabase
    .from(tableName)
    .select(selectCols)
    .is(config.embeddingColumn, null)
    .limit(limit)

  if (config.activeFilter === 'is_deleted') {
    query = query.eq('is_deleted', false)
  } else if (config.activeFilter === 'archived_at') {
    query = query.is('archived_at', null)
  }

  const { data, error } = await query

  if (error) {
    console.error(`Error fetching from ${tableName}:`, error.message)
    return []
  }

  return data || []
}

// ============================================================
// Build text string from row columns
// ============================================================
function buildText(config: TableConfig, row: Record<string, unknown>): string {
  return config.textColumns
    .map((col) => row[col])
    .filter(Boolean)
    .join(' ')
}

// ============================================================
// Write embedding back to row
// ============================================================
async function writeEmbedding(
  tableName: string,
  recordId: string,
  embedding: number[],
  embeddingColumn: string,
): Promise<boolean> {
  const { error } = await supabase
    .from(tableName)
    .update({ [embeddingColumn]: JSON.stringify(embedding) })
    .eq('id', recordId)

  if (error) {
    console.error(`Failed to write embedding for ${tableName}.${recordId}:`, error.message)
    return false
  }
  return true
}

// ============================================================
// Handle platform_intelligence.book_cache via RPC
// (not accessible via PostgREST — different schema)
// ============================================================
async function processBookCache(limit: number): Promise<{ processed: number; failed: number }> {
  let processed = 0
  let failed = 0

  const { data, error } = await supabase.rpc('get_unembedded_book_cache', { p_limit: limit })

  if (error) {
    // RPC not available yet — skip silently
    if (error.message.includes('does not exist')) return { processed: 0, failed: 0 }
    console.error('Error fetching book_cache:', error.message)
    return { processed: 0, failed: 0 }
  }

  if (!data?.length) return { processed: 0, failed: 0 }

  for (const row of data) {
    try {
      const text = [row.title, row.author ? `by ${row.author}` : ''].filter(Boolean).join(' ')
      if (!text.trim()) continue

      const embedding = await getEmbedding(text)

      const { error: updateError } = await supabase.rpc('update_book_cache_embedding', {
        p_id: row.id,
        p_embedding: JSON.stringify(embedding),
      })

      if (updateError) {
        console.error(`Failed to update book_cache embedding for ${row.id}:`, updateError.message)
        failed++
      } else {
        processed++
      }
    } catch (err) {
      console.error(`Error embedding book_cache ${row.id}:`, (err as Error).message)
      failed++
    }
  }

  return { processed, failed }
}

// ============================================================
// Main handler
// ============================================================
Deno.serve(async (req) => {
  try {
    // Parse batch_size from request body (optional)
    let batchSize = DEFAULT_BATCH_SIZE
    try {
      const body = await req.json()
      if (body?.batch_size && typeof body.batch_size === 'number') {
        batchSize = Math.min(body.batch_size, 200) // cap at 200
      }
    } catch {
      // No body or invalid JSON — use default
    }

    let totalProcessed = 0
    let totalFailed = 0
    const remaining: Record<string, number> = {}
    let budgetLeft = batchSize

    // Process each table, spreading the budget
    for (const [tableName, config] of Object.entries(TABLE_CONFIG)) {
      if (budgetLeft <= 0) break

      const rows = await fetchUnembeddedRows(tableName, config, budgetLeft)
      if (!rows.length) continue

      for (const row of rows) {
        if (budgetLeft <= 0) break

        try {
          const text = buildText(config, row)
          if (!text.trim()) continue

          const embedding = await getEmbedding(text)
          const success = await writeEmbedding(
            tableName,
            row.id as string,
            embedding,
            config.embeddingColumn,
          )

          if (success) {
            totalProcessed++
          } else {
            totalFailed++
          }
          budgetLeft--
        } catch (err) {
          console.error(`Error embedding ${tableName}.${row.id}:`, (err as Error).message)
          totalFailed++
          budgetLeft--
        }
      }
    }

    // Process book_cache separately (platform_intelligence schema)
    if (budgetLeft > 0) {
      const bcResult = await processBookCache(budgetLeft)
      totalProcessed += bcResult.processed
      totalFailed += bcResult.failed
    }

    return new Response(
      JSON.stringify({
        processed: totalProcessed,
        failed: totalFailed,
        batch_size: batchSize,
      }),
      { headers: { 'Content-Type': 'application/json' } },
    )
  } catch (err) {
    console.error('Embed function error:', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    )
  }
})
