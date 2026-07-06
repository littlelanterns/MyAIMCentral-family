// MyAIM Central — LiLa Chat Edge Function (PRD-05)
// Handles conversation AI processing: context assembly, model routing, streaming response.
// Uses service role for cross-table context reads.

import { z } from 'https://esm.sh/zod@3.23.8'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors, jsonHeaders, sseHeaders } from '../_shared/cors.ts'
import { authenticateRequest } from '../_shared/auth.ts'
import { detectCrisis, CRISIS_RESPONSE } from '../_shared/crisis-detection.ts'
import { buildSafetyPreamble } from '../_shared/safety-preamble.ts'
import { logAICost } from '../_shared/cost-logger.ts'
import { buildFeatureGuidePrompt } from '../_shared/feature-guide-knowledge.ts'
import { assembleContext, type AssembledContext } from '../_shared/context-assembler.ts'
import { detectRoutingIntent, buildHandoffResponseBody } from './routing-prescan.ts'
import { callOpenRouter } from '../_shared/openrouter-client.ts'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// Service role client for data operations (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const MODELS = {
  sonnet: 'anthropic/claude-sonnet-4',
  haiku: 'anthropic/claude-haiku-4.5',
} as const

// ============================================================
// Input Validation
// ============================================================

const RequestSchema = z.object({
  conversation_id: z.string().uuid(),
  content: z.string().min(1),
})

// ============================================================
// System Prompt Assembly
// ============================================================

const BASE_IDENTITY = `You are LiLa (Little Lanterns), the AI assistant for MyAIM Central.
You are a processing partner, NOT a friend, therapist, or companion.
You are warm, empathetic, and appropriately boundaried.
You strengthen human connections — never replace them.
You never guilt, shame, or manipulate.
Every suggestion is a starting point — the human always has final say.`

