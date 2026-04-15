/**
 * Feature Guide Knowledge Base — LiLa Assist + Help mode knowledge
 *
 * This file gives LiLa practical knowledge about:
 * 1. PAGE KNOWLEDGE — what's on each page, what buttons to press, navigation paths
 * 2. USE CASE RECIPES — "mom wants X" → here's the best way to set it up
 * 3. CLARIFYING QUESTIONS — when mom's intent is ambiguous, ask these to narrow it down
 *
 * Loaded into the system prompt for assist and help modes.
 * Keep entries concise — each one costs tokens on every conversation turn.
 */

// ── Page Knowledge ────────────────────────────────────────

export const PAGE_KNOWLEDGE: Record<string, string> = {
  '/lists': `LISTS PAGE — Browse and manage all family lists.
  Buttons: [+ New List] creates a list (pick type: Shopping, Wishlist, Custom, Randomizer, etc.)
  [Smart Import] (wand icon) opens AI-powered multi-list sorter — paste text, AI sorts items into correct lists.
  Each list card → tap to open detail view.
  In detail view: "This is an opportunity list" checkbox turns any list into a claimable opportunity board.
  When opportunity is checked: set default reward (money/points), item type (one-time/claimable/repeatable), and claim lock duration.
  Pool Mode (gear icon on randomizer): set who can see the list (colored member pills).`,

  '/tasks': `TASKS PAGE — 6 tabs: My Tasks, Routines, Opportunities, Sequential, Queue, Finances.
  OPPORTUNITIES TAB: Shows both standalone opportunity tasks AND opportunity-flagged lists.
  Opportunity lists appear as expandable cards — tap to see items with "I'll do this!" claim buttons.
  Kids claim items → task appears on their dashboard automatically.
  [+ Create Opportunity] button for standalone opportunities.
  Filter bar: member pill buttons filter across all tabs.`,

  '/studio': `STUDIO PAGE — Template workshop. Browse blank formats, customize for your family, deploy to members.
  Categories: Tasks, Routines, Opportunity Boards, Sequential Collections, Guided Forms, Lists, Trackers.
  [Customize] on any template → opens creation modal pre-configured for that type.
  My Customized tab → your saved templates. Deploy, edit, duplicate, archive.`,

  '/calendar': `CALENDAR PAGE — Month/Week/Day views. Click any date → DateDetailModal.
  [+ Event] creates a new event. Events by mom auto-approved, events by kids go pending.
  Task due dates show on calendar (checkbox icon, slightly muted).`,

  '/bookshelf': `BOOKSHELF — Upload books (PDF, EPUB, DOCX). AI extracts summaries, insights, declarations, action steps, questions.
  Browse extracted wisdom. Heart items for LiLa to reference. Send to Guiding Stars, Tasks, Journal Prompts.
  Book Discussion: multi-book RAG conversation with LiLa about your library.`,

  '/sweep': `MINDSWEEP — Quick-capture brain dump. Text, voice, scan (OCR), link import.
  AI classifies each item → routes to the right destination (task, calendar, journal, list, etc.)
  Aggressiveness modes: Always Ask, Trust Obvious, Full Autopilot.`,
}

// ── Use Case Recipes ──────────────────────────────────────
// Each recipe maps a mom intent → recommended implementation

export interface UseCaseRecipe {
  /** What mom might say */
  triggers: string[]
  /** The clarifying question LiLa should ask */
  clarifyingQuestion: string
  /** The variants and their recommended implementations */
  variants: {
    name: string
    description: string
    howToSetUp: string
  }[]
}

