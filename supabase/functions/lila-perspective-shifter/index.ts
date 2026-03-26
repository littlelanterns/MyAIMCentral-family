// PRD-34: Perspective Shifter — Framework-based reframing with family-context lenses
// Model: Sonnet. Conversational. Loads lens system_prompt_addition from DB.
// Family-context lenses: synthesize, NEVER quote source items.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { loadRelationshipContext, formatRelationshipContextForPrompt } from '../_shared/relationship-context.ts'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const MODEL = 'anthropic/claude-sonnet-4'

const CRISIS_KEYWORDS = ['suicide', 'kill myself', 'want to die', 'end my life', 'self-harm', 'cutting myself', 'hurting myself', 'being abused', 'abusing me', 'hits me', 'molest', 'eating disorder', 'starving myself', 'purging', 'overdose']
const CRISIS_RESPONSE = `I hear you, and help is available right now.\n\n**988 Suicide & Crisis Lifeline** — Call or text 988 (24/7)\n**Crisis Text Line** — Text HOME to 741741\n**National Domestic Violence Hotline** — 1-800-799-7233\n**Emergency** — Call 911\n\nYou don't have to face this alone.`

function buildSystemPrompt(
  userCtx: string,
  lensAddition: string,
  familyContextSynthesis: string,
): string {
  return `## CRISIS OVERRIDE (NON-NEGOTIABLE)
If any message contains indicators of suicidal ideation, self-harm, abuse, or immediate danger:
1. Express care and validation. 2. Provide: 988, Crisis Text Line (741741), NDVH, 911.

## Identity
You are LiLa in Perspective Shifter mode. Your job is to help the user see their situation through different frameworks and lenses — each one revealing something the previous one did not.

## UNIVERSAL RULES (all ThoughtSift tools)
- Follow the validate, invite curiosity, gentle reframe, empower with ownership arc
- Never give directives — present possibilities, preserve autonomy
- Use "what" questions, not "why" questions (why triggers defensiveness)
- Never label relationships as abusive/toxic based on one side — paint healthy pictures, acknowledge gaps
- Reference Guiding Stars and Best Intentions when naturally relevant, never mechanically
- Faith-aware: reference faith context when entries exist AND topic connects naturally. Never force.
- Synthesized wisdom: apply universal principles. Never cite a single book source. If asked: "This shows up across several books" + titles as further reading only if asked.

## PERSPECTIVE SHIFTER SPECIFIC
When a lens is active, every response must include:
1. The framework's core reframe (1-2 sentences applying the lens to their specific situation — not a generic description of the framework)
2. A probing question that applies the lens to what they have actually shared
3. An invitation: "Want to explore this further, or switch to a different lens?"

When switching lenses:
- Explicitly acknowledge what the previous lens revealed: "Through the [previous lens] we found [specific insight]. Now through the [new lens]..."
- Full conversation history is yours — use it to build on prior insights
- Each lens should reveal something the previous one did not

For family-context lenses:
- You have SYNTHESIZED context about the named person below.
- Do NOT quote specific context items, reveal which items informed your response, or attribute information to specific database entries.
- Use the context to construct a genuine perspective as that person would see things given their personality, values, and what you know.
- Frame as: "Based on what I know about [Name], they would probably see this as..."
- If the person has minimal context: "I do not have much on [Name] yet. I can offer a general perspective based on their age and what you have shared here, or you can add more to their profile in Archives."

If the user seems to want to go deeper on one lens rather than switch: stay with it. Switching is always available but never forced.

When the user mentions a family member by name, offer: "You mentioned [Name] — would you like to see this from their perspective?"

## ACTIVE LENS
${lensAddition || 'No lens selected yet. Help the user describe their situation first, then suggest a lens or let them choose.'}

## FAMILY MEMBER CONTEXT (SYNTHESIZED — DO NOT QUOTE DIRECTLY)
${familyContextSynthesis || 'No family member context loaded for this conversation.'}

## USER CONTEXT
${userCtx}
`
}

/**
 * Build a synthesized family-context block from raw context data.
 * CRITICAL: This function transforms raw items into a synthesized narrative
 * so the system prompt never contains quotable source material.
 */
