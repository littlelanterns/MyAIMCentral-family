/**
 * Lantern's Path Data — Single Source of Truth
 *
 * Powers: Lantern's Path page, Guided Intro Tour, FeatureGuide cards,
 * PlannedExpansionCards, and LiLa Assist context.
 *
 * Every feature description should be enthusiastic and desire-building.
 * Lead with the pain point, end with the emotional payoff.
 */

export type FeatureStatus = 'built' | 'in_production'

export interface SubTool {
  name: string
  brief: string
  detail: string
}

/** What the tour "Show me" button should trigger */
export interface TourAction {
  /** 'navigate' = go to route, 'tool' = open LiLa tool modal, 'lila' = open LiLa drawer in mode, 'notepad' = open Smart Notepad */
  type: 'navigate' | 'tool' | 'lila' | 'notepad'
  /** Route to navigate to (for 'navigate' type) */
  route?: string
  /** LiLa tool mode key (for 'tool' type — opens ToolConversationModal) */
  toolModeKey?: string
  /** LiLa drawer mode (for 'lila' type — opens drawer in help/assist/general/optimizer) */
  lilaMode?: string
}

export interface JourneyFeature {
  /** Internal key matching feature_expansion_registry / feature_guide_registry */
  key: string
  /** PRD number for reference */
  prdNumber: string
  /** Display name */
  name: string
  /** Lucide icon name */
  iconName: string
  /** Route path (null for in-production features) */
  route: string | null
  /** Built or in production */
  status: FeatureStatus
  /** Enthusiastic description — 2-3 sentences, lead with pain, end with payoff */
  description: string
  /** How this feature connects to the rest of the platform */
  connections: string
  /** What to look forward to (for in-production features) */
  lookForward?: string
  /** Specific things to try (for built features) */
  miniPrompts?: string[]
  /** Sub-tools within this feature */
  subTools?: SubTool[]
  /** One-sentence hook for tour cards */
  tourHook?: string
  /** Specific tour instruction */
  tourInstruction?: string
  /** What the tour "Show me" button should do (if omitted, navigates to route) */
  tourAction?: TourAction
}

export interface JourneyStage {
  number: number
  title: string
  subtitle: string
  narrative: string
  features: JourneyFeature[]
}

