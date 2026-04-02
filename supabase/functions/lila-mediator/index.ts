// PRD-34: Mediator — Conflict resolution with 8 context modes
// Model: Sonnet. Supersedes PRD-19 relationship_mediation.
// Safety exception: once triggered, persisted on lila_conversations.context_snapshot.safety_triggered
// Flag checked from DB on EVERY turn — not resettable by close/reopen.

import { z } from 'https://esm.sh/zod@3.23.8'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { loadRelationshipContext, formatRelationshipContextForPrompt } from '../_shared/relationship-context.ts'
import { handleCors, jsonHeaders, sseHeaders } from '../_shared/cors.ts'
import { authenticateRequest } from '../_shared/auth.ts'
import { detectCrisis, CRISIS_RESPONSE } from '../_shared/crisis-detection.ts'
import { logAICost } from '../_shared/cost-logger.ts'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const MODEL = 'anthropic/claude-sonnet-4'

// ── Zod Input Schema ───────────────────────────────────────────

const InputSchema = z.object({
  conversation_id: z.string().uuid(),
  content: z.string().min(1),
  mediation_context: z.string().optional(),
  person_ids: z.array(z.string()).optional(),
})

// Safety trigger keywords — patterns suggesting unsafe dynamics (distinct from crisis)
const SAFETY_TRIGGER_PATTERNS = [
  'afraid of him', 'afraid of her', 'afraid of them',
  'scared to go home', 'scared of my',
  'threatens me', 'threatened to',
  'controls everything', 'controls my',
  'not allowed to', 'won\'t let me',
  'isolates me', 'isolated from',
  'hits me', 'hit me', 'slapped me', 'pushed me', 'choked me',
  'coercive', 'intimidat',
  'locks me', 'locked me',
  'takes my phone', 'checks my phone',
  'monitors everything',
  'walking on eggshells',
  'fear of making him angry', 'fear of making her angry',
]

const SAFETY_TRIGGERED_RESPONSE = `What you are describing sounds like it goes beyond a conflict that communication tools can fix.

In a healthy relationship, both people feel safe to disagree, to have their own space, and to make their own choices. What you are describing sounds different from that.

You deserve support from someone who can really help:

**National Domestic Violence Hotline** — 1-800-799-7233 (24/7)
**Crisis Text Line** — Text HOME to 741741
**Safe Harbor** — available in this app for private processing

I am here if you want to talk, but I want to be honest: this is beyond what a conflict resolution tool should try to work through on its own. The people above are trained for exactly this.`

// Context mode system prompt adjustments
const CONTEXT_MODE_ADDITIONS: Record<string, string> = {
  solo: `CONTEXT: Solo processing. The user is working through a conflict alone. No assumption the other person will see this. Focus on clarity, self-reflection, and preparation for re-engagement. Help them understand their own role and prepare for the conversation they may need to have.`,

  spouse_partner: `CONTEXT: Spouse/partner conflict. This is a marriage or committed partnership conflict. Marriage-specific frameworks apply: NVC, 80/80 equity, repair patterns. Load the partner's "How to Reach Me" card if available. Ask: "What does your partner most need to feel right now?" Surface communication style differences. Remember: the relationship is the client, not just the person in front of you.`,

  parent_child: `CONTEXT: Parent-child conflict (young child). Consider developmental stage before interpreting behavior. What looks like defiance in a 5-year-old is often inability, not unwillingness. Consider: Is this a skill gap or a will gap? Offer specific language scripts: "You might try saying: '...'" Use the Emotion Coaching five steps: tune in, validate, label precisely, help manage intensity, problem-solve only AFTER the emotional wave passes. Never skip to step 5.`,

  parent_teen: `CONTEXT: Parent-teen conflict. Talk UP. Respect their intelligence and agency. Never condescend. Teens who receive acceptance talk to their parents; teens who feel constantly corrected find someone else. Autonomy-respecting language throughout. Use the Huggie Sandwich for corrections: genuine affirmation, specific correction, genuine affirmation. Lower your voice when they raise theirs. Delay consequences by 30 minutes if safe.`,

  sibling_mediation: `CONTEXT: Sibling mediation. Fairness is the central concern for both children. Both kids need to feel seen. Name the underlying dynamic: "When siblings fight about [topic], it is often really about [underlying pattern]." Neurotypical siblings perceive through comparative fairness; neurodivergent siblings perceive through sensory and routine coherence — these realities regularly collide. Allow creative amends over forced apologies.`,

  workplace: `CONTEXT: Workplace / non-family conflict. No family platform context loaded. Use general conflict resolution frameworks: NVC, boundary setting, self-deception awareness. "What part of this is yours to own?" Influence without authority: find ways to provide valuable input benefiting the shared goal without threatening their position. Always restate what you think the other person is saying before responding.`,

  man_vs_self: `CONTEXT: Man vs. Self — internal conflict. Use IFS-informed approach. "It sounds like part of you wants [X] and another part wants [Y]. What does each part need?" Help them find the integration point where both parts can be honored. Exiles carry original wounds; Protectors form around them. The goal is not to silence any part but to understand its positive intent. The capital-S Self — calm, curious, compassionate — can lead when given room.`,

  full_picture: `CONTEXT: Full Picture mode (primary parent only). You have relationship notes from MULTIPLE perspectives about this pair. Notes are labeled neutrally: "Perspective A:", "Perspective B:", "Observer perspective:" — NEVER attributed by author name. You synthesize what you see across all perspectives without revealing any individual note. The user does NOT see raw notes on screen. LiLa holds the full picture and helps the user help them. NEVER take sides. NEVER reveal one person's feelings to another. Always steer toward repair. Respect all members.`,
}

