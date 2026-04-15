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
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ POST-BUILD REQUIREMENT (applies to EVERY build session):       │
 * │                                                                │
 * │ When a build adds or changes a feature, update this file:      │
 * │                                                                │
 * │ 1. Add/update PAGE_KNOWLEDGE for any new or changed pages      │
 * │ 2. Add USE_CASE_RECIPES for goal-based questions the new       │
 * │    feature answers ("I want my kids to..." → this feature)     │
 * │ 3. Include warm clarifying questions that help LiLa discern    │
 * │    WHAT the user needs and HOW to set it up                    │
 * │                                                                │
 * │ Also update help-patterns.ts (src/lib/ai/help-patterns.ts)     │
 * │ with keyword patterns for $0 instant answers.                  │
 * │                                                                │
 * │ If it was built, LiLa should know how to walk mom through it.  │
 * └─────────────────────────────────────────────────────────────────┘
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

  '/studio': `STUDIO PAGE — Template workshop with 7 sections. Browse formats, customize, deploy.
  Sections:
  1. Task & Chore Templates — Simple Task, Routine Checklist, Opportunity Board, Sequential Collection
  2. Guided Forms — SODAS, What-If Game, Apology Reflection, Custom
  3. List Templates — Shopping, Wishlist, Packing, Expenses, To-Do, Randomizer, Custom
  4. Trackers & Widgets — 35+ starter configs (star charts, streak counters, mood check-ins, etc.)
  5. Gamification & Rewards — Gamification Setup, Day Segments, Coloring Reveals, Reward Reveals, Star Chart, Reward Spinner
  6. Growth & Self-Knowledge — "Get to Know Your Family" wizard, Best Intentions Starter
  7. Setup Wizards — "Routine Builder (AI)" guided brain-dump-to-routine wizard
  Setup Wizards use step-by-step flows. Star Chart wizard: name → assign → visual → goal → reward reveal → deploy.
  Get to Know wizard: pick member → 6 connection categories → save to InnerWorkings.
  Routine Builder: describe in natural language → AI organizes → review → opens Routine Creator for assignment.
  [Customize] on any template → opens creation modal or wizard.
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

  '/meetings': `MEETINGS PAGE — Structured family conversations with AI facilitation.
  4 built-in meeting types: Couple, Parent-Child, Mentor, Family Council. Custom templates supported.
  UPCOMING section: Shows meetings due within 7 days with Live Mode and Record After buttons.
  MEETING TYPES section: Expandable rows per type. Parent-Child and Mentor expand per child.
  Each row has: agenda item quick-add, schedule icon (calendar), sections icon (gear), Start Meeting button.
  AGENDA ITEMS: Add between meetings — items queue up and surface during the next meeting.
  Add from: Meetings page quick-add, Notepad > Send to > Agenda (picks meeting type), Review & Route.
  LIVE MODE: LiLa facilitates in real time, guiding through agenda sections. Pause/Resume/End controls.
  RECORD AFTER: Capture meeting retrospectively — tell LiLa what was discussed, get structured summary.
  POST-MEETING REVIEW: After ending, LiLa generates summary + extracts action items.
  Route each action item to Tasks, Calendar, Best Intentions, Guiding Stars, or Backburner.
  Summary auto-saves to Journal as meeting notes. Personal impressions are private.
  HISTORY: View All History shows completed meetings with type filter and read-only detail.`,

  '/settings/reward-reveals': `REWARD REVEALS LIBRARY — Mom's named celebration combos.
  Each combo = a reveal animation + prize content. [+ New Reveal] creates one.
  Pick one or more animations (they rotate if multiple), configure the prize (text, photo, platform image, or celebration-only).
  Named combos can be attached to any task, widget, list, or intention via the "Reward Reveal" section in their editor.
  Rotating prize pools: set mode to Sequential or Random — different prize each time!
  Prize Box: earned prizes show up for kids until mom marks them as redeemed.`,
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
    clarifyingQuestion: "I'd love to help you implement this! Tell me more about what you're picturing. Is this more like practical skills they need to actually learn and practice — like managing money or cooking — where they'd need to do it multiple times before they've really got it? Or is it more of a collection of experiences and memories you want to make sure happen before they're on their own? Give me a few examples of what's on your mind and I can figure out the best way to set it up for you.",
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
    clarifyingQuestion: "I can totally help you set that up! So help me understand what you're going for — are these the everyday chores that just need to get done and you want to rotate who does what each week? Or are you thinking more like an open job board where the kids can look through what's available and pick up extra work when they want to earn some money? Or maybe a little of both? What kinds of things are you thinking of putting on there?",
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
    clarifyingQuestion: "Fun! So are you imagining them scrolling through a list and picking what sounds good to them today? Or would it be more exciting as a surprise — like spinning a wheel and seeing what comes up? Some families love the mystery element because it gets kids to try things they wouldn't have picked on their own. What kind of activities are you thinking? That'll help me figure out the best setup.",
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
    clarifyingQuestion: "Exciting — planning season! Are you working from a specific textbook or curriculum where they need to go through it in order, chapter by chapter? Or is it more of a mix of activities and resources across different subjects that you need to get organized? If you have a table of contents or a list of topics, I can help you get those into the system really quickly. What are you working with?",
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
    clarifyingQuestion: "I love a good reading list! So is there a specific order you want them to go through these — like where book 2 builds on book 1? Or is it more of a 'here are great books, pick what interests you' kind of thing? And is this for one kid or are multiple kids working through the same list? Tell me what books you're thinking and I'll help you set it up the right way.",
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
    clarifyingQuestion: "Yes! Consistency is everything with practice. So tell me what this looks like for your family — are they working through a method book or a progression where they need to master each level before moving on? Or is it more about building a daily habit where they do a mix of exercises each session and you want to keep it varied so it doesn't feel stale? What instrument or skill, and roughly what level are they at?",
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

  // ── Reward Reveals ──
  {
    triggers: ['reward reveal', 'surprise reward', 'unlock reward', 'hidden reward', 'prize', 'treasure chest', 'celebration animation', 'potty chart reward', 'ice cream reward'],
    clarifyingQuestion: "I love that idea! Tell me more — is this a reward they'll see every time they finish something (like a daily routine), or more of a milestone surprise after reaching a goal (like every 5 stars on a chart)? And what's the actual reward — something specific like ice cream, or more of an encouraging message?",
    variants: [
      {
        name: 'Every-Completion Celebration',
        description: 'A reveal plays every time the task/routine is completed. Great for daily motivation.',
        howToSetUp: `When creating or editing the task, scroll down to the "Reward Reveal" section.
