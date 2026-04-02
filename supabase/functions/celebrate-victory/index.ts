// PRD-11: celebrate-victory Edge Function
// Generates identity-based celebration narratives for victory collections.
// Non-streaming — returns full narrative as JSON.
// Model: Sonnet for adults/teens, Haiku for guided/play kids.

import { z } from 'https://esm.sh/zod@3.23.8'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors, jsonHeaders } from '../_shared/cors.ts'
import { authenticateRequest } from '../_shared/auth.ts'
import { logAICost } from '../_shared/cost-logger.ts'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const MODELS = {
  sonnet: 'anthropic/claude-sonnet-4',
  haiku: 'anthropic/claude-haiku-4.5',
} as const

const RequestSchema = z.object({
  family_member_id: z.string().uuid(),
  mode: z.enum(['collection', 'review', 'monthly']),
  period: z.enum(['today', 'this_week', 'this_month', 'custom']).optional(),
  victory_ids: z.array(z.string().uuid()).min(1),
  custom_start: z.string().optional(),
  custom_end: z.string().optional(),
  voice: z.string().optional(),
})

// ─── Context Loaders ──────────────────────────────────────────

async function loadGuidingStars(memberId: string, familyId: string) {
  const { data } = await supabase
    .from('guiding_stars')
    .select('content, category, entry_type, title')
    .eq('family_id', familyId)
    .eq('member_id', memberId)
    .eq('is_included_in_ai', true)
    .is('archived_at', null)
    .limit(10)
  return data ?? []
}

async function loadBestIntentions(memberId: string, familyId: string) {
  const { data } = await supabase
    .from('best_intentions')
    .select('statement, description, tags')
    .eq('family_id', familyId)
    .eq('member_id', memberId)
    .eq('is_active', true)
    .eq('is_included_in_ai', true)
    .is('archived_at', null)
    .limit(10)
  return data ?? []
}

async function loadInnerWorkings(memberId: string, familyId: string) {
  const { data } = await supabase
    .from('self_knowledge')
    .select('content, category')
    .eq('family_id', familyId)
    .eq('member_id', memberId)
    .eq('is_included_in_ai', true)
    .in('category', ['strength', 'growth_area', 'personality_type'])
    .is('archived_at', null)
    .limit(10)
  return data ?? []
}

async function loadVictories(victoryIds: string[]) {
  const { data } = await supabase
    .from('victories')
    .select('description, importance, life_area_tag, source, custom_tags, created_at')
    .in('id', victoryIds)
    .order('created_at', { ascending: true })
  return data ?? []
}

async function getMemberInfo(memberId: string) {
  const { data } = await supabase
    .from('family_members')
    .select('id, family_id, display_name, role, dashboard_mode')
    .eq('id', memberId)
    .single()
  return data
}

function roleToMemberType(role: string, dashboardMode: string | null): 'adult' | 'teen' | 'guided' | 'play' {
  if (dashboardMode === 'guided') return 'guided'
  if (dashboardMode === 'play') return 'play'
  if (dashboardMode === 'independent') return 'teen'
  switch (role) {
    case 'primary_parent':
    case 'additional_adult':
    case 'special_adult':
      return 'adult'
    default:
      return 'adult'
  }
}

function selectModel(memberType: string): string {
  if (memberType === 'guided' || memberType === 'play') {
    return MODELS.haiku
  }
  return MODELS.sonnet
}

// ─── Voice Personality ────────────────────────────────────────

