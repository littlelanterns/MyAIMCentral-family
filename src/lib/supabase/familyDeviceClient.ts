import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim()
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim()

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check .env.local.')
}

/**
 * PINR (2026-07-09) — a SECOND, narrowly-scoped Supabase client dedicated to
 * persisting the family-identity shadow session independently of the member
 * session (Family-Auth-Two-Door Founder Decision 4: "family layer persists;
 * timeout drops only to the PIN/picture relock").
 *
 * HARD ISOLATION RULE: this client is imported ONLY by the login/resume flow
 * (FamilyLogin.tsx, useSessionTimeout.ts's expiry branch). Data hooks, RLS
 * reads, and useFamilyMember() must NEVER touch it — it exists purely to
 * answer "did this device pass the family door before?" on resume.
 *
 * Why a second client: the main `supabase` client (src/lib/supabase/
 * client.ts) has a SINGLE storage slot ('myaim-auth') that gets clobbered
 * the moment a member signs in with their PIN or picture — intentional
 * "personal device" behavior. Before this build, that meant "the device
 * passed the family door" left NO independently-checkable trace: a kid's
 * session timeout had nowhere to fall back to but the full family-name +
 * password door again. This client's SEPARATE storage key survives the
 * member sign-in untouched, so a timeout can check "is there still a valid
 * family layer?" and resume at just that member's own PIN/picture gate.
 *
 * The kill switch (family-auth-admin's set_family_password rotating the
 * shadow account's password + admin.auth.admin.signOut(userId, 'global'))
 * revokes THIS client's refresh token along with every other device's — no
 * new revocation wiring needed (Convention #273).
 */
export const familyDeviceClient = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'myaim-family-auth',
    storage: localStorage,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
})

/**
 * Plain localStorage marker (not part of the Supabase session blob) holding
 * the family_id the device-client session belongs to — get_family_login_
 * members(p_family_id) needs it as an explicit param (migration 100251) and
 * there is no other cheap client-side way to derive it from the shadow
 * session without an extra round trip. Written by establishFamilySession()
 * alongside the device-client sign-in; cleared by clearFamilyDeviceMarker()
 * on kill-switch/local sign-out.
 */
const FAMILY_DEVICE_ID_KEY = 'myaim-family-device-id'

export function setFamilyDeviceMarker(familyId: string) {
  localStorage.setItem(FAMILY_DEVICE_ID_KEY, familyId)
}

export function getFamilyDeviceMarker(): string | null {
  return localStorage.getItem(FAMILY_DEVICE_ID_KEY)
}

export function clearFamilyDeviceMarker() {
  localStorage.removeItem(FAMILY_DEVICE_ID_KEY)
}