function synthesizeFamilyContext(
  personName: string,
  personAge: number | null | undefined,
  personRole: string,
  selfKnowledge: Array<{ content: string; category: string }>,
  archiveItems: string[],
): string {
  if (selfKnowledge.length === 0 && archiveItems.length === 0) {
    return `Limited context available for ${personName}. Age: ${personAge || 'unknown'}. Role: ${personRole}.`
  }

  const parts: string[] = []
  parts.push(`Synthesized profile for ${personName} (age ${personAge || 'unknown'}, ${personRole}):`)

  // Group self-knowledge by category into a narrative
  const byCategory: Record<string, string[]> = {}
  for (const sk of selfKnowledge) {
    const cat = sk.category || 'general'
    if (!byCategory[cat]) byCategory[cat] = []
    byCategory[cat].push(sk.content)
  }

  for (const [cat, items] of Object.entries(byCategory)) {
    const label = cat.replace(/_/g, ' ')
    parts.push(`- ${label}: ${items.join('; ')}`)
  }

  if (archiveItems.length > 0) {
    parts.push(`- Additional context themes: ${archiveItems.slice(0, 10).join('; ')}`)
  }

  parts.push('')
  parts.push('INSTRUCTION: Synthesize the above into a perspective. Do NOT list or quote these items back to the user.')

  return parts.join('\n')
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'POST, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey' },
    })
  }

  try {
    const { data: { user }, error } = await anonClient.auth.getUser(
      (req.headers.get('Authorization') || '').replace('Bearer ', '')
    )
    if (error || !user) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })

    const { conversation_id, content, lens_key, person_id } = await req.json()
    if (!conversation_id || !content) return new Response(JSON.stringify({ error: 'Missing params' }), { status: 400 })

    const { data: conv } = await supabase.from('lila_conversations').select('*').eq('id', conversation_id).single()
    if (!conv) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })

    // Crisis check
    if (CRISIS_KEYWORDS.some(k => content.toLowerCase().includes(k))) {
      await supabase.from('lila_messages').insert([
        { conversation_id, role: 'user', content, metadata: {} },
        { conversation_id, role: 'assistant', content: CRISIS_RESPONSE, metadata: { source: 'crisis_override' } },
      ])
      return new Response(JSON.stringify({ crisis: true, response: CRISIS_RESPONSE }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    // Load lens system_prompt_addition
    let lensAddition = ''
    let lensDisplayName = ''
    if (lens_key) {
      const { data: lens } = await supabase
        .from('perspective_lenses')
        .select('display_name, system_prompt_addition, lens_type')
        .eq('lens_key', lens_key)
        .eq('is_active', true)
        .single()
      if (lens) {
        lensAddition = `Active lens: ${lens.display_name}\nType: ${lens.lens_type}\n\n${lens.system_prompt_addition}`
        lensDisplayName = lens.display_name
      }
    }

    // Load user context (guiding stars, self-knowledge, etc.)
    const personIds = person_id ? [person_id] : []
    const ctx = await loadRelationshipContext(conv.family_id, conv.member_id, personIds, 'perspective_shifter')
    const userCtx = formatRelationshipContextForPrompt(ctx)

    // Build synthesized family context for family-context lenses
    let familyContextSynthesis = ''
    if (person_id && ctx.personContexts.length > 0) {
      const pc = ctx.personContexts[0]
      familyContextSynthesis = synthesizeFamilyContext(
        pc.displayName,
        pc.age,
        pc.role,
        pc.selfKnowledge,
        pc.archiveItems,
      )
    }

    const systemPrompt = buildSystemPrompt(userCtx, lensAddition, familyContextSynthesis)

    // Save user message with lens metadata
    const userMeta: Record<string, unknown> = { mode: 'perspective_shifter' }
    if (lens_key) {
      userMeta.active_lens = lens_key
      userMeta.lens_display_name = lensDisplayName
    }
    if (person_id) userMeta.person_id = person_id
    await supabase.from('lila_messages').insert({ conversation_id, role: 'user', content, metadata: userMeta })

    // Load history
    const { data: history } = await supabase
      .from('lila_messages')
      .select('role, content')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })
      .limit(40)

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...((history || []) as Array<{ role: string; content: string }>).map(m => ({
        role: (m.role === 'system' ? 'assistant' : m.role) as 'user' | 'assistant',
        content: m.content,
      })),
    ]

    // Stream response
    const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://myaimcentral.com',
        'X-Title': 'MyAIM Central - Perspective Shifter',
      },
      body: JSON.stringify({ model: MODEL, messages, stream: true, max_tokens: 2048 }),
    })
    if (!aiRes.ok || !aiRes.body) return new Response(JSON.stringify({ error: 'AI service error' }), { status: 502 })

    let full = '', inTok = 0, outTok = 0
    const stream = new ReadableStream({
      async start(controller) {
        const reader = aiRes.body!.getReader(); const dec = new TextDecoder(); let buf = ''
        try {
          while (true) {
            const { done, value } = await reader.read(); if (done) break
            buf += dec.decode(value, { stream: true }); const lines = buf.split('\n'); buf = lines.pop() || ''
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue; const d = line.slice(6).trim()
              if (d === '[DONE]') { controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n')); continue }
              try {
                const p = JSON.parse(d); const c = p.choices?.[0]?.delta?.content || ''
                if (c) { full += c; controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'chunk', content: c })}\n\n`)) }
                if (p.usage) { inTok = p.usage.prompt_tokens || 0; outTok = p.usage.completion_tokens || 0 }
              } catch { /* skip */ }
            }
          }
        } finally {
          const assistantMeta: Record<string, unknown> = { model: MODEL, mode: 'perspective_shifter' }
          if (lens_key) { assistantMeta.active_lens = lens_key; assistantMeta.lens_display_name = lensDisplayName }
          if (person_id) assistantMeta.person_id = person_id
          await supabase.from('lila_messages').insert({ conversation_id, role: 'assistant', content: full, metadata: assistantMeta, token_count: outTok })
          await supabase.from('lila_conversations').update({ message_count: (history?.length || 0) + 1, model_used: 'sonnet' }).eq('id', conversation_id)
          supabase.from('ai_usage_tracking').insert({ family_id: conv.family_id, member_id: conv.member_id, feature_key: 'lila_perspective_shifter', model: MODEL, tokens_used: inTok + outTok, estimated_cost: (inTok * 3.0 + outTok * 15.0) / 1_000_000 }).catch(() => {})
          controller.close()
        }
      },
    })
    return new Response(stream, { headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive', 'Access-Control-Allow-Origin': '*' } })
  } catch (err) {
    console.error('Perspective Shifter error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } })
  }
})
