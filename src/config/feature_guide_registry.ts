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
      'Heart entries to include them in LiLa conversations',
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
      '"Growth Areas" — always strength-based framing. Language matters here.',
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
  shift_view: {
    title: 'Your Shift View',
    description:
      'Start and end your care shifts here. Your activity during a shift is logged automatically so mom always has a clear picture of what happened.',
    bullets: [
      'Start a shift when you arrive — end it when you leave',
      'Co-parents with always-on access skip shift tracking entirely',
      'Activity logged during your shift appears here in real time',
    ],
  },
  accept_invite: {
    title: "You've been invited to join a family!",
    description:
      'Create a new account or sign in to your existing one. Once you join, you can start using your family dashboard right away.',
    bullets: [
      'New to MyAIM Central? Create a free account in seconds',
      'Already have an account? Sign in and you\'ll be linked automatically',
      'Your display name was set by your family admin',
    ],
  },
  teen_transparency_panel: {
    title: "What's Shared About You",
    description:
      "This panel shows exactly what each audience can see about you. Mom's access is set by Mom. You can share more with family — but sharing goes one way. Once shared, it stays shared.",
    bullets: [
      'Green check = they can currently see that part of your profile',
      'Gray X = they cannot see it',
      'Tap Share in the Family column to open up a feature to the whole family',
    ],
  },

  tasks_opportunities: {
    title: 'Opportunities & Job Board',
    description:
      'Optional tasks your kids can claim for extra rewards. Repeatable tasks earn points every time. Claimable jobs lock for a time window — complete or release.',
    bullets: [
      'Shared job boards — any eligible kid can claim',
      'Repeatable tasks: unlimited earning, optional daily caps',
      'Capped opportunities: limited total completions',
    ],
  },
  tasks_sequential: {
    title: 'Sequential Collections',
    description:
      'Ordered lists that feed one task at a time. Complete chapter 12, and chapter 13 automatically appears. Reuse across years by reassigning to the next student.',
    bullets: [
      'Type items manually or paste a URL list',
      'Auto-advance, next-day, or manual promotion',
      'Progress tracking: see exactly where each child is',
    ],
  },
  studio_queue: {
    title: 'Review Queue — Your Decision Inbox',
    description:
      'Everything from brain dumps, meetings, LiLa conversations, and kid requests lands here. Process it all in one focused session.',
    bullets: [
      'Calendar approvals, task drafts, and requests in separate tabs',
      'Quick Mode for simple tasks — just name, assignee, and date',
      'Batch processing for groups of related items',
    ],
  },
  task_breaker: {
    title: 'Task Breaker AI',
    description:
      'Overwhelmed by a big task? Break it down into manageable steps. Choose Quick (3-5 steps), Detailed (5-10), or Granular (10-20).',
    bullets: [
      'AI suggests practical, actionable sub-steps',
      'Edit, reorder, or remove before applying',
      'Image mode: take a photo and get cleanup steps (Full Magic)',
    ],
  },

  studio: {
    title: 'Welcome to Studio',
    description:
      "Your template workshop. Browse blank formats across every category — tasks, routines, opportunity boards, guided forms, and list types. Tap [Customize] to build your own version, or pick an Example template to see what a fully-built one looks like. Your customized templates appear in the My Customized tab, ready to deploy to any family member.",
    bullets: [
      'Browse categories and tap [Customize] to start building',
      'Example templates show you fully-built versions for inspiration',
      'Customized templates in My Customized can be deployed, edited, or duplicated',
    ],
  },

  lists_detail: {
    title: 'Your List',
    description:
      'Tap items to check them off. Sections keep things organized by category. Share this list with family members so anyone can add and check items in real time.',
    bullets: [
      'Tap [+ Add Item] to add new items inline',
      'Tap [+ Add Section] to create a grouping header',
      'Tap any item to expand and edit details',
    ],
  },

  // ── Task view intro guides ──────────────────────────────────────
  task_view_intro_big_rocks: {
    title: 'Big Rocks View',
    description: 'Put the most important things in first. Tasks split into Big Rocks (major priorities) and Gravel (everything else).',
  },
  task_view_intro_ivy_lee: {
    title: 'Ivy Lee Method',
    description: 'Rank your top 6 tasks. Work on #1 until it\'s done. Then #2. Nothing else.',
  },
  task_view_intro_abcde: {
    title: 'ABCDE Priority Method',
    description: 'Five levels of priority from A (must do) through E (eliminate). Includes delegation suggestions for D tasks.',
  },
  task_view_intro_moscow: {
    title: 'MoSCoW Method',
    description: 'Must Do, Should Do, Could Do, Won\'t Do. Crystal-clear trade-offs for weekly planning.',
  },
  task_view_intro_impact_effort: {
    title: 'Impact / Effort Matrix',
    description: 'A 2×2 grid showing Quick Wins, Major Projects, Fill-Ins, and Thankless Tasks.',
  },
  task_view_intro_by_member: {
    title: 'By Member View',
    description: 'Every family member\'s tasks in their own column. Spot imbalances instantly.',
  },
};
