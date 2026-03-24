// MyAIM Central — Whisper Transcription Edge Function
// Accepts audio file, transcribes via OpenAI Whisper API, returns text.
// Used by Smart Notepad voice input, MindSweep, and other voice capture features.

const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY')!

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req: Request) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

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
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Validate file size (max 25MB per OpenAI limit)
    if (audioFile.size > 25 * 1024 * 1024) {
      return new Response(
        JSON.stringify({ error: 'Audio file too large. Maximum 25MB.' }),
        { status: 413, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    // Optional parameters
    const language = formData.get('language') as string | null
    const prompt = formData.get('prompt') as string | null

    // Build the request to OpenAI Whisper API
    const whisperForm = new FormData()
    whisperForm.append('file', audioFile, audioFile.name || 'recording.webm')
    whisperForm.append('model', 'whisper-1')
    whisperForm.append('response_format', 'json')

    if (language) whisperForm.append('language', language)
    if (prompt) whisperForm.append('prompt', prompt)

    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
      },
      body: whisperForm,
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Whisper API error:', response.status, errorText)
      return new Response(
        JSON.stringify({ error: `Whisper API error: ${response.status}`, details: errorText }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
      )
    }

    const result = await response.json()

    return new Response(
      JSON.stringify({
        text: result.text || '',
        duration: result.duration || null,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Whisper transcription error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Transcription failed' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  }
})
