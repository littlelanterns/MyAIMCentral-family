// MyAIM Central — wishlist-extract Edge Function (PRD-43 WishLists §7.1)
//
// Category-2 native utility (own EF, empty context_sources, NOT LiLa —
// Convention #248). Two modes, one function (curriculum-parse/mindsweep-scan
// "one EF, many modes" precedent):
//
//   mode:'link'  — fetch the URL, parse og:/JSON-LD/oEmbed DETERMINISTICALLY.
//                  $0, no model call in the common case. Haiku fallback only
//                  when no usable structured metadata exists at all.
//   mode:'photo' — client-resized image → Sonnet vision ("what product is
//                  this?"). The photo itself already saved client-side before
//                  this call ever runs; the model only proposes a title.
//
// HITM threading (Convention #279, PRD §6.1): deterministic og:/JSON-LD
// extraction is the .ics-import class — labeled "auto-filled, check it",
// no confirm required. Only AI-derived text (confidence:'ai' — the Haiku
// link fallback and every photo-mode result) requires the client's
// confirm-chip step before it persists. This function never decides HITM
// policy itself; it just stamps `confidence` so the client knows which UX
// to render.
//
// Full SAFETY-BETA-GATE scaffold from birth: authenticateRequest,
// detectCrisis on any free text that reaches the model, ethics-guard.ts
// Tier-0 input/output scan (current best practice for a brand-new utility
// EF — matches curriculum-parse.ts and mindsweep-scan/index.ts), no-training
// callOpenRouter, Zod-validated I/O, fire-and-forget cost logging.

import { z } from 'https://esm.sh/zod@3.23.8'
import { handleCors, jsonHeaders } from '../_shared/cors.ts'
import { authenticateRequest } from '../_shared/auth.ts'
import { detectCrisis, CRISIS_RESPONSE } from '../_shared/crisis-detection.ts'
import { logAICost } from '../_shared/cost-logger.ts'
import { callOpenRouter } from '../_shared/openrouter-client.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { scanUtilityInput, scanUtilityOutput, enqueueOutputScan } from '../_shared/ethics-guard.ts'

const OPENROUTER_API_KEY = Deno.env.get('OPENROUTER_API_KEY')!
const HAIKU_MODEL = 'anthropic/claude-haiku-4.5'
// Vision requires Sonnet — Haiku does not support image inputs on OpenRouter.
const VISION_MODEL = 'anthropic/claude-sonnet-4'
// Service-role client for PRD-41 ethics logging/enqueue (matches
// mindsweep-scan/curriculum-parse — the input is a URL/image, not free-typed
// user text, so the input pre-flight applies only where we actually send
// model-bound free text, i.e. the link Haiku-fallback prompt).
const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

const LinkInputSchema = z.object({
  mode: z.literal('link'),
  url: z.string().url(),
  family_id: z.string().uuid().optional(),
  member_id: z.string().uuid().optional(),
})

const PhotoInputSchema = z.object({
  mode: z.literal('photo'),
  image_base64: z.string().min(1),
  mime_type: z.string().optional(),
  family_id: z.string().uuid().optional(),
  member_id: z.string().uuid().optional(),
})

const InputSchema = z.discriminatedUnion('mode', [LinkInputSchema, PhotoInputSchema])

interface ExtractResult {
  title: string | null
  image_url: string | null
  price: number | null
  currency: string | null
  domain: string | null
  notes: string | null
  confidence: 'meta' | 'ai' | 'none'
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
      return new Response(
        JSON.stringify({ error: 'Invalid input', details: parsed.error.issues }),
        { status: 400, headers: jsonHeaders },
      )
    }

    if (parsed.data.mode === 'link') {
      return await handleLink(parsed.data)
    }
    return await handlePhoto(parsed.data)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error('wishlist-extract error:', msg)
    return new Response(
      JSON.stringify({ error: `Server error: ${msg}` }),
      { status: 500, headers: jsonHeaders },
    )
  }
})

