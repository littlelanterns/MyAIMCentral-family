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

import type {
  MorningInsightAudience,
  RhythmAudience,
  RhythmSection,
} from '@/types/rhythms'
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
import { MindSweepLiteTeenSection } from './MindSweepLiteTeenSection'
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
  /**
   * PRD-18 Phase D (Enhancement 7) — rhythm audience variant. Forwarded
   * from RhythmModal, derived from the rendered member's dashboard_mode.
   * Teen-aware sections read this (or `section.config.variant/audience`)
   * to fork their framing/content. Defaults to 'adult'.
   */
  audience?: RhythmAudience
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
  audience = 'adult',
  reflectionCount = 3,
  readingSupport,
}: Props) {
  if (!section.enabled) return null

  // Phase D (Enhancement 7): for section types that have teen-specific
  // framing defaults, section.config can explicitly override framing
  // via `framingText`. When unset, fall back to the audience-aware
  // default (teen = ownership language, adult = the original wording).
  // This gives mom the option to override per-section later without
  // a code change.
  const cfgFramingText =
    typeof (section.config as { framingText?: unknown })?.framingText === 'string'
      ? ((section.config as { framingText: string }).framingText)
      : undefined

  switch (section.section_type) {
    // ─── Morning core (Phase A) ──────────────────────────
    case 'guiding_star_rotation': {
      // Phase D: teen morning shows "You said this matters to you:"
      // instead of adult "Remember who you are." Seeded via config.
      // Teen audience also acts as a fallback framing selector if the
      // seed is missing the explicit string (e.g. manually-created
      // configs in Rhythms Settings).
      const framingText =
        cfgFramingText ??
        (audience === 'teen' ? 'You said this matters to you:' : undefined)
      return (
        <GuidingStarRotationSection
          memberId={memberId}
          rhythmKey={rhythmKey}
          framingText={framingText}
        />
      )
    }
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
    case 'morning_insight': {
      // Phase D (Enhancement 7): audience resolved from either the
      // explicit config.audience marker (set in the teen morning seed)
      // OR the derived audience prop from dashboard_mode. Teen audience
      // pulls from the 15-question teen pool instead of the 20-question
      // adult pool.
      const cfgAud = (section.config as { audience?: string } | undefined)?.audience
      const insightAudience: MorningInsightAudience =
        cfgAud === 'teen' || audience === 'teen' ? 'teen' : 'adult'
      return (
        <MorningInsightSection
          familyId={familyId}
          memberId={memberId}
          readingSupport={readingSupport}
          audience={insightAudience}
        />
      )
    }
    case 'feature_discovery': {
      // Phase D (Enhancement 7): teen audience prioritizes school-use
      // entries via the feature discovery pool filter in the hook.
      const cfgAud = (section.config as { audience?: string } | undefined)?.audience
      const discoveryAudience: 'adult' | 'teen' =
        cfgAud === 'teen' || audience === 'teen' ? 'teen' : 'adult'
      return (
        <FeatureDiscoverySection
          familyId={familyId}
          memberId={memberId}
          audience={discoveryAudience}
        />
      )
    }

    // ─── Evening core (Phase A) ──────────────────────────
    case 'evening_greeting': {
      // Phase D (Enhancement 7): teen variant uses looser ownership
      // framing ("Hey [Name], how'd today go?"). Seeded via config.variant
      // on the teen evening seed — audience prop is the safety fallback.
      const cfgVariant = (section.config as { variant?: string } | undefined)?.variant
      const greetingVariant: 'adult' | 'teen' =
        cfgVariant === 'teen' || audience === 'teen' ? 'teen' : 'adult'
      return <EveningGreetingSection variant={greetingVariant} />
    }
    case 'accomplishments_victories': {
      // Phase D: teen variant renders header as "What went right today"
      // instead of "Today's Wins". Seeded via config.title, falls back
      // to audience default if unset.
      const cfgTitle = (section.config as { title?: string } | undefined)?.title
      const victoriesTitle =
        cfgTitle ??
        (audience === 'teen' ? 'What went right today' : undefined)
      return (
        <AccomplishmentsVictoriesSection
          memberId={memberId}
          title={victoriesTitle}
        />
      )
    }
    case 'completed_meetings':
      return <CompletedMeetingsSection />
    case 'milestone_celebrations':
      return <MilestoneCelebrationsSection />
    case 'carry_forward':
      return <CarryForwardSection />
    case 'evening_tomorrow_capture':
      return <EveningTomorrowCaptureSection familyId={familyId} memberId={memberId} />
    case 'mindsweep_lite': {
      const cfg = section.config as
        | { collapsed_by_default?: boolean; audience?: string }
        | undefined
      // Phase D (Enhancement 7): teens get a purpose-built sibling
      // component with a 4-option dropdown (Schedule / Journal about it /
      // Talk to someone / Let it go) and teen copy. Audience is resolved
      // from EITHER the explicit config.audience marker (set in the teen
      // evening seed) OR the derived audience prop from dashboard_mode.
      // The config marker wins when present so mom can explicitly
      // assign a teen variant via Rhythms Settings later. NEVER uses
      // family_request — teen talk_to_someone writes a private journal
      // note the teen sees themselves.
      const isTeen = cfg?.audience === 'teen' || audience === 'teen'
      if (isTeen) {
        return (
          <MindSweepLiteTeenSection
            familyId={familyId}
            memberId={memberId}
            readingSupport={readingSupport}
            collapsedByDefault={cfg?.collapsed_by_default ?? true}
          />
        )
      }
      return (
        <MindSweepLiteSection
          familyId={familyId}
          memberId={memberId}
          readingSupport={readingSupport}
          collapsedByDefault={cfg?.collapsed_by_default ?? true}
        />
      )
    }
    case 'closing_thought': {
      // Phase D (Enhancement 7): teen evening shows "Something you
      // believe:" as identity reinforcement in the teen's own voice.
      // Adult default = no label (moment of stillness). Seeded via
      // config.framingText; audience acts as a fallback selector.
      // Reuses the top-of-switch cfgFramingText helper.
      const framingText =
        cfgFramingText ??
        (audience === 'teen' ? 'Something you believe:' : undefined)
      return <ClosingThoughtSection memberId={memberId} framingText={framingText} />
    }
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
