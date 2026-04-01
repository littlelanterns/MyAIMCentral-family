/**
 * PRD-25: Guided Dashboard Greeting Section
 * Shows personalized greeting, Guiding Stars rotation, and gamification indicators.
 */

import { useState, useEffect, useRef } from 'react'
import { Star, Flame, Volume2 } from 'lucide-react'
import { supabase } from '@/lib/supabase/client'

interface GuidedGreetingSectionProps {
  memberName: string
  memberId: string
  familyId: string
  points: number
  streak: number
  readingSupport: boolean
}

export function GuidedGreetingSection({
  memberName,
  memberId,
  familyId,
  points,
  streak,
  readingSupport,
}: GuidedGreetingSectionProps) {
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  // Guiding Stars rotation
  const [stars, setStars] = useState<Array<{ id: string; content: string }>>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const [fading, setFading] = useState(false)
  const timerRef = useRef<ReturnType<typeof setInterval>>(undefined)

  useEffect(() => {
    if (!familyId || !memberId) return
    supabase
      .from('guiding_stars')
      .select('id, content')
      .eq('family_id', familyId)
      .eq('member_id', memberId)
      .eq('is_included_in_ai', true)
      .is('archived_at', null)
      .order('sort_order', { ascending: true })
      .then(({ data }) => { if (data) setStars(data) })
  }, [familyId, memberId])

  useEffect(() => {
    if (stars.length <= 1) return
    timerRef.current = setInterval(() => {
      setFading(true)
      setTimeout(() => {
        setActiveIndex(prev => (prev + 1) % stars.length)
        setFading(false)
      }, 400)
    }, 30_000)
    return () => clearInterval(timerRef.current)
  }, [stars.length])

  const currentStar = stars[activeIndex]

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.rate = 0.9
      window.speechSynthesis.speak(utterance)
    }
  }

  return (
    <div>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1
              className="text-xl font-bold"
              style={{
                color: 'var(--color-text-heading)',
                fontFamily: 'var(--font-display, var(--font-heading))',
              }}
            >
              {greeting}, {memberName}!
            </h1>
            {readingSupport && (
              <button
                onClick={() => speak(`${greeting}, ${memberName}`)}
                className="reading-support-tts p-1 rounded-full"
                style={{ color: 'var(--color-text-secondary)', background: 'transparent', minHeight: 'unset' }}
              >
                <Volume2 size={16} />
              </button>
            )}
          </div>
          {currentStar && (
            <p
              className="text-sm mt-1 transition-opacity duration-400"
              style={{
                color: 'var(--color-text-secondary)',
                fontFamily: 'var(--font-body, var(--font-sans))',
                fontStyle: 'italic',
                opacity: fading ? 0 : 1,
              }}
            >
              &ldquo;{currentStar.content}&rdquo;
            </p>
          )}
        </div>

        {/* Gamification indicators */}
        <div className="flex items-center gap-3 shrink-0">
          {points > 0 && (
            <div className="flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
              <Star size={16} style={{ color: 'var(--color-accent-warm, var(--color-btn-primary-bg))' }} />
              <span className="text-sm font-medium">{points}</span>
            </div>
          )}
          {streak > 0 && (
            <div className="flex items-center gap-1" style={{ color: 'var(--color-text-secondary)' }}>
              <Flame size={16} style={{ color: 'var(--color-accent-warm, #f59e0b)' }} />
              <span className="text-sm font-medium">{streak}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
