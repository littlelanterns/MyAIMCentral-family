import { useState } from 'react'
import { Link } from 'react-router-dom'
import { brand } from '@/lib/theme/tokens'

export function Welcome() {
  const [lilaHovered, setLilaHovered] = useState(false)

  return (
    <div
      className="min-h-svh flex flex-col items-center justify-center p-8"
      style={{
        background: `linear-gradient(135deg, ${brand.warmCream} 0%, ${brand.softSage} 100%)`,
      }}
    >
      <div className="max-w-md w-full text-center space-y-8">
        <div className="space-y-4">
          <div
            className="lila-mascot relative inline-block cursor-pointer"
            onMouseEnter={() => setLilaHovered(true)}
            onMouseLeave={() => setLilaHovered(false)}
          >
            <img
              src="/Lila-HtH.png"
              alt="LiLa — Happy to Help"
              className="mx-auto"
              style={{ width: 120, height: 120, objectFit: 'contain' }}
            />
            <div
              className="lila-tooltip"
              style={{
                position: 'absolute',
                bottom: '100%',
                left: '50%',
                transform: lilaHovered
                  ? 'translateX(-50%) translateY(-8px) scale(1)'
                  : 'translateX(-50%) translateY(-4px) scale(0.9)',
                opacity: lilaHovered ? 1 : 0,
                pointerEvents: 'none',
                background: brand.deepOcean,
                color: '#ffffff',
                padding: '6px 14px',
                borderRadius: '12px',
                fontSize: '0.85rem',
                fontWeight: 600,
                whiteSpace: 'nowrap',
                boxShadow: '0 4px 12px rgba(44, 93, 96, 0.3)',
                transition: 'all 0.25s ease',
              }}
            >
              Come join us!
              <span
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 0,
                  height: 0,
                  borderLeft: '6px solid transparent',
                  borderRight: '6px solid transparent',
                  borderTop: `6px solid ${brand.deepOcean}`,
                }}
              />
            </div>
          </div>
          <h1
            className="text-4xl font-bold"
            style={{
              color: brand.warmEarth,
              fontFamily: 'var(--font-heading)',
            }}
          >
            MyAIM Central
          </h1>
          <p className="text-lg" style={{ color: '#7a6a5f' }}>
            Your skills. Your talents. Your interests. Amplified.
          </p>
        </div>

        <div className="space-y-3">
          <Link
            to="/auth/create-account"
            className="welcome-btn-primary block w-full py-3.5 px-6 rounded-xl font-semibold text-center"
            style={{
              background: `linear-gradient(135deg, ${brand.sageTeal} 0%, ${brand.goldenHoney} 100%)`,
              color: '#ffffff',
              boxShadow: '0 4px 14px rgba(104, 163, 149, 0.35), 0 2px 6px rgba(0,0,0,0.08)',
            }}
          >
            Create Account
          </Link>
          <Link
            to="/auth/sign-in"
            className="welcome-btn-secondary block w-full py-3.5 px-6 rounded-xl font-semibold text-center"
            style={{
              backgroundColor: '#ffffff',
              color: brand.warmEarth,
              border: `2px solid ${brand.softSage}`,
              boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
            }}
          >
            Sign In
          </Link>
        </div>

        <Link
          to="/auth/family-login"
          className="welcome-btn-link inline-block text-sm font-medium"
          style={{ color: '#7a6a5f' }}
        >
          Family Member Login
        </Link>
      </div>

      <style>{`
        .lila-mascot img {
          transition: transform 0.3s ease, filter 0.3s ease;
        }
        .lila-mascot:hover img {
          transform: scale(1.1) rotate(-3deg);
          filter: drop-shadow(0 6px 16px rgba(104, 163, 149, 0.4));
        }
        .lila-mascot {
          animation: lila-float 3s ease-in-out infinite;
        }
        @keyframes lila-float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
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
          border-color: ${brand.sageTeal} !important;
        }
        .welcome-btn-secondary:active {
          transform: translateY(0) scale(0.98);
        }
        .welcome-btn-link:hover {
          color: ${brand.sageTeal} !important;
          text-decoration: underline;
          transform: translateY(-1px);
        }
      `}</style>
    </div>
  )
}
