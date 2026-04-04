/**
 * bookshelf-study-guide Edge Function (PRD-23)
 * Generates age-adapted study guides from a book's key-point extractions.
 * Uses Haiku to rewrite existing extractions for a specific child's level.
 *
 * Input: bookshelf_item_id, target_member_id, detail_level
 * Output: Inserts rewritten items with audience = 'study_guide_{memberId}'
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://esm.sh/zod@3.23.8'
import { corsHeaders, handleCors, jsonHeaders } from '../_shared/cors.ts'
import { authenticateRequest } from '../_shared/auth.ts'
import { logAICost } from '../_shared/cost-logger.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const InputSchema = z.object({
  bookshelf_item_id: z.string().uuid(),
  target_member_id: z.string().uuid(),
  family_id: z.string().uuid(),
  member_id: z.string().uuid(), // requesting parent
  detail_level: z.enum(['brief', 'standard', 'detailed']).default('standard'),
})

// Tables to rewrite (skip insights — too analytical for kids)
const STUDY_TABLES = [
  { table: 'bookshelf_summaries', textCol: 'text', typeCol: 'content_type', label: 'Key Ideas' },
  { table: 'bookshelf_action_steps', textCol: 'text', typeCol: 'content_type', label: 'Try This' },
  { table: 'bookshelf_questions', textCol: 'text', typeCol: 'content_type', label: 'Think About' },
  { table: 'bookshelf_declarations', textCol: 'declaration_text', typeCol: 'style_variant', label: 'Principles to Remember' },
] as const

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

    const { bookshelf_item_id, target_member_id, family_id, member_id, detail_level } = parsed.data

    // Load target child's profile for age-adaptation
    const { data: child } = await supabase
      .from('family_members')
      .select('display_name, age, date_of_birth')
      .eq('id', target_member_id)
      .single()

    if (!child) {
      return new Response(
        JSON.stringify({ error: 'Child member not found' }),
        { status: 404, headers: jsonHeaders }
      )
    }

    const childAge = child.age || 10
    const childName = child.display_name || 'this child'

    // Load child's archive context for personalization (optional)
    const { data: archiveItems } = await supabase
      .from('archive_context_items')
      .select('context_value, context_type')
      .eq('family_id', family_id)
      .eq('member_id', target_member_id)
      .eq('is_included_in_ai', true)
      .is('archived_at', null)
      .limit(10)

    const childContext = (archiveItems || [])
      .map((i: { context_value: string; context_type: string | null }) =>
        `${i.context_type ? `[${i.context_type}] ` : ''}${i.context_value}`
      )
      .join('\n')

    // Load book info
    const { data: book } = await supabase
      .from('bookshelf_items')
      .select('title, author')
      .eq('id', bookshelf_item_id)
      .single()

    const bookTitle = book?.title || 'this book'
    const bookAuthor = book?.author || ''

    // Check if study guide already exists for this child+book
    const audienceKey = `study_guide_${target_member_id}`

    let totalItemsCreated = 0
    let totalInput = 0
    let totalOutput = 0

    for (const { table, textCol, typeCol, label } of STUDY_TABLES) {
      // Load existing key-point items for the book (original audience only)
      // Limit to 15 key points per table to keep AI response manageable
      const { data: items } = await supabase
        .from(table)
        .select(`id, section_title, ${textCol}, ${typeCol}, is_key_point`)
        .eq('bookshelf_item_id', bookshelf_item_id)
        .eq('family_member_id', member_id)
        .eq('is_key_point', true)
        .eq('is_deleted', false)
        .eq('audience', 'original')
        .order('sort_order', { ascending: true })
        .limit(15)

      if (!items || items.length === 0) {
        console.log(`No key points found for ${table}`)
        continue
      }
      console.log(`Processing ${items.length} key points from ${table}`)

      // Delete any existing study guide items for this child+book+table
      await supabase
        .from(table)
        .delete()
        .eq('bookshelf_item_id', bookshelf_item_id)
        .eq('family_member_id', member_id)
        .eq('audience', audienceKey)

      // Build prompt for Haiku
      const lengthGuide = detail_level === 'brief'
        ? 'Keep each rewrite to 1-2 short sentences.'
        : detail_level === 'detailed'
        ? 'Include supporting detail and examples the child can relate to. 3-4 sentences each.'
        : 'Rewrite clearly in 2-3 sentences at the child\'s level.'

      const itemTexts = (items as Array<Record<string, unknown>>)
        .map((item, i) => `${i + 1}. ${item[textCol] as string}`)
        .join('\n')

      const systemPrompt = `You are rewriting book extractions for a ${childAge}-year-old named ${childName}.

The book is "${bookTitle}"${bookAuthor ? ` by ${bookAuthor}` : ''}.
This section is called "${label}".

${childContext ? `About ${childName}:\n${childContext}\n` : ''}
Rules:
- Write at a ${childAge}-year-old's reading and comprehension level
- Use warm, encouraging language
- Replace abstract concepts with concrete examples the child can relate to
- Keep the core meaning intact while making it accessible
- ${lengthGuide}

CONTENT SAFETY — CRITICAL:
- Never encourage secrecy, exclusivity, or hidden relationships
- Never suggest hiding things from parents or trusted adults
- Frame all relationship advice around openness, kindness, and inclusion
- If the original item promotes unhealthy dynamics (manipulation, deception, controlling behavior), rewrite it to model the POSITIVE alternative instead
- For fiction: focus on what the CHARACTER LEARNED or what the reader can take away, not on imitating morally complex character behaviors
- Prioritize lessons about courage, integrity, kindness, resilience, and growth

- Return ONLY a JSON array of objects with "index" (1-based) and "text" (rewritten version)
- Do NOT add commentary or explanations outside the JSON`

      const userPrompt = `Rewrite these ${items.length} extractions for ${childName}:\n\n${itemTexts}`

      const aiResp = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'anthropic/claude-haiku-4.5',
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.4,
          max_tokens: 4000,
        }),
      })

      if (!aiResp.ok) {
        const errText = await aiResp.text()
        console.error(`AI call failed for ${table} (${aiResp.status}):`, errText)
        continue
      }

      const aiData = await aiResp.json() as {
        choices: Array<{ message: { content: string } }>
        usage?: { prompt_tokens?: number; completion_tokens?: number }
      }

      totalInput += aiData.usage?.prompt_tokens || 0
      totalOutput += aiData.usage?.completion_tokens || 0

      const content = aiData.choices?.[0]?.message?.content || ''
      console.log(`AI response for ${table} (${content.length} chars):`, content.substring(0, 200))

      // Parse the JSON array from response
      let rewritten: Array<{ index: number; text: string }> = []
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          rewritten = JSON.parse(jsonMatch[0])
        } else {
          console.error(`No JSON array found in response for ${table}`)
        }
      } catch (parseErr) {
        console.error(`Failed to parse study guide response for ${table}:`, parseErr)
        continue
      }
      console.log(`Parsed ${rewritten.length} rewritten items for ${table}`)

      // Insert rewritten items
      const inserts: Array<Record<string, unknown>> = []
      for (const rw of rewritten) {
        const originalItem = (items as Array<Record<string, unknown>>)[rw.index - 1]
        if (!originalItem) continue

        const insert: Record<string, unknown> = {
          family_id,
          family_member_id: member_id,
          bookshelf_item_id,
          section_title: originalItem.section_title,
          audience: audienceKey,
          is_key_point: true,
          is_hearted: false,
          is_deleted: false,
          is_included_in_ai: true,
          sort_order: rw.index,
        }

        // Set the text column and type column
        insert[textCol] = rw.text
        if (typeCol && originalItem[typeCol]) {
          insert[typeCol] = originalItem[typeCol]
        }

        inserts.push(insert)
      }

      console.log(`Attempting to insert ${inserts.length} items into ${table}`)
      if (inserts.length > 0) {
        const { error: insertError } = await supabase.from(table).insert(inserts)
        if (insertError) {
          console.error(`Insert failed for ${table}:`, JSON.stringify(insertError))
        } else {
          totalItemsCreated += inserts.length
          console.log(`Successfully inserted ${inserts.length} items into ${table}`)
        }
      }
    }

    // Log AI cost
    await logAICost(supabase, {
      family_id,
      member_id,
      feature_key: 'bookshelf_study_guide',
      model: 'haiku',
      tokens_input: totalInput,
      tokens_output: totalOutput,
    })

    return new Response(
      JSON.stringify({
        success: true,
        items_created: totalItemsCreated,
        target_member: childName,
        audience_key: audienceKey,
      }),
      { headers: { ...corsHeaders, ...jsonHeaders } }
    )
  } catch (err) {
    console.error('Study guide generation failed:', err)
    return new Response(
      JSON.stringify({ error: 'Internal error', message: String(err) }),
      { status: 500, headers: { ...corsHeaders, ...jsonHeaders } }
    )
  }
})
