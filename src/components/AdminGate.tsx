import type { ReactNode } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { AuthGuard } from './AuthGuard'
import { useIsAdmin } from '@/hooks/useIsAdmin'
import { useAuth } from '@/hooks/useAuth'

interface AdminGateProps {
  children: ReactNode
}

function AdminCheck({ children }: AdminGateProps) {
  const { user } = useAuth()
  const { isAdmin, loading } = useIsAdmin()

  if (loading) {
    return (
      <div
        className="min-h-svh flex items-center justify-center"
        style={{ backgroundColor: 'var(--theme-background)' }}
      >
        <p style={{ color: 'var(--theme-text-muted)' }}>Checking access…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/" replace />
  }

  if (!isAdmin) {
    return (
      <div
        className="min-h-svh flex items-center justify-center px-6"
        style={{ backgroundColor: 'var(--theme-background)' }}
      >
        <div
          className="w-full max-w-md rounded-2xl p-6 text-center"
          style={{
            backgroundColor: 'var(--theme-surface)',
            border: '1px solid var(--theme-border)',
            color: 'var(--theme-text-primary)',
          }}
        >
          <div className="flex justify-center mb-4">
            <ShieldAlert size={40} style={{ color: 'var(--theme-text-muted)' }} />
          </div>
          <h1 className="text-xl font-semibold mb-2">Admin area</h1>
          <p className="mb-5" style={{ color: 'var(--theme-text-muted)' }}>
            This part of MyAIM is for platform administrators. If you think you
            should have access, reach out and we'll get you sorted.
          </p>
          <Link
            to="/dashboard"
            className="btn-primary inline-block rounded-full px-5 py-2 font-medium"
            style={{ color: 'var(--color-btn-primary-text)' }}
          >
            Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

/**
 * Wraps admin-only routes. Composes AuthGuard (must be signed in) with an
 * admin check (hardcoded super-admin email OR active staff_permissions row).
 *
 * Non-admin authenticated users see a friendly card, NOT a silent redirect.
 * Loading states render a centered "Checking access…" placeholder so real
 * admins never flash the non-admin card on page load.
 */
export function AdminGate({ children }: AdminGateProps) {
  return (
    <AuthGuard>
      <AdminCheck>{children}</AdminCheck>
    </AuthGuard>
  )
}
