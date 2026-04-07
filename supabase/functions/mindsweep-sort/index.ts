/**
 * mindsweep-sort Edge Function (PRD-17B)
 *
 * The MindSweep brain: receives batched items from any intake channel,
 * runs embedding-first classification (pgvector similarity > 0.85 = free),
 * batches remaining items into a single Haiku LLM call, applies sensitivity
 * rules, detects cross-member references. Returns structured routing decisions.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://esm.sh/zod@3.23.8'
import { handleCors, jsonHeaders } from '../_shared/cors.ts'
import { authenticateRequest } from '../_shared/auth.ts'
import { logAICost } from '../_shared/cost-logger.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const HAIKU_MODEL = 'anthropic/claude-haiku-4.5'

// ── Input Schema ──

const ItemSchema = z.object({
  id: z.string().uuid().optional(),
  content: z.string().min(1),
  content_type: z.enum(['voice_short', 'voice_long', 'text', 'scan_extracted', 'link', 'email', 'calendar_file']),
})

const FamilyMemberSchema = z.object({
  id: z.string().uuid(),
  display_name: z.string(),
  nicknames: z.array(z.string()).optional(),
})

const InputSchema = z.object({
  items: z.array(ItemSchema).min(1).max(50),
  family_id: z.string().uuid(),
  member_id: z.string().uuid(),
  aggressiveness: z.enum(['always_ask', 'trust_obvious', 'full_autopilot']).default('always_ask'),
  always_review_rules: z.array(z.string()).default([]),
  custom_review_rules: z.array(z.string()).default([]),
  // PRD-18 Phase C: rhythm_evening added for MindSweep-Lite (Enhancement 2)
  source_channel: z.enum(['routing_strip', 'quick_capture', 'share_to_app', 'email_forward', 'auto_sweep', 'rhythm_evening']),
  input_type: z.enum(['voice', 'text', 'image', 'link', 'email', 'mixed']),
  family_member_names: z.array(FamilyMemberSchema).default([]),
})

// ── Sensitivity Rule Matchers ──

const SENSITIVITY_PATTERNS: Record<string, RegExp[]> = {
  emotional_children: [
    /\b(crying|upset|angry|scared|anxious|worried|sad|frustrated|meltdown|tantrum|struggled)\b/i,
    /\b(behavior|emotional|feelings|afraid|hurt|lonely|overwhelm)\b/i,
  ],
  relationship_dynamics: [
    /\b(argue|argument|fight|divorce|separate|custody|conflict|tension)\b/i,
    /\b(marriage|relationship|partner|spouse|ex-|dating)\b/i,
  ],
  behavioral_notes: [
    /\b(diagnosis|adhd|autism|asd|ocd|anxiety disorder|depression|medication)\b/i,
    /\b(iep|504|therapy|therapist|counselor|psycholog)\b/i,
  ],
  financial: [
    /\b(debt|loan|payment|overdue|collection|bankruptcy|budget crisis)\b/i,
    /\b(salary|income|layoff|fired|unemployment)\b/i,
  ],
  health_medical: [
    /\b(hospital|surgery|emergency|allergic|symptom|chronic|prescription)\b/i,
    /\b(doctor|appointment|specialist|blood test|mri|scan)\b/i,
  ],
  outside_people: [
    /\b(neighbor|teacher|coach|pastor|friend's parent|coworker)\b/i,
  ],
}

// ── Destination Categories for LLM Classification ──

const CLASSIFICATION_CATEGORIES = [
  { key: 'task', destination: 'task', description: 'Action item, chore, errand, to-do' },
  { key: 'shopping', destination: 'list', detail: { list_type: 'shopping' }, description: 'Grocery item, shopping item, thing to buy' },
  { key: 'calendar', destination: 'calendar', description: 'Event, appointment, date, schedule item, practice, meeting time, conference, show, rehearsal' },
  { key: 'journal', destination: 'journal', description: 'Thought, reflection, gratitude, personal note, memory' },
  { key: 'victory', destination: 'victory', description: 'Achievement, accomplishment, celebration, milestone, win' },
  { key: 'guiding_star', destination: 'guiding_stars', description: 'Value, principle, declaration, life direction' },
  { key: 'best_intention', destination: 'best_intentions', description: 'Goal, intention, habit to build, aspiration' },
  { key: 'backburner', destination: 'backburner', description: 'Someday/maybe idea, not urgent, future consideration' },
  { key: 'self_knowledge', destination: 'innerworkings', description: 'Personality insight, strength, trait, self-discovery' },
  { key: 'archive', destination: 'archives', description: 'Family information, preference, schedule detail, medical info, school info' },
  { key: 'recipe', destination: 'recipe', description: 'Recipe with ingredients and instructions' },
  { key: 'travel', destination: 'calendar', detail: { event_type: 'travel' }, description: 'Flight, hotel, reservation, travel confirmation, itinerary' },
  { key: 'list_item', destination: 'list', description: 'Item for a list (packing, wishlist, to-do list, expenses)' },
]

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

    const input = parsed.data
    const results: ClassifiedItem[] = []
    const needsLlm: { index: number; content: string; contentType: string }[] = []
    let embeddingClassifiedCount = 0
    let totalEmbeddingTokens = 0

    // ── Step 1: Extract items (single vs multi-item detection) ──
    const extractedItems = extractItems(input.items)

    // ── Step 2: Embedding-first classification ──
    for (let i = 0; i < extractedItems.length; i++) {
      const item = extractedItems[i]

      try {
        const embedding = await generateEmbedding(item.text)
        totalEmbeddingTokens += Math.ceil(item.text.length / 4)

        const { data: matches } = await supabase.rpc('classify_by_embedding', {
          query_embedding: JSON.stringify(embedding),
          p_family_id: input.family_id,
          match_threshold: 0.85,
          match_count: 1,
        })

        if (matches && matches.length > 0) {
          const match = matches[0]
          results[i] = {
            original_content: item.originalContent,
            extracted_text: item.text,
            category: match.source_table,
            destination: match.destination,
            confidence: 'high',
            classified_by: 'embedding',
            sensitivity_flag: false,
          }
          embeddingClassifiedCount++
          continue
        }
      } catch {
        // Embedding failed for this item, fall through to LLM
      }

      needsLlm.push({ index: i, content: item.text, contentType: item.contentType })
    }

    // ── Step 3: Batch LLM classification for remaining items ──
    if (needsLlm.length > 0) {
      const llmResults = await batchLlmClassify(needsLlm.map(n => n.content), input.family_id, input.member_id)

      for (let j = 0; j < needsLlm.length; j++) {
        const { index } = needsLlm[j]
        const llmResult = llmResults[j] || {
          category: 'task',
          destination: 'task',
          confidence: 'low',
        }
        results[index] = {
          original_content: extractedItems[index].originalContent,
          extracted_text: extractedItems[index].text,
          category: llmResult.category,
          destination: llmResult.destination,
          destination_detail: llmResult.destination_detail,
          confidence: llmResult.confidence as 'high' | 'medium' | 'low',
          classified_by: 'llm_batch',
          sensitivity_flag: false,
        }
      }
    }

    // ── Step 4: Sensitivity check ──
    for (const result of results) {
      const sensitivityResult = checkSensitivity(
        result.extracted_text,
        input.always_review_rules,
        input.custom_review_rules,
      )
      if (sensitivityResult.flagged) {
        result.sensitivity_flag = true
        result.sensitivity_reason = sensitivityResult.reason
        result.confidence = 'review_required'
      }
    }

    // ── Step 5: Cross-member detection ──
    for (const result of results) {
      const crossMember = detectCrossMember(result.extracted_text, input.family_member_names, input.member_id)
      if (crossMember) {
        result.cross_member = crossMember.name
        result.cross_member_id = crossMember.id
        result.cross_member_action = crossMember.action
      }
    }

    // ── Step 6: Create mindsweep_events record ──
    let itemsAutoRouted = 0
    let itemsQueued = 0
    let itemsDirectRouted = 0

    const queueDestinations = new Set(['task', 'list'])
    const directDestinations = new Set([
      'journal', 'victory', 'guiding_stars', 'best_intentions',
      'backburner', 'innerworkings', 'archives',
    ])

    for (const result of results) {
      const isAutoRoute = shouldAutoRoute(result.confidence, input.aggressiveness)
      if (isAutoRoute) {
        if (directDestinations.has(result.destination)) {
          itemsDirectRouted++
        } else {
          itemsAutoRouted++
        }
      } else {
        itemsQueued++
      }
    }

    const { data: eventData } = await supabase.from('mindsweep_events').insert({
      family_id: input.family_id,
      member_id: input.member_id,
      source_channel: input.source_channel,
      input_type: input.input_type,
      raw_content_preview: extractedItems.length > 0
        ? extractedItems[0].text.substring(0, 200)
        : null,
      items_extracted: results.length,
      items_auto_routed: itemsAutoRouted,
      items_queued: itemsQueued,
      items_direct_routed: itemsDirectRouted,
      aggressiveness_at_time: input.aggressiveness,
      processing_cost_cents: 0, // Updated after LLM cost is known
    }).select('id').single()

    const eventId = eventData?.id

    // ── Step 7: Log embedding cost ──
    if (totalEmbeddingTokens > 0) {
      logAICost({
        familyId: input.family_id,
        memberId: input.member_id,
        featureKey: 'mindsweep_sort',
        model: 'text-embedding-3-small',
        inputTokens: totalEmbeddingTokens,
        outputTokens: 0,
      })
    }

    return new Response(
      JSON.stringify({
        event_id: eventId,
        results: results.map(r => ({
          ...r,
          // Map recipe dual-routing
          ...(r.category === 'recipe' ? { destination_detail: { dual_route: true, recipe_to: 'archives', ingredients_to: 'list' } } : {}),
        })),
        totals: {
          items_extracted: results.length,
          items_auto_routed: itemsAutoRouted,
          items_queued: itemsQueued,
          items_direct_routed: itemsDirectRouted,
          items_classified_by_embedding: embeddingClassifiedCount,
          items_classified_by_llm: needsLlm.length,
          processing_cost_cents: 0,
        },
      }),
      { headers: jsonHeaders },
    )
  } catch (err) {
    console.error('mindsweep-sort error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: jsonHeaders },
    )
  }
})

// ── Helper Types ──

interface ClassifiedItem {
  original_content: string
  extracted_text: string
  category: string
  destination: string
  destination_detail?: Record<string, unknown>
  confidence: 'high' | 'medium' | 'low' | 'review_required'
  classified_by: 'embedding' | 'llm_batch'
  sensitivity_flag: boolean
  sensitivity_reason?: string
  cross_member?: string
  cross_member_id?: string
  cross_member_action?: 'suggest_route' | 'note_reference'
}

interface ExtractedItem {
  text: string
  originalContent: string
  contentType: string
}

// ── Item Extraction ──
// Single items route directly. Multi-item text content is split by sentence boundaries.
// Scanned images and link summaries are NEVER split — they're single coherent documents.

function extractItems(
  items: { content: string; content_type: string; id?: string }[],
): ExtractedItem[] {
  const extracted: ExtractedItem[] = []

  // Content types that should always be treated as a single document
  const singleDocTypes = new Set(['scan_extracted', 'link', 'email', 'calendar_file'])

  for (const item of items) {
    const content = item.content.trim()
    if (!content) continue

    // OCR output, links, emails, and calendar files = single document, never split
    if (singleDocTypes.has(item.content_type)) {
      extracted.push({
        text: content,
        originalContent: content,
        contentType: item.content_type,
      })
      continue
    }

    // Text/voice: detect multi-item content (bullet points, newline-separated brain dumps)
    const lines = content.split(/\n+/).map(l => l.trim()).filter(Boolean)
    const hasBullets = lines.some(l => /^[-*\u2022\d+.)]\s/.test(l))
    const hasMultipleSentences = lines.length > 2 || content.split(/[.!?]\s+/).length > 3

    if (hasBullets || (hasMultipleSentences && lines.length > 1)) {
      // Multi-item: split each line/bullet as a separate item
      for (const line of lines) {
        const cleaned = line.replace(/^[-*\u2022\d+.)]\s*/, '').trim()
        if (cleaned.length > 2) {
          extracted.push({
            text: cleaned,
            originalContent: content,
            contentType: item.content_type,
          })
        }
      }
    } else {
      // Single item
      extracted.push({
        text: content,
        originalContent: content,
        contentType: item.content_type,
      })
    }
  }

  return extracted
}