export const JOURNEY_STAGES: JourneyStage[] = [
  // ── Stage 1 ─────────────────────────────────────────────────
  {
    number: 1,
    title: 'Light Your First Lantern',
    subtitle: 'Your Values & Self-Knowledge',
    narrative:
      'Before anything else becomes personal, LiLa needs to know what matters to you. Your Guiding Stars are the honest declarations about who you\'re choosing to become. Your InnerWorkings are the patterns, strengths, and growth areas that make you uniquely you. Together, they transform LiLa from a generic chatbot into a partner who understands your family\'s soul.',
    features: [
      {
        key: 'guiding_stars',
        prdNumber: 'PRD-06',
        name: 'Guiding Stars & Best Intentions',
        iconName: 'Star',
        route: '/guiding-stars',
        status: 'built',
        description:
          'What if the AI that helps you plan your week actually knew what mattered to you? Not your calendar — your SOUL. Guiding Stars are the honest declarations about who you\'re choosing to become. Not "I am a patient mother" (when you just yelled about shoes). More like "I choose to lead with patience, even on the hard days." Real. Honest. True right now. And Best Intentions are the tiny daily actions that prove those stars aren\'t just words. Every time LiLa gives you advice, she checks it against your stars first.',
        connections: 'LiLa references your Guiding Stars in every conversation. Best Intention iterations automatically become Victories. Archives surfaces these for family context.',
        miniPrompts: [
          'Write your first Guiding Star — start with "I choose..." or "I am learning to..."',
          'Set one Best Intention for this week and tap to celebrate when you honor it',
        ],
        subTools: [
          {
            name: 'Craft with LiLa',
            brief: 'AI-guided declaration writing',
            detail: 'Tell LiLa what matters to you in plain language, and she\'ll help you craft it into a powerful Guiding Star declaration. She draws from your InnerWorkings and existing stars to make each one deeply personal.',
          },
          {
            name: 'Best Intentions Tally',
            brief: 'Daily tracking without guilt',
            detail: 'Tap to celebrate each time you honor an intention. Track streaks and patterns over time — but if you miss a day, the counter doesn\'t shame you. Fresh Reset means every period starts clean.',
          },
        ],
        tourHook: 'Define who you\'re becoming — then let LiLa help you live it.',
        tourInstruction: 'Try typing: "I choose to be fully present with my kids, even when the house is chaos."',
        tourAction: { type: 'navigate', route: '/guiding-stars' },
      },
      {
        key: 'innerworkings',
        prdNumber: 'PRD-07',
        name: 'InnerWorkings — My Foundation',
        iconName: 'Heart',
        route: '/inner-workings',
        status: 'built',
        description:
          'Ever wish the people in your life actually understood HOW to talk to you? InnerWorkings teaches LiLa exactly that — your communication style, your conflict patterns, your love language, your strengths, the way you process hard news. Built through real conversation, not personality quizzes (though you can upload those too). The result? Every AI interaction feels like talking to someone who genuinely gets you. Because she does.',
        connections: 'LiLa uses your InnerWorkings as core context for every conversation. Archives aggregates self-knowledge entries. Growth areas use strength-based framing — always.',
        miniPrompts: [
          'Add a personality insight — your Enneagram type, MBTI, or anything you know about how you think',
          'Start a guided self-discovery conversation with LiLa',
        ],
        tourHook: 'Give LiLa the context to truly understand how you think.',
        tourInstruction: 'Try starting a conversation with LiLa about how you handle conflict.',
        tourAction: { type: 'lila', lilaMode: 'general', route: '/inner-workings' },
      },
    ],
  },

  // ── Stage 2 ─────────────────────────────────────────────────
  {
    number: 2,
    title: 'Meet Your Processing Partner',
    subtitle: 'LiLa — The AI That Knows Your Family',
    narrative:
      'LiLa isn\'t a chatbot. She\'s a processing partner who knows your Guiding Stars, your family dynamics, your communication style, and the specific challenges you\'re navigating right now. She\'ll never pretend to be your friend or therapist — but she\'ll help you think more clearly, communicate more kindly, and plan more realistically than any generic AI ever could.',
    features: [
      {
        key: 'lila',
        prdNumber: 'PRD-05',
        name: 'LiLa — Your Processing Partner',
        iconName: 'Sparkles',
        route: '/dashboard',
        status: 'built',
        description:
          'LiLa isn\'t an assistant — she\'s three. LiLa Help handles the "how do I?" stuff. LiLa Assist discovers features you didn\'t know existed. And underneath it all, LiLa remembers: your values, your family dynamics, your kid\'s therapy schedule, your husband\'s communication style, the goal you set last month. She pulls it all together so every response actually fits YOUR life. And the most important part? Human-in-the-Mix means you ALWAYS have the final say. Edit. Approve. Regenerate. Reject. Nothing saves without your thumbs-up.',
        connections: 'LiLa draws from Guiding Stars, InnerWorkings, Archives, and page context. Help mode checks known issues before calling AI. Optimizer mode uses your context to enhance prompts for any AI platform.',
        miniPrompts: [
          'Ask LiLa: "What do you know about my family so far?"',
          'Try Help mode: "How do I create a routine for my kids?"',
        ],
        subTools: [
          {
            name: 'LiLa Help',
            brief: 'Customer support that checks known issues first',
            detail: 'Before spending AI credits, Help mode checks 13 FAQ patterns against your question. If there\'s a match, you get an instant answer at zero cost. If not, LiLa handles it with full platform knowledge.',
          },
          {
            name: 'LiLa Assist',
            brief: 'Step-by-step feature guidance',
            detail: 'Contextual guidance for whatever page you\'re on. Ask "What can I do here?" and LiLa explains the feature, suggests what to try first, and walks you through it.',
          },
          {
            name: 'LiLa Optimizer',
            brief: 'Prompt enhancement with family context',
            detail: 'Paste any prompt and LiLa enhances it with your family context, communication style, and values. The result works better in ChatGPT, Claude, Gemini — anywhere.',
          },
        ],
        tourHook: 'The AI that actually knows your family.',
        tourInstruction: 'Try asking: "What do you know about my family so far?"',
        tourAction: { type: 'lila', lilaMode: 'general' },
      },
    ],
  },

  // ── Stage 3 ─────────────────────────────────────────────────
  {
    number: 3,
    title: 'Capture Everything, Lose Nothing',
    subtitle: 'Smart Notepad & Journal',
    narrative:
      'You have a thought at 11 PM. A grocery list forming while driving. Three things from a podcast you want to remember. The Smart Notepad catches everything — text, voice, brain dumps — and Review & Route sends each piece to exactly where it belongs. The Journal is your private reflection space, fed by the Notepad, never a direct writing surface.',
    features: [
      {
        key: 'notepad',
        prdNumber: 'PRD-08',
        name: 'Smart Notepad',
        iconName: 'FileText',
        route: '/dashboard',
        status: 'built',
        description:
          'It\'s 11pm. Your brain won\'t shut off. "Ruthie needs her OT evaluation rescheduled. Jordan needs poster board. I should really tell Mark how much Saturday meant to me." With Smart Notepad, you dump it ALL in one place — type it, speak it, whatever — and walk away. Tomorrow, tap Review & Route and LiLa sorts it: calendar event, shopping list, heartfelt message. One brain dump, three organized outcomes. You captured the chaos. LiLa made it make sense.',
        connections: 'Routes to Tasks, Journal, Calendar, Lists, Guiding Stars, InnerWorkings, and more via RoutingStrip. Auto-titles tabs with Haiku. Journal\'s + button opens Notepad.',
        miniPrompts: [
          'Dump three things on your mind, then tap Review & Route',
          'Try voice input — tap the microphone and talk through your day',
        ],
        tourHook: 'Capture everything, route it anywhere.',
        tourInstruction: 'Try dumping three things on your mind, then tap Review & Route.',
        tourAction: { type: 'notepad' },
      },
      {
        key: 'journal',
        prdNumber: 'PRD-08',
        name: 'Journal',
        iconName: 'BookOpen',
        route: '/journal',
        status: 'built',
        description:
          'Eleven entry types for every kind of reflection — gratitude, kid quips, meeting notes, brain dumps, commonplace entries, and more. Filter by type to see just your gratitude entries or just your commonplace wisdom. Every entry can be included in LiLa\'s context or kept private. Journal is not a direct writing surface — the Notepad captures, the Journal preserves.',
        connections: 'Receives entries from Smart Notepad routing. Entries with AI inclusion feed LiLa context. Tags enable filtered views. Reflections connect to Rhythms.',
        miniPrompts: [
          'Write a gratitude entry — what went right today?',
          'Record a kid quip — something funny or wise your child said',
        ],
        tourHook: 'Your private reflection space with eleven entry types.',
        tourInstruction: 'Write a gratitude entry about something that went right today.',
      },
    ],
  },

  // ── Stage 4 ─────────────────────────────────────────────────
  {
    number: 4,
    title: 'Turn Intentions into Action',
    subtitle: 'Tasks, Routines & Lists',
    narrative:
      'You know what matters (Guiding Stars). You\'ve captured what needs doing (Notepad). Now turn it all into action. Tasks aren\'t just checkboxes — they\'re routines with step-by-step checklists, opportunities kids can claim for rewards, sequential collections that drip-feed one task at a time, and AI-powered Task Breaker that decomposes "clean the garage" into 12 manageable steps.',
    features: [
      {
        key: 'tasks',
        prdNumber: 'PRD-09A',
        name: 'Tasks, Routines & Opportunities',
        iconName: 'CheckSquare',
        route: '/tasks',
        status: 'built',
        description:
          'You think "someone needs to do that" 47 times a day. Tasks catches every single one. Create in 3 seconds. AI breaks it into steps. Assign it to the right kid. Watch it flow. Recurring routines track themselves — morning routine with 8 steps, and your kid checks them off one by one. Sequential collections advance like a curriculum. Claimable opportunities turn chores into a game: post it, first kid to claim it earns the reward. And thirteen different views mean YOUR brain picks how to see the work. Because not everyone thinks in checkboxes.',
        connections: 'Receives items from Smart Notepad, Studio Queue, LiLa conversations, and meetings. Completions auto-route to Victory Recorder. Timer integration tracks focus time. Gamification awards points.',
        miniPrompts: [
          'Create a task and use Task Breaker to decompose it into steps',
          'Try different prioritization views — each one shows your tasks through a different lens',
        ],
        subTools: [
          {
            name: 'Task Breaker AI',
            brief: 'Decompose big tasks into manageable steps',
            detail: 'Overwhelmed by "clean the garage"? Task Breaker splits it into Quick (3-5 steps), Detailed (5-10), or Granular (10-20) sub-tasks. Edit, reorder, or remove before applying. Image mode: snap a photo of a messy room and get cleanup steps.',
          },
          {
            name: '13 Prioritization Views',
            brief: 'Same tasks, different lenses',
            detail: 'Eisenhower Matrix, Eat the Frog, Big Rocks, Ivy Lee, ABCDE, MoSCoW, Impact/Effort, Kanban, By Member, By Category, Timeline, Simple List, and Now/Next/Optional. Each view is a different way to decide what matters most right now.',
          },
        ],
        tourHook: 'Tasks, routines, opportunities — with AI that breaks down the overwhelming stuff.',
        tourInstruction: 'Try creating a task and using Task Breaker to decompose it.',
        tourAction: { type: 'navigate', route: '/tasks?new=1' },
      },
      {
        key: 'lists',
        prdNumber: 'PRD-09B',
        name: 'Lists & Studio',
        iconName: 'List',
        route: '/lists',
        status: 'built',
        description:
          'Ten list types for every need — shopping lists with quantities and store sections, wishlists with prices and URLs, packing lists with progress tracking, expense trackers with running totals, randomizer lists with a draw spinner, and more. Studio is your template workshop — browse blank formats, customize them for your family, and deploy to any family member.',
        connections: 'Receives items from Smart Notepad routing. Share lists with family members. Promote to-do items to Tasks. Randomizer lists power Treasure Box rewards in Gamification.',
        miniPrompts: [
          'Create a shopping list and try adding items with quantities',
          'Visit Studio to see the template workshop',
        ],
        tourHook: 'Every kind of list your family needs, plus a template workshop.',
        tourInstruction: 'Create a shopping list and try the randomizer spinner.',
      },
    ],
  },

  // ── Stage 5 ─────────────────────────────────────────────────
  {
    number: 5,
    title: 'Know Your Family Deeply',
    subtitle: 'Archives & Context Engine',
    narrative:
      'This is what makes LiLa truly different from any other AI. Archives is the knowledge engine — every preference, allergy, school schedule, personality quirk, and family rhythm lives here. Three-tier AI inclusion toggles give you granular control: person-level, category-level, and item-level. The more context LiLa has, the more she feels like a partner who actually knows your family.',
    features: [
      {
        key: 'archives',
        prdNumber: 'PRD-13',
        name: 'Archives — Family Context Engine',
        iconName: 'Archive',
        route: '/archives',
        status: 'built',
        description:
          'Imagine if your AI actually KNEW your family. Not their names and ages — their allergies, their love languages, their therapy schedules, the fact that Jordan shuts down when you raise your voice but opens up on car rides. Archives is LiLa\'s long-term memory. Tell her about your family naturally — she organizes it into structured, searchable context. The more you share, the smarter every single interaction becomes. This is the unfair advantage no other family app has: context that compounds.',
        connections: 'Feeds LiLa\'s context assembly pipeline. Three-tier toggles (person/category/item) control what LiLa knows. Aggregates entries from InnerWorkings, Guiding Stars, and other sources. "Checked somewhere, checked everywhere" — toggling AI inclusion writes back to source tables.',
        miniPrompts: [
          'Visit a family member\'s archive and add a preference or personality trait',
          'Tell LiLa about a family member — she\'ll organize the context for you',
        ],
        tourHook: 'The knowledge engine that makes LiLa truly know your family.',
        tourInstruction: 'Try telling LiLa about a family member — she\'ll organize it for you.',
        tourAction: { type: 'navigate', route: '/archives' },
      },
    ],
  },

  // ── Stage 6 ─────────────────────────────────────────────────
  {
    number: 6,
    title: 'Invest in Your Relationships',
    subtitle: 'Communication & Relationship Tools',
    narrative:
      'The hardest part of family life isn\'t the logistics — it\'s the communication. These tools help you express love in ways that land, navigate difficult conversations with empathy, and grow your communication skills alongside the AI that\'s helping you. Every draft teaches you something. Every conversation gets easier.',
    features: [
      {
        key: 'tool_cyrano',
        prdNumber: 'PRD-21',
        name: 'Cyrano — Romantic Communication',
        iconName: 'Feather',
        route: '/dashboard',
        status: 'built',
        description:
          'You\'ve been meaning to tell him for three weeks. That Saturday when he took all the kids without being asked — you felt your shoulders drop for the first time in a month. But by the time the kids are in bed and the kitchen is clean, the words are gone. Cyrano catches the moment. Tell LiLa what you feel, and she drafts something that will land — using HIS communication style, not yours. Because "thanks for Saturday" doesn\'t hit the same as a message that makes him feel genuinely seen.',
        connections: 'Uses partner context from Archives. Teaches communication skills tracked in teaching_skill_history. Drafts saved to communication_drafts table. Works with Love Languages tools.',
        miniPrompts: [
          'Draft an encouraging message to your spouse about something specific they did',
          'Try a different tone — heartfelt, playful, or poetic',
        ],
        tourHook: 'Turn raw feelings into beautiful words — and learn along the way.',
        tourInstruction: 'Try drafting an encouraging message to your spouse.',
        tourAction: { type: 'tool', toolModeKey: 'cyrano' },
      },
      {
        key: 'tool_higgins',
        prdNumber: 'PRD-21',
        name: 'Higgins — Communication Coach',
        iconName: 'GraduationCap',
        route: '/dashboard',
        status: 'built',
        description:
          'Two modes for when communication gets hard. "What should I say?" helps you find the right words before a difficult talk — with your teen, your spouse, your co-parent. "How do I navigate this?" coaches you through the conversation itself, suggesting responses that honor both people. Context-aware: LiLa knows your family dynamics and communication styles.',
        connections: 'Uses family context from Archives. Communication skills tracked per-interaction. Works alongside Cyrano and Love Languages tools.',
        miniPrompts: [
          'Ask Higgins: "How do I talk to my teen about screen time without it becoming a fight?"',
          'Try "What should I say?" mode for a conversation you\'ve been avoiding',
        ],
        tourHook: 'A communication coach who knows your family dynamics.',
        tourInstruction: 'Ask: "How do I talk to my teen about screen time without it becoming a fight?"',
      },
      {
        key: 'thoughtsift',
        prdNumber: 'PRD-34',
        name: 'ThoughtSift — Decision & Thinking Tools',
        iconName: 'Brain',
        route: '/dashboard',
        status: 'built',
        description:
          'Your teenager hasn\'t said more than three words at dinner in a week. You\'re cycling between worry, frustration, and guilt. Perspective Shifter doesn\'t give you generic "teens need space" advice — it shows you YOUR teenager\'s perspective, using their actual personality profile, communication style, and the dynamics of YOUR relationship. Plus four more tools: Board of Directors (3-5 advisors debate your question), Decision Guide (15 proven frameworks), Mediator (structured conflict guidance), and Translator (rewrite your message in any tone).',
        connections: 'All tools pass through safety monitoring. Board personas cached in platform_intelligence. Decision frameworks stored in database. Mediator supersedes relationship_mediation from PRD-19.',
        miniPrompts: [
          'Try Perspective Shifter: describe a situation and see it through a family member\'s eyes',
          'Assemble a Board of Directors to debate a decision you\'re wrestling with',
        ],
        subTools: [
          {
            name: 'Board of Directors',
            brief: '3-5 advisors debate your question',
            detail: 'Choose from historical figures (Marcus Aurelius, Maya Angelou), fictional characters, or create custom personas. Each advisor responds independently with their unique perspective. Add a Prayer Seat for quiet reflection. The disclaimer reminds you these are AI interpretations — read the real work.',
          },
          {
            name: 'Perspective Shifter',
            brief: '14 lenses to reframe any situation',
            detail: 'See your situation through different eyes — empathy, future-self, devil\'s advocate, gratitude, child\'s perspective, and more. Family context lenses synthesize what LiLa knows about a family member to show their likely viewpoint.',
          },
          {
            name: 'Decision Guide',
            brief: '15 proven decision frameworks',
            detail: 'Six Thinking Hats, Eisenhower Matrix, 10-10-10 Rule, Regret Minimization, and 11 more. LiLa suggests a framework based on your decision type, or pick from the list. Coin Flip Insight: when you\'re stuck after 3+ turns, LiLa offers a gut-check exercise.',
          },
          {
            name: 'Mediator',
            brief: 'Structured guidance for family conflicts',
            detail: 'Eight context modes from "Just Me" (processing alone) to "Full Picture" (mom-only, uses complete family context). Mandatory safety exception: if fear, harm, or coercive control is detected, framework coaching stops and resources are provided.',
          },
          {
            name: 'Translator',
            brief: 'Rewrite text in any communication style',
            detail: 'Single-turn rewrite: paste your message and choose a target style. Professional, warm, direct, gentle, humorous, or formal. Runs on Haiku for instant results. Not conversational — paste, translate, done.',
          },
        ],
        tourHook: 'Five thinking tools: advisors, perspectives, frameworks, mediation, and translation.',
        tourInstruction: 'Try Perspective Shifter: describe a situation and see it through a family member\'s eyes.',
        tourAction: { type: 'tool', toolModeKey: 'perspective_shifter' },
      },
    ],
  },

  // ── Stage 7 ─────────────────────────────────────────────────
  {
    number: 7,
    title: 'Learn & Grow with AI',
    subtitle: 'AI Vault — Tutorials, Tools & Prompt Packs',
    narrative:
      'You don\'t need to be an AI expert. The AI Vault is a curated library of tutorials, prompt packs, creative tools, and skill-building content — all designed for busy moms learning to create with AI. Some tools run right inside MyAIM. Others guide you through external platforms with step-by-step instructions. Every piece of content teaches you something new.',
    features: [
      {
        key: 'vault_browse',
        prdNumber: 'PRD-21A',
        name: 'AI Vault',
        iconName: 'Gem',
        route: '/vault',
        status: 'built',
        description:
          'Every AI tool other people are paying consultants to set up? It\'s in here. Browse like Netflix. Try with one click. Learn at your own pace. And the secret weapon: "Optimize with LiLa" takes any prompt template and supercharges it with YOUR family\'s context. A generic meal planning prompt becomes "plan dinners for a family of 8 where one child has Down Syndrome and sensory food preferences, dad is dairy-free, and Tuesday nights are therapy nights." THAT is what AI literacy looks like.',
        connections: 'Tools can launch as LiLa guided modes (native delivery). Prompt packs add to your personal prompt library. BookShelf (coming soon) will live here as a featured section.',
        miniPrompts: [
          'Browse the AI Vault and bookmark something that interests you',
          'Try a prompt pack — copy a prompt and use it in your favorite AI tool',
        ],
        tourHook: 'AI tutorials and tools designed for moms, not developers.',
        tourInstruction: 'Browse the AI Vault and see what catches your eye.',
      },
      {
        key: 'bookshelf',
        prdNumber: 'PRD-23',
        name: 'BookShelf — Personal Wisdom Library',
        iconName: 'BookCopy',
        route: null,
        status: 'in_production',
        description:
          'You bought 12 parenting books this year. You\'ve finished... one and a half. BookShelf doesn\'t judge. Upload any book you own and LiLa reads it WITH you — extracting principles, declarations, and action steps chapter by chapter. Heart the wisdom that resonates most. Then LiLa turns wisdom into action: a principle becomes a Guiding Star, an action step becomes a Task. Discussion mode lets you talk through the book like you\'re at the world\'s most patient book club.',
        connections: 'Hearted insights feed LiLa context (configurable: hearted only, all, principles only, or none). Declarations route to Guiding Stars. Action steps route to Tasks. Cross-book discussions connect ideas across your entire library.',
        lookForward: 'Upload PDFs, EPUBs, or paste text. LiLa processes chapter by chapter — extracting key concepts, stories, quotes, insights, principles, frameworks, declarations, questions, and action steps. Heart what resonates. Export to Guiding Stars, Tasks, and Journal. Start multi-book discussions where LiLa connects ideas across everything you\'ve read.',
      },
    ],
  },

  // ── Stage 8 ─────────────────────────────────────────────────
  {
    number: 8,
    title: 'Celebrate What Got Done',
    subtitle: 'Victories & Daily Celebration',
    narrative:
      'You did 47 things today. Your brain remembers the 3 you didn\'t do. Victory Recorder flips the script. Every completed task, every Best Intention iteration, every tracker milestone automatically appears here. Plus manual entries for wins that don\'t live anywhere else. LiLa writes daily celebrations in eight unique voices — from a proud grandmother to a poetic storyteller.',
    features: [
      {
        key: 'victories',
        prdNumber: 'PRD-11',
        name: 'Victory Recorder & Daily Celebration',
        iconName: 'Trophy',
        route: '/victories',
        status: 'in_production',
        description:
          'You did 47 things today. Your brain remembers the 3 you didn\'t do. Victory Recorder flips the script — it\'s a ta-da list, not a to-do list. Every completed task, every tracker milestone automatically appears here. Plus manual entries for the wins that don\'t live anywhere else: "I didn\'t yell when the milk spilled." "I actually sat down for lunch." LiLa writes you a daily celebration that honors small steps without being fake about it. Sincerity over enthusiasm. Always.',
        connections: 'Auto-receives victories from task completions, intention iterations, and widget milestones. Daily Celebration narratives use your Guiding Stars for context. Life area tags connect victories to your LifeLantern assessment areas.',
        lookForward: 'Eight celebration voices: Proud Grandmother, Best Friend, Sports Commentator, Poetic Storyteller, Gentle Teacher, Comedy Writer, News Anchor, and Hype Person. Weekly victory reviews. Family celebrations that weave everyone\'s wins into one narrative. Victory archives searchable by life area.',
      },
      {
        key: 'rhythms',
        prdNumber: 'PRD-18',
        name: 'Rhythms & Reflections',
        iconName: 'Sun',
        route: '/rhythms/morning',
        status: 'in_production',
        description:
          'Fully customizable morning and evening routines from a library of 28+ section types. Your morning might include: weather, today\'s tasks, a gratitude prompt, and a Guiding Star rotation. Your evening: mood check-in, today\'s victories, and a reflection prompt from a rotating library of 32 questions. Structure that fits YOUR rhythm, not someone else\'s template.',
        connections: 'Morning rhythm pulls from today\'s tasks, calendar, and Guiding Stars. Evening review connects to Victory Recorder and reflection prompts. Reflection responses feed LiLa context. Weekly/monthly/quarterly rhythms help you zoom out.',
        lookForward: 'Choose from 28+ section types for each rhythm. Daily, weekly, monthly, and quarterly frequencies. Smart trigger hours show the right rhythm at the right time. Reflection prompt library with 32 rotating questions. Completion tracking without guilt — dismiss and move on.',
      },
    ],
  },

  // ── Stage 9 ─────────────────────────────────────────────────
  {
    number: 9,
    title: 'Your Family\'s Command Center',
    subtitle: 'Dashboards, Calendar & Hub',
    narrative:
      'Three views of your family\'s world. Your Personal Dashboard shows exactly what matters to YOU today. Family Overview gives mom the bird\'s-eye view of every member. And Family Hub is the shared surface for the whole family — mount a tablet in the kitchen and everyone has a command center.',
    features: [
      {
        key: 'dashboard',
        prdNumber: 'PRD-14',
        name: 'Personal Dashboard',
        iconName: 'LayoutDashboard',
        route: '/dashboard',
        status: 'built',
        description:
          'Your personalized home screen showing exactly what matters today — tasks, upcoming events, active trackers, recent victories, and rotating Guiding Stars. Drag sections to reorder. Toggle visibility. Add widgets. Three perspective modes for mom: My Dashboard, Family Overview, and Family Hub. YOUR command center, YOUR way.',
        connections: 'Aggregates data from Tasks, Calendar, Trackers, Victories, and Guiding Stars. QuickTasks strip provides one-tap actions. LiLa drawer accessible from any dashboard view.',
        miniPrompts: [
          'Drag sections to reorder your dashboard',
          'Try the QuickTasks strip — one-tap access to everything',
        ],
        tourHook: 'Your personalized command center — drag, drop, customize.',
        tourInstruction: 'Explore your dashboard sections and try the QuickTasks strip.',
      },
      {
        key: 'calendar',
        prdNumber: 'PRD-14B',
        name: 'Family Calendar',
        iconName: 'Calendar',
        route: '/calendar',
        status: 'in_production',
        description:
          'Natural language event creation ("Dentist next Thursday at 2pm for Amelia"), per-member color coding so you see everyone\'s schedule at a glance, and member filter pills to focus on one person\'s day at a time. Category icons for sports, medical, school, and more. Children\'s events require parent approval. Leave-by-time reminders so you\'re never late. Your family\'s chaos, color-coded and searchable.',
        connections: 'Receives events from Smart Notepad, LiLa conversations, and meetings. Integrates with Universal Scheduler for recurring events. Access schedules control co-parent and caregiver visibility.',
        lookForward: 'AI-assisted event intake from photos and emails. Recurring event patterns with the Universal Scheduler. Per-member color coding with filter pills. Leave-by-time calculations based on drive time. Children\'s event approval workflow.',
      },
      {
        key: 'family_overview',
        prdNumber: 'PRD-14C',
        name: 'Family Overview',
        iconName: 'Users',
        route: null,
        status: 'in_production',
        description:
          'See every family member\'s day at a glance in side-by-side columns. Tasks, calendar events, Best Intentions, victories. Mark tasks complete for your kids right from the overview. Reorder columns and sections. Collapse what you don\'t need. The mom\'s bird\'s-eye view that makes the invisible labor visible.',
        connections: 'Pulls from each member\'s tasks, calendar, intentions, and victories. Mom can complete tasks on behalf of children. Connects to View As for diving deeper into any member\'s perspective.',
        lookForward: 'Side-by-side member columns with customizable sections. One-tap task completion for children. Section reordering and collapse. Filter by member for focused views.',
      },
      {
        key: 'family_hub',
        prdNumber: 'PRD-14D',
        name: 'Family Hub & TV Mode',
        iconName: 'Monitor',
        route: null,
        status: 'in_production',
        description:
          'Mount a tablet in your kitchen. Your whole family has a shared command center. Each person taps their name, enters their PIN, and sees their own dashboard. Shared calendar, countdowns to exciting events, rotating photo frames, weather widget, and a family announcement board. TV Mode turns any large screen into an always-on family display.',
        connections: 'Shared surface pulling from family calendar, countdowns, announcements. Member PIN authentication. Auto-timeout configurable. TV Mode landscape-locked with auto-rotating sections.',
        lookForward: 'Tablet-optimized shared interface with PIN login per member. Countdowns, photo frames, weather, and announcements. TV Mode for large screens with ambient display. Auto-timeout settings per family.',
      },
    ],
  },

  // ── Stage 10 ────────────────────────────────────────────────
  {
    number: 10,
    title: 'Make It Fun for Everyone',
    subtitle: 'Gamification, Trackers & Visual Worlds',
    narrative:
      'Your kids do NOT want to check off chores. But they DO want to open a treasure chest to see what badge they earned. Gamification transforms responsibility into adventure — XP for completed tasks, levels that unlock rewards, treasure boxes with reveal animations, and visual worlds that grow as kids make progress. The philosophy is celebration-only: XP goes up, never down. Missing a day doesn\'t punish.',
    features: [
      {
        key: 'widgets',
        prdNumber: 'PRD-10',
        name: 'Widgets & Trackers',
        iconName: 'BarChart3',
        route: '/trackers',
        status: 'in_production',
        description:
          'Nineteen tracker types with 75+ visual variants and 95+ configurations. Track habits, moods, water intake, reading progress, fitness goals — anything you want to measure. Arrange widgets on a drag-and-drop dashboard grid. Kids get special visual trackers like color-reveal images that unveil as they complete tasks.',
        connections: 'Timer integration for time-tracked widgets. Milestone completions auto-route to Victory Recorder. Gamification points for widget progress. Dashboard grid layout with drag-and-drop positioning.',
        lookForward: 'Drag-and-drop dashboard grid. 19 tracker types including streak counters, mood logs, habit grids, progress bars, color-reveal images, and more. 75+ visual variants per tracker type. Kid-friendly animated reveals.',
      },
      {
        key: 'gamification',
        prdNumber: 'PRD-24',
        name: 'Gamification & Visual Worlds',
        iconName: 'Gamepad2',
        route: null,
        status: 'in_production',
        description:
          'Transform your child\'s dashboard into a living world. Garden, ocean, space, and kingdom themes where completing tasks grows the scene. Collectible overlay systems — nurture pets, brew potions, build kingdoms — with daily effort earning new items. Eight reveal animations for treasure boxes. Configurable point systems. And the philosophy is celebration-only — XP goes up, never down.',
        connections: 'Points awarded from task completions. Treasure boxes reward milestones. Randomizer lists power mystery rewards. Daily summaries track streaks and achievements. Visual worlds rendered on child dashboards.',
        lookForward: 'Visual world themes (garden, ocean, space, kingdom) that grow with progress. Collectible overlay systems with daily effort tracking. Eight treasure box reveal animations. Configurable point values per task type. Reward store where kids spend earned points. Achievement badges for milestones.',
      },
    ],
  },

  // ── Stage 11 ────────────────────────────────────────────────
  {
    number: 11,
    title: 'The Full Family Platform',
    subtitle: 'Everything Else That Makes It Complete',
    narrative:
      'The foundation stages give you the core experience. But a real family platform needs more — meetings that generate action items, messages that build connection, time tracking that just works, project planning that adapts to your style, safe spaces for teens to process emotions, and compliance tools that take the stress out of homeschool documentation. Every feature here connects back to the core through the same context engine.',
    features: [
      {
        key: 'meetings',
        prdNumber: 'PRD-16',
        name: 'Family Meetings',
        iconName: 'MessageSquare',
        route: null,
        status: 'in_production',
        description:
          'Family meeting facilitation that captures action items as you talk. "Jake, take out the trash Tuesdays" becomes a recurring task automatically routed to Jake\'s list. Agenda templates give structure. LiLa captures notes. Action items flow through the system without you writing them down twice. The weekly family meeting your family keeps skipping? This makes it actually happen.',
        connections: 'Action items route to Studio Queue for processing. Agenda items contributed by all family members. Meeting notes save to Journal. Templates customizable per family.',
        lookForward: 'Eight meeting types with pre-built templates. LiLa facilitation with real-time action item capture. Each member contributes agenda items beforehand. Follow-ups auto-route to Tasks, Calendar, and Lists.',
      },
      {
        key: 'messaging',
        prdNumber: 'PRD-15',
        name: 'Family Messaging',
        iconName: 'MessageCircle',
        route: null,
        status: 'in_production',
        description:
          'Private family messaging with conversation spaces for every relationship — couple chat, parent-child, family group, and a Content Corner for sharing links. LiLa can join as a communication coach, helping family members express themselves kindly. Message coaching levels: gentle, moderate, and active.',
        connections: 'Conversation spaces with thread support. Read receipts and typing indicators via Supabase Realtime. Content Corner for link sharing. Communication coaching configurable per member.',
        lookForward: 'Direct, group, and family-wide conversation spaces. LiLa communication coaching at three levels. Content Corner for sharing and discussing links. Message read status and real-time delivery.',
      },
      {
        key: 'mindsweep',
        prdNumber: 'PRD-17B',
        name: 'MindSweep — Brain Dump Capture',
        iconName: 'Brain',
        route: null,
        status: 'in_production',
        description:
          'Brain dump on steroids. Text it, speak it, forward an email, share from another app — and LiLa sorts EVERYTHING. "Soccer moved to Wednesday" goes to calendar. "Buy poster board" goes to shopping list. "Talk to mom about Thanksgiving" goes to Backburner. Three modes: Always Ask, Trust the Obvious, Full Autopilot. The 11pm brain dump that used to keep you awake? LiLa handles it while you sleep.',
        connections: 'Items route to Studio Queue for processing. Approval patterns learn from your corrections. PWA entry point for quick capture. Email forwarding integration.',
        lookForward: 'Voice, text, scan, and email capture. Three aggressiveness modes. Auto-routing with approval pattern learning. PWA for standalone brain dump capture. Email-to-MindSweep forwarding.',
      },
      {
        key: 'safe_harbor',
        prdNumber: 'PRD-20',
        name: 'Safe Harbor — Emotional Processing',
        iconName: 'Shield',
        route: null,
        status: 'in_production',
        description:
          'Your teenager is going through something hard and they need to process it. Not with you — not because they don\'t love you, but because some processing needs safety to happen. Safe Harbor is a completely private, AI-guided emotional space. Completely isolated: you cannot see it. It doesn\'t feed into any reports, any context, any aggregation. The only exception is immediate safety. This exists because you love your kids enough to give them space.',
        connections: 'Completely isolated from all data aggregation, reports, and context. Crisis override still applies (safety first). Parent consent flow with AI literacy orientation for teens. Guided mode for younger children.',
        lookForward: 'Completely private conversations exempt from all reporting. Parent consent flow with scenario-based orientation. AI literacy building for teens. Guided mode for younger children. Crisis detection always active.',
      },
      {
        key: 'universal_timer',
        prdNumber: 'PRD-36',
        name: 'Universal Timer',
        iconName: 'Timer',
        route: null,
        status: 'in_production',
        description:
          'Track time on any activity with five modes: clock-in/out, Pomodoro focus, stopwatch, countdown, and visual timers for kids. A floating bubble follows you across the app. Kids get animated visual timers — sand timers, hourglasses, thermometers, arcs, and filling jars — that make time visible and exciting.',
        connections: 'Attaches to tasks, widgets, and list items. Duration feeds homeschool time logs. Floating bubble persists across page navigation. Multiple concurrent timers supported.',
        lookForward: 'Five timer modes with floating bubble UI. Animated visual timers for kids. Multiple concurrent timers. Pomodoro with configurable intervals. Auto-pause idle detection. Timestamp-based (survives refresh and device switches).',
      },
      {
        key: 'bigplans',
        prdNumber: 'PRD-29',
        name: 'BigPlans — Project & Goal Planner',
        iconName: 'Rocket',
        route: null,
        status: 'in_production',
        description:
          'Tell LiLa "I want to homeschool starting in September" and she works backward: what needs to happen by August, July, June... all the way to today\'s first step. Every milestone becomes trackable. Friction detection identifies why you\'re stuck. Five planning modes: backward planning, multi-phase projects, system design trials, habit building, and component deployment.',
        connections: 'Milestones decompose into Tasks. Check-ins create LiLa conversations. Friction Finder identifies blocking patterns. Components link to Tasks, Widgets, and Best Intentions.',
        lookForward: 'Five AI-detected planning modes. Backward planning from deadlines. Friction Finder that diagnoses why you\'re stuck. Progress check-ins with LiLa. Milestone-to-task decomposition.',
      },
      {
        key: 'family_feeds',
        prdNumber: 'PRD-37',
        name: 'Family Feeds',
        iconName: 'Rss',
        route: null,
        status: 'in_production',
        description:
          'A private Instagram for your family. Share moments, document your homeschool day, and let adult kids who\'ve left home stay connected. Voice dump your whole day and LiLa sorts entries per-kid automatically. Portfolio tagging for homeschool documentation. No ads, no algorithms, no strangers. Just your family\'s story, told by the people living it.',
        connections: 'Portfolio moments link to homeschool compliance. Out of Nest members see a filtered feed. Approval workflow for younger children\'s posts. Bulk summary generation for daily learning logs.',
        lookForward: 'Private family social feed with photos, voice, and text. Portfolio tagging for homeschool documentation. Out of Nest feed for grandparents and college kids. LiLa bulk summary of daily learning. Approval workflow for children\'s posts.',
      },
      {
        key: 'life_lantern',
        prdNumber: 'PRD-12A',
        name: 'LifeLantern — Personal Assessment',
        iconName: 'Compass',
        route: '/life-lantern',
        status: 'in_production',
        description:
          'A deep guided conversation with LiLa across six life areas — family, health, spirituality, education, community, and personal growth. Map where you are, envision where you want to be, and identify the gaps. The result becomes LiLa\'s richest context source for coaching you toward the life you actually want. Periodic snapshots track your growth over time.',
        connections: 'Assessment results become core LiLa context. Gap analysis informs BigPlans suggestions. Life area tags connect to Victories and Best Intentions. Snapshots enable before/after comparison.',
        lookForward: 'Guided conversation across six life areas. Gap analysis between current state and vision. Role model identification. Periodic snapshots for growth tracking. Results power LiLa\'s most personalized coaching.',
      },
      {
        key: 'compliance',
        prdNumber: 'PRD-28B',
        name: 'Homeschool Compliance & Reporting',
        iconName: 'FileCheck',
        route: null,
        status: 'in_production',
        description:
          'Homeschool reports that write themselves. SDS monthly summaries that used to take hours now take minutes. ESA invoices at EVERY tier. State-aware compliance tracking, standards mapping, portfolio evidence collection, and LiLa-drafted narrative reports. Designed by a founder who writes these reports herself.',
        connections: 'Maps to education standards framework. Portfolio evidence links to Family Feeds moments. Time logs from Universal Timer feed reports. ESA invoices generated from tracked expenses.',
        lookForward: 'State-aware compliance tracking. Standards mapping (Common Core, state-specific, classical). Portfolio evidence linking. AI-drafted narrative reports. ESA invoice generation at every tier.',
      },
      {
        key: 'caregiver_tools',
        prdNumber: 'PRD-27',
        name: 'Caregiver & Co-Parent Tools',
        iconName: 'UserCheck',
        route: null,
        status: 'in_production',
        description:
          'Invite your babysitter with a link. They see the kids\' schedules, tasks, medication, and allergy info — only what you\'ve authorized. They mark things done and add notes. When their shift ends, a report auto-compiles. Co-parents with custody schedules get always-on access during their windows. Access expires automatically.',
        connections: 'Access schedules control visibility windows. Shift reports auto-compile on shift end. Trackable events (meals, naps, meds) logged during shifts. Permission presets (Babysitter, Grandparent, Tutor) for quick setup.',
        lookForward: 'Link-based caregiver invitations. Trackable event logging (meals, naps, medications). Auto-compiled shift reports. Custody schedule integration. Time-scoped access that expires automatically.',
      },
      {
        key: 'tracking_financial',
        prdNumber: 'PRD-28',
        name: 'Allowance & Financial Tracking',
        iconName: 'Wallet',
        route: null,
        status: 'in_production',
        description:
          'Set up allowance pools with rules: Jake earns $10/week but only the percentage he completes. 7 of 10 chores = $7. Clean, fair, automated. Three approaches: fixed allowance, task-based earnings, or hybrid. Loan tracking teaches borrowing responsibility. Opportunity earnings let kids claim extra tasks for bonus pay.',
        connections: 'Task completion triggers earning calculations. Opportunity board earnings feed financial tracking. Loans track borrower/lender relationships. Reports include financial summaries.',
        lookForward: 'Three allowance approaches: fixed, task-based, hybrid. Automatic earning calculations from task completion. Loan tracking with customizable terms. Opportunity earnings from claimed jobs. Financial literacy through real experience.',
      },
      {
        key: 'safety_monitoring',
        prdNumber: 'PRD-30',
        name: 'Safety Monitoring',
        iconName: 'ShieldAlert',
        route: null,
        status: 'in_production',
        description:
          'Invisible, respectful safety monitoring for teen LiLa conversations. Two-layer detection: keyword matching catches obvious concerns instantly, while AI classification identifies subtle patterns. Configurable sensitivity per category. Weekly pattern summaries. Three locked categories (self-harm, abuse, predatory behavior) are always high sensitivity — that\'s non-negotiable.',
        connections: 'Monitors all LiLa conversations (not just Safe Harbor). Three severity tiers: Concern, Warning, Critical. Pattern summaries aggregate weekly. Crisis override is global — applies everywhere.',
        lookForward: 'Two-layer detection (keywords + AI classification). Per-category sensitivity configuration. Weekly pattern summary narratives. Three locked high-sensitivity categories. Age-appropriate escalation paths.',
      },
    ],
  },
]

