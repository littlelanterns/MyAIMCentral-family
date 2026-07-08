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

  '/wishlists': `WISHLISTS PAGE — one canonical wishlist per family member, plus mom's hidden Gift Planning space.
  CAPTURE: [Capture] button (or the Gift icon in QuickCreate) opens WishCatch — pick who it's for, type/speak/photo/paste-a-link, tap Add. Saves in ~5 seconds, nothing blocks on AI. A photo saves instantly with the image; the AI-suggested title appears after, as a confirm/edit chip. A pasted link auto-fills title/image/price when possible ("auto-filled — check it"); otherwise shows a confirm chip too.
  FAMILY TAB (mom/adult): person pills across the top — tap any member to see their wishlist. Item detail sheet: photo, notes, price, link, occasion tags, priority (Must-Have/Would-Love/Nice-to-Have), Heart (LiLa context), "Changed my mind" (moves to Maybe Later, reversible).
  GIFT PLANNING TAB (mom + any adult granted "Gift Planning" in the Permission Hub): pick a kid, capture private gift ideas about them (they never see this), browse their real wishlist and tap "Consider for gift" to copy an item into your planning list with a note showing where it came from, and mark items Reserved/Purchased/Given.
  INDEPENDENT (teen) shell: full control — drag to reorder priority, occasion filter, "$X away" balance chips if mom's turned on finance visibility, Maybe Later section.
  GUIDED shell: simplified list, add + "changed my mind" only.
  PLAY shell: picture grid, no prices ever — reachable from the Fun tab's "My Wish List" button.
  Share links for grandma and gift history are coming in the next update.`,

  '/tasks': `TASKS PAGE — purely PERSONAL (FO-COMMAND-CENTER 2026-06-10): your own items only, for every role including mom.
  TWO TABS for every role (OPPORTUNITY-SURFACES 2026-07-02): My Tasks and Opportunities.
  OPPORTUNITIES TAB: the browsable opportunity boards. Each member sees the boards they're eligible for; mom sees EVERY board (she can claim only where eligible). Expand a board to see items with rewards and "I'll do this!" claim buttons. Standalone opportunity tasks group below the boards. Completing a claimed job automatically checks it off the board.
  MY TASKS TAB — VIEW CAROUSEL: prioritization views (Simple List, Eisenhower, Eat the Frog, 1-3-5, By Category, Kanban, Now/Next/Optional; more coming).
  INCLUDE PILLS above the carousel: tap Routines / Opportunities / Sequential to pull those item types into your views for the day. "Save as default" makes a mix permanent. Sequential items show just the NEXT thing to do — tap it to open the whole collection.
  [Create] + [Bulk Add] buttons in the header; status pills (active/completed/all); Review Queue badge opens the queue modal.
  Family management moved: spot-checking kids, Approvals, Queue, and Finances all live on Dashboard → Family Overview now.
  Guided kids keep their simple two tabs here (My Tasks, Opportunities).
  Play kids don't use this page — their opportunity boards render as "Extra Jobs" tap-to-claim tiles right on the Play dashboard (dollar amounts hidden unless mom opts that kid into money visibility; star rewards always show).`,

  '/dashboard#family_overview': `FAMILY OVERVIEW — mom's command center (Dashboard → "Family Overview" tab; dads see it only when granted).
  4 page tabs: Overview, Approvals(N), Queue(N), Finances (Queue + Finances are mom-only).
  OVERVIEW: side-scrolling member columns. Sections per kid (collapsible, reorder persists): Today's Events, Today's Tasks (tap checkbox to mark done — no un-marking from here), Routines (steps done today), Sequential (progress + next item), Opportunities, Best Intentions, Active Trackers, Weekly Completion (allowance % + on-track payout), Victories.
  OPPORTUNITIES SECTION per column shows three things: jobs the kid has CLAIMED (with a mom-only [Return] button to put one back), jobs completed today, and the BROWSABLE BOARD — every unclaimed item the kid is eligible to claim, with rewards (OPPORTUNITY-SURFACES 2026-07-02).
  Member pills choose whose columns show; the calendar follows the same selection.
  SPOT-CHECK: tap a member's name → deep view with My Tasks / Routines / Opportunities / Sequential tabs. Complete or EDIT any item right there (full edit modal opens inline). Mom can create a new Sequential Collection from the Sequential tab.
  APPROVALS: every pending submission incl. mastery submissions (practice history + evidence shown). Approve/Reject with optional note.
  QUEUE: the full Sort surface — Configure, batch processing, dismiss.
  FINANCES: the family financial summary (balances, recent transactions, makeup-task shortcuts).`,

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
  Browse extracted wisdom. Heart items for LiLa to reference. Send to Guiding Stars, Tasks, Journal Prompts, or Notepad.
  Book Discussion: multi-book RAG conversation with LiLa about your library.
  STUDY GUIDES — Generate age-appropriate reading levels for any book. Go to Study Guides tab, click Generate.
  Creates Teen (13-16) and Kid (8-12) versions from the actual book text. Use the Adult/Teen/Kid toggle to switch reading levels.
  Study guides are family-wide. For large books, generation may need multiple clicks — it resumes automatically.`,

  '/sweep': `MINDSWEEP — Quick-capture brain dump. Text, voice, scan (OCR), link import.
  AI classifies each item → routes to the right destination (task, calendar, journal, list, etc.)
  Aggressiveness modes: Always Ask, Trust Obvious, Full Autopilot.
  DIRECT DEPLOY (2026-06-10): when Trust Obvious / Full Autopilot auto-routes a task or list item, it's created IMMEDIATELY — tasks land on your Tasks page, list items in your list. Calendar items and anything uncertain still go to the Queue for review. Always Ask = everything goes to the Queue.`,

  'notepad-review-route': `REVIEW & ROUTE (Smart Notepad) — AI extracts individual items from a brain dump into review cards.
  Each card shows the suggested destination (Task, List, Journal, Victory...). Tap the suggestion to accept, "Change" to pick a different destination, the pencil to edit text, or skip.
  For List items, "Change" → List shows YOUR LISTS so you pick exactly which list it lands in.
  [Route All N Pending] approves everything at its suggested destination.
  DIRECT DEPLOY: approved tasks and list items are created instantly (tasks assigned to YOU on your Tasks page). A summary confirms where everything went ("8 tasks added · 1 sent to your Queue"). Calendar items go to the Queue for date review. You can open any created task afterward to add a due date or details.`,

  'task-assignment-permissions': `WHO CAN ASSIGN TASKS TO WHOM (2026-06-10):
  Mom: can assign tasks to anyone (full roster + Everyone pill).
  Other adults (dad/partner): create tasks for THEMSELVES only by default. Mom can grant assignment access in the Permission Hub: "Assign tasks to kids — whole family" (one switch, covers kids added later) or per-child "Assign tasks to this child" (a child's own setting overrides the whole-family one, including an explicit Off).
  Teens: themselves only — to get something on someone else's plate they send a Request ("Ask someone").
  This is enforced at the database too, not just the buttons. Granting: Permission Hub → adult's card → Family Management section (whole-family) or the child's permission grid (per-child).`,

  '/meetings': `TOUCH BASE PAGE — Keep track of things you want to talk about with anyone.
  Expandable cards per conversation: Couple, Parent-Child (per child), Mentor (per child), Family Council, plus custom.
  INLINE CHECK-OFF: Tap the circle next to any item to mark it as discussed — no formal meeting needed.
  NOTES: Tap "Notes" to jot things down during a conversation. "Save to Journal" persists it.
  ADD ITEMS: Quick-add at the bottom of each card, or route from Notepad > Send to > Agenda, Review & Route, or MindSweep.
  FORMAL MEETING (optional): Tap "Formal Meeting" for LiLa-facilitated conversation with agenda sidebar. Post-meeting review extracts action items → route to Tasks, Calendar, Lists, etc. Summary auto-saves to Journal.
  RECORD & TRANSCRIBE: Optional checkbox in the Formal Meeting modal — opens Notepad for recording when ready.
  SCHEDULING (optional): Tap "Add Schedule" for recurring reminders — but most conversations are just ongoing.
  CUSTOM: "Add a Conversation" creates new types — IEP prep, parent-teacher notes, homeschool coordinator, etc.
  HISTORY: "View All" shows completed sessions with search by title or summary.
  Items carry forward: undiscussed items stay on the card until you check them off.`,

  '/settings/reward-reveals': `REWARD REVEALS LIBRARY — Mom's named celebration combos.
  Each combo = a reveal animation + prize content. [+ New Reveal] creates one.
  Pick one or more animations (they rotate if multiple), configure the prize (text, photo, platform image, or celebration-only).
  Named combos can be attached to any task, widget, list, or intention via the "Reward Reveal" section in their editor.
  Rotating prize pools: set mode to Sequential or Random — different prize each time!
  Prize Box: earned prizes show up for kids until mom marks them as redeemed.`,

  '/prize-board': `PRIZE BOARD — 3 tabs: Allowance, Prizes, Balance.
  ALLOWANCE TAB: Unpaid periods grouped by date range. Each group expands to show per-pool breakdown (pool name, percentage, earned amount, weight). "Paid" button marks all pools in that period as closed.
  PRIZES TAB: Earned IOUs from reward reveals, one per kid — PLUS a "Family Goals" strip at the top showing active family goals with progress bars and a "Manage Family Goals" button (opens the same manager as Hub Settings). Earned-but-unredeemed family prizes render in their own "Family" group when arranged By kid, or with a "Family" tag when arranged By date — they're a whole-family prize, not any one kid's. A summary strip up top shows how many prizes are waiting and across how many kids (family prizes counted separately, e.g. "+1 family prize" — prizes/privileges only, never dollar amounts). "Arrange: By kid / By date" toggle switches between grouped-per-kid and one combined chronological stream (choice remembered). Mark a prize "Redeemed" when fulfilled — for a family prize this redeems it for everyone at once; recently redeemed prizes have an Un-redeem button for accidental taps. A "Me" pill at the top is mom's own promises-to-herself — her own self-proposed rewards, redeem, history, and "Promise Yourself a Reward" — kept separate from what's owed to the kids below.
  BALANCE TAB: Full earnings ledger with running balance.
  Kid selector pill bar at top — tap a kid for their ledger, "All Kids" for combined chronological stream.
  Filters: All / Earnings / Payments / Adjustments / By Pool.
  Pool contribution rows (informational, no money amount) show in lighter style.
  Pay button opens PaymentModal — full or partial amount with note field.
  Kids see their own ledger only (respects child_can_see_finances per pool). Play shell shows percentages only.`,

  '/settings/allowance': `ALLOWANCE & FINANCES SETTINGS — Per-child allowance configuration.
  SINGLE POOL (default): Weekly amount, bonus threshold, calculation approach. No pool list visible.
  "+ Add another pool" at bottom reveals multi-pool management.
  MULTI-POOL: Pool list with cards. Each pool has: name, payout mode (weekly/biweekly/monthly/term/measurement-only), weight, overage cap, bonus config.
  Expand a pool card to edit all settings. Measurement-only pools track without paying out.
  Pool lifecycle: Pause (stops new periods, current period stays open, excluded from combined math), Archive (hidden by default, "Show archived" toggle), Activate (resume).
  Grace days: Applied at the member level (above pool list) — one grace day updates ALL pool periods.
  Bulk Configure button: Apply same pool config across multiple kids, or add a new pool to all selected kids.
  Term-length pools: Start/end date pickers for semester-based tracking.
  Overage cap: Default 100%. Set higher (e.g. 150%) to allow extra-credit bonus above 100%.`,

  '/family-password': `FAMILY PASSWORD PAGE — Set or change the family's shared login password (mom only).
  Reached via Settings > Family Management > Family Password.
  The family password is the outer door for family login: on a NEW device, family members enter the Family Login Name AND this password together — member names only appear after both are correct. Entered once per device.
  Requirements: at least 8 characters with a letter and a number.
  Changing it signs out EVERY device using family login — the kill switch for a lost or stolen device. Mom's own email login is unaffected.
  Mom's email/password is the recovery path — there is no separate family-password reset email.`,

  '/family-members#login': `FAMILY MEMBER LOGIN OPTIONS — Per-child login style (mom only, Family Members page).
  Each member row has: Key icon = set a PIN (4 digits; default is their birthday MMDD). Image icon = set a Picture Login OR choose "No login needed."
  Picture Login: mom picks the child's ONE secret picture from a grid. At login the child taps their picture from a grid of 9 (theirs + decoys). Wrong taps count toward the same 5-try/15-minute lockout as PINs.
  "No login needed" is safe on family devices because the device already passed the Family Password door.
  After the family door, the device shows a choice screen: tap "Family Hub" to make it a shared family screen (kids dip in with PIN/picture from the hub), or tap a name + their PIN/picture to make it that person's own device.
  Mom's own tile always asks for HER email sign-in — the family password never opens mom's dashboard.`,

  '/my-rewards': `MY REWARDS PAGE — each family member's own rewards hub (Guided/Independent/Adult; Play gets the same sections on their Fun tab). Mom turns sections on per person: Family Members > [member] > Gamification Settings > "My Rewards Page."
  Sections mom can enable: Points & streak, Custom Rewards (redeem-ready prizes + Previously Redeemed history), Victories (tap one to see its celebration narrative), Finances (money owed — reconciles with the Balance page), Creatures (sticker-book background frame), Coloring (active + finished reveal gallery), and Propose a deal (Guided+ kids only, never Play).
  PROPOSE A DEAL (kids/teens): the kid describes what they want and what they'll do to earn it — once, a daily streak for N days, or finishing a checklist of items. It lands as a pending card in mom's Queue > Requests tab.
  PROMISE YOURSELF A REWARD (adults, including mom on her own page): same idea, but self-directed and private by default — she can optionally share it with specific family members.
  Mom's processing options on a pitch: Approve (opens a prefilled task, streak tracker, or routine checklist for her to confirm — nothing is created until she saves), Counter (revise the terms once; the kid then accepts or declines the counteroffer), or Decline with an optional note.
  The reward itself is never auto-created — mom always confirms through the normal creation flow first.
  FAMILY GOALS section (default on): any family goal this member participates in, shown as "You: X · Family: Y/Target" (or "You: X / Target" for "everyone does their part" goals), plus any earned family prizes ready to redeem.`,

  '/settings#safety-monitoring': `SETTINGS > SAFETY MONITORING (mom/primary-parent only — dad never sees this screen even when he receives flags). The invisible safety net behind LiLa.
  WHO GETS ALERTED: mom is always on (locked, can't be turned off). Dad gets a toggle if he should also receive flags.
  DELIVERY: in-app notifications only for now (email is coming). A weekly trend summary will show up automatically once it ships — no setup needed.
  WHO'S MONITORED: a row per child/adult with an ON/OFF toggle. Children default ON (opt-out); additional adults default OFF (opt-in). Mom herself can never be monitored. Tap the gear icon next to an active row to open sensitivity settings.
  SENSITIVITY MODAL: 8 categories (self-harm, abuse, sexual/predatory content, substance use, eating disorder language, bullying, profanity, other) each set to Low/Medium/High. Self-harm, abuse, and sexual/predatory content are LOCKED at High — there's no control to lower them, by design.
  "View Flag History" link goes to /safety-flags — filterable by member, category, and time, with each flag opening a detail view (category, severity, timestamp, a warm "how to bring this up" suggestion, and curated resources — never the conversation content itself).`,

  '/meals': `KITCHENCOMPASS (Meal Planning, PRD-42 Phase A) — Plan & Do > KitchenCompass in the sidebar. Two tabs: This Week, Recipe Box.
  RECIPE BOX: search + filter (Favorites, Traditions, Quick <30min, Slow cooker, New), sort, "+ Add Recipe" opens a 4-tile capture chooser: Link (paste a URL), Photo (snap a recipe card), Paste (paste recipe text), This Went Well (describe from memory, voice-enabled). Every capture shows a review card first — Edit/Approve/Regenerate/Reject — nothing saves until Approve (Human-in-the-Mix).
  RECIPE DETAIL: scale stepper (0.5x–4x + custom), an optional AI "Smooth these with AI" pass for awkward-to-scale ingredients (also HITM-reviewed), Save This Version for variants, a rotation dial (favorite/normal/rest/retired, mom-only), and a FAMILY POINTERS section — short "how WE do it" notes attached to the recipe. Anyone can read pointers; only mom/granted adults can add or edit them.
  THIS WEEK: a 7-day grid (List/Week/Month view switcher), tap a day/slot to add a meal or drag an existing one to a different day. Tap a planned meal to open its entry sheet: assign who's cooking, tag which kids helped, mark made / didn't happen, add notes. "Cook This" opens COOK VIEW — a big-type, step-by-step surface for cooking, showing Family Pointers matched to the recipe and to specific technique tags (e.g. a "searing" pointer surfaces on any step that mentions searing), with quantities scaled to the planned servings and a mic-addable "add a pointer for next time" box.
  MARK MADE follow-up: after marking a meal made, quick prompts appear to plan leftovers tomorrow, log a helping kid's homeschool cooking minutes, or celebrate them with a Victory.
  SEND TO SHOPPING LIST: from a single recipe or the whole week — merges duplicate ingredients across recipes, sums quantities, scales for planned servings, lets you edit/exclude items or mark "already have it," then writes into an existing shopping list.
  FOOD PROFILES (shield icon button): a whole-family row plus a card per member. RESTRICTIONS (allergies, intolerances) are always included in meal planning and CANNOT be toggled off — a deliberate safety exception to the usual is_included_in_ai pattern. LOVES / NOT A FAN OF quick-add saves to that person's Archives Preferences. A private, mom-only "nutrition awareness" note nudges suggestions qualitatively — no calorie/macro tracking anywhere, and it never shows on a kid's screen.
  ACCESS: mom always has full access. Other adults need the "KitchenCompass plan editing — whole family" grant in the Permission Hub. Not yet available: suggestion engine, LiLa meal-planning mode, kid-facing meal views, Family Hub "what's for dinner" card, and grocery-cart export — those ship in a later phase.`,
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
    triggers: ['wish list', 'wishlist', 'grandma asks what they want', 'kid saw something at the store', 'gift idea', 'gift planning', 'christmas list', 'birthday list', 'wanted a toy at the store'],
    clarifyingQuestion: "WishLists is built for this. Are you looking to catch something your kid wants right now (the in-store \"I'll put it on your list\" moment), or set up your own private gift-planning notes about what to get them?",
    variants: [
      {
        name: 'Catch a want in the moment',
        description: 'The 5-second capture — text, voice, photo, or a pasted link.',
        howToSetUp: `Tap the Gift icon in your + menu (QuickCreate), or open WishLists from the Family section of your sidebar and tap [Capture].
Pick who it's for, then type it, speak it, snap a photo of the item, or paste a product link — tap Add.
It's saved instantly. Your kid can open their own WishLists page anytime and see it there, with "you added this."`,
      },
      {
        name: 'Private gift-planning notes',
        description: "Mom's hidden Gift Planning space — the kid never sees it.",
        howToSetUp: `Open WishLists and switch to the Gift Planning tab (visible to you, and to any adult you've granted "Gift Planning" access to in the Permission Hub).
Pick the kid, then either capture a new idea directly, or browse their real wishlist and tap "Consider for gift" to copy an item into your planning list — it keeps a note of where it came from.
Mark items Reserved, Purchased, or Given as you shop. None of this ever appears on the kid's own wishlist.`,
      },
    ],
  },
  {
    triggers: ['family goal', 'family prize', 'whole family reward', 'work together as a family', 'shared prize', 'family movie night', 'earn something together', 'family working together'],
    clarifyingQuestion: "Family Goals are perfect for this — the whole family works toward one prize together. Quick question: should any ONE family member's contribution count toward a shared total (like tallying \"Remain Calm\" 50 times as a family), or does EVERY participant need to hit their own target before it's earned (like each kid reading 10 books)?",
    variants: [
      {
        name: 'All together (shared counter)',
        description: 'One shared counter — anyone\'s contribution counts toward the family total.',
        howToSetUp: `Open the Prize Board's Prizes tab (or Hub Settings > Family Goals & Prizes) and tap "Manage Family Goals" > "New Family Goal."
Pick "All together," set the target count, name the prize, and choose who participates.
Link it to a Family Best Intention tally and/or specific tasks — every qualifying tap or completion counts automatically, from the Hub tablet, anyone's dashboard, or a task checkbox.
When the shared total hits the target, the family earns the prize instantly — redeem it once from the Prize Board and everyone's done.`,
      },
      {
        name: 'Everyone does their part (each member)',
        description: 'Each participant must hit their own target independently.',
        howToSetUp: `Same manager, but pick "Everyone does their part" and set the per-person target.
The goal completes only once every participant has individually reached the target — the Hub and My Rewards pages show each person's own progress toward it.`,
      },
    ],
  },
  {
    triggers: ['check on my kids', 'see how everyone is doing', 'spot check', 'did the kids do their chores', 'family at a glance', 'approve their work', 'command center'],
    clarifyingQuestion: "The Family Overview is built for exactly this! Quick question so I point you right: do you want the at-a-glance view of everyone's day, a deep-dive on ONE child, or are you looking to clear out approvals and queue items?",
    variants: [
      {
        name: 'Everyone at a glance',
        description: "Side-by-side columns showing each kid's day.",
        howToSetUp: `Go to Dashboard and tap "Family Overview" at the top.
Use the member pills to pick whose columns show — your picks are remembered.
Each column shows their events, tasks (tap the checkbox to mark one done), routine progress, sequential progress, opportunities, intentions, trackers, weekly completion (with on-track allowance), and today's victories.
Tap any section header to collapse that section across all columns.`,
      },
      {
        name: 'Deep-dive on one child',
        description: "Spot-check one kid's items and fix anything on the spot.",
        howToSetUp: `On Family Overview, tap the child's NAME at the top of their column.
Their spot-check view opens with My Tasks / Routines / Opportunities / Sequential tabs.
Tap a checkbox to complete something for them, or the pencil to open the full edit modal right there — no page hopping.`,
      },
      {
        name: 'Clear approvals + queue',
        description: 'Process everything waiting on your decision.',
        howToSetUp: `On Family Overview, use the Approvals tab for pending submissions (mastery submissions show practice history and evidence — approving releases rewards).
The Queue tab is your decision inbox: Configure turns a captured thought into a real task or list item; Dismiss lets it go guilt-free.
The Finances tab shows balances and recent transactions for the whole crew.`,
      },
    ],
  },
  {
    triggers: ['set up the tablet', 'family device', 'kids own device', 'kids log in', 'shared computer', 'how do my kids sign in', 'set up logins'],
    clarifyingQuestion: "Happy to walk you through it! Quick question first — is this a shared device the whole family will use (like a kitchen tablet), or one child's own device? And for your kids: would each do better with a 4-digit PIN, or a secret picture they tap (great for pre-readers), or no login at all once the device is unlocked?",
    variants: [
      {
        name: 'Shared family device (hub)',
        description: 'A kitchen tablet or living room screen the whole family uses.',
        howToSetUp: `First make sure your Family Login Name and Family Password are set (Settings > Family Management).
On the device: go to the Family Login page, enter the Family Login Name + Family Password (once per device), then tap "Family Hub."
The device now rests on the Hub. Kids tap their avatar + PIN or secret picture to open their own dashboard, and it returns to the Hub when they're done.
If the device is ever lost, change the Family Password in Settings — every family device signs out immediately.`,
      },
      {
        name: "A child's own device",
        description: 'A kid keeps their own tablet signed in as themselves.',
        howToSetUp: `On their device: Family Login page → Family Login Name + Family Password → tap THEIR name → their PIN or secret picture.
The device stays signed in as them. Set their login style first in Family Members: key icon for a PIN, image icon for a secret picture (you pick their one picture; at login they tap it from a grid), or "No login needed."
Their session follows their age-based rules; the family layer stays on the device until signed out.`,
      },
    ],
  },
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

  // ── Touch Base (PRD-16) ──────────────────────────────────────
  {
    triggers: ['family meeting', 'couple meeting', 'want to meet regularly', 'talk with my husband', 'check in with my kid', 'mentor meeting', 'family council', 'touch base', 'things to discuss', 'agenda', 'iep meeting prep', 'parent teacher', 'conversation topics'],
    clarifyingQuestion: "Who do you want to keep a running conversation with? Your spouse, a specific child, the whole family, or someone outside the home like a teacher or coordinator?",
    variants: [
      {
        name: 'Couple Conversations',
        description: 'Keep a running list of things to talk about with your spouse — check them off as you discuss them over dinner, on a walk, whenever.',
        howToSetUp: `1. Go to Touch Base in the sidebar
2. Expand "Couple Meeting" and add things as they come to mind
3. When you talk, tap the circle next to each item to mark it discussed
4. Tap "Notes" to jot down decisions or follow-ups — save to journal when done
5. Want LiLa to facilitate a structured conversation? Tap "Formal Meeting" for guided sections`,
      },
      {
        name: 'One-on-One with a Child',
        description: 'Remember things you want to talk about with each kid. Check-ins, school stuff, goals, tricky situations — add items anytime and check them off when you connect.',
        howToSetUp: `1. Go to Touch Base — you'll see a card for each child under Parent-Child Meeting
2. Add items whenever something comes up ("talk to Gideon about screen time")
3. Check them off during your next conversation — no formal sit-down required
4. Use Notes to capture what you decided together`,
      },
      {
        name: 'Family Council',
        description: 'Whole-family conversations. Everyone can add items. Great for weekly check-ins, planning, or just catching up.',
        howToSetUp: `1. Go to Touch Base > Family Council
2. Any family member with access can add agenda items
3. Check off items during your family time
4. For a structured session, tap "Formal Meeting" — LiLa guides through opening, old business, new business, calendar, appreciation, and closing`,
      },
      {
        name: 'Outside Conversations (IEP, Teachers, Coordinators)',
        description: 'Track things to bring up at IEP meetings, parent-teacher conferences, homeschool co-op check-ins, or anything with contacts outside the family.',
        howToSetUp: `1. Go to Touch Base and tap "Add a Conversation"
2. Name it something like "IEP Meeting Prep" or "Mrs. Johnson — 4th Grade"
3. Add items as they come up throughout the week
4. Before the meeting, review your list. During or after, check things off and jot notes
5. Your history is searchable — look back at what was discussed in previous sessions`,
      },
      {
        name: 'Personal Reflection',
        description: 'Keep a running list of things to think through on your own — or process with LiLa.',
        howToSetUp: `1. Tap "Add a Conversation" and name it something like "Things on My Mind"
2. Add items whenever something comes up you want to process
3. Check them off as you work through them, or tap "Formal Meeting" to think through them with LiLa`,
      },
    ],
  },

  // ── Study Guides (PRD-23 Rework) ────────────────────────────
  {
    triggers: ['study guide', 'kid version of book', 'teen version', 'reading level', 'age appropriate book', 'simplified version', 'child friendly book', 'homeschool reading'],
    clarifyingQuestion: "Are you looking to create age-appropriate reading levels for a book already in your library, or are you wondering how to use study guides that have already been generated?",
    variants: [
      {
        name: 'Generate Study Guide for Existing Book',
        description: 'Creates Teen and Kid reading levels from the original book text.',
        howToSetUp: `1. Go to BookShelf → Study Guides tab
2. Find the book you want — it needs to be fully extracted first (shows "completed" status)
3. Tap "Generate Study Guide" — this reads the actual book text and creates age-adapted versions using Sonnet
4. For longer books this takes a few minutes. If it times out, just click Generate again — it picks up where it left off
5. Once generated, go to the book and use the Adult / Teen / Kid toggle to switch reading levels
6. Everyone in the family can view any level — study guides are family-wide, not per-child`,
      },
      {
        name: 'Browse Existing Study Guides',
        description: 'View books that already have Teen and Kid versions available.',
        howToSetUp: `1. Go to BookShelf → Study Guides tab
2. Books in the "Ready to View" section already have study guides
3. Tap "View Teen" or "View Kid" to open the book at that reading level
4. You can also go to any book page and use the Adult / Teen / Kid toggle if it's available
5. New books uploaded through the app get all three levels automatically during processing`,
      },
    ],
  },

  // ── Meeting Setup Wizard (Studio Phase 5) ──────────────────
  {
    triggers: ['set up all meetings', 'schedule meetings for everyone', 'bulk schedule meetings', '1:1 time with kids', 'monthly date with kids', 'birthday date meeting', 'alternate parent meetings'],
    clarifyingQuestion: "Want to set up your entire family meeting calendar in a few minutes? The Meeting Setup Wizard schedules everything at once.",
    variants: [
      {
        name: 'Meeting Setup Wizard',
        description: 'Guided wizard that creates Family Council + 1:1 time with each child + Couple Check-in schedules in one flow.',
        howToSetUp: `1. Go to Studio > Setup Wizards > "Family Meeting Setup" (or visit the Meetings page when you have no schedules yet)
2. Choose whether you want a Family Council (pick a day, like Sunday)
3. Select which kids you want 1:1 time with — the wizard suggests their birthday date each month
4. Pick timing: birthday date, a specific day, or an ordinal weekday (3rd Friday, etc.)
5. Choose who has the time: just you, alternate with your partner, or both together
6. Pick a label: Date, Check-in, 1:1 Time, Mentor Meeting, or your own custom name
7. Review everything and confirm — all schedules and calendar events are created at once
You can change any schedule later from the Meetings page in about 10 seconds.`,
      },
    ],
  },

  // ── Allowance & Multi-Pool (PRD-28 Phase 3.5) ──────────────
  {
    triggers: ['allowance', 'set up allowance', 'allowance pools', 'multiple pools', 'chores pool', 'school pool', 'earning pool', 'weekly pay', 'kid earnings', 'pay my kids'],
    clarifyingQuestion: "I can help you set up allowance! Tell me a bit about what you're going for — is this a straightforward weekly amount based on how well they do their chores? Or are you thinking about tracking multiple areas separately (like chores AND school effort) with different weights toward the total? Some families like one simple pool, others like the flexibility of tracking things independently.",
    variants: [
      {
        name: 'Simple Single Pool',
        description: 'One weekly amount based on overall task completion percentage.',
        howToSetUp: `Go to Settings > Allowance & Finances > [child].
Enable allowance, set the weekly amount (e.g., $14).
Set the bonus threshold — the percentage they need to hit for a bonus (e.g., 85%).
Flag tasks with "counts for allowance" in the task editor.
The system calculates their percentage each week and determines the payout automatically.
View unpaid periods and mark them paid on the Prize Board > Allowance tab.`,
      },
      {
        name: 'Multiple Pools (Chores + School + Extras)',
        description: 'Separate tracking areas with different weights toward the total payout.',
        howToSetUp: `Go to Settings > Allowance & Finances > [child].
Set up the default pool first (this becomes "Chores" or whatever you call it).
Tap "+ Add another pool" at the bottom to create more pools (e.g., "School", "Reading").
For each pool, set:
- Payout mode: weekly (earns money) or measurement-only (tracks percentage without paying)
- Weight: how much this pool counts toward the combined payout (e.g., Chores=0.7, School=0.3)
- Its own bonus threshold and calculation approach

Measurement-only pools are great for tracking school effort without tying it to money.
The widget shows each pool's percentage plus the combined weighted result.
Pause pools seasonally — pause "School" in summer, activate "Summer Reading."`,
      },
    ],
  },
  {
    triggers: ['let my kid propose a reward', 'kid ask for a reward', 'negotiate rewards with kids', 'propose a deal', 'reward myself', 'promise myself a reward', 'self reward', 'counter offer a reward', 'my rewards page'],
    clarifyingQuestion: "Are you thinking about turning this on for one of your kids (so THEY can pitch you deals), or is this for yourself — an adult self-reward?",
    variants: [
      {
        name: "Kid proposes a deal (Guided+)",
        description: "A kid or teen pitches you a reward and what they'll do to earn it — you approve, counter, or decline.",
        howToSetUp: `Go to Family Members > [child] > Gamification Settings > "My Rewards Page."
Turn on "Propose a deal" (this section defaults off).
The kid now sees a "Propose a Deal" form on their My Rewards page: what they want, and how they'll earn it (once / a streak of days / finish a checklist).
Their pitch lands as a card in your Queue > Requests tab.
Approve opens a prefilled task, streak tracker, or routine checklist for you to review and save — nothing is created silently.
Counter lets you revise the terms ONE time (e.g., 5 days → 7 days) with an optional note; the kid then accepts or declines your counteroffer.
Decline lets you add a note explaining why, so the kid sees the outcome.`,
      },
      {
        name: 'Adult self-propose (including you)',
        description: 'An adult promises themselves a reward for something they commit to doing.',
        howToSetUp: `Any adult (you included) opens their own My Rewards page and finds "Promise Yourself a Reward."
Describe what you want and what you'll do to earn it.
Visibility defaults to PRIVATE — you can optionally share it with specific family members via the member picker.
Tapping through opens the normal task/tracker creation flow, prefilled, for you to confirm.
Completing the task later awards the reward automatically through the same pipeline as any other reward.`,
      },
    ],
  },
  {
    triggers: ['keep my kid safe with ai', 'is lila watching my kids conversations', 'worried about what my teen tells the ai', 'monitor lila conversations', 'safety net for kids', 'set up safety monitoring', 'turn on safety alerts'],
    clarifyingQuestion: "Safety Monitoring is built for exactly this. Do you want to check who's currently monitored and adjust sensitivity, or set it up for the first time?",
    variants: [
      {
        name: 'First-time setup',
        description: 'Children are already monitored by default the moment they join the family — this just confirms it and adds anyone else.',
        howToSetUp: `Go to Settings > Safety Monitoring.
Children show up already toggled ON (opt-out, not opt-in). If you want an adult (like a co-parent) monitored too, toggle them on.
Decide if dad should also receive alerts — toggle him on under "Who gets alerted" if so. You (mom) are always on and can't be turned off.
Tap the gear icon next to any active person to fine-tune sensitivity per category if the defaults feel off (Play/Guided default to High everywhere; teens and adults default to Medium, Low for profanity).
That's it — nothing else to configure. A flag will show up as a quiet notification if something concerning comes up.`,
      },
      {
        name: 'Review past flags',
        description: 'Check flag history to see patterns over time.',
        howToSetUp: `From Settings > Safety Monitoring, tap "View Flag History" (or tap any safety notification directly).
Filter by member, category, or include dismissed flags.
Tap any flag to see its category, severity, when it happened, and a warm suggestion for how to bring it up with your child — never the actual conversation.
Acknowledge once you've addressed it, or Dismiss if it was a false positive. Both are one-way — flags are never deleted.`,
      },
    ],
  },
  {
    triggers: ['stop asking what for dinner', 'meal plan for the week', 'save my recipes somewhere', 'someone has allergies plan around it', 'get dinner on the table', 'organize our recipes', 'weekly dinner plan', 'family cooking notes'],
    clarifyingQuestion: "KitchenCompass is built for this. Do you want to start by capturing a few recipes you already use, or jump straight to planning out this week's meals?",
    variants: [
      {
        name: 'Capture the recipes you already make',
        description: 'Get your go-to meals into Recipe Box so they\'re ready to plan with.',
        howToSetUp: `Open KitchenCompass (Plan & Do in the sidebar) > Recipe Box > + Add Recipe.
For a recipe from a website, paste the Link. For a printed card or cookbook page, use Photo. For something you know by heart, use This Went Well and describe it (typing or speaking) — I'll structure it into ingredients and steps.
Review what I pulled out before it saves — fix anything, then Approve. Nothing is saved until you do.
If your family has any food allergies or restrictions, set those up once in Food Profiles (the shield icon) — I'll always factor them in, and that setting can't accidentally get turned off.`,
      },
      {
        name: 'Plan this week',
        description: 'Get meals onto the calendar and dinner-time notes into Cook View.',
        howToSetUp: `Open KitchenCompass > This Week and tap any day's slot to add a meal from your Recipe Box (or type a freeform title if it's not saved yet).
Drag a meal to a different day if plans change.
When you're ready to cook, tap the meal card, then "Cook This" for a big-type, step-by-step view — it'll show any "how WE do it" Family Pointers you've saved for that recipe.
When the week's set, tap "Send to shopping list" to push all the ingredients — merged and scaled — into your shopping list in one step.`,
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
