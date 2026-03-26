/**
 * Feature Expansion Registry
 * Maps feature keys to their PlannedExpansionCard content.
 * Used by <PlannedExpansionCard featureKey="xxx" /> component.
 *
 * When a feature is built, remove its entry here.
 * The component renders nothing if the key is not found (silent no-op).
 *
 * Every description should sell the vision — these are what judges and users see.
 * Write in present-future tense. Make someone think "I want that."
 */

export interface FeatureExpansionEntry {
  /** Display name for the feature */
  name: string
  /** Compelling description of what the feature will do — sell the vision */
  description: string
  /** Where in the app this feature will appear */
  location_hint: string
}

export const FEATURE_EXPANSION_REGISTRY: Record<string, FeatureExpansionEntry> = {

  // ── Personal Growth ───────────────────────────────────────────────

  guiding_stars: {
    name: 'GuidingStars & BestIntentions',
    description:
      'Define the values and principles that guide your family. Craft personal guiding stars with LiLa\'s help, then set best intentions — daily commitments that keep you aligned with who you want to be. Celebrate every iteration, never punish a miss.',
    location_hint: 'Personal Dashboard, LiLa context',
  },

  innerworkings: {
    name: 'InnerWorkings — Self-Knowledge',
    description:
      'Build a living profile of how you think, communicate, and grow. Upload personality assessments, explore your strengths through guided discovery with LiLa, and share what matters with your partner. The more LiLa knows you, the better she can help.',
    location_hint: 'Personal Dashboard sidebar, LiLa context assembly',
  },

  life_lantern: {
    name: 'LifeLantern — Personal Assessment',
    description:
      'Map where you are across six life areas — family, health, spirituality, education, community, and personal growth. Identify the gaps between your current reality and your vision, then let LiLa help you build bridges. Track your journey with periodic snapshots.',
    location_hint: 'Personal Dashboard, transformation section',
  },

  family_vision_quest: {
    name: 'Family Vision Quest',
    description:
      'Bring your whole family together to dream about who you want to be. Each member contributes their perspective, LiLa synthesizes the themes, and you craft a living family vision statement. Record voice discussions and revisit as your family grows.',
    location_hint: 'Family Hub, transformation section',
  },

  victories: {
    name: 'Victory Recorder & DailyCelebration',
    description:
      'You did 47 things today. Your brain remembers the 3 you didn\'t do. Victory Recorder flips the script — it\'s a ta-da list, not a to-do list. Every completed task, every tracker milestone automatically appears here. Plus manual entries for wins that don\'t live anywhere else: "I didn\'t yell when the milk spilled." LiLa writes you a daily celebration that honors small steps without being fake about it — choose from eight celebration voices.',
    location_hint: 'Personal Dashboard, daily rhythm, family celebration',
  },

  // ── Tasks & Lists ────────────────────────────────────────────────

  tasks: {
    name: 'Tasks, Routines & Opportunities',
    description:
      'A complete task system built for real families. Create tasks with AI-powered Task Breaker that splits big jobs into manageable steps. Set up morning routines with step-by-step checklists. Post "opportunities" that any family member can claim. Assign, track, celebrate — with zero shame for what doesn\'t get done.',
    location_hint: 'All dashboards, bottom nav, family assignment',
  },

  lists: {
    name: 'Lists & Templates',
    description:
      'Six list types for every need — simple lists, checklists, reference lists, templates you can reuse, randomizer lists (spin the wheel for dinner ideas!), and backburner lists for someday-maybe items. Share lists with family members and collaborate in real time.',
    location_hint: 'Personal Dashboard, bottom nav',
  },

  // ── Widgets & Dashboards ─────────────────────────────────────────

  widgets: {
    name: 'Widgets & Trackers',
    description:
      'Nineteen tracker types with 75+ visual variants and 95+ configurations. Track habits, moods, water intake, reading progress, fitness goals — anything you want to measure. Arrange widgets on a drag-and-drop dashboard grid. Kids get special visual trackers like color-reveal images that unveil as they complete tasks.',
    location_hint: 'Personal Dashboard grid layout',
  },

  family_overview: {
    name: 'Family Overview Dashboard',
    description:
      'See your whole family at a glance. Mom\'s bird\'s-eye view shows every member\'s tasks, streaks, upcoming events, and recent victories in customizable columns. Reorder sections, collapse what you don\'t need, and expand what matters most today.',
    location_hint: 'Mom\'s perspective switcher',
  },

  family_hub: {
    name: 'Family Hub',
    description:
      'Your family\'s shared command center. Shared calendar, countdowns to exciting events, rotating photo frames, weather widget, and a family announcement board. The one screen the whole family gathers around — designed for a tablet on the kitchen counter.',
    location_hint: 'Shared family surface, tablet/TV mode',
  },

  tv_mode: {
    name: 'Family Hub — TV Mode',
    description:
      'Turn any screen into your family\'s always-on dashboard. Landscape-locked display designed for TVs and large screens — see the whole family\'s day at a glance from across the room. Auto-rotating sections, large fonts, and ambient mode.',
    location_hint: 'Landscape PWA on TV or large tablet',
  },

  // ── Calendar & Meetings ──────────────────────────────────────────

  calendar: {
    name: 'Family Calendar',
    description:
      'Natural language event creation ("Dentist next Thursday at 2pm for Amelia"), per-member color coding so you see everyone\'s schedule at a glance, and member filter pills to focus on one person\'s day at a time. Category icons for sports, medical, school, and more. Children\'s events require parent approval. Leave-by-time reminders so you\'re never late. Your family\'s chaos, color-coded and searchable.',
    location_hint: 'Bottom nav, all dashboards',
  },

  meetings: {
    name: 'Family Meetings',
    description:
      'Run a weekly family meeting with a pre-built agenda. LiLa captures action items as you talk — "Jake, trash, Tuesdays" becomes a recurring task automatically routed to Jake\'s list. Structured templates for couple check-ins, parent-child conversations, family councils, weekly reviews, and quarterly inventories. The weekly family meeting your family keeps skipping? This makes it actually happen.',
    location_hint: 'Personal Dashboard, family coordination',
  },

  // ── Communication ────────────────────────────────────────────────

  messaging: {
    name: 'Family Messaging',
    description:
      'Private family messaging with conversation spaces for every relationship — couple chat, parent-child, family group, and a Content Corner for sharing links and recommendations. LiLa can join any conversation as a communication coach, helping family members express themselves kindly and clearly.',
    location_hint: 'Bottom nav, all dashboards',
  },

  // ── AI Tools ─────────────────────────────────────────────────────

  thoughtsift: {
    name: 'ThoughtSift — Decision & Thinking Tools',
    description:
      'A suite of five thinking tools: assemble a Board of Directors from historical and fictional advisors who debate your question, shift perspectives through 14 different lenses, use proven decision frameworks like Six Thinking Hats and Eisenhower Matrix, mediate family conversations with structured guidance, and translate your message into different communication styles.',
    location_hint: 'Personal Dashboard, LiLa drawer',
  },

  tool_cyrano: {
    name: 'Cyrano — Romantic Communication',
    description:
      'Channel your inner Cyrano de Bergerac. Give LiLa the raw sentiment you want to express to your partner, and she\'ll craft it into something beautiful — a heartfelt text, a love note, a meaningful toast. Each draft teaches you a communication skill so you grow alongside the tool.',
    location_hint: 'LiLa guided modes, relationship tools',
  },

  tool_higgins: {
    name: 'Higgins — Communication Coach',
    description:
      'Two modes for tough conversations: "What should I say?" helps you find the right words before a difficult talk, and "How do I navigate this?" coaches you through conflict, disagreement, or emotional conversations with empathy and clarity. Context-aware — LiLa knows your family dynamics.',
    location_hint: 'LiLa guided modes, relationship tools',
  },

  safe_harbor: {
    name: 'Safe Harbor — Emotional Processing',
    description:
      'A completely private emotional space for your teens to process hard feelings with LiLa. You cannot see it. It doesn\'t feed into any reports. It\'s exempt from all data aggregation and spousal transparency. Because you love your kids enough to give them space. Parent consent and AI literacy orientation required first — safety is never compromised.',
    location_hint: 'Personal Dashboard, dedicated entry point',
  },

  // ── BookShelf ────────────────────────────────────────────────────

  bookshelf: {
    name: 'BookShelf — Personal Wisdom Library',
    description:
      'You bought 12 parenting books this year. You\'ve finished... one and a half. BookShelf doesn\'t judge. Upload any book you own and LiLa reads it WITH you — or FOR you — extracting principles, declarations, and action steps chapter by chapter. Heart the wisdom that resonates most. Then she turns wisdom into action: a principle becomes a Guiding Star, an action step becomes a Task. And Discussion mode lets you talk through the book like you\'re at the world\'s most patient book club.',
    location_hint: 'Personal Dashboard sidebar, LiLa context, AI Vault',
  },

  // ── Gamification ─────────────────────────────────────────────────

  gamification: {
    name: 'Visual Worlds & Gamification',
    description:
      'Your kids do NOT want to check off chores. But they DO want to open a treasure chest to see what badge they earned. XP for completed tasks. Levels that unlock rewards. Eight reveal animations. Transform your child\'s dashboard into a living world — garden, ocean, space, and kingdom themes where completing tasks grows the scene. And the philosophy is celebration-only — XP goes up, never down. Missing a day doesn\'t punish.',
    location_hint: 'Child dashboards, family celebration',
  },

  // ── Vault ────────────────────────────────────────────────────────

  vault_browse: {
    name: 'AI Vault — Browse & Learn',
    description:
      'A curated library of AI tutorials, prompt packs, creative tools, and skill-building content — all designed for busy moms. Learn to generate custom coloring pages, write with AI assistance, create meal plans, and master prompt engineering. Some tools run right inside MyAIM; others guide you through external platforms with step-by-step instructions.',
    location_hint: 'Bottom nav, AI tools section',
  },

  // ── Family Feeds ─────────────────────────────────────────────────

  family_feeds: {
    name: 'Family Feeds',
    description:
      'A private Instagram for your family. Share moments, document your homeschool day, and let adult kids who\'ve left home stay connected. Voice dump your whole day and LiLa sorts entries per-kid automatically. Portfolio tagging for homeschool documentation. No ads, no algorithms, no strangers. Just your family\'s story, told by the people living it.',
    location_hint: 'Sidebar under Family, family sharing surface',
  },

  // ── MindSweep ────────────────────────────────────────────────────

  mindsweep: {
    name: 'MindSweep — Brain Dump Capture',
    description:
      'Brain dump on steroids. Text it, speak it, forward an email — LiLa sorts EVERYTHING. Three modes: Always Ask, Trust the Obvious, Full Autopilot. That random thought at 2 AM? Voice-capture it. A school flyer? Snap a photo. A forwarded email about soccer practice? Forward it to your MindSweep address. The 11pm brain dump that used to keep you awake? LiLa handles it while you sleep.',
    location_hint: 'PWA entry point, Quick Tasks drawer',
  },

  // ── Caregiving ───────────────────────────────────────────────────

  caregiver_tools: {
    name: 'Caregiver & Co-Parent Tools',
    description:
      'Invite your babysitter with a link. They see the kids\' schedules, tasks, medication, and allergy info — only what you\'ve authorized. They mark things done and add notes. When their shift ends, a report auto-compiles. Co-parents with custody schedules get always-on access during their windows. Access expires automatically.',
    location_hint: 'Special adult shell, mom\'s permission hub',
  },

  // ── Financial & Education ────────────────────────────────────────

  tracking_financial: {
    name: 'Allowance & Financial Tracking',
    description:
      'Set up allowance pools with rules: Jake earns $10/week but only the percentage he completes. 7 of 10 chores = $7. Clean, fair, automated. Three approaches: fixed allowance, task-based earnings, or hybrid. Loan tracking teaches borrowing responsibility. Opportunity earnings let kids claim extra tasks for bonus pay.',
    location_hint: 'Parent dashboard, child dashboard',
  },

  compliance: {
    name: 'Homeschool Compliance & Reporting',
    description:
      'Homeschool reports that write themselves. SDS monthly summaries that used to take hours now take minutes. ESA invoices at EVERY tier. State-aware compliance tracking, standards mapping, portfolio evidence collection, and LiLa-drafted narrative reports. Designed by a founder who writes these reports herself.',
    location_hint: 'Homeschool dashboard, parent reports',
  },

  // ── Safety ───────────────────────────────────────────────────────

  safety_monitoring: {
    name: 'Safety Monitoring',
    description:
      'Invisible, respectful safety monitoring for teen LiLa conversations. Two-layer detection — keyword matching and AI classification — identifies concerning patterns without reading content. Configurable sensitivity per category, weekly pattern summaries, and age-appropriate escalation. Three locked categories (self-harm, abuse, predatory behavior) are always high sensitivity.',
    location_hint: 'Background system, parent notification center',
  },

  // ── Planning ─────────────────────────────────────────────────────

  bigplans: {
    name: 'BigPlans — Project & Goal Planner',
    description:
      'Tell LiLa "I want to homeschool starting in September" and she works backward: what needs to happen by August, July, June... all the way to today\'s first step. Every milestone becomes trackable. Friction detection identifies why you\'re stuck. Five planning modes auto-detected: backward planning, multi-phase projects, system design trials, habit building, and component deployment.',
    location_hint: 'Personal Dashboard, transformation section',
  },

  // ── Rhythms ──────────────────────────────────────────────────────

  rhythms: {
    name: 'Rhythms & Reflections',
    description:
      'Fully customizable morning and evening routines from a library of 28+ section types. Your morning might include: weather, today\'s tasks, a gratitude prompt, and a Guiding Star rotation. Your evening: mood check-in, today\'s victories, and a reflection prompt. Structure that fits YOUR rhythm, not someone else\'s template.',
    location_hint: 'Personal Dashboard, daily flow',
  },

  // ── Infrastructure ───────────────────────────────────────────────

  universal_timer: {
    name: 'Universal Timer',
    description:
      'Track time on any activity with clock-in/out, Pomodoro focus sessions, stopwatch, and countdown modes. A floating bubble follows you across the app so you never lose track. Kids get fun animated visual timers — sand timers, hourglasses, thermometers, arcs, and filling jars — that make time visible and exciting. Perfect for homeschool hour tracking, chore timing, and focus sessions.',
    location_hint: 'Floating bubble in all shells, task cards, widget cards',
  },

  universal_scheduler: {
    name: 'Advanced Scheduling',
    description:
      'Complex recurring schedules for tasks, events, and routines — custody patterns with visual grids, completion-dependent scheduling (flea medicine every 90 days from last dose), seasonal blocks, alternating weeks, and due windows. A mini calendar preview shows exactly which dates are scheduled before you save.',
    location_hint: 'Task creation, calendar, meetings, permissions',
  },

  // ── Admin & Platform ─────────────────────────────────────────────

  admin_console: {
    name: 'Admin Console',
    description:
      'Full platform administration with tabbed sections: system health metrics, AI cost monitoring per family, feedback triage with sentiment analysis, demand validation dashboard showing vote aggregates, and content moderation tools for the AI Vault community.',
    location_hint: 'Admin-only routes',
  },

  offline_pwa: {
    name: 'Offline Mode & PWA',
    description:
      'Full offline capability with background sync. Create tasks, journal entries, and notes without internet — everything queues locally and syncs automatically when you reconnect. Five installable PWA surfaces: personal dashboard, family hub, family TV, MindSweep capture, and Out of Nest family feed.',
    location_hint: 'All surfaces, service worker',
  },

  subscription_tiers: {
    name: 'Subscription & Credits',
    description:
      'Manage your plan, view billing history, purchase AI credit packs, and access founding family benefits. Four tiers from Essential ($9.99/mo) to Creator ($39.99/mo), each unlocking more AI-powered features. Founding families lock in discounted rates for life.',
    location_hint: 'Settings, onboarding flow',
  },

  blog: {
    name: 'AI Magic for Moms — Blog',
    description:
      'A public blog with AI tutorials, free downloadable tools, interactive prompt templates, and resources for moms learning to create with AI. Community engagement through hearts, comments, and content requests. Haiku auto-moderates comments to keep the space warm and positive.',
    location_hint: 'Public website (aimagicformoms.com)',
  },

  // ── Settings & Context ───────────────────────────────────────────

  settings: {
    name: 'Settings & Preferences',
    description:
      'Complete control over your family\'s experience. Manage family members, configure permissions with preset profiles, customize LiLa\'s tone and response length, set notification preferences, export your data, manage email addresses, and configure faith preferences that shape how LiLa references sacred texts and traditions.',
    location_hint: 'Settings overlay, all shells',
  },

  archives: {
    name: 'Archives & Context',
    description:
      'Build rich context about every family member — medical info, school details, dietary needs, personality traits, relationship dynamics. Guided interviews help you capture what matters. Private notes stay invisible to the subject. Everything feeds into LiLa\'s context so she can give truly personalized guidance.',
    location_hint: 'Personal Dashboard, LiLa context assembly',
  },

  family_context: {
    name: 'Family Context & Relationships',
    description:
      'Deep relationship mapping — document how family members interact, what works and what doesn\'t, communication styles, and relationship strengths. Upload IEPs, medical records, and school documents. Monthly data aggregation creates trend reports. Guided interviews with 35+ structured questions build comprehensive family profiles.',
    location_hint: 'Archives section, LiLa context',
  },

  // ── Studio Planned Categories ────────────────────────────────────

  studio_trackers_widgets: {
    name: 'Trackers & Widgets Templates',
    description:
      'Browse and deploy tracker and widget templates directly from Studio. Choose from 19 tracker types with 75+ visual variants — habits, moods, water intake, reading progress, fitness goals. Pick a widget template, customize the visual style and target, and deploy it to any family member\'s dashboard in seconds. Kids get special visual trackers that unveil coloring images as they make progress.',
    location_hint: 'Studio → Trackers & Widgets category',
  },

  // studio_tools removed — tools live in AI Vault (PRD-21A), not Studio

  studio_gamification: {
    name: 'Gamification System Templates',
    description:
      'Choose a visual world theme for each child and customize it before deploying to their dashboard. Dragon Academy, Garden Growth, Ocean Explorer, Space Station, and more. Configure point systems, streak celebrations, treasure box animations, and reward store — all as a cohesive gamification template you can reuse and reassign as your family grows.',
    location_hint: 'Studio → Gamification Systems category',
  },

  // ── Task Prioritization Views (planned) ──────────────────────────

  task_view_big_rocks: {
    name: 'Big Rocks View',
    description:
      'Put the big rocks in first. Stephen Covey\'s time management classic — see your 2-3 major priorities (Big Rocks) visually emphasized above everything else (Gravel). Never let gravel fill your day before the important work is done.',
    location_hint: 'Tasks section, view carousel',
  },

  task_view_ivy_lee: {
    name: 'Ivy Lee Method',
    description:
      'The $25,000 method that transformed industry. Write your 6 most important tasks in priority order. Work on #1 until done, then #2. Move what\'s unfinished to tomorrow. Strict ranked focus with no multitasking allowed — one of the most effective productivity methods ever discovered.',
    location_hint: 'Tasks section, view carousel',
  },

  task_view_abcde: {
    name: 'ABCDE Priority Method',
    description:
      'Brian Tracy\'s five-tier system: A tasks must happen (serious consequences), B tasks should happen (mild consequences), C tasks are nice-to-do, D tasks get delegated (with smart family member suggestions), E tasks get eliminated entirely. Brutal clarity on what actually matters.',
    location_hint: 'Tasks section, view carousel',
  },

  task_view_moscow: {
    name: 'MoSCoW Method',
    description:
      'Project management\'s classic framework adapted for family life: Must Do, Should Do, Could Do, Won\'t Do this cycle. Perfect for curriculum planning, family projects, and any situation where trade-offs need to be clear and explicit. Great for weekly family council planning.',
    location_hint: 'Tasks section, view carousel',
  },

  task_view_impact_effort: {
    name: 'Impact / Effort Matrix',
    description:
      'A 2×2 grid that tells you where to focus your energy. Quick Wins (high impact, low effort) go first. Major Projects get scheduled. Fill-Ins get batched. Thankless Tasks get questioned. See at a glance where your time is actually going — and where it shouldn\'t.',
    location_hint: 'Tasks section, view carousel',
  },

  task_view_by_member: {
    name: 'By Member View',
    description:
      'The family command center view. See every family member\'s tasks in their own column — instantly spot who\'s overloaded, who needs more to do, and how the distribution looks. Drag tasks between members to rebalance. Only available on the Family Overview for mom and permitted adults.',
    location_hint: 'Tasks section, Family Overview',
  },
}