const VOICE_INSTRUCTIONS: Record<string, string> = {
  enthusiastic_coach: 'Warm, energetic encouragement. Sports/team metaphors. "You crushed it!" energy but always specific to what was accomplished.',
  calm_mentor: 'Wise, gentle, measured. Like a trusted teacher. Thoughtful observations over exclamations.',
  fun_friend: 'Casual, relatable. Uses "honestly" and "like" naturally. Feels like texting a supportive friend.',
  silly_character: 'Playful, goofy, uses fun words. "Holy moly!" and "No way!" Lighthearted but still identity-based.',
  proud_parent: 'Warm parental pride. "I want you to know..." Tender, specific noticing of what the child did.',
  pirate_captain: 'Full pirate dialect. "Arrr!" "Ye did it!" "Shiver me timbers!" But still identity-based celebration.',
  princess: 'Regal warmth. "How wonderfully brave!" Fairy tale language. Elegant, gracious encouragement.',
  sports_announcer: 'Exciting play-by-play. "AND THEY DO IT!" High energy broadcast style with dramatic flair.',
  british_nobleman: 'Proper British. "I say, most impressive." Understated elegance and dry wit.',
  scottish_rogue: 'Scottish warmth. "Ach, ye did grand today!" Hearty, boisterous encouragement.',
  gen_z_influencer: '"No cap, that was literally so fire." Current slang, genuine enthusiasm, supportive energy.',
  news_reporter: '"Breaking news tonight..." Dramatic, authoritative, celebratory reporting style.',
  wizard: 'Mystical wisdom. "The stars foretold great things..." Magical, wonder-filled language.',
  superhero: 'Hero narrative. "With great power comes great responsibility — and you used yours well today."',
  astronaut: 'Space metaphors. "Mission accomplished." Calm, confident, mission-oriented celebration.',
}

function buildVoiceSection(voice: string | undefined): string {
  if (!voice || !VOICE_INSTRUCTIONS[voice]) return ''
  return `\n\nVOICE PERSONALITY: ${voice}\nAdjust your tone and word choice to match this personality:\n${VOICE_INSTRUCTIONS[voice]}\nThe personality affects TONE and WORD CHOICE only. All identity-based celebration rules still apply.`
}

// ─── System Prompt ────────────────────────────────────────────

function buildSystemPrompt(
  mode: string,
  memberName: string,
  guidingStars: { content: string; category?: string; title?: string }[],
  bestIntentions: { statement: string; description?: string }[],
  innerWorkings: { content: string; category: string }[],
  voice?: string,
) {
  const gsSection = guidingStars.length > 0
    ? `\n\nThis person's Guiding Stars (values/declarations they live by):\n${guidingStars.map(gs => `- ${gs.title || gs.content}`).join('\n')}`
    : ''

  const biSection = bestIntentions.length > 0
    ? `\n\nThis person's Best Intentions (what they're actively working on):\n${bestIntentions.map(bi => `- ${bi.statement}`).join('\n')}`
    : ''

  const iwSection = innerWorkings.length > 0
    ? `\n\nWhat this person knows about themselves:\n${innerWorkings.map(iw => `- [${iw.category}] ${iw.content}`).join('\n')}`
    : ''

  const modeInstructions = {
    collection: `Generate a celebration narrative (2-4 paragraphs) that weaves together the victories below, finds patterns, and connects them to who ${memberName} is becoming. This is the "Celebrate This!" moment — make it meaningful.`,
    review: `Generate a warm evening review narrative (1-2 paragraphs) reflecting on ${memberName}'s day. Gentle, warm, like a friend who noticed what happened today.`,
    monthly: `Generate a monthly reflection narrative (2-3 paragraphs) highlighting patterns, standout moments, and growth across ${memberName}'s victories this month.`,
  }

  return `You are LiLa, the AI celebration partner for MyAIM Family. Your job is to generate identity-based celebration narratives that connect what someone DID to who they ARE BECOMING.

${modeInstructions[mode as keyof typeof modeInstructions] || modeInstructions.collection}

RULES — follow these exactly:
1. Identity-based, not performance-based. Never "Great job completing 8 tasks!" Instead: "You kept your promise to yourself today — that's the kind of person you're becoming."
2. Proportionate to the accomplishment. Making a bed gets a warm acknowledgment, not a parade. A breakthrough conversation gets something bigger.
3. Small steps are real victories. One step on a big project = "You showed up to it. That's how mountains move." Honor the step, never measure against what's left.
4. Connect to values when natural. If a victory aligns with a Guiding Star or Best Intention, name the connection. Never forced.
5. Never say "I'm so proud of you." That's a parent's line, not yours. Instead: "Here's what you did today — this is evidence of who you're becoming."
6. Never generic. No "Great job!" No "Keep it up!" Every celebration must reference specific victories.
7. Summarize, don't itemize. Find the MEANING in the pattern. Don't list every victory. Highlight patterns, spotlight specifics, let less notable items contribute to the narrative without individual mention.
8. Sincerity over enthusiasm. "That mattered" > "AMAZING!!!" Genuinely warm, not performatively excited.
9. Vary your approach. Sometimes notice a pattern. Sometimes spotlight one specific victory. Sometimes be brief. Sometimes connect to last week. Never feel like a template.
10. No emojis. No exclamation point overuse. Maximum 2 exclamation marks total.
11. Write in second person ("you").

EXAMPLE OF EXCELLENT CELEBRATION:
"Today revealed the architect in you — someone who sees systems not just as they are, but as they could become. The methodical way you tackled the documentation and debugged that tricky issue speaks to a mind that understands how well-built things work. The pattern that emerges is striking: you're simultaneously building infrastructure and tending to human connections with remarkable intentionality."

EXAMPLE OF WHAT TO NEVER WRITE:
"Great job today! You completed 8 tasks including making the bed, doing laundry, and cooking dinner. Keep up the great work! I'm so proud of you!"
${gsSection}${biSection}${iwSection}

The person's name is ${memberName}. Address them directly but don't overuse their name.${buildVoiceSection(voice)}`
}

