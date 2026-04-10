/**
 * bookshelf-extract Edge Function (PRD-23)
 *
 * AI-powered content extraction from book text. Turns raw chunked text into
 * structured summaries, insights, declarations, action steps, and questions.
 * Also supports Go Deeper mode for supplementary extraction.
 *
 * Adapted from StewardShip's manifest-extract reference (1055 lines) for the
 * MyAIM v2 architecture. Key adaptations:
 *   - Table names: bookshelf_items, bookshelf_summaries, bookshelf_insights
 *     (flat — no parent/child), bookshelf_declarations, bookshelf_action_steps,
 *     bookshelf_questions, bookshelf_chunks, bookshelf_chapters
 *   - Identity: family_id + member_id (not single user_id)
 *   - Insights: flat table with content_type, no nested framework/principles
 *   - Models: Sonnet for extraction, Haiku for section discovery
 *   - Cost logging: ai_usage_tracking via shared logAICost helper
 *
 * Extraction types:
 *   discover_sections   — Haiku section discovery from chunks/full text
 *   combined_section    — Sonnet all-five extractions in one call per section
 *   summary_section     — Sonnet summaries only (Go Deeper / re-run)
 *   insights_section    — Sonnet insights only (Go Deeper / re-run)
 *   declarations_section — Sonnet declarations only (Go Deeper / re-run)
 *   action_steps_section — Sonnet action steps only (Go Deeper / re-run)
 *   questions_section   — Sonnet questions only (Go Deeper / re-run)
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
const HAIKU_MODEL = 'anthropic/claude-haiku-4.5'

// Service role client — needed for cross-table reads and writes
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// ============================================================
// Input Validation
// ============================================================

const RequestSchema = z.object({
  bookshelf_item_id: z.string().uuid(),
  family_id: z.string().uuid(),
  member_id: z.string().uuid(),
  extraction_type: z.enum([
    'discover_sections',
    'combined_section',
    'summary_section',
    'insights_section',
    'declarations_section',
    'action_steps_section',
    'questions_section',
  ]),
  // Section boundaries — required for all except discover_sections
  section_start: z.number().int().nonnegative().optional(),
  section_end: z.number().int().nonnegative().optional(),
  section_title: z.string().optional(),
  // Go Deeper
  go_deeper: z.boolean().optional().default(false),
  existing_items: z.array(z.string()).optional().default([]),
})

// ============================================================
// Genre Context
// ============================================================

function buildGenreContext(genres: string[]): string {
  if (!genres || genres.length === 0) return ''

  const genreGuidance: Record<string, string> = {
    non_fiction:
      'This is non-fiction. Focus on key concepts, frameworks, actionable insights, and mental models the author teaches.',
    fiction:
      'This is fiction. Focus on character development, thematic insights, allegorical meaning, lessons embedded in the story, and memorable quotes — lines of dialogue or narration that capture something profound, beautiful, or true. Fiction often carries its deepest wisdom in its most quotable lines.',
    biography_memoir:
      'This is biography/memoir. Focus on pivotal life moments, character-defining decisions, relationship lessons, and wisdom earned through experience.',
    scriptures_sacred:
      'This is scripture or sacred text. Focus on spiritual principles, doctrinal points, devotional insights, promises, and commandments. Treat the text with reverence.',
    workbook:
      'This is a workbook or practical guide. Focus on exercises, self-assessment frameworks, action steps, and structured processes the reader is meant to apply.',
    textbook:
      'This is a textbook or educational text. Focus on key definitions and terminology, core concepts and theories with their explanations, systematic knowledge progression, illustrative examples, and structured principles the author teaches. Extract the foundational ideas that build upon each other chapter by chapter.',
    poetry_essays:
      'This is poetry or essay collection. Focus on imagery, emotional resonance, philosophical insights, and the distinctive voice/perspective of the author.',
    allegory_parable:
      "This is allegory or parable. For the narrative_summary, cover both the surface events and hint at the symbolic layer beneath. Then extract: symbolic meanings beneath the surface narrative, moral lessons, teaching metaphors that illuminate truth, and memorable quotes — lines that distill the allegory's deeper meaning into words worth remembering.",
    devotional_spiritual_memoir:
      'This is devotional or spiritual memoir. Focus on the spiritual growth journey, faith formation moments, personal revelation, and the intersection of lived experience with divine purpose.',
  }

  const lines = genres.map((g) => genreGuidance[g]).filter(Boolean)
  if (lines.length === 0) return ''

  if (lines.length === 1) {
    return `\n\nGENRE CONTEXT:\n${lines[0]}`
  }
  return `\n\nGENRE CONTEXT (this content blends multiple genres — let all of these lenses inform your extraction):\n${lines
    .map((l) => `- ${l}`)
    .join('\n')}`
}

// ============================================================
// Go Deeper Addendum
// ============================================================

function buildGoDeeperAddendum(existingItems: string[]): string {
  if (!existingItems || existingItems.length === 0) return ''
  const itemList = existingItems.map((item, i) => `${i + 1}. ${item}`).join('\n')
  return `\n\nGO DEEPER — ADDITIONAL EXTRACTION:
You are finding ADDITIONAL content not already captured. The following items have already been extracted. Do NOT duplicate or rephrase these — find genuinely new insights, principles, or content:

Already extracted:
${itemList}

Look for: overlooked nuances, secondary insights, supporting evidence, contrasting viewpoints, practical applications, and deeper implications not yet captured.`
}

// ============================================================
// Phase 1b-B: Persist extractions to platform + old tables
// ============================================================

interface ExtractionItem {
  text?: string
  guided_text?: string | null
  independent_text?: string | null
  content_type?: string
  sort_order?: number
  is_key_point?: boolean
  is_from_go_deeper?: boolean
  // Declaration-specific
  declaration_text?: string
  declaration_style?: string
  style_variant?: string
  value_name?: string
  richness?: string
  // Question-specific
  question_type?: string
}

/**
 * Persist extractions to both platform_intelligence.book_extractions (via RPC)
 * and old per-family tables (dual-write). Non-fatal — errors are logged but
 * never block the HTTP response.
 */
