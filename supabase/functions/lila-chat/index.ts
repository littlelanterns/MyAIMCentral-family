// MyAIM Central — LiLa Chat Edge Function (PRD-05)
// Handles conversation AI processing: context assembly, model routing, streaming response.
// Uses service role for cross-table context reads.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

// Service role client for data operations (bypasses RLS)
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
// Anon client for JWT verification
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

const MODELS = {
  sonnet: 'anthropic/claude-sonnet-4',
  haiku: 'anthropic/claude-haiku-4.5',
} as const

// ============================================================
// Crisis Detection — Layer 1 (server-side backup)
// ============================================================

const CRISIS_KEYWORDS = [
  'suicide', 'kill myself', 'want to die', 'end my life',
  'self-harm', 'cutting myself', 'hurting myself',
  'being abused', 'abusing me', 'hits me', 'molest',
  'eating disorder', 'starving myself', 'purging',
  'overdose',
]

const CRISIS_RESPONSE = `I hear you, and I want you to know that help is available right now.

**988 Suicide & Crisis Lifeline**
Call or text 988 (24/7)

**Crisis Text Line**
Text HOME to 741741

**National Domestic Violence Hotline**
1-800-799-7233 (24/7)

**Emergency**
Call 911 if you're in immediate danger

These trained professionals can provide the care you need right now. You don't have to face this alone.`

function detectCrisis(message: string): boolean {
  const lower = message.toLowerCase()
  return CRISIS_KEYWORDS.some(k => lower.includes(k))
}

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

interface ContextData {
  guidingStars: string[]
  bestIntentions: string[]
  selfKnowledge: Array<{ content: string; category: string }>
  familyMembers: Array<{ display_name: string; role: string; age?: number; dashboard_mode?: string; relationship?: string }>
  archiveContext: Array<{ content: string; folder_name?: string }>
  faithContext: string
}

async function assembleServerContext(familyId: string, memberId: string): Promise<ContextData> {
  // Load all family members first (needed for multi-member context)
  const fmRes = await supabase
    .from('family_members')
    .select('id, display_name, role, age, date_of_birth, dashboard_mode, relationship')
    .eq('family_id', familyId)
    .eq('is_active', true)

  const allMemberIds = (fmRes.data || []).map((m: { id: string }) => m.id)

  // Load context for ALL family members (not just conversation owner)
  const [gsRes, biRes, skRes, fpRes, archiveRes] = await Promise.all([
    // Guiding Stars for all members
    supabase.from('guiding_stars').select('content, member_id').eq('family_id', familyId).eq('is_included_in_ai', true).is('archived_at', null),
    // Best Intentions for all members
    supabase.from('best_intentions').select('statement, member_id').eq('family_id', familyId).eq('is_included_in_ai', true).eq('is_active', true).is('archived_at', null),
    // Self-Knowledge for all members
    supabase.from('self_knowledge').select('content, category, member_id').eq('family_id', familyId).eq('is_included_in_ai', true).is('archived_at', null),
    // Faith preferences
    supabase.from('faith_preferences').select('faith_tradition, denomination, special_instructions').eq('family_id', familyId).maybeSingle(),
    // Archive context items — load from enabled folders for all members
    loadArchiveContextServer(familyId, allMemberIds),
  ])

  let faithContext = ''
  const fp = fpRes.data as { faith_tradition?: string; denomination?: string; special_instructions?: string } | null
  if (fp?.faith_tradition) {
    faithContext = `Faith: This family identifies with ${fp.faith_tradition}${fp.denomination ? ` (${fp.denomination})` : ''}. Reference when naturally relevant. Never force.`
    if (fp.special_instructions) {
      faithContext += ` Family instructions: ${fp.special_instructions}`
    }
  }

  return {
    guidingStars: (gsRes.data || []).map((g: { content: string }) => g.content),
    bestIntentions: (biRes.data || []).map((b: { statement: string }) => b.statement),
    selfKnowledge: (skRes.data || []) as Array<{ content: string; category: string }>,
    familyMembers: (fmRes.data || []).map((m: { display_name: string; role: string; age?: number; dashboard_mode?: string; relationship?: string }) => ({
      display_name: m.display_name,
      role: m.role,
      age: m.age,
      dashboard_mode: m.dashboard_mode,
      relationship: m.relationship,
    })),
    archiveContext: archiveRes,
    faithContext,
  }
}

