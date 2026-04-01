/**
 * bookshelf-key-points Edge Function (PRD-23)
 * Uses Claude Haiku to select key points from extraction sections.
 * For sections with 3+ items, AI picks 2-3 most important.
 * For sections with ≤2 items, all are marked as key points.
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
  member_id: z.string().uuid(),
  family_id: z.string().uuid().optional(),
})

const EXTRACTION_TABLES = [
  { table: 'bookshelf_summaries', textCol: 'text' },
  { table: 'bookshelf_insights', textCol: 'text' },
  { table: 'bookshelf_declarations', textCol: 'declaration_text' },
  { table: 'bookshelf_action_steps', textCol: 'text' },
  { table: 'bookshelf_questions', textCol: 'text' },
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

    const { bookshelf_item_id, member_id, family_id: providedFamilyId } = parsed.data

    let totalInput = 0
    let totalOutput = 0
    let sectionsProcessed = 0

    for (const { table, textCol } of EXTRACTION_TABLES) {
      // Fetch all items for this book in this table
      const { data: items, error } = await supabase
        .from(table)
        .select(`id, section_title, section_index, ${textCol}, sort_order`)
        .eq('bookshelf_item_id', bookshelf_item_id)
        .eq('family_member_id', member_id)
        .eq('is_deleted', false)
        .order('section_index', { ascending: true, nullsFirst: false })
        .order('sort_order', { ascending: true })

      if (error || !items || items.length === 0) continue

      // Group by section
      const sections = new Map<string, typeof items>()
      for (const item of items) {
        const key = item.section_title || 'General'
        const arr = sections.get(key) || []
        arr.push(item)
        sections.set(key, arr)
      }

      for (const [sectionTitle, sectionItems] of sections) {
        if (sectionItems.length <= 2) {
          // Mark all as key points
          const ids = sectionItems.map(i => i.id)
          await supabase
            .from(table)
            .update({ is_key_point: true })
            .in('id', ids)
          sectionsProcessed++
          continue
        }

        // Use Haiku to select 2-3 most important
        const itemTexts = sectionItems.map((item, idx) => {
          const text = (item as Record<string, unknown>)[textCol] as string
          return `[${idx}] ${text.slice(0, 300)}`
        }).join('\n\n')

        const prompt = `You are selecting key points from a book section. Below are ${sectionItems.length} extracted items from the section "${sectionTitle}".

Select the 2-3 MOST important, impactful, or actionable items. Return ONLY a JSON array of their indices (0-based).

Example response: [0, 3, 5]

Items:
${itemTexts}`

        try {
          const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': 'https://myaimcentral.com',
              'X-Title': 'MyAIM Central',
            },
            body: JSON.stringify({
              model: 'anthropic/claude-haiku-4.5',
              messages: [{ role: 'user', content: prompt }],
              max_tokens: 100,
            }),
          })

          if (!aiResponse.ok) continue

          const result = await aiResponse.json()
          const content = result.choices?.[0]?.message?.content || ''
          totalInput += result.usage?.prompt_tokens || 0
          totalOutput += result.usage?.completion_tokens || 0

          // Parse indices from response
          const match = content.match(/\[[\d,\s]+\]/)
          if (!match) continue

          const indices: number[] = JSON.parse(match[0])
          const keyPointIds = indices
            .filter(i => i >= 0 && i < sectionItems.length)
            .map(i => sectionItems[i].id)

          const nonKeyIds = sectionItems
            .filter(item => !keyPointIds.includes(item.id))
            .map(item => item.id)

          // Update key points
          if (keyPointIds.length > 0) {
            await supabase
              .from(table)
              .update({ is_key_point: true })
              .in('id', keyPointIds)
          }
          if (nonKeyIds.length > 0) {
            await supabase
              .from(table)
              .update({ is_key_point: false })
              .in('id', nonKeyIds)
          }

          sectionsProcessed++
        } catch (aiErr) {
          console.error(`AI error for section ${sectionTitle}:`, aiErr)
          // Fallback: mark first 2 as key points
          const fallbackIds = sectionItems.slice(0, 2).map(i => i.id)
          await supabase
            .from(table)
            .update({ is_key_point: true })
            .in('id', fallbackIds)
          sectionsProcessed++
        }
      }
    }

    // Log AI cost — use provided family_id or look up
    if (totalInput > 0 || totalOutput > 0) {
      let familyId = providedFamilyId
      if (!familyId) {
        const { data: memberData } = await supabase
          .from('family_members')
          .select('family_id')
          .eq('id', member_id)
          .single()
        familyId = memberData?.family_id
      }

      if (familyId) {
        logAICost({
          familyId,
          memberId: member_id,
          featureKey: 'bookshelf_key_points',
          model: 'anthropic/claude-haiku-4.5',
          inputTokens: totalInput,
          outputTokens: totalOutput,
        })
      }
    }

    return new Response(
      JSON.stringify({ success: true, sections_processed: sectionsProcessed }),
      { headers: jsonHeaders }
    )
  } catch (err) {
    console.error('bookshelf-key-points error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: jsonHeaders }
    )
  }
})
