import { useState, type FormEvent } from 'react'
import { Sparkles, CheckCircle2, Loader2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'
import { brand } from '@/lib/theme/tokens'

const PILLAR_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: 'ai_tutorial_library', label: 'AI Tutorial Library', color: brand.goldenHoney },
  { value: 'family_organization_app', label: 'Family Organization App', color: brand.dustyRose },
  { value: 'portable_family_context', label: 'Portable Family Context', color: brand.sageTeal },
]

export function WaitlistForm() {
  const [email, setEmail] = useState('')
  const [name, setName] = useState('')
  const [pillars, setPillars] = useState<string[]>([])
  const [status, setStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const togglePillar = (value: string) => {
    setPillars((prev) => (prev.includes(value) ? prev.filter((p) => p !== value) : [...prev, value]))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!email.trim()) return
    setStatus('submitting')
    setErrorMessage('')

    const { error } = await supabase.from('waitlist_signups').insert({
      email: email.trim().toLowerCase(),
      name: name.trim() || null,
      interested_pillars: pillars,
      source_path: typeof window !== 'undefined' ? window.location.pathname : null,
    })

    if (error) {
      // A duplicate email is a harmless re-submission, not a real failure —
      // the unique index on lower(email) means "you're already on the list."
      if (error.code === '23505') {
        setStatus('success')
        return
      }
      setStatus('error')
      setErrorMessage("That didn't go through. Mind trying again in a moment?")
      return
    }

    setStatus('success')
  }

  if (status === 'success') {
    return (
      <div
        className="rounded-2xl p-6 text-center"
        style={{ background: `linear-gradient(135deg, ${brand.warmCream} 0%, ${brand.softSage} 100%)`, border: `2px solid ${brand.sageTeal}` }}
      >
        <CheckCircle2 size={40} style={{ color: brand.sageTeal, margin: '0 auto 12px' }} />
        <p className="text-lg font-semibold" style={{ color: brand.warmEarth }}>
          You're on the list!
        </p>
        <p className="text-sm mt-1" style={{ color: brand.warmEarth, opacity: 0.75 }}>
          We'll email you the moment your family's spot is ready.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4" aria-label="Join the waitlist">
      <div className="grid gap-3 sm:grid-cols-2">
        <input
          type="text"
          placeholder="Your first name (optional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-3 rounded-xl text-sm"
          style={{ border: `2px solid ${brand.softSage}`, backgroundColor: '#ffffff', color: brand.warmEarth }}
        />
        <input
          type="email"
          required
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-3 rounded-xl text-sm"
          style={{ border: `2px solid ${brand.softSage}`, backgroundColor: '#ffffff', color: brand.warmEarth }}
          aria-label="Email address"
        />
      </div>

      <div>
        <p className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: brand.warmEarth, opacity: 0.6 }}>
          What are you most excited about? (optional)
        </p>
        <div className="flex flex-wrap gap-2">
          {PILLAR_OPTIONS.map((opt) => {
            const active = pillars.includes(opt.value)
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => togglePillar(opt.value)}
                className="px-3 py-2 rounded-full text-sm font-medium transition-all"
                style={{
                  border: `2px dashed ${opt.color}`,
                  backgroundColor: active ? opt.color : 'transparent',
                  color: active ? '#ffffff' : brand.warmEarth,
                }}
              >
                {opt.label}
              </button>
            )
          })}
        </div>
      </div>

      {status === 'error' && (
        <p className="text-sm" style={{ color: '#b25a58' }}>
          {errorMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'submitting'}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-semibold text-white transition-transform disabled:opacity-70"
        style={{
          background: `linear-gradient(135deg, ${brand.sageTeal} 0%, ${brand.goldenHoney} 100%)`,
          boxShadow: '0 4px 14px rgba(104, 163, 149, 0.35)',
        }}
      >
        {status === 'submitting' ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
        Join the Waitlist
      </button>
    </form>
  )
}
