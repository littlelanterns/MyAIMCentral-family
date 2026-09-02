import {
  Heart,
  BrainCircuit,
  Camera,
  Smartphone,
  Users,
  Shield,
  Crown,
  UserCircle,
  GraduationCap,
  Compass,
  Gamepad2,
  Sparkles,
} from 'lucide-react'
import { MarketingLayout } from './MarketingLayout'
import { PricingSection } from '@/components/marketing/PricingSection'
import { WaitlistForm } from '@/components/marketing/WaitlistForm'
import { useMarketingSEO } from '@/lib/marketing/useMarketingSEO'
import { brand } from '@/lib/theme/tokens'

const PILLARS = [
  {
    key: 'ai_tutorial_library',
    label: 'AI Tutorial Library',
    color: brand.goldenHoney,
    description:
      'A curated library of AI tools and tutorials built for real moms — no tech background required, no overwhelm.',
  },
  {
    key: 'family_organization_app',
    label: 'Family Organization App',
    color: brand.dustyRose,
    description:
      'Tasks, routines, calendars, allowance, homeschool tracking, and celebration — all in one place, for every family member.',
  },
  {
    key: 'portable_family_context',
    label: 'Portable Family Context',
    color: brand.sageTeal,
    description:
      "The knowledge you build about your family travels with you — LiLa knows your family's context everywhere she shows up.",
  },
]

const BENEFITS = [
  {
    icon: Heart,
    title: 'Celebration, never punishment',
    body: "No late penalties. No point deductions. No shame mechanics. Every day starts fresh — we celebrate what your family did, never what it didn't.",
  },
  {
    icon: BrainCircuit,
    title: 'AI that actually knows your family',
    body: "LiLa isn't a generic chatbot. She uses the context you choose to share — preferences, goals, notes about each child — so every answer fits your family. You control exactly what she can see.",
  },
  {
    icon: Camera,
    title: 'Capture anything, instantly',
    body: 'Snap a photo of a permission slip, paste a link, forward an email, or just talk — MindSweep turns it into a calendar event or task without you lifting a finger.',
  },
  {
    icon: Smartphone,
    title: 'Any screen, no hardware to buy',
    body: 'Phone, tablet, laptop, or a tablet mounted on the wall as a family hub — MyAIM Central works everywhere you already are. No proprietary device required.',
  },
  {
    icon: Users,
    title: 'Five ages, five real interfaces',
    body: 'Mom gets a command center. Teens get an age-appropriate independent view. Little ones get a playful, icon-driven experience. Everyone sees a version of the app actually built for them.',
  },
  {
    icon: Shield,
    title: "Built for COPPA compliance from day one",
    body: "Children's privacy isn't bolted on after the fact. Verified parental consent, full data export, and a real right to delete are part of the platform's foundation.",
  },
]

const SHELLS = [
  { icon: Crown, name: 'Mom', desc: 'Full command center — sees everything, runs the whole household.' },
  { icon: UserCircle, name: 'Adult', desc: 'A scoped view for a spouse or trusted co-parent.' },
  { icon: GraduationCap, name: 'Independent', desc: 'An age-appropriate view for teens, building real independence.' },
  { icon: Compass, name: 'Guided', desc: 'Simplified and prompted for kids around 8–12.' },
  { icon: Gamepad2, name: 'Play', desc: 'Icon-driven and playful for the youngest members of the family.' },
]

