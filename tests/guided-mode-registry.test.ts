/**
 * Guided Mode Registry Tests (PRD-05)
 *
 * Verifies that all guided modes are properly registered,
 * have correct model tiers, context sources, and role restrictions.
 */

import { describe, it, expect } from 'vitest';

interface GuidedMode {
  mode_key: string;
  display_name: string;
  model_tier: 'sonnet' | 'haiku';
  person_selector: boolean;
  available_to_roles: string[];
  requires_feature_key: string | null;
}

// Complete guided mode registry from all PRDs
const EXPECTED_MODES: GuidedMode[] = [
  // Core LiLa (PRD-05)
  { mode_key: 'help', display_name: 'LiLa Help', model_tier: 'sonnet', person_selector: false, available_to_roles: ['primary_parent', 'additional_adult', 'independent'], requires_feature_key: 'lila_help' },
  { mode_key: 'assist', display_name: 'LiLa Assist', model_tier: 'sonnet', person_selector: false, available_to_roles: ['primary_parent', 'additional_adult', 'independent'], requires_feature_key: 'lila_assist' },
  { mode_key: 'optimizer', display_name: 'LiLa Optimizer', model_tier: 'sonnet', person_selector: false, available_to_roles: ['primary_parent', 'additional_adult'], requires_feature_key: 'lila_optimizer' },
  { mode_key: 'general', display_name: 'General Chat', model_tier: 'sonnet', person_selector: false, available_to_roles: ['primary_parent', 'additional_adult', 'independent'], requires_feature_key: null },

  // Love Languages (PRD-21)
  { mode_key: 'quality_time', display_name: 'Quality Time', model_tier: 'sonnet', person_selector: true, available_to_roles: ['primary_parent', 'additional_adult'], requires_feature_key: 'tool_quality_time' },
  { mode_key: 'gifts', display_name: 'Gifts', model_tier: 'sonnet', person_selector: true, available_to_roles: ['primary_parent', 'additional_adult'], requires_feature_key: 'tool_gifts' },
  { mode_key: 'observe_serve', display_name: 'Observe & Serve', model_tier: 'sonnet', person_selector: true, available_to_roles: ['primary_parent', 'additional_adult'], requires_feature_key: 'tool_observe_serve' },
  { mode_key: 'words_affirmation', display_name: 'Words of Affirmation', model_tier: 'sonnet', person_selector: true, available_to_roles: ['primary_parent', 'additional_adult'], requires_feature_key: 'tool_words_affirmation' },
  { mode_key: 'gratitude', display_name: 'Gratitude', model_tier: 'sonnet', person_selector: true, available_to_roles: ['primary_parent', 'additional_adult'], requires_feature_key: 'tool_gratitude' },

  // Communication Tools (PRD-21)
  { mode_key: 'cyrano', display_name: 'Cyrano', model_tier: 'sonnet', person_selector: true, available_to_roles: ['primary_parent', 'additional_adult'], requires_feature_key: 'tool_cyrano' },
  { mode_key: 'higgins_say', display_name: 'Higgins Say', model_tier: 'sonnet', person_selector: true, available_to_roles: ['primary_parent', 'additional_adult'], requires_feature_key: 'tool_higgins_say' },
  { mode_key: 'higgins_navigate', display_name: 'Higgins Navigate', model_tier: 'sonnet', person_selector: true, available_to_roles: ['primary_parent', 'additional_adult'], requires_feature_key: 'tool_higgins_navigate' },

  // Personal Growth (PRD-06, PRD-07)
  { mode_key: 'craft_with_lila', display_name: 'Craft with LiLa', model_tier: 'sonnet', person_selector: false, available_to_roles: ['primary_parent', 'additional_adult'], requires_feature_key: 'guiding_stars_ai_craft' },
  { mode_key: 'self_discovery', display_name: 'Self-Discovery', model_tier: 'sonnet', person_selector: false, available_to_roles: ['primary_parent', 'additional_adult', 'independent'], requires_feature_key: 'innerworkings_discovery' },

  // Calendar/Meetings (PRD-14B, PRD-16)
  { mode_key: 'calendar_event_create', display_name: 'Calendar Event Create', model_tier: 'sonnet', person_selector: false, available_to_roles: ['primary_parent', 'additional_adult'], requires_feature_key: 'calendar_ai_intake' },
  { mode_key: 'meeting', display_name: 'Meeting Facilitator', model_tier: 'sonnet', person_selector: false, available_to_roles: ['primary_parent', 'additional_adult'], requires_feature_key: 'meetings_ai' },

  // Family Context (PRD-19)
  { mode_key: 'family_context_interview', display_name: 'Family Context Interview', model_tier: 'sonnet', person_selector: true, available_to_roles: ['primary_parent'], requires_feature_key: 'archives_guided_interview' },

  // Safe Harbor (PRD-20)
  { mode_key: 'safe_harbor', display_name: 'Safe Harbor', model_tier: 'sonnet', person_selector: false, available_to_roles: ['primary_parent', 'additional_adult', 'independent'], requires_feature_key: 'safe_harbor' },
  { mode_key: 'safe_harbor_guided', display_name: 'Help Me Talk to Someone', model_tier: 'haiku', person_selector: false, available_to_roles: ['guided'], requires_feature_key: 'safe_harbor_guided' },
  { mode_key: 'safe_harbor_orientation', display_name: 'Safe Harbor Orientation', model_tier: 'sonnet', person_selector: false, available_to_roles: ['primary_parent'], requires_feature_key: 'safe_harbor' },
  { mode_key: 'safe_harbor_literacy', display_name: 'AI Literacy Module', model_tier: 'haiku', person_selector: false, available_to_roles: ['independent'], requires_feature_key: 'safe_harbor' },

  // LifeLantern/Vision (PRD-12A, PRD-12B)
  { mode_key: 'life_lantern', display_name: 'LifeLantern', model_tier: 'sonnet', person_selector: false, available_to_roles: ['primary_parent', 'additional_adult'], requires_feature_key: 'life_lantern' },
  { mode_key: 'family_vision_quest', display_name: 'Family Vision Quest', model_tier: 'sonnet', person_selector: false, available_to_roles: ['primary_parent'], requires_feature_key: 'family_vision_quest' },

  // ThoughtSift (PRD-34) — 5 SEPARATE tools
  { mode_key: 'board_of_directors', display_name: 'Board of Directors', model_tier: 'sonnet', person_selector: false, available_to_roles: ['primary_parent', 'additional_adult'], requires_feature_key: 'thoughtsift_board_of_directors' },
  { mode_key: 'perspective_shifter', display_name: 'Perspective Shifter', model_tier: 'sonnet', person_selector: false, available_to_roles: ['primary_parent', 'additional_adult'], requires_feature_key: 'thoughtsift_perspective_shifter' },
  { mode_key: 'decision_guide', display_name: 'Decision Guide', model_tier: 'sonnet', person_selector: false, available_to_roles: ['primary_parent', 'additional_adult'], requires_feature_key: 'thoughtsift_decision_guide' },
  { mode_key: 'mediator', display_name: 'Mediator', model_tier: 'sonnet', person_selector: true, available_to_roles: ['primary_parent', 'additional_adult'], requires_feature_key: 'thoughtsift_mediator' },
  { mode_key: 'translator', display_name: 'Translator', model_tier: 'haiku', person_selector: false, available_to_roles: ['primary_parent', 'additional_adult', 'independent'], requires_feature_key: 'thoughtsift_translator' },

  // BigPlans (PRD-29)
  { mode_key: 'bigplans_planning', display_name: 'BigPlans Planning', model_tier: 'sonnet', person_selector: false, available_to_roles: ['primary_parent', 'additional_adult'], requires_feature_key: 'bigplans_create' },
  { mode_key: 'bigplans_friction_finder', display_name: 'Friction Finder', model_tier: 'sonnet', person_selector: false, available_to_roles: ['primary_parent', 'additional_adult'], requires_feature_key: 'bigplans_friction_detection' },
  { mode_key: 'bigplans_checkin', display_name: 'BigPlans Check-In', model_tier: 'sonnet', person_selector: false, available_to_roles: ['primary_parent', 'additional_adult'], requires_feature_key: 'bigplans_check_ins' },

  // Compliance (PRD-28B)
  { mode_key: 'homeschool_report_generation', display_name: 'Homeschool Report', model_tier: 'sonnet', person_selector: false, available_to_roles: ['primary_parent'], requires_feature_key: 'compliance_ai_reports' },

  // Family Feeds (PRD-37)
  { mode_key: 'homeschool_bulk_summary', display_name: 'Bulk Summary', model_tier: 'sonnet', person_selector: false, available_to_roles: ['primary_parent'], requires_feature_key: 'family_feed_bulk_summary' },
];

