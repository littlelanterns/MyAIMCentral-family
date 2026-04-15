/**
 * Help & Assist Pattern Matching — PRD-05
 *
 * Keyword-based pattern matching for the 'help' and 'assist' LiLa modes.
 * Checked BEFORE calling the AI edge function. If a pattern matches,
 * the canned response is inserted directly as an assistant message — no AI call.
 *
 * Per PRD-32: LiLa Help checks known issues (keyword matching) BEFORE calling AI.
 */

interface HelpPattern {
  keywords: string[]
  response: string
  category: string
}

const HELP_PATTERNS: HelpPattern[] = [
  {
    category: 'account',
    keywords: ['password', 'reset password', 'forgot password', "can't log in", "can't sign in", 'login problem', 'sign in problem'],
    response: "To reset your password, go to Settings > Account > Change Password. Enter your email and follow the reset link sent to your inbox. If you don't see it, check your spam folder. Still stuck? I can help troubleshoot.",
  },
  {
    category: 'subscription',
    keywords: ['upgrade', 'downgrade', 'subscription', 'billing', 'payment', 'tier', 'plan', 'pricing', 'cancel', 'founding'],
    response: "You can manage your subscription in Settings > Billing. MyAIM has four tiers: Essential ($9.99/mo), Enhanced ($16.99/mo), Full Magic ($24.99/mo), and Creator ($39.99/mo). Founding families get lifetime discounted rates. Want to know what each tier includes?",
  },
  {
    category: 'family_setup',
    keywords: ['add member', 'add family', 'new member', 'invite', 'family setup', 'add child', 'add husband', 'add wife', 'add teen', 'family member'],
    response: "To add family members, go to Family Members (gear icon > Family Members) and tap \"Add Member.\" You can describe your family in natural language and I'll parse it, or add members one at a time. Each member gets a PIN based on their birthday (MMDD).",
  },
  {
    category: 'pin',
    keywords: ['pin', 'pin number', 'forgot pin', 'change pin', 'reset pin', 'locked out', 'wrong pin'],
    response: "PINs are set by the primary parent. The default PIN is the member's birthday as MMDD (e.g., March 15 = 0315). To change a PIN, go to Family Members > tap the member > Change PIN. If you're locked out after 5 attempts, wait 15 minutes and try again.",
  },
  {
    category: 'permissions',
    keywords: ['permission', 'access', "can't see", 'restricted', 'blocked', 'locked feature', 'not available', 'grayed out'],
    response: "Feature access is controlled by the primary parent through the Permission Hub. If you can't access something, it might be: (1) not included in your subscription tier, (2) turned off by mom in your permission profile, or (3) not available for your role. Ask the primary parent to check your permissions.",
  },
  {
    category: 'lila',
    keywords: ['lila', 'ai', 'chat', 'assistant', 'how does lila work', 'little lanterns'],
    response: "I'm LiLa (Little Lanterns), your AI processing partner! I have different modes: Help (troubleshooting), Assist (feature guidance), and Optimizer (prompt crafting). I can also switch to specialized modes for relationships, decision-making, and more. What would you like help with?",
  },
  {
    category: 'tasks',
    keywords: ['create task', 'add task', 'new task', 'assign task', 'routine', 'chore', 'task list'],
    response: "To create a task, tap \"Add Task\" in the QuickTasks bar at the top, or go to Tasks from the bottom nav. You can create one-time tasks, recurring routines, or \"opportunities\" that any family member can claim. Need help setting up a routine?",
  },
  {
    category: 'journal',
    keywords: ['journal', 'diary', 'write', 'entry', 'reflection', 'gratitude', 'daily reflection'],
    response: "Your Journal is accessed through the bottom nav or the \"+\" button which opens the Smart Notepad. Write freely in the Notepad, then route it to Journal when ready. Journal supports multiple entry types: daily reflections, gratitude, prayers, letters, memories, and more.",
  },
  {
    category: 'notepad',
    keywords: ['notepad', 'note', 'quick note', 'capture', 'smart notepad', 'send to', 'review and route'],
    response: "The Smart Notepad is your capture workspace — open it from the bottom nav or the QuickTasks bar. Write anything, and it auto-saves. When ready, use \"Send to...\" to route content to Journal, Tasks, Lists, or 10+ other destinations. \"Review & Route\" uses AI to extract and sort items automatically.",
  },
  {
    category: 'theme',
    keywords: ['theme', 'color', 'dark mode', 'light mode', 'appearance', 'vibe', 'customize', 'change look'],
    response: "Customize your look in the Theme Selector (palette icon in the top-right). Choose from 38 color themes across 6 mood categories, 4 vibes (Classic, Modern, Nautical, Cozy), and toggle dark mode or gradients. Your preferences sync across devices.",
  },
  {
    category: 'calendar',
    keywords: ['calendar', 'event', 'schedule', 'appointment', 'add event', 'recurring event'],
    response: "Add events from the Calendar page or by tapping \"Add Event\" in the QuickTasks bar. You can set recurring events, add attendees, set leave-by times, and mark items to bring. Events from children require approval before appearing on the family calendar.",
  },
  {
    category: 'dashboard',
    keywords: ['dashboard', 'widget', 'tracker', 'customize dashboard', 'layout', 'home screen'],
    response: "Your personal dashboard is fully customizable. Add widgets for habit tracking, countdowns, coloring pages, and more. Tap the grid icon to enter edit mode — drag to rearrange, tap to configure. You can also create widget folders to organize your space.",
  },
  {
    category: 'victories',
    keywords: ['victory', 'ta-da', 'celebration', 'achievement', 'win', 'record a win'],
    response: "Your Victory Recorder (Ta-Da list) lives in the Victories section. Log wins manually, or let the platform auto-route them from task completions and Best Intention milestones. You can generate celebration narratives from your victories — weekly highlights or detailed recaps.",
  },
  {
    category: 'opportunity_lists',
    keywords: ['opportunity', 'opportunity list', 'opportunity board', 'job board', 'claim', 'earn money', 'extra jobs', 'kids earn'],
    response: "Opportunity lists let kids browse and claim jobs or activities when they're ready. To create one: go to Lists, create any list type, then check \"This is an opportunity list\" in the detail view. Set rewards (money/points), choose item type (one-time, claimable, repeatable), and kids will see it on their Opportunities tab with \"I'll do this!\" buttons. You can also use Smart Import to paste a big list and AI sorts items into your existing lists.",
  },
  {
    category: 'smart_import',
    keywords: ['smart import', 'sort into lists', 'bulk import', 'paste items', 'auto sort', 'import activities'],
    response: "Smart Import is on the Lists page (wand icon next to New List). Paste a block of text — activities, chores, ideas — and AI sorts each item into your existing lists. Items that don't fit get new list suggestions. You review everything before committing. Great for importing from books, activity guides, or brain dumps.",
  },
  {
    category: 'randomizer_opportunity',
    keywords: ['randomizer', 'mystery draw', 'activity spinner', 'surprise activity', 'random draw'],
    response: "Create a Randomizer list for mystery draws — spin and get a surprise activity. To make it optional (not forced), open the randomizer settings (gear icon) and check \"Optional (opportunity).\" Now when kids draw, they see \"I'll do this!\" or \"Skip\" instead of being auto-assigned. Great for activity spinners, reward wheels, or \"what should we do today?\" boards.",
  },
]

/**
 * Match a user query against the help pattern library.
 * Returns the canned response string if a match is found, or null if no match.
 * Uses keyword count — the pattern with the most keyword matches wins if multiple match.
 */
export function matchHelpPattern(query: string): string | null {
  const lower = query.toLowerCase()

  let bestMatch: HelpPattern | null = null
  let bestCount = 0

  for (const pattern of HELP_PATTERNS) {
    const matchCount = pattern.keywords.filter(kw => lower.includes(kw.toLowerCase())).length
    if (matchCount > bestCount) {
      bestCount = matchCount
      bestMatch = pattern
    }
  }

  return bestMatch ? bestMatch.response : null
}
