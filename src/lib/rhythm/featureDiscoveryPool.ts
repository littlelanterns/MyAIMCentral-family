/**
 * PRD-18 Phase C Enhancement 4: Feature Discovery candidate pool
 *
 * Curated TypeScript constant (not a DB table) containing the features
 * the morning rhythm can nudge the user toward. Each entry specifies:
 *
 *   - feature_key         Unique key used for `feature_discovery_dismissals`
 *                         so dismissals are permanent per member
 *   - display_name        Headline ("Have you tried the Decision Guide?")
 *   - tagline             Body — warm, specific, explains the value
 *   - action_text         Link label ("Try it →")
 *   - action_route        Where the link goes
 *   - icon_key            Lucide icon name
 *   - engagement_event_types / engagement_source_tables
 *                         If any `activity_log_entries` row exists for
 *                         this member in the last 14 days with a matching
 *                         event_type OR source_table, the candidate is
 *                         treated as already-discovered and excluded.
 *                         Either match counts.
 *   - roles_allowed       Which family member roles see this candidate.
 *                         Phase C populates adult + independent; Phase D
 *                         adds teen prioritization + BookShelf-for-school
 *                         framing.
 *
 * Every entry in this pool targets a feature that ALREADY exists today.
 * When a new feature ships, add it here alongside the feature-key/tier
 * registration elsewhere.
 */

import type { FeatureDiscoveryCandidate } from '@/types/rhythms'

export const FEATURE_DISCOVERY_POOL: FeatureDiscoveryCandidate[] = [
  {
    feature_key: 'bookshelf_upload_first',
    display_name: 'Add a book to BookShelf',
    tagline:
      "Upload a book you've read or want to read. Your library becomes the source for morning wisdom and discussions that feel like talking to someone who actually read it.",
    action_text: 'Open BookShelf →',
    action_route: '/bookshelf',
    icon_key: 'BookOpen',
    engagement_event_types: [],
    engagement_source_tables: ['bookshelf_items'],
    audiences: ['adult', 'teen'],
  },
  {
    feature_key: 'thoughtsift_decision_guide',
    display_name: 'Try the Decision Guide',
    tagline:
      "Stuck on a choice? Walk through it with 15 different frameworks — pros/cons, cost/benefit, values alignment, reversibility, and more. Pick whichever fits your decision.",
    action_text: 'Open Decision Guide →',
    action_route: '/thoughtsift/decision-guide',
    icon_key: 'Compass',
    engagement_event_types: [],
    engagement_source_tables: ['lila_conversations'],
    audiences: ['adult', 'teen'],
  },
  {
    feature_key: 'thoughtsift_board_of_directors',
    display_name: 'Convene your Board of Directors',
    tagline:
      "Have a conversation with 3-5 advisors — historical figures, mentors, or people you respect. Each brings their own perspective to whatever you're thinking through.",
    action_text: 'Open Board of Directors →',
    action_route: '/thoughtsift/board-of-directors',
    icon_key: 'Users',
    engagement_event_types: [],
    engagement_source_tables: ['board_sessions'],
    audiences: ['adult', 'teen'],
  },
  {
    feature_key: 'guiding_stars_first',
    display_name: 'Write down a Guiding Star',
    tagline:
      "A value, a declaration, a verse, a line you want to live by. Your Guiding Stars rotate through morning and evening rhythms and quietly shape LiLa's tone.",
    action_text: 'Add a Guiding Star →',
    action_route: '/guiding-stars',
    icon_key: 'Star',
    engagement_event_types: [],
    engagement_source_tables: ['guiding_stars'],
    audiences: ['adult', 'teen'],
  },
  {
    feature_key: 'best_intentions_first',
    display_name: 'Set a Best Intention',
    tagline:
      "Not a goal, not a to-do. A gentle direction — 'be more present at dinner,' 'remember to breathe.' Tap to celebrate when you remember. No shame when you don't.",
    action_text: 'Add an Intention →',
    action_route: '/best-intentions',
    icon_key: 'Heart',
    engagement_event_types: [],
    engagement_source_tables: ['best_intentions'],
    audiences: ['adult', 'teen'],
  },
  {
    feature_key: 'victories_first',
    display_name: 'Record a Victory',
    tagline:
      "The Ta-Da list for the things that went right. One sentence, one moment. Victories accumulate into your Daily Celebration — proof you're doing more than you think.",
    action_text: 'Open Victories →',
    action_route: '/victories',
    icon_key: 'Trophy',
    engagement_event_types: ['victory_recorded'],
    engagement_source_tables: ['victories'],
    audiences: ['adult', 'teen'],
  },
  {
    feature_key: 'widgets_first_tracker',
    display_name: 'Create your first tracker',
    tagline:
      "A simple counter, a streak, a grid — track anything. Water intake, scripture reading, kids' reading minutes, anything you want to make visible. 20+ styles to choose from.",
    action_text: 'Browse trackers →',
    action_route: '/widgets/new',
    icon_key: 'LayoutDashboard',
    engagement_event_types: ['tracker_entry'],
    engagement_source_tables: ['dashboard_widgets'],
    audiences: ['adult', 'teen'],
  },
  {
    feature_key: 'innerworkings_first',
    display_name: 'Tell LiLa about yourself',
    tagline:
      "Your personality, what energizes you, what drains you, how you work best. LiLa uses this to make every response feel like she actually knows you — not a generic chatbot.",
    action_text: 'Open InnerWorkings →',
    action_route: '/innerworkings',
    icon_key: 'Sparkles',
    engagement_event_types: [],
    engagement_source_tables: ['self_knowledge'],
    audiences: ['adult', 'teen'],
  },
  {
    feature_key: 'journal_tagged',
    display_name: 'Try tagged journal entries',
    tagline:
      "One journal, many lenses. Tag entries as gratitude, reflection, kid quips, brain dump — then filter by tag later. No more choosing between 'gratitude journal' and 'regular journal.'",
    action_text: 'Open Journal →',
    action_route: '/journal',
    icon_key: 'NotebookPen',
    engagement_event_types: [],
    engagement_source_tables: ['journal_entries'],
    audiences: ['adult', 'teen'],
  },
  {
    feature_key: 'reflections_past',
    display_name: 'Look back at your reflections',
    tagline:
      "The Past tab shows everything you've answered, grouped by day. It's quietly surprising to see your own patterns over a month — what you've been thinking about, what keeps coming up.",
    action_text: 'Open Reflections →',
    action_route: '/reflections',
    icon_key: 'History',
    engagement_event_types: [],
    engagement_source_tables: ['reflection_responses'],
    audiences: ['adult', 'teen'],
  },
  {
    feature_key: 'calendar_recurring',
    display_name: 'Set a recurring event',
    tagline:
      "Co-op on Tuesdays, therapy every other Friday, karate weekly. Build once, forget about rebuilding. The Calendar's recurrence engine handles weekly, monthly, and custom patterns.",
    action_text: 'Open Calendar →',
    action_route: '/calendar',
    icon_key: 'CalendarClock',
    engagement_event_types: [],
    engagement_source_tables: ['calendar_events'],
    audiences: ['adult', 'teen'],
  },
  {
    feature_key: 'thoughtsift_translator',
    display_name: 'Use the Translator',
    tagline:
      "Rewrite something you need to say — an email, a text, a tough conversation opener — in a different tone. Warmer, firmer, more direct, more gentle. One click.",
    action_text: 'Open Translator →',
    action_route: '/thoughtsift/translator',
    icon_key: 'Languages',
    engagement_event_types: [],
    engagement_source_tables: [],
    audiences: ['adult', 'teen'],
  },
]