// ── Embedding Generation ──

async function generateEmbedding(text: string): Promise<number[]> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'text-embedding-3-small',
      input: text.substring(0, 8000), // Limit input length
    }),
  })

  if (!response.ok) {
    throw new Error(`Embedding API error: ${response.status}`)
  }

  const data = await response.json()
  return data.data[0].embedding
}

// ── Batch LLM Classification ──

interface LlmClassificationResult {
  category: string
  destination: string
  destination_detail?: Record<string, unknown>
  confidence: string
}

async function batchLlmClassify(
  items: string[],
  familyId: string,
  memberId: string,
): Promise<LlmClassificationResult[]> {
  const categoryList = CLASSIFICATION_CATEGORIES
    .map(c => `- ${c.key}: ${c.description}`)
    .join('\n')

  const itemList = items.map((text, i) => `[${i + 1}] ${text}`).join('\n')

  const systemPrompt = `You are a family content classifier for MindSweep, an AI-powered auto-sort system.

Given a list of captured items (from voice memos, text notes, scanned documents, or emails), classify each one.

Categories:
${categoryList}

For each item, respond with a JSON array. Each element:
{
  "index": <1-based index>,
  "category": "<category key>",
  "destination": "<destination>",
  "confidence": "high" | "medium" | "low"
}

Destination mapping:
- task -> "task"
- shopping -> "list" (with destination_detail: {"list_type": "shopping"})
- calendar, travel -> "calendar"
- journal -> "journal"
- victory -> "victory"
- guiding_star -> "guiding_stars"
- best_intention -> "best_intentions"
- backburner -> "backburner"
- self_knowledge -> "innerworkings"
- archive -> "archives"
- recipe -> "recipe"
- list_item -> "list"

If an item is a recipe, set destination to "recipe" — the caller handles dual-routing.
If an item has travel details (flights, hotels, reservations), set category to "travel".

Calendar detection tips — classify as "calendar" if the text contains:
- A specific date AND time (e.g., "April 15 at 3pm", "Tuesday 4-5:30pm")
- Event-like language (class, practice, appointment, meeting, game, recital, concert, lesson, show, performance)
- A location paired with a time
- Confirmation language ("Your reservation is confirmed", "You're registered for")
- Recurring schedule patterns ("every Tuesday", "Mondays and Wednesdays at 2pm")

Calendar items MUST include a "calendar_subtype" in destination_detail:
- "single" — one event, one date/time (appointment, game, class)
- "multi_day" — one event spanning multiple days (conference May 14-16, camp, retreat)
- "options" — one event with multiple available dates/times (showtimes, open sessions, performances where you pick one)
- "recurring" — repeating schedule (weekly practice, MWF classes — same activity on a pattern)
- "series" — multiple distinct scheduled events with different details per date (rehearsal schedule with different cast/scenes)

Calendar destination_detail format:
{
  "calendar_subtype": "single" | "multi_day" | "options" | "recurring" | "series",
  "event_title": "...",
  "event_location": "...",
  "events": [{"date": "YYYY-MM-DD", "start_time": "HH:MM", "end_time": "HH:MM", "notes": "..."}],
  "start_date": "YYYY-MM-DD",
  "end_date": "YYYY-MM-DD",
  "recurrence_days": ["monday", "tuesday", ...],
  "details_by_day": {"monday": "...", "tuesday": "..."}
}
Include only the fields relevant to the subtype. For "options", list every available date in "events". For "multi_day", use start_date and end_date. For "recurring", use recurrence_days + start/end times. For "series", list each event with its unique details in "events".

Be generous with confidence:
- "high" = clearly belongs in this category
- "medium" = likely belongs but could be something else
- "low" = uncertain

Respond ONLY with valid JSON array. No explanation.`

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://myaimcentral.com',
        'X-Title': 'MyAIM Central',
      },
      body: JSON.stringify({
        model: HAIKU_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Classify these ${items.length} items:\n\n${itemList}` },
        ],
        max_tokens: 2048,
      }),
    })

    if (!response.ok) {
      console.error('OpenRouter LLM error:', await response.text())
      return items.map(() => ({ category: 'task', destination: 'task', confidence: 'low' }))
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || '[]'

    // Log cost
    const usage = data.usage || {}
    logAICost({
      familyId,
      memberId,
      featureKey: 'mindsweep_sort',
      model: HAIKU_MODEL,
      inputTokens: usage.prompt_tokens || 0,
      outputTokens: usage.completion_tokens || 0,
    })

    // Parse JSON from response (handle markdown code blocks)
    const jsonStr = content.replace(/```json?\n?/g, '').replace(/```/g, '').trim()
    const parsed = JSON.parse(jsonStr) as Array<{
      index: number
      category: string
      destination: string
      destination_detail?: Record<string, unknown>
      confidence: string
    }>

    // Map back to items array
    const resultMap = new Map<number, LlmClassificationResult>()
    for (const entry of parsed) {
      resultMap.set(entry.index - 1, {
        category: entry.category,
        destination: entry.destination || mapCategoryToDestination(entry.category),
        destination_detail: entry.destination_detail,
        confidence: entry.confidence,
      })
    }

    return items.map((_, i) => resultMap.get(i) || {
      category: 'task',
      destination: 'task',
      confidence: 'low',
    })
  } catch (err) {
    console.error('LLM classification error:', err)
    return items.map(() => ({ category: 'task', destination: 'task', confidence: 'low' }))
  }
}

function mapCategoryToDestination(category: string): string {
  const found = CLASSIFICATION_CATEGORIES.find(c => c.key === category)
  return found?.destination || 'task'
}

// ── Sensitivity Check ──

function checkSensitivity(
  text: string,
  alwaysReviewRules: string[],
  customReviewRules: string[],
): { flagged: boolean; reason?: string } {
  // Check built-in rule patterns
  for (const rule of alwaysReviewRules) {
    const patterns = SENSITIVITY_PATTERNS[rule]
    if (!patterns) continue
    for (const pattern of patterns) {
      if (pattern.test(text)) {
        return { flagged: true, reason: rule }
      }
    }
  }

  // Check custom rules (simple substring match)
  for (const customRule of customReviewRules) {
    if (customRule && text.toLowerCase().includes(customRule.toLowerCase())) {
      return { flagged: true, reason: `custom: ${customRule}` }
    }
  }

  return { flagged: false }
}

// ── Cross-Member Detection ──

function detectCrossMember(
  text: string,
  familyMembers: { id: string; display_name: string; nicknames?: string[] }[],
  currentMemberId: string,
): { name: string; id: string; action: 'suggest_route' | 'note_reference' } | null {
  const lowerText = text.toLowerCase()

  for (const member of familyMembers) {
    if (member.id === currentMemberId) continue

    const namesToCheck = [member.display_name, ...(member.nicknames || [])]
    for (const name of namesToCheck) {
      if (!name || name.length < 2) continue
      const pattern = new RegExp(`\\b${escapeRegex(name)}\\b`, 'i')
      if (pattern.test(text)) {
        // If text seems actionable for that person, suggest routing
        const actionable = /\b(needs?|should|remind|tell|ask|for|pick up|drop off|take|bring|help)\b/i.test(lowerText)
        return {
          name: member.display_name,
          id: member.id,
          action: actionable ? 'suggest_route' : 'note_reference',
        }
      }
    }
  }

  return null
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

// ── Auto-Route Decision ──

function shouldAutoRoute(
  confidence: 'high' | 'medium' | 'low' | 'review_required',
  aggressiveness: string,
): boolean {
  if (confidence === 'review_required') return false

  switch (aggressiveness) {
    case 'always_ask':
      return false
    case 'trust_obvious':
      return confidence === 'high'
    case 'full_autopilot':
      return confidence === 'high' || confidence === 'medium'
    default:
      return false
  }
}