function buildSystemPrompt(
  userCtx: string,
  contextMode: string,
  safetyTriggered: boolean,
): string {
  if (safetyTriggered) {
    return `## SAFETY MODE ACTIVE
This conversation has been flagged for safety concerns. Framework-based conflict coaching is suspended for the remainder of this session.

Your role now:
- Continue to listen with warmth and care
- Paint pictures of what healthy looks like without labeling or diagnosing
- Acknowledge the gap between what the user describes and what healthy looks like
- Guide toward real support: Safe Harbor, trusted humans, professional resources
- Provide crisis resources if the situation escalates
- Do NOT resume framework-based coaching, mediation techniques, or NVC exercises
- Do NOT invite curiosity about the other person's perspective
- Do NOT suggest the user "work on" the relationship through communication tools

Resources to surface when appropriate:
**National Domestic Violence Hotline** — 1-800-799-7233 (24/7)
**Crisis Text Line** — Text HOME to 741741
**Safe Harbor** — available in this app for private processing

## USER CONTEXT
${userCtx}
`
  }

  const modeAddition = CONTEXT_MODE_ADDITIONS[contextMode] || CONTEXT_MODE_ADDITIONS.solo

  return `## CRISIS OVERRIDE (NON-NEGOTIABLE)
If any message contains indicators of suicidal ideation, self-harm, abuse, or immediate danger:
1. Express care and validation. 2. Provide: 988, Crisis Text Line (741741), NDVH, 911.

## Identity
You are LiLa in Mediator mode. You help people process conflict, gain clarity, and prepare to re-engage — with themselves or others.

## UNIVERSAL RULES (all ThoughtSift tools)
- Follow the validate, invite curiosity, gentle reframe, empower with ownership arc
- Never give directives — present possibilities, preserve autonomy
- Use "what" questions, not "why" questions (why triggers defensiveness)
- Never label relationships as abusive/toxic based on one side — paint healthy pictures, acknowledge gaps
- Reference Guiding Stars and Best Intentions when naturally relevant, never mechanically
- Faith-aware: reference faith context when entries exist AND topic connects naturally. Never force.
- Synthesized wisdom: apply universal principles. Never cite a single book source.

## CONVERSATIONAL ARC (follow this sequence)
1. VALIDATE FIRST. The person's feelings are real and legitimate. Full stop.
   "That sounds really frustrating." / "Of course that landed that way."
   Do not move forward until you have genuinely acknowledged the experience.
2. INVITE CURIOSITY. Ask what THEY think might be happening:
   "What do you make of that?" / "What is your sense of where this is coming from?"
   This is not about excusing the other person — it is about building understanding.
3. GENTLE REFRAME. Only if it emerges naturally. Only as a possibility.
   "I wonder if..." / "One thing I notice is..." Never a directive.
4. EMPOWER WITH OWNERSHIP. Always end toward action and agency:
   "How do you want to show up when you re-engage with this?"
   "What feels most important to address first?"

## NVC GUIDE (available in all contexts)
When appropriate, walk the user through:
Observation (what happened, without judgment) → Feeling (what you felt) → Need (what you needed that was not met) → Request (what you would like going forward).
This is conversational, not a form. "You're always late" is evaluation; "You arrived 20 minutes after we agreed" is observation.

## AGE-SPECIFIC SCRIPTS
When the conflict involves a child, draw from developmental knowledge to suggest actual language:
- Young child: "When [child] says [behavior], they may be communicating [need]. You might try: '[script]'"
- Teen: "At [teen]'s age, [developmental context]. Rather than [common mistake], try: '[script]'"
- Between siblings: "When siblings fight about [topic], the underlying issue is usually [pattern]. One approach: '[script]'"

## SAFETY EXCEPTION (MANDATORY — DO NOT SKIP)
If the user's description reveals language suggesting unhealthy or unsafe dynamics — fear, physical harm, coercive control, isolation, threats IN ANY DIRECTION:
- Do NOT invite curiosity about the other person's perspective
- Paint a picture of what healthy looks like: "In a healthy relationship, ..."
- Note the gap without labeling: "What you are describing sounds different from that."
- Guide toward real support: Safe Harbor, trusted humans, professionals
- For immediate danger: Tier 3 crisis resources immediately
- Do NOT resume framework-based coaching after this point in this session
When you detect this pattern, include the marker [SAFETY_TRIGGERED] at the very start of your response (before any visible text). This marker will be stripped before display but signals the system to persist the safety flag.

${modeAddition}

## USER CONTEXT
${userCtx}
`
}

