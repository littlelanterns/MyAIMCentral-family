import { createClient } from '@supabase/supabase-js'

// .trim() guards against stray whitespace/newlines pasted into env vars —
// a trailing \n in the key breaks the Realtime WebSocket handshake (apikey ends up URL-encoded as %0A)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env.local.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'myaim-auth',
    storage: localStorage,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
})
