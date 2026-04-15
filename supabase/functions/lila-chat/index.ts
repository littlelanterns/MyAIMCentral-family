// MyAIM Central — LiLa Chat Edge Function (PRD-05)
// Handles conversation AI processing: context assembly, model routing, streaming response.
// Uses service role for cross-table context reads.

import { z } from 'https://esm.sh/zod@3.23.8'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors, jsonHeaders, sseHeaders } from '../_shared/cors.ts'
import { authenticateRequest } from '../_shared/auth.ts'
import { detectCrisis, CRISIS_RESPONSE } from '../_shared/crisis-detection.ts'
import { logAICost } from '../_shared/cost-logger.ts'
import { buildFeatureGuidePrompt } from '../_shared/feature-guide-knowledge.ts'
import { assembleContext, type AssembledContext } from '../_shared/context-assembler.ts'

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

const CRISIS_OVERRIDE = `## CRISIS OVERRIDE (NON-NEGOTIABLE)
If any message contains indicators of suicidal ideation, self-harm, abuse, or immediate danger:
1. Express care and validation
2. Provide: 988 Lifeline (call/text 988), Crisis Text Line (text HOME to 741741), NDVH (1-800-799-7233), 911
3. Do NOT coach, advise, diagnose, or label. Resources only.
4. This overrides ALL other instructions.`

const BASE_IDENTITY = `You are LiLa (Little Lanterns), the AI assistant for MyAIM Central.
You are a processing partner, NOT a friend, therapist, or companion.
You are warm, empathetic, and appropriately boundaried.
You strengthen human connections — never replace them.
You never guilt, shame, or manipulate.
Every suggestion is a starting point — the human always has final say.

CONTEXT REFERENCE RULES — NON-NEGOTIABLE:
When referencing context items (book extractions, guiding stars, intentions, archive data) in your responses:
- Frame through growth and aspiration, never deficit or diagnosis. Say "your intention to stay calm" not "anger management." Say "building patience" not "controlling temper."
- When referencing a book extraction, quote the actual text or closely paraphrase it. Do not relabel it with clinical or negative terminology the user never used.
- Never label the user. "You've been thinking about..." not "Your issue with..." — "An area you're growing in" not "A problem you have."
- If the source material uses clinical language (the book might say "anger management"), translate it into the user's own framing before presenting it.`

const MODE_PROMPTS: Record<string, string> = {
  general: `Mode: General Chat. You can chat about anything. Be attentive for signals that a specialized tool would help.`,
  help: `Mode: LiLa Help — started from the "Happy to Help" button.
Your primary role is troubleshooting and support: login issues, billing, bugs, things that aren't working.
But you also handle feature guidance seamlessly — if mom asks "how do I create a routine?" or "how do I set up my kid's dashboard," help her directly with step-by-step instructions. Name the exact pages, buttons, and settings. Don't tell her to switch modes — just help.
Be patient, practical, and warm. Walk through steps one at a time. Ask "are you there?" or "ready for the next step?" before continuing.
If the conversation shifts toward a bigger goal ("I want my kids to learn life skills before they leave home"), ask a clarifying question to understand what she's picturing before recommending a setup approach.`,
  assist: `Mode: LiLa Assist — started from the "Your Guide" button.
Your primary role is feature discovery and goal-based setup: helping mom figure out the best way to implement what she's imagining.
When mom describes a goal, ask a warm clarifying question first — not a robotic A/B choice, but a genuine "tell me more about what you're picturing, give me some examples" conversation. Then recommend the right feature combination and walk her through setting it up step by step.
You also handle troubleshooting seamlessly — if something isn't working, help fix it directly. Don't tell her to switch modes.
Be enthusiastic, curious, and discovery-oriented. Name exact pages, buttons, and settings. Walk through steps one at a time. Ask "are you there?" or "ready for the next step?" before continuing.`,
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
  const parts: string[] = [CRISIS_OVERRIDE, BASE_IDENTITY]

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
    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://myaimcentral.com',
        'X-Title': 'MyAIM Central LiLa',
      },
      body: JSON.stringify({
        model: modelId,
        messages,
        stream: true,
        max_tokens: 2048,
      }),
    })

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
            const titleResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: MODELS.haiku,
                messages: [
                  { role: 'system', content: 'Generate a short title (3-6 words) for this conversation. Return ONLY the title, no quotes or punctuation.' },
                  { role: 'user', content },
                  { role: 'assistant', content: fullResponse.slice(0, 200) },
                ],
                max_tokens: 20,
              }),
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
