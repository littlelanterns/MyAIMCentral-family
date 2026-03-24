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
      'This is your Ta-Da list — not a to-do list. Record personal victories big and small, and let LiLa weave them into celebration narratives with eight unique voices, from a proud grandmother to a poetic storyteller. Victories auto-route from completed tasks and milestones.',
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
      'A calendar built for the way families actually schedule. Color-coded by family member, category icons for sports/medical/school, AI-assisted event intake that extracts dates from photos of flyers and emails. Children\'s events require parent approval. Leave-by-time reminders so you\'re never late.',
    location_hint: 'Bottom nav, all dashboards',
  },

  meetings: {
    name: 'Family Meetings',
    description:
      'Structured meeting templates for couple check-ins, parent-child conversations, family councils, weekly reviews, and quarterly family inventories. Each member contributes agenda items beforehand. LiLa facilitates in real time, captures action items, and routes follow-ups to the right features.',
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
      'A completely private space for processing difficult emotions. LiLa acts as a compassionate processing partner — never a therapist, always a bridge toward real human connection. Safe Harbor conversations are exempt from all data aggregation, reports, and spousal transparency. For teens, parent consent and AI literacy orientation are required first.',
    location_hint: 'Personal Dashboard, dedicated entry point',
  },

  // ── BookShelf ────────────────────────────────────────────────────

  bookshelf: {
    name: 'BookShelf — Personal Wisdom Library',
    description:
      'Upload your favorite books and let LiLa extract key insights, principles, frameworks, declarations, and action steps chapter by chapter. Heart the wisdom that resonates most. Build a personal library that LiLa references in your conversations — your books become part of your AI context. Cross-book discussions connect ideas across your entire library.',
    location_hint: 'Personal Dashboard sidebar, LiLa context, AI Vault',
  },

  // ── Gamification ─────────────────────────────────────────────────

  gamification: {
    name: 'Visual Worlds & Gamification',
    description:
      'Transform your child\'s dashboard into a living world. Choose from garden, ocean, space, and kingdom themes where completing tasks grows the scene. Collectible overlay systems — nurture pets, brew potions, build kingdoms — with daily effort earning new items. Configurable point systems, streak celebrations, treasure boxes with reveal animations, and a reward store where kids spend earned points.',
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
    name: 'Family Life Feed',
    description:
      'A private family social network — just for your family. Capture moments with photos, voice recordings, and text. Tag moments as portfolio items for homeschool documentation. Share with Out of Nest family members (grandparents, college kids) through a dedicated feed. LiLa can bulk-summarize a day of learning into a polished family update.',
    location_hint: 'Bottom nav, family sharing surface',
  },

  // ── MindSweep ────────────────────────────────────────────────────

  mindsweep: {
    name: 'MindSweep — Brain Dump Capture',
    description:
      'Voice, text, scan, or email anything into MindSweep and let AI sort it all. That random thought at 2 AM? Voice-capture it. A school flyer? Snap a photo. A forwarded email about soccer practice? Forward it to your MindSweep address. AI auto-routes every item to tasks, calendar, journal, lists, or wherever it belongs — with your approval.',
    location_hint: 'PWA entry point, Quick Tasks drawer',
  },

  // ── Caregiving ───────────────────────────────────────────────────

  caregiver_tools: {
    name: 'Caregiver & Co-Parent Tools',
    description:
      'Purpose-built tools for babysitters, grandparents, and co-parents. Trackable event logging (meals, naps, medications, diapers), shift reports auto-compiled when the caregiver leaves, and custody schedule integration. Special adults see only what mom has authorized, only during their scheduled access windows.',
    location_hint: 'Special adult shell, mom\'s permission hub',
  },

  // ── Financial & Education ────────────────────────────────────────

  tracking_financial: {
    name: 'Allowance & Financial Tracking',
    description:
      'Teach financial literacy through real experience. Set up fixed, task-based, or hybrid allowance systems. Kids earn, save, and spend points or real money. Loan tracking with customizable terms teaches borrowing responsibility. Opportunity earnings let kids claim extra tasks for bonus pay.',
    location_hint: 'Parent dashboard, child dashboard',
  },

  compliance: {
    name: 'Homeschool Compliance & Reporting',
    description:
      'State-aware compliance tracking that takes the stress out of homeschool documentation. Map activities to education standards, auto-generate progress reports, maintain portfolio evidence, and create ESA-compliant invoices. LiLa drafts narrative reports using your actual activity data — you just review and approve.',
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
      'Plan and track ambitious goals with LiLa\'s help. She detects whether you\'re backward-planning from a deadline, tracking a multi-phase project, designing a new family system, or running a trial period — and adapts her guidance accordingly. Friction detection identifies why you\'re stuck and suggests unblocking strategies. Check-ins keep momentum alive.',
    location_hint: 'Personal Dashboard, transformation section',
  },

  // ── Rhythms ──────────────────────────────────────────────────────

  rhythms: {
    name: 'Rhythms & Reflections',
    description:
      'Structure your day with morning and evening rhythms — not rigid routines, but gentle patterns that ground you. Each rhythm includes reflection prompts from a rotating library of 32 questions. Weekly, monthly, and quarterly rhythms help you zoom out and see the bigger picture. LiLa uses your reflections to deepen every future conversation.',
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

  studio_tools: {
    name: 'Tool Templates',
    description:
      'Meal planners, project planners, budget worksheets, homeschool unit planners, and specialized coordination tools — all as ready-to-deploy templates. Browse, customize, and add to any dashboard. Future PRDs (meal planning, project management) will add their templates here automatically.',
    location_hint: 'Studio → Tools category',
  },

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
