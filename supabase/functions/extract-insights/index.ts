/**
 * extract-insights Edge Function
 *
 * Downloads a file from Supabase Storage, extracts text,
 * calls Claude Sonnet via OpenRouter to extract categorized insights,
 * returns structured JSON for the review screen.
 *
 * Adapted from StewardShip's extract-insights pipeline.
 */

import { serve } from 'https://deno.land/std@0.208.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Assessment keywords that trigger extended content limits
const ASSESSMENT_KEYWORDS = [
  'enneagram', 'mbti', 'myers-briggs', 'strengthsfinder', 'cliftonstrengths',
  'disc', 'kolbe', 'big five', 'ocean', 'love language', 'attachment style',
  'gallup', 'personality type', 'type indicator', 'assessment results',
]

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  try {
    const { file_storage_path, file_type, extraction_target } = await req.json()

    if (!file_storage_path) {
      return new Response(
        JSON.stringify({ error: 'file_storage_path is required' }),
        { status: 400, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Step 1: Download file from storage
    const { data: fileData, error: downloadError } = await supabase.storage
      .from('manifest-files')
      .download(file_storage_path)

    if (downloadError || !fileData) {
      return new Response(
        JSON.stringify({ error: 'Failed to download file', details: downloadError?.message }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Step 2: Extract text based on file type
    let extractedText = ''
    const extension = file_storage_path.split('.').pop()?.toLowerCase() ?? ''
    const mimeType = file_type?.toLowerCase() ?? ''

    if (['txt', 'md'].includes(extension) || mimeType.startsWith('text/')) {
      // Plain text — read directly
      extractedText = await fileData.text()
    } else if (extension === 'pdf' || mimeType === 'application/pdf') {
      // PDF — extract text, fallback to vision if too short
      extractedText = await fileData.text()
      // If PDF text extraction yields very little, it's likely scanned
      if (extractedText.length < 100) {
        // Convert to base64 for vision
        const bytes = await fileData.arrayBuffer()
        const base64 = btoa(String.fromCharCode(...new Uint8Array(bytes)))
        extractedText = await extractViaVision(base64, 'application/pdf')
      }
    } else if (['png', 'jpg', 'jpeg', 'webp'].includes(extension) || mimeType.startsWith('image/')) {
      // Images — go straight to vision
      const bytes = await fileData.arrayBuffer()
      const base64 = btoa(String.fromCharCode(...new Uint8Array(bytes)))
      extractedText = await extractViaVision(base64, mimeType || `image/${extension}`)
    } else if (extension === 'docx') {
      // DOCX — read as text (basic extraction)
      extractedText = await fileData.text()
    } else {
      // Unknown — try as text
      extractedText = await fileData.text()
    }

    if (!extractedText || extractedText.trim().length < 10) {
      return new Response(
        JSON.stringify({ insights: [], extracted_text_length: 0, error: 'Could not extract meaningful text from file' }),
        { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    // Step 3: Smart content limit based on assessment detection
    const preview = extractedText.slice(0, 2000).toLowerCase()
    const isAssessment = ASSESSMENT_KEYWORDS.some(kw => preview.includes(kw))
    const charLimit = isAssessment ? 48000 : 16000
    const truncatedText = extractedText.slice(0, charLimit)

    // Step 4: Build the extraction prompt based on target
    const systemPrompt = extraction_target === 'keel' || extraction_target === 'innerworkings'
      ? `You are analyzing a document about the user's personality, self-knowledge, or personal assessment results. Extract individual insights and categorize each one.

Return ONLY valid JSON — no markdown, no explanation.

Return a JSON array: [{ "text": "...", "category": "...", "confidence": 0.0-1.0, "source_label": "..." }]

Valid categories: personality, strengths, growth_areas, communication_style, how_i_work

- For personality assessments, extract EVERY distinct trait, tendency, strength, and growth area. Aim for 10-25 insights.
- Break complex descriptions into atomic insights (one trait/tendency per item).
- source_label identifies the source: "Enneagram Type 3", "MBTI ENFP", "StrengthsFinder", etc.
- Confidence: 0.9+ for directly stated results, 0.7-0.9 for derived insights, 0.5-0.7 for weak signals.`
      : `You are analyzing a document to extract key principles, values, and declarations.

Return ONLY valid JSON — no markdown, no explanation.

Return a JSON array: [{ "text": "...", "category": "...", "confidence": 0.0-1.0, "source_label": "..." }]

Valid categories: value, declaration, scripture, vision, priority, principle

- Extract meaningful statements that could serve as guiding principles.
- source_label identifies the document source.
- Confidence: 0.9+ for explicitly stated, 0.7-0.9 for implied, 0.5-0.7 for loosely related.`

    // Step 5: Call Claude Sonnet via OpenRouter
    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://myaimcentral.com',
        'X-Title': 'MyAIM Central - Extract Insights',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Here is the document content to analyze:\n\n${truncatedText}` },
        ],
        temperature: 0.3,
        max_tokens: 4096,
      }),
    })

    if (!aiResponse.ok) {
      const errText = await aiResponse.text()
      return new Response(
        JSON.stringify({ error: 'AI extraction failed', details: errText }),
        { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
      )
    }

    const aiData = await aiResponse.json()
    const rawContent = aiData.choices?.[0]?.message?.content ?? ''

    // Step 6: Parse the JSON response
    let insights: Array<{ text: string; category: string; confidence: number; source_label: string }> = []

    try {
      // Strip markdown fencing if present
      let cleaned = rawContent.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim()

      // Try to find a JSON array
      const arrayMatch = cleaned.match(/\[[\s\S]*\]/)
      if (arrayMatch) {
        insights = JSON.parse(arrayMatch[0])
      } else {
        // Try unwrapping { insights: [...] }
        const parsed = JSON.parse(cleaned)
        if (parsed.insights && Array.isArray(parsed.insights)) {
          insights = parsed.insights
        }
      }

      // Validate each item
      insights = insights.filter(i => i && typeof i.text === 'string' && i.text.trim().length > 0)
    } catch {
      // If JSON parsing fails, try line-splitting as fallback
      insights = rawContent
        .split('\n')
        .map((line: string) => line.replace(/^[-*•]\s*/, '').trim())
        .filter((line: string) => line.length > 10)
        .map((line: string) => ({
          text: line,
          category: 'personality',
          confidence: 0.6,
          source_label: 'AI extraction',
        }))
    }

    return new Response(
      JSON.stringify({
        insights,
        extracted_text_length: extractedText.length,
      }),
      { headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  } catch (err) {
    return new Response(
      JSON.stringify({ error: 'Internal error', details: String(err) }),
      { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Extract text from an image using Claude's vision capability
 */
async function extractViaVision(base64Data: string, mediaType: string): Promise<string> {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://myaimcentral.com',
      'X-Title': 'MyAIM Central - Vision Extract',
    },
    body: JSON.stringify({
      model: 'anthropic/claude-sonnet-4',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: `data:${mediaType};base64,${base64Data}` },
            },
            {
              type: 'text',
              text: 'Extract ALL text from this image. Include every detail, label, score, description, and result shown. Return the text as-is, preserving structure where possible.',
            },
          ],
        },
      ],
      temperature: 0.1,
      max_tokens: 4096,
    }),
  })

  if (!response.ok) return ''

  const data = await response.json()
  return data.choices?.[0]?.message?.content ?? ''
}
