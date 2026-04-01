/**
 * bookshelf-discuss Edge Function (PRD-23)
 *
 * RAG-powered book discussion for the BookShelf feature. Supports five
 * discussion types and five audience modes. Adapted from StewardShip's
 * manifest-discuss reference implementation for the MyAIM v2 architecture.
 *
 * Context sources per book:
 *   - bookshelf_items metadata (title, author, genres, ai_summary)
 *   - bookshelf_summaries, bookshelf_insights, bookshelf_declarations,
 *     bookshelf_action_steps, bookshelf_questions (hearted items prioritized)
 *   - match_bookshelf_chunks RPC (passage-level RAG)
 *   - match_bookshelf_extractions RPC (semantic extraction search)
 *
 * User context sources:
 *   - guiding_stars (values and declarations)
 *   - self_knowledge (personality and traits)
 *
 * Cost logging: ai_usage_tracking (fire-and-forget).
 * No streaming — returns { content: string }.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://esm.sh/zod@3.23.8'
import { handleCors, jsonHeaders } from '../_shared/cors.ts'
import { authenticateRequest } from '../_shared/auth.ts'
import { logAICost } from '../_shared/cost-logger.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!

const MODEL = 'anthropic/claude-sonnet-4-20250514'

// Service role client — needed for cross-table reads
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// ============================================================
// Input Validation
// ============================================================

const RequestSchema = z.object({
  bookshelf_item_ids: z.array(z.string().uuid()).min(1).max(10),
  discussion_type: z.enum([
    'discuss',
    'generate_goals',
    'generate_questions',
    'generate_tasks',
    'generate_tracker',
  ]),
  audience: z
    .enum(['personal', 'family', 'teen', 'spouse', 'children'])
    .default('personal'),
  message: z.string().default(''),
  conversation_history: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string(),
      }),
    )
    .default([]),
  family_id: z.string().uuid(),
  member_id: z.string().uuid(),
})

// ============================================================
// Embedding Generation
// ============================================================

async function generateEmbedding(text: string): Promise<number[] | null> {
  try {
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
      console.error('OpenAI embedding error:', await response.text())
      return null
    }

    const data = await response.json()
    return (data.data[0].embedding as number[]) ?? null
  } catch (err) {
    console.error('generateEmbedding failed:', err)
    return null
  }
}

// ============================================================
// Audience Guidance
// ============================================================

function getAudienceGuidance(audience: string): string {
  const base = `AUDIENCE TARGET: "${audience.toUpperCase()}" — Tailor ALL content for this audience. If prior messages used a different audience style, adapt immediately.`

  switch (audience) {
    case 'personal':
      return `${base}\nSpeak directly to the user. Questions and content should be introspective, individually focused, and personally challenging.`
    case 'family':
      return `${base}\nQuestions and content should be age-appropriate for the whole family including children. Use accessible language. Focus on shared values and family application. Frame responses so family members can discuss together.`
    case 'teen':
      return `${base}\nUse language and examples that resonate with teenage thinking. Connect concepts to school, friendships, identity, and future dreams. Be engaging and respect their intelligence. Avoid being preachy.`
    case 'spouse':
      return `${base}\nFrame content for partners to discuss together. Focus on relationship application, shared growth, mutual understanding, and how the book's ideas apply to their partnership.`
    case 'children':
      return `${base}\nSimplify concepts significantly. Use wonder-driven, curiosity-sparking language. Keep questions short and concrete. Use stories and examples children can relate to.`
    default:
      return ''
  }
}

// ============================================================
// System Prompt Assembly
// ============================================================

function buildSystemPrompt(
  discussionType: string,
  audience: string,
  bookTitles: string[],
  isMultiBook: boolean,
  bookContext: string,
  userContext: string,
): string {
  const audienceGuidance = getAudienceGuidance(audience)
  const bookList =
    bookTitles.length === 1
      ? `"${bookTitles[0]}"`
      : bookTitles.map((t) => `"${t}"`).join(', ')

  const baseRules = `You are a thoughtful discussion partner helping someone engage deeply with ${isMultiBook ? 'books they have been reading' : 'a book they have been reading'}.

CRITICAL RULES:
- Never use emoji
- Reference book content specifically — cite chapters, concepts, and principles by name
- Connect insights to the user's Guiding Stars and values when relevant
- Be warm, substantive, and thought-provoking — not generic or surface-level
- Keep responses focused and conversational (2-4 paragraphs typical)
- When hearted content is available, prioritize it — it represents what resonated most with this reader
- LiLa never cites a single book source to claim credit — apply synthesized universal principles

${audienceGuidance}

BOOK CONTEXT:
${bookContext}

USER CONTEXT:
${userContext}`

  switch (discussionType) {
    case 'discuss':
      return `${baseRules}

DISCUSSION MODE: Open Discussion about ${bookList}
${
  isMultiBook
    ? `The user wants to discuss multiple books together. Find the threads connecting them. Open with cross-book synthesis and 2-3 thought-provoking questions that bridge concepts across the books.
Question types to draw from: thought-provoking, context-altering, action-inspiring, character-improving, soul-stirring, heart-warming.`
    : `The user wants to discuss this book. Acknowledge what they have extracted and hearted to show you understand what resonated with them. Be ready to go deep on any concept, story, or principle from the book.`
}
Draw from the RAG passages and extracted content to give substantive, book-grounded responses. When you reference the book, be specific about which concept, chapter, or idea you are drawing from.`

    case 'generate_goals':
      return `${baseRules}

GOAL GENERATION MODE: Generate actionable goals from ${bookList}
Review the hearted frameworks, insights, and declarations (prioritize hearted items). Suggest 3-5 specific, actionable goals tied to the book's principles.
Goals should be:
- Specific enough to track progress
- Connected to the book's core frameworks or principles
- Realistic for someone to start within the next month
- Connected to the user's Guiding Stars and life context when possible

Present goals conversationally — explain why each goal connects to the book's teaching. The user can refine, adjust, or request different goals.

When the user is satisfied with goals, format them clearly so they can be routed to their Best Intentions or BigPlans.`

    case 'generate_questions':
      return `${baseRules}

QUESTION GENERATION MODE: Generate discussion questions from ${bookList}
Generate 5-8 discussion questions drawing from the extracted content and the user's personal context.
Questions should be open-ended, thought-provoking, and designed to deepen understanding.

${audienceGuidance}

Present questions in a natural, conversational way. The user can ask for more, adjust difficulty, or change focus areas.`

    case 'generate_tasks':
      return `${baseRules}

TASK GENERATION MODE: Generate actionable tasks from ${bookList}
Review the book's frameworks and principles. Suggest 3-5 concrete tasks the user could do this week to implement what they have learned.
Tasks should be:
- Immediately actionable (can start today or this week)
- Specific and concrete (not vague aspirations)
- Connected to specific book principles
- Varied in effort level (mix of quick wins and deeper commitments)

Present conversationally. The user can refine or request different tasks.

When the user is satisfied, format tasks clearly so they can be routed to the task manager.`

    case 'generate_tracker':
      return `${baseRules}

TRACKER GENERATION MODE: Suggest tracking ideas from ${bookList}
Based on the book's frameworks, suggest 2-4 things worth tracking — habits, behaviors, metrics, or practices.
For each suggestion, explain:
- What to track and why (connected to which book principle)
- How often to track (daily, weekly, etc.)
- How to measure (simple yes/no, scale, count, etc.)

Present conversationally. The user can refine tracking criteria and approach.`

    default:
      return baseRules
  }
}

// ============================================================
// Book Context Assembly
// ============================================================

type BookItem = {
  id: string
  title: string
  author: string | null
  genres: string[] | null
  ai_summary: string | null
}

type ExtractionRow = {
  text?: string
  declaration_text?: string
  is_hearted: boolean
  content_type?: string
  style_variant?: string
  action_type?: string
  question_type?: string
}

async function buildBookContext(
  familyId: string,
  memberId: string,
  bookshelfItemIds: string[],
  userMessage: string,
): Promise<{ context: string; titles: string[] }> {
  const parts: string[] = []
  const titles: string[] = []

  // Generate embedding for RAG search once — reuse across all books
  const queryText = userMessage || bookshelfItemIds[0] // fallback if no message yet
  const queryEmbedding = await generateEmbedding(queryText)

  for (const itemId of bookshelfItemIds) {
    // 1. Book metadata
    const { data: item } = await supabase
      .from('bookshelf_items')
      .select('id, title, author, genres, ai_summary')
      .eq('id', itemId)
      .eq('family_id', familyId)
      .single()

    if (!item) continue

    const bookItem = item as BookItem
    const displayTitle = bookItem.author
      ? `${bookItem.title} by ${bookItem.author}`
      : bookItem.title
    titles.push(displayTitle)

    let bookSection = `\n--- ${displayTitle} ---`
    if (bookItem.ai_summary) {
      bookSection += `\nSummary: ${bookItem.ai_summary}`
    }
    if (bookItem.genres && bookItem.genres.length > 0) {
      bookSection += `\nGenres: ${bookItem.genres.join(', ')}`
    }

    // 2. Summaries — hearted first, then non-hearted (limited)
    const { data: summaries } = await supabase
      .from('bookshelf_summaries')
      .select('text, content_type, is_hearted')
      .eq('bookshelf_item_id', itemId)
      .eq('user_id', memberId)
      .order('is_hearted', { ascending: false })
      .order('created_at', { ascending: true })

    if (summaries && summaries.length > 0) {
      const rows = summaries as ExtractionRow[]
      const hearted = rows.filter((r) => r.is_hearted)
      const others = rows.filter((r) => !r.is_hearted).slice(0, 15)

      if (hearted.length > 0) {
        bookSection += '\n\nHearted Key Insights:'
        for (const s of hearted) {
          bookSection += `\n- [${s.content_type || 'insight'}] ${s.text}`
        }
      }
      if (others.length > 0) {
        bookSection += '\n\nOther Key Insights:'
        for (const s of others) {
          bookSection += `\n- [${s.content_type || 'insight'}] ${s.text}`
        }
      }
    }

    // 3. Insights — hearted first, then non-hearted (limited)
    const { data: insights } = await supabase
      .from('bookshelf_insights')
      .select('text, content_type, is_hearted')
      .eq('bookshelf_item_id', itemId)
      .eq('user_id', memberId)
      .order('is_hearted', { ascending: false })
      .order('created_at', { ascending: true })

    if (insights && insights.length > 0) {
      const rows = insights as ExtractionRow[]
      const hearted = rows.filter((r) => r.is_hearted)
      const others = rows.filter((r) => !r.is_hearted).slice(0, 10)

      if (hearted.length > 0) {
        bookSection += '\n\nHearted Principles & Frameworks:'
        for (const s of hearted) {
          bookSection += `\n- [${s.content_type || 'insight'}] ${s.text}`
        }
      }
      if (others.length > 0) {
        bookSection += '\n\nOther Principles & Frameworks:'
        for (const s of others) {
          bookSection += `\n- [${s.content_type || 'insight'}] ${s.text}`
        }
      }
    }

    // 4. Declarations — hearted first, then non-hearted (limited)
    const { data: declarations } = await supabase
      .from('bookshelf_declarations')
      .select('declaration_text, style_variant, is_hearted')
      .eq('bookshelf_item_id', itemId)
      .eq('user_id', memberId)
      .order('is_hearted', { ascending: false })
      .order('created_at', { ascending: true })

    if (declarations && declarations.length > 0) {
      const rows = declarations as ExtractionRow[]
      const hearted = rows.filter((r) => r.is_hearted)
      const others = rows.filter((r) => !r.is_hearted).slice(0, 8)

      if (hearted.length > 0) {
        bookSection += '\n\nHearted Declarations:'
        for (const d of hearted) {
          bookSection += `\n- ${d.declaration_text}`
        }
      }
      if (others.length > 0) {
        bookSection += '\n\nOther Declarations:'
        for (const d of others) {
          bookSection += `\n- ${d.declaration_text}`
        }
      }
    }

    // 5. Action Steps — hearted first, then non-hearted (limited)
    const { data: actionSteps } = await supabase
      .from('bookshelf_action_steps')
      .select('text, action_type, is_hearted')
      .eq('bookshelf_item_id', itemId)
      .eq('user_id', memberId)
      .order('is_hearted', { ascending: false })
      .order('created_at', { ascending: true })

    if (actionSteps && actionSteps.length > 0) {
      const rows = actionSteps as ExtractionRow[]
      const hearted = rows.filter((r) => r.is_hearted)
      const others = rows.filter((r) => !r.is_hearted).slice(0, 8)

      if (hearted.length > 0) {
        bookSection += '\n\nHearted Action Steps:'
        for (const a of hearted) {
          bookSection += `\n- [${a.action_type || 'action'}] ${a.text}`
        }
      }
      if (others.length > 0) {
        bookSection += '\n\nOther Action Steps:'
        for (const a of others) {
          bookSection += `\n- [${a.action_type || 'action'}] ${a.text}`
        }
      }
    }

    // 6. Questions — hearted first, then non-hearted (limited)
    const { data: questions } = await supabase
      .from('bookshelf_questions')
      .select('question_text, question_type, is_hearted')
      .eq('bookshelf_item_id', itemId)
      .eq('user_id', memberId)
      .order('is_hearted', { ascending: false })
      .order('created_at', { ascending: true })

    if (questions && questions.length > 0) {
      const rows = questions as Array<{
        question_text: string
        question_type: string | null
        is_hearted: boolean
      }>
      const hearted = rows.filter((r) => r.is_hearted)
      const others = rows.filter((r) => !r.is_hearted).slice(0, 8)

      if (hearted.length > 0) {
        bookSection += '\n\nHearted Reflection Questions:'
        for (const q of hearted) {
          bookSection += `\n- [${q.question_type || 'reflection'}] ${q.question_text}`
        }
      }
      if (others.length > 0) {
        bookSection += '\n\nOther Reflection Questions:'
        for (const q of others) {
          bookSection += `\n- [${q.question_type || 'reflection'}] ${q.question_text}`
        }
      }
    }

    // 7. RAG chunk search (passage-level)
    if (queryEmbedding) {
      try {
        const chunkCount = bookshelfItemIds.length === 1 ? 8 : 5
        const { data: chunks, error: chunkErr } = await supabase.rpc(
          'match_bookshelf_chunks',
          {
            query_embedding: queryEmbedding,
            p_family_id: familyId,
            p_book_ids: [itemId],
            match_threshold: 0.3,
            match_count: chunkCount,
          },
        )

        if (!chunkErr && chunks && chunks.length > 0) {
          bookSection += '\n\nRelevant Passages:'
          for (const c of chunks as Array<{
            chunk_text: string
            chapter_title?: string
          }>) {
            const snippet =
              c.chunk_text.length > 600
                ? c.chunk_text.substring(0, 600) + '...'
                : c.chunk_text
            bookSection += `\n---\n${snippet}`
          }
        }
      } catch (ragErr) {
        console.error('RAG chunk search failed for book', itemId, ragErr)
      }
    }

    parts.push(bookSection)
  }

  // 8. Semantic extraction search across all requested books (cross-book connections)
  if (queryEmbedding) {
    try {
      const extractionCount = bookshelfItemIds.length === 1 ? 6 : 10
      const { data: semanticMatches, error: semanticErr } = await supabase.rpc(
        'match_bookshelf_extractions',
        {
          query_embedding: queryEmbedding,
          p_family_id: familyId,
          p_member_id: memberId,
          p_book_ids: bookshelfItemIds,
          match_threshold: 0.4,
          match_count: extractionCount,
        },
      )

      if (!semanticErr && semanticMatches && semanticMatches.length > 0) {
        const label =
          bookshelfItemIds.length === 1
            ? 'Semantically related content from your library:'
            : 'Semantically related content across these books:'
        const semanticSection = `\n\n--- Semantic Connections ---\n${label}`
        const lines: string[] = []

        for (const m of semanticMatches as Array<{
          book_title: string
          table_name: string
          content_type: string | null
          item_text: string
        }>) {
          const sourceType = (m.table_name || '')
            .replace('bookshelf_', '')
            .replace(/_/g, ' ')
          lines.push(
            `- [${m.book_title} — ${m.content_type || sourceType}] ${m.item_text}`,
          )
        }

        if (lines.length > 0) {
          parts.push(semanticSection + '\n' + lines.join('\n'))
        }
      }
    } catch (semanticErr) {
      console.error('Semantic extraction search failed:', semanticErr)
    }
  }

  return { context: parts.join('\n\n'), titles }
}

// ============================================================
// User Context Assembly
// ============================================================

async function buildUserContext(
  familyId: string,
  memberId: string,
): Promise<string> {
  const parts: string[] = []

  // Guiding Stars — values and declarations
  const { data: guidingStars } = await supabase
    .from('guiding_stars')
    .select('content, category, entry_type')
    .eq('family_id', familyId)
    .eq('member_id', memberId)
    .eq('is_included_in_ai', true)
    .is('archived_at', null)
    .order('sort_order', { ascending: true })

  if (guidingStars && guidingStars.length > 0) {
    parts.push("User's Guiding Stars (values & declarations):")
    const grouped = new Map<string, string[]>()
    for (const g of guidingStars as Array<{
      content: string
      category: string | null
      entry_type: string | null
    }>) {
      const key = g.entry_type || g.category || 'general'
      const list = grouped.get(key) || []
      list.push(g.content)
      grouped.set(key, list)
    }
    for (const [type, entries] of grouped) {
      parts.push(`${type.toUpperCase()}:`)
      for (const text of entries) {
        parts.push(`- ${text}`)
      }
    }
  }

  // Self-Knowledge — personality, traits, strengths
  const { data: selfKnowledge } = await supabase
    .from('self_knowledge')
    .select('content, category')
    .eq('family_id', familyId)
    .eq('member_id', memberId)
    .eq('is_included_in_ai', true)
    .is('archived_at', null)
    .order('created_at', { ascending: true })
    .limit(20)

  if (selfKnowledge && selfKnowledge.length > 0) {
    parts.push('\nAbout the User (InnerWorkings):')
    for (const s of selfKnowledge as Array<{
      content: string
      category: string
    }>) {
      const prefix =
        s.category && s.category !== 'general' ? `[${s.category}] ` : ''
      parts.push(`- ${prefix}${s.content.substring(0, 200)}`)
    }
  }

  return parts.join('\n')
}

// ============================================================
// Opening Message Synthesis
// ============================================================

function buildOpeningUserMessage(
  discussionType: string,
  bookTitles: string[],
  isMultiBook: boolean,
): string {
  if (isMultiBook) {
    return `I'd like to explore these books together: ${bookTitles.join(', ')}. What connections do you see?`
  }

  const title = bookTitles[0] || 'this book'
  switch (discussionType) {
    case 'discuss':
      return `I'd like to discuss "${title}".`
    case 'generate_goals':
      return `I'd like to generate goals from "${title}".`
    case 'generate_questions':
      return `I'd like to generate discussion questions from "${title}".`
    case 'generate_tasks':
      return `I'd like to generate action items from "${title}".`
    case 'generate_tracker':
      return `I'd like to explore tracking ideas from "${title}".`
    default:
      return `I'd like to discuss "${title}".`
  }
}

// ============================================================
// Main Handler
// ============================================================

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    // Authenticate
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

    const {
      bookshelf_item_ids,
      discussion_type,
      audience,
      message,
      conversation_history,
      family_id,
      member_id,
    } = parsed.data

    const isMultiBook = bookshelf_item_ids.length > 1

    // Build context in parallel
    const [{ context: bookContext, titles: bookTitles }, userContext] =
      await Promise.all([
        buildBookContext(family_id, member_id, bookshelf_item_ids, message),
        buildUserContext(family_id, member_id),
      ])

    // Build system prompt
    const systemPrompt = buildSystemPrompt(
      discussion_type,
      audience,
      bookTitles,
      isMultiBook,
      bookContext,
      userContext,
    )

    // Assemble messages array
    const messages: Array<{ role: string; content: string }> = []

    // Add conversation history
    for (const msg of conversation_history) {
      messages.push({ role: msg.role, content: msg.content })
    }

    // Add current user message, or synthesize an opening message
    if (message) {
      messages.push({ role: 'user', content: message })
    } else if (messages.length === 0) {
      // No history and no message — generate a synthetic opener to trigger the AI's first response
      messages.push({
        role: 'user',
        content: buildOpeningUserMessage(discussion_type, bookTitles, isMultiBook),
      })
    }

    // Call OpenRouter
    const aiResponse = await fetch(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://myaimcentral.com',
          'X-Title': 'MyAIM Central BookShelf',
        },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 2048,
          messages: [{ role: 'system', content: systemPrompt }, ...messages],
        }),
      },
    )

    if (!aiResponse.ok) {
      const errText = await aiResponse.text()
      const status = aiResponse.status

      if (status === 401) {
        return new Response(
          JSON.stringify({ error: 'AI service authentication failed.' }),
          { status: 502, headers: jsonHeaders },
        )
      }
      if (status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit reached. Please wait a moment and try again.' }),
          { status: 429, headers: jsonHeaders },
        )
      }

      console.error('OpenRouter error:', status, errText)
      return new Response(
        JSON.stringify({ error: `AI service error (${status})` }),
        { status: 502, headers: jsonHeaders },
      )
    }

    const data = await aiResponse.json()
    const content = (data.choices?.[0]?.message?.content as string) || ''

    const inputTokens: number = data.usage?.prompt_tokens ?? 0
    const outputTokens: number = data.usage?.completion_tokens ?? 0

    // Log AI cost — fire-and-forget, never blocks the response
    logAICost({
      familyId: family_id,
      memberId: member_id,
      featureKey: 'bookshelf_discuss',
      model: MODEL,
      inputTokens,
      outputTokens,
    })

    return new Response(JSON.stringify({ content }), { headers: jsonHeaders })
  } catch (err) {
    console.error('bookshelf-discuss error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: jsonHeaders },
    )
  }
})
