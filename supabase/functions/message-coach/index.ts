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
import { logAICost } from '../_shared/cost-logger.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!

const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const MODEL = 'anthropic/claude-haiku-4-5-20251001'

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
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 60,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Message about to be sent:\n\n${message_content}` },
        ],
      }),
    })

    if (!response.ok) {
      console.error('[message-coach] OpenRouter error:', response.status)
      return new Response(
        JSON.stringify({ shouldCoach: false, coachingNote: '', isClean: true }),
        { headers: jsonHeaders },
      )
    }

    const result = await response.json()
    const aiOutput = result.choices?.[0]?.message?.content?.trim() || 'CLEAN'

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