async function persistExtractions(opts: {
  bookLibraryId: string | null
  bookshelfItemId: string
  familyId: string
  memberId: string
  extractionType: string // 'combined_section' or single-tab type
  sectionTitle: string | null
  sectionIndex: number | null
  goDeeper: boolean
  result: Record<string, unknown>
}): Promise<void> {
  const {
    bookLibraryId, bookshelfItemId, familyId, memberId,
    extractionType, sectionTitle, sectionIndex, goDeeper, result,
  } = opts

  // Map extraction_type to the 5 table types and their items
  type ExtractionBucket = {
    platformType: string // extraction_type for platform_intelligence
    oldTable: string
    items: ExtractionItem[]
  }

  const buckets: ExtractionBucket[] = []

  if (extractionType === 'combined_section') {
    // Combined has all 5 types in one result object
    if (Array.isArray(result.summaries)) {
      buckets.push({
        platformType: 'summary',
        oldTable: 'bookshelf_summaries',
        items: result.summaries as ExtractionItem[],
      })
    }
    if (Array.isArray(result.insights)) {
      buckets.push({
        platformType: 'insight',
        oldTable: 'bookshelf_insights',
        items: result.insights as ExtractionItem[],
      })
    }
    if (Array.isArray(result.declarations)) {
      buckets.push({
        platformType: 'declaration',
        oldTable: 'bookshelf_declarations',
        items: result.declarations as ExtractionItem[],
      })
    }
    if (Array.isArray(result.action_steps)) {
      buckets.push({
        platformType: 'action_step',
        oldTable: 'bookshelf_action_steps',
        items: result.action_steps as ExtractionItem[],
      })
    }
    if (Array.isArray(result.questions)) {
      buckets.push({
        platformType: 'question',
        oldTable: 'bookshelf_questions',
        items: result.questions as ExtractionItem[],
      })
    }
  } else {
    // Single-tab: result has { items: [...] }
    const items = result.items as ExtractionItem[] | undefined
    if (!items || !Array.isArray(items) || items.length === 0) return

    const typeMap: Record<string, { platformType: string; oldTable: string }> = {
      summary_section: { platformType: 'summary', oldTable: 'bookshelf_summaries' },
      insights_section: { platformType: 'insight', oldTable: 'bookshelf_insights' },
      declarations_section: { platformType: 'declaration', oldTable: 'bookshelf_declarations' },
      action_steps_section: { platformType: 'action_step', oldTable: 'bookshelf_action_steps' },
      questions_section: { platformType: 'question', oldTable: 'bookshelf_questions' },
    }
    const mapping = typeMap[extractionType]
    if (!mapping) return
    buckets.push({ ...mapping, items })
  }

  if (buckets.length === 0) return

  // 1. Write to platform_intelligence.book_extractions via RPC
  if (bookLibraryId) {
    try {
      for (const bucket of buckets) {
        const platformRows = bucket.items.map((item, idx) => ({
          extraction_type: bucket.platformType,
          text: bucket.platformType === 'declaration'
            ? (item.declaration_text || item.text || '')
            : (item.text || ''),
          guided_text: item.guided_text || null,
          independent_text: item.independent_text || null,
          content_type: item.content_type || item.question_type || null,
          declaration_text: bucket.platformType === 'declaration'
            ? (item.declaration_text || null)
            : null,
          style_variant: item.style_variant || item.declaration_style || null,
          value_name: item.value_name || null,
          richness: item.richness || null,
          section_title: sectionTitle,
          section_index: sectionIndex,
          sort_order: item.sort_order ?? idx,
          is_key_point: item.is_key_point ?? false,
          is_from_go_deeper: goDeeper,
        }))

        const { error: rpcErr } = await supabase.rpc('insert_book_extractions', {
          p_book_library_id: bookLibraryId,
          p_extractions: platformRows,
          p_audience: 'original',
        })

        if (rpcErr) {
          console.error(
            `[bookshelf-extract] Platform insert failed for ${bucket.platformType}:`,
            rpcErr.message,
          )
        } else {
          console.log(
            `[bookshelf-extract] Platform persisted ${platformRows.length} ${bucket.platformType} extractions`,
          )
        }
      }
    } catch (err) {
      console.error('[bookshelf-extract] Platform extraction persistence failed (non-fatal):', err)
    }
  }

  // 2. Dual-write to old per-family tables
  try {
    for (const bucket of buckets) {
      const baseFields = {
        family_id: familyId,
        family_member_id: memberId,
        bookshelf_item_id: bookshelfItemId,
        section_title: sectionTitle,
        section_index: sectionIndex,
        audience: 'original',
        is_from_go_deeper: goDeeper,
        is_hearted: false,
        is_deleted: false,
        is_included_in_ai: true,
      }

      if (bucket.oldTable === 'bookshelf_declarations') {
        // Declarations have a different column shape
        const rows = bucket.items.map((item, idx) => ({
          ...baseFields,
          declaration_text: item.declaration_text || item.text || '',
          value_name: item.value_name || null,
          style_variant: item.style_variant || null,
          richness: item.richness || null,
          sort_order: item.sort_order ?? idx,
          is_key_point: item.is_key_point ?? false,
        }))
        const { error } = await supabase.from(bucket.oldTable).insert(rows)
        if (error) {
          console.error(`[bookshelf-extract] Old table ${bucket.oldTable} insert failed:`, error.message)
        }
      } else {
        // Summaries, insights, action_steps, questions all share a common shape
        const rows = bucket.items.map((item, idx) => ({
          ...baseFields,
          text: item.text || '',
          content_type: item.content_type || item.question_type || null,
          sort_order: item.sort_order ?? idx,
          is_key_point: item.is_key_point ?? false,
        }))
        const { error } = await supabase.from(bucket.oldTable).insert(rows)
        if (error) {
          console.error(`[bookshelf-extract] Old table ${bucket.oldTable} insert failed:`, error.message)
        }
      }
    }
    console.log(
      `[bookshelf-extract] Old-table dual-write complete for ${buckets.length} extraction types`,
    )
  } catch (err) {
    console.error('[bookshelf-extract] Old-table dual-write failed (non-fatal):', err)
  }

  // Mark bookshelf_items.extraction_status = 'completed' after first successful extraction
  try {
    await supabase
      .from('bookshelf_items')
      .update({ extraction_status: 'completed', intake_completed: true })
      .eq('id', bookshelfItemId)
      .eq('extraction_status', 'none') // Only update if not already completed (idempotent)
  } catch {
    // Non-fatal
  }
}

// ============================================================
// Extraction Prompts
// ============================================================

// Shared youth adaptation addendum — appended to every extraction prompt
const YOUTH_ADAPTATION_ADDENDUM = `

=== YOUTH ADAPTATIONS (include on EVERY item) ===
Every item must include TWO additional text fields alongside the adult version:
- "guided_text": Rewritten for ages 8-12 (Guided shell). Use simple vocabulary, concrete examples a child can picture, warm encouraging tone. Replace abstract concepts with relatable imagery. For stories, focus on what the character learned. For principles, say what it means in kid terms. 1-2 sentences max. For declarations, rewrite as something a kid would genuinely say — "I want to be someone who..." not "I choose to embody..."
- "independent_text": Rewritten for ages 13-16 (Independent teen shell). Use age-appropriate vocabulary, relatable examples (school, friendships, identity, future). Preserve the core meaning but frame it through a teen's world. Can be slightly longer than guided (2-3 sentences). For declarations, teens can handle more sophisticated language but should still sound authentic to a teenager.

CONTENT SAFETY FOR YOUTH VERSIONS:
- Never encourage secrecy, exclusivity, or hidden relationships
- Never suggest hiding things from parents or trusted adults
- Frame all relationship advice around openness, kindness, and inclusion
- If the original content promotes unhealthy dynamics, rewrite the youth version to model the POSITIVE alternative
- For fiction: focus on what the CHARACTER LEARNED, not on imitating morally complex behaviors
- Prioritize lessons about courage, integrity, kindness, resilience, and growth

If the original item's content is genuinely not age-appropriate for a particular level (e.g., marital intimacy), set that level's text to null.`

// NOTE: The insights prompt is adapted from StewardShip's FRAMEWORK_EXTRACTION_PROMPT.
// Key difference: MyAIM v2 uses a FLAT bookshelf_insights table (no parent framework row).
// Output is an array of flat items with content_type, not a nested framework/principles object.

const SUMMARY_EXTRACTION_PROMPT = `You are an expert at extracting the essential content from books and documents. Given the text, extract the key concepts, stories, metaphors, lessons, and insights that capture the essence of this content.

Rules:
- SECTION SYNOPSIS: ALWAYS begin with a "narrative_summary" item — a 3-6 sentence overview of what this section covers and its key takeaways. For fiction/allegory, summarize the plot events, character actions, and how the story advances. For non-fiction, summarize the chapter's argument, main points, and what the reader should take away. This anchors all the detailed extractions that follow.
- COHESION RULE: Group related ideas into a single item. A multi-step process, a complete story arc, or a cluster of related points from the same concept should be ONE item, not split across several. Prefer fewer, richer items over more granular ones.
- Use section length as a rough guide: ~1 item per 2,000-3,000 characters of input (not counting the narrative_summary). A short section should produce 2-5 items, a long one 8-15. Exceed this for genuinely dense content, but never pad with thin extractions to fill a quota.
- Each item should STAND ALONE — someone reading just that item should understand it without having read the book
- Capture diverse content types: key concepts, memorable stories, powerful metaphors, character insights, practical lessons, notable quotes, thematic observations
- Preserve the author's distinctive language when it captures something uniquely well
- For stories and examples, capture enough context to understand the point (2-4 sentences)
- For concepts and principles, be precise and complete (1-3 sentences)
- For quotes: extract the EXACT words from the text — do not paraphrase. Include the speaker or context in a brief note (e.g., "Aslan says: '...'"). Prioritize lines that are profound, beautiful, moving, or capture deep truth. These are lines someone would want to highlight and return to.
- Label each item with its content_type so the user can see what kind of content it is
- Do NOT extract trivial filler content — each item should be genuinely worth remembering

Return ONLY a JSON object:
{
  "items": [
    { "content_type": "narrative_summary", "text": "Synopsis...", "guided_text": "Kid version...", "independent_text": "Teen version...", "sort_order": 0 },
    { "content_type": "key_concept", "text": "Clear explanation...", "guided_text": "Kid version...", "independent_text": "Teen version...", "sort_order": 1 }
  ]
}

Valid content_type values: "narrative_summary", "key_concept", "story", "metaphor", "lesson", "quote", "insight", "theme", "character_insight", "exercise", "principle"
No markdown backticks, no preamble.` + YOUTH_ADAPTATION_ADDENDUM

