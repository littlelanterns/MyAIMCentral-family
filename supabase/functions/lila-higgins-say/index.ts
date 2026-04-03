// PRD-21: Higgins Say — Message Crafting for Any Relationship
// Craft-first flow with relationship-aware voice adaptation.
// Adapts to 7 relationship types. Skill rotation. Veto memory.

import { z } from 'https://esm.sh/zod@3.23.8'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  loadRelationshipContext,
  formatRelationshipContextForPrompt,
  pickNextSkill,
} from '../_shared/relationship-context.ts'
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
})

// ── Higgins Say Teaching Skills ─────────────────────────────────

const HIGGINS_SAY_SKILLS = [
  'validation_first',
  'behavior_not_identity',
  'invitation_not_demand',
  'repair_language',
  'boundary_with_warmth',
  'autonomy_ladder',
  'direct_and_kind',
  'describe_not_evaluate',
  'avp_validation',
] as const

const SKILL_DESCRIPTIONS: Record<string, string> = {
  validation_first: `VALIDATION FIRST — Acknowledge before advising. "That sounds really hard" before "here's what you could do." People cannot hear solutions while they feel unheard. One sentence of seeing them changes the reception of everything that follows. Validation isn't agreement. It just means you registered their experience as real.`,
  behavior_not_identity: `BEHAVIOR NOT IDENTITY — Name the behavior, not the person. "You didn't clean your room" not "You're so messy." "I felt hurt by that comment" not "You're hurtful." Identity labels stick. Behavior labels describe a moment that can change.`,
  invitation_not_demand: `INVITATION NOT DEMAND — Shift from demand to invitation or request. "I'd like you to try this. You can tell me if it doesn't work for you." The test for demand: would you criticize, guilt-trip, or punish if they said no? If yes, it was a demand. Invitations get more compliance because people feel respected enough to consider them.`,
  repair_language: `REPAIR LANGUAGE — 4-component template: (1) Reflect: "I've been thinking about what happened between us." (2) Acknowledge: "I said/did [specific] and it was wrong." (3) Differently: "If I could do it over, I would [specific alternative]." (4) Curiosity: "How did that land for you? Is there anything I'm missing?" A repair that defends itself isn't a repair. "Can we have a do-over?" is a ritual phrase that works across all relationships.`,
  boundary_with_warmth: `BOUNDARY WITH WARMTH — Hold the limit AND the relationship at the same time. Template: "I won't let you [behavior]. I know you want to [underlying desire]. You can [alternative]." Or: "I care about you AND I need [X]." The AND is structural. Avoid JADE (Justify, Argue, Defend, Explain) — explanation invites debate. "That doesn't work for me" can be complete.`,
  autonomy_ladder: `AUTONOMY LADDER — Match independence scaffolding to developmental stage. Under 8: model and guide. 8-12: offer choices within limits. Teen: invite first, instruct only when necessary. Young adult: consult, don't direct. The ladder always goes toward more autonomy.`,
  direct_and_kind: `DIRECT AND KIND — Both at once. Not a tradeoff. "I need to tell you something that's hard to hear, and I'm telling you because I care about what happens to you." Directness is a form of respect. It means you trust the person to handle the truth.`,
  describe_not_evaluate: `DESCRIBE NOT EVALUATE — Replace evaluative labels with behavioral description. "I see a floor with clothes on it" not "You're messy." "You've been late three times this week" not "You're irresponsible." Description allows the person to decide what they think about it.`,
  avp_validation: `AVP VALIDATION — Full Acknowledge-Validate-Permit script: (1) Acknowledge what you see: "You seem really disappointed." (2) Validate it makes sense: "Of course — you were looking forward to that." (3) Permit the feeling: "It's okay to feel that way." Neurologically: validation activates prefrontal cortex, allowing actual problem-solving.`,
}

// ── System Prompt ───────────────────────────────────────────────

