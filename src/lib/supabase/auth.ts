import { supabase } from './client'
import type { User, Session } from '@supabase/supabase-js'

export async function signUp(email: string, password: string, displayName: string) {
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName,
        timezone,
      },
    },
  })

  return { data, error }
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  return { data, error }
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  return { error }
}

export async function resetPassword(email: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  })
  return { error }
}

export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession()
  return data.session
}

export async function getUser(): Promise<User | null> {
  const { data } = await supabase.auth.getUser()
  return data.user
}

export function onAuthStateChange(callback: (user: User | null) => void) {
  return supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user ?? null)
  })
}

export async function lookupFamilyByLoginName(loginName: string) {
  const { data, error } = await supabase.rpc('lookup_family_by_login_name', {
    login_name: loginName,
  })
  return { data, error }
}

export async function getFamilyLoginMembers(familyId: string) {
  const { data, error } = await supabase.rpc('get_family_login_members', {
    p_family_id: familyId,
  })
  return { data, error }
}

/**
 * Boolean-only uniqueness check for family login names.
 * Returns true if the name is unused OR used by the caller's own family.
 * Replaces the previous (leaky) use of lookup_family_by_login_name for
 * availability checking — never exposes family IDs or names.
 */
export async function checkFamilyLoginNameAvailable(loginName: string) {
  const { data, error } = await supabase.rpc('check_family_login_name_available', {
    p_login_name: loginName,
  })
  return { data: data as boolean | null, error }
}

export interface FamilyLoginMember {
  member_id: string
  display_name: string
  avatar_url: string | null
  auth_method: string | null
  member_color: string | null
  dashboard_mode: string | null
}

export interface FamilyLoginVerifyResult {
  success: boolean
  reason?: 'invalid' | 'locked'
  attempts_remaining?: number
  remaining_seconds?: number
  family_id?: string
  family_name?: string
  members?: FamilyLoginMember[]
}

/**
 * The family door (Family-Auth-Two-Door): combined family login name +
 * family password verification. No enumeration — wrong name and wrong
 * password return the same generic result. The member roster is returned
 * ONLY on a verified password. Anon-callable (works on signed-out devices).
 */
export async function verifyFamilyLogin(loginName: string, password: string) {
  const { data, error } = await supabase.rpc('verify_family_login', {
    p_login_name: loginName,
    p_password: password,
  })
  return { data: data as FamilyLoginVerifyResult | null, error }
}

/**
 * Set or change the family password. Primary-parent-only; hashing happens
 * server-side (bcrypt) — plain text is never stored.
 *
 * Routes through the family-auth-admin Edge Function (NOT the bare RPC):
 * it writes the hash AND rotates the family shadow auth account, signing
 * out every resting family-device session — the remote kill switch.
 */
export async function setFamilyPassword(password: string) {
  const { data, error } = await supabase.functions.invoke('family-auth-admin', {
    body: { action: 'set_family_password', password },
  })
  return {
    data: data as { success: boolean; reason?: 'not_authenticated' | 'not_authorized' | 'weak_password' } | null,
    error: error as Error | null,
  }
}
