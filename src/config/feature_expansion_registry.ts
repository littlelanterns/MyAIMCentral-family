/**
 * Feature Expansion Registry
 * Maps feature keys to their PlannedExpansionCard content.
 * Used by <PlannedExpansionCard featureKey="xxx" /> component.
 *
 * When a feature is built, remove its entry here.
 * The component renders nothing if the key is not found (silent no-op).
 */

export interface FeatureExpansionEntry {
  name: string;
  description: string;
}

export const FEATURE_EXPANSION_REGISTRY: Record<string, FeatureExpansionEntry> = {
  bookshelf: {
    name: 'BookShelf — Personal Library',
    description:
      'Upload books and documents. AI extracts summaries, insights, declarations, and action steps. Cross-book search finds wisdom across your entire library.',
  },
  gamification: {
    name: 'Visual Worlds & Gamification',
    description:
      "Transform your child's dashboard with themed visual worlds, collectible overlay systems (pets, dragons, potions, kingdoms), streaks, rewards, and configurable allowance integration.",
  },
  family_feeds: {
    name: 'Family Life Feed',
    description:
      'A private family social media feed. Capture moments, tag for homeschool portfolios, share with Out of Nest family members.',
  },
  mindsweep: {
    name: 'MindSweep — Brain Dump Capture',
    description:
      'Voice, text, scan, or email anything into MindSweep. AI auto-routes items to tasks, calendar, journal, lists, or wherever they belong.',
  },
  safety_monitoring: {
    name: 'Safety Monitoring',
    description:
      'Invisible keyword and AI-powered monitoring for teen accounts. Weekly pattern summaries for parents. Safety concern protocol with appropriate escalation.',
  },
  admin_console: {
    name: 'Admin Console',
    description:
      'Platform administration: user management, AI cost monitoring, feedback review, demand validation dashboard, and system health metrics.',
  },
  offline_pwa: {
    name: 'Offline Mode',
    description:
      'Full offline capability with background sync. Create tasks, journal entries, and notes without internet. Everything syncs when you reconnect.',
  },
  subscription_tiers: {
    name: 'Subscription Management',
    description:
      'Manage your plan, view billing history, purchase AI credit packs, generate ESA-compliant invoices, and access founding family benefits.',
  },
  bigplans: {
    name: 'BigPlans — Project Planner',
    description:
      'Plan and track long-term goals, multi-step projects, and family initiatives. LiLa detects your planning type and guides you through backward planning, project tracking, or system design.',
  },
  universal_timer: {
    name: 'Universal Timer',
    description:
      'Focus timers, Pomodoro sessions, cooking timers, and countdowns usable across any feature. Floating bubble keeps the timer visible.',
  },
  universal_scheduler: {
    name: 'Advanced Scheduling',
    description:
      'Complex recurring schedules for tasks, events, and routines. Supports custody schedules, rotating assignments, and irregular patterns.',
  },
  tv_mode: {
    name: 'Family Hub — TV Mode',
    description:
      "Landscape display mode for your Family Hub on a TV or large screen. See the whole family's day at a glance from across the room.",
  },
  blog: {
    name: 'AI Magic for Moms Blog',
    description:
      'Public blog with AI tutorials, free tools, and resources for moms learning to create with AI.',
  },
};