Pick a reveal animation (treasure chest, gift box, envelope — 30+ styles in 12 categories).
Set prize type: upload a photo of the actual reward, pick from the image library, or write a text message.
Set trigger to "Every time" and repeating to Yes.
Save — now every completion plays the reveal!`,
      },
      {
        name: 'Milestone Reward (Every N)',
        description: 'Reveal fires every N completions — perfect for star charts, practice goals, habit streaks.',
        howToSetUp: `Set up the tracker widget first (like a star chart or tally counter).
In the widget configuration, open the "Reward Reveal" section.
Pick your animation(s) — you can pick multiple and they'll rotate!
Set trigger to "Every N" and enter the number (e.g., every 5 stars).
Set the prize: text message, your own photo, or pick from the platform library.
For variety, set prize mode to "Random surprise" and add multiple prizes to the pool.
Each milestone gets a different surprise!`,
      },
      {
        name: 'Reusable Named Combo',
        description: 'Create a named reveal once, attach it to many things.',
        howToSetUp: `Go to Settings > Reward Reveals and tap [+ New Reveal].
Give it a name like "Ice Cream Reward" or "Movie Night Prize."
Pick the animation(s) and prize content.
Save it to your library.
Then on any task, widget, or list — open the Reward Reveal section and pick it from the "Pick from library" dropdown.
Change the trigger mode per attachment (every time on one task, every 5 on another).`,
      },
    ],
  },

  // ── Setup Wizard Recipes ──────────────────────────────────
  {
    triggers: ['potty chart', 'potty training', 'toilet training', 'potty sticker chart', 'star chart for potty'],
    clarifyingQuestion: "A potty chart is a great idea! Do you want a simple star chart where you tap to add a star each time, or do you also want a reward celebration when they reach a goal (like 10 stars = ice cream)?",
    variants: [
      {
        name: 'Simple Potty Star Chart',
        description: 'Tap to add a star each time. No reward — the chart itself is the celebration.',
        howToSetUp: `Go to Studio → Gamification & Rewards → Star / Sticker Chart → Customize.
