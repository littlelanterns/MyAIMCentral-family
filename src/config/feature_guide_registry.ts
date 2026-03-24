/**
 * Feature Guide Registry
 * Maps feature keys to their FeatureGuide content.
 * Used by <FeatureGuide featureKey="xxx" /> component.
 */

export interface FeatureGuideEntry {
  title: string;
  description: string;
  bullets?: string[];
}

export const FEATURE_GUIDE_REGISTRY: Record<string, FeatureGuideEntry> = {
  guiding_stars: {
    title: 'Your Guiding Stars',
    description:
      'Guiding Stars are the values, declarations, and vision statements that define who you are and who you want to become. They anchor everything LiLa does for you.',
    bullets: [
      'Add values, declarations, scripture, or vision statements',
      'LiLa uses these as context for every conversation',
      'Toggle AI inclusion per entry with the toggle switch',
    ],
  },
  best_intentions: {
    title: 'Best Intentions',
    description:
      'Best Intentions are the commitments you want to live by — not resolutions that shame you, but honest "I\'m choosing to..." statements you celebrate every time you honor.',
    bullets: [
      'Tap to celebrate each time you honor an intention',
      'Track streaks and patterns over time',
      'LiLa weaves your intentions into conversations when relevant',
    ],
  },
  inner_workings: {
    title: 'InnerWorkings — Know Yourself',
    description:
      'InnerWorkings is your self-knowledge library. Personality types, strengths, growth areas, and the patterns that make you uniquely you.',
    bullets: [
      'Enter insights manually or upload assessment results',
      'Discover more about yourself with LiLa\'s guided exploration',
      '"Growth Areas" — never weaknesses. Language matters here.',
    ],
  },
  journal: {
    title: 'Your Journal',
    description:
      'A private space for reflection, gratitude, and capturing thoughts. Journal entries feed LiLa\'s understanding of your life when you choose to include them.',
    bullets: [
      'Write via the Smart Notepad — tap + to start',
      'Filter by type: reflections, gratitude, kid quips, and more',
      'Toggle AI inclusion per entry',
    ],
  },
  tasks: {
    title: 'Tasks & Routines',
    description:
      'Your family\'s task management system. Simple tasks, structured routines, opportunity jobs, and sequential collections — all in one place.',
    bullets: [
      'Create tasks manually or receive them from Smart Notepad routing',
      'Assign to family members with approval workflows',
      'Multiple views: Simple List, Now/Next/Optional, By Category, and more',
    ],
  },
  lists: {
    title: 'Lists',
    description:
      'Shopping lists, wishlists, packing lists, reference lists, and more. Share with family members and promote items to tasks when needed.',
    bullets: [
      'Multiple list types with smart formatting',
      'Share lists with family members',
      'Promote list items to tasks with one tap',
    ],
  },
  dashboard: {
    title: 'Your Dashboard',
    description:
      'Your personal command center. See today\'s tasks, upcoming events, and quick actions — all customizable to your workflow.',
    bullets: [
      'Drag sections to reorder your view',
      'Quick actions in the strip above',
      'Greeting rotates through your Guiding Stars',
    ],
  },
  notepad: {
    title: 'Smart Notepad',
    description:
      'Your always-available capture space. Write, speak, or paste anything — then route it to the right place with Review & Route.',
    bullets: [
      'Multiple tabs for parallel thoughts',
      'Voice-to-text input',
      'Review & Route extracts and sends content to Tasks, Calendar, Journal, and more',
    ],
  },
  archives: {
    title: 'Archives — Family Context',
    description:
      'The knowledge engine behind LiLa. Archives store everything LiLa needs to know about your family — preferences, schedules, personalities, and more.',
    bullets: [
      'Per-member context folders with smart categories',
      'Three-tier AI inclusion toggles (person, category, item)',
      'Privacy Filtered items are never shared with LiLa for non-mom members',
    ],
  },
  lila: {
    title: 'Meet LiLa — Your Processing Partner',
    description:
      'LiLa (Little Lanterns) is your AI processing partner. She helps you think, plan, communicate, and grow — always as a partner, never a friend or therapist.',
    bullets: [
      'Four modes: Help, Assist, Optimizer, and General Chat',
      'Every AI suggestion offers Edit / Approve / Regenerate / Reject',
      'LiLa uses your Guiding Stars, InnerWorkings, and Archives as context',
    ],
  },
};
