/**
 * message-coach — PRD-15 Phase E
 *
 * Haiku model, non-streaming. Before-send coaching analysis.
 * Loads sender/recipient profiles, conversation history, Family Communication
 * Guidelines, and custom coaching prompt. Returns coaching note.
 *
 * Adapts tone by relationship dynamic:
 *   - Guided kids → structured teaching tone ("Are your words kind?")
 *   - Teens → reflective peer tone
 *   - Adults → lightest touch
 *
 * Client enforces 3-second timeout — if this takes longer, message sends
 * without coaching. Coaching is never a blocker.
 */

import { handleCors, jsonHeaders } from '../_shared/cors.ts'
import { authenticateRequest } from '../_shared/auth.ts'
import { detectCrisis, CRISIS_RESPONSE } from '../_shared/crisis-detection.ts'
import { flagCrisisEvent } from '../_shared/crisis-flag.ts'
import { logAICost } from '../_shared/cost-logger.ts'
import { callOpenRouter } from '../_shared/openrouter-client.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { scanUtilityInput, scanUtilityOutput, enqueueOutputScan } from '../_shared/ethics-guard.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!

const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// NOTE (found live via SM-C, 2026-07-08 — same file already being touched
// for D5 wiring, so fixed alongside it): 'anthropic/claude-haiku-4-5-20251001'
// is NOT a valid OpenRouter model ID (confirmed via a live 400: "...is not
// a valid model ID"). Every real coaching-note generation call in this file
// has been silently failing since deploy. The correct, proven-working id —
// used successfully by mindsweep-sort/-scan, calendar-extract,
// safety-classify/safety-weekly-digest/validate-ai-output (all fixed in
// this same session), bookshelf-extract/-process, wishlist-extract — is
// 'anthropic/claude-haiku-4.5'.
const MODEL = 'anthropic/claude-haiku-4.5'

interface CoachRequest {
  thread_id: string
  message_content: string
}

interface MemberProfile {
  id: string
  display_name: string
  role: string
  age: number | null
  relationship: string | null
}

function getRoleTone(senderRole: string, recipientRole: string, senderAge: number | null): string {
  // Guided kids: structured teaching tone
  if (senderRole === 'member' && senderAge !== null && senderAge < 13) {
    return `The sender is a young child (around ${senderAge}). Use a warm, structured teaching tone.
Guide them to think about whether their words are helpful, healing, or hurtful.
Keep coaching simple, concrete, and encouraging. One short sentence is ideal.`
  }

  // Teens: reflective peer tone
  if (senderRole === 'member' && senderAge !== null && senderAge >= 13 && senderAge < 18) {
    return `The sender is a teenager (around ${senderAge}). Use a respectful, reflective tone.
Don't lecture — help them consider how their tone might be received.
Brief and mature. One sentence.`
  }

  // Adult to child: consider power dynamic
  if (
    (senderRole === 'primary_parent' || senderRole === 'additional_adult') &&
    recipientRole === 'member'
  ) {
    return `The sender is a parent writing to their child. Lightest possible touch.
Only flag if the message might come across as harsh, dismissive, or could shut down communication.
Most parent messages need no coaching at all.`
  }

  // Adult to adult: minimal
  return `Both sender and recipient are adults. Minimal coaching.
Only flag genuinely concerning tone — passive aggression, dismissiveness, or escalation.
Most adult messages need no coaching.`
}