The wizard walks you through: name it "Potty Stars", pick your child, choose the star chart visual, set a goal count (try 10), skip the reward. Deploy to their dashboard.
Each success → tap the chart to add a star.`,
      },
      {
        name: 'Potty Chart with Reward',
        description: 'Stars + a celebration reveal when they reach the goal.',
        howToSetUp: `Same wizard as above, but on the "Add Reward" step, tap "Create new" and pick an animation (card flip is fun for little ones).
Set the prize: a text message like "ICE CREAM TIME!" or upload a photo of the actual reward.
When they reach the star goal, the reveal animation plays automatically.`,
      },
    ],
  },
  {
    triggers: ['get to know', 'learn about my kids', 'what my child likes', 'gift ideas for my kid', 'connection preferences', 'love language kid'],
    clarifyingQuestion: "That's wonderful! Do you want to do a guided walkthrough for one family member at a time, or are you looking to understand a specific area (like gift ideas, comfort needs, or communication style)?",
    variants: [
      {
        name: 'Full Get to Know Walkthrough',
        description: 'Walk through all 6 connection categories for one person.',
        howToSetUp: `Go to Studio → Growth & Self-Knowledge → Get to Know Your Family → Customize.
Pick the family member. The wizard guides you through 6 categories:
1. Things I'd Love (gift ideas)
2. Words That Mean Something (meaningful words)
3. What Really Helps (helpful actions)
4. Ways to Spend Time Together (quality time)
5. Good to Know (sensitivities)
6. What Makes a Bad Day Better (comfort needs)
Add as many entries as you want per category. Everything saves to InnerWorkings and LiLa uses it to personalize suggestions.`,
      },
      {
        name: 'Quick Category Add',
        description: 'Add entries for a specific category from InnerWorkings directly.',
        howToSetUp: `Go to InnerWorkings (sidebar → Grow → InnerWorkings).
Pick the family member, then scroll to the Connection Preferences section.
Each category has starter prompts and an add button. Same data, just a different entry point.`,
      },
    ],
  },
  {
    triggers: ['morning routine', 'bedtime routine', 'after school routine', 'chore checklist', 'routine from scratch', 'set up a routine'],
    clarifyingQuestion: "Great idea! Would you like to describe the routine in your own words and have AI organize it into sections (the quick way), or build it manually step by step (the precise way)?",
    variants: [
      {
        name: 'AI Routine Builder (recommended)',
        description: 'Describe the routine naturally. AI organizes it into frequency-based sections.',
        howToSetUp: `Go to Studio → Setup Wizards → Routine Builder (AI) → Customize.
Name the routine, then describe it the way you'd tell your kids:
"Every morning make bed, brush teeth, get dressed, eat breakfast. On school days also pack lunch, check homework folder."
Tap Next → AI organizes it into sections (Daily, Weekdays, etc.) with steps.
Review and tweak, then tap "Use This Routine" → the full Routine Creator opens for assignment and deployment.`,
      },
      {
        name: 'Manual Routine Builder',
        description: 'Build sections and steps by hand for full control.',
        howToSetUp: `Go to Studio → Task & Chore Templates → Routine Checklist → Customize.
This opens the full Routine Creator. Add sections (+ Add Section), set each section's frequency (Daily, MWF, Weekly, etc.), then add steps within each section.
Assign to family members and deploy.`,
      },
    ],
  },
  {
    triggers: ['chore system', 'chore chart', 'chore rotation', 'set up chores', 'chore with rewards', 'earn allowance from chores'],
    clarifyingQuestion: "A chore system can include several pieces — which of these matter to you?\n- Daily chore checklist (routine)\n- Rotating chores between kids\n- Points or allowance for completion\n- Visual reward celebrations\n- Extra optional jobs kids can claim\n\nTell me what you're picturing and I'll walk you through the best setup!",
    variants: [
      {
        name: 'Basic Chore Routine',
        description: 'Daily checklist that resets fresh each day. No rewards.',
        howToSetUp: `Use the Routine Builder wizard in Studio (Setup Wizards → Routine Builder AI) or create a Routine manually.
