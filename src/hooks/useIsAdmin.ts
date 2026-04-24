import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import { isSuperAdminEmail } from '@/lib/admin/superAdmins'
import { useAuth } from './useAuth'

interface UseIsAdminResult {
  isAdmin: boolean
  loading: boolean
}

/**
 * Returns whether the current auth user has admin-console access.
 *
 * Two-layer check per PRD-32 Screen 1:
 *   1. Hardcoded super-admin email list (SUPER_ADMIN_EMAILS)
 *   2. Any active row in `staff_permissions` where `user_id = auth.uid()`
 *
 * Fail-closed on query error (treat as non-admin). Super-admin check runs
 * first so a staff_permissions outage never locks a hardcoded super out.
 */
export function useIsAdmin(): UseIsAdminResult {
  const { user, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function check() {
      if (authLoading) return
      if (!user) {
        if (!cancelled) {
          setIsAdmin(false)
          setChecking(false)
        }
        return
      }

      if (isSuperAdminEmail(user.email)) {
        if (!cancelled) {
          setIsAdmin(true)
          setChecking(false)
        }
        return
      }

      try {
        const { data, error } = await supabase
          .from('staff_permissions')
          .select('id')
          .eq('user_id', user.id)
          .limit(1)

        if (cancelled) return
        if (error) {
          console.warn('[useIsAdmin] staff_permissions query error; failing closed', error)
          setIsAdmin(false)
        } else {
          setIsAdmin((data?.length ?? 0) > 0)
        }
      } catch (err) {
        if (!cancelled) {
          console.warn('[useIsAdmin] staff_permissions query threw; failing closed', err)
          setIsAdmin(false)
        }
      } finally {
        if (!cancelled) setChecking(false)
      }
    }

    setChecking(true)
    check()

    return () => {
      cancelled = true
    }
  }, [user, authLoading])

  return {
    isAdmin,
    loading: authLoading || checking,
  }
}