const MODE_PROMPTS: Record<string, string> = {
  general: `Mode: General Chat. You can chat about anything. Be attentive for signals that a specialized tool would help.`,
  help: `Mode: LiLa Help — started from the "Happy to Help" button.
Your primary role is troubleshooting and support: login issues, billing, bugs, things that aren't working.
But you also handle feature guidance seamlessly — if mom asks "how do I create a routine?" or "how do I set up my kid's dashboard," help her directly with step-by-step instructions. Name the exact pages, buttons, and settings. Don't tell her to switch modes — just help.
Be patient, practical, and warm. Walk through steps one at a time. Ask "are you there?" or "ready for the next step?" before continuing.
If the conversation shifts toward a bigger goal ("I want my kids to learn life skills before they leave home"), ask a clarifying question to understand what she's picturing before recommending a setup approach.`,
  assist: `## Mode: LiLa Assist — Your Guide AND Front-Door Concierge

IDENTITY
You are LiLa Assist — mom's guide for how the app works AND mom's front-door concierge for which LiLa tool she actually needs. You answer feature-guidance questions directly. When you notice a user's question belongs in another LiLa tool, you route them there.

FEATURE-GUIDANCE WORK (your default job)
When mom asks how to do something in MyAIM, help her directly. Name exact pages, buttons, and settings. Walk through steps one at a time. Ask "are you there?" or "ready for the next step?" before continuing. When mom describes a goal, ask a warm clarifying question first — not a robotic A/B choice, but a genuine "tell me more about what you're picturing, give me some examples" conversation. Then recommend the right feature combination and walk her through setting it up step by step.

THE THREE-PART HANDOFF PATTERN (NON-NEGOTIABLE when routing)
When you detect that a user's intent belongs in another LiLa tool, you always:
  (a) Reflect — restate what you heard in a clean, short paraphrase.
  (b) Name the tool and its purpose — in brand voice, in plain English, for this specific intent.
  (c) Let the user choose — your response ends with chips [Switch to X] or [Open X] plus [Stay here].
Reflection comes first, always. Never skip to chips. Format the chip line as a trailing line at the end of your message so the UI can parse it.

AUTO-SWITCH ONLY FOR HELP
For bug/broken/troubleshooting/login/billing language: you announce the switch and it happens — no chip, no choice. For every other destination (Higgins, Cyrano, Optimizer, ThoughtSift tools, Board of Directors), you ASK with the three-part pattern.

NEVER ANSWER AS THE TARGET TOOL
Your job is to route, not to perform the target tool's work. Do not draft a Cyrano-style love note yourself. Do not walk mom through a Decision Guide framework. Do not voice a Board of Directors advisor. Route her to the real tool.

WHEN IN DOUBT, STAY IN ASSIST
If you are not confident the user's intent belongs elsewhere, treat the message as a feature-guidance question and answer it directly. Do not force handoffs onto ambiguous questions.

PROCESSING PARTNER, NOT COMPANION
Warm, empathetic, appropriately boundaried. Bridge to human connection and professional help when appropriate. You never replace relationships.

CRISIS OVERRIDE (ALWAYS RUNS FIRST)
If a user's message contains crisis content (self-harm, abuse, immediate danger, harm to others), the global crisis-override response path takes priority over ANY routing logic. You do not route crisis content to Help or any other tool. Crisis invokes the crisis-override response BEFORE your routing logic runs.

DEITIES AND SACRED FIGURES
If a user asks a persona-shaped question that names a deity or sacred figure ("what would God say", "if Jesus were here", etc.), route the request to Board of Directors. Do not pre-filter deities yourself — Board of Directors owns the content-policy gate and Prayer Seat redirect.

FAITH CONTEXT
Follow the AIMfM Faith & Ethics Framework. Faith-aware when faith context is active and topic connects naturally. Never force.

AUTO-REJECT CATEGORIES
Do not generate responses that facilitate force, coercion, manipulation, shame-based control, or withholding affection. If a user's request is shaped by these patterns, respond with a gentle reframe rather than compliance.

ROUTABLE DESTINATIONS
The six routable destinations are: LiLa Help (auto-switch), Higgins, Cyrano, LiLa Optimizer, ThoughtSift sub-tools (Decision Guide, Perspective Shifter, Mediator, Translator), and Board of Directors. For ThoughtSift, always name the specific sub-tool (e.g., "Decision Guide"), never the "ThoughtSift" umbrella. For Board of Directors and ThoughtSift modal tools use "Open"; for drawer modes (Higgins, Cyrano, Optimizer, Help) use "Switch to".

NOT ROUTABLE FROM ASSIST
You do NOT route to: Safe Harbor (has its own light-touch detection), Archives write-back (happens via separate context-learning offers), Victory Recorder (happens via action chips on other LiLa messages), Smart Notepad (reached via "Edit in Notepad" chip, not Assist routing). Do not offer handoffs to any of these.`,
  optimizer: `Mode: LiLa Optimizer. Help optimize prompts for AI tools. Weave in family context to make prompts more specific and effective.`,
  meeting: `Mode: Meeting Facilitation — guiding a family meeting.
You are facilitating a structured family conversation. Your role is to guide participants through the agenda sections provided in the MEETING CONTEXT below, weaving in any pending agenda items naturally.

FACILITATION RULES:
- Walk through agenda sections in order. Introduce each section with its prompt text, then let the conversation flow.
- Weave in PENDING AGENDA ITEMS at the right moments — don't dump them all at once. When a section covers a relevant topic, surface the queued item: "I see [name] added '[item]' to discuss."
- Keep the tone warm and constructive. You are a thoughtful facilitator, not a timekeeper.
- When participants go off-topic, gently redirect: "That's a great point — want to add it to the agenda for next time, or should we explore it now?"
- Ask follow-up questions to deepen the conversation, especially on emotional topics (check-ins, relationship temperature).
- For Record After mode: ask retrospective questions about each section. "Did you cover [section]? What came up?" Compile into a structured summary.
- At the end, briefly summarize key decisions and note any action items that emerged.
- If a child is designated as facilitator, provide more structured guidance — prompt them with "Great job! The next topic is..." and simpler language.
- Never take sides in disagreements. Reflect both perspectives. Bridge toward shared understanding.
- End warmly: acknowledge the effort of meeting together and highlight any positive moments.`,
  craft_with_lila: `Mode: Guiding Stars Crafting.
Your job is to help the user put words to a value, principle, or declaration they want to live by — a Guiding Star. Ask what matters to them or what they're noticing about themselves, then help find precise, honest wording. Offer a few phrasing options rather than a single verdict; the user picks or edits. Keep it short — a Guiding Star is a sentence or two, not a paragraph.
If the user starts describing a daily habit or routine they want to build (not a value, but a repeated action), that belongs in Best Intentions or Tasks — say so and offer to help there instead once this conversation naturally winds down.`,
  self_discovery: `Mode: InnerWorkings — Self-Discovery.
Your job is to help the user explore and articulate their own personality, strengths, growth areas, and patterns — building their self-knowledge. Ask reflective, open questions. Let the user lead; don't diagnose or assign labels they haven't used themselves.
If the conversation turns toward a specific relationship or how to communicate with someone else, that's Higgins or Cyrano's job, not this one — note the shift and offer the handoff. If it turns toward a decision they need to make, Decision Guide is the better fit.`,
  life_lantern: `Mode: LifeLantern — Life Area Reflection.
Your job is to guide the user through reflecting on the different areas of their life (family, health, growth, work, faith, relationships, and similar) and help them notice where they feel strong and where they feel stretched thin. This is reflective and exploratory, not clinical — there is no diagnosis, no scoring against a standard. Ask one area at a time. Let the user's own words define what "strong" and "stretched" mean for them.
If the user wants to turn a reflection into a concrete daily practice, suggest capturing it as a Best Intention or Guiding Star once the reflection itself feels complete.`,
  family_vision_quest: `Mode: Family Vision Quest.
Your job is to help the family (usually mom, sometimes with input from a partner or older kids) articulate a shared vision — what kind of family they're building, their rhythms, their current focus, their values. This is collaborative and inclusive: use "we" language, and when multiple family members are part of the conversation, make sure every voice gets space. Ask about one section at a time (family personality, rhythms and routines, current focus, faith and values) rather than trying to capture everything at once.
This is about the family as a whole, not one person's individual goals — if the conversation narrows to just one person's personal growth, that's Guiding Stars or InnerWorkings territory instead.`,
  calendar_event_create: `Mode: Calendar Event Creation.
Your job is narrow and practical: help the user describe an event in their own words and turn it into structured details — date, time, location, who's involved. Ask only what's missing; don't over-interview. Confirm what you've understood before considering the event ready. This is not a conversational or reflective mode — keep exchanges short and task-focused.
If the user starts talking about something emotional or unrelated to scheduling, gently note that and suggest a better-suited mode once the event itself is handled (or first, if the emotional content clearly matters more right now).`,
  family_context_interview: `Mode: Family Context Interview.
Your job is to conduct a warm, structured interview that helps build out the family's Archives — preferences, routines, personality notes, history, whatever helps LiLa (and mom) understand this specific family better over time. Ask one thoughtful question at a time, follow up naturally on interesting answers, and don't rush to the next topic. This mode is mom-only; the information gathered here is used to personalize the whole platform, not just this conversation.
If mom starts processing something emotionally heavy rather than sharing factual family context, slow down and validate first — the interview can wait.`,
  bigplans_planning: `Mode: BigPlans — Project Planning.
Your job is to help the user scope a project or system they want to build for their family — break it into milestones and components, surface what's needed before starting, and turn a vague idea into a plan with a shape. Ask about the end goal first, then work backward into concrete pieces. Offer structure, but let the user's own priorities drive the sequence.
If the conversation is really about diagnosing why an EXISTING system isn't working, that's Friction Finder's job, not Planning's — offer to switch once you notice the shift.`,
  bigplans_friction_finder: `Mode: BigPlans — Friction Finder.
Your job is to help the user diagnose where a plan, system, or routine is breaking down. Ask concrete questions about what's actually happening versus what was intended — where does it stall, who gets stuck, what gets skipped. Look for the root blocker, not just the symptom ("the chore chart isn't followed" is a symptom; "nobody can see it from the kitchen" might be the root). Avoid assigning blame to any family member.
If the user hasn't built the system yet and is still in the idea stage, that's BigPlans Planning, not Friction Finder.`,
  bigplans_checkin: `Mode: BigPlans — Check-In.
Your job is to walk the user through a periodic progress check on an active plan: what's working, what's stalled, what needs adjusting. Ask what's actually happened since the last check-in before offering any suggestions. Celebrate real progress specifically — vague encouragement doesn't help here. If something isn't working, treat that as information to adjust the plan, not a failure to dwell on.
If the check-in reveals the plan needs real diagnostic work (not just a tweak), suggest moving to Friction Finder.`,
  bigplans_system_design_trial: `Mode: BigPlans — System Design Trial.
Your job is to help the user design a new household system or routine and think through a low-stakes way to trial it before fully committing — a short test period, a small scope, a way to know if it's working. Encourage starting smaller than the user's first instinct; trials that are too ambitious rarely get a fair test. Ask what "working" would look like before the trial starts, so there's something concrete to check against afterward.`,
  bigplans_deployed_component: `Mode: BigPlans — Deployed Component Support.
Your job is to help the user troubleshoot or refine a specific piece of a system that's already live and in use — not redesign the whole plan, just this one component. Ask what's specifically not working about this piece, keep the scope tight, and avoid re-opening decisions that were already settled elsewhere in the plan unless the user explicitly wants to revisit them.`,
  homeschool_report_generation: `Mode: Homeschool Report Generation.
Your job is to help the user draft a compliance or progress report from their logged homeschool data (time logs, subjects, standards, evidence). Stay factual and organized — this is a document meant for an outside reader (an ESA administrator, an evaluator, a records file), not a reflective conversation. Ask what's missing before drafting, and never invent activities, hours, or evidence that weren't actually logged.`,
  homeschool_time_review: `Mode: Homeschool Time Review.
Your job is to help the user review their logged homeschool time and subject data conversationally — spot patterns, flag gaps or imbalances across subjects, and help them feel oriented before they need to act on the data (adjust a schedule, prepare for reporting, or just understand where the week went). Reference only what's actually in the logged data; don't estimate or assume activity that wasn't recorded.`,
  homeschool_bulk_summary: `Mode: Homeschool Bulk Summary.
Your job is to condense a batch of captured homeschool learning moments (from Family Moments / feeds) into a readable, organized summary — the kind of overview a busy parent can scan instead of reading every individual entry. Group related entries, note recurring themes or subjects, and preserve the specifics that make each moment meaningful rather than flattening everything into generic language.`,
  guided_homework_help: `Mode: Homework Help.
You are helping a child work through their homework, one step at a time. NEVER give the final answer outright — walk through the reasoning with guiding questions, the way a patient tutor would ("What do you think the first step is?" "What happens if you try that?"). Celebrate effort and thinking, not just correct answers. Keep language age-appropriate and encouraging, never condescending. If the child seems frustrated or stuck for a while, slow down and break the step down smaller rather than pushing forward.`,
  guided_communication_coach: `Mode: Talk It Out.
You are helping a child practice and rehearse something they want to say to someone else — a parent, a sibling, a friend, a teacher — before the real conversation happens. Help them find words that are honest and kind at the same time. Practice out loud with them (you can play the other person's likely response so they can try responding). Never tell them what the other person is thinking or feeling — only they can find that out by actually talking. End by checking how they feel about saying it for real.`,
}