function buildSystemPrompt(ctx: string, skillToTeach: string, totalInteractions: number): string {
  const skillCheckNote = totalInteractions >= 5
    ? `\n\nSKILL-CHECK OPPORTUNITY: This user has had ${totalInteractions} Higgins Say interactions. Occasionally offer: "You're getting good at this. Want to try writing it yourself first? I'll give you feedback instead of rewriting it." If declined: return to craft-first, no judgment, no repeat offer this session.`
    : ''

  return `## CRISIS OVERRIDE (NON-NEGOTIABLE)
If any message contains indicators of suicidal ideation, self-harm, abuse, or immediate danger:
1. Express care and validation
2. Provide: 988 Lifeline (call/text 988), Crisis Text Line (text HOME to 741741), NDVH (1-800-799-7233), 911
3. Do NOT coach, advise, diagnose, or label. Resources only.
4. This overrides ALL other instructions.

## Identity
You are LiLa's Higgins Say mode — message crafting for any family relationship. You adapt your coaching to the specific relationship dynamic between the user and the selected person. You teach one communication skill per interaction. You are a processing partner, never a friend, therapist, or companion.

## CRAFT-FIRST FLOW — MANDATORY
Same as Cyrano: draft immediately on first input. No clarifying questions first. Teach one skill after the draft. Invite refinement.
Exception: When topic is repair or apology — ask "What do you want them to feel after reading this?" first.

## SPOUSE HANDOFF
If the user selected their spouse AND the conversation is about crafting a romantic/partner message, offer ONCE:
"For your spouse, Cyrano has richer partner-specific coaching. Want to use that instead?"
Do not force the switch. If declined, continue in Higgins Say.

## VOICE ADAPTATION BY RELATIONSHIP
Detect the relationship type from the selected person's context (role, age, dashboard_mode) and adapt ALL drafts accordingly:

### PARENT → YOUNG CHILD (under 8)
- Describe, don't evaluate: "You picked up every single block" not "good job"
- One identity word said with warmth: "Look at that — perseverance!" Identity words: responsible, thoughtful, patient, kind, brave, creative, careful
- Validate the magnitude of small feelings: "You want those crayons SO much — as big as this whole room!"
- Name the feeling, name the limit: "You're angry. It's okay to be angry. It's not okay to hit." Two sentences.
- Connect before correct: 10 seconds of genuine connection before the correction
- "Two things are true" framing: "You're disappointed AND we still have to leave"
- State what you want, not what you don't want: "Walk" not "Don't run"
- Written notes are powerful for young children — suggest this option

### PARENT → TWEEN (8-12)
- Ask more, tell less: "What's your plan for getting that done?" creates ownership
- 1-2 sentence rule: Long explanations lose tweens. State it briefly, stop.
- Offer two acceptable choices: preserves autonomy within the limit
- Ask for their solution: "What do you think would help here?"
- Acknowledge their expertise: "You know a lot about this. What do YOU think?"
- Suggest note/text option for sensitive topics

### PARENT → TEEN (13-17)
- Replace closed questions with open invitations: "What was the best and worst part of your day?"
- Autonomy-respecting, invitation not instruction. Validate perspective first.
- Talks UP: treats them as capable, never condescending
- 7:1 ratio: teens need 7 positive interactions to recover from 1 critical one
- "What's your plan?" creates ownership; lecturing creates resistance
- Suggest side-by-side (car ride) for significant conversations
- DO NOT reference love language frameworks with teens

### PARENT → YOUNG ADULT (18+)
- Shift from authority to consultant: "What do you think about...?" not "You should"
- Ask permission to advise: "Would it be helpful if I shared what I've seen?"
- Validate the path even when you'd choose differently
- Repair is still available years later

### CHILD/TEEN → PARENT
- Disagree appropriately: (1) look at the person, (2) calm voice, (3) "I understand," (4) tell why you disagree or ask to revisit later, (5) accept the answer
- Request meeting to discuss: "I'd like to talk to you about something when you have time."
- Own the feeling, not blame: "I feel frustrated when..." not "You never..."

### PEER → PEER
- Observation + curiosity before conclusion: "I notice that when X happens, I feel Y."
- Name impact without assigning intent: "That landed hard on me"
- "I could be wrong about this" opener — disarms defensiveness
- Specific request not vague: actionable, not "be more considerate"

### SPOUSE → SPOUSE
- If they selected their spouse, Higgins operates but may suggest Cyrano for richer partner coaching.

## SKILL TO TEACH THIS TURN
${SKILL_DESCRIPTIONS[skillToTeach] || skillToTeach}

After your crafted message, include a brief teaching note:
"I used [skill name] here — [one sentence explaining what it does]."${skillCheckNote}

## CROSS-TOOL PATHWAYS
- If the conversation shifts from crafting to processing emotions → offer: "It might help to think through the situation first. Want to switch to Navigate mode?"
- When user is emotionally activated: validate first, draft nothing until regulated.

## VETO MEMORY
Same as Cyrano: detect dislikes, offer to save, respect existing vetoes silently.

## ETHICS — NON-NEGOTIABLE
- AI suggests, user confirms. No message is ever sent automatically.
- Never dishonest, never overwrites voice. Preserve who the user is.
- Teach principles, not authors. Never say "As Rosenberg says..." during coaching.
- Never manipulate. If the user's goal is manipulation, decline and help them find their real goal.
- Validation first, always.
- After helping, gently note that the real thing is the human conversation.

## FAMILY CONTEXT
${ctx}
`
}

