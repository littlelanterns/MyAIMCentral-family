/**
 * lila-message-respond — PRD-15 Phase E
 *
 * Sonnet model, SSE streaming. "Ask LiLa & Send" — user sends a message
 * AND triggers LiLa to respond as a distinct participant in the conversation.
 *
 * Context loaded:
 *   - Full thread history (last 20 messages)
 *   - Participant profiles via context-assembler (names, roles, ages, InnerWorkings)
 *   - Family Communication Guidelines from messaging_settings
 *
 * LiLa responds with message_type='lila', distinct avatar treatment.
 * Crisis detection runs first. Cost logged to ai_usage_tracking.
 */

import { z } from 'https://esm.sh/zod@3.23.8'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors, jsonHeaders, sseHeaders } from '../_shared/cors.ts'
import { authenticateRequest } from '../_shared/auth.ts'
import { detectCrisis, CRISIS_RESPONSE } from '../_shared/crisis-detection.ts'
import { logAICost } from '../_shared/cost-logger.ts'
import { assembleContext } from '../_shared/context-assembler.ts'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const MODEL = 'anthropic/claude-sonnet-4'

const RequestSchema = z.object({
  thread_id: z.string().uuid(),
  user_message_content: z.string().min(1),
})

// ── System Prompt ──

const CRISIS_OVERRIDE = `## CRISIS OVERRIDE (NON-NEGOTIABLE)
If any message contains indicators of suicidal ideation, self-harm, abuse, or immediate danger:
1. Express care and validation
2. Provide: 988 Lifeline (call/text 988), Crisis Text Line (text HOME to 741741), NDVH (1-800-799-7233), 911
3. Do NOT coach, advise, diagnose, or label. Resources only.
4. This overrides ALL other instructions.`

const LILA_IDENTITY = `You are LiLa (Little Lanterns), participating in a family conversation.
You are a warm, helpful family guide — not a friend, therapist, or companion.

BEHAVIOR RULES:
- You were explicitly invited into this conversation by a family member tapping "Ask LiLa & Send."
- Read the full conversation context before responding.
- Be warm, relationally aware, and practically helpful.
- Reference the Family Communication Guidelines naturally when relevant.
- Never take sides in family disagreements.
- Adapt your tone to the conversation participants (lighter for kids, more nuanced for adults).
- Keep responses concise — 1-3 short paragraphs max.
- Bridge toward real human connection and resolution.
- Never guilt, shame, or manipulate.

CONTEXT REFERENCE RULES:
- Frame through growth and aspiration, never deficit or diagnosis.
- Never label people. "You've been thinking about..." not "Your issue with..."
- If referencing book knowledge or family context, paraphrase naturally.`