// Flat insights prompt — adapted from FRAMEWORK_EXTRACTION_PROMPT.
// StewardShip output was { framework_name, principles: [...] }.
// MyAIM output is { items: [{ content_type, text, sort_order }] } — flat, no parent.
const INSIGHTS_EXTRACTION_PROMPT = `You are an expert at distilling books and content into concise, actionable principles and mental models. Given the text of a book section, extract the key principles, mental models, frameworks, processes, strategies, concepts, and systems.

Rules:
- COHESION RULE: A named process, technique, or system is ONE insight — never split its steps across multiple items. But distinct standalone insights should each be their own item even if they relate to a common theme.
- Be thorough — extract generously. Use section length as a rough guide: ~1 insight per 1,000-2,000 characters of input. A short section may produce 3-8 items, a long one 10-20. It is better to capture an insight that turns out to be minor than to miss one that matters. Never pad with generic filler, but do not hold back on distinct, actionable content.
- MINIMUM: Every section with substantive content MUST produce at least 3 insights. If you find yourself producing fewer, look harder — the content has insights even if they are implicit rather than stated as rules.
- Default insight length: 1-3 complete sentences. Never cut off mid-thought.
- EXCEPTION — Processes, systems, and step-by-step methods: When content describes a multi-step process, a system, or a sequential method, extract it as an insight with numbered steps. These may be 3-8 sentences to capture the full process.
- NEVER skip a named process, technique, step sequence, or method. If the content describes a specific procedure with steps (e.g., "The Rule of 3," "The 5-Step Correction Process," "How to disagree appropriately"), extract the COMPLETE process with all steps.
- Focus on ACTIONABLE insights — things that can guide decisions and behavior
- Include the source's unique language/metaphors when they capture concepts well
- Don't just summarize — extract the tools and models
- Avoid generic self-help platitudes. Extract what makes THIS source distinctive
- Include contrasts the author draws (e.g., "X vs Y" distinctions that help frame thinking)
- Every insight must be a COMPLETE thought. If you cannot fit it in 3 sentences, use more. A complete insight is always better than a truncated one.
- Label each item with its content_type:
  - "principle" — A core rule or truth that guides behavior
  - "framework" — A structured way of thinking about a problem
  - "mental_model" — A lens or metaphor for understanding the world
  - "process" — A step-by-step method or system to follow
  - "strategy" — A tactical approach to achieving a goal
  - "concept" — An important idea or definition from the content
  - "system" — An interconnected set of practices or principles
  - "tool_set" — A collection of practical tools or techniques

Return ONLY a JSON object:
{
  "items": [
    { "content_type": "principle", "text": "Principle statement...", "guided_text": "Kid version...", "independent_text": "Teen version...", "sort_order": 0 },
    { "content_type": "process", "text": "Process: (1) Step. (2) Step.", "guided_text": "Kid version...", "independent_text": "Teen version...", "sort_order": 1 }
  ]
}

No markdown backticks, no preamble.` + YOUTH_ADAPTATION_ADDENDUM

const DECLARATIONS_EXTRACTION_PROMPT = `You are helping someone distill the wisdom from a book into personal declarations — honest commitment statements they can live by.

Declarations are NOT affirmations. An affirmation claims a finished state ("I am patient"). A declaration claims a present truth ("I choose to respond with patience, even when it's hard"). The difference: every part of someone — mind, spirit, gut — can say "yes, that's true" about a declaration, right now, in the act of declaring it. No honesty gap. No inner friction.

THE HONESTY TEST: Can every part of the reader say "yes, that's true" RIGHT NOW? Not about some future self. Not if they squint. True in the act of declaring it. "I am patient" fails on a hard day. "I choose to respond with patience, even when everything in me wants to react" — the choosing is immediately true.

FIVE DECLARATION STYLES (use the style that best fits each insight — mix them freely so the collection feels like a portrait, not a checklist):
1. "choosing_committing" — The truth lives in the decision itself. The reader hasn't arrived — they've chosen. "I choose courage over comfort, knowing that brave hearts change the world." / "I choose presence over perfection. My family doesn't need me flawless. They need me here." / "I choose to lead with curiosity instead of control."
2. "recognizing_awakening" — Honors growth the reader can actually see happening. The awareness is the truth. "I notice I am becoming someone who listens before reacting — and I'm proud of that shift." / "I recognize that something in me is awakening — a hunger for depth over distraction." / "I see myself growing, even when the progress feels invisible to everyone else."
3. "claiming_stepping_into" — Bold identity claims — not earned through performance, but owned through decision. Often connects to worth, belonging, purpose. "I carry dignity with calm strength, knowing I belong to the King." / "I hold fast to hope, a light that endures even when shadows fall." / "I am a seeker of deeper truths, attuned to the whispers hidden in story, in nature, and in the quiet corners of ordinary life."
4. "learning_striving" — Respects the messy middle. The learning IS the truth. The pursuit IS the truth. "I pursue wisdom like a hidden treasure, listening for truth in story, in study, and in stillness." / "I am learning to sit with discomfort instead of running from it or numbing it away." / "I act with discernment, tuning my heart to both the whisper within and the enduring truths beyond me."
5. "resolute_unashamed" — Burns with conviction. A line in the sand, a vow, a battle cry. The fire IS the truth. "I cannot be bought, compromised, detoured, lured away, divided, or delayed." / "I do hard things until hard things become easy. And then I find harder things." / "Legacy is the quiet story my life tells. I plant seeds for trees I may never sit beneath, believing they will one day offer shade to others."

THREE RICHNESS LEVELS (generate a mix across all three — aim for roughly a third of each, though the book's content and tone should guide the natural balance):

RICH (Multi-Sentence, Layered) — Weaves together an identity claim, a grounding conviction, and an embodiment statement. Poetic, textured, deeply affirming.
Examples:
- "I am redeemed. I am deeply known and deeply beloved. My story is shaped by grace — every part molded into something meaningful. Redemption restores who I truly am and invites me to keep becoming."
- "I wear responsibility as a mark of strength and trust. I take ownership of my words, my actions, and the impact they leave behind — with resolve and a conviction that what must be done often begins with me."
- "I am lit by the flame of curiosity, eager to ask, seek, and explore. I believe the pursuit of truth begins with a question — and I am brave enough to follow it."

MEDIUM (One Strong Sentence with Grounding) — A single powerful statement with a phrase that grounds it in honesty or conviction.
Examples:
- "I choose to respond with patience, even when everything in me wants to react."
- "I claim the courage that has always been in me, waiting for permission to rise."
- "I recognize that my sensitivity is not a weakness — it is how I feel the world."

CONCISE (Short, Punchy, Direct) — Brief declarations that land with impact. Can serve as seeds a reader expands through personal editing.
Examples:
- "I choose courage over comfort."
- "My face is set. My mission is clear."
- "I refuse to let fear write the story that faith has already authored."

CRITICAL RULES:
- AVOID THE "I AM + FINISHED STATE" TRAP: Never produce declarations like "I am patient" or "I am confident" that claim an arrived state. The truth must live in the choosing, the claiming, the recognizing, the learning, or the resolve — not in a performance claim the reader's discernment will reject.
- VARY SENTENCE OPENINGS: Never produce a wall of "I am..." or "I choose..." statements. Mix voices and structures so each declaration has its own rhythm and personality.
- STANDALONE RULE: Each declaration must make complete sense on its own, without having read the book. Someone reading just the declaration should understand what it means and why it matters.
- PERSONALITY RULE: Declarations should sound like a real person wrote them — not a self-help template. Include details, imagery, and language that give each one its own rhythm and voice. "I choose courage over comfort" has more soul than "I am brave."
- VARIETY RULE: Use DIFFERENT styles across your extractions. Don't default to just one style. The most powerful creeds draw from all five voices — a mix of gentle and fierce, choosing and standing firm.
- LET SOME BE FIERCE: Not every declaration should be gentle. Some should roar. The Resolute & Unashamed voice exists because conviction IS honesty.
- LET SOME BE TENDER: The Recognizing & Awakening voice exists because noticing growth is its own kind of brave. Both fierceness and tenderness belong.
- COHESION RULE: Don't create multiple declarations about the same idea from different angles — but distinct values or insights each deserve their own declaration.
- GENRE AWARENESS: Fiction and allegory produce declarations grounded in character themes and narrative truths. Scriptures produce declarations grounded in faith identity. Workbooks produce declarations grounded in practical commitment. Adjust tone and source material accordingly.
- Extract 3-10 declarations depending on content richness. It is better to offer a declaration the user can delete than to miss one that would have resonated.
- Each declaration should connect to a genuine value or insight from the content
- Include an optional value_name (1-3 words) that names the underlying value: e.g., "Patience", "Courage Under Pressure", "Active Listening"
- Faith-connected declarations are appropriate when the source material has spiritual depth
- Use direct construction over passive progressive: "I choose" not "I am choosing." Present tense, active voice, direct.

NEVER GENERATE:
- "I am patient." / "I am wealthy." / "I am enough." (Finished-state affirmations — fail the honesty test)
- "Every day in every way I am getting better." (Formulaic, no personality, no grounding)
- "I will try to..." (Trying is not declaring)
- Declarations requiring external validation ("People see me as...")
- Goals dressed as identity statements ("I am someone who exercises 5 days a week")

Return ONLY a JSON object:
{
  "items": [
    { "value_name": "Intentional Presence", "declaration_text": "I choose to be fully present...", "guided_text": "Kid version...", "independent_text": "Teen version...", "declaration_style": "choosing_committing", "sort_order": 0 }
  ]
}

No markdown backticks, no preamble.` + YOUTH_ADAPTATION_ADDENDUM

