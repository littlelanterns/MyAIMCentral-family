/**
 * mindsweep-scan Edge Function (PRD-17B)
 *
 * Two modes:
 * 1. `scan` — Accepts base64 image, extracts text via Haiku vision
 * 2. `link` — Fetches URL content, returns summarized text
 *
 * Neither mode stores the source material. Only extracted text is returned.
 */
import { handleCors, jsonHeaders } from '../_shared/cors.ts'
import { authenticateRequest } from '../_shared/auth.ts'
import { logAICost } from '../_shared/cost-logger.ts'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const HAIKU_MODEL = 'anthropic/claude-haiku-4.5'

Deno.serve(async (req) => {
  const cors = handleCors(req)
  if (cors) return cors

  try {
    const auth = await authenticateRequest(req)
    if (auth instanceof Response) return auth

    const body = await req.json()
    const mode = body.mode as string

    if (mode === 'scan') {
      return await handleScan(body)
    } else if (mode === 'link') {
      return await handleLink(body)
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid mode. Use "scan" or "link".' }),
        { status: 400, headers: jsonHeaders },
      )
    }
  } catch (err) {
    console.error('mindsweep-scan error:', err)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: jsonHeaders },
    )
  }
})

// ── Scan Mode: Image → Text via Haiku Vision ──

async function handleScan(body: {
  image_base64: string
  mime_type?: string
  family_id?: string
  member_id?: string
}): Promise<Response> {
  const { image_base64, mime_type, family_id, member_id } = body

  if (!image_base64) {
    return new Response(
      JSON.stringify({ error: 'image_base64 is required' }),
      { status: 400, headers: jsonHeaders },
    )
  }

  const mimeType = mime_type || 'image/jpeg'
  const dataUri = `data:${mimeType};base64,${image_base64}`

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://myaimcentral.com',
      'X-Title': 'MyAIM Central MindSweep',
    },
    body: JSON.stringify({
      model: HAIKU_MODEL,
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'Extract ALL readable text from this image. This may be a flyer, bulletin, calendar, permission slip, screenshot, or document. Preserve the structure: dates, times, locations, names, phone numbers, URLs, and any other details. Return only the extracted text, organized clearly. Do not add commentary.',
            },
            { type: 'image_url', image_url: { url: dataUri } },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    const errText = await response.text()
    console.error('Vision API error:', errText)
    return new Response(
      JSON.stringify({ error: 'Failed to extract text from image' }),
      { status: 502, headers: jsonHeaders },
    )
  }

  const data = await response.json()
  const extractedText = data.choices?.[0]?.message?.content || ''

  // Log cost
  const usage = data.usage || {}
  if (family_id && member_id) {
    logAICost({
      familyId: family_id,
      memberId: member_id,
      featureKey: 'mindsweep_scan',
      model: HAIKU_MODEL,
      inputTokens: usage.prompt_tokens || 0,
      outputTokens: usage.completion_tokens || 0,
    })
  }

  return new Response(
    JSON.stringify({ text: extractedText.trim() }),
    { headers: jsonHeaders },
  )
}

// ── Link Mode: URL → Summarized Text ──

async function handleLink(body: {
  url: string
  family_id?: string
  member_id?: string
}): Promise<Response> {
  const { url, family_id, member_id } = body

  if (!url) {
    return new Response(
      JSON.stringify({ error: 'url is required' }),
      { status: 400, headers: jsonHeaders },
    )
  }

  // Fetch the page content
  let pageText = ''
  try {
    const pageResponse = await fetch(url, {
      headers: {
        'User-Agent': 'MyAIM-MindSweep/1.0 (content extraction)',
        'Accept': 'text/html,application/xhtml+xml,text/plain',
      },
      redirect: 'follow',
    })

    if (!pageResponse.ok) {
      return new Response(
        JSON.stringify({ error: `Could not fetch URL (${pageResponse.status})` }),
        { status: 422, headers: jsonHeaders },
      )
    }

    const contentType = pageResponse.headers.get('content-type') || ''
    const rawText = await pageResponse.text()

    if (contentType.includes('text/html')) {
      // Strip HTML tags, scripts, styles — keep text content
      pageText = rawText
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&#\d+;/g, '')
        .replace(/\s+/g, ' ')
        .trim()
    } else {
      pageText = rawText.trim()
    }
  } catch (fetchErr) {
    console.error('URL fetch error:', fetchErr)
    return new Response(
      JSON.stringify({ error: 'Could not access the URL' }),
      { status: 422, headers: jsonHeaders },
    )
  }

  if (!pageText || pageText.length < 10) {
    return new Response(
      JSON.stringify({ text: `Link: ${url}\n(No readable content found)` }),
      { headers: jsonHeaders },
    )
  }

  // Truncate if very long, then summarize with Haiku
  const truncated = pageText.length > 6000 ? pageText.substring(0, 6000) + '...' : pageText

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENROUTER_API_KEY}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://myaimcentral.com',
      'X-Title': 'MyAIM Central MindSweep',
    },
    body: JSON.stringify({
      model: HAIKU_MODEL,
      max_tokens: 1024,
      messages: [
        {
          role: 'system',
          content: 'Summarize this web page content into a concise capture for a family task/calendar management system. Extract key details: dates, times, locations, action items, important facts. Keep it under 200 words. If it is an event, format as: Event name, date, time, location, details. If it is an article, extract the key takeaways.',
        },
        {
          role: 'user',
          content: `URL: ${url}\n\nContent:\n${truncated}`,
        },
      ],
    }),
  })

  if (!response.ok) {
    // Fallback: return raw truncated text
    return new Response(
      JSON.stringify({ text: `Link: ${url}\n\n${truncated.substring(0, 500)}` }),
      { headers: jsonHeaders },
    )
  }

  const data = await response.json()
  const summary = data.choices?.[0]?.message?.content || ''

  const usage = data.usage || {}
  if (family_id && member_id) {
    logAICost({
      familyId: family_id,
      memberId: member_id,
      featureKey: 'mindsweep_link',
      model: HAIKU_MODEL,
      inputTokens: usage.prompt_tokens || 0,
      outputTokens: usage.completion_tokens || 0,
    })
  }

  return new Response(
    JSON.stringify({ text: `${summary.trim()}\n\nSource: ${url}` }),
    { headers: jsonHeaders },
  )
}
