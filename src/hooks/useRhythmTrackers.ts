/**
 * PRD-18 Phase C Enhancement 6: Rhythm Tracker Prompts hook
 *
 * Returns the dashboard widgets for a given member whose `config.rhythm_keys`
 * array contains the current rhythm's key. Used by `RhythmTrackerPromptsSection`
 * to surface trackers inside rhythms — a widget/tracker can be configured to
 * appear in morning, evening, weekly review, or any custom rhythm.
 *
 * The `rhythm_keys` config is a JSONB sub-field inside `dashboard_widgets.config`
 * — NOT a column. Mom sets it via the "Show in rhythms" multi-select in
 * `WidgetConfiguration.tsx`. Default is an empty array (widget does not
 * surface in any rhythm).
 */

import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase/client'

export interface RhythmTrackerWidget {
  id: string
  family_id: string
  family_member_id: string
  title: string
  template_type: string
  visual_variant: string | null
  size: string
  position_x: number | null
  position_y: number | null
  sort_order: number
  widget_config: Record<string, unknown> | null
}

export function useRhythmTrackerWidgets(
  familyId: string | undefined,
  memberId: string | undefined,
  rhythmKey: string | undefined,
) {
  return useQuery({
    queryKey: ['rhythm-tracker-widgets', familyId, memberId, rhythmKey],
    queryFn: async (): Promise<RhythmTrackerWidget[]> => {
      if (!familyId || !memberId || !rhythmKey) return []

      // Supabase's jsonb `?` containment operator isn't directly exposed in
      // the JS client. We use `contains` with a structural object match
      // which translates to `@>`. For JSONB arrays, `config @> '{"rhythm_keys":["morning"]}'`
      // matches when rhythm_keys contains "morning".
      const { data, error } = await supabase
        .from('dashboard_widgets')
        .select('id, family_id, family_member_id, title, template_type, visual_variant, size, position_x, position_y, sort_order, widget_config')
        .eq('family_id', familyId)
        .eq('family_member_id', memberId)
        .is('archived_at', null)
        .contains('widget_config', { rhythm_keys: [rhythmKey] })
        .order('sort_order', { ascending: true })

      if (error) throw error
      return (data ?? []) as RhythmTrackerWidget[]
    },
    enabled: !!familyId && !!memberId && !!rhythmKey,
  })
}