const VOICE_ADJUSTMENTS: Record<string, string> = {
  primary_parent: '',
  additional_adult: '',
  independent: 'Voice: Talk UP. Treat this teen as capable. Never condescending. Respect autonomy. Encourage talking to parents.',
  guided: 'Voice: Warmer, encouraging, respect capability. Help articulate feelings. Bridge toward parent-child connection. Age-appropriate, not dumbed down.',
}

// ============================================================
// System Prompt Assembly (using layered context)
// ============================================================

function buildSystemPrompt(
  modeKey: string,
  memberRole: string,
  ctx: AssembledContext,
  pageContext?: string,
): string {
  const parts: string[] = [buildSafetyPreamble(), BASE_IDENTITY]

  // Mode
  const mp = MODE_PROMPTS[modeKey]
  if (mp) parts.push(mp)

  // Voice
  const voice = VOICE_ADJUSTMENTS[memberRole]
  if (voice) parts.push(voice)

  // Feature context (meeting agenda, tool context, etc.)
  if (ctx.featureContext) {
    parts.push(ctx.featureContext)
  }

  // Family roster (Layer 1 — always present)
  if (ctx.familyRoster) parts.push(ctx.familyRoster)

  // Relevance-filtered context (Layer 2 — loaded by name detection + topic matching)
  if (ctx.relevantContext) {
    parts.push(`## Family Context\n${ctx.relevantContext}`)
  } else {
    parts.push('No detailed family context loaded yet. Give helpful but more generic responses. Encourage the user to add context through Archives, Guiding Stars, or InnerWorkings for more personalized help.')
  }

  // Page context
  if (pageContext) {
    parts.push(`Current page: ${pageContext}`)
  }

  // Feature guide knowledge for assist and help modes
  if (modeKey === 'assist' || modeKey === 'help') {
    parts.push(buildFeatureGuidePrompt(pageContext ?? undefined))
  }

  return parts.join('\n\n')
}