const ACTION_STEPS_EXTRACTION_PROMPT = `You are an expert at translating book wisdom into concrete, actionable steps. Given a section of text, extract specific actions, exercises, practices, and steps that a reader can carry out to apply what they've learned.

Rules:
- Every action step must be SPECIFIC and ACTIONABLE — something someone can do today or this week. Not "be more mindful" but "Set a daily 5-minute timer and practice noticing three things you're grateful for."
- COHESION RULE: A multi-step exercise or practice is ONE item, not split across several. Include all steps together.
- Use section length as a rough guide: ~1 action step per 2,000-3,000 characters of input. A short section may produce 2-5 steps, a long one 8-15.
- Steps should STAND ALONE — someone reading just that step should understand what to do without having read the book.
- For exercises explicitly described in the text, preserve the author's method faithfully.
- For concepts without explicit exercises, CREATE practical action steps that embody the principle. These should be concrete, not generic.
- Include brief CONTEXT for why this action matters (1 sentence before or after the action).
- IMPORTANT: Action steps must be ACTIONS, not questions. Do NOT include journaling prompts, reflection questions, or "write about..." items here — those belong in the Questions extraction. Every item should start with a verb describing something to DO (practice, set, schedule, create, build, track, etc.), not something to think about or write about.
- Label each with its content_type:
  - "exercise" — A structured activity described in the text
  - "practice" — An ongoing behavioral discipline to adopt
  - "habit" — A repeatable daily/weekly routine to build
  - "conversation_starter" — Something to discuss with a spouse, friend, or mentor
  - "project" — A larger undertaking (multi-day or multi-week)
  - "daily_action" — Something small to do each day
  - "weekly_practice" — Something to do weekly
- Avoid generic self-help platitudes. Every step should trace back to a SPECIFIC insight from this content.
- For fiction/allegory/memoir, derive action steps from the character's lessons, mistakes, or growth moments.

Return ONLY a JSON object:
{
  "items": [
    { "content_type": "exercise", "text": "Concrete exercise...", "guided_text": "Kid version...", "independent_text": "Teen version...", "sort_order": 0 }
  ]
}

Valid content_type values: "exercise", "practice", "habit", "conversation_starter", "project", "daily_action", "weekly_practice"
No markdown backticks, no preamble.` + YOUTH_ADAPTATION_ADDENDUM

const QUESTIONS_EXTRACTION_PROMPT = `You are an expert at crafting reflective questions that help readers deeply internalize and apply what they read. Given a section of text, extract and create thoughtful questions that guide personal growth.

The questions should help the reader:
- REFLECT on how the content connects to their own life and experiences
- RECOGNIZE ways the teachings have already had an effect in their lives
- IMPLEMENT the wisdom by identifying concrete next steps
- EXAMINE their own patterns, beliefs, and behaviors in light of the content
- DISCUSS the ideas meaningfully with others (book club, colloquium, mentor, spouse)
- EXPLORE hypothetical scenarios that deepen understanding

Rules:
- Questions must be OPEN-ENDED — never yes/no. They should invite genuine reflection, not simple recall.
- Each question should STAND ALONE — someone reading just the question should be able to reflect meaningfully, even without having read the book. Include enough context in the question itself.
- TIMELESS RULE: Questions should still make sense and still provoke thought six months after reading the book. They should be relevant to the content but not dependent on having it fresh in mind. A reader scrolling through their prompt library long after finishing the book should find every question immediately usable.
- COHESION RULE: A multi-part reflection sequence is ONE item. If a question naturally has a follow-up ("...and if so, how has that changed you?"), keep them together.
- Use section length as a rough guide: ~1-2 questions per 2,000-3,000 characters of input. A short section may produce 2-5 questions, a long one 8-15.
- Questions should be PERSONAL and INVITING — use "you/your" language. Not clinical or academic.
- GENRE-WEIGHTED MIX: Aim for a natural distribution of content_types weighted toward the book's genre. A parenting book produces more implementation and discussion questions. A spiritual memoir produces more reflection and self_examination. A leadership book produces more scenario and implementation. Let the content guide the balance — don't force equal distribution across types.
- NOT A READING QUIZ: These are journal prompts for personal growth, NOT comprehension questions. Never ask about characters, plot points, or what the author said as if testing whether the reader did the homework. BAD: "How did Character X demonstrate courage?" GOOD: "Think of a time you had to act before you felt ready. What gave you the push — and what held you back?" The book's ideas should inspire the question's theme, but the question itself should be about the READER'S life, not the book's content.
- For fiction/allegory/memoir: extract the underlying human theme (courage, forgiveness, identity, sacrifice) and ask about THAT — not about the characters. The reader should never need to remember who did what in the story.
- For non-fiction: ask about applying principles to the reader's own context, recognizing patterns in their life, and identifying growth areas — not about restating what the author taught.
- For scripture/sacred texts: ask about spiritual application, personal relevance, and lived experience.
- Label each with its content_type:
  - "reflection" — Inward-looking: How does this connect to who you are or want to become?
  - "implementation" — Forward-looking: How could you apply this teaching starting today?
  - "recognition" — Backward-looking: Where has this principle already shown up in your life?
  - "self_examination" — Pattern-seeking: What does this reveal about your habits, beliefs, or tendencies?
  - "discussion" — Outward-looking: A question for a book club, colloquium, mentor conversation, or family discussion
  - "scenario" — Hypothetical: "What would you do if..." or "Imagine that..." to deepen understanding

Return ONLY a JSON object:
{
  "items": [
    { "content_type": "reflection", "text": "Adult question...", "guided_text": "Kid version...", "independent_text": "Teen version...", "sort_order": 0 }
  ]
}

Valid content_type values: "reflection", "implementation", "recognition", "self_examination", "discussion", "scenario"
No markdown backticks, no preamble.` + YOUTH_ADAPTATION_ADDENDUM

