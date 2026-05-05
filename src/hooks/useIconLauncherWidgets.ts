import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'
import type { DashboardWidget } from '@/types/widgets'

export interface IconLauncherWidget extends DashboardWidget {
  widget_config: {
    linked_list_id: string
    icon_asset_key: string
    icon_variant: string
    display_label: string
    display_mode: 'random' | 'browse' | 'sequential_browse'
    visual_style?: 'icon_card' | 'text_button'
  }
}

export function useIconLauncherWidgets(
  familyId: string | undefined,
  memberId: string | undefined,
) {
  return useQuery({
    queryKey: ['icon-launcher-widgets', familyId, memberId],
    queryFn: async () => {
      if (!familyId || !memberId) return []

      const { data, error } = await supabase
        .from('dashboard_widgets')
        .select('*')
        .eq('family_id', familyId)
        .eq('family_member_id', memberId)
        .eq('template_type', 'icon_launcher')
        .eq('is_active', true)
        .eq('is_on_dashboard', true)
        .is('archived_at', null)
        .order('sort_order', { ascending: true })

      if (error) throw error
      return (data ?? []) as IconLauncherWidget[]
    },
    enabled: !!familyId && !!memberId,
  })
}

export function useIconLauncherIcon(
  featureKey: string | undefined,
  variant: string | undefined,
) {
  return useQuery({
    queryKey: ['platform-asset-icon', featureKey, variant],
    queryFn: async () => {
      if (!featureKey) return null

      const { data } = await supabase
        .from('platform_assets')
        .select('size_128_url')
        .eq('feature_key', featureKey)
        .eq('variant', variant ?? 'A')
        .maybeSingle()

      return data?.size_128_url ?? null
    },
    enabled: !!featureKey,
    staleTime: 1000 * 60 * 30,
  })
}