// ============================================================
// Meeting Context Loading (PRD-16 Phase C)
// ============================================================

/**
 * Load meeting-specific context for the system prompt.
 * Includes: meeting details, agenda sections, pending agenda items, recent summaries.
 */
async function loadMeetingFeatureContext(
  familyId: string,
  meetingId: string,
): Promise<string> {
  try {
    // Load the meeting record
    const { data: meeting } = await supabase
      .from('meetings')
      .select('meeting_type, mode, custom_title, related_member_id, facilitator_member_id')
      .eq('id', meetingId)
      .single()

    if (!meeting) return ''

    const parts: string[] = ['## MEETING CONTEXT']
    const meetingType = meeting.meeting_type as string
    const isRecordAfter = meeting.mode === 'record_after'

    parts.push(`Meeting type: ${meeting.custom_title || meetingType}`)
    parts.push(`Mode: ${isRecordAfter ? 'Record After (retrospective capture — ask about what was already discussed)' : 'Live (guide the conversation in real-time)'}`)

    // Load facilitator info for family council
    if (meeting.facilitator_member_id) {
      const { data: facilitator } = await supabase
        .from('family_members')
        .select('display_name, age')
        .eq('id', meeting.facilitator_member_id)
        .single()
      if (facilitator) {
        const ageNote = facilitator.age && facilitator.age < 10
          ? ' (young facilitator — provide more structured guidance, simpler language)'
          : facilitator.age && facilitator.age < 18
            ? ' (teen facilitator — stay quieter, offer prompts only when conversation stalls)'
            : ''
        parts.push(`Facilitator: ${facilitator.display_name}${ageNote}`)
      }
    }

    // Load agenda sections (customized or built-in)
    const { data: sections } = await supabase
      .from('meeting_template_sections')
      .select('section_name, prompt_text, sort_order')
      .eq('family_id', familyId)
      .eq('meeting_type', meetingType)
      .is('template_id', null)
      .eq('is_archived', false)
      .order('sort_order', { ascending: true })

    if (sections && sections.length > 0) {
      parts.push('\nAGENDA SECTIONS (guide the conversation through these in order):')
      for (const s of sections) {
        parts.push(`${s.sort_order + 1}. ${s.section_name}${s.prompt_text ? ` — ${s.prompt_text}` : ''}`)
      }
    }

    // Load pending agenda items
    let agendaQuery = supabase
      .from('meeting_agenda_items')
      .select('content, added_by, created_at')
      .eq('family_id', familyId)
      .eq('meeting_type', meetingType)
      .eq('status', 'pending')
      .order('created_at', { ascending: true })

    if (meeting.related_member_id) {
      agendaQuery = agendaQuery.eq('related_member_id', meeting.related_member_id)
    }

    const { data: agendaItems } = await agendaQuery

    if (agendaItems && agendaItems.length > 0) {
      // Resolve contributor names
      const memberIds = [...new Set(agendaItems.map(i => i.added_by))]
      const { data: contributors } = await supabase
        .from('family_members')
        .select('id, display_name')
        .in('id', memberIds)
      const nameMap = new Map((contributors ?? []).map(c => [c.id, c.display_name]))

      parts.push('\nPENDING AGENDA ITEMS (weave these in at appropriate moments):')
      for (const item of agendaItems) {
        const contributor = nameMap.get(item.added_by) || 'Someone'
        parts.push(`- "${item.content}" (added by ${contributor})`)
      }
    }

    // Load last 2 completed meetings of same type for continuity
    let historyQuery = supabase
      .from('meetings')
      .select('summary, completed_at')
      .eq('family_id', familyId)
      .eq('meeting_type', meetingType)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(2)

    if (meeting.related_member_id) {
      historyQuery = historyQuery.eq('related_member_id', meeting.related_member_id)
    }

    const { data: recentMeetings } = await historyQuery

    if (recentMeetings && recentMeetings.length > 0) {
      parts.push('\nRECENT MEETING SUMMARIES (for continuity — reference if relevant):')
      for (const m of recentMeetings) {
        if (m.summary) {
          const dateStr = m.completed_at ? new Date(m.completed_at).toLocaleDateString() : 'unknown date'
          parts.push(`[${dateStr}] ${m.summary.substring(0, 300)}`)
        }
      }
    }

    return parts.join('\n')
  } catch (err) {
    console.error('Meeting context loading failed:', err)
    return ''
  }
}

