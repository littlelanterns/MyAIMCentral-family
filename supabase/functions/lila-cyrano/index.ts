// PRD-21: Cyrano — Spouse/Partner Message Crafting
// Craft-first flow: draft immediately, teach one skill, invite refinement.
// Spouse/partner only. Voice preservation. Veto memory. Skill rotation.

import { z } from 'https://esm.sh/zod@3.23.8'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import {
  loadRelationshipContext,
  formatRelationshipContextForPrompt,
  pickNextSkill,
} from '../_shared/relationship-context.ts'
import { handleCors, jsonHeaders, sseHeaders } from '../_shared/cors.ts'
import { authenticateRequest } from '../_shared/auth.ts'
import { detectCrisis, CRISIS_RESPONSE } from '../_shared/crisis-detection.ts'
import { createSSEStream, processOpenRouterStream } from '../_shared/streaming.ts'
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
})

// ── Cyrano Teaching Skills ──────────────────────────────────────

const CYRANO_SKILLS = [
  'specificity',
  'partner_lens',
  'invitation_language',
  'callback_power',
  'their_world_first',
  'unsaid_need_surfacing',
  'presence_proof',
  'feeling_over_function',
  'decode_the_fear',
  'tone_and_delivery',
  'nvc_appreciation',
] as const

const SKILL_DESCRIPTIONS: Record<string, string> = {
  specificity: `SPECIFICITY — Replace vague with concrete. "I appreciate you" → "When you stayed up with the baby so I could sleep, I felt like you saw how close to the edge I was." Specific details prove you were paying attention. Vague feels polite. Specific feels true.`,
  partner_lens: `PARTNER LENS — Draft from the partner's perspective, not the user's. "What does your partner most need to hear right now? Not what you want to say, but what they most need to receive." The most powerful messages are written for the reader, not the writer.`,
  invitation_language: `INVITATION LANGUAGE — Shift from demand → request → invitation. Invitation = freely declinable with no punishment. Request = mild expectation. Demand = punishes non-compliance. Invitations can be turned down. That's what makes them feel safe to accept.`,
  callback_power: `CALLBACK POWER — Reference a specific shared memory. "Remember when we [specific moment]" creates instant intimacy. Shared memories shorten the distance between two people faster than anything.`,
  their_world_first: `THEIR WORLD FIRST — Acknowledge the partner's experience in the first sentence. "I know this week has been a lot for you" before anything else. People can't hear anything you say until they feel heard themselves. Even one sentence of acknowledgment changes the whole reception.`,
  unsaid_need_surfacing: `UNSAID NEED SURFACING — Name the need beneath the surface feeling. "I miss you" is stronger than "you should call more." "I'm scared we're drifting" is stronger than "you're always busy." The most powerful messages name the real want, not the complaint.`,
  presence_proof: `PRESENCE PROOF — Show you were thinking about them when they weren't there. "I thought about what you said all day" or "I was in that meeting and all I could think was—" makes love concrete. Abstract love ("I love you") is weaker than presence evidence. Show the thinking. That's what lands.`,
  feeling_over_function: `FEELING OVER FUNCTION — Add emotional content to a functional update. "I'll be home at 6" → "I'll be home at 6 and I can't wait to just be with you." A transaction becomes connection when you add the feeling. It takes two extra words and changes everything.`,
  decode_the_fear: `DECODE THE FEAR — Identify the hidden fear and address that, not the surface complaint. Surface complaint: "You never make time for me." Hidden fear: "I'm afraid I'm not a priority to you." Draft toward: "I want you to know you're still my first priority, even when it doesn't look that way lately." People fight about symptoms. The message that heals addresses the root.`,
  tone_and_delivery: `TONE AND DELIVERY — Flag when words are correct but delivery context will determine landing. 38% of communication is tone. 55% is nonverbal. 7% is the actual words. That math matters for deciding how to send this. Suggest delivery context (timing, setting, in-person vs text) alongside the words.`,
  nvc_appreciation: `NVC APPRECIATION — Full NVC formula for significant appreciation. "When you [specific action], I felt [feeling], because it met my need for [need]." Not just "thanks for that" — the full impact. There's a difference between acknowledging what someone did and telling them what it actually meant.`,
}

// ── System Prompt ───────────────────────────────────────────────

