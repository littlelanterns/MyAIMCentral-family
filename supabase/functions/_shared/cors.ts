// Shared CORS headers and preflight handler for all Edge Functions.
// Centralizes the Access-Control headers so they stay consistent.

export const corsHeaders: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

/**
 * Handle CORS preflight. Returns a Response for OPTIONS, or null to continue.
 *
 * Usage:
 *   const cors = handleCors(req)
 *   if (cors) return cors
 */
export function handleCors(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  return null
}

/** Convenience: merge CORS + Content-Type JSON headers */
export const jsonHeaders: Record<string, string> = {
  ...corsHeaders,
  'Content-Type': 'application/json',
}

/** Convenience: SSE stream response headers */
export const sseHeaders: Record<string, string> = {
  ...corsHeaders,
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
}