export const USE_CASE_RECIPES: UseCaseRecipe[] = [
  {
    triggers: ['before they leave home', 'life skills', 'before 18', 'adulting', 'independence skills', 'launch list'],
    clarifyingQuestion: "That sounds like preparing them for independence! Are you thinking of a checklist of skills they need to master (like changing a tire, cooking meals, managing money), or more of a bucket list of experiences you want them to have before they're on their own?",
    variants: [
      {
        name: 'Skills to Master',
        description: 'Each skill needs practice and eventual mastery — not a one-time checkbox.',
        howToSetUp: `Best approach: Create a Sequential Collection with mastery mode.
Go to Lists → New List → Sequential Collection.
Set advancement mode to "Mastery" and enable "Require approval."
Each skill becomes an item that your child practices multiple times. When they can demonstrate it, they submit for your approval.
Example items: "Change a tire", "Cook 10 different meals", "Do a load of laundry start to finish", "Create and stick to a budget for one month."
You can also make this an opportunity list so they choose WHEN to work on each skill.`,
      },
      {
        name: 'Experience Bucket List',
        description: 'Things to do/see/experience — one-time achievements, no mastery needed.',
        howToSetUp: `Best approach: Create a custom list and flag it as an opportunity.
Go to Lists → New List → Custom. Name it "Before You Launch" or similar.
Check "This is an opportunity list" → set type to "One-time."
Add experiences: "Go camping overnight alone", "Open a bank account", "Take a road trip you planned yourself."
Kids browse and claim when they're ready. Each completion is a one-and-done victory.`,
      },
    ],
  },
  {
    triggers: ['chores', 'earn money', 'extra jobs', 'allowance', 'job board', 'earn rewards'],
    clarifyingQuestion: "Great idea! Do you want a fixed set of chores that rotate between kids, or an open job board where anyone can claim extra work when they want to earn?",
    variants: [
      {
        name: 'Fixed Chore Rotation',
        description: 'Assigned chores that rotate on a schedule — everyone does their share.',
        howToSetUp: `Best approach: Create a routine task with rotation.
Go to Tasks → tap [+ Add Task] → set type to Routine.
Add sections (Morning, After School, Evening) with steps.
Enable rotation: pick which kids, set frequency (weekly, biweekly).
The system auto-rotates who's assigned each period.`,
      },
      {
        name: 'Open Job Board',
        description: 'Optional jobs kids can browse and claim when they want to earn.',
        howToSetUp: `Best approach: Create a list and flag it as an opportunity.
Go to Lists → New List → Custom. Name it "Extra Jobs for Money."
Check "This is an opportunity list."
Set type to "Claimable" (one kid at a time with a lock timer).
Set default reward to Money and enter the amount per job (e.g. $3).
Add jobs: "Wash the car - $5", "Organize the garage - $10", "Weed the garden - $3."
Kids go to their Tasks → Opportunities tab, browse the board, and tap "I'll do this!" to claim a job.
You can also use Smart Import — paste a big list of jobs and the AI will sort them.`,
      },
    ],
  },
  {
    triggers: ['activity ideas', 'bored', 'summer activities', 'fun things', 'what to do', 'rainy day'],
    clarifyingQuestion: "Love it! Do you want them to pick from a list of options, or would a mystery draw be more fun — where they spin and get a surprise activity?",
    variants: [
      {
        name: 'Browse and Pick',
        description: 'Kids see all options and choose what sounds fun today.',
        howToSetUp: `Best approach: Create a custom list flagged as an opportunity with rewards optional.
Go to Lists → New List → Custom. Name it "Fun Activities" or "Summer Ideas."
Check "This is an opportunity list." Set type to "Repeatable."
Add activities. Optional: set point rewards to gamify it.
Kids browse on their Opportunities tab and claim what they want to do.`,
      },
      {
        name: 'Mystery Draw (Randomizer)',
        description: 'Spin the wheel — get a surprise activity. Optional to accept.',
        howToSetUp: `Best approach: Create a Randomizer list flagged as an opportunity.
Go to Lists → New List → Randomizer. Name it "Activity Spinner."
Open settings (gear icon) → check "Optional (opportunity)."
Add activities as items.
When kids draw, they see the reveal animation, then get "I'll do this!" or "Skip."
No pressure — it's fun discovery. If they claim it, it becomes a task on their dashboard.`,
      },
    ],
  },
  {
    triggers: ['curriculum', 'school year', 'homeschool plan', 'subjects', 'lesson plan', 'textbook chapters'],
    clarifyingQuestion: "Planning out the learning! Are you working from a specific textbook or curriculum guide that you want to import chapter-by-chapter, or do you have a mix of activities across different subjects you want to organize?",
    variants: [
      {
        name: 'Single Curriculum / Textbook',
        description: 'Chapters or lessons from one source, done in order.',
        howToSetUp: `Best approach: Create a Sequential Collection.
Go to Lists → New List → Sequential Collection.
You can paste a table of contents — the AI will parse it into items.
Set advancement mode: "Complete" for just checking off, "Practice Count" if they need multiple sessions, "Mastery" if you want to approve their understanding.
Items drip-feed one at a time. When chapter 5 is done, chapter 6 unlocks.`,
      },
      {
        name: 'Multi-Subject Activity Mix',
        description: 'Activities across different subjects that need sorting.',
        howToSetUp: `Best approach: Use Smart Import on the Lists page.
Create your subject lists first (Math Activities, Science Experiments, Reading List, etc.).
Then click Smart Import (wand icon) → paste all your activities in one block.
AI sorts each item into the correct subject list.
Review the groupings, override any miscategorized items, and commit.
Flag any of these lists as opportunities if you want kids to choose their own order.`,
      },
    ],
  },
  {
    triggers: ['reading list', 'books to read', 'summer reading', 'book list'],
    clarifyingQuestion: "A reading list! Should they work through it in a specific order (like a curriculum), or pick any book that interests them?",
    variants: [
      {
        name: 'Ordered Reading List',
        description: 'Books in a specific sequence — finish one, next unlocks.',
        howToSetUp: `Best approach: Use the Reading List template in Studio.
Go to Studio → find "Reading List" in the Examples tab.
Click [Customize] → it opens a Sequential Collection pre-configured with mastery mode + duration tracking.
Add your books. Each one has a practice log for reading sessions.
When they finish a book and you approve, the next one unlocks.`,
      },
      {
        name: 'Pick-Any Reading Pool',
        description: 'Browse available books, pick what sounds interesting.',
        howToSetUp: `Best approach: Create a custom list flagged as an opportunity.
Go to Lists → New List → Custom. Name it "Summer Reading."
Check "This is an opportunity list." Set type to "Repeatable" (so books stay available for siblings).
Add book titles with notes about genre/level. Optional: set point rewards.
Kids browse and pick books that interest them.`,
      },
    ],
  },
  {
    triggers: ['practice', 'instrument', 'piano', 'guitar', 'music', 'sports practice', 'drill', 'repetition'],
    clarifyingQuestion: "Practice makes progress! Are they working through a progression (levels, exercises in order), or is it daily practice on rotating skills?",
    variants: [
      {
        name: 'Skill Progression',
        description: 'Work through levels or exercises in order — master one before the next.',
        howToSetUp: `Best approach: Sequential Collection with practice_count or mastery mode.
Go to Lists → New List → Sequential Collection.
Set advancement to "Practice Count" (e.g., practice each piece 5 times before advancing) or "Mastery" (you approve when ready).
Enable duration tracking so practice time is logged.
Each item is one piece/exercise/level. They practice repeatedly, then advance.`,
      },
      {
        name: 'Daily Practice Routine',
        description: 'A set of exercises to do each practice session.',
        howToSetUp: `Best approach: Create a Routine with a linked randomizer for variety.
Go to Tasks → create a Routine called "Piano Practice."
Add sections: Warm-up, Technique, Repertoire.
For the Repertoire section, link a Randomizer list of pieces — each practice session draws a different piece to focus on.
This keeps practice fresh while ensuring fundamentals get done every time.`,
      },
    ],
  },
]