// ─── Main Handler ─────────────────────────────────────────────

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const auth = await authenticateRequest(req)
    if (auth instanceof Response) return auth

    const body = await req.json()
    const parsed = RequestSchema.safeParse(body)
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request', details: parsed.error.issues }),
        { status: 400, headers: jsonHeaders },
      )
    }

    const { family_member_id, mode, period, victory_ids, voice } = parsed.data

    // Load member info
    const memberInfo = await getMemberInfo(family_member_id)
    if (!memberInfo) {
      return new Response(
        JSON.stringify({ error: 'Member not found' }),
        { status: 404, headers: jsonHeaders },
      )
    }

    const familyId = memberInfo.family_id
    const memberType = roleToMemberType(memberInfo.role, memberInfo.dashboard_mode)
    const modelId = selectModel(memberType)

    // Load context in parallel
    const [victories, guidingStars, bestIntentions, innerWorkings] = await Promise.all([
      loadVictories(victory_ids),
      loadGuidingStars(family_member_id, familyId),
      loadBestIntentions(family_member_id, familyId),
      loadInnerWorkings(family_member_id, familyId),
    ])

    if (victories.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No victories found for the provided IDs' }),
        { status: 404, headers: jsonHeaders },
      )
    }

    // Build prompt
    const systemPrompt = buildSystemPrompt(
      mode,
      memberInfo.display_name,
      guidingStars,
      bestIntentions,
      innerWorkings,
      voice,
    )

    const victorySummary = victories.map((v, i) => {
      const parts = [`${i + 1}. ${v.description}`]
      if (v.importance && v.importance !== 'standard') parts.push(`[${v.importance}]`)
      if (v.life_area_tag) parts.push(`(${v.life_area_tag})`)
      return parts.join(' ')
    }).join('\n')

    const userMessage = `Here are the victories to celebrate:\n\n${victorySummary}\n\nGenerate the celebration narrative now.`

    // Call OpenRouter
    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://myaimcentral.com',
        'X-Title': 'MyAIM Central - Victory Celebration',
      },
      body: JSON.stringify({
        model: modelId,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_tokens: 1024,
        temperature: 0.8,
      }),
    })

    if (!aiResponse.ok) {
      const errText = await aiResponse.text()
      console.error('OpenRouter error:', aiResponse.status, errText)
      return new Response(
        JSON.stringify({ error: 'AI service error' }),
        { status: 502, headers: jsonHeaders },
      )
    }

    const result = await aiResponse.json()
    const narrative = result.choices?.[0]?.message?.content || ''
    const inputTokens = result.usage?.prompt_tokens || 0
    const outputTokens = result.usage?.completion_tokens || 0

    // Log cost (fire-and-forget)
    logAICost({
      familyId,
      memberId: family_member_id,
      featureKey: 'celebrate_victory',
      model: modelId,
      inputTokens,
      outputTokens,
    })

    const contextSources: Record<string, unknown> = {
      guiding_stars_count: guidingStars.length,
      best_intentions_count: bestIntentions.length,
      inner_workings_count: innerWorkings.length,
      life_lantern_count: 0, // STUB: LifeLantern context not yet available
    }

    return new Response(
      JSON.stringify({
        narrative,
        context_sources: contextSources,
        model_used: modelId,
        token_count: { input: inputTokens, output: outputTokens },
      }),
      { headers: jsonHeaders },
    )
  } catch (err) {
    console.error('celebrate-victory error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: jsonHeaders },
    )
  }
})
