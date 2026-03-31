// MyAIM Central — LiLa Chat Edge Function (PRD-05)
// Handles conversation AI processing: context assembly, model routing, streaming response.
// Uses service role for cross-table context reads.

import { z } from 'https://esm.sh/zod@3.23.8'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors, jsonHeaders, sseHeaders } from '../_shared/cors.ts'
import { authenticateRequest } from '../_shared/auth.ts'
import { detectCrisis, CRISIS_RESPONSE } from '../_shared/crisis-detection.ts'
import { logAICost } from '../_shared/cost-logger.ts'

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
Every suggestion is a starting point — the human always has final say.`

const MODE_PROMPTS: Record<string, string> = {
  general: `Mode: General Chat. You can chat about anything. Be attentive for signals that a specialized tool would help.`,
  help: `Mode: LiLa Help. Handle customer support, troubleshooting, billing, and FAQ for MyAIM Central. Be patient and practical.`,
  assist: `Mode: LiLa Assist. Help users discover and learn features. Be enthusiastic and discovery-oriented.`,
  optimizer: `Mode: LiLa Optimizer. Help optimize prompts for AI tools. Weave in family context to make prompts more specific and effective.`,
}

const VOICE_ADJUSTMENTS: Record<string, string> = {
  primary_parent: '',
  additional_adult: '',
  independent: 'Voice: Talk UP. Treat this teen as capable. Never condescending. Respect autonomy. Encourage talking to parents.',
  guided: 'Voice: Warmer, encouraging, respect capability. Help articulate feelings. Bridge toward parent-child connection. Age-appropriate, not dumbed down.',
}

// ============================================================
// Context Assembly (Server-Side)
// ============================================================

/** Per-member context bundle — everything grouped by the person it belongs to */
interface MemberContext {
  display_name: string
  role: string
  age?: number
  dashboard_mode?: string
  relationship?: string
  guidingStars: string[]
  bestIntentions: string[]
  selfKnowledge: Array<{ content: string; category: string }>
  archiveItems: Array<{ content: string; folder_name?: string }>
}

interface ContextData {
  memberContexts: MemberContext[]
  familyArchiveItems: Array<{ content: string; folder_name?: string }>
  faithContext: string
}

async function assembleServerContext(familyId: string): Promise<ContextData> {
  // Load all family members first
  const fmRes = await supabase
    .from('family_members')
    .select('id, display_name, role, age, date_of_birth, dashboard_mode, relationship')
    .eq('family_id', familyId)
    .eq('is_active', true)

  const members = (fmRes.data || []) as Array<{
    id: string; display_name: string; role: string;
    age?: number; date_of_birth?: string; dashboard_mode?: string; relationship?: string
  }>
  const allMemberIds = members.map(m => m.id)

  // Load ALL context in parallel — each query includes member_id for grouping
  const [gsRes, biRes, skRes, fpRes, archiveData] = await Promise.all([
    supabase.from('guiding_stars').select('content, member_id').eq('family_id', familyId).eq('is_included_in_ai', true).is('archived_at', null),
    supabase.from('best_intentions').select('statement, member_id').eq('family_id', familyId).eq('is_included_in_ai', true).eq('is_active', true).is('archived_at', null),
    supabase.from('self_knowledge').select('content, category, member_id').eq('family_id', familyId).eq('is_included_in_ai', true).is('archived_at', null),
    supabase.from('faith_preferences').select('faith_tradition, denomination, special_instructions').eq('family_id', familyId).maybeSingle(),
    loadArchiveContextServer(familyId, allMemberIds),
  ])

  // Group guiding stars by member_id
  const gsByMember = new Map<string, string[]>()
  for (const g of (gsRes.data || []) as Array<{ content: string; member_id: string }>) {
    const list = gsByMember.get(g.member_id) || []
    list.push(g.content)
    gsByMember.set(g.member_id, list)
  }

  // Group best intentions by member_id
  const biByMember = new Map<string, string[]>()
  for (const b of (biRes.data || []) as Array<{ statement: string; member_id: string }>) {
    const list = biByMember.get(b.member_id) || []
    list.push(b.statement)
    biByMember.set(b.member_id, list)
  }

  // Group self-knowledge by member_id
  const skByMember = new Map<string, Array<{ content: string; category: string }>>()
  for (const s of (skRes.data || []) as Array<{ content: string; category: string; member_id: string }>) {
    const list = skByMember.get(s.member_id) || []
    list.push({ content: s.content, category: s.category })
    skByMember.set(s.member_id, list)
  }

  // Build per-member context bundles
  const memberContexts: MemberContext[] = members.map(m => ({
    display_name: m.display_name,
    role: m.role,
    age: m.age,
    dashboard_mode: m.dashboard_mode,
    relationship: m.relationship,
    guidingStars: gsByMember.get(m.id) || [],
    bestIntentions: biByMember.get(m.id) || [],
    selfKnowledge: skByMember.get(m.id) || [],
    archiveItems: archiveData.byMember.get(m.id) || [],
  }))

  // Faith context
  let faithContext = ''
  const fp = fpRes.data as { faith_tradition?: string; denomination?: string; special_instructions?: string } | null
  if (fp?.faith_tradition) {
    faithContext = `Faith: This family identifies with ${fp.faith_tradition}${fp.denomination ? ` (${fp.denomination})` : ''}. Reference when naturally relevant. Never force.`
    if (fp.special_instructions) {
      faithContext += ` Family instructions: ${fp.special_instructions}`
    }
  }

  return {
    memberContexts,
    familyArchiveItems: archiveData.familyItems,
    faithContext,
  }
}

/** Load archive context items grouped by member, with three-tier filtering */
async function loadArchiveContextServer(
  familyId: string,
  memberIds: string[],
): Promise<{
  byMember: Map<string, Array<{ content: string; folder_name?: string }>>;
  familyItems: Array<{ content: string; folder_name?: string }>;
}> {
  const empty = { byMember: new Map(), familyItems: [] }
  if (memberIds.length === 0) return empty

  try {
    // Step 1: Check person-level toggles
    const { data: memberSettings } = await supabase
      .from('archive_member_settings')
      .select('member_id, is_included_in_ai')
      .eq('family_id', familyId)

    const excludedMembers = new Set(
      (memberSettings ?? [])
        .filter((s: { is_included_in_ai: boolean }) => !s.is_included_in_ai)
        .map((s: { member_id: string }) => s.member_id)
    )
    const enabledMembers = memberIds.filter(id => !excludedMembers.has(id))
    if (enabledMembers.length === 0) return empty

    // Step 2: Load enabled folders (category level)
    const { data: folders } = await supabase
      .from('archive_folders')
      .select('id, folder_name, is_included_in_ai, member_id')
      .eq('family_id', familyId)
      .eq('is_included_in_ai', true)

    if (!folders || folders.length === 0) return empty

    const enabledFolders = (folders as Array<{ id: string; folder_name: string; member_id: string | null }>)
      .filter(f => f.member_id === null || enabledMembers.includes(f.member_id))
    if (enabledFolders.length === 0) return empty

    const enabledFolderIds = enabledFolders.map(f => f.id)
    const folderMap = new Map(enabledFolders.map(f => [f.id, f.folder_name]))
    // Map folder_id -> member_id so we can attribute items to the correct person
    const folderOwnerMap = new Map(enabledFolders.map(f => [f.id, f.member_id]))

    // Step 3: Load items — include member_id for direct attribution
    const { data: items } = await supabase
      .from('archive_context_items')
      .select('context_value, folder_id, member_id')
      .eq('family_id', familyId)
      .in('folder_id', enabledFolderIds)
      .eq('is_included_in_ai', true)
      .is('archived_at', null)
      .limit(200)

    if (!items || items.length === 0) return empty

    // Group items by member
    const byMember = new Map<string, Array<{ content: string; folder_name?: string }>>()
    const familyItems: Array<{ content: string; folder_name?: string }> = []

    for (const item of items as Array<{ context_value: string; folder_id: string; member_id: string | null }>) {
      const formatted = { content: item.context_value, folder_name: folderMap.get(item.folder_id) }
      // Use item.member_id first, fall back to folder owner
      const ownerId = item.member_id || folderOwnerMap.get(item.folder_id)
      if (ownerId) {
        const list = byMember.get(ownerId) || []
        list.push(formatted)
        byMember.set(ownerId, list)
      } else {
        // Family-level items (no member owner)
        familyItems.push(formatted)
      }
    }

    return { byMember, familyItems }
  } catch (err) {
    console.error('Archive context loading failed:', err)
    return empty
  }
}

function buildSystemPrompt(
  modeKey: string,
  memberRole: string,
  context: ContextData,
  pageContext?: string,
): string {
  const parts: string[] = [CRISIS_OVERRIDE, BASE_IDENTITY]

  // Mode
  const mp = MODE_PROMPTS[modeKey]
  if (mp) parts.push(mp)

  // Voice
  const voice = VOICE_ADJUSTMENTS[memberRole]
  if (voice) parts.push(voice)

  // Faith
  if (context.faithContext) parts.push(context.faithContext)

  // Per-member context — each person's data grouped under their name
  let hasAnyContext = false
  if (context.memberContexts.length > 0) {
    const memberSections: string[] = []

    for (const mc of context.memberContexts) {
      const header: string[] = [mc.role]
      if (mc.age) header.push(`age ${mc.age}`)
      if (mc.relationship) header.push(mc.relationship)

      const lines: string[] = []

      if (mc.archiveItems.length > 0) {
        for (const item of mc.archiveItems) {
          lines.push(`- ${item.content}${item.folder_name ? ` [${item.folder_name}]` : ''}`)
        }
      }

      if (mc.selfKnowledge.length > 0) {
        for (const sk of mc.selfKnowledge) {
          lines.push(`- [${sk.category}] ${sk.content}`)
        }
      }

      if (mc.guidingStars.length > 0) {
        lines.push('Guiding Stars:')
        for (const gs of mc.guidingStars) {
          lines.push(`  - ${gs}`)
        }
      }

      if (mc.bestIntentions.length > 0) {
        lines.push('Active Intentions:')
        for (const bi of mc.bestIntentions) {
          lines.push(`  - ${bi}`)
        }
      }

      if (lines.length > 0) {
        hasAnyContext = true
        memberSections.push(`--- ${mc.display_name} (${header.join(', ')}) ---\n${lines.join('\n')}`)
      } else {
        // Still list the member even without context
        memberSections.push(`--- ${mc.display_name} (${header.join(', ')}) ---\n(no detailed context yet)`)
      }
    }

    parts.push(`## Family Context\n\n${memberSections.join('\n\n')}`)
  }

  // Family-level archive items (not owned by any specific member)
  if (context.familyArchiveItems.length > 0) {
    hasAnyContext = true
    parts.push(`## Family-Level Context\n${context.familyArchiveItems.map(a =>
      `- ${a.content}${a.folder_name ? ` [${a.folder_name}]` : ''}`
    ).join('\n')}`)
  }

  // Page context
  if (pageContext) {
    parts.push(`Current page: ${pageContext}`)
  }

  if (!hasAnyContext) {
    parts.push('No detailed family context loaded yet. Give helpful but more generic responses. Encourage the user to add context through Archives, Guiding Stars, or InnerWorkings for more personalized help.')
  }

  return parts.join('\n\n')
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

    // Assemble context
    const context = await assembleServerContext(conversation.family_id)

    // Build system prompt
    const systemPrompt = buildSystemPrompt(
      modeKey,
      member?.role || 'primary_parent',
      context,
      conversation.page_context,
    )

    // Load conversation history (last 20 messages for context window management)
    const { data: history } = await supabase
      .from('lila_messages')
      .select('role, content')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })
      .limit(20)

    const messages = [
      { role: 'system', content: systemPrompt },
      ...(history || []).map(m => ({
        role: m.role === 'system' ? 'assistant' : m.role,
        content: m.content,
      })),
      { role: 'user', content },
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