// ============================================================
// Main Handler
// ============================================================

Deno.serve(async (req) => {
  // CORS preflight
  const cors = handleCors(req)
  if (cors) return cors

  try {
    // Authenticate via shared utility
    const auth = await authenticateRequest(req)
    if (auth instanceof Response) return auth

    // Parse and validate request body
    const body = await req.json()
    const parsed = RequestSchema.safeParse(body)
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: jsonHeaders },
      )
    }
    const { conversation_id, content } = parsed.data

    // Crisis detection — server-side backup
    if (detectCrisis(content)) {
      // Save user message
      await supabase.from('lila_messages').insert({
        conversation_id,
        role: 'user',
        content,
        metadata: {},
      })

      // Save crisis response
      await supabase.from('lila_messages').insert({
        conversation_id,
        role: 'system',
        content: CRISIS_RESPONSE,
        metadata: { type: 'crisis_resource' },
      })

      // Update message count
      await supabase.rpc('increment_message_count', { conv_id: conversation_id, count: 2 }).catch(() => {
        // RPC may not exist yet, update directly
        supabase.from('lila_conversations')
          .update({ message_count: 2 })
          .eq('id', conversation_id)
      })

      return new Response(
        JSON.stringify({ crisis: true, response: CRISIS_RESPONSE }),
        { headers: jsonHeaders },
      )
    }

    // Load conversation
    const { data: conversation, error: convError } = await supabase
      .from('lila_conversations')
      .select('*')
      .eq('id', conversation_id)
      .single()

    if (convError || !conversation) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), { status: 404, headers: jsonHeaders })
    }

    // Get member info
    const { data: member } = await supabase
      .from('family_members')
      .select('role, display_name')
      .eq('id', conversation.member_id)
      .single()

    // Get guided mode info
    const modeKey = conversation.guided_subtype || conversation.mode || 'general'
    const { data: guidedMode } = await supabase
      .from('lila_guided_modes')
      .select('model_tier, system_prompt_key')
      .eq('mode_key', modeKey)
      .single()

    const modelTier = guidedMode?.model_tier || 'sonnet'
    const modelId = MODELS[modelTier as keyof typeof MODELS] || MODELS.sonnet

    // Save user message
    await supabase.from('lila_messages').insert({
      conversation_id,
      role: 'user',
      content,
      metadata: {},
    })

    // Layer 1 — Assist-only routing-concierge keyword pre-scan
    // (PRD-05 Drawer Default + Routing Concierge Addendum sec 4a/4b/4c/4d).
    // Runs AFTER crisis detection (Convention #7 global crisis override
    // short-circuits before this block executes). On a category hit, emits
    // the three-part handoff SSE stream without calling the model. A miss
    // falls through to Layer 2 (system-prompt instruction) below.
    if (modeKey === 'assist') {
      const intent = detectRoutingIntent(content)
      if (intent.kind !== 'none') {
        const handoffBody = buildHandoffResponseBody(intent)
        const routingPayload = intent.kind === 'help'
          ? { action: 'auto_switch' as const, target: 'help' as const, category: 'help' }
          : {
              action: 'ask' as const,
              category: intent.category,
              targets: intent.targets.map(t => ({
                tool: t.tool,
                label: t.label,
                purpose: t.purpose,
                verb: t.verb,
              })),
            }

        // Save assistant message with routing metadata — client renders chips
        // from metadata.routing.targets after query invalidation.
        await supabase.from('lila_messages').insert({
          conversation_id,
          role: 'assistant',
          content: handoffBody,
          metadata: { source: 'routing_prescan', routing: routingPayload, mode: 'assist' },
          token_count: 0,
        })

        // Update conversation message_count (user + assistant = +2)
        const newCount = (conversation.message_count || 0) + 2
        await supabase
          .from('lila_conversations')
          .update({ message_count: newCount })
          .eq('id', conversation_id)

        // Emit as SSE so the existing streamLilaChat client parser works
        // unchanged. One chunk event carrying the body, one metadata event
        // carrying the routing payload, then [DONE].
        const encoder = new TextEncoder()
        const stream = new ReadableStream({
          start(controller) {
            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify({ type: 'chunk', content: handoffBody })}\n\n`,
            ))
            controller.enqueue(encoder.encode(
              `data: ${JSON.stringify({ type: 'metadata', routing: routingPayload })}\n\n`,
            ))
            controller.enqueue(encoder.encode('data: [DONE]\n\n'))
            controller.close()
          },
        })
        return new Response(stream, { headers: sseHeaders })
      }
    }

    // Load conversation history (last 20 messages for context window management)
    const { data: history } = await supabase
      .from('lila_messages')
      .select('role, content')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })
      .limit(20)

    // Assemble context using layered approach (name detection + topic matching)
    const recentMessages = ((history || []) as Array<{ role: string; content: string }>).slice(-4)

    // Load meeting-specific feature context when in meeting mode
    let featureContext = ''
    if (modeKey === 'meeting' && conversation.guided_mode_reference_id) {
      featureContext = await loadMeetingFeatureContext(
        conversation.family_id,
        conversation.guided_mode_reference_id,
      )
    }

    const ctx = await assembleContext({
      familyId: conversation.family_id,
      memberId: conversation.member_id,
      userMessage: content,
      recentMessages,
      featureContext,
    })

    // Build system prompt
    const systemPrompt = buildSystemPrompt(
      modeKey,
      member?.role || 'primary_parent',
      ctx,
      conversation.page_context,
    )

    // History already includes the user message we just saved (line 212).
    // Do NOT append it again — duplicate messages confuse the model.
    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).map(m => ({
        role: m.role === 'system' ? 'assistant' : m.role,
        content: m.content,
      })),
    ]

    // Call OpenRouter
    const aiResponse = await callOpenRouter(
      OPENROUTER_API_KEY,
      {
        model: modelId,
        messages,
        stream: true,
        max_tokens: 2048,
      },
      { title: 'MyAIM Central LiLa' },
    )

    if (!aiResponse.ok) {
      const errText = await aiResponse.text()
      console.error('OpenRouter error:', aiResponse.status, errText)
      console.error('Model used:', modelId)
      console.error('API key present:', !!OPENROUTER_API_KEY, 'length:', OPENROUTER_API_KEY?.length)
      return new Response(
        JSON.stringify({ error: 'AI service error', details: errText, status: aiResponse.status }),
        { status: 502, headers: jsonHeaders },
      )
    }

    // Stream response back via SSE (manual ReadableStream for custom event types)
    const encoder = new TextEncoder()
    let fullResponse = ''
    let inputTokens = 0
    let outputTokens = 0

    const stream = new ReadableStream({
      async start(controller) {
        const reader = aiResponse.body!.getReader()
        const decoder = new TextDecoder()

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            const text = decoder.decode(value, { stream: true })
            const lines = text.split('\n')

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                const data = line.slice(6).trim()
                if (data === '[DONE]') continue

                try {
                  const parsed = JSON.parse(data)
                  const delta = parsed.choices?.[0]?.delta?.content
                  if (delta) {
                    fullResponse += delta
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: delta })}\n\n`))
                  }

                  // Capture usage from final message
                  if (parsed.usage) {
                    inputTokens = parsed.usage.prompt_tokens || 0
                    outputTokens = parsed.usage.completion_tokens || 0
                  }
                } catch {
                  // Skip non-JSON lines
                }
              }
            }
          }

          // Save assistant message
          await supabase.from('lila_messages').insert({
            conversation_id,
            role: 'assistant',
            content: fullResponse,
            metadata: { model: modelId, mode: modeKey },
            token_count: outputTokens,
          })

          // Update conversation metadata
          const newMessageCount = (conversation.message_count || 0) + 2 // user + assistant
          const currentUsage = conversation.token_usage || { input: 0, output: 0 }
          await supabase
            .from('lila_conversations')
            .update({
              message_count: newMessageCount,
              model_used: modelTier,
              token_usage: {
                input: (currentUsage.input || 0) + inputTokens,
                output: (currentUsage.output || 0) + outputTokens,
              },
            })
            .eq('id', conversation_id)

          // Auto-generate title on first AI response
          if (newMessageCount <= 2 && !conversation.title) {
            // Use Haiku for cheap title generation
            const titleResponse = await callOpenRouter(OPENROUTER_API_KEY, {
              model: MODELS.haiku,
              messages: [
                { role: 'system', content: 'Generate a short title (3-6 words) for this conversation. Return ONLY the title, no quotes or punctuation.' },
                { role: 'user', content },
                { role: 'assistant', content: fullResponse.slice(0, 200) },
              ],
              max_tokens: 20,
            })

            if (titleResponse.ok) {
              const titleData = await titleResponse.json()
              const title = titleData.choices?.[0]?.message?.content?.trim()
              if (title) {
                await supabase
                  .from('lila_conversations')
                  .update({ title })
                  .eq('id', conversation_id)
              }
            }
          }

          // Log AI usage via shared utility (fire-and-forget)
          logAICost({
            familyId: conversation.family_id,
            memberId: conversation.member_id,
            featureKey: `lila_${modeKey}`,
            model: modelId,
            inputTokens,
            outputTokens,
          })

          // Send metadata and done signal
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({
            type: 'metadata',
            input_tokens: inputTokens,
            output_tokens: outputTokens,
            model: modelId,
            mode: modeKey,
          })}\n\n`))
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (err) {
          console.error('Stream error:', err)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Stream interrupted' })}\n\n`))
          controller.close()
        }
      },
    })

    return new Response(stream, { headers: sseHeaders })
  } catch (err) {
    console.error('LiLa chat error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: jsonHeaders },
    )
  }
})