// ── Helper Functions ────────────────────────────────────────────

/** Find a feature by its key across all stages */
export function getFeatureByKey(key: string): JourneyFeature | undefined {
  for (const stage of JOURNEY_STAGES) {
    const found = stage.features.find(f => f.key === key)
    if (found) return found
  }
  return undefined
}

/** Get all built features */
export function getBuiltFeatures(): JourneyFeature[] {
  return JOURNEY_STAGES.flatMap(s => s.features).filter(f => f.status === 'built')
}

/** Get all in-production features */
export function getInProductionFeatures(): JourneyFeature[] {
  return JOURNEY_STAGES.flatMap(s => s.features).filter(f => f.status === 'in_production')
}

/** Get all features */
export function getAllFeatures(): JourneyFeature[] {
  return JOURNEY_STAGES.flatMap(s => s.features)
}

/** Get features for the guided tour (built features only, in tour order) */
export function getTourFeatures(): JourneyFeature[] {
  const tourOrder = [
    'guiding_stars', 'innerworkings', 'lila', 'notepad',
    'tasks', 'archives', 'tool_cyrano', 'thoughtsift',
  ]
  const all = getAllFeatures()
  return tourOrder
    .map(key => all.find(f => f.key === key))
    .filter((f): f is JourneyFeature => f != null && f.status === 'built')
}
