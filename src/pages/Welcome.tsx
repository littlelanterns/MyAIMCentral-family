import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

export function Welcome() {
  return (
    <div className="min-h-svh flex flex-col items-center justify-center p-8"
         style={{ backgroundColor: 'var(--theme-background)' }}>
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-4">
          <Sparkles className="mx-auto" size={48} style={{ color: 'var(--theme-primary)' }} />
          <h1 className="text-4xl font-bold" style={{ color: 'var(--theme-text)' }}>
            MyAIM Central
          </h1>
          <p className="text-lg" style={{ color: 'var(--theme-text-muted)' }}>
            Your skills. Your talents. Your interests. Amplified.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            to="/auth/create-account"
            className="block w-full py-3 px-6 rounded-lg text-white font-medium text-center transition-colors"
            style={{ backgroundColor: 'var(--theme-primary)' }}
          >
            Create Account
          </Link>
          <Link
            to="/auth/sign-in"
            className="block w-full py-3 px-6 rounded-lg font-medium text-center transition-colors"
            style={{
              backgroundColor: 'var(--theme-surface)',
              color: 'var(--theme-text)',
              border: '1px solid var(--theme-border)',
            }}
          >
            Sign In
          </Link>
        </div>

        <Link
          to="/auth/family-login"
          className="text-sm underline"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          Family Member Login
        </Link>
      </div>
    </div>
  )
}
