/**
 * PRD-18: Section Renderer Switch
 *
 * Maps a RhythmSection (from rhythm_configs.sections JSONB) to its
 * renderer component. New section types require only a new component
 * + a case in this switch — no migration.
 *
 * Sections that auto-hide (return null) when their data is empty
 * disappear silently from the rhythm modal. Stub sections render
 * compact upcoming-feature placeholders so the narrative arc stays
 * intact even before later phases ship.
 */

import type { RhythmSection } from '@/types/rhythms'
import { GuidingStarRotationSection } from './GuidingStarRotationSection'
import { BestIntentionsFocusSection } from './BestIntentionsFocusSection'
import { TaskPreviewSection } from './TaskPreviewSection'
import { CalendarPreviewSection } from './CalendarPreviewSection'
import { BrainDumpSection } from './BrainDumpSection'
import { EveningGreetingSection } from './EveningGreetingSection'
import { AccomplishmentsVictoriesSection } from './AccomplishmentsVictoriesSection'
import { ClosingThoughtSection } from './ClosingThoughtSection'
import { FromYourLibrarySection } from './FromYourLibrarySection'
import { ReflectionsSection } from './ReflectionsSection'
import { EveningTomorrowCaptureSection } from './EveningTomorrowCaptureSection'
import { MorningPrioritiesRecallSection } from './MorningPrioritiesRecallSection'
import { OnTheHorizonSection } from './OnTheHorizonSection'
import { PeriodicCardsSlot } from './PeriodicCardsSlot'
import { MindSweepLiteSection } from './MindSweepLiteSection'
import { MorningInsightSection } from './MorningInsightSection'
import { FeatureDiscoverySection } from './FeatureDiscoverySection'
import { RhythmTrackerPromptsSection } from './RhythmTrackerPromptsSection'
import { GuidedDayHighlightsSection } from './guided/GuidedDayHighlightsSection'
import { GuidedPrideReflectionSection } from './guided/GuidedPrideReflectionSection'
import { GuidedTomorrowLookAheadSection } from './guided/GuidedTomorrowLookAheadSection'
import { GuidedReflectionsSection } from './guided/GuidedReflectionsSection'
import { GuidedEncouragingMessageSection } from './guided/GuidedEncouragingMessageSection'
import {
  CompletedMeetingsSection,
  MilestoneCelebrationsSection,
  CarryForwardSection,
  BeforeCloseTheDaySection,
} from './StubSections'
import type { OnTheHorizonConfig } from '@/types/rhythms'

interface Props {
  section: RhythmSection
  rhythmKey: string
  familyId: string
  memberId: string
  /** Reflection guideline count from rhythm_configs (defaults to 3). */
  reflectionCount?: number
  /** Reading Support enabled (Guided shell preference). */
  readingSupport?: boolean
}

