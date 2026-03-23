import { useState, useEffect, useCallback } from 'react'
import type { User } from '@supabase/supabase-js'
import { onAuthStateChange, signOut as authSignOut } from '@/lib/supabase/auth'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const { data: { subscription } } = onAuthStateChange((user) => {
      setUser(user)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = useCallback(async () => {
    await authSignOut()
    setUser(null)
  }, [])

  return { user, loading, signOut }
}