// Combined: all five extractions in a single Sonnet call per section.
// The insights section uses the FLAT structure (items array), not the nested framework object.
const COMBINED_SECTION_PROMPT = `You are an expert at extracting the essential content from books and documents. Given a section of text, perform FIVE extraction tasks simultaneously and return all results in a single JSON response.

=== TASK 1: SUMMARIES ===
Extract the key concepts, stories, metaphors, lessons, and insights that capture the essence of this content.
- SECTION SYNOPSIS: ALWAYS begin with a "narrative_summary" item — a 3-6 sentence overview of what this section covers and its key takeaways. For fiction/allegory, summarize the plot events, character actions, and how the story advances. For non-fiction, summarize the chapter's argument, main points, and what the reader should take away. This anchors all the detailed extractions that follow.
- COHESION RULE: Group related ideas into a single item. A multi-step process, a complete story arc, or a cluster of related points from the same concept should be ONE item, not split across several. Prefer fewer, richer items over more granular ones.
- Use section length as a rough guide: ~1 item per 2,000-3,000 characters of input (not counting the narrative_summary). A short section should produce 2-5 items, a long one 8-15. Exceed this for genuinely dense content, but never pad with thin extractions to fill a quota.
- Each item should STAND ALONE — someone reading just that item should understand it without having read the book
- Capture diverse content types: key concepts, memorable stories, powerful metaphors, character insights, practical lessons, notable quotes, thematic observations
- Preserve the author's distinctive language when it captures something uniquely well
- For stories and examples, capture enough context to understand the point (2-4 sentences)
- For concepts and principles, be precise and complete (1-3 sentences)
- For quotes: extract the EXACT words from the text — do not paraphrase. Include the speaker or context briefly (e.g., "Aslan says: '...'"). Prioritize lines that are profound, beautiful, moving, or capture deep truth.
- Label each item with its content_type
- Do NOT extract trivial filler content
- Valid content_type values: "narrative_summary", "key_concept", "story", "metaphor", "lesson", "quote", "insight", "theme", "character_insight", "exercise", "principle"

=== TASK 2: INSIGHTS (Principles & Mental Models) ===
Extract the key principles, mental models, frameworks, processes, strategies, concepts, and systems.
IMPORTANT: This section is the MOST VALUABLE extraction. Users rely on these insights as a distilled toolkit from the book. Be generous — do NOT under-extract here.
- COHESION RULE: A named process, technique, or system is ONE insight — never split its steps across multiple items. But distinct standalone insights should each be their own item even if they relate to a common theme.
- Be thorough — extract generously. Use section length as a rough guide: ~1 insight per 1,000-2,000 characters of input. A short section may produce 3-8 items, a long one 10-20. It is better to capture an insight that turns out to be minor than to miss one that matters. Never pad with generic filler, but do not hold back on distinct, actionable content.
- MINIMUM: Every section with substantive content MUST produce at least 3 insights. If you find yourself producing fewer, look harder — the content has insights even if they're implicit rather than stated as rules.
- Default insight length: 1-3 complete sentences. Never cut off mid-thought.
- EXCEPTION — Processes, systems, and step-by-step methods: extract with numbered steps (3-8 sentences)
- NEVER skip a named process, technique, step sequence, or method
- Focus on ACTIONABLE insights — things that can guide decisions and behavior
- Include the source's unique language/metaphors when they capture concepts well
- Don't just summarize — extract the tools and models
- Avoid generic self-help platitudes. Extract what makes THIS source distinctive
- Include contrasts the author draws (e.g., "X vs Y" distinctions)
- Every insight must be a COMPLETE thought
- Label each with content_type: "principle", "framework", "mental_model", "process", "strategy", "concept", "system", "tool_set"

=== TASK 3: PERSONAL DECLARATIONS ===
Distill the wisdom into personal declarations — honest commitment statements someone could live by.
Declarations are NOT affirmations. Never claim a finished state ("I am patient"). Claim a present truth ("I choose to respond with patience, even when it's hard"). The truth lives in the choosing, the claiming, the recognizing, the learning, or the resolve.
HONESTY TEST: Can every part of the reader say "yes, that's true" RIGHT NOW, in the act of declaring it? If not, reword it.
FIVE DECLARATION STYLES (mix freely so the collection feels like a portrait, not a checklist):
1. "choosing_committing" — The truth lives in the decision: "I choose courage over comfort, knowing that brave hearts change the world." / "I choose presence over perfection. My family doesn't need me flawless. They need me here." / "I choose to lead with curiosity instead of control."
2. "recognizing_awakening" — Honors growth happening: "I notice I am becoming someone who listens before reacting — and I'm proud of that shift." / "I recognize that something in me is awakening — a hunger for depth over distraction." / "I see myself growing, even when the progress feels invisible to everyone else."
3. "claiming_stepping_into" — Bold identity claims owned through decision, not performance: "I carry dignity with calm strength, knowing I belong to the King." / "I hold fast to hope, a light that endures even when shadows fall." / "I am a seeker of deeper truths, attuned to the whispers hidden in story, in nature, and in the quiet corners of ordinary life."
4. "learning_striving" — Respects the messy middle: "I pursue wisdom like a hidden treasure, listening for truth in story, in study, and in stillness." / "I am learning to sit with discomfort instead of running from it or numbing it away." / "I act with discernment, tuning my heart to both the whisper within and the enduring truths beyond me."
5. "resolute_unashamed" — Burns with conviction, a line in the sand: "I cannot be bought, compromised, detoured, lured away, divided, or delayed." / "I do hard things until hard things become easy. And then I find harder things." / "Legacy is the quiet story my life tells. I plant seeds for trees I may never sit beneath."
THREE RICHNESS LEVELS (aim for roughly a third of each — let the book's content guide the natural balance):
- RICH: Multi-sentence, layered (identity + conviction + embodiment). "I wear responsibility as a mark of strength and trust. I take ownership of my words, my actions, and the impact they leave behind."
- MEDIUM: One strong sentence with grounding. "I choose to respond with patience, even when everything in me wants to react."
- CONCISE: Short, punchy, direct. "My face is set. My mission is clear." / "I choose courage over comfort."
- AVOID THE "I AM + FINISHED STATE" TRAP: Never produce "I am patient" or "I am confident" — these claim an arrived state the reader's discernment will reject.
- VARY SENTENCE OPENINGS: Never produce a wall of "I am..." or "I choose..." statements. Mix voices and structures so each has its own rhythm.
- LET SOME BE FIERCE (conviction IS honesty) and LET SOME BE TENDER (noticing growth is its own kind of brave).
- PERSONALITY RULE: Each declaration should sound like a real person wrote it — details, imagery, its own rhythm. Not a self-help template.
- COHESION RULE: Don't create multiple declarations about the same idea from different angles — but distinct values or insights each deserve their own declaration.
- GENRE AWARENESS: Fiction → character themes. Scriptures → faith identity. Workbooks → practical commitment.
- Extract 3-10 declarations depending on content richness. It is better to offer a declaration the user can delete than to miss one that would have resonated.
- STANDALONE RULE: Each declaration must make complete sense on its own
- Include an optional value_name (1-3 words) that names the underlying value
- Use direct construction: "I choose" not "I am choosing." Present tense, active voice.
- Faith-connected declarations are appropriate when the source material has spiritual depth
- NEVER GENERATE: "I am enough" / "Every day in every way..." / "I will try to..." / declarations requiring external validation / goals dressed as identity statements

=== TASK 4: ACTION STEPS ===
Extract concrete, actionable steps, exercises, practices, and activities that a reader can carry out to apply what they've learned from this section.
- Every action step must be SPECIFIC and ACTIONABLE — not "be more mindful" but "Set a daily 5-minute timer and practice noticing three things you're grateful for."
- COHESION RULE: A multi-step exercise or practice is ONE item. Include all steps together.
- Extract 3-8 action steps depending on content richness.
- Steps should STAND ALONE — understandable without having read the book.
- For exercises explicitly described in the text, preserve the author's method faithfully.
- For concepts without explicit exercises, CREATE practical action steps that embody the principle.
- Include brief context for why the action matters (1 sentence).
- IMPORTANT: Action steps must be ACTIONS, not questions. Do NOT include journaling prompts, reflection questions, or "write about..." items — those belong in Task 5 (Questions). Every item should start with a verb describing something to DO (practice, set, schedule, create, build, track, etc.).
- For fiction/allegory/memoir, derive steps from the character's lessons, mistakes, or growth moments.
- Label each with its content_type: "exercise", "practice", "habit", "conversation_starter", "project", "daily_action", "weekly_practice"
- Avoid generic self-help platitudes. Every step should trace back to a SPECIFIC insight from this section.

=== TASK 5: QUESTIONS ===
Create reflective questions that help the reader deeply internalize and apply the content. Questions should help the reader reflect on their own life, recognize existing growth, plan implementation, examine patterns, and discuss ideas meaningfully with others.
- Questions must be OPEN-ENDED — never yes/no. They should invite genuine reflection, not simple recall.
- Each question should STAND ALONE — include enough context that someone can reflect meaningfully without having read the book.
- TIMELESS RULE: Questions should still provoke thought months after reading. Relevant to the content but not dependent on having it fresh in mind — usable when browsing a prompt library long after finishing the book.
- Use "you/your" language — personal and inviting, not clinical or academic.
- COHESION RULE: A multi-part reflection sequence is ONE item.
- Extract 3-8 questions depending on content richness.
- GENRE-WEIGHTED MIX: Weight content_types toward the book's genre — parenting → more implementation/discussion, spiritual memoir → more reflection/self_examination, leadership → more scenario/implementation. Let the content guide the balance.
- NOT A READING QUIZ: Journal prompts for personal growth, NOT comprehension questions. Never reference characters, plot, or what the author said. Extract the underlying human theme and ask about the READER'S life. For fiction: ask about the theme (courage, forgiveness, identity), not the characters.
- For scripture/sacred texts, ask about spiritual application, personal relevance, and lived experience.
- Avoid surface-level comprehension questions. Every question should prompt self-examination or life application.
- Label each with its content_type: "reflection", "implementation", "recognition", "self_examination", "discussion", "scenario"

=== YOUTH ADAPTATIONS (on EVERY item in ALL five tasks) ===
Every item must include TWO additional text fields alongside the adult version:
- "guided_text": Rewritten for ages 8-12 (Guided shell). Use simple vocabulary, concrete examples, warm encouraging tone. Replace abstract concepts with things a child can picture. For stories, focus on what the character learned. For principles, say what it means in kid terms. 1-2 sentences max. For declarations, rewrite as something a kid would genuinely say — "I want to be someone who..." not "I choose to embody..."
- "independent_text": Rewritten for ages 13-16 (Independent teen shell). Use age-appropriate vocabulary, relatable examples (school, friendships, identity, future). Preserve the core meaning but frame it through a teen's world. Can be slightly longer than guided (2-3 sentences). For declarations, teens can handle more sophisticated language but should still sound authentic to a teenager.

CONTENT SAFETY FOR YOUTH VERSIONS:
- Never encourage secrecy, exclusivity, or hidden relationships
- Never suggest hiding things from parents or trusted adults
- Frame all relationship advice around openness, kindness, and inclusion
- If the original content promotes unhealthy dynamics, rewrite the youth version to model the POSITIVE alternative
- For fiction: focus on what the CHARACTER LEARNED, not on imitating morally complex behaviors
- Prioritize lessons about courage, integrity, kindness, resilience, and growth

If the original item's content is genuinely not age-appropriate for a particular level (e.g., marital intimacy content), set that level's text to null rather than forcing an awkward adaptation.

Return ONLY a JSON object with all five sections:
{
  "summaries": [
    { "content_type": "narrative_summary", "text": "Synopsis...", "guided_text": "Kid version...", "independent_text": "Teen version...", "sort_order": 0 },
    { "content_type": "key_concept", "text": "Clear explanation...", "guided_text": "Kid version...", "independent_text": "Teen version...", "sort_order": 1 }
  ],
  "insights": [
    { "content_type": "principle", "text": "Principle statement...", "guided_text": "Kid version...", "independent_text": "Teen version...", "sort_order": 0 }
  ],
  "declarations": [
    { "value_name": "Intentional Presence", "declaration_text": "I choose to be fully present...", "guided_text": "Kid version...", "independent_text": "Teen version...", "declaration_style": "choosing_committing", "sort_order": 0 }
  ],
  "action_steps": [
    { "content_type": "exercise", "text": "Concrete exercise...", "guided_text": "Kid version...", "independent_text": "Teen version...", "sort_order": 0 }
  ],
  "questions": [
    { "content_type": "reflection", "text": "Adult question...", "guided_text": "Kid version...", "independent_text": "Teen version...", "sort_order": 0 }
  ]
}

No markdown backticks, no preamble.`

