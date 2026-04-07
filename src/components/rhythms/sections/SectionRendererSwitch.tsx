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
import { GuidedDayHighlightsSection } from './guided/GuidedDayHighlightsSection'
import { GuidedPrideReflectionSection } from './guided/GuidedPrideReflectionSection'
import { GuidedTomorrowLookAheadSection } from './guided/GuidedTomorrowLookAheadSection'
import { GuidedReflectionsSection } from './guided/GuidedReflectionsSection'
import {
  CompletedMeetingsSection,
  MilestoneCelebrationsSection,
  CarryForwardSection,
  BeforeCloseTheDaySection,
  RhythmTrackerPromptsSection,
  EveningTomorrowCaptureSection,
  MindSweepLiteSection,
  MorningPrioritiesRecallSection,
  OnTheHorizonSection,
  MorningInsightSection,
  FeatureDiscoverySection,
  PeriodicCardsSlot,
} from './StubSections'

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
    case 'calendar_preview':
      return <CalendarPreviewSection />
    case 'brain_dump':
      return (
        <BrainDumpSection
          familyId={familyId}
          memberId={memberId}
          rhythmKey={rhythmKey}
        />
      )
    case 'periodic_cards_slot':
      return <PeriodicCardsSlot />

    // ─── Morning Phase B+ stubs ──────────────────────────
    case 'morning_priorities_recall':
      return <MorningPrioritiesRecallSection />
    case 'on_the_horizon':
      return <OnTheHorizonSection />

    // ─── Morning Phase C+ stubs ──────────────────────────
    case 'morning_insight':
      return <MorningInsightSection />
    case 'feature_discovery':
      return <FeatureDiscoverySection />

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
      return <EveningTomorrowCaptureSection />
    case 'mindsweep_lite':
      return <MindSweepLiteSection />
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
      return <RhythmTrackerPromptsSection />
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
    case 'routine_checklist':
      return null // Wired by Guided/Play shells, not the adult modal

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