export function MarketingHome() {
  useMarketingSEO({
    title: 'a.i.magic for moms — AI Magic + Family Organization, in One Place',
    description:
      'A family management platform and AI literacy membership built for moms managing complex households — homeschool, disability, and every kind of busy family.',
    path: '/',
  })

  return (
    <MarketingLayout>
      {/* Hero */}
      <section className="pt-16 pb-20 px-6 text-center">
        <div className="max-w-3xl mx-auto">
          <img
            src="/aimfm-logo-transparent.png"
            alt="a.i.magic for moms"
            style={{ height: 220, width: 'auto', margin: '0 auto 24px', maxWidth: '90%' }}
          />
          <h1 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: brand.warmEarth, fontFamily: 'var(--font-heading)' }}>
            AI magic and real family organization, finally in one place.
          </h1>
          <p className="text-lg mb-8" style={{ color: brand.warmEarth, opacity: 0.8 }}>
            LiLa, your family's AI assistant, learns your family and helps you run it — tasks, routines,
            calendar, celebration, and an AI tutorial library — without the overwhelm.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <a
              href="#waitlist"
              className="px-6 py-3.5 rounded-xl font-semibold"
              style={{
                background: `linear-gradient(135deg, ${brand.sageTeal} 0%, ${brand.goldenHoney} 100%)`,
                boxShadow: '0 4px 14px rgba(104, 163, 149, 0.35)',
                // NOTE: color must be set inline, not via Tailwind's
                // text-white class. This codebase's global `a { color }`
                // rule (App.css, declared after `@import "tailwindcss"`)
                // is UNLAYERED CSS, which always beats any Tailwind
                // utility class (Tailwind's utilities live inside a CSS
                // cascade layer, and unlayered rules win over layered
                // rules regardless of specificity). Confirmed live during
                // this build's own eyes-on tour — text-white silently
                // rendered as sageTeal-on-sageTeal, nearly invisible.
                color: '#ffffff',
              }}
            >
              Join the Waitlist
            </a>
            <a
              href="#pillars"
              className="px-6 py-3.5 rounded-xl font-semibold"
              style={{ backgroundColor: '#ffffff', color: brand.warmEarth, border: `2px solid ${brand.softSage}` }}
            >
              See what's included
            </a>
          </div>
        </div>
      </section>

      {/* Three pillars */}
      <section id="pillars" className="py-16 px-6" style={{ backgroundColor: '#ffffff' }}>
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-3xl font-bold text-center mb-3"
            style={{ color: brand.warmEarth, fontFamily: 'var(--font-heading)' }}
          >
            One membership, three kinds of magic
          </h2>
          <p className="text-center max-w-2xl mx-auto mb-12" style={{ color: brand.warmEarth, opacity: 0.75 }}>
            Everything lives under one umbrella — sign up once, and your family gets all three.
          </p>
          <div className="grid gap-8 sm:grid-cols-3">
            {PILLARS.map((pillar) => (
              <div key={pillar.key} className="text-center flex flex-col items-center">
                <div
                  className="rounded-full flex items-center justify-center mb-4"
                  style={{
                    width: 140,
                    height: 140,
                    border: `3px dashed ${pillar.color}`,
                  }}
                >
                  <span className="text-lg font-bold px-4" style={{ color: pillar.color }}>
                    {pillar.label}
                  </span>
                </div>
                <p className="text-sm" style={{ color: brand.warmEarth, opacity: 0.75 }}>
                  {pillar.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-6" style={{ backgroundColor: brand.softSage }}>
        <div className="max-w-5xl mx-auto">
          <h2
            className="text-3xl font-bold text-center mb-12"
            style={{ color: brand.warmEarth, fontFamily: 'var(--font-heading)' }}
          >
            Why families are switching
          </h2>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {BENEFITS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="rounded-2xl p-6" style={{ backgroundColor: '#ffffff' }}>
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center mb-3"
                  style={{ backgroundColor: brand.warmCream }}
                >
                  <Icon size={22} style={{ color: brand.sageTeal }} />
                </div>
                <h3 className="font-bold mb-2" style={{ color: brand.warmEarth }}>
                  {title}
                </h3>
                <p className="text-sm" style={{ color: brand.warmEarth, opacity: 0.75 }}>
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works for your family */}
      <section className="py-16 px-6" style={{ backgroundColor: '#ffffff' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-4">
            <img src="/sittinglila.png" alt="LiLa" style={{ height: 90, width: 'auto', margin: '0 auto 12px' }} />
          </div>
          <h2
            className="text-3xl font-bold text-center mb-3"
            style={{ color: brand.warmEarth, fontFamily: 'var(--font-heading)' }}
          >
            One family. Five real experiences.
          </h2>
          <p className="text-center max-w-2xl mx-auto mb-12" style={{ color: brand.warmEarth, opacity: 0.75 }}>
            Every family member signs in and sees an interface actually built for their age and role — not
            one generic app squeezed to fit everyone.
          </p>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
            {SHELLS.map(({ icon: Icon, name, desc }) => (
              <div
                key={name}
                className="rounded-2xl p-5 text-center"
                style={{ backgroundColor: brand.warmCream, border: `1px solid ${brand.softSage}` }}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: '#ffffff', border: `2px solid ${brand.sageTeal}` }}
                >
                  <Icon size={22} style={{ color: brand.sageTeal }} />
                </div>
                <p className="font-bold mb-1" style={{ color: brand.warmEarth }}>
                  {name}
                </p>
                <p className="text-xs" style={{ color: brand.warmEarth, opacity: 0.7 }}>
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <PricingSection />

      {/* Waitlist */}
      <section id="waitlist" className="py-16 px-6" style={{ backgroundColor: brand.softGold }}>
        <div className="max-w-lg mx-auto text-center">
          <Sparkles size={32} style={{ color: brand.goldenHoney, margin: '0 auto 12px' }} />
          <h2 className="text-3xl font-bold mb-3" style={{ color: brand.warmEarth, fontFamily: 'var(--font-heading)' }}>
            Be first in line
          </h2>
          <p className="mb-8" style={{ color: brand.warmEarth, opacity: 0.8 }}>
            We're onboarding founding families in small batches. Join the waitlist and we'll email you when
            your family's spot opens up.
          </p>
          <WaitlistForm />
        </div>
      </section>
    </MarketingLayout>
  )
}