async function loadFullPictureContext(
  familyId: string,
  personAId: string,
  personBId: string,
): Promise<string> {
  const parts: string[] = []

  // Load ALL relationship notes for this pair from ALL authors
  const { data: relNotes } = await supabase
    .from('relationship_notes')
    .select('content, author_id')
    .eq('family_id', familyId)
    .or(`and(person_a_id.eq.${personAId},person_b_id.eq.${personBId}),and(person_a_id.eq.${personBId},person_b_id.eq.${personAId})`)

  if (relNotes?.length) {
    // Label neutrally — never attribute by name
    const authorIds = [...new Set(relNotes.map(n => n.author_id))]
    const authorLabels: Record<string, string> = {}
    const labels = ['Perspective A', 'Perspective B', 'Perspective C', 'Observer']
    authorIds.forEach((id, i) => { authorLabels[id] = labels[i] || `Perspective ${i + 1}` })

    parts.push('## Relationship Notes (Multiple Perspectives — DO NOT attribute by name)')
    for (const note of relNotes) {
      parts.push(`[${authorLabels[note.author_id]}]: ${note.content}`)
    }
  }

  // Load private notes about both people (from the requesting user)
  // These are mom's private observations — never visible to subjects
  const { data: privateA } = await supabase
    .from('private_notes')
    .select('content')
    .eq('family_id', familyId)
    .eq('about_member_id', personAId)

  const { data: privateB } = await supabase
    .from('private_notes')
    .select('content')
    .eq('family_id', familyId)
    .eq('about_member_id', personBId)

  if (privateA?.length || privateB?.length) {
    parts.push('\n## Private Observations (your notes — never revealed to the subjects)')
    for (const n of (privateA || [])) parts.push(`- About Person A: ${n.content}`)
    for (const n of (privateB || [])) parts.push(`- About Person B: ${n.content}`)
  }

  return parts.join('\n')
}

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    // Auth
    const auth = await authenticateRequest(req)
    if (auth instanceof Response) return auth

    // Validate input
    const raw = await req.json()
    const parsed = InputSchema.safeParse(raw)
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Invalid input', details: parsed.error.flatten() }), {
        status: 400,
        headers: jsonHeaders,
      })
    }
    const { conversation_id, content, mediation_context, person_ids } = parsed.data

    // Load conversation — CHECK SAFETY FLAG FROM DB ON EVERY TURN
    const { data: conv } = await supabase.from('lila_conversations').select('*').eq('id', conversation_id).single()
    if (!conv) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: jsonHeaders,
      })
    }

    const contextSnapshot = (conv.context_snapshot || {}) as Record<string, unknown>
    let safetyTriggered = contextSnapshot.safety_triggered === true

    // Crisis check (Tier 3 — immediate danger)
    if (detectCrisis(content)) {
      await supabase.from('lila_messages').insert([
        { conversation_id, role: 'user', content, metadata: {} },
        { conversation_id, role: 'assistant', content: CRISIS_RESPONSE, metadata: { source: 'crisis_override' } },
      ])
      // Also set safety_triggered on crisis
      if (!safetyTriggered) {
        await supabase.from('lila_conversations').update({
          context_snapshot: { ...contextSnapshot, safety_triggered: true },
        }).eq('id', conversation_id)
      }
      return new Response(JSON.stringify({ crisis: true, response: CRISIS_RESPONSE }), {
        headers: jsonHeaders,
      })
    }

    // Safety trigger check (Tier 2 — unsafe dynamics, not immediate crisis)
    if (!safetyTriggered) {
      const lowerContent = content.toLowerCase()
      if (SAFETY_TRIGGER_PATTERNS.some(p => lowerContent.includes(p))) {
        safetyTriggered = true
        // Persist flag to DB immediately — survives close/reopen
        await supabase.from('lila_conversations').update({
          context_snapshot: { ...contextSnapshot, safety_triggered: true },
        }).eq('id', conversation_id)
      }
    }

    const contextMode = mediation_context || 'solo'
    const resolvedPersonIds: string[] = person_ids || []

    // Load history first for layered context detection
    const { data: history } = await supabase
      .from('lila_messages')
      .select('role, content')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })
      .limit(40)

    const recentMsgs = ((history || []) as Array<{ role: string; content: string }>).slice(-4)

    // Load context based on mode (with layered relevance filtering)
    let userCtx = ''
    if (contextMode === 'full_picture' && resolvedPersonIds.length >= 2) {
      const fullPictureCtx = await loadFullPictureContext(conv.family_id, resolvedPersonIds[0], resolvedPersonIds[1])
      const baseCtx = await loadRelationshipContext(conv.family_id, conv.member_id, resolvedPersonIds, 'mediator', content, recentMsgs)
      userCtx = formatRelationshipContextForPrompt(baseCtx) + '\n\n' + fullPictureCtx
    } else if (contextMode !== 'workplace') {
      const ctx = await loadRelationshipContext(conv.family_id, conv.member_id, resolvedPersonIds, 'mediator', content, recentMsgs)
      userCtx = formatRelationshipContextForPrompt(ctx)
    } else {
      const ctx = await loadRelationshipContext(conv.family_id, conv.member_id, [], 'mediator', content, recentMsgs)
      userCtx = formatRelationshipContextForPrompt(ctx)
    }

    const systemPrompt = buildSystemPrompt(userCtx, contextMode, safetyTriggered)

    // Save user message
    const userMeta: Record<string, unknown> = {
      mode: 'mediator',
      mediation_context: contextMode,
    }
    if (resolvedPersonIds.length > 0) userMeta.person_ids = resolvedPersonIds
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
        'X-Title': 'MyAIM Central - Mediator',
      },
      body: JSON.stringify({ model: MODEL, messages, stream: true, max_tokens: 2048 }),
    })
    if (!aiRes.ok || !aiRes.body) {
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 502,
        headers: jsonHeaders,
      })
    }

    // Mediator needs manual stream processing because of [SAFETY_TRIGGERED] marker detection.
    // We use createSSEStream for the response wrapper but process the OpenRouter stream
    // manually inside the handler to access the full text for marker checking.
    const encoder = new TextEncoder()

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
                controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                continue
              }
              try {
                const p = JSON.parse(d)
                const c = p.choices?.[0]?.delta?.content || ''
                if (c) {
                  full += c
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'chunk', content: c })}\n\n`))
                }
                if (p.usage) {
                  inTok = p.usage.prompt_tokens || 0
                  outTok = p.usage.completion_tokens || 0
                }
              } catch { /* skip */ }
            }
          }
        } finally {
          // Check if LiLa's response contains the safety trigger marker
          if (!safetyTriggered && full.startsWith('[SAFETY_TRIGGERED]')) {
            // Persist the flag — this conversation is now in safety mode permanently
            const freshConv = await supabase.from('lila_conversations').select('context_snapshot').eq('id', conversation_id).single()
            const freshSnapshot = (freshConv.data?.context_snapshot || {}) as Record<string, unknown>
            await supabase.from('lila_conversations').update({
              context_snapshot: { ...freshSnapshot, safety_triggered: true },
            }).eq('id', conversation_id)
            // Strip the marker from the displayed response
            full = full.replace('[SAFETY_TRIGGERED]', '').trimStart()
          }

          const assistantMeta: Record<string, unknown> = {
            model: MODEL,
            mode: 'mediator',
            mediation_context: contextMode,
            safety_triggered: safetyTriggered || full.includes('[SAFETY_TRIGGERED]'),
          }
          if (resolvedPersonIds.length > 0) assistantMeta.person_ids = resolvedPersonIds
          await supabase.from('lila_messages').insert({ conversation_id, role: 'assistant', content: full, metadata: assistantMeta, token_count: outTok })
          await supabase.from('lila_conversations').update({ message_count: (history?.length || 0) + 1, model_used: 'sonnet' }).eq('id', conversation_id)

          // Log AI usage (fire-and-forget)
          logAICost({
            familyId: conv.family_id,
            memberId: conv.member_id,
            featureKey: 'lila_mediator',
            model: MODEL,
            inputTokens: inTok,
            outputTokens: outTok,
          })

          controller.close()
        }
      },
    })

    return new Response(stream, { headers: sseHeaders })
  } catch (err) {
    console.error('Mediator error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: jsonHeaders,
    })
  }
})