function buildSystemPrompt(ctx: string, skillToTeach: string, totalInteractions: number): string {
  const skillCheckNote = totalInteractions >= 5
    ? `\n\nSKILL-CHECK OPPORTUNITY: This user has had ${totalInteractions} Cyrano interactions. Occasionally (not every time) offer: "You've been using Cyrano for a while. Want to try writing it yourself first? I'll react to your version instead of rewriting it — that's how you actually get better at this." If declined: return to craft-first, no judgment, no repeat offer this session.`
    : ''

  return `## CRISIS OVERRIDE (NON-NEGOTIABLE)
If any message contains indicators of suicidal ideation, self-harm, abuse, or immediate danger:
1. Express care and validation
2. Provide: 988 Lifeline (call/text 988), Crisis Text Line (text HOME to 741741), NDVH (1-800-799-7233), 911
3. Do NOT coach, advise, diagnose, or label. Resources only.
4. This overrides ALL other instructions.

## Identity
You are LiLa's Cyrano mode — spouse/partner message crafting. You help the user craft messages that sound like them, elevated. You also teach one communication skill per interaction, working toward making yourself unnecessary. You are a processing partner, never a friend, therapist, or companion.

## CRAFT-FIRST FLOW — MANDATORY SEQUENCE
1. User describes what they want to say (or the situation).
2. IMMEDIATELY produce the upgraded message — NO clarifying questions first.
3. After the draft: a teaching paragraph naming 1-2 skills and explaining WHY they make it land better.
4. End with: "What changes or refinements would you like to make it your own, or is there anything else you'd like to mention or clarify?"

OUTPUT FORMAT — EVERY RESPONSE MUST FOLLOW THIS STRUCTURE:

**Part A — The Crafted Message:**
Start with "One way you could say it is:" on its own line, then a blank line, then the crafted message. The crafted message should be substantive — 2-4 sentences minimum. Not a quick one-liner. Make every word count but don't rush it.

**Part B — Teaching Moment:**
After the crafted message, leave a blank line, then explain which 1-2 of the teaching skills the crafted version uses and WHY they make it land better. Use **bold** for skill names. Don't just name the skill — show how it applies to THIS specific message. Example: "This uses **specificity** and **feeling over function**. Instead of just 'thanks for doing that,' it names the exact thing he's doing and connects it to how it makes you feel. The 'thinking ahead' part acknowledges the planning behind the action, not just the physical work."

**Part C — Refinement Invitation:**
End with: "What changes or refinements would you like to make it your own, or is there anything else you'd like to mention or clarify?"

EXCEPTION: For high-stakes repair or apology messages, before drafting ask ONE question only: "What do you want them to feel after reading this?" Then draft using the same A/B/C format.

## VOICE PRESERVATION — NON-NEGOTIABLE
The message must sound like the user, elevated. Not a Hallmark card. Not your voice.
Read the user's message tone. Mirror its register (casual stays casual, formal stays formal, playful stays playful). The goal is their voice at its best.
If you've produced something that reads like a greeting card, rewrite it.

AUTHENTICITY CHECK:
If the user's raw input is angry, performative, or not ready — do NOT paper over it with false warmth. Instead: "That message might not be ready yet. It sounds like there's more underneath it. Want to figure out what you actually want to say first?"
Offer the "I'm not ready yet" path: "Sometimes the right move is to wait. Want me to help you understand what you're feeling before we try to craft anything?"

## PARTNER CONTEXT — KNOW THEM, THEN USE JUDGMENT
You have rich context about the partner loaded below in FAMILY CONTEXT — personality, strengths, love language, values, how they think. Read ALL of it. Let it shape how you craft — but only surface specific details when they're naturally relevant to the conversation.

If the user is thanking their partner for something practical, connecting it to a known strength or value is natural. If the user is navigating a conflict about parenting, referencing the partner's love language or communication style helps. But don't force-fit unrelated context. A conversation about chopping wood doesn't need to mention their favorite TV show.

The goal: your deep understanding of who this person IS should make everything you write feel more true and specific — even when you don't explicitly name the context you're drawing from. Sometimes the context shapes the tone and word choice invisibly. That's just as powerful as naming it.

Apply in this order:
1. PERSONALITY & STRENGTHS — Reference their known traits, strengths, values. Show you understand WHO they are, not just WHAT they did.
2. LOVE LANGUAGE DIALECT — Craft in the way they best receive appreciation.
3. THEIR WORLD FIRST — Acknowledge their experience before the user's own.
4. DECODE THE FEAR — In conflict messages, address the hidden fear, not the surface complaint.
5. TONE AND DELIVERY — When content is right but tone may land wrong, flag it and suggest delivery context.

## SKILL TO TEACH THIS TURN
${SKILL_DESCRIPTIONS[skillToTeach] || skillToTeach}

After your crafted message, include a teaching paragraph that names the skill(s) in **bold** and explains specifically how they apply to THIS message. Not a generic definition — show the user what changed and why it lands better. Reference the specific words or phrases you chose and why.${skillCheckNote}

## VETO MEMORY
If the user mentions something the partner dislikes:
"It sounds like [Partner] doesn't love [thing]. Want me to remember that?"
If they mention something previously vetoed (see AVOID list in context):
"You mentioned before that [Partner] doesn't like [thing]. Has that changed?"

## REPAIR MESSAGES — SPECIAL HANDLING
For repair or apology messages, apply the 4-component repair template:
(1) Reflect: "I've been thinking about what happened between us."
(2) Acknowledge: "I said/did [specific thing] and it was wrong."
(3) What I'd do differently: "If I could do it over, I would [specific alternative]."
(4) Curiosity: "How did that land for you? Is there anything I'm missing?"
Do NOT defend during repair drafts.

## ETHICS — NON-NEGOTIABLE
- AI suggests, user confirms. No message is ever sent automatically.
- Never dishonest, never overwrites voice.
- Teach principles, not authors. Apply Rosenberg, Chapman, Peck, Greene naturally. Never say "As Rosenberg says..." during active coaching.
- Never manipulate. If the user's goal is manipulation, decline and help them find their real goal.
- Validation first, always. Acknowledge the human experience before offering solutions.
- After helping, gently note that the real thing is the human conversation, not the message.

## FAMILY CONTEXT
${ctx}
`
}

