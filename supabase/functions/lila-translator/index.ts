// PRD-34: Translator — Single-turn text rewrite in 12+ tones
// Model: Haiku (NOT Sonnet). No conversation history. No context loading.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { z } from 'https://esm.sh/zod@3.23.8'
import { handleCors, jsonHeaders } from '../_shared/cors.ts'
import { authenticateRequest } from '../_shared/auth.ts'
import { detectCrisis, CRISIS_RESPONSE } from '../_shared/crisis-detection.ts'
import { buildSafetyPreamble } from '../_shared/safety-preamble.ts'
import { logAICost } from '../_shared/cost-logger.ts'
import { callOpenRouter } from '../_shared/openrouter-client.ts'
import {
  handleEthicsInputReframe, detectEthicsViolation, detectCrisisInOutput,
  logEthicsRejection, enqueueOutputScan, ENFORCEMENT_MODE,
} from '../_shared/ethics-guard.ts'

// Non-streaming replacement text when an ethics-violating rewrite is produced
// in enforcing mode. Mirrors translator's own content-safety refusal copy.
const TRANSLATOR_REPLACEMENT =
  "I can rewrite most things, but this content falls outside what I can work with. Try different source text."

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const MODEL = 'anthropic/claude-haiku-4.5'

const InputSchema = z.object({
  conversation_id: z.string().uuid(),
  content: z.string().min(1),
  tone: z.string().min(1),
})