Assign to kids. They see a checklist on their dashboard that resets each day.`,
      },
      {
        name: 'Chores + Gamification + Rewards',
        description: 'Full system: routine + points + celebrations + optional allowance.',
        howToSetUp: `1. Create routine (Studio → Routine Builder or manual)
2. Enable gamification (Settings → Gamification → [child]) — points per task, earning mode, sticker book
3. Set up day segments (Morning, School, Jobs, Evening) to organize their dashboard
4. Add reward reveals on individual tasks (scroll to Reward Reveal section when editing a task)
5. Optional: enable allowance (Settings → Allowance → [child]) and flag tasks with "counts for allowance"
6. Optional: add an Opportunity Board for bonus jobs (Studio → Opportunity Board)`,
      },
      {
        name: 'Rotating Chores',
        description: 'Chores rotate between kids weekly/biweekly/monthly.',
        howToSetUp: `Create a task, assign 2+ kids, and toggle on Rotation in the Assignment section.
Pick the frequency (weekly, biweekly, monthly). The system auto-rotates who's responsible.
Each kid sees only their current assignment on their dashboard.`,
      },
    ],
  },

  // ── Meetings (PRD-16) ──────────────────────────────────────
  {
    triggers: ['family meeting', 'couple meeting', 'want to meet regularly', 'talk with my husband', 'check in with my kid', 'mentor meeting', 'family council'],
    clarifyingQuestion: "What kind of meeting are you thinking about? A one-on-one with your spouse, a check-in with a specific child, or a whole-family council?",
    variants: [
      {
        name: 'Couple Meeting',
        description: 'Regular check-in with your spouse. Covers relationship temperature, parenting alignment, calendar coordination, and appreciation.',
        howToSetUp: `1. Go to Meetings in the sidebar
2. Under "Couple Meeting" tap the calendar icon to set a recurring schedule (weekly works well)
3. Tap the gear icon to customize the agenda sections — the defaults cover Check-In, Relationship, Parenting, Calendar, Dreams, and Appreciation
4. Between meetings, add agenda items from the Meetings page or from Notepad > Send to > Agenda
5. When it's time, tap "Live Mode" — LiLa guides you through each section`,
      },
      {
        name: 'Parent-Child Meeting',
        description: 'Regular one-on-one with a child. Celebrate wins, discuss challenges, make commitments together.',
        howToSetUp: `1. Go to Meetings — you'll see Parent-Child Meeting expand per child
2. Set a schedule for each child you want to meet with
3. Customize sections — defaults: How Are You, Wins & Growth, Discussion, Problem-Solving, Commitments
4. Kids can add agenda items from the Guided dashboard in a future update
5. During the meeting LiLa helps facilitate — guiding without lecturing`,
      },
      {
        name: 'Family Council',
        description: 'Whole-family meeting. Old business, new business, calendar review, appreciation circle.',
        howToSetUp: `1. Go to Meetings > Family Council
2. Set a recurring schedule (weekly or biweekly is typical)
3. Any family member with meeting access can add agenda items between meetings
4. When you start, pick "Live Mode" and select all participants
5. LiLa opens with a warm welcome and guides through each section in order`,
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
  parts.push(`- Be conversational and warm — you're a knowledgeable friend, not a manual. Use natural language, not form-like "Option A or Option B?" questions.`)
  parts.push(`- When mom describes what she wants, ask for EXAMPLES of the actual items she's thinking of. "What kinds of things are you picturing?" Her examples tell you which setup is right.`)
  parts.push(`- Give specific navigation when guiding: "Go to Lists in the sidebar, then click New List" — name the exact pages and buttons.`)
  parts.push(`- Don't present all variants at once. Ask the clarifying question, listen to her answer, THEN recommend the one that fits. If it's not clear, ask one more question.`)
  parts.push(`- When you recommend a setup, walk through it step by step — don't dump all the steps at once. Do one step, ask if she's there, then do the next.`)
  parts.push(`- If she mentions rewards, naturally explain the options: "You can set it up with dollar amounts if you want to tie it to allowance, or use points if it's more about gamification — which feels right for your family?"`)
  parts.push(`- If she mentions multiple kids, ask: "Should they all see the same list and race to claim things, or should each kid have their own version?"`)
  parts.push(`- Smart Import is the power move when she has a big list: "Actually — you can paste all of those at once and I'll sort them into the right lists for you. Want to try that?"`)
  parts.push(``)

  return parts.join('\n')
}
