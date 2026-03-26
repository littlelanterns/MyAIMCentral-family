// PRD-34: Decision Guide — 15 structured decision frameworks with values alignment
// Model: Sonnet. Conversational. Loads Guiding Stars + Best Intentions for values checks.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const MODEL = 'anthropic/claude-sonnet-4'

const CRISIS_KEYWORDS = ['suicide', 'kill myself', 'want to die', 'end my life', 'self-harm', 'cutting myself', 'hurting myself', 'being abused', 'abusing me', 'hits me', 'molest', 'eating disorder', 'starving myself', 'purging', 'overdose']
const CRISIS_RESPONSE = `I hear you, and help is available right now.\n\n**988 Suicide & Crisis Lifeline** — Call or text 988 (24/7)\n**Crisis Text Line** — Text HOME to 741741\n**National Domestic Violence Hotline** — 1-800-799-7233\n**Emergency** — Call 911\n\nYou don't have to face this alone.`

async function loadDecisionContext(familyId: string, memberId: string): Promise<string> {
  const parts: string[] = []

  // Load Guiding Stars
  const { data: stars } = await supabase
    .from('guiding_stars')
    .select('content, category, description')
    .eq('family_id', familyId)
    .eq('member_id', memberId)
    .eq('is_included_in_ai', true)
    .is('archived_at', null)
    .limit(20)

  if (stars?.length) {
    parts.push('## Guiding Stars (user\'s core values)')
    for (const s of stars) {
      parts.push(`- ${s.content}${s.description ? ` — ${s.description}` : ''}`)
    }
  }

  // Load Best Intentions
  const { data: intentions } = await supabase
    .from('best_intentions')
    .select('statement, description')
    .eq('family_id', familyId)
    .eq('member_id', memberId)
    .eq('is_included_in_ai', true)
    .eq('is_active', true)
    .is('archived_at', null)
    .limit(20)

  if (intentions?.length) {
    parts.push('\n## Best Intentions (user\'s active commitments)')
    for (const i of intentions) {
      parts.push(`- ${i.statement}${i.description ? ` — ${i.description}` : ''}`)
    }
  }

  // Load self_knowledge for identity-based decisions
  const { data: sk } = await supabase
    .from('self_knowledge')
    .select('content, category')
    .eq('family_id', familyId)
    .eq('member_id', memberId)
    .eq('is_included_in_ai', true)
    .is('archived_at', null)
    .limit(15)

  if (sk?.length) {
    parts.push('\n## Self-Knowledge')
    for (const s of sk) {
      parts.push(`- [${s.category}] ${s.content}`)
    }
  }

  return parts.join('\n')
}