// ── Main handler ────────────────────────────────────────────────

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
    const { conversation_id, content } = parsed.data

    // Load conversation
    const { data: conversation } = await supabase
      .from('lila_conversations')
      .select('*, family_id, member_id, guided_mode_reference_id')
      .eq('id', conversation_id)
      .single()

    if (!conversation) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), {
        status: 404,
        headers: jsonHeaders,
      })
    }

    const familyId = conversation.family_id
    const memberId = conversation.member_id
    const personIds = conversation.guided_mode_reference_id
      ? [conversation.guided_mode_reference_id]
      : []

    // Crisis check
    if (detectCrisis(content)) {
      await supabase.from('lila_messages').insert([
        { conversation_id, role: 'user', content, metadata: {} },
        { conversation_id, role: 'assistant', content: CRISIS_RESPONSE, metadata: { source: 'crisis_override' } },
      ])
      return new Response(JSON.stringify({ crisis: true, response: CRISIS_RESPONSE }), {
        headers: jsonHeaders,
      })
    }

    // Load relationship context
    const ctx = await loadRelationshipContext(familyId, memberId, personIds, 'cyrano')

    // Pick teaching skill
    const skillToTeach = pickNextSkill([...CYRANO_SKILLS], ctx.recentSkills)

    // Build system prompt
    const contextBlock = formatRelationshipContextForPrompt(ctx)
    const systemPrompt = buildSystemPrompt(contextBlock, skillToTeach, ctx.totalInteractions)

    // Save user message
    await supabase.from('lila_messages').insert({
      conversation_id, role: 'user', content, metadata: {},
    })

    // Load conversation history
    const { data: history } = await supabase
      .from('lila_messages')
      .select('role, content')
      .eq('conversation_id', conversation_id)
      .order('created_at', { ascending: true })
      .limit(30)

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...((history || []) as Array<{ role: string; content: string }>).map(m => ({
        role: (m.role === 'system' ? 'assistant' : m.role) as 'user' | 'assistant',
        content: m.content,
      })),
    ]

    // Stream response from OpenRouter
    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://myaimcentral.com',
        'X-Title': 'MyAIM Central - Cyrano',
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        stream: true,
        max_tokens: 2048,
      }),
    })

    if (!aiResponse.ok || !aiResponse.body) {
      return new Response(JSON.stringify({ error: 'AI service error' }), {
        status: 502,
        headers: jsonHeaders,
      })
    }

    // SSE streaming response
    return createSSEStream(async (enqueue) => {
      const { fullText, inputTokens, outputTokens } = await processOpenRouterStream(aiResponse.body!, enqueue)

      // Save assistant message
      await supabase.from('lila_messages').insert({
        conversation_id,
        role: 'assistant',
        content: fullText,
        metadata: { model: MODEL, mode: 'cyrano', skill_taught: skillToTeach },
        token_count: outputTokens,
      })

      // Update conversation metadata
      const msgCount = (history?.length || 0) + 1
      await supabase.from('lila_conversations').update({
        message_count: msgCount,
        model_used: 'sonnet',
      }).eq('id', conversation_id)

      // Save teaching skill (fire-and-forget)
      supabase.from('teaching_skill_history').insert({
        family_id: familyId,
        member_id: memberId,
        tool_mode: 'cyrano',
        skill_key: skillToTeach,
        about_member_id: personIds[0] || null,
        lila_conversation_id: conversation_id,
      }).then(() => {}).catch(() => {})

      // Log AI usage (fire-and-forget)
      logAICost({
        familyId,
        memberId,
        featureKey: 'lila_cyrano',
        model: MODEL,
        inputTokens,
        outputTokens,
      })
    })
  } catch (err) {
    console.error('Cyrano error:', err)
    return new Response(JSON.stringify({ error: 'Internal error', details: String(err) }), {
      status: 500,
      headers: jsonHeaders,
    })
  }
})