/**
 * Build the feature guide knowledge section for LiLa's system prompt.
 * Returns a string that gets appended to the assist/help mode system prompt.
 */
export function buildFeatureGuidePrompt(currentRoute?: string): string {
  const parts: string[] = []

  parts.push(`\n--- FEATURE GUIDE KNOWLEDGE ---`)
  parts.push(`You have practical knowledge about how to set up features in MyAIM. When a parent describes what they want to accomplish, use this knowledge to recommend the best approach. Always ask a clarifying question first to understand their intent before recommending a specific implementation.`)
  parts.push(``)

  // Page knowledge for the current route
  if (currentRoute && PAGE_KNOWLEDGE[currentRoute]) {
    parts.push(`CURRENT PAGE DETAILS:`)
    parts.push(PAGE_KNOWLEDGE[currentRoute])
    parts.push(``)
  }

  // Use case recipes
  parts.push(`USE CASE RECIPES — When mom describes one of these scenarios, ask the clarifying question, then guide her to the right variant:`)
  parts.push(``)

  for (const recipe of USE_CASE_RECIPES) {
    parts.push(`TRIGGERS: "${recipe.triggers.join('", "')}"`)
    parts.push(`ASK: ${recipe.clarifyingQuestion}`)
    for (const variant of recipe.variants) {
      parts.push(`  IF "${variant.name}": ${variant.description}`)
      parts.push(`  HOW: ${variant.howToSetUp}`)
    }
    parts.push(``)
  }

  parts.push(`GENERAL GUIDANCE:`)
  parts.push(`- Always give specific navigation: "Go to Lists in the sidebar, then click New List"`)
  parts.push(`- Name the exact buttons: "Check the box labeled 'This is an opportunity list'"`)
  parts.push(`- When mom describes something ambiguous, ask whether it's more like a checklist (one-time items) or a skill-building program (practice + mastery)`)
  parts.push(`- If she mentions rewards, explain Money vs Points vs Privileges`)
  parts.push(`- If she mentions multiple kids, explain the pool modes (Shared = compete for claims, Individual = each kid tracks independently)`)
  parts.push(`- Smart Import is the power move — "You can paste everything at once and AI will sort it into your lists"`)
  parts.push(``)

  return parts.join('\n')
}
