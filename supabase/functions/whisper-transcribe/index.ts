// MyAIM Central — Whisper Transcription Edge Function
// Accepts audio file, transcribes via OpenAI Whisper API, returns text.
// Used by Smart Notepad voice input, MindSweep, and other voice capture features.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { handleCors, jsonHeaders } from '../_shared/cors.ts'
import { logAICost } from '../_shared/cost-logger.ts'
import { authenticateRequest } from '../_shared/auth.ts'

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

Deno.serve(async (req: Request) => {
  const cors = handleCors(req)
  if (cors) return cors

  // Auth gate — this endpoint was publicly invocable (verify_jwt=false + no
  // in-code check), letting anyone transcribe up to 25MB/call on the OpenAI
  // bill. The client already sends the user's Bearer token, so this is a
  // server-only hardening with no client change.
  const auth = await authenticateRequest(req)
  if (auth instanceof Response) return auth

  try {
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY not configured')
    }

    // Accept multipart form data with audio file
    const formData = await req.formData()
    const audioFile = formData.get('audio') as File | null

    if (!audioFile) {
      return new Response(
        JSON.stringify({ error: 'No audio file provided. Send as multipart form data with key "audio".' }),
        { status: 400, headers: jsonHeaders },
      )
    }

    // Validate file size (max 25MB per OpenAI limit)
    if (audioFile.size > 25 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'Audio file too large. Maximum 25MB.' }),
        { status: 413, headers: jsonHeaders },
      )
    }

    // Optional parameters
    const language = formData.get('language') as string | null
    const prompt = formData.get('prompt') as string | null

    // Resolve family/member for cost logging from the authenticated user.
    // The client never sent these, so `if (familyId && memberId)` was always
    // false and no Whisper usage was ever recorded (F7). Derive server-side.
    let familyId = formData.get('family_id') as string | null
    let memberId = formData.get('member_id') as string | null
    if (!familyId || !memberId) {
      try {
        const svc = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        const { data: fm } = await svc
          .from('family_members')
          .select('id, family_id')
          .eq('user_id', auth.user.id)
          .limit(1)
          .maybeSingle()
        if (fm) {
          familyId = familyId || fm.family_id
          memberId = memberId || fm.id
        }
      } catch (_e) {
        // Cost logging is best-effort — never block a transcription over it.
      }
    }

    // Build the request to OpenAI Whisper API
    const whisperForm = new FormData()
    whisperForm.append('file', audioFile, audioFile.name || 'recording.webm')
    whisperForm.append('model', 'whisper-1')
    whisperForm.append('response_format', 'json')

    if (language) whisperForm.append('language', language)
    if (prompt) whisperForm.append('prompt', prompt)

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${OPENAI_API_KEY}` },
      body: whisperForm,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Whisper API error:', response.status, errorText)
      return new Response(
        JSON.stringify({ error: `Whisper API error: ${response.status}`, details: errorText }),
        { status: 502, headers: jsonHeaders },
      )
    }

    const result = await response.json()

    // Log usage (fire-and-forget) — Whisper pricing is per-minute, tracked as placeholder
    if (familyId && memberId) {
      logAICost({
        familyId,
        memberId,
        featureKey: 'whisper_transcribe',
        model: 'whisper-1',
        inputTokens: 0,
        outputTokens: 0,
      })
    }

    return new Response(
      JSON.stringify({ text: result.text || '', duration: result.duration || null }),
      { headers: jsonHeaders },
    )
  } catch (err) {
    console.error('Whisper transcription error:', err)
    return new Response(
      JSON.stringify({ error: (err as Error).message || 'Transcription failed' }),
      { status: 500, headers: jsonHeaders },
    )
  }
})
