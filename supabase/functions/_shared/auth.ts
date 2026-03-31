// Shared auth verification for Edge Functions.
// Extracts Bearer token and verifies via Supabase anon client.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!

const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)

export interface AuthUser {
  id: string
  email?: string
  [key: string]: unknown
}

/**
 * Authenticate the request via Bearer token.
 * Returns the authenticated user object, or a 401 Response if auth fails.
 *
 * Usage:
 *   const auth = await authenticateRequest(req)
 *   if (auth instanceof Response) return auth
 *   const user = auth.user
 */
export async function authenticateRequest(
  req: Request,
): Promise<{ user: AuthUser } | Response> {
  const token = (req.headers.get('Authorization') || '').replace('Bearer ', '')
  const { data: { user }, error } = await anonClient.auth.getUser(token)

  if (error || !user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }

  return { user: user as AuthUser }
}
