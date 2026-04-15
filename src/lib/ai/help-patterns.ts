/**
 * Help & Assist Pattern Matching — PRD-05
 *
 * Keyword-based pattern matching for the 'help' and 'assist' LiLa modes.
 * Checked BEFORE calling the AI edge function. If a pattern matches,
 * the canned response is inserted directly as an assistant message — no AI call.
 *
 * Per PRD-32: LiLa Help checks known issues (keyword matching) BEFORE calling AI.
 *
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ POST-BUILD REQUIREMENT (applies to EVERY build session):       │
 * │                                                                │
 * │ After completing any build that adds or changes a feature,     │
 * │ update THIS file and feature-guide-knowledge.ts with:          │
 * │                                                                │
 * │ 1. New patterns here for "how do I use [feature]?" queries     │
 * │    — include step-by-step instructions with exact page names   │
 * │    and button labels so the answer costs $0 in AI calls.       │
 * │                                                                │
 * │ 2. Use case recipes in feature-guide-knowledge.ts for goal-    │
 * │    based questions ("I want my kids to...") — include warm     │
 * │    clarifying questions and implementation walkthrough.         │
 * │                                                                │
 * │ LiLa should be able to walk a mom through using or setting up  │
 * │ any feature that exists in the app. If it was built, LiLa      │
 * │ should know how to explain it.                                 │
 * └─────────────────────────────────────────────────────────────────┘
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

  // ── Setup & Configuration Walkthroughs ────────────────────────

  {
    category: 'guided_dashboard_setup',
    keywords: ['guided dashboard', 'set up guided', 'guided mode', 'set up child dashboard', "kid's dashboard", "child's dashboard", '8 year old', '10 year old', '12 year old', 'guided shell'],
    response: "To set up a Guided Dashboard for a child (ages 8-12):\n\n1. **Settings > Family Management** > find the child > Edit\n2. Set **Dashboard Style** to \"Guided Mode\"\n3. Save — this auto-creates their dashboard config and morning rhythm\n4. Tap **\"Manage Dashboard\"** to configure:\n   - Reorder or hide sections (Greeting, Next Best Thing, and Best Intentions can't be hidden)\n   - Toggle **Reading Support** for larger text + read-aloud icons\n   - Add **Best Intentions** for your child\n5. Create **tasks and routines** for them from the Tasks page (assign to them)\n6. Optionally set up **Day Segments** (Morning, School, Evening) in Settings > Gamification > [child]\n7. Use **View As** to preview their experience\n\nWant me to walk you through any of these steps?",
  },
  {
    category: 'play_dashboard_setup',
    keywords: ['play dashboard', 'set up play', 'play mode', 'youngest', 'little kid', '3 year old', '4 year old', '5 year old', '6 year old', '7 year old', 'play shell', 'sticker book'],
    response: "To set up a Play Dashboard for your youngest (ages 3-7):\n\n1. **Settings > Family Management** > find the child > Edit\n2. Set **Dashboard Style** to \"Play Mode\"\n3. Save — this auto-creates their dashboard config\n4. Create **tasks** for them from the Tasks page — assign to them and pick **paper-craft icons** using the icon picker so they see pictures instead of text\n5. Set up **Day Segments** in Settings > Gamification > [child] — organize into Morning, School, Evening\n6. Enable the **Sticker Book** in gamification settings — they'll earn creatures when completing tasks!\n7. Assign tasks to segments so their day is organized with big visual tiles\n8. Use **View As** to see exactly what they see\n\nWant help with any of these steps?",
  },
  {
    category: 'create_routine',
    keywords: ['create routine', 'make routine', 'set up routine', 'morning routine', 'evening routine', 'bedtime routine', 'chore routine', 'daily checklist', 'how do i make a routine', 'routine checklist'],
    response: "To create a routine:\n\n1. Go to **Tasks** > tap **+ Create**\n2. Choose **Routine** as the Task Type\n3. Name it (e.g., \"Morning Routine\")\n4. Tap **+ Add Section** to create sections like \"Every Day\" or \"Weekdays Only\"\n5. For each section, set the **frequency** (Daily, MWF, T/Th, Weekly, Custom)\n6. Add **steps** within each section (e.g., \"Brush teeth\", \"Make bed\", \"Pack lunch\")\n7. In the **Assignment** section, pick which family members get this routine\n8. Save!\n\nThe routine will show up on their dashboard with a progress ring. They can expand it and check off each step. Steps reset fresh each day — no guilt carry-forward.\n\nWant to try creating one now?",
  },
  {
    category: 'task_segments',
    keywords: ['segment', 'day segment', 'morning segment', 'evening segment', 'organize day', 'group tasks', 'task group', 'set up segments'],
    response: "Day Segments organize a child's tasks into sections like Morning, School, Jobs, and Evening:\n\n1. Go to **Settings > Gamification** > select the child\n2. Open the **Day Segments** section\n3. Tap **+ Add Segment** — pick from suggestions (Morning, School, Evening, etc.) or type your own\n4. Optional: set a **day filter** so the segment only shows on certain days (e.g., School = Mon-Fri)\n5. Tap **Manage Tasks** on each segment to assign tasks to it\n6. Drag segments to reorder them\n\nSegments show as collapsible sections on the child's dashboard with progress bars. Play kids get big banner headers; Guided kids get compact headers.",
  },
  {
    category: 'gamification_setup',
    keywords: ['gamification', 'sticker book', 'creatures', 'points', 'rewards', 'earning', 'set up gamification', 'game', 'creature earning'],
    response: "To set up gamification for a child:\n\n1. Go to **Settings > Gamification** > select the child\n2. Toggle **Gamification enabled** and **Sticker Book enabled**\n3. Set **Points per task** (default: 10)\n4. Choose a **Creature Earning Mode** — how they earn collectible creatures:\n   - Random per task (default): d100 roll on each completion\n   - Every N completions: earn after 3, 5, etc. tasks done\n   - Segment complete: earn when all tasks in a segment are done\n   - Complete the day: earn when ALL today's tasks are done\n5. Set up **Day Segments** to organize their tasks (see the Day Segments section)\n6. Optionally add **Coloring Reveals** — link a coloring page to a specific task, each completion reveals a zone\n\nCreatures are never taken away — celebration only, never punishment!",
  },
  {
    category: 'view_as',
    keywords: ['view as', 'see what they see', 'preview dashboard', 'child view', 'what does it look like', 'test their view', "see my child's"],
    response: "View As lets you see exactly what any family member sees:\n\n1. From your dashboard, look for the **View As** option (in the perspective switcher or top-right menu)\n2. Select the family member you want to view as\n3. You'll see their complete experience — their dashboard, theme, tasks, everything\n4. Navigate their pages to verify everything looks right\n5. Click **Exit** to return to your own view\n\nPrivacy rules apply: Safe Harbor conversations are always excluded. You can interact with their dashboard (complete tasks, log intentions) and those actions are attributed to you via the \"acted by\" system.",
  },
  {
    category: 'assign_tasks',
    keywords: ['assign', 'assign to kid', 'give task', 'assign chore', 'assign to child', 'who does this', 'multiple kids'],
    response: "To assign a task to family members:\n\n1. Create or edit a task from the **Tasks** page\n2. In the **Assignment** section, you'll see colored pill buttons for each family member\n3. Tap one or more names to assign\n4. When you select **2+ people**, the **Any/Each** toggle appears:\n   - **Each of them**: everyone gets their own independent copy\n   - **Any of them**: shared task, whoever does it first gets credit\n5. Save the task\n\nYou can also assign from the Tasks page by hovering a task and clicking the deploy button to reassign it to a different member.",
  },
  {
    category: 'sequential_collection',
    keywords: ['sequential', 'curriculum', 'textbook', 'chapter by chapter', 'one at a time', 'reading list', 'sequential collection', 'ordered list'],
    response: "Sequential Collections feed items one at a time — perfect for textbook chapters, curricula, or reading lists:\n\n1. Go to **Studio** > find \"Sequential Collection\" > tap **Customize**\n   (Or: Tasks > Sequential tab > + Create, or Lists > + New List > Sequential Collection)\n2. Name it and add items (type them, paste a list, or use **Paste Curriculum** for AI-assisted import)\n3. Set **advancement defaults**: how many practices before moving to the next item, whether mastery approval is needed\n4. Set **active count** (how many items are visible at once — usually 1)\n5. Assign to a family member\n\nItems unlock one at a time. Progress tracks across the whole collection. You can redeploy the same collection to another child for a fresh start.",
  },
  {
    category: 'best_intentions',
    keywords: ['best intention', 'intention', 'goal', 'guiding star', 'values', 'set intention', 'family intention'],
    response: "Best Intentions are things you're actively working on — personal commitments you want to celebrate:\n\n1. Go to **Guiding Stars** from the sidebar\n2. Scroll to the **Best Intentions** section\n3. Tap **+ Add Intention** and write what you're working on (e.g., \"Respond with patience instead of reacting\")\n4. Each day, tap the ❤️ to log an iteration when you lived that intention\n5. Track your streak and celebration count\n\nFor **Guided children**: go to Family Management > [child] > Manage Dashboard > Best Intentions section. You can add intentions for them, and optionally let them add their own.\n\nFor **family-wide intentions**: go to Family Hub > Family Best Intentions to set intentions the whole family works on together.",
  },
  {
    category: 'lists_overview',
    keywords: ['list', 'shopping list', 'packing list', 'wishlist', 'expense', 'create list', 'new list', 'types of lists'],
    response: "MyAIM has several list types — go to **Lists** from the sidebar and tap **+ New List**:\n\n- **Shopping**: quantities, units, store sections, shareable\n- **Wishlist**: URLs, prices, sizes — great for gift-givers\n- **Packing**: categorized sections with progress bar\n- **Expenses**: amounts + running total\n- **To-Do**: simple checklist with \"promote to task\" button\n- **Prayer**: simple items for prayer lists\n- **Randomizer**: spin for a surprise draw — great for activity boards\n- **Sequential Collection**: ordered items that feed one at a time\n- **Custom**: flexible — anything you want\n\nAny list can also be flagged as an **opportunity list** so kids can browse and claim items.",
  },
  {
    category: 'bookshelf',
    keywords: ['book', 'bookshelf', 'upload book', 'reading', 'extract', 'pdf', 'epub', 'book club', 'book discussion'],
    response: "BookShelf lets you upload books and extract wisdom:\n\n1. Go to **BookShelf** from the sidebar (under AI & Tools)\n2. Tap **Upload** and add a PDF, EPUB, or text file\n3. The system processes it automatically — extracting summaries, insights, declarations, action steps, and discussion questions\n4. Browse extractions by chapter or by type\n5. **Heart** items to include them in LiLa's context (she'll reference your books in conversations)\n6. Send items to Guiding Stars, Tasks, or Journal Prompts\n7. Start a **Book Discussion** with LiLa about any book in your library\n\nBooks are processed at the platform level — if another family uploads the same book, they benefit from the existing extractions instantly.",
  },
  {
    category: 'mindsweep',
    keywords: ['mindsweep', 'mind sweep', 'brain dump', 'sweep', 'capture', 'clear my head', 'dump everything'],
    response: "MindSweep is your brain dump tool — get everything out of your head and let AI sort it:\n\n1. Tap **MindSweep** in the QuickTasks bar, or go to **/sweep**\n2. Choose your input: **Type** it, **speak** it, **scan** a photo, or **paste a link**\n3. Tap **Sweep Now** — AI classifies each item (task, calendar event, journal entry, list item, etc.)\n4. Review the suggestions — change any destination by tapping the tag\n5. Accept to route everything to the right places\n\nYou can also access MindSweep-Lite during your **Evening Rhythm** — a quick brain dump before bed that commits on Close My Day.",
  },
  {
    category: 'studio',
    keywords: ['studio', 'template', 'browse templates', 'blank template', 'customize template'],
    response: "Studio is your template workshop — browse ready-made formats and customize them for your family:\n\n1. Go to **Studio** from the sidebar\n2. Browse templates by category: Tasks, Routines, Opportunities, Sequential Collections, Guided Forms, Lists, Randomizers, Widgets\n3. Tap **Customize** on any template to make it your own\n4. Your customized templates appear in the **My Customized** tab\n5. **Deploy** templates to family members — each gets their own independent copy\n\nStudio also has example templates (marked with \"Example\" badge) showing real-world setups like Morning Routines, Extra Jobs boards, and curriculum sequences.",
  },
  {
    category: 'family_hub',
    keywords: ['family hub', 'hub', 'tv mode', 'family board', 'countdown', 'family intention'],
    response: "The Family Hub is your shared family surface — visible to everyone:\n\n1. Go to **Family Hub** from the sidebar\n2. It shows: Family Best Intentions, Countdowns, Calendar, and more\n3. Set it up in **Settings > Family Hub Settings**:\n   - Add **Family Best Intentions** the whole family works on together\n   - Add **Countdowns** for upcoming events (vacations, birthdays)\n   - Reorder sections\n   - Set a **Hub PIN** for kiosk/tablet mode\n4. **TV Mode** is a landscape-optimized version for a family display\n\nFamily members can access via **Quick Access** — PIN auth with privacy exclusions automatically applied.",
  },
  {
    category: 'coloring_reveal',
    keywords: ['coloring', 'coloring reveal', 'reveal', 'coloring page', 'color in', 'reveal image'],
    response: "Coloring Reveals are visual tally counters linked to a specific task:\n\n1. Go to **Settings > Gamification > [child]**\n2. Open the **Coloring Reveals** section\n3. Tap **+ Add Reveal** and pick an image from the library (20 animals + 12 scenes)\n4. Choose the **linked task** — each completion of that task reveals one zone of the image\n5. Pick the **step count** (5, 10, 15, 20, 30, or 50 completions to finish)\n6. When complete, a \"Print it!\" button appears for the finished coloring page\n\nThe reveal shows as a widget on the child's dashboard — grayscale zones progressively fill with color as they complete the linked task.",
  },
  {
    category: 'rhythms',
    keywords: ['rhythm', 'morning rhythm', 'evening rhythm', 'close my day', 'morning routine rhythm', 'evening review', 'daily rhythm'],
    response: "Rhythms are your daily check-in flows — Morning and Evening:\n\n**Morning Rhythm** opens automatically when you first visit your dashboard each morning. It shows:\n- Guiding Star rotation, Best Intentions focus, calendar preview, upcoming tasks, and more\n- Tap \"Start My Day\" when ready, or snooze for later\n\n**Evening Rhythm** opens in the evening. It walks you through:\n- Celebrating what went right today\n- Tomorrow Capture (plan for tomorrow with fuzzy task matching)\n- MindSweep-Lite (quick brain dump before bed)\n- Reflections\n- Close My Day\n\nConfigure rhythms in **Settings > Rhythms** — toggle sections on/off, adjust timing.\n\nGuided kids get a simplified evening check-in with reflections. Play kids get DailyCelebration instead.",
  },
  {
    category: 'reward_reveals',
    keywords: ['reward reveal', 'reward', 'prize', 'prize box', 'celebration', 'reveal animation', 'treasure', 'surprise reward', 'ice cream reward', 'potty chart reward'],
    response: "Reward Reveals are celebration moments you can attach to anything completable — tasks, trackers, lists, intentions, and more.\n\n**How to set one up:**\n1. When creating or editing a task, scroll to the **Reward Reveal** section\n2. Pick a **reveal animation** (treasure chests, gift boxes, envelopes — 30+ styles)\n3. Set the **prize content**: text message, your own photo, a platform image, or celebration-only\n4. Choose **when it fires**: every completion, every N completions, or on goal\n\n**Prize Box:** Earned prizes show up in the child's Prize Box until you mark them as redeemed.\n\n**Reusable combos:** Create named reveals at **Settings > Reward Reveals** and attach them to multiple things.\n\n**Rotating animations:** Pick multiple animations and they'll alternate each time. Prize pools can vary too — different surprise each time!\n\n**Example:** Potty chart with stars → every 5 stars, an ice cream reveal plays with a photo of the actual ice cream.",
  },
  {
    category: 'timer',
    keywords: ['timer', 'pomodoro', 'stopwatch', 'countdown timer', 'focus timer', 'time tracking'],
    response: "The Universal Timer supports multiple modes:\n\n- **Clock**: simple elapsed time tracker\n- **Pomodoro**: focus intervals with break reminders\n- **Stopwatch**: count up freely\n- **Countdown**: set a target time\n\nStart a timer from any task (tap the timer icon), or start a standalone timer from the floating bubble. Multiple concurrent timers are supported. Timer persists across page navigation and even device switches (it's timestamp-based, not client-side).\n\nConfigure defaults in **Settings > Timer** — idle reminders, auto-pause, visual style (5 options), Pomodoro intervals.",
  },

  // ── Setup Wizards & Use-Case Patterns ────────────────────────

  {
    category: 'potty_chart',
    keywords: ['potty chart', 'potty', 'potty training', 'potty sticker', 'toilet training', 'star chart potty'],
    response: "To set up a potty chart:\n\n1. Go to **Studio** > scroll to **Gamification & Rewards**\n2. Tap **Star / Sticker Chart** > **Customize**\n3. The wizard walks you through 5 steps:\n   - **Name it**: \"Potty Stars\" or whatever your child knows\n   - **Who**: pick the child\n   - **Pick a Look**: star chart, sticker grid, coin jar, or garden\n   - **Set Goal**: how many stars to earn a reward (try 10 or 15)\n   - **Add Reward**: attach a celebration when they reach the goal — card flip, door reveal, or spinner!\n4. **Deploy to Dashboard** — the chart appears on their dashboard\n\nEach time your child uses the potty, tap their chart to add a star. When they hit the goal, the reward reveal plays!",
  },
  {
    category: 'star_chart',
    keywords: ['star chart', 'sticker chart', 'sticker board', 'stars', 'earn stars', 'gold stars', 'reward chart'],
    response: "To create a star/sticker chart:\n\n1. Go to **Studio** > **Gamification & Rewards** > **Star / Sticker Chart** > **Customize**\n2. The wizard guides you through:\n   - **Name**: what you're tracking (\"Reading Stars\", \"Good Manners Chart\")\n   - **Assign**: which child (or multiple kids — each gets their own)\n   - **Visual**: pick star chart, animated stars, sticker grid, coin jar, garden, thermometer, or more\n   - **Target**: how many to earn a reward (5, 10, 15, 20, 30, or 50)\n   - **Reward**: optional celebration animation when they reach the goal\n3. Deploy — it's on their dashboard immediately\n\nYou'll find this same widget setup if you browse **Trackers & Widgets** directly. The wizard just walks you through it step by step.",
  },
  {
    category: 'get_to_know',
    keywords: ['get to know', 'connection', 'love language', 'gift ideas', 'comfort needs', 'what helps', 'what they like', 'learn about my kid', 'understand my child'],
    response: "The **Get to Know Your Family** wizard walks you through 6 connection categories for any family member:\n\n1. Go to **Studio** > **Growth & Self-Knowledge** > **Get to Know Your Family** > **Customize**\n2. Pick the person you want to learn about\n3. Walk through each category — answer the prompt or skip:\n   - **Things I'd Love** (gift ideas)\n   - **Words That Mean Something** (meaningful words)\n   - **What Really Helps** (helpful actions)\n   - **Ways to Spend Time Together** (quality time)\n   - **Good to Know** (sensitivities)\n   - **What Makes a Bad Day Better** (comfort needs)\n4. Add as many entries as you want per category\n5. Save — everything goes into **InnerWorkings** and LiLa uses it to personalize suggestions\n\nYou can also add entries anytime from the InnerWorkings page directly.",
  },
  {
    category: 'routine_builder_ai',
    keywords: ['routine builder', 'brain dump routine', 'ai routine', 'describe routine', 'organize routine', 'parse routine'],
    response: "The **Routine Builder (AI)** wizard turns your description into a structured routine:\n\n1. Go to **Studio** > **Setup Wizards** > **Routine Builder (AI)** > **Customize**\n2. Name the routine and **describe it in your own words** — just the way you'd tell your kids\n   - \"Every morning make bed, brush teeth, get dressed. On school days also pack lunch.\"\n3. Tap **Next** — AI organizes it into sections with the right schedule for each part\n4. **Review**: remove or edit anything that doesn't look right\n5. Tap **Use This Routine** — it opens the full **Routine Creator** where you can:\n   - Fine-tune sections and frequencies\n   - Assign to kids\n   - Add linked content (sequential lists, randomizers)\n   - Deploy\n\nThis is the same AI brain dump tool you'll find inside the routine editor. The wizard just gives you a friendlier entry point.",
  },
  {
    category: 'reward_spinner',
    keywords: ['spinner', 'spin wheel', 'reward wheel', 'activity wheel', 'surprise wheel', 'spin for reward', 'random reward'],
    response: "To create a reward/activity spinner:\n\n1. Go to **Studio** > **Gamification & Rewards** > **Reward Spinner** > **Customize**\n2. This opens the tracker widget configurator with the spinner preset\n3. Name it, set the segments (prizes/activities), assign to a child, and deploy\n\nAlternatively, create a **Randomizer list** first (Lists > + New List > Randomizer), add your rewards, then create a Randomizer Spinner widget that draws from it.\n\nSpinner results can be one-time (removed after drawn) or repeatable (goes back in the pool).",
  },
  {
    category: 'chore_system',
    keywords: ['chore system', 'chore chart', 'chore rotation', 'rotating chores', 'chore with allowance', 'allowance', 'chore with reward', 'set up chores'],
    response: "To set up a full chore system with rewards:\n\n1. **Create tasks/routines**: Go to **Tasks** > **+ Create**. Use a **Routine** for daily checklists or individual **Tasks** for one-off chores\n2. **Assign to kids**: Pick family members in the Assignment section. For rotating chores, toggle **Rotation** to cycle between kids weekly/biweekly/monthly\n3. **Set up rewards** (optional):\n   - **Gamification points**: Settings > Gamification > [child] — tasks earn points automatically\n   - **Allowance**: Settings > Allowance > [child] — tasks flagged with \"counts for allowance\" affect their weekly calculation\n   - **Reward Reveals**: On any task, scroll to Reward Reveal section to attach a celebration animation\n4. **Organize the day**: Set up **Day Segments** (Morning, School, Jobs, Evening) in Settings > Gamification\n5. **Optional extras**:\n   - **Opportunity Board** for bonus jobs kids can claim\n   - **Coloring Reveals** — link a coloring page to a specific chore\n   - **Star Chart** to visualize progress\n\nAll of these pieces are in **Studio** if you want guided setup wizards.",
  },

  // ── Meetings (PRD-16) ──────────────────────────────────────
  {
    category: 'meetings',
    keywords: ['meeting', 'couple meeting', 'family meeting', 'family council', 'parent child meeting', 'mentor meeting', 'schedule meeting', 'start meeting'],
    response: "Go to **Meetings** in the sidebar (under Plan & Do).\n\n**Getting started:**\n1. Pick a meeting type: Couple, Parent-Child, Mentor, or Family Council\n2. Set a schedule: Tap the calendar icon next to the type to set recurrence\n3. Customize the agenda: Tap the gear icon to edit, reorder, or add your own agenda sections\n4. Start a meeting: Hit **Live Mode** for real-time LiLa-facilitated conversation, or **Record After** to capture a meeting retrospectively\n\n**During the meeting**, LiLa guides you through each agenda section. Mark items as discussed in the sidebar.\n\n**After the meeting**, LiLa generates a summary and extracts action items. You route each action item to Tasks, Calendar, Best Intentions, or Backburner.\n\n**Between meetings**, add agenda items any time from the Meetings page or use Notepad > Send to > Agenda.",
  },
  {
    category: 'meetings',
    keywords: ['agenda item', 'add agenda', 'meeting agenda', 'things to discuss', 'between meetings'],
    response: "You can add agenda items for any meeting type at any time:\n\n1. **From the Meetings page**: Expand a meeting type and type in the \"+ Add agenda item\" field\n2. **From Smart Notepad**: Write your thought, then tap **Send to** > **Agenda** — pick which meeting type it belongs to\n3. **From Review & Route**: When reviewing notepad content, route items to Agenda\n\nAgenda items queue up between meetings and surface in the agenda sidebar during your next meeting. Items are marked as discussed when you tap them during the meeting.",
  },
  {
    category: 'meetings',
    keywords: ['meeting history', 'past meetings', 'old meetings', 'meeting summary', 'meeting notes'],
    response: "To see your meeting history, go to **Meetings** and scroll to **Recent History**. Tap **View All History** to see all completed meetings with type filtering.\n\nEach meeting saves:\n- A summary (generated by LiLa, editable by you)\n- Action items that were routed to Tasks, Calendar, etc.\n- Your personal impressions (private — only you see these)\n\nMeeting summaries are also auto-saved to your **Journal** as meeting notes.",
  },
]

/**
 * Match a user query against the help pattern library.
 * Returns the canned response string if a match is found, or null if no match.
 * Uses keyword count — the pattern with the most keyword matches wins if multiple match.
 * Requires at least 2 keyword matches to avoid false positives on single common words
 * like "task", "list", "calendar", etc.
 */
export function matchHelpPattern(query: string): string | null {
  const lower = query.toLowerCase()

  // Short messages (under 4 words) are more likely to be exact-intent queries,
  // so allow 1-keyword match. Longer messages need 2+ to avoid false positives.
  const wordCount = query.trim().split(/\s+/).length
  const minMatches = wordCount <= 4 ? 1 : 2

  let bestMatch: HelpPattern | null = null
  let bestCount = 0

  for (const pattern of HELP_PATTERNS) {
    const matchCount = pattern.keywords.filter(kw => lower.includes(kw.toLowerCase())).length
    if (matchCount >= minMatches && matchCount > bestCount) {
      bestCount = matchCount
      bestMatch = pattern
    }
  }

  return bestMatch ? bestMatch.response : null
}