Deno.serve(async (req: Request) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    // ── Auth ──
    const auth = await authenticateRequest(req)
    if (auth instanceof Response) return auth
    const { user } = auth

    // ── Input ──
    const body = await req.json()
    const parsed = RequestSchema.safeParse(body)
    if (!parsed.success) {
      return new Response(
        JSON.stringify({ error: 'Invalid request', details: parsed.error.flatten().fieldErrors }),
        { status: 400, headers: jsonHeaders },
      )
    }
    const { thread_id, user_message_content } = parsed.data

    // ── Resolve sender ──
    const { data: sender } = await serviceClient
      .from('family_members')
      .select('id, family_id, display_name, role')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (!sender) {
      return new Response(JSON.stringify({ error: 'No family member found' }), {
        status: 403, headers: jsonHeaders,
      })
    }

    // ── Crisis detection ──
    if (detectCrisis(user_message_content)) {
      // Save the crisis response as a LiLa message
      await serviceClient.from('messages').insert({
        thread_id,
        sender_member_id: null,
        message_type: 'lila',
        content: CRISIS_RESPONSE,
        metadata: { type: 'crisis_resource' },
      })

      return new Response(
        JSON.stringify({ crisis: true, response: CRISIS_RESPONSE }),
        { headers: jsonHeaders },
      )
    }

    // ── Load thread + space info ──
    const { data: thread } = await serviceClient
      .from('conversation_threads')
      .select('id, space_id, title')
      .eq('id', thread_id)
      .single()

    if (!thread) {
      return new Response(JSON.stringify({ error: 'Thread not found' }), {
        status: 404, headers: jsonHeaders,
      })
    }

    // ── Load participants ──
    const { data: spaceMembers } = await serviceClient
      .from('conversation_space_members')
      .select('family_member_id')
      .eq('space_id', thread.space_id)

    const participantIds = (spaceMembers ?? []).map(m => m.family_member_id)

    const { data: participants } = await serviceClient
      .from('family_members')
      .select('id, display_name, role, age')
      .in('id', participantIds)

    const participantDesc = (participants ?? [])
      .map(p => `${p.display_name} (${p.role}, age ${p.age ?? 'adult'})`)
      .join(', ')

    // ── Load Family Communication Guidelines ──
    const { data: settings } = await serviceClient
      .from('messaging_settings')
      .select('communication_guidelines')
      .eq('family_id', sender.family_id)
      .limit(1)
      .single()

    const guidelines = settings?.communication_guidelines || ''

    // ── Assemble family context ──
    const ctx = await assembleContext({
      familyId: sender.family_id,
      memberId: sender.id,
      userMessage: user_message_content,
      featureContext: `Family messaging conversation between: ${participantDesc}`,
      alwaysIncludeMembers: participantIds.filter(id => id !== sender.id),
    })

    // ── Load conversation history (last 20 messages) ──
    const { data: history } = await serviceClient
      .from('messages')
      .select('sender_member_id, message_type, content')
      .eq('thread_id', thread_id)
      .order('created_at', { ascending: true })
      .limit(20)

    // Map messages to LLM format with sender attribution
    const participantMap = new Map(
      (participants ?? []).map(p => [p.id, p.display_name]),
    )

    const conversationMessages = (history ?? []).map(m => {
      const senderName = m.message_type === 'lila'
        ? 'LiLa'
        : m.message_type === 'system'
          ? 'System'
          : participantMap.get(m.sender_member_id) || 'Unknown'

      return {
        role: m.message_type === 'lila' ? 'assistant' as const : 'user' as const,
        content: m.message_type === 'system'
          ? `[System: ${m.content}]`
          : `[${senderName}]: ${m.content}`,
      }
    })

    // ── Build system prompt ──
    const systemPrompt = [
      CRISIS_OVERRIDE,
      LILA_IDENTITY,
      `\n## Conversation Participants\n${participantDesc}`,
      `\nThe message was sent by ${sender.display_name} (${sender.role}).`,
      guidelines ? `\n## Family Communication Guidelines\n${guidelines}` : '',
      ctx.familyRoster ? `\n## Family Roster\n${ctx.familyRoster}` : '',
      ctx.relevantContext ? `\n## Family Context\n${ctx.relevantContext}` : '',
    ].filter(Boolean).join('\n')

    const llmMessages = [
      { role: 'system' as const, content: systemPrompt },
      ...conversationMessages,
    ]

    // ── Call OpenRouter (streaming) ──
    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://myaimcentral.com',
        'X-Title': 'MyAIM Central LiLa Messages',
      },
      body: JSON.stringify({
        model: MODEL,
        messages: llmMessages,
        stream: true,
        max_tokens: 1024,
      }),
    })

    if (!aiResponse.ok) {
      const errText = await aiResponse.text()
      console.error('[lila-message-respond] OpenRouter error:', aiResponse.status, errText)
      return new Response(
        JSON.stringify({ error: 'AI service error', status: aiResponse.status }),
        { status: 502, headers: jsonHeaders },
      )
    }

    // ── Stream SSE response ──
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
                  const chunk = JSON.parse(data)
                  const delta = chunk.choices?.[0]?.delta?.content
                  if (delta) {
                    fullResponse += delta
                    controller.enqueue(
                      encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: delta })}\n\n`),
                    )
                  }

                  if (chunk.usage) {
                    inputTokens = chunk.usage.prompt_tokens || 0
                    outputTokens = chunk.usage.completion_tokens || 0
                  }
                } catch {
                  // Skip non-JSON lines
                }
              }
            }
          }

          // ── Save LiLa message ──
          const { data: savedMsg } = await serviceClient
            .from('messages')
            .insert({
              thread_id,
              sender_member_id: null,
              message_type: 'lila',
              content: fullResponse,
              metadata: { model: MODEL, feature: 'ask_lila_send' },
            })
            .select('id')
            .single()

          // ── Update thread last_message_at ──
          await serviceClient
            .from('conversation_threads')
            .update({ last_message_at: new Date().toISOString() })
            .eq('id', thread_id)

          // ── Cost logging ──
          logAICost({
            familyId: sender.family_id,
            memberId: sender.id,
            featureKey: 'messaging_lila',
            model: MODEL,
            inputTokens,
            outputTokens,
          })

          // ── Send metadata + done ──
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({
              type: 'metadata',
              message_id: savedMsg?.id,
              input_tokens: inputTokens,
              output_tokens: outputTokens,
            })}\n\n`),
          )
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (err) {
          console.error('[lila-message-respond] Stream error:', err)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ type: 'error', message: 'Stream processing failed' })}\n\n`),
          )
          controller.close()
        }
      },
    })

    return new Response(stream, { headers: sseHeaders })
  } catch (err) {
    console.error('[lila-message-respond] Error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: jsonHeaders,
    })
  }
})