/** Load archive context items with three-tier filtering (server-side, using service role) */
async function loadArchiveContextServer(
  familyId: string,
  memberIds: string[],
): Promise<Array<{ content: string; folder_name?: string }>> {
  if (memberIds.length === 0) return []

  try {
    // Step 1: Check person-level toggles
    const { data: memberSettings } = await supabase
      .from('archive_member_settings')
      .select('member_id, is_included_in_ai')
      .eq('family_id', familyId)

    // Members without settings default to included
    const excludedMembers = new Set(
      (memberSettings ?? [])
        .filter((s: { is_included_in_ai: boolean }) => !s.is_included_in_ai)
        .map((s: { member_id: string }) => s.member_id)
    )
    const enabledMembers = memberIds.filter(id => !excludedMembers.has(id))
    if (enabledMembers.length === 0) return []

    // Step 2: Load enabled folders (category level)
    const { data: folders } = await supabase
      .from('archive_folders')
      .select('id, folder_name, is_included_in_ai, member_id')
      .eq('family_id', familyId)
      .eq('is_included_in_ai', true)

    if (!folders || folders.length === 0) return []

    // Filter to folders belonging to enabled members (or family-level folders with null member_id)
    const enabledFolders = folders.filter((f: { member_id: string | null }) =>
      f.member_id === null || enabledMembers.includes(f.member_id)
    )
    if (enabledFolders.length === 0) return []

    const enabledFolderIds = enabledFolders.map((f: { id: string }) => f.id)
    const folderMap = new Map(enabledFolders.map((f: { id: string; folder_name: string }) => [f.id, f.folder_name]))

    // Step 3: Load items from enabled folders (item level)
    const { data: items } = await supabase
      .from('archive_context_items')
      .select('context_value, folder_id')
      .eq('family_id', familyId)
      .in('folder_id', enabledFolderIds)
      .eq('is_included_in_ai', true)
      .is('archived_at', null)
      .limit(100) // Cap to prevent token overflow

    if (!items || items.length === 0) return []

    return items.map((item: { context_value: string; folder_id: string }) => ({
      content: item.context_value,
      folder_name: folderMap.get(item.folder_id),
    }))
  } catch (err) {
    console.error('Archive context loading failed:', err)
    return []
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

  // Family members with details
  if (context.familyMembers.length > 0) {
    const memberLines = context.familyMembers.map(m => {
      const details: string[] = [m.role]
      if (m.age) details.push(`age ${m.age}`)
      if (m.relationship) details.push(m.relationship)
      if (m.dashboard_mode) details.push(`${m.dashboard_mode} mode`)
      return `- ${m.display_name} (${details.join(', ')})`
    })
    parts.push(`## Family Members\n${memberLines.join('\n')}`)
  }

  // Guiding Stars
  if (context.guidingStars.length > 0) {
    parts.push(`## Guiding Stars\n${context.guidingStars.map(g => `- ${g}`).join('\n')}`)
  }

  // Best Intentions
  if (context.bestIntentions.length > 0) {
    parts.push(`## Best Intentions\n${context.bestIntentions.map(b => `- ${b}`).join('\n')}`)
  }

  // Self-Knowledge
  if (context.selfKnowledge.length > 0) {
    parts.push(`## Self-Knowledge (InnerWorkings)\n${context.selfKnowledge.map(s => `- [${s.category}] ${s.content}`).join('\n')}`)
  }

  // Archive Context (family knowledge, interests, preferences, schedules)
  if (context.archiveContext.length > 0) {
    parts.push(`## Family Context (Archives)\n${context.archiveContext.map(a =>
      `- ${a.content}${a.folder_name ? ` [${a.folder_name}]` : ''}`
    ).join('\n')}`)
  }

  // Page context
  if (pageContext) {
    parts.push(`Current page: ${pageContext}`)
  }

  const hasContext = context.guidingStars.length > 0 || context.bestIntentions.length > 0 ||
    context.selfKnowledge.length > 0 || context.archiveContext.length > 0
  if (!hasContext) {
    parts.push('No detailed family context loaded yet. Give helpful but more generic responses. Encourage the user to add context through Archives, Guiding Stars, or InnerWorkings for more personalized help.')
  }

  return parts.join('\n\n')
}

// ============================================================
// Main Handler
// ============================================================

Deno.serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey, x-client-info',
      },
    })
  }

  try {
    // Authenticate
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'No authorization header' }), { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await anonClient.auth.getUser(token)
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    // Parse request
    const { conversation_id, content } = await req.json()
    if (!conversation_id || !content) {
      return new Response(JSON.stringify({ error: 'Missing conversation_id or content' }), { status: 400 })
    }

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

      return new Response(JSON.stringify({ crisis: true, response: CRISIS_RESPONSE }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    // Load conversation
    const { data: conversation, error: convError } = await supabase
      .from('lila_conversations')
      .select('*')
      .eq('id', conversation_id)
      .single()

    if (convError || !conversation) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), { status: 404 })
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
    const context = await assembleServerContext(conversation.family_id, conversation.member_id)

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
      return new Response(JSON.stringify({ error: 'AI service error', details: errText, status: aiResponse.status }), { status: 502 })
    }

    // Stream response back via SSE
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

          // Log AI usage (fire-and-forget)
          const pricing = modelTier === 'sonnet'
            ? { input: 3.0, output: 15.0 }
            : { input: 0.25, output: 1.25 }
          const estimatedCost = (inputTokens * pricing.input + outputTokens * pricing.output) / 1_000_000

          supabase.from('ai_usage_tracking').insert({
            family_id: conversation.family_id,
            member_id: conversation.member_id,
            feature_key: `lila_${modeKey}`,
            model: modelId,
            tokens_used: inputTokens + outputTokens,
            estimated_cost: estimatedCost,
          }).then(() => {}).catch(() => {}) // fire-and-forget

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

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    console.error('LiLa chat error:', err)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})
