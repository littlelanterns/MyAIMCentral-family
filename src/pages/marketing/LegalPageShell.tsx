import { type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { MarketingLayout } from './MarketingLayout'
import { brand } from '@/lib/theme/tokens'

interface LegalPageShellProps {
  title: string
  children: ReactNode
}

export function LegalPageShell({ title, children }: LegalPageShellProps) {
  return (
    <MarketingLayout>
      <div className="max-w-3xl mx-auto px-6 py-12">
        <div
          className="flex items-start gap-3 rounded-xl p-4 mb-8 text-sm"
          style={{ backgroundColor: brand.softGold, color: brand.warmEarth, border: `1px solid ${brand.goldenHoney}` }}
          data-testid="legal-beta-draft-banner"
        >
          <AlertTriangle size={18} style={{ color: brand.goldenHoney, flexShrink: 0, marginTop: 2 }} />
          <span>
            <strong>Beta draft — under attorney review.</strong> This page describes how the platform is
            designed to operate and will be finalized with licensed counsel before general availability. If
            anything here is unclear, email{' '}
            <a href="mailto:aimagicformoms@gmail.com" style={{ color: brand.deepOcean, textDecoration: 'underline' }}>
              aimagicformoms@gmail.com
            </a>{' '}
            and a human will answer.
          </span>
        </div>

        <h1
          className="text-3xl font-bold mb-2"
          style={{ color: brand.warmEarth, fontFamily: 'var(--font-heading)' }}
        >
          {title}
        </h1>
        <p className="text-sm mb-10" style={{ color: brand.warmEarth, opacity: 0.6 }}>
          Three Little Lanterns LLC · MyAIM Central · a.i.magic for moms
        </p>

        <div className="legal-body space-y-6 text-sm leading-relaxed" style={{ color: brand.warmEarth }}>
          {children}
        </div>
      </div>

      <style>{`
        .legal-body h2 {
          font-size: 1.15rem;
          font-weight: 700;
          margin-top: 1.5rem;
          color: ${brand.deepOcean};
        }
        .legal-body ul {
          list-style: disc;
          padding-left: 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
        }
        .legal-body a {
          color: ${brand.sageTeal};
          text-decoration: underline;
        }
      `}</style>
    </MarketingLayout>
  )
}
