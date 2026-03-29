import { useState, useEffect, useRef } from 'react'
import { Star } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase/client'
import type { DashboardWidget } from '@/types/widgets'

interface Props {
  widget: DashboardWidget
  isCompact?: boolean
}

export function InfoGuidingStarsRotation({ widget }: Props) {
  const navigate = useNavigate()
  const [stars, setStars] = useState<Array<{ id: string; content: string; category: string | null }>>([])
  const [activeIndex, setActiveIndex] = useState(0)
  const intervalMs = ((widget.widget_config?.rotation_interval as number) || 8) * 1000
  const timerRef = useRef<ReturnType<typeof setInterval>>()

  useEffect(() => {
    if (!widget.family_id) return
    const memberId = widget.assigned_member_id || widget.family_member_id
    supabase
      .from('guiding_stars')
      .select('id, content, category')
      .eq('family_id', widget.family_id)
      .eq('member_id', memberId)
      .is('archived_at', null)
      .order('sort_order', { ascending: true })
      .then(({ data }) => { if (data) setStars(data) })
  }, [widget.family_id, widget.family_member_id, widget.assigned_member_id])

  useEffect(() => {
    if (stars.length <= 1) return
    timerRef.current = setInterval(() => {
      setActiveIndex(prev => (prev + 1) % stars.length)
    }, intervalMs)
    return () => clearInterval(timerRef.current)
  }, [stars.length, intervalMs])

  const current = stars[activeIndex]

  return (
    <button
      onClick={() => navigate('/guiding-stars')}
      className="w-full h-full flex flex-col items-center justify-center text-center p-0"
      style={{ background: 'transparent' }}
    >
      <Star size={16} style={{ color: 'var(--color-accent)' }} />
      {current ? (
        <p className="text-xs mt-2 line-clamp-3 px-1" style={{ color: 'var(--color-text-primary)' }}>
          {current.content}
        </p>
      ) : (
        <p className="text-xs mt-2" style={{ color: 'var(--color-text-tertiary)' }}>
          No Guiding Stars yet
        </p>
      )}
      {stars.length > 1 && (
        <div className="flex gap-1 mt-2">
          {stars.map((_, i) => (
            <div
              key={i}
              className="w-1 h-1 rounded-full transition-colors"
              style={{ background: i === activeIndex ? 'var(--color-accent)' : 'var(--color-border-default)' }}
            />
          ))}
        </div>
      )}
    </button>
  )
}
