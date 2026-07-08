/**
 * auto-title-thread — PRD-15 Phase E
 *
 * Haiku model, non-streaming. Called after a thread receives its first reply.
 * Generates a concise 3-6 word title from the opening messages.
 * Only fires if title IS NULL (user hasn't manually set one).
 */

import { handleCors, jsonHeaders } from '../_shared/cors.ts'
import { authenticateRequest } from '../_shared/auth.ts'
import { detectCrisis } from '../_shared/crisis-detection.ts'
import { logAICost } from '../_shared/cost-logger.ts'
import { callOpenRouter } from '../_shared/openrouter-client.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { scanUtilityInput, scanUtilityOutput, enqueueOutputScan } from '../_shared/ethics-guard.ts'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!

const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const MODEL = 'anthropic/claude-haiku-4-5-20251001'

Deno.serve(async (req: Request) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    // ── Auth ──
    const authResult = await authenticateRequest(req)
    if (authResult instanceof Response) return authResult
    const { user } = authResult

    // ── Input ──
    const { thread_id } = await req.json() as { thread_id: string }

    if (!thread_id) {
      return new Response(JSON.stringify({ error: 'thread_id required' }), {
        status: 400,
        headers: jsonHeaders,
      })
    }

    // ── Resolve family member ──
    const { data: member } = await serviceClient
      .from('family_members')
      .select('id, family_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .limit(1)
      .single()

    if (!member) {
      return new Response(JSON.stringify({ error: 'No family member found' }), {
        status: 403,
        headers: jsonHeaders,
      })
    }

    // ── Check thread title is still NULL ──
    const { data: thread } = await serviceClient
      .from('conversation_threads')
      .select('id, title')
      .eq('id', thread_id)
      .single()

    if (!thread) {
      return new Response(JSON.stringify({ error: 'Thread not found' }), {
        status: 404,
        headers: jsonHeaders,
      })
    }

    if (thread.title) {
      // Already has a title — skip
      return new Response(JSON.stringify({ title: thread.title, skipped: true }), {
        headers: jsonHeaders,
      })
    }

    // ── Load first messages ──
    const { data: messages } = await serviceClient
      .from('messages')
      .select('content, message_type')
      .eq('thread_id', thread_id)
      .order('created_at', { ascending: true })
      .limit(4)

    if (!messages || messages.length < 2) {
      return new Response(JSON.stringify({ title: null, skipped: true }), {
        headers: jsonHeaders,
      })
    }

    const messageText = messages
      .filter(m => m.message_type === 'user')
      .map(m => m.content)
      .join('\n---\n')
      .slice(0, 500)

    // Convention #7 — crisis override is global (SCOPE-8b.F5). Titles are
    // generated from unscreened message content today; never feed crisis
    // content to the model, and never persist a title derived from it —
    // leave title NULL so a future non-crisis reply can still title the
    // thread normally.
    if (detectCrisis(messageText)) {
      return new Response(JSON.stringify({ title: null, crisis: true, skipped: true }), {
        headers: jsonHeaders,
      })
    }

    // PRD-41 Tier-0 ethics input pre-flight — never derive a title from
    // ethics-shaped content; leave title NULL (same posture as crisis) so a
    // future non-violating reply can still title the thread normally.
    const titleInBlock = await scanUtilityInput(serviceClient, messageText, { familyId: member.family_id, memberId: member.id, surface: 'auto-title-thread' })
    if (titleInBlock) {
      return new Response(JSON.stringify({ title: null, ethics_declined: true, skipped: true }), { headers: jsonHeaders })
    }

    // ── Call Haiku ──
    const response = await callOpenRouter(OPENROUTER_API_KEY, {
      model: MODEL,
      max_tokens: 30,
      messages: [
        {
          role: 'system',
          content:
            'Generate a concise conversation title (3 to 6 words). Output ONLY the title, no quotes, no punctuation at the end, no explanation.',
        },
        {
          role: 'user',
          content: `Conversation messages:\n\n${messageText}`,
        },
      ],
    })

    if (!response.ok) {
      console.error('[auto-title-thread] OpenRouter error:', response.status)
      return new Response(JSON.stringify({ title: null, error: 'AI call failed' }), {
        headers: jsonHeaders,
      })
    }

    const result = await response.json()
    let title = result.choices?.[0]?.message?.content?.trim()?.slice(0, 100) || null

    // PRD-41 Tier-0 output scan on the generated title. On a hit, keep the
    // title NULL (matches the crisis posture) + log; enqueue always.
    if (title) {
      const outScan = await scanUtilityOutput(serviceClient, title, { familyId: member.family_id, memberId: member.id, surface: 'auto-title-thread' })
      await enqueueOutputScan(serviceClient, { familyId: member.family_id, memberId: member.id, surface: 'auto-title-thread', content: title })
      if (outScan.replaced) title = null
    }

    // ── Save title ──
    if (title) {
      await serviceClient
        .from('conversation_threads')
        .update({ title })
        .eq('id', thread_id)
        .is('title', null) // Only update if still null (race protection)
    }

    // ── Cost logging ──
    const usage = result.usage || {}
    logAICost({
      familyId: member.family_id,
      memberId: member.id,
      featureKey: 'messaging_lila',
      model: MODEL,
      inputTokens: usage.prompt_tokens || 0,
      outputTokens: usage.completion_tokens || 0,
    })

    return new Response(JSON.stringify({ title, skipped: false }), {
      headers: jsonHeaders,
    })
  } catch (err) {
    console.error('[auto-title-thread] Error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: jsonHeaders,
    })
  }
})
