/**
 * PRD-25: Guided Dashboard
 * Purpose-built dashboard for Guided members (ages 8-12).
 * 7 sections rendered from dashboard_configs.layout.sections.
 */

import { useMemo } from 'react'
import { useFamilyMember } from '@/hooks/useFamilyMember'
import { useFamily } from '@/hooks/useFamily'
import { useEffectiveMember } from '@/hooks/useEffectiveMember'
import { useGuidedDashboardConfig } from '@/hooks/useGuidedDashboardConfig'
import { FeatureGuide } from '@/components/shared'
import {
  GuidedGreetingSection,
  GuidedBestIntentionsSection,
  GuidedCalendarSection,
  GuidedActiveTasksSection,
  GuidedWidgetGrid,
  CelebrateSection,
  NextBestThingCard,
} from '@/components/guided'
import { GuidedThingsToTalkAboutSection } from '@/components/guided/GuidedThingsToTalkAboutSection'
import { GuidedActivitySection } from '@/components/guided/GuidedActivitySection'
import { RhythmDashboardCard } from '@/components/rhythms/RhythmDashboardCard'
import { ColorRevealTallyWidget } from '@/components/coloring-reveal/ColorRevealTallyWidget'
import { useMemberColoringReveals } from '@/hooks/useColoringReveals'
import { useGamificationConfig } from '@/hooks/useGamificationSettings'
import { useMemberStreak } from '@/hooks/useMemberStreak'
import { useMemberPointsToday } from '@/hooks/useMemberPointsToday'
import { useNBTEngine } from '@/hooks/useNBTEngine'
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
  const { member: effectiveMember } = useEffectiveMember()

  const displayMember = isViewAsOverlay ? effectiveMember : member
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
  // CLIENT-DATE-REMEDIATION revised W4: family_members.current_streak has been
  // dead since migration 100221 dropped the RPC that wrote it — read the live
  // computed streak instead (see useMemberStreak.ts).
  const { data: memberStreak } = useMemberStreak(displayMemberId)
  const streak = memberStreak?.currentStreak ?? 0
  const readingSupport = preferences.reading_support_enabled

  // Build M Phase 5: Coloring reveal tally widgets (gamification opt-in)
  const { data: gamConfig } = useGamificationConfig(displayMemberId)
  // GDCX Slice 2 (edge case, PRD-25 §Edge Cases "Member with Gamification
  // Disabled"): header indicators must hide entirely when gamification is
  // off, not merely when points/streak happen to be 0 — an explicit check
  // instead of the previous value>0-only gate.
  const gamificationEnabled = gamConfig?.enabled === true
  // PRD-24 Point Economy Addendum §5.6 (rider 2): daily points goal.
  const dailyGoal = gamConfig?.daily_points_goal ?? null
  const { data: pointsToday } = useMemberPointsToday(dailyGoal != null ? displayMemberId : undefined)
  // GDCX Slice 1: Next Best Thing engine — re-enabled after the root-cause
  // day-scheduling fix in useNBTEngine.ts (Convention #126).
  const nbt = useNBTEngine(displayFamilyId, displayMemberId)
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
            dailyGoal={dailyGoal}
            pointsToday={pointsToday ?? 0}
            gamificationEnabled={gamificationEnabled}
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
        // GDCX Slice 1 (2026-07): re-enabled. Was disabled 2026-05-03 because
        // the engine suggested tasks not actually scheduled for today (e.g. an
        // MWF routine on a Tuesday) — root cause was a missing day-scheduling
        // filter, fixed in useNBTEngine.ts. Founder-eyes-on-verified (Convention
        // #277 Claude-driven tour) that the day-scheduling bug no longer
        // reproduces before this flip.
        return displayMemberId && displayFamilyId ? (
          <NextBestThingCard
            suggestion={nbt.currentSuggestion}
            onAdvance={nbt.advance}
            isEmpty={nbt.isEmpty}
            isLoading={nbt.isLoading}
            memberName={displayMember?.display_name ?? 'Friend'}
            streakCount={streak}
            familyId={displayFamilyId}
            memberId={displayMemberId}
            readingSupport={readingSupport}
            totalSuggestions={nbt.suggestions.length}
            currentIndex={nbt.currentIndex}
          />
        ) : null

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

      case 'activity_list':
        return displayFamilyId && displayMemberId ? (
          <GuidedActivitySection
            familyId={displayFamilyId}
            memberId={displayMemberId}
            readingSupport={readingSupport}
          />
        ) : null

      case 'things_to_talk_about':
        return displayFamilyId && displayMemberId ? (
          <GuidedThingsToTalkAboutSection
            familyId={displayFamilyId}
            memberId={displayMemberId}
            readingSupport={readingSupport}
          />
        ) : null

      case 'celebrate':
        return (
          <CelebrateSection
            reflectionsEnabled={preferences.reflections_in_celebration}
            reflectionDailyCount={preferences.reflection_daily_count}
            readingSupport={readingSupport}
          />
        )

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
