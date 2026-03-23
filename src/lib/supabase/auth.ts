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
