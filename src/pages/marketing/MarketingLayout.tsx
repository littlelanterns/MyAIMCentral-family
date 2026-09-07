import { type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Mail } from 'lucide-react'
import { brand } from '@/lib/theme/tokens'

interface MarketingLayoutProps {
  children: ReactNode
}

/**
 * Pre-theme public surface (the auth-page exception applies here — this
 * page never sees the in-app theme system). Palette comes directly from
 * the founder's business-model diagram: brand.warmCream/warmEarth as the
 * base, the three pillar colors (goldenHoney, dustyRose, sageTeal) as
 * accents. Lucide icons only, no emoji.
 */
export function MarketingLayout({ children }: MarketingLayoutProps) {
  const year = new Date().getFullYear()

  return (
    <div className="min-h-svh flex flex-col" style={{ backgroundColor: brand.warmCream, color: brand.warmEarth }}>
      <header
        className="sticky top-0 z-10 backdrop-blur"
        style={{ backgroundColor: 'rgba(255, 244, 236, 0.92)', borderBottom: `1px solid ${brand.softSage}` }}
      >
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/welcome" className="flex items-center gap-2">
            <img src="/aimfm-logo-transparent.png" alt="a.i.magic for moms" style={{ height: 40, width: 'auto' }} />
          </Link>
          <nav className="hidden sm:flex items-center gap-6 text-sm font-semibold" aria-label="Main">
            <a href="#pillars" style={{ color: brand.warmEarth }}>
              What we offer
            </a>
            <a href="#pricing" style={{ color: brand.warmEarth }}>
              Pricing
            </a>
            <a href="#waitlist" style={{ color: brand.warmEarth }}>
              Join the waitlist
            </a>
          </nav>
          <a
            href="https://myaimcentral.com/auth/sign-in"
            className="px-4 py-2 rounded-full text-sm font-semibold"
            style={{ backgroundColor: brand.sageTeal, color: '#ffffff' }}
          >
            Member Sign In
          </a>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer style={{ backgroundColor: brand.deepOcean, color: '#ffffff' }}>
        <div className="max-w-6xl mx-auto px-6 py-10 grid gap-8 sm:grid-cols-3 text-sm">
          <div>
            <img src="/aimfm-logo-transparent.png" alt="a.i.magic for moms" style={{ height: 32, marginBottom: 12 }} />
            <p style={{ opacity: 0.8 }}>Three Little Lanterns LLC</p>
            <p style={{ opacity: 0.8 }}>[Mailing address — pending; flagged for counsel]</p>
          </div>
          <div>
            <p className="font-semibold mb-2">Contact</p>
            {/* color must be explicit here — App.css's unlayered `a {
                color: ... }` rule beats any inherited parent color, so
                without this every footer link renders sageTeal instead
                of white (found live during the eyes-on tour). */}
            <a
              href="mailto:aimagicformoms@gmail.com"
              className="flex items-center gap-2"
              style={{ opacity: 0.8, color: '#ffffff' }}
            >
              <Mail size={16} />
              aimagicformoms@gmail.com
            </a>
          </div>
          <div>
            <p className="font-semibold mb-2">Legal</p>
            <div className="flex flex-col gap-1">
              <Link to="/privacy" style={{ opacity: 0.8, color: '#ffffff' }}>
                Privacy Policy
              </Link>
              <Link to="/terms" style={{ opacity: 0.8, color: '#ffffff' }}>
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
        <div className="text-center text-xs py-4" style={{ opacity: 0.6, borderTop: '1px solid rgba(255,255,255,0.15)' }}>
          © {year} Three Little Lanterns LLC. MyAIM Central and a.i.magic for moms.
        </div>
      </footer>
    </div>
  )
}