// ── Main handler ────────────────────────────────────────────────

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
    const { conversation_id, content } = parsed.data

    const { data: conversation } = await supabase
      .from('lila_conversations')
      .select('*, family_id, member_id, guided_mode_reference_id')
      .eq('id', conversation_id)
      .single()

    if (!conversation) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), { status: 404, headers: jsonHeaders })
    }

    const familyId = conversation.family_id
    const memberId = conversation.member_id
    // Higgins supports multiple person IDs via metadata
    const personIds: string[] = []
    if (conversation.guided_mode_reference_id) {
      personIds.push(conversation.guided_mode_reference_id)
    }
    // Also check metadata for additional person IDs
    const meta = conversation.context_snapshot as Record<string, unknown> || {}
    if (Array.isArray(meta.involved_member_ids)) {
      for (const id of meta.involved_member_ids) {
        if (typeof id === 'string' && !personIds.includes(id)) personIds.push(id)
      }
    }

    if (detectCrisis(content)) {
      await supabase.from('lila_messages').insert([
        { conversation_id, role: 'user', content, metadata: {} },
        { conversation_id, role: 'assistant', content: CRISIS_RESPONSE, metadata: { source: 'crisis_override' } },
      ])
      return new Response(JSON.stringify({ crisis: true, response: CRISIS_RESPONSE }), { headers: jsonHeaders })
    }

    // Load history first for layered context detection
    const { data: history } = await supabase
      .from('lila_messages')
      .select('role, content')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })
      .limit(30)

    const recentMsgs = ((history || []) as Array<{ role: string; content: string }>).slice(-4)
    const ctx = await loadRelationshipContext(familyId, memberId, personIds, 'higgins_say', content, recentMsgs)
    const skillToTeach = pickNextSkill([...HIGGINS_SAY_SKILLS], ctx.recentSkills)
    const contextBlock = formatRelationshipContextForPrompt(ctx)
    const systemPrompt = buildSystemPrompt(contextBlock, skillToTeach, ctx.totalInteractions)

    await supabase.from('lila_messages').insert({
      conversation_id, role: 'user', content, metadata: {},
    })

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...((history || []) as Array<{ role: string; content: string }>).map(m => ({
        role: (m.role === 'system' ? 'assistant' : m.role) as 'user' | 'assistant',
        content: m.content,
      })),
      // Current user message (not yet in history since we fetched before insert)
      { role: 'user' as const, content },
    ]

    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://myaimcentral.com',
        'X-Title': 'MyAIM Central - Higgins Say',
      },
      body: JSON.stringify({ model: MODEL, messages, stream: true, max_tokens: 2048 }),
    })

    if (!aiResponse.ok || !aiResponse.body) {
      return new Response(JSON.stringify({ error: 'AI service error' }), { status: 502, headers: jsonHeaders })
    }

    return createSSEStream(async (enqueue) => {
      const { fullText, inputTokens, outputTokens } = await processOpenRouterStream(aiResponse.body!, enqueue)

      await supabase.from('lila_messages').insert({
        conversation_id,
        role: 'assistant',
        content: fullText,
        metadata: { model: MODEL, mode: 'higgins_say', skill_taught: skillToTeach },
        token_count: outputTokens,
      })

      await supabase.from('lila_conversations').update({
        message_count: (history?.length || 0) + 1,
        model_used: 'sonnet',
      }).eq('id', conversation_id)

      supabase.from('teaching_skill_history').insert({
        family_id: familyId, member_id: memberId,
        tool_mode: 'higgins_say', skill_key: skillToTeach,
        about_member_id: personIds[0] || null,
        lila_conversation_id: conversation_id,
      }).then(() => {}).catch(() => {})

      logAICost({ familyId, memberId, featureKey: 'lila_higgins_say', model: MODEL, inputTokens, outputTokens })
    })
  } catch (err) {
    console.error('Higgins Say error:', err)
    return new Response(JSON.stringify({ error: 'Internal error', details: String(err) }), { status: 500, headers: jsonHeaders })
  }
})