export function SectionRendererSwitch({
  section,
  rhythmKey,
  familyId,
  memberId,
  reflectionCount = 3,
  readingSupport,
}: Props) {
  if (!section.enabled) return null

  switch (section.section_type) {
    // ─── Morning core (Phase A) ──────────────────────────
    case 'guiding_star_rotation':
      return <GuidingStarRotationSection memberId={memberId} rhythmKey={rhythmKey} />
    case 'best_intentions_focus':
      return <BestIntentionsFocusSection familyId={familyId} memberId={memberId} />
    case 'task_preview':
      return <TaskPreviewSection familyId={familyId} memberId={memberId} />
    case 'calendar_preview': {
      // Founder rule: 'family' scope for adults (mom needs to see
      // everything), 'member' scope for Independent/Guided/Play (only
      // events the member attends). Stored per-section in
      // rhythm_configs.sections[*].config.scope so mom can override
      // from Rhythms Settings later without code changes. Default 'family'.
      const cfg = section.config as { scope?: 'family' | 'member' } | undefined
      return (
        <CalendarPreviewSection
          scope={cfg?.scope ?? 'family'}
          memberId={memberId}
        />
      )
    }
    case 'brain_dump':
      return (
        <BrainDumpSection
          familyId={familyId}
          memberId={memberId}
          rhythmKey={rhythmKey}
        />
      )
    case 'periodic_cards_slot':
      return <PeriodicCardsSlot familyId={familyId} memberId={memberId} />

    // ─── Morning Phase B (wired) ─────────────────────────
    case 'morning_priorities_recall':
      return <MorningPrioritiesRecallSection familyId={familyId} memberId={memberId} />
    case 'on_the_horizon':
      return (
        <OnTheHorizonSection
          familyId={familyId}
          memberId={memberId}
          config={section.config as OnTheHorizonConfig | undefined}
        />
      )

    // ─── Morning Phase C ─────────────────────────────────
    case 'morning_insight':
      return (
        <MorningInsightSection
          familyId={familyId}
          memberId={memberId}
          readingSupport={readingSupport}
        />
      )
    case 'feature_discovery':
      return (
        <FeatureDiscoverySection
          familyId={familyId}
          memberId={memberId}
        />
      )

    // ─── Evening core (Phase A) ──────────────────────────
    case 'evening_greeting':
      return <EveningGreetingSection />
    case 'accomplishments_victories':
      return <AccomplishmentsVictoriesSection memberId={memberId} />
    case 'completed_meetings':
      return <CompletedMeetingsSection />
    case 'milestone_celebrations':
      return <MilestoneCelebrationsSection />
    case 'carry_forward':
      return <CarryForwardSection />
    case 'evening_tomorrow_capture':
      return <EveningTomorrowCaptureSection familyId={familyId} memberId={memberId} />
    case 'mindsweep_lite': {
      const cfg = section.config as { collapsed_by_default?: boolean } | undefined
      return (
        <MindSweepLiteSection
          familyId={familyId}
          memberId={memberId}
          readingSupport={readingSupport}
          collapsedByDefault={cfg?.collapsed_by_default ?? true}
        />
      )
    }
    case 'closing_thought':
      return <ClosingThoughtSection memberId={memberId} />
    case 'from_your_library':
      return <FromYourLibrarySection memberId={memberId} />
    case 'before_close_the_day':
      return <BeforeCloseTheDaySection />
    case 'reflections':
      return (
        <ReflectionsSection
          familyId={familyId}
          memberId={memberId}
          count={reflectionCount}
        />
      )
    case 'rhythm_tracker_prompts':
      return (
        <RhythmTrackerPromptsSection
          familyId={familyId}
          memberId={memberId}
          rhythmKey={rhythmKey}
        />
      )
    case 'close_my_day':
      // close_my_day is rendered as the modal action bar, not a section
      return null

    // ─── Periodic rhythm sections (Phase B) ──────────────
    case 'weekly_stats':
    case 'top_victories':
    case 'next_week_preview':
    case 'weekly_reflection_prompt':
    case 'weekly_review_deep_dive':
    case 'month_at_a_glance':
    case 'highlight_reel':
    case 'reports_link':
    case 'monthly_review_deep_dive':
    case 'stale_areas':
    case 'quick_win_suggestion':
    case 'lifelantern_launch_link':
      return null // Phase B builds these

    // ─── Kid template sections ───────────────────────────
    case 'encouraging_message':
      return (
        <GuidedEncouragingMessageSection
          familyId={familyId}
          memberId={memberId}
          readingSupport={readingSupport}
        />
      )
    case 'routine_checklist':
      // Routines surface on the Guided dashboard's Active Tasks
      // section already (PRD-25). Showing them again inside the
      // morning rhythm is duplication, not value. Section type
      // stays in the registry for future custom rhythm building
      // but is not seeded into Guided morning anymore (migration
      // 100111 removes it from new + existing Guided members).
      return null

    // ─── Guided evening rhythm sections (PRD-18 Phase A addition) ───
    case 'guided_day_highlights':
      return <GuidedDayHighlightsSection memberId={memberId} readingSupport={readingSupport} />
    case 'guided_pride_reflection':
      return (
        <GuidedPrideReflectionSection
          familyId={familyId}
          memberId={memberId}
          readingSupport={readingSupport}
        />
      )
    case 'guided_tomorrow_lookahead':
      return (
        <GuidedTomorrowLookAheadSection
          familyId={familyId}
          memberId={memberId}
          readingSupport={readingSupport}
        />
      )
    case 'guided_reflections':
      return (
        <GuidedReflectionsSection
          familyId={familyId}
          memberId={memberId}
          readingSupport={readingSupport}
        />
      )

    default:
      return null
  }
}
