/**
 * ShoppingModeWidget — 1x1 dashboard widget for Shopping Mode
 * PRD-09B Enhancement
 *
 * Shows total unchecked items across all shopping lists.
 * Tapping opens /shopping-mode.
 */

import { useNavigate } from 'react-router-dom'
import { ShoppingCart } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

interface Props {
  familyId: string
}

export function ShoppingModeWidget({ familyId }: Props) {
  const navigate = useNavigate()

  const { data: count = 0 } = useQuery({
    queryKey: ['shopping-mode-widget-count', familyId],
    queryFn: async () => {
      if (!familyId) return 0

      // Count unchecked, non-archived items across all shopping lists included in shopping mode
      const { data: lists } = await supabase
        .from('lists')
        .select('id')
        .eq('family_id', familyId)
        .eq('list_type', 'shopping')
        .eq('include_in_shopping_mode', true)
        .is('archived_at', null)

      if (!lists || lists.length === 0) return 0

      const listIds = lists.map(l => l.id)

      const { count: itemCount, error } = await supabase
        .from('list_items')
        .select('*', { count: 'exact', head: true })
        .in('list_id', listIds)
        .eq('checked', false)
        .is('archived_at', null)

      if (error) {
        console.warn('[ShoppingModeWidget] count error:', error.message)
        return 0
      }

      return itemCount ?? 0
    },
    enabled: !!familyId,
    staleTime: 1000 * 60 * 2,
  })

  return (
    <button
      onClick={() => navigate('/shopping-mode')}
      className="w-full h-full rounded-xl p-3 flex flex-col items-center justify-center gap-1.5 transition-colors"
      style={{
        backgroundColor: 'var(--color-bg-card)',
        border: '1px solid var(--color-border-default)',
      }}
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center"
        style={{ backgroundColor: 'var(--color-btn-primary-bg)', color: 'var(--color-btn-primary-text)' }}
      >
        <ShoppingCart size={20} />
      </div>
      <span className="text-2xl font-bold" style={{ color: 'var(--color-text-heading)' }}>
        {count}
      </span>
      <span className="text-[10px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>
        items to buy
      </span>
    </button>
  )
}