// ── Link Mode ──────────────────────────────────────────────────────────────

function extractDomain(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '')
    return hostname || null
  } catch {
    return null
  }
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
}

/** Deterministic og:/twitter: meta tag + product JSON-LD parse. No model call. */
function parseStructuredMeta(html: string, url: string): ExtractResult {
  const result: ExtractResult = {
    title: null, image_url: null, price: null, currency: null,
    domain: extractDomain(url), notes: null, confidence: 'none',
  }

  // og:/twitter: meta tags — content can appear before or after property/name
  const metaTag = (keys: string[]): string | null => {
    for (const key of keys) {
      const patterns = [
        new RegExp(`<meta[^>]+(?:property|name)=["']${key}["'][^>]+content=["']([^"']*)["']`, 'i'),
        new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${key}["']`, 'i'),
      ]
      for (const pattern of patterns) {
        const match = html.match(pattern)
        if (match?.[1]) return decodeHtmlEntities(match[1]).trim()
      }
    }
    return null
  }

  result.title = metaTag(['og:title', 'twitter:title']) || null
  result.image_url = metaTag(['og:image', 'og:image:secure_url', 'twitter:image']) || null
  const priceStr = metaTag(['og:price:amount', 'product:price:amount', 'twitter:data1'])
  if (priceStr) {
    const num = Number(priceStr.replace(/[^0-9.]/g, ''))
    if (!Number.isNaN(num) && num > 0) result.price = num
  }
  result.currency = metaTag(['og:price:currency', 'product:price:currency']) || (result.price ? 'USD' : null)

  // Fallback to <title> if no og:title found.
  if (!result.title) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i)
    if (titleMatch?.[1]) result.title = decodeHtmlEntities(titleMatch[1]).trim()
  }

  // Product JSON-LD — a page can carry several <script type="application/ld+json">
  // blocks; scan all of them for one whose @type is Product.
  const ldJsonBlocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
  for (const block of ldJsonBlocks) {
    try {
      const raw = JSON.parse(block[1].trim())
      const candidates = Array.isArray(raw) ? raw : raw['@graph'] ? raw['@graph'] : [raw]
      for (const candidate of candidates) {
        const type = candidate?.['@type']
        const isProduct = type === 'Product' || (Array.isArray(type) && type.includes('Product'))
        if (!isProduct) continue
        if (!result.title && typeof candidate.name === 'string') result.title = candidate.name.trim()
        if (!result.image_url) {
          const img = candidate.image
          result.image_url = Array.isArray(img) ? img[0] : (typeof img === 'string' ? img : null)
        }
        const offers = Array.isArray(candidate.offers) ? candidate.offers[0] : candidate.offers
        if (offers) {
          if (!result.price && offers.price) {
            const num = Number(offers.price)
            if (!Number.isNaN(num) && num > 0) result.price = num
          }
          if (!result.currency && offers.priceCurrency) result.currency = offers.priceCurrency
        }
      }
    } catch {
      // Malformed JSON-LD block — skip it, keep scanning the rest.
      continue
    }
  }

  // Best-effort oEmbed discovery: a <link rel="alternate" type="application/json+oembed">
  // tag names a second endpoint with structured title/thumbnail data. Only
  // used to fill gaps — never overrides og:/JSON-LD values already found.
  const oembedLinkMatch = html.match(/<link[^>]+type=["']application\/json\+oembed["'][^>]+href=["']([^"']+)["']/i)
  if (oembedLinkMatch?.[1] && (!result.title || !result.image_url)) {
    result.notes = `oembed_candidate:${oembedLinkMatch[1]}`
  }

  if (result.title || result.image_url || result.price) {
    result.confidence = 'meta'
  }

  return result
}

async function tryOembedFallback(oembedUrl: string, result: ExtractResult): Promise<void> {
  try {
    const res = await fetch(oembedUrl, { headers: { 'User-Agent': 'MyAIM-WishCatch/1.0 (content extraction)' } })
    if (!res.ok) return
    const data = await res.json()
    if (!result.title && typeof data.title === 'string') result.title = data.title.trim()
    if (!result.image_url && typeof data.thumbnail_url === 'string') result.image_url = data.thumbnail_url
    result.notes = null
    if (result.title || result.image_url) result.confidence = 'meta'
  } catch {
    // Best-effort only — never throws, never blocks the capture.
  }
}

async function handleLink(input: z.infer<typeof LinkInputSchema>): Promise<Response> {
  const { url, family_id, member_id } = input

  let html = ''
  try {
    const pageResponse = await fetch(url, {
      headers: {
        'User-Agent': 'MyAIM-WishCatch/1.0 (content extraction)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    })
    if (!pageResponse.ok) {
      return new Response(
        JSON.stringify({ title: null, image_url: null, price: null, currency: null, domain: extractDomain(url), notes: null, confidence: 'none' }),
        { headers: jsonHeaders },
      )
    }
    html = await pageResponse.text()
  } catch (fetchErr) {
    console.error('wishlist-extract link fetch error:', fetchErr)
    // Best-effort honesty (PRD §7.1): never an error state that loses the
    // capture — the client already saved the bare URL before calling us.
    return new Response(
      JSON.stringify({ title: null, image_url: null, price: null, currency: null, domain: extractDomain(url), notes: null, confidence: 'none' }),
      { headers: jsonHeaders },
    )
  }

  const result = parseStructuredMeta(html, url)

  if (result.notes?.startsWith('oembed_candidate:')) {
    await tryOembedFallback(result.notes.replace('oembed_candidate:', ''), result)
  }

  if (result.confidence === 'meta') {
    return new Response(JSON.stringify(result), { headers: jsonHeaders })
  }

  // No usable structured metadata — Haiku fallback on readable text.
  const readableText = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 4000)

  if (readableText.length < 20) {
    // Nothing to work with — bare URL + domain chip only, never an error.
    return new Response(JSON.stringify(result), { headers: jsonHeaders })
  }

  if (detectCrisis(readableText)) {
    return new Response(JSON.stringify({ crisis: true, response: CRISIS_RESPONSE }), { headers: jsonHeaders })
  }

  if (family_id && member_id) {
    const inBlock = await scanUtilityInput(supabase, readableText, { familyId: family_id, memberId: member_id, surface: 'wishlist-extract' })
    if (inBlock) {
      return new Response(JSON.stringify({ ...result, ethics_declined: true, message: inBlock.reframe }), { headers: jsonHeaders })
    }
  }

  const aiResponse = await callOpenRouter(
    OPENROUTER_API_KEY,
    {
      model: HAIKU_MODEL,
      max_tokens: 300,
      messages: [
        {
          role: 'system',
          content: 'You extract a single product/item name and approximate price (if visible) from web page text for a family wishlist app. Respond with ONLY valid JSON: {"title": "string or null", "price": number or null, "currency": "string or null"}. No markdown, no commentary. If you cannot confidently identify a specific item, set title to null.',
        },
        { role: 'user', content: `URL: ${url}\n\nPage text:\n${readableText}` },
      ],
    },
    { title: 'MyAIM Central WishCatch' },
  )

  if (!aiResponse.ok) {
    return new Response(JSON.stringify(result), { headers: jsonHeaders })
  }

  const data = await aiResponse.json()
  const content = (data.choices?.[0]?.message?.content || '').trim()
  const usage = data.usage || {}

  if (family_id && member_id) {
    logAICost({
      familyId: family_id, memberId: member_id, featureKey: 'wishlist_extract_link',
      model: HAIKU_MODEL, inputTokens: usage.prompt_tokens || 0, outputTokens: usage.completion_tokens || 0,
    })
  }

  if (family_id && member_id) {
    const outScan = await scanUtilityOutput(supabase, content, { familyId: family_id, memberId: member_id, surface: 'wishlist-extract' })
    await enqueueOutputScan(supabase, { familyId: family_id, memberId: member_id, surface: 'wishlist-extract', content })
    if (outScan.replaced) {
      return new Response(JSON.stringify({ ...result, ethics_declined: true }), { headers: jsonHeaders })
    }
  }

  try {
    const cleaned = content.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
    const aiGuess = JSON.parse(cleaned)
    if (typeof aiGuess.title === 'string' && aiGuess.title.trim()) {
      result.title = aiGuess.title.trim()
      if (typeof aiGuess.price === 'number' && aiGuess.price > 0) result.price = aiGuess.price
      if (typeof aiGuess.currency === 'string') result.currency = aiGuess.currency
      result.confidence = 'ai'
    }
  } catch {
    // Unparseable — fall through with whatever structured data we already have.
  }

  return new Response(JSON.stringify(result), { headers: jsonHeaders })
}

// ── Photo Mode ───────────────────────────────────────────────────────────

async function handlePhoto(input: z.infer<typeof PhotoInputSchema>): Promise<Response> {
  const { image_base64, mime_type, family_id, member_id } = input
  const mimeType = mime_type || 'image/jpeg'
  const dataUri = `data:${mimeType};base64,${image_base64}`

  const response = await callOpenRouter(
    OPENROUTER_API_KEY,
    {
      model: VISION_MODEL,
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: 'What specific product or item is shown in this photo? This may be an item on a store shelf, a box, a toy, a gift idea. Respond with ONLY valid JSON: {"title": "specific product name, brand + item if visible", "notes": "one short clarifying detail or null"}. No markdown, no commentary. Be specific (e.g. "LEGO Friends Heartlake Hotel" not "toy").',
            },
            { type: 'image_url', image_url: { url: dataUri } },
          ],
        },
      ],
    },
    { title: 'MyAIM Central WishCatch' },
  )

  if (!response.ok) {
    const errText = await response.text()
    console.error('wishlist-extract vision error:', response.status, errText)
    return new Response(
      JSON.stringify({ title: null, notes: null, confidence: 'none' }),
      { headers: jsonHeaders },
    )
  }

  const data = await response.json()
  const content = (data.choices?.[0]?.message?.content || '').trim()
  const usage = data.usage || {}

  if (family_id && member_id) {
    logAICost({
      familyId: family_id, memberId: member_id, featureKey: 'wishlist_extract_photo',
      model: VISION_MODEL, inputTokens: usage.prompt_tokens || 0, outputTokens: usage.completion_tokens || 0,
    })
  }

  // Convention #7 — crisis override is global, even on a vision description.
  if (detectCrisis(content)) {
    return new Response(JSON.stringify({ crisis: true, response: CRISIS_RESPONSE }), { headers: jsonHeaders })
  }

  if (family_id && member_id) {
    const outScan = await scanUtilityOutput(supabase, content, { familyId: family_id, memberId: member_id, surface: 'wishlist-extract' })
    await enqueueOutputScan(supabase, { familyId: family_id, memberId: member_id, surface: 'wishlist-extract', content })
    if (outScan.replaced) {
      return new Response(JSON.stringify({ title: null, notes: null, confidence: 'none', ethics_declined: true }), { headers: jsonHeaders })
    }
  }

  try {
    const cleaned = content.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '')
    const parsed = JSON.parse(cleaned)
    return new Response(
      JSON.stringify({
        title: typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim() : null,
        notes: typeof parsed.notes === 'string' && parsed.notes.trim() ? parsed.notes.trim() : null,
        confidence: 'ai',
      }),
      { headers: jsonHeaders },
    )
  } catch {
    return new Response(JSON.stringify({ title: null, notes: null, confidence: 'none' }), { headers: jsonHeaders })
  }
}
