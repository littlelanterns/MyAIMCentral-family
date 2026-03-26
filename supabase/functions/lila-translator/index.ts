// PRD-34: Translator — Single-turn text rewrite in 12+ tones
// Model: Haiku (NOT Sonnet). No conversation history. No context loading.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const MODEL = 'anthropic/claude-haiku-4-5-20251001'

function buildSystemPrompt(tone: string): string {
  return `You are LiLa in Translator mode. Single-turn text transformation only.
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

    const { conversation_id, content, tone } = await req.json()
    if (!conversation_id || !content || !tone) {
      return new Response(JSON.stringify({ error: 'Missing params: conversation_id, content, tone' }), { status: 400 })
    }

    const { data: conv } = await supabase
      .from('lila_conversations')
      .select('*')
      .eq('id', conversation_id)
      .single()
    if (!conv) {
      return new Response(JSON.stringify({ error: 'Conversation not found' }), { status: 404 })
    }

    // Save user message
    await supabase.from('lila_messages').insert({
      conversation_id,
      role: 'user',
      content,
      metadata: { tone, mode: 'translator' },
    })

    const systemPrompt = buildSystemPrompt(tone)

    // Single-turn: just system + this message, no history
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      { role: 'user' as const, content },
    ]

    const aiRes = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://myaimcentral.com',
        'X-Title': 'MyAIM Central - Translator',
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        stream: false,
        max_tokens: 2048,
      }),
    })

    if (!aiRes.ok) {
      return new Response(JSON.stringify({ error: 'AI service error' }), { status: 502 })
    }

    const aiJson = await aiRes.json()
    const rewrite = aiJson.choices?.[0]?.message?.content || ''
    const inTok = aiJson.usage?.prompt_tokens || 0
    const outTok = aiJson.usage?.completion_tokens || 0

    // Save assistant message
    await supabase.from('lila_messages').insert({
      conversation_id,
      role: 'assistant',
      content: rewrite,
      metadata: { tone, mode: 'translator', model: MODEL },
      token_count: outTok,
    })

    // Update conversation
    await supabase.from('lila_conversations')
      .update({ model_used: 'haiku', message_count: 2 })
      .eq('id', conversation_id)

    // Log usage (fire-and-forget)
    supabase.from('ai_usage_tracking').insert({
      family_id: conv.family_id,
      member_id: conv.member_id,
      feature_key: 'lila_translator',
      model: MODEL,
      tokens_used: inTok + outTok,
      estimated_cost: (inTok * 0.8 + outTok * 4.0) / 1_000_000,
    }).catch(() => {})

    return new Response(JSON.stringify({ rewrite, tone }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (err) {
    console.error('Translator error:', err)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})