function buildSystemPrompt(ctx: string, frameworkAddition: string): string {
  return `## CRISIS OVERRIDE (NON-NEGOTIABLE)
If any message contains indicators of suicidal ideation, self-harm, abuse, or immediate danger:
1. Express care and validation. 2. Provide: 988, Crisis Text Line (741741), NDVH, 911.

## Identity
You are LiLa in Decision Guide mode. You have 15 decision frameworks. Your job is to help the user think more clearly, not to make the decision for them.

## UNIVERSAL RULES (all ThoughtSift tools)
- Follow the validate, invite curiosity, gentle reframe, empower with ownership arc
- Never give directives — present possibilities, preserve autonomy
- Use "what" questions, not "why" questions (why triggers defensiveness)
- Never label relationships as abusive/toxic based on one side — paint healthy pictures, acknowledge gaps
- Reference Guiding Stars and Best Intentions when naturally relevant, never mechanically
- Faith-aware: reference faith context when entries exist AND topic connects naturally. Never force.
- Synthesized wisdom: apply universal principles. Never cite a single book source. If asked: "This shows up across several books" + titles as further reading only if asked.

## DECISION GUIDE SPECIFIC
When suggesting a framework, explain WHY it fits this decision type in one sentence before asking if they want to use it.

When walking through a framework: conversational, not a checklist. Ask one question at a time. Let the user's answers lead. The framework is a structure for their thinking, not a form they fill out.

When you detect extended indecision (the user has been going back and forth for 3+ turns without movement), offer the coin flip insight once:
"Before we go further — if I flipped a coin and it landed on [Option A], what is your gut reaction? Relief or dread? That reaction is data worth paying attention to."
Never push if they decline. Never repeat in the same session.

VALUES ALIGNMENT CHECK: You have the user's Guiding Stars and Best Intentions. Weave them in when naturally relevant:
"You have a Guiding Star about [X]. How does each option sit with that?"
Do not do this mechanically or on every turn — only when it genuinely illuminates the decision.

After reaching a conclusion: offer to capture the decision and any action steps.

FRAMEWORK SWITCHING: At any point the user can switch frameworks. Insert a visual marker and acknowledge what the prior framework revealed before starting the new one.

COGNITIVE BIAS AWARENESS: When you detect a bias in the user's reasoning (sunk cost, confirmation bias, endowment effect, anchoring), name it gently: "I notice something — it sounds like [pattern]. That is a common thinking trap. Let me offer a different angle..."

## ACTIVE FRAMEWORK
${frameworkAddition || 'No framework selected yet. After hearing the user\'s decision, suggest 1-2 frameworks with a one-sentence explanation each, OR let the user pick their own.'}

## FAMILY CONTEXT
${ctx || 'No values or self-knowledge context available.'}
`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
      },
    })
  }

  try {
    const { data: { user }, error } = await anonClient.auth.getUser(
      (req.headers.get('Authorization') || '').replace('Bearer ', '')
    )
    if (error || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 })
    }

    const { conversation_id, content, framework_key } = await req.json()
    if (!conversation_id || !content) {
      return new Response(JSON.stringify({ error: 'Missing params' }), { status: 400 })
    }

    const { data: conv } = await supabase
      .from('lila_conversations')
      .select('*')
      .eq('id', conversation_id)
      .single()
    if (!conv) {
      return new Response(JSON.stringify({ error: 'Not found' }), { status: 404 })
    }

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

    // Load framework system_prompt_addition if a framework is active
    let frameworkAddition = ''
    if (framework_key) {
      const { data: fw } = await supabase
        .from('decision_frameworks')
        .select('display_name, system_prompt_addition')
        .eq('framework_key', framework_key)
        .eq('is_active', true)
        .single()
      if (fw) {
        frameworkAddition = `Active framework: ${fw.display_name}\n\n${fw.system_prompt_addition}`
      }
    }

    const ctx = await loadDecisionContext(conv.family_id, conv.member_id)
    const systemPrompt = buildSystemPrompt(ctx, frameworkAddition)

    // Save user message with framework metadata
    const userMeta: Record<string, unknown> = { mode: 'decision_guide' }
    if (framework_key) {
      userMeta.active_framework = framework_key
    }
    await supabase.from('lila_messages').insert({
      conversation_id,
      role: 'user',
      content,
      metadata: userMeta,
    })

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
        'X-Title': 'MyAIM Central - Decision Guide',
      },
      body: JSON.stringify({ model: MODEL, messages, stream: true, max_tokens: 2048 }),
    })

    if (!aiRes.ok || !aiRes.body) {
      return new Response(JSON.stringify({ error: 'AI service error' }), { status: 502 })
    }

    let full = ''
    let inTok = 0
    let outTok = 0

    const stream = new ReadableStream({
      async start(controller) {
        const reader = aiRes.body!.getReader()
        const dec = new TextDecoder()
        let buf = ''
        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break
            buf += dec.decode(value, { stream: true })
            const lines = buf.split('\n')
            buf = lines.pop() || ''
            for (const line of lines) {
              if (!line.startsWith('data: ')) continue
              const d = line.slice(6).trim()
              if (d === '[DONE]') {
                controller.enqueue(new TextEncoder().encode('data: [DONE]\n\n'))
                continue
              }
              try {
                const p = JSON.parse(d)
                const c = p.choices?.[0]?.delta?.content || ''
                if (c) {
                  full += c
                  controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'chunk', content: c })}\n\n`))
                }
                if (p.usage) {
                  inTok = p.usage.prompt_tokens || 0
                  outTok = p.usage.completion_tokens || 0
                }
              } catch { /* skip */ }
            }
          }
        } finally {
          const assistantMeta: Record<string, unknown> = {
            model: MODEL,
            mode: 'decision_guide',
          }
          if (framework_key) {
            assistantMeta.active_framework = framework_key
          }
          await supabase.from('lila_messages').insert({
            conversation_id,
            role: 'assistant',
            content: full,
            metadata: assistantMeta,
            token_count: outTok,
          })
          await supabase.from('lila_conversations')
            .update({ message_count: (history?.length || 0) + 1, model_used: 'sonnet' })
            .eq('id', conversation_id)
          supabase.from('ai_usage_tracking').insert({
            family_id: conv.family_id,
            member_id: conv.member_id,
            feature_key: 'lila_decision_guide',
            model: MODEL,
            tokens_used: inTok + outTok,
            estimated_cost: (inTok * 3.0 + outTok * 15.0) / 1_000_000,
          }).catch(() => {})
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
    console.error('Decision Guide error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})
