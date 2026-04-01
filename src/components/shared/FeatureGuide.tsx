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
    // Check localStorage first (fast)
    const prefs = getPreferences()
    if (prefs.all_guides_dismissed) return
    if (prefs.dismissed_guides.includes(featureKey)) return

    // Sync from DB if member has saved guide prefs (cross-device)
    if (member?.id && member.preferences) {
      const dbPrefs = (member.preferences as Record<string, unknown>)?.guide_prefs as
        { dismissed_guides?: string[]; all_guides_dismissed?: boolean } | undefined
      if (dbPrefs) {
        if (dbPrefs.all_guides_dismissed) {
          savePreferences({ ...prefs, all_guides_dismissed: true })
          return
        }
        if (dbPrefs.dismissed_guides?.includes(featureKey)) {
          savePreferences({ ...prefs, dismissed_guides: [...new Set([...prefs.dismissed_guides, ...dbPrefs.dismissed_guides])] })
          return
        }
      }
    }

    setVisible(true)
  }, [featureKey, member?.id])

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

        // Persist to DB if member available (fire-and-forget, merge into existing preferences)
        if (member?.id) {
          supabase
            .from('family_members')
            .select('preferences')
            .eq('id', member.id)
            .single()
            .then(({ data }) => {
              const existing = (data?.preferences as Record<string, unknown>) || {}
              return supabase
                .from('family_members')
                .update({
                  preferences: { ...existing, guide_prefs: prefs },
                })
                .eq('id', member.id)
            })
        }
      }, 300)
    },
    [featureKey, member?.id],
  )

  if (!visible || !displayTitle) return null

  return (
    <div
      className={`
        btn-primary relative mb-6 rounded-xl
        p-5 shadow-lg transition-all duration-300
        ${fading ? 'opacity-0 translate-y-[-8px]' : 'opacity-100 translate-y-0'}
      `}
      style={{
        backgroundColor: 'var(--color-btn-primary-bg, #68a395)',
        color: 'var(--color-btn-primary-text, #fff)',
      }}
    >
      <button
        onClick={() => dismiss(false)}
        className="absolute right-3 top-3 rounded-full p-1 transition-colors"
        style={{ color: 'var(--color-btn-primary-text, #fff)', opacity: 0.6 }}
        aria-label="Dismiss guide"
      >
        <X size={16} />
      </button>

      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex-shrink-0 rounded-lg p-2"
          style={{ backgroundColor: 'rgba(255,255,255,0.2)' }}
        >
          <Lightbulb size={20} style={{ color: 'var(--color-btn-primary-text, #fff)' }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3
            className="text-base font-semibold mb-1"
            style={{ color: 'var(--color-btn-primary-text, #fff)' }}
          >
            {displayTitle}
          </h3>
          <p
            className="text-sm leading-relaxed"
            style={{ color: 'var(--color-btn-primary-text, #fff)', opacity: 0.9 }}
          >
            {displayDescription}
          </p>
          {displayBullets && displayBullets.length > 0 && (
            <ul className="mt-2.5 space-y-1">
              {displayBullets.map((bullet, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm"
                  style={{ color: 'var(--color-btn-primary-text, #fff)', opacity: 0.8 }}
                >
                  <span
                    className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full"
                    style={{ backgroundColor: 'var(--color-btn-primary-text, #fff)', opacity: 0.6 }}
                  />
                  {bullet}
                </li>
              ))}
            </ul>
          )}
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={() => dismiss(false)}
              className="rounded-lg px-4 py-1.5 text-sm font-medium transition-colors"
              style={{
                backgroundColor: 'rgba(255,255,255,0.2)',
                color: 'var(--color-btn-primary-text, #fff)',
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              Got it
            </button>
            <button
              onClick={() => dismiss(true)}
              className="text-xs transition-colors"
              style={{ color: 'var(--color-btn-primary-text, #fff)', opacity: 0.5 }}
            >
              Don't show guides
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
