// PRD-34: Perspective Shifter — Framework-based reframing with family-context lenses
// Model: Sonnet. Conversational. Loads lens system_prompt_addition from DB.
// Family-context lenses: synthesize, NEVER quote source items.

import { z } from 'https://esm.sh/zod@3.23.8'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { loadRelationshipContext, formatRelationshipContextForPrompt } from '../_shared/relationship-context.ts'
import { handleCors, jsonHeaders } from '../_shared/cors.ts'
import { authenticateRequest } from '../_shared/auth.ts'
import { detectCrisis, CRISIS_RESPONSE } from '../_shared/crisis-detection.ts'
import { createSSEStream, processOpenRouterStream } from '../_shared/streaming.ts'
import { logAICost } from '../_shared/cost-logger.ts'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const MODEL = 'anthropic/claude-sonnet-4'

const InputSchema = z.object({
  conversation_id: z.string().uuid(),
  content: z.string().min(1),
  lens_key: z.string().optional(),
  person_id: z.string().optional(),
})

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
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const auth = await authenticateRequest(req)
    if (auth instanceof Response) return auth

    const parsed = InputSchema.safeParse(await req.json())
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: parsed.error.flatten() }), { status: 400, headers: jsonHeaders })
    }
    const { conversation_id, content, lens_key, person_id } = parsed.data

    const { data: conv } = await supabase.from('lila_conversations').select('*').eq('id', conversation_id).single()
    if (!conv) return new Response(JSON.stringify({ error: 'Not found' }), { status: 404, headers: jsonHeaders })

    // Crisis check
    if (detectCrisis(content)) {
      await supabase.from('lila_messages').insert([
        { conversation_id, role: 'user', content, metadata: {} },
        { conversation_id, role: 'assistant', content: CRISIS_RESPONSE, metadata: { source: 'crisis_override' } },
      ])
      return new Response(JSON.stringify({ crisis: true, response: CRISIS_RESPONSE }), { headers: jsonHeaders })
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

    // Load history first for layered context detection
    const { data: history } = await supabase
      .from('lila_messages')
      .select('role, content')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })
      .limit(40)

    const recentMsgs = ((history || []) as Array<{ role: string; content: string }>).slice(-4)

    // Load user context (guiding stars, self-knowledge, etc.) with layered filtering
    const personIds = person_id ? [person_id] : []
    const ctx = await loadRelationshipContext(conv.family_id, conv.member_id, personIds, 'perspective_shifter', content, recentMsgs)
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
    if (!aiRes.ok || !aiRes.body) return new Response(JSON.stringify({ error: 'AI service error' }), { status: 502, headers: jsonHeaders })

    return createSSEStream(async (enqueue) => {
      const { fullText, inputTokens, outputTokens } = await processOpenRouterStream(aiRes.body!, enqueue)

      // Save assistant message with custom metadata
      const assistantMeta: Record<string, unknown> = { model: MODEL, mode: 'perspective_shifter' }
      if (lens_key) { assistantMeta.active_lens = lens_key; assistantMeta.lens_display_name = lensDisplayName }
      if (person_id) assistantMeta.person_id = person_id
      await supabase.from('lila_messages').insert({ conversation_id, role: 'assistant', content: fullText, metadata: assistantMeta, token_count: outputTokens })
      await supabase.from('lila_conversations').update({ message_count: (history?.length || 0) + 1, model_used: 'sonnet' }).eq('id', conversation_id)
      logAICost({ familyId: conv.family_id, memberId: conv.member_id, featureKey: 'lila_perspective_shifter', model: MODEL, inputTokens, outputTokens })
    })
  } catch (err) {
    console.error('Perspective Shifter error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: jsonHeaders })
  }
})
