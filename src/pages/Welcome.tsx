import { Link } from 'react-router-dom'

export function Welcome() {
  return (
    <div
      className="min-h-svh flex flex-col items-center justify-center p-8"
      style={{ background: 'var(--gradient-background, var(--color-bg-primary, var(--theme-background)))' }}
    >
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-4">
          <img
            src="/Lila-HtH.png"
            alt="LiLa — Happy to Help"
            className="mx-auto"
            style={{ width: 120, height: 120, objectFit: 'contain' }}
          />
          <h1
            className="text-4xl font-bold"
            style={{
              color: 'var(--color-text-heading, var(--theme-text))',
              fontFamily: 'var(--font-heading)',
            }}
          >
            MyAIM Central
          </h1>
          <p
            className="text-lg"
            style={{ color: 'var(--color-text-secondary, var(--theme-text-muted))' }}
          >
            Your skills. Your talents. Your interests. Amplified.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            to="/auth/create-account"
            className="welcome-btn-primary block w-full py-3.5 px-6 rounded-xl font-semibold text-center"
            style={{
              background: 'var(--surface-primary, var(--color-btn-primary-bg, var(--theme-primary)))',
              color: 'var(--color-btn-primary-text, #ffffff)',
              boxShadow: '0 4px 14px rgba(104, 163, 149, 0.35), 0 2px 6px rgba(0,0,0,0.08)',
            }}
          >
            Create Account
          </Link>
          <Link
            to="/auth/sign-in"
            className="welcome-btn-secondary block w-full py-3.5 px-6 rounded-xl font-semibold text-center"
            style={{
              backgroundColor: 'var(--color-bg-card, var(--theme-surface))',
              color: 'var(--color-text-heading, var(--theme-text))',
              border: '2px solid var(--color-border, var(--theme-border))',
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            Sign In
          </Link>
        </div>

        <Link
          to="/auth/family-login"
          className="welcome-btn-link inline-block text-sm font-medium"
          style={{ color: 'var(--color-text-secondary, var(--theme-text-muted))' }}
        >
          Family Member Login
        </Link>
      </div>

      <style>{`
        .welcome-btn-primary,
        .welcome-btn-secondary,
        .welcome-btn-link {
          transition: transform 0.2s ease, box-shadow 0.2s ease, filter 0.2s ease;
        }
        .welcome-btn-primary:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 6px 20px rgba(104, 163, 149, 0.45), 0 4px 10px rgba(0,0,0,0.12) !important;
          filter: brightness(1.08);
        }
        .welcome-btn-primary:active {
          transform: translateY(0) scale(0.98);
          box-shadow: 0 2px 8px rgba(104, 163, 149, 0.3), 0 1px 4px rgba(0,0,0,0.06) !important;
        }
        .welcome-btn-secondary:hover {
          transform: translateY(-2px) scale(1.02);
          box-shadow: 0 4px 14px rgba(0,0,0,0.1) !important;
          border-color: var(--color-btn-primary-bg, var(--theme-primary)) !important;
        }
        .welcome-btn-secondary:active {
          transform: translateY(0) scale(0.98);
        }
        .welcome-btn-link:hover {
          color: var(--color-btn-primary-bg, var(--theme-primary)) !important;
          text-decoration: underline;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  )
}
