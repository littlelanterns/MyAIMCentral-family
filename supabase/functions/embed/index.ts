// MyAIM Central — Generic Embedding Edge Function
// Processes pgmq 'embedding_jobs' queue, calls OpenAI text-embedding-3-small,
// writes halfvec(1536) back to source table.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const EMBEDDING_MODEL = 'text-embedding-3-small'
const BATCH_SIZE = 100

// Map table names to the text column(s) to embed
const TABLE_TEXT_COLUMNS: Record<string, string[]> = {
  guiding_stars: ['content', 'description'],
  best_intentions: ['statement'],
  self_knowledge: ['content'],
  journal_entries: ['content'],
  archive_context_items: ['context_value'],
  bookshelf_chunks: ['text'],
}

interface QueueMessage {
  table_name: string
  schema_name: string
  id: string
  operation: string
}

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

function getTextForTable(tableName: string, row: Record<string, unknown>): string {
  const columns = TABLE_TEXT_COLUMNS[tableName]
  if (!columns) {
    throw new Error(`No text columns configured for table: ${tableName}`)
  }
  return columns
    .map((col) => row[col])
    .filter(Boolean)
    .join(' ')
}

Deno.serve(async (_req) => {
  try {
    // Read messages from the queue
    const { data: messages, error: readError } = await supabase.rpc('pgmq_read', {
      queue_name: 'embedding_jobs',
      vt: 30, // visibility timeout in seconds
      qty: BATCH_SIZE,
    })

    if (readError) {
      // If pgmq_read RPC doesn't exist, try raw SQL approach
      const { data: rawMessages, error: rawError } = await supabase
        .from('pgmq.q_embedding_jobs')
        .select('msg_id, message')
        .limit(BATCH_SIZE)

      if (rawError || !rawMessages?.length) {
        return new Response(JSON.stringify({ processed: 0, message: 'No jobs in queue' }), {
          headers: { 'Content-Type': 'application/json' },
        })
      }
    }

    if (!messages?.length) {
      return new Response(JSON.stringify({ processed: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      })
    }

    let processed = 0
    let errors = 0

    for (const msg of messages) {
      try {
        const job = msg.message as QueueMessage
        const { table_name, schema_name, id } = job

        // Fetch the row
        const { data: row, error: fetchError } = await supabase
          .from(table_name)
          .select('*')
          .eq('id', id)
          .single()

        if (fetchError || !row) {
          console.error(`Row not found: ${schema_name}.${table_name}.${id}`)
          continue
        }

        // Get text to embed
        const text = getTextForTable(table_name, row)
        if (!text.trim()) {
          console.log(`Empty text for ${table_name}.${id}, skipping`)
          continue
        }

        // Generate embedding
        const embedding = await getEmbedding(text)

        // Write embedding back to row
        const { error: updateError } = await supabase
          .from(table_name)
          .update({ embedding: JSON.stringify(embedding) })
          .eq('id', id)

        if (updateError) {
          console.error(`Failed to update embedding for ${table_name}.${id}:`, updateError)
          errors++
          continue
        }

        // Delete processed message from queue
        await supabase.rpc('pgmq_delete', {
          queue_name: 'embedding_jobs',
          msg_id: msg.msg_id,
        })

        processed++
      } catch (err) {
        console.error(`Error processing job:`, err)
        errors++
      }
    }

    return new Response(
      JSON.stringify({ processed, errors, total: messages.length }),
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
