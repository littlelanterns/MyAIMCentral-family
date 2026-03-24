import { useState, useEffect, useCallback } from 'react'
import { X, Lightbulb } from 'lucide-react'
import { FEATURE_GUIDE_REGISTRY } from '@/config/feature_guide_registry'
import { supabase } from '@/lib/supabase/client'
import { useFamilyMember } from '@/hooks/useFamilyMember'

interface FeatureGuideProps {
  featureKey: string
  title?: string
  description?: string
  bullets?: string[]
}

function getPreferences(): { dismissed_guides: string[]; all_guides_dismissed: boolean } {
  try {
    const raw = localStorage.getItem('myaim_guide_prefs')
    if (raw) return JSON.parse(raw)
  } catch {
    // fall through
  }
  return { dismissed_guides: [], all_guides_dismissed: false }
}

function savePreferences(prefs: { dismissed_guides: string[]; all_guides_dismissed: boolean }) {
  localStorage.setItem('myaim_guide_prefs', JSON.stringify(prefs))
}

export function FeatureGuide({ featureKey, title, description, bullets }: FeatureGuideProps) {
  const { data: member } = useFamilyMember()
  const [visible, setVisible] = useState(false)
  const [fading, setFading] = useState(false)

  const registryEntry = FEATURE_GUIDE_REGISTRY[featureKey]
  const displayTitle = title ?? registryEntry?.title
  const displayDescription = description ?? registryEntry?.description
  const displayBullets = bullets ?? registryEntry?.bullets

  useEffect(() => {
    const prefs = getPreferences()
    if (prefs.all_guides_dismissed) return
    if (prefs.dismissed_guides.includes(featureKey)) return
    setVisible(true)
  }, [featureKey])

  const dismiss = useCallback(
    (dismissAll: boolean) => {
      setFading(true)
      setTimeout(() => {
        setVisible(false)
        const prefs = getPreferences()
        if (dismissAll) {
          prefs.all_guides_dismissed = true
        } else {
          if (!prefs.dismissed_guides.includes(featureKey)) {
            prefs.dismissed_guides.push(featureKey)
          }
        }
        savePreferences(prefs)

        // Persist to DB if member available (fire-and-forget)
        if (member?.id) {
          supabase
            .from('family_members')
            .update({
              preferences: prefs,
            })
            .eq('id', member.id)
            .then(() => {})
        }
      }, 300)
    },
    [featureKey, member?.id],
  )

  if (!visible || !displayTitle) return null

  return (
    <div
      className={`
        relative mb-6 rounded-xl border border-[var(--color-sage-teal)]/20
        bg-gradient-to-r from-[var(--color-soft-sage)]/30 to-[var(--color-sage-teal)]/10
        p-5 shadow-sm transition-all duration-300
        ${fading ? 'opacity-0 translate-y-[-8px]' : 'opacity-100 translate-y-0'}
      `}
    >
      <button
        onClick={() => dismiss(false)}
        className="absolute right-3 top-3 rounded-full p-1 text-[var(--color-warm-earth)]/50 hover:bg-[var(--color-warm-earth)]/10 hover:text-[var(--color-warm-earth)] transition-colors"
        aria-label="Dismiss guide"
      >
        <X size={16} />
      </button>

      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex-shrink-0 rounded-lg bg-[var(--color-sage-teal)]/15 p-2">
          <Lightbulb size={20} className="text-[var(--color-sage-teal)]" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-[var(--color-warm-earth)] mb-1">
            {displayTitle}
          </h3>
          <p className="text-sm text-[var(--color-warm-earth)]/70 leading-relaxed">
            {displayDescription}
          </p>
          {displayBullets && displayBullets.length > 0 && (
            <ul className="mt-2.5 space-y-1">
              {displayBullets.map((bullet, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-[var(--color-warm-earth)]/60"
                >
                  <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[var(--color-sage-teal)]/40" />
                  {bullet}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={() => dismiss(false)}
              className="rounded-lg bg-[var(--color-sage-teal)] px-4 py-1.5 text-sm font-medium text-white hover:bg-[var(--color-deep-ocean)] transition-colors"
            >
              Got it
            </button>
            <button
              onClick={() => dismiss(true)}
              className="text-xs text-[var(--color-warm-earth)]/40 hover:text-[var(--color-warm-earth)]/60 transition-colors"
            >
              Don't show guides
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
