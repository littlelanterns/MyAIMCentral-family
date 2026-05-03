/**
 * PRD-25: Guided Dashboard
 * Purpose-built dashboard for Guided members (ages 8-12).
 * 7 sections rendered from dashboard_configs.layout.sections.
 */

import { useMemo } from 'react'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useViewAs } from '@/lib/permissions/ViewAsProvider'
import { useGuidedDashboardConfig } from '@/hooks/useGuidedDashboardConfig'
import { FeatureGuide } from '@/components/shared'
import {
  GuidedGreetingSection,
  GuidedBestIntentionsSection,
  GuidedCalendarSection,
  GuidedActiveTasksSection,
  GuidedWidgetGrid,
  CelebrateSection,
} from '@/components/guided'
import { GuidedThingsToTalkAboutSection } from '@/components/guided/GuidedThingsToTalkAboutSection'
import { RhythmDashboardCard } from '@/components/rhythms/RhythmDashboardCard'
import { ColorRevealTallyWidget } from '@/components/coloring-reveal/ColorRevealTallyWidget'
import { useMemberColoringReveals } from '@/hooks/useColoringReveals'
import { useGamificationConfig } from '@/hooks/useGamificationSettings'
import { useTasks } from '@/hooks/useTasks'
import { DashboardSectionWrapper } from '@/components/dashboard'
import type { SectionKey } from '@/components/dashboard'
import type { GuidedSectionKey } from '@/types/guided-dashboard'

interface GuidedDashboardProps {
  isViewAsOverlay?: boolean
}

export function GuidedDashboard({ isViewAsOverlay }: GuidedDashboardProps) {
  const { data: member } = useFamilyMember()
  const { data: family } = useFamily()
  const { viewingAsMember } = useViewAs()

  const displayMember = isViewAsOverlay && viewingAsMember ? viewingAsMember : member
  const displayMemberId = displayMember?.id
  const displayFamilyId = family?.id

  const {
    sections,
    preferences,
    handleToggleCollapse,
  } = useGuidedDashboardConfig(displayFamilyId, displayMemberId)

  // Member data for gamification indicators
  const memberData = displayMember as Record<string, unknown> | undefined
  const points = (memberData?.gamification_points as number) ?? 0
  const streak = (memberData?.current_streak as number) ?? 0
  const readingSupport = preferences.reading_support_enabled

  // Build M Phase 5: Coloring reveal tally widgets (gamification opt-in)
  const { data: gamConfig } = useGamificationConfig(displayMemberId)
  const { data: colorReveals = [] } = useMemberColoringReveals(
    gamConfig?.enabled ? displayMemberId : undefined,
  )
  const taskLinkedReveals = useMemo(
    () => colorReveals.filter(r => r.earning_source_id && !r.is_complete && r.is_active),
    [colorReveals],
  )
  const { data: revealLinkedTasks = [] } = useTasks(
    taskLinkedReveals.length > 0 ? displayFamilyId : undefined,
    { assigneeId: displayMemberId },
  )

  // Visible sections sorted by order
  const visibleSections = useMemo(
    () => sections.filter(s => s.visible).sort((a, b) => a.order - b.order),
    [sections]
  )

  function renderSection(key: GuidedSectionKey) {
    switch (key) {
      case 'greeting':
        return displayMemberId && displayFamilyId ? (
          <GuidedGreetingSection
            memberName={displayMember?.display_name ?? 'Friend'}
            memberId={displayMemberId}
            familyId={displayFamilyId}
            points={points}
            streak={streak}
            readingSupport={readingSupport}
          />
        ) : null

      case 'best_intentions':
        return displayMemberId && displayFamilyId ? (
          <GuidedBestIntentionsSection
            memberId={displayMemberId}
            familyId={displayFamilyId}
            preferences={preferences}
            readingSupport={readingSupport}
          />
        ) : null

      case 'next_best_thing':
        // Disabled per founder request (2026-05-03): pulling from unassigned/inactive tasks.
        // Re-enable when the suggestion engine is scoped to assigned+active tasks only.
        return null

      case 'calendar':
        return displayMemberId ? (
          <GuidedCalendarSection memberId={displayMemberId} />
        ) : null

      case 'active_tasks':
        return displayFamilyId && displayMemberId ? (
          <GuidedActiveTasksSection
            familyId={displayFamilyId}
            memberId={displayMemberId}
            preferences={preferences}
            readingSupport={readingSupport}
          />
        ) : null

      case 'widget_grid':
        return displayFamilyId && displayMemberId ? (
          <GuidedWidgetGrid
            familyId={displayFamilyId}
            memberId={displayMemberId}
          />
        ) : null

      // PRD-18: mini evening rhythm for Guided renders OUTSIDE the section
      // loop at position 0. See the JSX below. Auto-managed — never in the
      // saved layout, never reorderable, never hideable.

      case 'things_to_talk_about':
        return displayFamilyId && displayMemberId ? (
          <GuidedThingsToTalkAboutSection
            familyId={displayFamilyId}
            memberId={displayMemberId}
            readingSupport={readingSupport}
          />
        ) : null

      case 'celebrate':
        return <CelebrateSection />

      default:
        return null
    }
  }

  return (
    <div
      className={`density-compact max-w-2xl mx-auto space-y-4 ${
        readingSupport ? 'guided-reading-support' : ''
      }`}
      style={{ padding: '0.5rem 0 2rem 0' }}
    >
      <FeatureGuide featureKey="guided_dashboard" />

      {/* PRD-18: morning + evening rhythms for Guided. Both render at
          position 0 (above all sections including greeting), outside the
          section system. Each card self-hides when outside its time
          window AND no completion exists. Coexists with the Celebrate
          button below — same kid, different moments. */}
      {displayFamilyId && displayMemberId && (
        <>
          <RhythmDashboardCard
            familyId={displayFamilyId}
            memberId={displayMemberId}
            rhythmKey="morning"
            readingSupport={readingSupport}
          />
          <RhythmDashboardCard
            familyId={displayFamilyId}
            memberId={displayMemberId}
            rhythmKey="evening"
            readingSupport={readingSupport}
          />
        </>
      )}

      {/* Build M Phase 5: Coloring reveal tally widgets */}
      {taskLinkedReveals.map(reveal => (
        <ColorRevealTallyWidget
          key={reveal.id}
          reveal={reveal}
          linkedTask={revealLinkedTasks.find(t => t.id === reveal.earning_source_id)}
          memberId={displayMemberId ?? ''}
        />
      ))}

      {visibleSections.map(section => {
        const key = section.key as GuidedSectionKey

        // Greeting, NBT, and Things to Talk About render without section wrapper
        // (they don't need collapse/drag and aren't in the adult SECTION_META registry)
        if (key === 'greeting' || key === 'next_best_thing' || key === 'things_to_talk_about') {
          return (
            <div key={key}>
              {renderSection(key)}
            </div>
          )
        }

        // Other sections use the collapsible wrapper
        return (
          <DashboardSectionWrapper
            key={key}
            sectionKey={key as SectionKey}
            collapsed={section.collapsed}
            visible={section.visible}
            isEditMode={false}
            onToggleCollapse={() => handleToggleCollapse(key)}
            onToggleVisibility={() => {}}
          >
            {renderSection(key)}
          </DashboardSectionWrapper>
        )
      })}
    </div>
  )
}