const SECTION_DISCOVERY_PROMPT = `You are analyzing a document to identify its natural sections or chapters for content extraction.

Given the text below, identify the major sections, chapters, or topic boundaries.

CRITICAL RULES:
- Sections must cover the ENTIRE document with NO GAPS. Every character must belong to a section.
- Section boundaries must be contiguous: section 1 ends where section 2 begins, section 2 ends where section 3 begins, etc.
- The first section must start at character 0. The last section must end at the final character of the document.
- Identify as many sections as the document naturally has. A 50-chapter book should have ~50 sections. Never merge distinct chapters together to reduce the count.
- Always prefer individual chapters over grouped/meta sections. If the text references "Chapters X-Y" as a group (e.g., a book's structural overview like "Trunk Section (Chapters 7-15)"), still split into individual chapters. The meta-grouping title can be noted in the section description but each chapter should be its own section.
- If the document has individually titled chapters, each chapter should be its own section, even if the book groups them into parts or sections.
- Use chapter headings if they exist in the text
- If no clear chapter structure, identify major topic shifts
- Each section should be substantial enough to contain extractable content (at least 2000 characters). For documents with many short chapters, it is acceptable for sections to be shorter than 2000 characters rather than merging chapters together.
- Section titles should be descriptive of the CONTENT, not just "Chapter 1"
- Include ALL content — introductions, conclusions, and all chapters. The user will choose which to skip.

SAMPLED DOCUMENTS:
- For very large documents, you may receive evenly-spaced text samples with [POSITION: chars X-Y of Z] markers.
- Use position markers to determine accurate start_char and end_char boundaries for each section.
- Chapter headings may appear anywhere in the samples — scan ALL samples thoroughly for structural markers.
- Every part of the document between position 0 and the total length must be covered by a section, including regions between samples.

NON-CONTENT TAGGING:
- Prefix section titles with [NON-CONTENT] for sections that are NOT substantive content: table of contents, bibliography, references, appendices, indexes, author bios, acknowledgments, copyright pages, endnotes, footnotes, glossaries, "also by" pages, epigraphs, dedications.
- Do NOT tag introductions, forewords, prefaces, or conclusions as non-content — they often contain key ideas.
- Examples: "[NON-CONTENT] Table of Contents", "[NON-CONTENT] Bibliography and References", "[NON-CONTENT] About the Author"

Return ONLY a JSON array:
[
  { "title": "Descriptive title of this section", "start_char": 0, "end_char": 8200, "description": "Brief 1-sentence summary of what this section covers" },
  { "title": "[NON-CONTENT] Table of Contents", "start_char": 8200, "end_char": 9400, "description": "List of chapter headings" }
]

The end_char of one section must exactly equal the start_char of the next section.
No markdown backticks, no preamble.`

// ============================================================
// Safe JSON Parser (ported from reference — handles truncated AI responses)
// ============================================================

