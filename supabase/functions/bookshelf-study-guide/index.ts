/**
 * bookshelf-study-guide Edge Function (PRD-23)
 * Generates age-adapted study guides from a book's key-point extractions.
 * Uses Haiku to rewrite existing extractions for a specific child's level.
 *
 * Phase 1b-E: Rewired from old per-family tables to platform RPCs.
 * Reads via get_book_extractions, deletes via delete_book_extractions_by_audience,
 * inserts via insert_book_extractions_study_guide.
 *
 * Input: bookshelf_item_id, target_member_id, detail_level
 * Output: Inserts rewritten items with audience = 'study_guide_{memberId}'
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://esm.sh/zod@3.23.8'
import { corsHeaders, handleCors, jsonHeaders } from '../_shared/cors.ts'
import { authenticateRequest } from '../_shared/auth.ts'
import { logAICost } from '../_shared/cost-logger.ts'
import { applyPrivacyFilter, isPrimaryParent } from '../_shared/privacy-filter.ts'

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

// Extraction types to rewrite (skip insights — too analytical for kids)
const STUDY_TYPES = [
  { type: 'summary', label: 'Key Ideas' },
  { type: 'action_step', label: 'Try This' },
  { type: 'question', label: 'Think About' },
  { type: 'declaration', label: 'Principles to Remember' },
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

    // Load child's archive context for personalization (optional).
    // Role-asymmetric privacy filter per Convention #76 + RECON Decision 6.
    // Mom (primary_parent) sees privacy-filtered items; non-mom requesters
    // do not. Helper used (vs. sync roster check) because no member roster
    // is in scope at this Edge Function — matches Task 1's pattern in
    // loadFilteredArchive.
    const requesterIsMom = await isPrimaryParent(supabase, member_id)
    let archiveQuery = supabase
      .from('archive_context_items')
      .select('context_value, context_type')
      .eq('family_id', family_id)
      .eq('member_id', target_member_id)
      .eq('is_included_in_ai', true)
      .is('archived_at', null)
      .limit(10)
    archiveQuery = applyPrivacyFilter(archiveQuery, requesterIsMom)
    const { data: archiveItems } = await archiveQuery

    const childContext = (archiveItems || [])
      .map((i: { context_value: string; context_type: string | null }) =>
        `${i.context_type ? `[${i.context_type}] ` : ''}${i.context_value}`
      )
      .join('\n')

    // Load book info + resolve book_library_id
    const { data: book } = await supabase
      .from('bookshelf_items')
      .select('title, author, book_library_id')
      .eq('id', bookshelf_item_id)
      .single()

    const bookTitle = book?.title || 'this book'
    const bookAuthor = book?.author || ''
    const bookLibraryId = book?.book_library_id

    if (!bookLibraryId) {
      return new Response(
        JSON.stringify({ error: 'Book has no library link' }),
        { status: 400, headers: jsonHeaders }
      )
    }

    // Load ALL key-point extractions from the platform via get_book_extractions RPC
    type ExtractionRow = {
      id: string
      extraction_type: string
      text: string | null
      declaration_text: string | null
      content_type: string | null
      style_variant: string | null
      section_title: string | null
      is_key_point: boolean
      sort_order: number | null
    }

    const allExtractions: ExtractionRow[] = []
    let offset = 0
    while (true) {
      const { data, error } = await supabase.rpc('get_book_extractions', {
        p_bookshelf_item_ids: [bookshelf_item_id],
        p_member_id: member_id,
        p_audience: 'original',
      }).range(offset, offset + 999)

      if (error) {
        console.error('get_book_extractions error:', error.message)
        break
      }
      if (!data || data.length === 0) break
      allExtractions.push(...(data as ExtractionRow[]))
      if (data.length < 1000) break
      offset += 1000
    }

    const audienceKey = `study_guide_${target_member_id}`

    // Delete any existing study guide for this child+book
    await supabase.rpc('delete_book_extractions_by_audience', {
      p_book_library_id: bookLibraryId,
      p_audience: audienceKey,
    })

    let totalItemsCreated = 0
    let totalInput = 0
    let totalOutput = 0

    for (const { type: extType, label } of STUDY_TYPES) {
      // Filter to key-point items of this type
      const items = allExtractions.filter(e =>
        e.extraction_type === extType && e.is_key_point
      )

      if (items.length === 0) {
        console.log(`No key points found for ${extType}`)
        continue
      }
      console.log(`Processing ${items.length} key points of type ${extType}`)

      // Limit to 15 key points per type to keep AI response manageable
      const limitedItems = items.slice(0, 15)

      // Build prompt for Haiku
      const lengthGuide = detail_level === 'brief'
        ? 'Keep each rewrite to 1-2 short sentences.'
        : detail_level === 'detailed'
        ? 'Include supporting detail and examples the child can relate to. 3-4 sentences each.'
        : 'Rewrite clearly in 2-3 sentences at the child\'s level.'

      const itemTexts = limitedItems
        .map((item, i) => {
          const text = extType === 'declaration' ? item.declaration_text : item.text
          return `${i + 1}. ${text || ''}`
        })
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

      const userPrompt = `Rewrite these ${limitedItems.length} extractions for ${childName}:\n\n${itemTexts}`

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
        console.error(`AI call failed for ${extType} (${aiResp.status}):`, errText)
        continue
      }

      const aiData = await aiResp.json() as {
        choices: Array<{ message: { content: string } }>
        usage?: { prompt_tokens?: number; completion_tokens?: number }
      }

      totalInput += aiData.usage?.prompt_tokens || 0
      totalOutput += aiData.usage?.completion_tokens || 0

      const content = aiData.choices?.[0]?.message?.content || ''
      console.log(`AI response for ${extType} (${content.length} chars):`, content.substring(0, 200))

      // Parse the JSON array from response
      let rewritten: Array<{ index: number; text: string }> = []
      try {
        const jsonMatch = content.match(/\[[\s\S]*\]/)
        if (jsonMatch) {
          rewritten = JSON.parse(jsonMatch[0])
        } else {
          console.error(`No JSON array found in response for ${extType}`)
        }
      } catch (parseErr) {
        console.error(`Failed to parse study guide response for ${extType}:`, parseErr)
        continue
      }
      console.log(`Parsed ${rewritten.length} rewritten items for ${extType}`)

      // Build JSONB array for the insert RPC
      const insertItems = rewritten
        .filter(rw => rw.index >= 1 && rw.index <= limitedItems.length)
        .map(rw => {
          const originalItem = limitedItems[rw.index - 1]
          const item: Record<string, unknown> = {
            extraction_type: extType,
            section_title: originalItem.section_title,
            sort_order: rw.index,
          }

          // Set text or declaration_text based on type
          if (extType === 'declaration') {
            item.declaration_text = rw.text
            item.text = null
            item.style_variant = originalItem.style_variant
          } else {
            item.text = rw.text
            item.declaration_text = null
            item.content_type = originalItem.content_type
          }

          return item
        })

      if (insertItems.length > 0) {
        const { data: count, error: insertError } = await supabase.rpc(
          'insert_book_extractions_study_guide',
          {
            p_book_library_id: bookLibraryId,
            p_audience: audienceKey,
            p_items: insertItems,
          },
        )

        if (insertError) {
          console.error(`Insert failed for ${extType}:`, JSON.stringify(insertError))
        } else {
          totalItemsCreated += (count as number) || insertItems.length
          console.log(`Successfully inserted ${insertItems.length} items for ${extType}`)
        }
      }
    }

    // Log AI cost
    logAICost({
      familyId: family_id,
      memberId: member_id,
      featureKey: 'bookshelf_study_guide',
      model: 'anthropic/claude-haiku-4.5',
      inputTokens: totalInput,
      outputTokens: totalOutput,
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