Deno.serve(async (req: Request) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    // ── Auth ──
    const authResult = await authenticateRequest(req)
    if (authResult instanceof Response) return authResult
    const { user } = authResult

    // ── Input ──
    const { thread_id, message_content } = (await req.json()) as CoachRequest

    if (!thread_id || !message_content) {
      return new Response(
        JSON.stringify({ error: 'thread_id and message_content required' }),
        { status: 400, headers: jsonHeaders },
      )
    }

    // Convention #7 — crisis override is global (SCOPE-8b.F5). A message
    // draft is user free text same as any LiLa conversation turn; a kid or
    // family member typing crisis content before send must see resources.
    // shouldCoach MUST be true here — the client's checkCoaching short-circuits
    // straight to send whenever isClean || !shouldCoach (ChatThreadView.tsx),
    // so a crisis hit has to ride the existing checkpoint surface to be seen
    // at all. Skip the model entirely. This check — and the response it
    // returns — must NEVER depend on a DB lookup succeeding: the crisis
    // response is unconditional, full stop (restored to running before
    // sender resolution after a regression was caught by the safety-beta-
    // gate regression pin's own documented invariant).
    if (detectCrisis(message_content)) {
      // PRD-30 D5 — this surface never persists to a table the safety-classify
      // sweep can see; without this, a crisis hit here never reached mom.
      // Best-effort ONLY: an independent, separately-wrapped sender lookup
      // that can never delay or block the crisis response above it — if it
      // fails for any reason, the member still sees resources immediately,
      // just without a parent-facing flag this one time.
      try {
        const { data: senderForFlag } = await serviceClient
          .from('family_members')
          .select('id, family_id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .limit(1)
          .single()
        if (senderForFlag) {
          await flagCrisisEvent(serviceClient, {
            familyId: senderForFlag.family_id,
            memberId: senderForFlag.id,
            surface: 'message-coach',
            content: message_content,
          })
        }
      } catch (err) {
        console.error('message-coach: D5 sender lookup for flagCrisisEvent failed (crisis response unaffected):', (err as Error).message)
      }
      return new Response(
        JSON.stringify({ crisis: true, shouldCoach: true, coachingNote: CRISIS_RESPONSE, isClean: false }),
        { headers: jsonHeaders },
      )
    }

    // ── Resolve sender ──
    const { data: sender } = await serviceClient
      .from('family_members')
      .select('id, family_id, display_name, role, age, relationship')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (!sender) {
      return new Response(JSON.stringify({ error: 'No family member found' }), {
        status: 403,
        headers: jsonHeaders,
      })
    }

    // PRD-41 Tier-0 ethics input pre-flight on the DRAFT. This is the ideal
    // surface for it — a member about to send a message shaped by one of the
    // five patterns gets a gentle before-send coaching note (never a blocker,
    // Convention #139). Runs REGARDLESS of the coaching toggle: ethics
    // enforcement has no off switch (unlike coaching, which is mom's
    // preference). The response MUST keep shouldCoach:true / isClean:false so
    // the client renders the checkpoint (documented SAFETY-BETA-GATE lesson).
    const draftEthics = await scanUtilityInput(serviceClient, message_content, { familyId: sender.family_id, memberId: sender.id, surface: 'message-coach' })
    if (draftEthics) {
      return new Response(
        JSON.stringify({ shouldCoach: true, coachingNote: draftEthics.reframe, isClean: false }),
        { headers: jsonHeaders },
      )
    }

    // ── Load coaching settings ──
    const { data: coachingSettings } = await serviceClient
      .from('message_coaching_settings')
      .select('is_enabled, custom_prompt')
      .eq('family_member_id', sender.id)
      .limit(1)
      .single()

    if (!coachingSettings?.is_enabled) {
      return new Response(
        JSON.stringify({ shouldCoach: false, coachingNote: '', isClean: true }),
        { headers: jsonHeaders },
      )
    }

    // ── Load thread participants (recipients) ──
    const { data: threadRow } = await serviceClient
      .from('conversation_threads')
      .select('space_id')
      .eq('id', thread_id)
      .single()

    if (!threadRow) {
      return new Response(
        JSON.stringify({ shouldCoach: false, coachingNote: '', isClean: true }),
        { headers: jsonHeaders },
      )
    }

    const { data: spaceMembers } = await serviceClient
      .from('conversation_space_members')
      .select('family_member_id')
      .eq('space_id', threadRow.space_id)

    const recipientIds = (spaceMembers ?? [])
      .map(m => m.family_member_id)
      .filter(id => id !== sender.id)

    // Load recipient profiles
    let recipients: MemberProfile[] = []
    if (recipientIds.length > 0) {
      const { data: recipientData } = await serviceClient
        .from('family_members')
        .select('id, display_name, role, age, relationship')
        .in('id', recipientIds)

      recipients = (recipientData ?? []) as MemberProfile[]
    }

    const primaryRecipient = recipients[0] || {
      role: 'primary_parent',
      display_name: 'family member',
      age: null,
    }

    // ── Load conversation history (last 6 messages) ──
    const { data: recentMessages } = await serviceClient
      .from('messages')
      .select('content, sender_member_id, message_type')
      .eq('thread_id', thread_id)
      .order('created_at', { ascending: false })
      .limit(6)

    const historyText = (recentMessages ?? [])
      .reverse()
      .filter(m => m.message_type === 'user')
      .map(m => {
        const isMe = m.sender_member_id === sender.id
        return `${isMe ? 'Sender' : 'Recipient'}: ${m.content}`
      })
      .join('\n')

    // ── Load Family Communication Guidelines ──
    const { data: settings } = await serviceClient
      .from('messaging_settings')
      .select('communication_guidelines')
      .eq('family_id', sender.family_id)
      .limit(1)
      .single()

    const guidelines = settings?.communication_guidelines || ''
    const customPrompt = coachingSettings.custom_prompt || ''

    // ── Build system prompt ──
    const roleTone = getRoleTone(
      sender.role,
      primaryRecipient.role,
      sender.age,
    )

    const recipientDesc = recipients
      .map(r => `${r.display_name} (${r.role}, age ${r.age ?? 'unknown'})`)
      .join(', ')

    const systemPrompt = `You are a gentle communication coach for a family messaging platform.
Analyze the message a family member is about to send and provide brief coaching if needed.

${roleTone}

Sender: ${sender.display_name} (${sender.role}, age ${sender.age ?? 'adult'})
Recipient(s): ${recipientDesc || 'family member'}

${guidelines ? `Family Communication Guidelines:\n${guidelines}\n` : ''}${customPrompt ? `Mom's coaching note for this member:\n${customPrompt}\n` : ''}
${historyText ? `Recent conversation:\n${historyText}\n` : ''}
RULES:
- If the message is fine, respond with exactly: CLEAN
- If you have a concern, respond with a single short coaching sentence (max 20 words).
- Never block the message. Never lecture. Never be judgmental.
- Focus on tone and impact, not grammar or spelling.
- Consider the full conversation context, not just this one message.`

    // ── Call Haiku ──
    const response = await callOpenRouter(OPENROUTER_API_KEY, {
      model: MODEL,
      max_tokens: 60,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Message about to be sent:\n\n${message_content}` },
      ],
    })

    if (!response.ok) {
      console.error('[message-coach] OpenRouter error:', response.status)
      return new Response(
        JSON.stringify({ shouldCoach: false, coachingNote: '', isClean: true }),
        { headers: jsonHeaders },
      )
    }

    const result = await response.json()
    let aiOutput = result.choices?.[0]?.message?.content?.trim() || 'CLEAN'

    // PRD-41 Tier-0 output scan on the coaching note itself — the coaching
    // must never model the five patterns. On a hit (enforcing) replace it
    // with a safe coaching note that KEEPS the shouldCoach:true/isClean:false
    // shape (client-render contract). Enqueue always.
    {
      const outScan = await scanUtilityOutput(serviceClient, aiOutput, { familyId: sender.family_id, memberId: sender.id, surface: 'message-coach' })
      await enqueueOutputScan(serviceClient, { familyId: sender.family_id, memberId: sender.id, surface: 'message-coach', content: aiOutput })
      if (outScan.replaced) {
        aiOutput = 'Before you send this, is there a kinder way to say what you really mean?'
      }
    }

    const isClean = aiOutput.toUpperCase() === 'CLEAN'

    // ── Cost logging ──
    const usage = result.usage || {}
    logAICost({
      familyId: sender.family_id,
      memberId: sender.id,
      featureKey: 'messaging_coaching',
      model: MODEL,
      inputTokens: usage.prompt_tokens || 0,
      outputTokens: usage.completion_tokens || 0,
    })

    return new Response(
      JSON.stringify({
        shouldCoach: !isClean,
        coachingNote: isClean ? '' : aiOutput,
        isClean,
      }),
      { headers: jsonHeaders },
    )
  } catch (err) {
    console.error('[message-coach] Error:', err)
    // On any error, don't block the message
    return new Response(
      JSON.stringify({ shouldCoach: false, coachingNote: '', isClean: true }),
      { headers: jsonHeaders },
    )
  }
})