function safeParseJSON(raw: string): { parsed: unknown; error?: string } {
  if (!raw || !raw.trim()) return { parsed: null, error: 'Empty AI response' }

  // Strip markdown code fences if present
  let cleaned = raw.trim()
  cleaned = cleaned.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '')
  cleaned = cleaned.trim()

  // Try 1: Direct parse of cleaned content
  try {
    return { parsed: JSON.parse(cleaned) }
  } catch { /* fall through */ }

  // Try 2: Extract JSON object { ... }
  const objMatch = cleaned.match(/\{[\s\S]*\}/)
  if (objMatch) {
    try {
      return { parsed: JSON.parse(objMatch[0]) }
    } catch { /* fall through */ }
  }

  // Try 3: Extract JSON array starting with [{ (object array — most specific)
  const arrObjMatch = cleaned.match(/\[\s*\{[\s\S]*\}/)
  if (arrObjMatch) {
    let candidate = arrObjMatch[0]
    const afterMatch = cleaned.substring(cleaned.indexOf(candidate) + candidate.length)
    const closeBracket = afterMatch.match(/^\s*\]/)
    if (closeBracket) {
      candidate = candidate + closeBracket[0]
    } else {
      candidate = candidate + '\n]'
    }
    try {
      return { parsed: JSON.parse(candidate) }
    } catch { /* fall through */ }
  }

  // Try 3b: Extract any JSON array [ ... ]
  const arrMatch = cleaned.match(/\[[\s\S]*\]/)
  if (arrMatch) {
    try {
      return { parsed: JSON.parse(arrMatch[0]) }
    } catch { /* fall through */ }
  }

  // Try 4: Truncated JSON array recovery
  const jsonArrayStart = cleaned.search(/\[\s*\{/)
  if (jsonArrayStart >= 0) {
    const fromArray = cleaned.substring(jsonArrayStart)
    const lastCompleteObj = fromArray.lastIndexOf('}')
    if (lastCompleteObj > 0) {
      const truncated = fromArray.substring(0, lastCompleteObj + 1) + '\n]'
      try {
        const result = JSON.parse(truncated)
        if (Array.isArray(result) && result.length > 0) {
          console.log(
            `[bookshelf-extract] safeParseJSON: Recovered truncated array with ${result.length} items`,
          )
          return { parsed: result }
        }
      } catch { /* fall through */ }
    }
  }

  // Try 5: Truncated JSON object recovery — for combined extraction responses
  if (cleaned.startsWith('{')) {
    let attempt = cleaned
    const lastQuote = attempt.lastIndexOf('"')
    const quotesBefore = (attempt.substring(0, lastQuote).match(/"/g) || []).length
    if (quotesBefore % 2 === 0) {
      attempt = attempt.substring(0, lastQuote)
    }
    const lastCleanBreak = Math.max(
      attempt.lastIndexOf('}'),
      attempt.lastIndexOf(']'),
      attempt.lastIndexOf('"'),
    )
    if (lastCleanBreak > 0) {
      let truncated = attempt.substring(0, lastCleanBreak + 1)
      const openBraces = (truncated.match(/\{/g) || []).length
      const closeBraces = (truncated.match(/\}/g) || []).length
      const openBrackets = (truncated.match(/\[/g) || []).length
      const closeBrackets = (truncated.match(/\]/g) || []).length
      for (let i = 0; i < openBrackets - closeBrackets; i++) truncated += ']'
      for (let i = 0; i < openBraces - closeBraces; i++) truncated += '}'
      try {
        const result = JSON.parse(truncated)
        if (result && typeof result === 'object') {
          console.log(
            `[bookshelf-extract] safeParseJSON: Recovered truncated object with keys: ${Object.keys(result).join(', ')}`,
          )
          return { parsed: result }
        }
      } catch { /* fall through */ }
    }
  }

  return { parsed: null, error: 'Could not parse JSON from AI response' }
}

// ============================================================
// Retry Helper (transient errors: 429, 502, 503)
// ============================================================

async function fetchWithRetry(
  url: string,
  init: RequestInit,
  maxRetries = 3,
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const response = await fetch(url, init)
    if (response.ok || attempt === maxRetries) return response

    const status = response.status
    if (status !== 429 && status !== 502 && status !== 503) return response

    const delay = Math.pow(2, attempt + 1) * 1000
    const retryAfter = response.headers.get('retry-after')
    const waitMs = retryAfter ? Math.min(parseInt(retryAfter, 10) * 1000, 15000) : delay
    console.log(
      `[bookshelf-extract] Retry ${attempt + 1}/${maxRetries} after ${status}, waiting ${waitMs}ms`,
    )
    await new Promise((r) => setTimeout(r, waitMs))
  }
  throw new Error('fetchWithRetry exhausted retries')
}

// ============================================================
// OpenRouter Headers
// ============================================================

const openRouterHeaders = {
  Authorization: `Bearer ${OPENROUTER_API_KEY}`,
  'Content-Type': 'application/json',
  'HTTP-Referer': 'https://myaimcentral.com',
  'X-Title': 'MyAIM Central BookShelf',
}

// ============================================================
// Declaration Style Sanitizer
// ============================================================

const VALID_DECLARATION_STYLES = [
  'choosing_committing',
  'recognizing_awakening',
  'claiming_stepping_into',
  'learning_striving',
  'resolute_unashamed',
]

function sanitizeDeclarations(
  items: Array<Record<string, unknown>>,
): void {
  for (const item of items) {
    if (
      !item.declaration_style ||
      !VALID_DECLARATION_STYLES.includes(item.declaration_style as string)
    ) {
      item.declaration_style = 'choosing_committing'
    }
  }
}

// ============================================================
// Mark Key Points
// Mark 2-3 items per section as is_key_point — highest-value items.
// Applied to summaries and insights arrays before DB write.
// ============================================================

function markKeyPoints<T extends { sort_order?: number }>(items: T[]): (T & { is_key_point: boolean })[] {
  if (!items || items.length === 0) return []
  // Key points: first narrative_summary (if present) + 1-2 highest-value items
  // Heuristic: mark up to min(3, length) items — positions 0, 1, and (if 5+ items) the midpoint
  const keyCount = Math.min(3, items.length)
  return items.map((item, idx) => ({
    ...item,
    is_key_point: idx < keyCount,
  }))
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

    // Parse and validate
    const body = await req.json()
    const parsed = RequestSchema.safeParse(body)
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: parsed.error.flatten() }),
        { status: 400, headers: jsonHeaders },
      )
    }

    const {
      bookshelf_item_id,
      family_id,
      member_id,
      extraction_type,
      section_start,
      section_end,
      section_title,
      go_deeper,
      existing_items,
    } = parsed.data

    // Fetch book metadata (title, genres, book_library_id, book_cache_id) — needed for prompts + persistence + chunk lookup
    const { data: bookItem, error: bookErr } = await supabase
      .from('bookshelf_items')
      .select('title, author, genres, book_library_id, book_cache_id')
      .eq('id', bookshelf_item_id)
      .eq('family_id', family_id)
      .single()

    if (bookErr || !bookItem) {
      console.error('[bookshelf-extract] Book not found:', bookErr?.message)
      return new Response(
        JSON.stringify({ error: 'Book not found or access denied.' }),
        { status: 404, headers: jsonHeaders },
      )
    }

    const bookTitle = bookItem.title as string
    const bookAuthor = bookItem.author as string | null
    const displayTitle = bookAuthor ? `${bookTitle} by ${bookAuthor}` : bookTitle
    const genres = (bookItem.genres as string[]) || []
    const bookLibraryId = bookItem.book_library_id as string | null
    const bookCacheId = bookItem.book_cache_id as string | null

    const genreContext = buildGenreContext(genres)
    const goDeeperAddendum = go_deeper ? buildGoDeeperAddendum(existing_items) : ''

    // ============================================================
    // SECTION DISCOVERY (Haiku — cheap structural classification)
    // ============================================================
    if (extraction_type === 'discover_sections') {
      // Fetch full text from chunks in order (bookshelf_chunks uses book_cache_id + chunk_text columns)
      const chunkKey = bookCacheId || bookshelf_item_id
      const { data: chunks, error: chunkErr } = await supabase
        .from('bookshelf_chunks')
        .select('chunk_index, chunk_text')
        .eq('book_cache_id', chunkKey)
        .order('chunk_index', { ascending: true })

      if (chunkErr || !chunks || chunks.length === 0) {
        return new Response(
          JSON.stringify({
            error: 'No text chunks found for this book. The book may still be processing.',
          }),
          { status: 404, headers: jsonHeaders },
        )
      }

      const fullText = (chunks as Array<{ chunk_index: number; chunk_text: string }>)
        .map((c) => c.chunk_text)
        .join('\n\n')

      console.log(
        `[bookshelf-extract] discover_sections: book="${bookTitle}" doc_length=${fullText.length} chars`,
      )

      // Haiku 4.5 context = 200K tokens. Use conservative 600K chars (~150-170K tokens).
      const MAX_DISCOVERY_CHARS = 600_000
      let discoveryText = fullText

      if (discoveryText.length > MAX_DISCOVERY_CHARS) {
        const sampleSize = 15_000
        const totalSamples = Math.floor(MAX_DISCOVERY_CHARS / sampleSize)
        const numMiddleSamples = totalSamples - 1
        const step = Math.floor(discoveryText.length / numMiddleSamples)
        const samples: string[] = []

        for (let i = 0; i < numMiddleSamples; i++) {
          const start = i * step
          const end = Math.min(start + sampleSize, discoveryText.length)
          samples.push(
            `[POSITION: chars ${start}-${end} of ${discoveryText.length}]\n` +
              discoveryText.substring(start, end),
          )
        }

        // Always include the document tail so the last chapters are visible
        const tailStart = Math.max(0, discoveryText.length - sampleSize)
        const lastMiddleEnd = (numMiddleSamples - 1) * step + sampleSize
        if (tailStart > lastMiddleEnd - sampleSize / 2) {
          samples.push(
            `[POSITION: chars ${tailStart}-${discoveryText.length} of ${discoveryText.length} — DOCUMENT END]\n` +
              discoveryText.substring(tailStart),
          )
        }

        discoveryText = samples.join('\n\n---\n\n')
        console.log(
          `[bookshelf-extract] discover_sections: sampled ${samples.length} windows (${discoveryText.length} chars) from ${fullText.length} char doc`,
        )
      }

      const discoveryResponse = await fetchWithRetry(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: openRouterHeaders,
          body: JSON.stringify({
            model: HAIKU_MODEL,
            max_tokens: 8192,
            messages: [
              { role: 'system', content: SECTION_DISCOVERY_PROMPT },
              {
                role: 'user',
                content: `Document title: "${displayTitle}"\nDocument (${fullText.length} characters total):\n\n${discoveryText}`,
              },
            ],
          }),
        },
      )

      const discoveryData = await discoveryResponse.json()

      if (!discoveryResponse.ok) {
        const detail =
          discoveryData?.error?.message || JSON.stringify(discoveryData).substring(0, 300)
        console.error('[bookshelf-extract] discover_sections AI error:', discoveryResponse.status, detail)
        return new Response(
          JSON.stringify({
            error: `Section discovery failed (AI ${discoveryResponse.status}): ${detail}`,
          }),
          { status: 502, headers: jsonHeaders },
        )
      }

      const haikuTokens = discoveryData.usage || {}
      logAICost({
        familyId: family_id,
        memberId: member_id,
        featureKey: 'bookshelf_extract',
        model: HAIKU_MODEL,
        inputTokens: haikuTokens.prompt_tokens ?? 0,
        outputTokens: haikuTokens.completion_tokens ?? 0,
      })

      const rawContent = discoveryData.choices?.[0]?.message?.content || ''
      console.log('[bookshelf-extract] discover_sections raw response length:', rawContent.length)

      const { parsed: sectionsRaw, error: parseErr } = safeParseJSON(rawContent)

      // Unwrap if AI returned { sections: [...] } instead of bare array
      let sections = sectionsRaw
      if (
        sections &&
        !Array.isArray(sections) &&
        Array.isArray((sections as Record<string, unknown>).sections)
      ) {
        console.log('[bookshelf-extract] discover_sections: unwrapping { sections: [...] } wrapper')
        sections = (sections as Record<string, unknown>).sections
      }

      if (!sections || !Array.isArray(sections)) {
        console.error('[bookshelf-extract] discover_sections parse failed:', parseErr, 'raw:', rawContent.substring(0, 500))
        return new Response(
          JSON.stringify({ error: parseErr || 'Failed to parse section discovery result' }),
          { status: 500, headers: jsonHeaders },
        )
      }

      const docLength = fullText.length
      const sectionArr = sections as Array<Record<string, unknown>>

      // Validate: force full coverage with no gaps
      if (sectionArr.length > 0) {
        sectionArr[0].start_char = 0
        sectionArr[sectionArr.length - 1].end_char = docLength
        for (let i = 1; i < sectionArr.length; i++) {
          sectionArr[i].start_char = sectionArr[i - 1].end_char
        }
      }

      return new Response(
        JSON.stringify({
          extraction_type: 'discover_sections',
          sections: sectionArr,
          total_chars: docLength,
        }),
        { headers: jsonHeaders },
      )
    }

    // All section extraction types require section_start + section_end
    if (section_start == null || section_end == null) {
      return new Response(
        JSON.stringify({
          error: 'section_start and section_end are required for section extraction',
        }),
        { status: 400, headers: jsonHeaders },
      )
    }

    // Build section text from chunks that overlap the requested range
    const sectionChunkKey = bookCacheId || bookshelf_item_id
    const { data: allChunks } = await supabase
      .from('bookshelf_chunks')
      .select('chunk_index, chunk_text')
      .eq('book_cache_id', sectionChunkKey)
      .order('chunk_index', { ascending: true })

    if (!allChunks || allChunks.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No text chunks found for this book.' }),
        { status: 404, headers: jsonHeaders },
      )
    }

    // Reconstruct full text to extract section slice
    const fullText = (allChunks as Array<{ chunk_index: number; chunk_text: string }>)
      .map((c) => c.chunk_text)
      .join('\n\n')

    let sectionText = fullText.substring(section_start, section_end)

    const MAX_SECTION_CHARS = 80_000
    if (sectionText.length > MAX_SECTION_CHARS) {
      console.log(
        `[bookshelf-extract] ${extraction_type} section="${section_title}" truncated from ${sectionText.length} to ${MAX_SECTION_CHARS} chars`,
      )
      sectionText =
        sectionText.substring(0, MAX_SECTION_CHARS) +
        `\n\n[... ${sectionText.length - MAX_SECTION_CHARS} characters truncated ...]`
    }

    const userContent = `Document title: "${displayTitle}"\nSection: "${section_title || 'Untitled'}"\n\nContent:\n${sectionText}`

    // ============================================================
    // COMBINED SECTION — all five extractions in one Sonnet call
    // ============================================================
    if (extraction_type === 'combined_section') {
      const fullPrompt = COMBINED_SECTION_PROMPT + genreContext + goDeeperAddendum

      const aiResponse = await fetchWithRetry(
        'https://openrouter.ai/api/v1/chat/completions',
        {
          method: 'POST',
          headers: openRouterHeaders,
          body: JSON.stringify({
            model: SONNET_MODEL,
            max_tokens: 32768, // Increased for guided_text + independent_text youth adaptations
            messages: [
              { role: 'system', content: fullPrompt },
              { role: 'user', content: userContent },
            ],
          }),
        },
      )

      const aiData = await aiResponse.json()

      if (!aiResponse.ok) {
        const detail = aiData?.error?.message || JSON.stringify(aiData).substring(0, 300)
        console.error('[bookshelf-extract] combined_section AI error:', aiResponse.status, detail)
        return new Response(
          JSON.stringify({ error: `AI error (${aiResponse.status}): ${detail}` }),
          { status: 502, headers: jsonHeaders },
        )
      }

      logAICost({
        familyId: family_id,
        memberId: member_id,
        featureKey: 'bookshelf_extract',
        model: SONNET_MODEL,
        inputTokens: aiData.usage?.prompt_tokens ?? 0,
        outputTokens: aiData.usage?.completion_tokens ?? 0,
      })

      const rawContent = aiData.choices?.[0]?.message?.content || ''
      const finishReason = aiData.choices?.[0]?.finish_reason || 'unknown'
      console.log(
        `[bookshelf-extract] combined_section section="${section_title}" raw response length: ${rawContent.length}, finish_reason: ${finishReason}`,
      )
      if (finishReason === 'length') {
        console.warn(
          `[bookshelf-extract] combined_section TRUNCATED for section="${section_title}" — response hit max_tokens limit. JSON may be incomplete.`,
        )
      }

      const { parsed: result, error: parseErr } = safeParseJSON(rawContent)
      if (!result) {
        console.error(
          '[bookshelf-extract] combined_section parse failed:',
          parseErr,
          'raw:',
          rawContent.substring(0, 500),
        )
        return new Response(
          JSON.stringify({ error: parseErr || 'Failed to parse combined extraction result' }),
          { status: 500, headers: jsonHeaders },
        )
      }

      const resultObj = result as Record<string, unknown>

      // Sanitize declaration styles
      const declarations = resultObj.declarations as Array<Record<string, unknown>> | undefined
      if (declarations && Array.isArray(declarations)) {
        sanitizeDeclarations(declarations)
      }

      // Log extraction counts
      const summaryCount = Array.isArray(resultObj.summaries) ? (resultObj.summaries as unknown[]).length : 0
      const insightCount = Array.isArray(resultObj.insights) ? (resultObj.insights as unknown[]).length : 0
      const actionCount = Array.isArray(resultObj.action_steps) ? (resultObj.action_steps as unknown[]).length : 0
      const declCount = Array.isArray(resultObj.declarations) ? (resultObj.declarations as unknown[]).length : 0
      const questionCount = Array.isArray(resultObj.questions) ? (resultObj.questions as unknown[]).length : 0
      console.log(
        `[bookshelf-extract] combined_section parsed: summaries=${summaryCount}, insights=${insightCount}, action_steps=${actionCount}, declarations=${declCount}, questions=${questionCount}`,
      )

      if (
        finishReason === 'length' &&
        (actionCount === 0 || declCount === 0 || questionCount === 0)
      ) {
        console.warn(
          `[bookshelf-extract] combined_section LIKELY TRUNCATED — missing action_steps (${actionCount}), declarations (${declCount}), or questions (${questionCount}) for section="${section_title}"`,
        )
      }

      // Mark key points on summaries and insights
      if (Array.isArray(resultObj.summaries)) {
        resultObj.summaries = markKeyPoints(resultObj.summaries as Array<Record<string, unknown>>)
      }
      if (Array.isArray(resultObj.insights)) {
        resultObj.insights = markKeyPoints(resultObj.insights as Array<Record<string, unknown>>)
      }

      // Phase 1b-B: Persist to platform + old tables (non-blocking)
      persistExtractions({
        bookLibraryId,
        bookshelfItemId: bookshelf_item_id,
        familyId: family_id,
        memberId: member_id,
        extractionType: 'combined_section',
        sectionTitle: section_title || null,
        sectionIndex: section_start != null ? section_start : null,
        goDeeper: go_deeper,
        result: resultObj,
      }).catch((err) => {
        console.error('[bookshelf-extract] Extraction persistence failed (non-fatal):', err)
      })

      return new Response(
        JSON.stringify({ extraction_type: 'combined_section', result: resultObj }),
        { headers: jsonHeaders },
      )
    }

    // ============================================================
    // SINGLE-TAB SECTION EXTRACTIONS (Go Deeper / Re-run one tab)
    // ============================================================
    const singleTabTypes: Record<string, string> = {
      summary_section: SUMMARY_EXTRACTION_PROMPT,
      insights_section: INSIGHTS_EXTRACTION_PROMPT,
      declarations_section: DECLARATIONS_EXTRACTION_PROMPT,
      action_steps_section: ACTION_STEPS_EXTRACTION_PROMPT,
      questions_section: QUESTIONS_EXTRACTION_PROMPT,
    }

    const basePrompt = singleTabTypes[extraction_type]
    if (!basePrompt) {
      return new Response(
        JSON.stringify({
          error:
            'Invalid extraction_type. Must be: discover_sections, combined_section, summary_section, insights_section, declarations_section, action_steps_section, questions_section',
        }),
        { status: 400, headers: jsonHeaders },
      )
    }

    const fullPrompt = basePrompt + genreContext + goDeeperAddendum

    const aiResponse = await fetchWithRetry('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: openRouterHeaders,
      body: JSON.stringify({
        model: SONNET_MODEL,
        max_tokens: 8192, // Increased for guided_text + independent_text youth adaptations
        messages: [
          { role: 'system', content: fullPrompt },
          { role: 'user', content: userContent },
        ],
      }),
    })

    const aiData = await aiResponse.json()

    if (!aiResponse.ok) {
      const detail = aiData?.error?.message || JSON.stringify(aiData).substring(0, 300)
      console.error(`[bookshelf-extract] ${extraction_type} AI error:`, aiResponse.status, detail)
      return new Response(
        JSON.stringify({ error: `AI error (${aiResponse.status}): ${detail}` }),
        { status: 502, headers: jsonHeaders },
      )
    }

    logAICost({
      familyId: family_id,
      memberId: member_id,
      featureKey: 'bookshelf_extract',
      model: SONNET_MODEL,
      inputTokens: aiData.usage?.prompt_tokens ?? 0,
      outputTokens: aiData.usage?.completion_tokens ?? 0,
    })

    const rawContent = aiData.choices?.[0]?.message?.content || ''
    console.log(
      `[bookshelf-extract] ${extraction_type} section="${section_title}" raw response length: ${rawContent.length}`,
    )

    const { parsed: result, error: parseErr } = safeParseJSON(rawContent)
    if (!result) {
      console.error(
        `[bookshelf-extract] ${extraction_type} parse failed:`,
        parseErr,
        'raw:',
        rawContent.substring(0, 500),
      )
      return new Response(
        JSON.stringify({ error: parseErr || 'Failed to parse extraction result' }),
        { status: 500, headers: jsonHeaders },
      )
    }

    const resultObj = result as Record<string, unknown>

    // Sanitize declaration styles for declarations_section
    if (extraction_type === 'declarations_section') {
      const items = resultObj.items as Array<Record<string, unknown>> | undefined
      if (items && Array.isArray(items)) {
        sanitizeDeclarations(items)
      }
    }

    // Mark key points for summaries and insights
    if (
      (extraction_type === 'summary_section' || extraction_type === 'insights_section') &&
      Array.isArray(resultObj.items)
    ) {
      resultObj.items = markKeyPoints(resultObj.items as Array<Record<string, unknown>>)
    }

    // Tag Go Deeper items
    if (go_deeper && Array.isArray(resultObj.items)) {
      for (const item of resultObj.items as Array<Record<string, unknown>>) {
        item.is_from_go_deeper = true
      }
    }

    // Phase 1b-B: Persist to platform + old tables (non-blocking)
    persistExtractions({
      bookLibraryId,
      bookshelfItemId: bookshelf_item_id,
      familyId: family_id,
      memberId: member_id,
      extractionType: extraction_type,
      sectionTitle: section_title || null,
      sectionIndex: section_start != null ? section_start : null,
      goDeeper: go_deeper,
      result: resultObj,
    }).catch((err) => {
      console.error('[bookshelf-extract] Extraction persistence failed (non-fatal):', err)
    })

    return new Response(
      JSON.stringify({ extraction_type, result: resultObj }),
      { headers: jsonHeaders },
    )
  } catch (err) {
    console.error('[bookshelf-extract] Unexpected error:', err)
    return new Response(
      JSON.stringify({ error: `Extraction failed: ${(err as Error).message}` }),
      { status: 500, headers: jsonHeaders },
    )
  }
})