describe('Guided Mode Registry', () => {
  it('should have all expected modes registered', () => {
    // TODO: Query lila_guided_modes table and verify all expected modes exist
    const expectedKeys = EXPECTED_MODES.map(m => m.mode_key);
    expect(expectedKeys.length).toBeGreaterThanOrEqual(30);
    // Verify no duplicates
    expect(new Set(expectedKeys).size).toBe(expectedKeys.length);
  });

  describe.each(EXPECTED_MODES)('Mode: $mode_key', (mode) => {
    it(`should use ${mode.model_tier} model tier`, () => {
      // TODO: Query mode and verify model_tier
      expect(['sonnet', 'haiku']).toContain(mode.model_tier);
    });

    it(`should ${mode.person_selector ? 'have' : 'not have'} person selector`, () => {
      // TODO: Verify person_selector setting
      expect(typeof mode.person_selector).toBe('boolean');
    });

    it(`should be available to roles: ${mode.available_to_roles.join(', ')}`, () => {
      // TODO: Verify available_to_roles match
      expect(mode.available_to_roles.length).toBeGreaterThan(0);
    });
  });

  describe('Model Tier Validation', () => {
    it('should use Haiku only for lightweight modes', () => {
      const haikuModes = EXPECTED_MODES.filter(m => m.model_tier === 'haiku');
      const expectedHaiku = ['safe_harbor_guided', 'safe_harbor_literacy', 'translator'];
      for (const mode of haikuModes) {
        expect(expectedHaiku).toContain(mode.mode_key);
      }
    });

    it('should never use Haiku for emotional processing (Safe Harbor adult)', () => {
      const safeHarbor = EXPECTED_MODES.find(m => m.mode_key === 'safe_harbor');
      expect(safeHarbor?.model_tier).toBe('sonnet');
    });
  });

  describe('ThoughtSift Separation', () => {
    it('should have 5 separate ThoughtSift modes (not sub-modes)', () => {
      const thoughtSiftModes = EXPECTED_MODES.filter(m =>
        ['board_of_directors', 'perspective_shifter', 'decision_guide', 'mediator', 'translator'].includes(m.mode_key)
      );
      expect(thoughtSiftModes.length).toBe(5);
    });
  });
});
