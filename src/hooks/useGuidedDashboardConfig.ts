/**
 * PRD-25: Guided Dashboard config hook
 * Wraps dashboard_configs with Guided-specific defaults.
 * Auto-creates config on first access.
 */

import { useEffect, useMemo, useCallback, useRef } from 'react'
import { useDashboardConfig, useUpdateDashboardConfig } from './useDashboardConfig'
import {
  GUIDED_PREFERENCES_DEFAULTS,
  GUIDED_DEFAULT_SECTIONS,
  getGuidedSections,
  reorderGuidedSections,
} from '@/types/guided-dashboard'
import type { GuidedDashboardPreferences, GuidedSectionConfig, GuidedSectionKey } from '@/types/guided-dashboard'

export function useGuidedDashboardConfig(
  familyId: string | undefined,
  memberId: string | undefined
) {
  const { data: config, isLoading } = useDashboardConfig(familyId, memberId, 'personal')
  const updateConfig = useUpdateDashboardConfig()
  const autoCreatedRef = useRef(false)

  // Auto-create config with guided defaults on first access.
  // Fires once per mount. If it fails (RLS, missing constraint), it won't retry.
  useEffect(() => {
    if (!familyId || !memberId || isLoading || autoCreatedRef.current) return
    if (config) { autoCreatedRef.current = true; return } // Already exists
    autoCreatedRef.current = true
    updateConfig.mutate({
      familyId,
      memberId,
      dashboardType: 'personal',
      layout: { sections: GUIDED_DEFAULT_SECTIONS },
      preferences: GUIDED_PREFERENCES_DEFAULTS as unknown as Record<string, unknown>,
    }, { onError: () => { /* silently ignore — PIN-only members may lack RLS access */ } })
  }, [familyId, memberId, isLoading]) // eslint-disable-line react-hooks/exhaustive-deps

  const sections = useMemo(
    () => getGuidedSections(config?.layout as Record<string, unknown> | null),
    [config?.layout]
  )

  const preferences = useMemo((): GuidedDashboardPreferences => {
    const prefs = (config?.preferences ?? {}) as Record<string, unknown>
    return { ...GUIDED_PREFERENCES_DEFAULTS, ...prefs }
  }, [config?.preferences])

  const updatePreference = useCallback(
    <K extends keyof GuidedDashboardPreferences>(
      key: K,
      value: GuidedDashboardPreferences[K]
    ) => {
      if (!familyId || !memberId) return
      const currentPrefs = (config?.preferences ?? {}) as Record<string, unknown>
      updateConfig.mutate({
        familyId,
        memberId,
        dashboardType: 'personal',
        preferences: { ...currentPrefs, [key]: value },
      })
    },
    [familyId, memberId, config?.preferences, updateConfig]
  )

  const updateSections = useCallback(
    (updated: GuidedSectionConfig[]) => {
      if (!familyId || !memberId) return
      const currentLayout = (config?.layout ?? {}) as Record<string, unknown>
      updateConfig.mutate({
        familyId,
        memberId,
        dashboardType: 'personal',
        layout: { ...currentLayout, sections: updated },
      })
    },
    [familyId, memberId, config?.layout, updateConfig]
  )

  const handleReorderSections = useCallback(
    (activeKey: GuidedSectionKey, overKey: GuidedSectionKey) => {
      const updated = reorderGuidedSections(sections, activeKey, overKey)
      updateSections(updated)
    },
    [sections, updateSections]
  )

  const handleToggleVisibility = useCallback(
    (key: GuidedSectionKey) => {
      const section = sections.find(s => s.key === key)
      if (!section) return
      const updated = sections.map(s =>
        s.key === key ? { ...s, visible: !s.visible } : s
      )
      updateSections(updated)
    },
    [sections, updateSections]
  )

  const handleToggleCollapse = useCallback(
    (key: GuidedSectionKey) => {
      const section = sections.find(s => s.key === key)
      if (!section) return
      const updated = sections.map(s =>
        s.key === key ? { ...s, collapsed: !s.collapsed } : s
      )
      updateSections(updated)
    },
    [sections, updateSections]
  )

  return {
    config,
    isLoading,
    sections,
    preferences,
    updatePreference,
    updateSections,
    handleReorderSections,
    handleToggleVisibility,
    handleToggleCollapse,
  }
}