function buildSystemPrompt(tone: string): string {
  return `${buildSafetyPreamble()}

You are LiLa in Translator mode. Single-turn text transformation only.
No conversation. No follow-up. Just the rewrite.

Commit fully to the requested tone. If it is pirate, go full pirate — do not hedge.
If it is "softer tone," preserve the full meaning while reducing sharpness.
If it is "explain to a 5-year-old," use concrete examples, short sentences, nothing abstract.
If it is "formal/business," professional language throughout.
If it is a custom tone the user has described, interpret it faithfully.

For fun tones (pirate, medieval, Shakespeare, southern, etc.): be entertaining.
Commit to the bit. This is supposed to delight.

Do not include emoji characters in the rewritten output. The fun comes from the
language, not from symbols. Text only.

Output the rewrite only. No preamble, no "Here is your translation:", no explanation.
Just the rewritten text.

CONTENT SAFETY: If the source text contains hate speech, threats, explicit sexual content,
or instructions for harm, respond with: "I can rewrite most things, but this content
falls outside what I can work with. Try different source text."

Requested tone: ${tone}`
}

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const auth = await authenticateRequest(req)
    if (auth instanceof Response) return auth

    const body = await req.json()
    const parsed = InputSchema.safeParse(body)
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: 'Missing params: conversation_id, content, tone' }), { status: 400, headers: jsonHeaders })
    }
    const { conversation_id, content, tone } = parsed.data

    const { data: conv } = await supabase
      .from('lila_conversations')
      .select('*')
      .eq('id', conversation_id)
      .single()
    if (!conv) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), { status: 404, headers: jsonHeaders })
    }

    // Crisis override (SCOPE-8a.F4 + Convention #7 — global, Translator is NOT
    // exempt). Must run BEFORE the AI fetch and BEFORE the user message save,
    // matching the lila-decision-guide pattern.
    if (detectCrisis(content)) {
      await supabase.from('lila_messages').insert([
        { conversation_id, role: 'user', content, metadata: { tone, mode: 'translator' } },
        { conversation_id, role: 'assistant', content: CRISIS_RESPONSE, metadata: { source: 'crisis_override', mode: 'translator' } },
      ])
      return new Response(
        JSON.stringify({ crisis: true, response: CRISIS_RESPONSE }),
        { headers: jsonHeaders },
      )
    }

    // PRD-41 Tier-0 ethics input pre-flight (after crisis; the model is never
    // called on a hit — the reframe replaces the rewrite request).
    const ethicsReframe = await handleEthicsInputReframe(supabase, content, {
      familyId: conv.family_id, memberId: conv.member_id, surface: 'lila-translator', modeKey: 'translator',
      conversationId: conversation_id, isSafeHarbor: conv.is_safe_harbor,
    })
    if (ethicsReframe) {
      return new Response(JSON.stringify({ ethics_reframe: true, category: ethicsReframe.category, response: ethicsReframe.response }), { headers: jsonHeaders })
    }

    // Save user message
    await supabase.from('lila_messages').insert({
      conversation_id,
      role: 'user',
      content,
      metadata: { tone, mode: 'translator' },
    })

    // Single-turn: just system + this message, no history
    const messages = [
      { role: 'system' as const, content: buildSystemPrompt(tone) },
      { role: 'user' as const, content },
    ]

    const aiRes = await callOpenRouter(
      OPENROUTER_API_KEY,
      { model: MODEL, messages, stream: false, max_tokens: 2048 },
      { title: 'MyAIM Central - Translator' },
    )

    if (!aiRes.ok) {
      return new Response(JSON.stringify({ error: 'AI service error' }), { status: 502, headers: jsonHeaders })
    }

    const aiJson = await aiRes.json()
    const rewrite = aiJson.choices?.[0]?.message?.content || ''
    const inTok = aiJson.usage?.prompt_tokens || 0
    const outTok = aiJson.usage?.completion_tokens || 0

    // PRD-41 Tier-0 output scan. Non-streaming surface → REPLACEMENT, never
    // retraction (PRD §Tier 0). In shadow mode (shipped) the rewrite is
    // persisted/returned unchanged and only the logged_only rejection row is
    // written; in enforcing mode the violating rewrite is replaced with a
    // safe refusal BEFORE it ever renders. enqueueOutputScan always runs on
    // the ORIGINAL model output (the audit/calibration corpus wants what was
    // generated, not the replacement).
    const outHit = detectEthicsViolation(rewrite, 'output')
    const outCrisis = !outHit.hit && detectCrisisInOutput(rewrite)
    const outCategory = outHit.hit ? outHit.category : outCrisis ? 'crisis_output' : null
    let finalRewrite = rewrite
    if (outCategory) {
      const enforcing = ENFORCEMENT_MODE === 'enforcing'
      await logEthicsRejection(supabase, {
        familyId: conv.family_id, memberId: conv.member_id, surface: 'lila-translator', modeKey: 'translator',
        conversationId: conversation_id, messageTable: 'lila_messages', isSafeHarbor: conv.is_safe_harbor,
        direction: 'output', tier: 0, category: outCategory, action: enforcing ? 'replaced' : 'logged_only',
        matchedPattern: outHit.hit ? outHit.matchedPattern : 'crisis_keyword', contentExcerpt: rewrite,
      })
      if (enforcing) finalRewrite = TRANSLATOR_REPLACEMENT
    }

    // Save assistant message (finalRewrite == rewrite in shadow mode)
    const { data: savedMsg } = await supabase.from('lila_messages').insert({
      conversation_id,
      role: 'assistant',
      content: finalRewrite,
      metadata: { tone, mode: 'translator', model: MODEL },
      token_count: outTok,
    }).select('id').single()

    await enqueueOutputScan(supabase, {
      familyId: conv.family_id, memberId: conv.member_id, surface: 'lila-translator', modeKey: 'translator',
      conversationId: conversation_id, messageTable: 'lila_messages', messageId: savedMsg?.id ?? null, content: rewrite,
      isSafeHarbor: conv.is_safe_harbor,
    })

    // Update conversation
    await supabase.from('lila_conversations')
      .update({ model_used: 'haiku', message_count: 2 })
      .eq('id', conversation_id)

    logAICost({
      familyId: conv.family_id,
      memberId: conv.member_id,
      featureKey: 'lila_translator',
      model: MODEL,
      inputTokens: inTok,
      outputTokens: outTok,
    })

    return new Response(JSON.stringify({ rewrite: finalRewrite, tone }), { headers: jsonHeaders })
  } catch (err) {
    console.error('Translator error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: jsonHeaders })
  }
})
