# Universal Setup Wizards — Feature Decision File

> **Status:** DRAFTING — Founder review pending
> **Scope:** Every user-facing creation flow in the app gets a guided wizard on-ramp
> **Predecessor:** Studio-Setup-Wizards.md (Phases 1-3 complete, Phase 5 Meeting wizard approved)
> **Infrastructure:** `SetupWizard.tsx` shell + 5 working wizards already prove the pattern

---

## Problem Statement

The platform has 20+ tracker types, 10+ list types, opportunity boards, sequential collections, randomizers, personality tools, Guiding Stars, Best Intentions, Archives, and more — but clicking "Customize" on any Studio card opens a generic form with fields like "Target Goal" and "Unit." A mom who is excited about solving her family's problems doesn't know how to set things up to do so.

Every feature needs an on-ramp that feels like a conversation, not a form. The wizard walks mom through setup step by step, explains why connections matter, offers relevant add-ons, and delivers a fully configured, dashboard-ready result.

### Design Principles

1. **Conversational, not technical.** "What are you counting?" not "Enter measurement_unit."
2. **Progress saved automatically.** Wizard state persists to localStorage keyed by wizard ID + family ID. Clicking off and coming back resumes where you left off. Explicit "Start Over" button to reset.
3. **Different titles, same base wizard.** "Reading Log" and "Water Intake" and "Chore Points" are all tally wizards — but having separate cards with different names helps mom understand what the end result could look like. Later she'll create her own.
4. **Tags on everything.** Every wizard output gets tagged for browsable categories in Studio. Tags come from the wizard's preset + any mom adds.
5. **Explain the connections.** "Want this to count toward allowance?" "Should completing this record a victory?" "Want a reward reveal when they hit the goal?"
6. **Deploy ready.** The wizard's final step shows exactly what will be created, on whose dashboard, with what connections. One tap to deploy.
7. **Edit after.** Once created via wizard, everything uses the normal edit flows. The wizard is just the on-ramp.

---

## Shared Infrastructure

### Already Built
- `SetupWizard.tsx` — reusable multi-step shell (step indicator, back/next, ModalV2 wrapper)
- `StarChartWizard.tsx` — 5-step star/sticker chart wizard (Name → Assign → Visual → Target → Reward)
- `GetToKnowWizard.tsx` — 8-step connection wizard (Pick Member → 6 categories → Summary)
- `RoutineBuilderWizard.tsx` — AI brain dump → parse → TaskCreationModal handoff
- `MeetingSetupWizard.tsx` — bulk meeting scheduling (Family Council → 1:1s → Couple)
- `AttachRevealSection` — reward reveal picker (animation + prize + message), embeddable in any wizard
- `MemberPillSelector` — compact member picker used across all wizards
- `BulkAddWithAI` — AI-powered paste-and-parse for list items
- `useCreateWidget` / `useCreateList` / `useCreateSequentialCollection` — deploy hooks

### Needs Building (Shared Components)
- **`WizardProgressSaver`** — localStorage persistence wrapper. Saves wizard state on every step change, restores on mount. Keyed by `wizard-{wizardId}-{familyId}`. Clears on successful deploy or explicit reset. Wrap around any wizard's state management.
- **`WizardTagPicker`** — reusable tag selector shown on the final review step. Pre-filled from the wizard's category, mom can add custom tags. Tags write to the output record's `tags` field.
- **`ConnectionOffersPanel`** — reusable "Want to connect this to..." section. Shows contextual connection options based on what's being created:
  - Tracker → "Count toward allowance?" / "Record victories?" / "Show in rhythms?" / "Add a reward reveal?"
  - List → "Connect to a tracker?" / "Deploy a spinner widget?" / "Share with family members?"
  - Task → "Count toward allowance?" / "Count toward homework?" / "Earn gamification points?"
- **`DashboardDeployPicker`** — "Which dashboards should this appear on?" Member pill buttons, defaults to the assigned member(s). Mom can add her own dashboard too.
- **`RecurringItemBrowser`** — for the universal streak wizard. Queries all recurring items in the family (routines, recurring tasks, habits, daily checklist items, etc.) and presents them as tappable cards. Used by streak wizard step "What do you want to streak?"

---

## Phase 1: Tracker & Widget Wizards

### Wizard Family Architecture

Each tracker type family shares ONE wizard component with configurable defaults. The Studio card's `config_name` determines which preset loads. The wizard component receives a `preset` prop that controls:
- Default title template
- Default unit/measurement
- Suggested target
- Which steps to show/skip
- Which connection offers are relevant
- Warm framing text per step

### 1A. Tally Wizard (`TallyWizard.tsx`)

**Covers 10 Studio cards:** Reading Log (Books), Reading Log, Water Intake, Custom Goal Card, Chore Points Board, Savings Goal, Chore Earnings Tracker, Extra Jobs Completion, IEP / ISP Goal Progress, Weekly Celebration

**Steps:**

| # | Step | What Happens |
|---|---|---|
| 1 | **What are you counting?** | Pre-filled title from preset (e.g., "Reading Log" → "[Name]'s Reading Goal"). Editable. Unit pre-filled (books / glasses / points / dollars / victories). "What does one count mean?" helper text per preset. |
| 2 | **Who is this for?** | MemberPillSelector. Single or multiple members. If multiple → "Create one for each person, or one shared tracker?" (maps to multiplayer mode). |
| 3 | **Set a goal** | Target number input with preset suggestion (20 books / 8 glasses / 100 points). "No goal — just count" toggle that sets target to null. Visual preview: "When [Name] reaches [target] [unit], they'll see a celebration!" |
| 4 | **Pick a look** | Visual variant grid. Per-preset defaults: Reading → star_chart, Water → thermometer, Chore Points → progress_bar, Savings → thermometer, Earnings → coin_jar, IEP → progress_bar_multi, Celebration → star_chart. Each variant shows a tiny preview thumbnail. |
| 5 | **Add extras** | ConnectionOffersPanel with relevant options per preset: |
| | | - Reading: "Make it a family race?" (multiplayer), "Count toward homework hours?" |
| | | - Water: "Show in morning rhythm?" |
| | | - Chore Points: "Connect to Opportunity Board?", "Count toward allowance?" |
| | | - Savings: "Add a reward reveal when goal is reached?" (→ AttachRevealSection inline) |
| | | - IEP: "Include in monthly reports?" |
| | | - Weekly Celebration: "Show in evening rhythm?" |
| 6 | **Review & Deploy** | Summary card showing: title, assigned to, goal, visual, connections. WizardTagPicker with preset tags + custom. DashboardDeployPicker. [Deploy to Dashboard] button. |

**Presets (one per Studio card):**

```typescript
const TALLY_PRESETS = {
  reading_log_books: {
    title: "[Name]'s Reading Goal",
    unit: 'books',
    suggestedTarget: 20,
    defaultVisual: 'star_chart',
    framingText: "Track books finished — each one adds a star to the chart.",
    connectionOffers: ['multiplayer_race', 'homework_hours', 'reward_reveal', 'rhythm_morning'],
    tags: ['reading', 'learning', 'books'],
  },
  water_intake: {
    title: "[Name]'s Water Today",
    unit: 'glasses',
    suggestedTarget: 8,
    defaultVisual: 'thermometer',
    framingText: "One tap per glass. The thermometer fills toward the daily goal.",
    connectionOffers: ['rhythm_morning', 'rhythm_evening'],
    tags: ['health', 'daily', 'hydration'],
    resetPeriod: 'daily',
  },
  chore_points: {
    title: "[Name]'s Points",
    unit: 'points',
    suggestedTarget: 100,
    defaultVisual: 'progress_bar',
    framingText: "Points accumulate from completed chores. Set a goal and a prize.",
    connectionOffers: ['opportunity_board', 'allowance', 'reward_reveal'],
    tags: ['chores', 'responsibility', 'earning'],
  },
  savings_goal: {
    title: "Saving for [Goal]",
    unit: 'dollars',
    suggestedTarget: 100,
    defaultVisual: 'thermometer',
    framingText: "A thermometer filling toward a savings target. Each deposit makes it rise.",
    connectionOffers: ['reward_reveal'],
    tags: ['money', 'savings', 'goal'],
    extraStep: 'goal_description', // "What are you saving for?"
  },
  chore_earnings: {
    title: "[Name]'s Earnings",
    unit: 'dollars',
    suggestedTarget: null,
    defaultVisual: 'coin_jar',
    framingText: "Tracks dollar earnings from completed opportunity board jobs.",
    connectionOffers: ['opportunity_board', 'allowance'],
    tags: ['money', 'chores', 'earning'],
  },
  extra_jobs: {
    title: "[Name]'s Coin Jar",
    unit: 'jobs',
    suggestedTarget: 20,
    defaultVisual: 'coin_jar',
    framingText: "A coin jar that fills as extra jobs are completed.",
    connectionOffers: ['opportunity_board', 'reward_reveal'],
    tags: ['chores', 'extra', 'earning'],
  },
  iep_goal: {
    title: "[Goal Name]",
    unit: 'trials',
    suggestedTarget: null,
    defaultVisual: 'progress_bar_multi',
    framingText: "Track measurable IEP or ISP goals alongside daily life — not buried in a folder.",
    connectionOffers: ['monthly_reports', 'notes'],
    tags: ['special_needs', 'therapy', 'iep', 'goals'],
    resetPeriod: 'never',
  },
  family_reading_race: {
    title: "Family Reading Race",
    unit: 'books',
    suggestedTarget: 20,
    defaultVisual: 'colored_bars_competitive',
    framingText: "Who finishes 20 books first? Everyone has their own colored bar.",
    connectionOffers: ['family_overview'],
    tags: ['reading', 'family', 'multiplayer', 'race'],
    forceMultiplayer: true,
  },
  weekly_celebration: {
    title: "[Name]'s Wins This Week",
    unit: 'victories',
    suggestedTarget: null,
    defaultVisual: 'star_chart',
    framingText: "A pure celebration board. Tap to add a win — big or small. No failure state.",
    connectionOffers: ['rhythm_evening'],
    tags: ['celebration', 'victories', 'weekly'],
    resetPeriod: 'weekly',
  },
  custom_goal: {
    title: "[Goal Name]",
    unit: 'times',
    suggestedTarget: 30,
    defaultVisual: 'progress_bar',
    framingText: "The most versatile tracker. Count anything: miles, pages, sessions, hours.",
    connectionOffers: ['allowance', 'reward_reveal', 'rhythm_morning', 'rhythm_evening'],
    tags: ['goals', 'flexible'],
  },
}
```

### 1B. Streak Wizard (`StreakWizard.tsx`)

**Covers 4 existing Studio cards PLUS a new "Streak Anything" entry point.**

Existing: Morning Routine Streak, Math Practice Streak, Exercise Streak, Therapy Practice Streak
New: **"Add a Streak Counter"** — universal entry point that lets mom browse anything recurring in the family and attach a streak to it.

**Steps:**

| # | Step | What Happens |
|---|---|---|
| 1 | **What are you streaking?** | Two paths: (A) Preset card selected from Studio → pre-filled, skip to step 2. (B) "Add a Streak Counter" universal entry → RecurringItemBrowser shows all family recurring items grouped by category (Routines, School Tasks, Habits, Daily Checklists, Therapy Practice, Custom). Tap one to select. |
| 2 | **Who is this for?** | MemberPillSelector. Pre-filled from the linked item's assignee if path B. |
| 3 | **How strict?** | Grace period: "Strict (no missed days)" / "1 day grace (life happens)" / "2 days grace (extra forgiving)". Warm framing: "A grace period means the streak doesn't break if you miss one day. It's about building the habit, not perfection." |
| 4 | **Pick a look** | Visual: flame_counter (default), chain_links, mountain_climb, growing_tree. Each with description. Therapy preset defaults to growing_tree ("gentle — no punishing graphic when a day is missed"). |
| 5 | **Milestones** | Pre-filled milestone celebrations (7, 14, 30, 100 days). Mom can edit. "What happens at [milestone]?" — optional reward reveal per milestone via AttachRevealSection. |
| 6 | **Review & Deploy** | Summary: what's being tracked, who, grace period, visual, milestones. Tags. Dashboard picker. [Deploy]. |

**The RecurringItemBrowser (new shared component):**
- Queries: `tasks WHERE recurrence_rule IS NOT NULL AND status='pending' AND family_id=X`
- Queries: `task_templates WHERE task_type='routine' AND family_id=X`
- Queries: `dashboard_widgets WHERE template_type='checklist' AND family_id=X`
- Groups results: Routines (morning routine, bedtime routine, etc.), School (math practice, reading, etc.), Health (exercise, therapy, etc.), Habits (any daily recurring task), Custom
- Each item shows: name, assignee, frequency, current streak if any exists
- "Don't see what you want? Create it first, then come back." link to relevant creation flow

### 1C. Percentage Wizard (`PercentageWizard.tsx`)

**Covers 3 cards:** Weekly Chore Completion, Responsibility Gauge, Family Chore Race

**Steps:**

| # | Step | What Happens |
|---|---|---|
| 1 | **What are you measuring?** | Pre-filled from preset. "Weekly Chore Completion measures what percentage of assigned tasks were done this week. The number updates automatically." |
| 2 | **Who is this for?** | MemberPillSelector. Family Chore Race forces multiplayer. |
| 3 | **What counts?** | "Which tasks should count toward this percentage?" Options: "All assigned tasks" / "Only routine tasks" / "Only tasks tagged [life area]" / "I'll pick specific tasks." This maps to `calculation_source` config. |
| 4 | **Set the goal** | Default 100%. "Is 80% still a win? You can set the goal lower if that matches your family's expectations." |
| 5 | **Pick a look** | donut_ring (default), responsibility_gauge, progress_circle. |
| 6 | **Connect it** | "Connect to allowance?" (chore completion % drives allowance amount). "Show on Family Overview?" "Add to evening rhythm?" |
| 7 | **Review & Deploy** | Summary. Tags. Dashboard picker. |

### 1D. Checklist Wizard (`ChecklistWizard.tsx`)

**Covers 2 cards:** Evening Checklist, Bedtime Routine

**Steps:**

| # | Step | What Happens |
|---|---|---|
| 1 | **What's the checklist for?** | Pre-filled title. "A checklist that resets fresh each day (or night). Tap each step as it's done." |
| 2 | **Who is this for?** | MemberPillSelector. |
| 3 | **List the steps** | BulkAddWithAI-powered textarea. "Type or paste your checklist — one item per line. Or describe it and we'll help organize it." Preset items pre-filled (Evening: Pack bag, Tidy room, Brush teeth, Lights out. Bedtime: PJs on, Brush teeth, Pick up toys, Story time, Lights out). Drag-to-reorder. |
| 4 | **Pick a look** | standard_checklist (default for evening), card_stack (default for bedtime — "Large tappable cards, great for younger kids"). |
| 5 | **Extras** | "Connect to a routine?" (links checklist widget to a routine template). "Count toward a streak?" (offers to create a streak tracker). "Add a celebration when all items are checked?" |
| 6 | **Review & Deploy** | Summary. Tags. Dashboard picker. |

### 1E. Mood & Check-In Wizard (`MoodCheckInWizard.tsx`)

**Covers 5 cards:** Daily Mood Check-In, Mood Tracker, Sensory Regulation Check-In, Daily Check-In, Sleep Check-In

**Steps:**

| # | Step | What Happens |
|---|---|---|
| 1 | **What are you tracking?** | Pre-filled from preset. Key framing difference: Mood Check-In = "How are you feeling?", Sensory Regulation = "Where is your body right now?" (calibrated for sensory language), Daily Check-In = "Did it happen?" (binary), Sleep = "Did you go to bed on time?" |
| 2 | **Who is this for?** | MemberPillSelector. Privacy default: mood trackers default to "private (not shared)". Mom toggle: "Should this be visible to you?" for kids' trackers. |
| 3 | **Choose the scale** | Per preset: Mood → 5-point emoji faces. Mood Tracker → 7-point color gradient. Sensory → 5-point calibrated (Calm & Ready → Full Meltdown). Daily Check-In → binary yes/no. Sleep → binary yes/no. Visual preview of each scale option. |
| 4 | **Pick a look** | Per preset defaults: Mood → emoji_row_trend, Mood Tracker → color_gradient, Sensory → number_scale, Check-In → simple_toggle, Sleep → calendar_dots. |
| 5 | **Extras** | "Add notes with each entry?" toggle. "Show in morning rhythm?" / "Show in evening rhythm?" "Include in monthly reports?" (for Sensory). "Count toward a streak?" (for Check-In and Sleep). |
| 6 | **Review & Deploy** | Summary. Tags. Dashboard picker. |

### 1F. Sequential Path Wizard (`SequentialPathWizard.tsx`)

**Covers 3 cards:** Curriculum Progress, Skill Mastery Path, Independence Skills Path

**Steps:**

| # | Step | What Happens |
|---|---|---|
| 1 | **What kind of path?** | Pre-filled from preset. Curriculum = "Ordered units or chapters that unlock one at a time." Skill Mastery = "Skill levels from beginner to mastered." Independence = "Life skills building toward independence." |
| 2 | **Who is this for?** | MemberPillSelector. |
| 3 | **Build the steps** | BulkAddWithAI textarea. Pre-filled examples per preset. Curriculum: "Chapter 1, Chapter 2, ...". Skill: "Beginner, Developing, Practicing, Proficient, Mastered". Independence: "Get dressed alone, Make simple meal, Do laundry, ...". AI parse available for curriculum pastes. Drag-to-reorder. |
| 4 | **How do steps advance?** | "When does the next step unlock?" Options: "When mom marks it complete" (manual) / "When the linked task is done" (auto) / "After N practice sessions" (practice_count) / "When mastery is approved" (mastery). Warm explanation of each. |
| 5 | **Pick a look** | staircase (default), mastery_path, progress_dots. |
| 6 | **Extras** | "Add a prize at the end?" (AttachRevealSection). "Reusable for another child later?" toggle. "Connect steps to routine?" (linked step explanation). |
| 7 | **Review & Deploy** | Summary. Tags. Dashboard picker. |

### 1G. Achievement Wizard (`AchievementWizard.tsx`)

**Covers 2 cards:** Badge Collection, XP & Level Up

**Steps (Badge path):**

| # | Step | What Happens |
|---|---|---|
| 1 | **What are the badges for?** | "Custom milestones that don't fit standard tracking. Mom decides when a badge is earned." Examples: "First solo recipe", "Finished a book series", "Mastered cursive", "1 month of kindness". |
| 2 | **Who earns them?** | MemberPillSelector. |
| 3 | **Name your badges** | BulkAddWithAI textarea. "List the badges you want to offer — one per line. You can always add more later." |
| 4 | **Pick a look** | badge_wall (default), shield_grid, ribbon_rack. |
| 5 | **Review & Deploy** | Summary. Tags. Dashboard picker. |

**Steps (XP path):**

| # | Step | What Happens |
|---|---|---|
| 1 | **How does XP work?** | "Every task completion earns XP. When enough XP accumulates, they level up!" Visual preview of the XP bar. |
| 2 | **Who levels up?** | MemberPillSelector. |
| 3 | **Set the levels** | Pre-filled: Apprentice (100 XP), Journeyman (250), Expert (500), Master (1000). Editable names and thresholds. [+ Add Level]. |
| 4 | **How much XP per task?** | Default 10. "Higher XP for harder tasks? You can override per-task later." |
| 5 | **Extras** | "Celebration animation on level-up?" toggle (default on). "Show on Family Hub?" |
| 6 | **Review & Deploy** | Summary. Tags. Dashboard picker. |

### 1H. Money Wizard (`MoneyWizard.tsx`)

**Covers 3 cards:** Weekly Allowance Calculator, Savings Goal, Chore Earnings Tracker

Note: Savings Goal and Chore Earnings are tally-type trackers but the Money wizard groups them with the Allowance Calculator for a coherent "family money" setup experience.

**Steps (Allowance path — most complex):**

| # | Step | What Happens |
|---|---|---|
| 1 | **How does allowance work in your family?** | Three cards with warm descriptions: "Fixed amount each week" / "Earn based on chores completed" / "A mix of both (base amount + bonus for completion)". |
| 2 | **Who gets an allowance?** | MemberPillSelector. Per-child amount if different. |
| 3 | **Set the numbers** | Base amount per child. Pay period (weekly default). If percentage-based: "What counts?" (all tasks / routines only / specific tasks). Bonus threshold: "Get a bonus at 90%+ completion?" |
| 4 | **What about deductions?** | "Can kids spend from their balance?" toggle. "Loan system?" toggle (with simple explanation). |
| 5 | **Pick a look** | summary_card (default). Visual showing what the kid will see on their dashboard. |
| 6 | **Extras** | "Add a Weekly Chore Completion tracker?" (auto-creates percentage widget). "Add a Privilege Status display?" (color zones based on completion). "Connect to Savings Goal?" |
| 7 | **Review & Deploy** | Summary per child. Tags. Dashboard picker. |

### 1I. Remaining Single Wizards

**Countdown Wizard** — simple: Name → Date → Emoji → Recurring? → Deploy. Already decent in current form but wrap in wizard shell for consistency.

**Timer Duration Wizard** (Homeschool Hours) — Name → Subjects (multi-input with suggested defaults) → Weekly goal per subject (optional) → Timer mode (manual/start-stop/both) → "Connect to homework tracking?" → Deploy.

**Snapshot Comparison Wizard** (Typing Speed) — Name → What metric? → Unit → How often to snapshot? → Show personal best? → Deploy.

**Leaderboard Wizard** — Name → What metric? (tasks/points/streak/custom) → Who competes? (MemberPillSelector, multiplayer forced) → Period → "Visible to kids?" toggle → Deploy.

**Privilege Status Wizard** — "What are the zones?" → Red/Yellow/Green thresholds and descriptions in warm language ("When things are going great" / "Time to step it up" / "Let's have a conversation"). → Who? → Calculation period → Deploy. Extra explanation: "This is visibility only — it never blocks anything."

---

## Phase 2: List Wizards

### Design Philosophy

Lists are deceptively similar in structure but serve very different mental models. A Shopping List and an Expenses-on-Horizon list are both "items with prices" — but one is "what do I need to buy this week?" and the other is "what should our family budget for?" The wizard's job is to match the mental model, not the data structure.

### 2A. Shopping List Wizard (`ShoppingListWizard.tsx`)

**Variations:** Master Family Shopping List, Quick Trip List, Meal Prep List

**Steps:**

| # | Step | What Happens |
|---|---|---|
| 1 | **What kind of shopping list?** | Three cards: "Master Family List" (always-on, shared, anyone can add) / "Trip List" (specific store or errand) / "Meal Prep" (recipes → ingredients). |
| 2 | **Who can add to it?** | MemberPillSelector. Master list defaults to all family members. Trip/Meal Prep defaults to mom only. "Shared means anyone in the family can add items from their phone." |
| 3 | **Set up sections** | Master list: pre-filled store sections (Produce, Dairy, Meat, Pantry, Frozen, Household, Other). Trip list: "Which store?" → auto-suggests sections based on store type. Meal Prep: "Paste a recipe or describe what you're making" → AI parses into categorized ingredient list. All editable. [+ Add Section]. |
| 4 | **Smart features** | "Auto-sort items into sections?" toggle. "Show price estimates?" toggle. "Bulk add from a recipe or brain dump?" → BulkAddWithAI. |
| 5 | **Extras** | "Victory when the list is all checked off?" toggle. "Connect to a budget tracker?" |
| 6 | **Review & Deploy** | Summary. Tags (shopping, groceries, meal_prep, etc.). |

### 2B. Expenses on Horizon Wizard (`ExpenseHorizonWizard.tsx`)

**A budgeting-focused list where items are categorized for awareness, not organized by store.**

**Steps:**

| # | Step | What Happens |
|---|---|---|
| 1 | **What is this list for?** | "Track upcoming expenses your family needs to plan for. Not a shopping trip — a budget awareness tool. Things can sit here for weeks or months until it's time to buy." |
| 2 | **Set up categories** | Pre-filled: Home & Maintenance, School, Medical, Activities, Clothing, Big Purchases, Other. Editable. [+ Add Category]. (These are CATEGORIES not store sections — the key difference from Shopping.) |
| 3 | **Add some items** | Per-category item entry. Each item: name, estimated price, priority (need soon / can wait / nice to have), optional notes. BulkAddWithAI: "Dump everything you've been thinking about needing to buy." |
| 4 | **Who can see and add?** | MemberPillSelector. Default: mom + dad. "Teens can add requests?" toggle. |
| 5 | **Views** | "How do you want to see this?" Options: "By category" (default) / "By priority" / "By estimated cost (highest first)". |
| 6 | **Extras** | "Set a monthly budget cap?" (optional alert when total exceeds amount). "Export as a printable list?" |
| 7 | **Review & Deploy** | Summary with estimated total. Tags (budget, expenses, planning). |

### 2C. School Expenses Wizard (`SchoolExpenseWizard.tsx`)

**Track what's owed by student, by school/program, or by activity.**

**Steps:**

| # | Step | What Happens |
|---|---|---|
| 1 | **What is this for?** | "Track school-related expenses — tuition, materials, activities, field trips. See what's owed per child, per program, or per activity at a glance." |
| 2 | **Which children?** | MemberPillSelector filtered to school-age members. |
| 3 | **Programs & Activities** | Per child: "What programs or activities are they in?" Multi-input: co-op name, tutoring, sports, music, etc. Shared programs auto-link across children (e.g., "Classical Conversations" entered once, both kids associated). |
| 4 | **Add expenses** | Per-program expense entry: description, amount, frequency (one-time / monthly / annual / per-semester), paid status. BulkAddWithAI: "Paste your enrollment fees, supply lists, or registration costs." |
| 5 | **Views** | "By child" (see total per kid) / "By program" (see total per activity) / "By due date" (what's coming up). Mom picks default view. |
| 6 | **Extras** | "Connect to ESA reporting?" (for families tracking Education Savings Account). "Export for tax records?" |
| 7 | **Review & Deploy** | Summary with totals per child and per program. Tags (school, expenses, homeschool, esa). |

### 2D. Standard List Wizards

These share a `StandardListWizard.tsx` with presets, similar to how tally shares one component:

**Packing List:**
Steps: What trip? → Pre-filled categories (Clothing, Toiletries, Gear, Documents, Snacks) → Add items → Share with family? → Save as template for future trips? → Deploy.

**Wishlist:**
Steps: Whose wishlist? → Add items (name, URL, price, size/color notes) → "Share with gift-givers?" → "Show total estimated cost?" → Deploy.

**Prayer List:**
Steps: Quiet, warm framing ("A space to hold what matters") → Add names or intentions → Private by default → "Include in LiLa context?" toggle (with explanation of what that means) → Deploy.

**To-Do List:**
Steps: What's this list about? → Brain dump items → "Any of these should become real tasks?" → [Promote to Task] per item → Deploy.

**Custom List:**
Steps: Name it → Describe what it's for → Add items → "Need sections/categories?" → "Share with others?" → Deploy.

### 2E. Opportunity Board Wizard (`OpportunityWizard.tsx`)

**This is one of the most important wizards — it's how mom sets up earning opportunities for kids.**

**Steps:**

| # | Step | What Happens |
|---|---|---|
| 1 | **What kind of opportunities?** | Three cards with real-life descriptions and examples: |
| | | **"Claim and Do"** (claimable) — "Post jobs kids can browse. First to claim it, locked for a set time. Think: extra chores they can pick up for cash." Examples: Clean the garage ($5), Organize the playroom ($3), Help with dinner ($2). |
| | | **"Always Available"** (repeatable) — "Jobs that can be done over and over. Great for recurring extra work." Examples: Empty the dishwasher ($1 each time), 30 min of reading ($0.50). |
| | | **"Limited Edition"** (capped) — "Jobs with a max number of completions. Once they're done, they're done." Examples: Organize the holiday decorations (2 max), Deep clean the bathroom (1 per month). |
| 2 | **Who can see these?** | MemberPillSelector. "Which family members can browse and claim from this board?" |
| 3 | **Add jobs** | BulkAddWithAI textarea. "List the jobs you want to offer — one per line. Include a dollar amount if you want." AI parses into structured items with suggested amounts. Per-item fields: name, description, reward (dollars / stars / both), category (quick / medium / big / connection). For claimable: lock duration. For capped: max completions. |
| 4 | **Completion rules** | "Does mom need to approve before the reward is given?" toggle (default on). "Can kids add photos as evidence?" toggle. |
| 5 | **Connect it** | "Deploy a tracker widget that shows earnings?" (auto-creates Chore Earnings tally). "Add jobs to a randomizer spinner?" (auto-creates linked randomizer). "Count toward allowance calculations?" |
| 6 | **Review & Deploy** | Summary: N jobs, total possible earnings, assigned to X children. Tags (chores, earning, opportunities). Dashboard deploy. |

### 2F. Sequential Collection Wizard (`SequentialWizard.tsx`)

**Enhanced version of the existing SequentialCreatorModal, now with wizard framing.**

**Steps:**

| # | Step | What Happens |
|---|---|---|
| 1 | **What is this sequence?** | Preset options: "Curriculum / Textbook chapters" / "Reading List" / "Tutorial series" / "Skill progression" / "Custom sequence". Each with description and example. |
| 2 | **Who is this for?** | MemberPillSelector. |
| 3 | **Add the items** | BulkAddWithAI + CurriculumParse. "Paste your table of contents, curriculum outline, or book list." AI parses into ordered items with URLs, notes. Drag-to-reorder. |
| 4 | **How do items advance?** | "Complete and move on" (default) / "Practice N times then advance" / "Master it (mom approves)". Per-item override available. "Track time spent?" toggle. |
| 5 | **How many at once?** | "One at a time" (default for reading) / "2-3 active" / "Custom number". "How does the next one unlock?" — immediately / next day / manual promotion. |
| 6 | **Connect it** | "Link to a routine step?" (explanation: "The current item will appear inside a daily routine as a linked step"). "Add a streak counter?" "Reusable for another child/year?" |
| 7 | **Review & Deploy** | Summary with item count, advancement mode, linked connections. Tags. |

### 2G. Randomizer Wizard (`RandomizerWizard.tsx`)

**Steps:**

| # | Step | What Happens |
|---|---|---|
| 1 | **What's in the mix?** | Preset options: "Activity Picker" (what to do) / "Extra Jobs" (chores to draw) / "Reward Wheel" (prizes) / "Consequence Picker" (gentle accountability) / "Dinner Decider" / "Custom randomizer". Each with warm description. |
| 2 | **Add the items** | BulkAddWithAI textarea. Per-preset suggestions. Items can be repeatable or one-time. Drag-to-reorder for weighting. |
| 3 | **How does it draw?** | Three visual cards: "Pick One" (focused — draw one, locked until done) / "Pick a Few" (buffet — N active at once) / "Surprise Me" (auto-draw daily, same item all day). |
| 4 | **Who uses it?** | MemberPillSelector. |
| 5 | **Extras** | "Deploy a spinner widget on the dashboard?" (auto-creates randomizer_spinner). "Link to a routine step?" (Surprise Me auto-draws for that routine). "Add reward reveals to certain items?" "Track mastery on items?" (mastery mode). |
| 6 | **Review & Deploy** | Summary. Tags. |

---

## Phase 3: Connecting Lists to Tasks & Routines

This phase adds the "glue" wizards that help mom wire existing things together.

### 3A. "Connect to Routine" Flow

Available from: any list detail page, any sequential collection, any randomizer.

**Steps:**

| # | Step | What Happens |
|---|---|---|
| 1 | **Which routine?** | Browse existing routines for the assigned member. "Don't have one yet? [Create a routine first]." |
| 2 | **Which section?** | Pick the routine section where the linked content should appear (Morning, School, Evening, etc.). |
| 3 | **Confirm** | "Each day, the current item from [List Name] will appear in the [Section] section of [Routine Name]. Completing it advances to the next item." [Connect] button. |

### 3B. "Add Streak to This" Flow

Available from: any routine detail, any recurring task, any daily habit widget.

**Steps:**

| # | Step | What Happens |
|---|---|---|
| 1 | **Confirm what you're streaking** | Shows the item name, frequency, current assignee. |
| 2 | **Grace period** | Same as Streak Wizard step 3. |
| 3 | **Pick a look** | Same as Streak Wizard step 4. |
| 4 | **Deploy** | Creates streak widget linked to the source item. Tags auto-filled from source. |

### 3C. "Attach Rewards" Flow

Available from: any task, any list, any tracker widget, any routine.

**Steps:**

| # | Step | What Happens |
|---|---|---|
| 1 | **What kind of reward?** | "Celebration animation" (free, just a sparkle/confetti) / "Reveal animation" (pick from 4: Card Flip, Three Doors, Spinner Wheel, Scratch Off) / "Prize description" (text that shows after reveal). |
| 2 | **When does it trigger?** | Per-source context: "When the task is completed" / "When the goal is reached" / "At every [N] milestone" / "When the list is all checked off". |
| 3 | **Configure** | AttachRevealSection (already built) — animation picker, prize editor, congratulations message. |
| 4 | **Confirm** | Preview of what the child will see. [Attach Reward]. |

### 3D. "Deploy to Dashboards" Flow

Available from: any tracker/widget detail view.

**Steps:**

| # | Step | What Happens |
|---|---|---|
| 1 | **Where should this show?** | Member pill buttons for each family member's dashboard. Mom's dashboard. Family Hub. "Everywhere" shortcut. Current deployments shown as already-selected. |
| 2 | **Size on each dashboard** | Per-destination size picker (S/M/L). Default from widget config. |
| 3 | **Confirm** | "This will appear on [N] dashboards." [Deploy]. |

---

## Phase 4: Growth Feature Wizards

### 4A. Guiding Stars Wizard (`GuidingStarsWizard.tsx`)

**Entry point:** First visit to /guiding-stars with 0 stars, OR "Guiding Stars" card in Studio Growth section, OR LiLa suggests it.

**Steps:**

| # | Step | What Happens |
|---|---|---|
| 1 | **What are Guiding Stars?** | Warm intro: "Guiding Stars are the values, beliefs, and declarations that guide your family. They're the things you come back to when life gets noisy. LiLa uses them to give advice that sounds like YOU, not a generic chatbot." |
| 2 | **Your values** | "What matters most to you? Pick a few that resonate, or write your own." Pre-loaded: grid of 20+ common values (Faith, Family first, Kindness, Education, Hard work, Creativity, Service, Health, Adventure, Gratitude, Patience, Growth, Integrity, Joy, Simplicity, etc.). Tap to select. Each selected value becomes a Guiding Star with `entry_type='value'`. [+ Write my own] adds a text input. |
| 3 | **Your declarations** | "What's something you believe deeply — about yourself, your family, or how you want to live?" Examples from "other moms": "We choose connection over perfection." "I am doing better than I think I am." "Learning is a lifestyle, not a schedule." "Our home is a place of peace, even on the hard days." Free-text input with [+ Add another]. |
| 4 | **Scripture or quotes** | "Any verses, quotes, or sayings that anchor you?" Optional step. Free-text input. These get `entry_type='scripture_quote'`. |
| 5 | **Family stars** | "Want to add any Guiding Stars for the whole family?" Toggle: "These will be visible to all family members." Same value picker + free text, but `owner_type='family'`. |
| 6 | **Review** | All stars grouped by type (Values, Declarations, Quotes, Family). Each editable inline. "LiLa will draw from these [N] stars when helping you. You can add, edit, or remove anytime at /guiding-stars." [Save All]. |

### 4B. Best Intentions Wizard (`BestIntentionsWizard.tsx`)

**Entry point:** First visit to /best-intentions with 0 intentions, OR Studio card, OR LiLa.

**Steps:**

| # | Step | What Happens |
|---|---|---|
| 1 | **What are Best Intentions?** | "Best Intentions are the things that keep coming to mind — things you know you could or should be doing, but they keep getting lost in the shuffle of mom life. They're not tasks. They're patterns you want to build." |
| 2 | **What keeps coming to mind?** | "What are some things that keep nudging at you? Things you want to do more of, less of, or differently?" Free-text multi-input. Each entry becomes a Best Intention. |
| 3 | **Ideas from other moms** | Scrollable idea gallery (these are curated by the founder/platform): "Drink enough water", "Read to the kids more", "Pray with my husband", "Say yes to spontaneous play", "Less phone, more presence", "Move my body every day", "Practice patience with [child]", "Speak life over my kids", "Date nights more often", "Let imperfect be enough". Each tappable to add (editable before saving). "These are just starting points — your intentions are yours." |
| 4 | **How do you want to track?** | Per intention: tracker style picker (counter / bar graph / streak). "Tap once each time you practice this intention. Over time, the pattern tells a story." |
| 5 | **Family intentions?** | "Want to add any intentions for the whole family?" Same flow but `owner_type='family'`, visible on Family Hub. |
| 6 | **Review** | All intentions listed. Each editable. Total count. "Tap the heart anytime you practice one. LiLa will celebrate your patterns." [Save All]. |

### 4C. InnerWorkings Wizard (`InnerWorkingsWizard.tsx`)

**Entry point:** First visit to /inner-workings, OR Studio Growth card, OR LiLa.

**Steps:**

| # | Step | What Happens |
|---|---|---|
| 1 | **What are InnerWorkings?** | "This is where you (and your family) store what makes each person tick — personality types, strengths, growth areas, traits, and preferences. LiLa uses this to give advice that actually fits the person, not generic advice." |
| 2 | **Do you know your personality type?** | Cards for common frameworks: "Enneagram" / "Myers-Briggs (MBTI)" / "StrengthsFinder" / "DISC" / "Love Languages" / "Other" / "I don't know mine yet" / "I'll skip this for now". Selecting a framework shows a text input: "What's your type?" (e.g., "Enneagram 1" or "INFJ"). Creates `self_knowledge` entry with `category='personality_type'`. |
| 3 | **Quick traits check** | "Which of these sound like you?" A grid of 30+ traits organized into groups (Thinking Style, Social Style, Energy, Decision Making, Emotional Style). Each trait is a toggle: "Not me / Sort of / Neutral / Mostly me / That's me!" Only "Mostly me" and "That's me!" get saved as `self_knowledge` entries with `category='trait_tendency'`. Fast, visual, low-friction. |
| 4 | **Strengths** | "What are you really good at? (Even if you don't always feel like it.)" Free-text multi-input. Examples: "Organizing chaos", "Seeing what people need", "Making hard things fun", "Researching until I find the answer". `category='strength'`. |
| 5 | **Growth areas** | "Where are you actively working on yourself? (No shame — this is about intention, not failure.)" Free-text multi-input. Warm framing. `category='growth_area'`. |
| 6 | **For your kids?** | "Want to do this for a family member too?" MemberPillSelector. If yes → restarts at step 2 for that member (age-appropriate trait grid for kids). Mom fills it in for younger kids; older kids can do it themselves later. |
| 7 | **Review** | All entries grouped by category. Each editable. Heart toggles for LiLa context inclusion. [Save All]. |

### 4D. Archives Setup Wizard (`ArchivesSetupWizard.tsx`)

**Entry point:** First visit to /archives for a family member, OR settings, OR LiLa "tell me about [child]" when context is sparse.

**Steps:**

| # | Step | What Happens |
|---|---|---|
| 1 | **What are Archives?** | "Archives is where LiLa learns about each family member. The more context she has, the more specific and helpful she can be. Everything here is controlled by you — you decide what LiLa can and can't see." |
| 2 | **Pick a person** | MemberPillSelector. Their 7 system archive folders shown as cards. |
| 3 | **Quick fill** | Per-folder guided fill. Each folder shows 3-5 starter prompts: |
| | | **Preferences:** "Favorite foods?", "Favorite colors?", "What do they hate?", "Allergies or restrictions?" |
| | | **Schedule & Activities:** "What are they enrolled in?", "Weekly rhythm?", "Regular appointments?" |
| | | **Personality & Traits:** "How would you describe them in 3 words?", "What makes them light up?", "What triggers meltdown?" |
| | | **Interests & Hobbies:** "Current obsessions?", "What do they want to learn?", "Favorite books/shows?" |
| | | **School & Learning:** "Grade level?", "Learning style?", "Curriculum?", "Strengths and struggles?" |
| | | **Health & Medical:** "Diagnoses?", "Medications?", "Sensory profile?", "Therapies?" |
| | | **General:** Catch-all for anything else. |
| | | Each prompt has a text input. Filled entries create `archive_context_items` in the matching folder. Empty prompts skipped — no pressure. |
| 4 | **Privacy check** | "Anything in Health & Medical is automatically privacy-filtered — other family members can't see it in LiLa conversations even if they have context access." Explanation of the Heart toggle. |
| 5 | **Another person?** | "Want to fill in context for another family member?" Loops back to step 2. |
| 6 | **Summary** | "[N] context items added for [member names]. LiLa now knows more about your family." |

### 4E. Getting to Know [Person] Wizard

**Already built as `GetToKnowWizard.tsx`.** Review for expansion:
- Currently covers 6 connection categories (Gift Ideas, Meaningful Words, Helpful Actions, Quality Time, Sensitivities, Comfort Needs)
- Consider merging or cross-linking with the Archives wizard — Getting to Know generates `self_knowledge` entries that could also populate archive folders
- Add: "Want to share these answers with [person]'s Archive?" toggle on summary step

---

## Phase 5: First-Visit Feature Discovery

Every major feature page gets a first-visit detection: if the user has zero records for that feature, show a warm welcome card with two options: **[Set Up with Wizard]** and **[I'll explore on my own]**. The wizard option opens the relevant wizard from above. The "explore" option dismisses the card permanently (stored in `dashboard_configs.preferences.wizard_dismissed_[feature]`).

**Pages that get first-visit detection:**

| Page | Wizard Opens | Condition |
|---|---|---|
| /guiding-stars | GuidingStarsWizard | 0 guiding_stars for member |
| /best-intentions | BestIntentionsWizard | 0 best_intentions for member |
| /inner-workings | InnerWorkingsWizard | 0 self_knowledge for member |
| /archives | ArchivesSetupWizard | 0 archive_context_items for member |
| /tasks | RoutineBuilderWizard | 0 tasks for family (first time) |
| /lists | ShoppingListWizard | 0 lists for family |
| /meetings | MeetingSetupWizard | 0 meeting_schedules for family |
| /trackers | TallyWizard (generic) | 0 dashboard_widgets for member |
| /calendar | (calendar event wizard) | 0 calendar_events for family |
| /victories | (record first victory) | 0 victories for member |

---

## Implementation Strategy

### Build Order

| Phase | Scope | Estimated Wizards | Priority |
|---|---|---|---|
| **1a** | Tally + Streak + Star Chart (enhance existing) | 3 wizard components, ~15 preset cards | Highest — most used trackers |
| **1b** | Percentage + Checklist + Mood + Sequential Path | 4 wizard components, ~13 preset cards | High |
| **1c** | Achievement + Money + remaining singles | 4 wizard components, ~9 preset cards | Medium |
| **2a** | Shopping + Expenses + School Expenses | 3 wizard components | High — lists are daily-use |
| **2b** | Opportunity Board + Sequential + Randomizer | 3 wizard components | High — key family tools |
| **2c** | Standard lists (Packing, Wishlist, Prayer, etc.) | 1 shared component, 5 presets | Medium |
| **3** | Connection flows (Routine, Streak, Rewards, Dashboard) | 4 small flow components | Medium — glue layer |
| **4a** | Guiding Stars + Best Intentions | 2 wizard components | High — core identity |
| **4b** | InnerWorkings + Archives | 2 wizard components | Medium |
| **5** | First-visit detection across all pages | Config + detection logic | Medium — polish |

### Shared Component Build Order (before any wizard)

1. `WizardProgressSaver` — localStorage persistence
2. `WizardTagPicker` — tag selector for final step
3. `ConnectionOffersPanel` — "want to connect this to..." section
4. `DashboardDeployPicker` — multi-dashboard deployment
5. `RecurringItemBrowser` — for universal streak wizard

### Architecture Notes

- Every wizard extends `SetupWizard.tsx` (already built, proven pattern)
- Wizard state is a single `useState<WizardState>` object, persisted to localStorage via `WizardProgressSaver` on every change
- Each wizard component is self-contained: owns its state, calls its own deploy hook, handles its own success/error
- Presets are TypeScript constants in `src/components/studio/wizards/presets/` (one file per wizard family)
- Studio cards link to wizards via `wizardId` field on `StudioTemplate` type — the Studio page's `handleCustomize` checks for `wizardId` first, falls back to raw modal
- Tags written to the created record's `tags` field (already exists on `lists`, `tasks`, `dashboard_widgets.widget_config.tags`)

---

## Open Questions for Founder

1. **Progress persistence scope:** localStorage per browser, or Supabase `dashboard_configs.preferences.wizard_draft_[id]`? localStorage is simpler but doesn't survive device switches. Supabase survives but adds complexity. **Recommendation:** localStorage for Phase 1, Supabase persistence as a Phase 5 polish item.

2. **Personality test flow (InnerWorkings step 3):** The "Quick traits check" grid is a lightweight version. Do you want actual validated personality test questionnaires built in (e.g., a simplified Enneagram self-assessment, a Big Five quick test)? Or is the trait-toggle grid + "upload your type" sufficient for now? **Recommendation:** Trait grid + upload for Phase 4, actual assessments as a future AI Vault content item.

3. **"Ideas from other moms" for Best Intentions:** The curated gallery needs founder-authored content. Should I draft a list of 20-30 best intention ideas, or do you want to author those yourself? **Recommendation:** I draft, you edit.

4. **Opportunity Board wizard scope:** The current `opportunity_claimable`/`opportunity_repeatable`/`opportunity_capped` live in `task_templates` and `tasks`, not in `lists`. The wizard needs to create tasks, not list items. Should the wizard create a task template + individual task instances, or should it create a single "board" container with child jobs? **Recommendation:** Creates a `task_template` with `task_type` matching the opportunity sub-type, then deploys task instances per-job — matching the existing architecture.

5. **School Expenses list:** This is essentially an `expenses` list type with student-level tagging. Should it be a new `list_type` value (e.g., `school_expenses`), or an `expenses` list with a `context='school'` tag and category-based grouping? **Recommendation:** Same `expenses` list type, wizard pre-configures sections as student names + school programs. The view-by-student/school/activity is a frontend filter, not a separate type.

6. **Which growth wizards should be available from Studio vs. only from the feature page?** Studio could show "Set up Guiding Stars" and "Start Best Intentions" cards, or those could only appear as first-visit prompts on /guiding-stars and /best-intentions. **Recommendation:** Both — Studio has the cards in the "Growth & Self-Knowledge" section, AND first-visit detection shows them on the feature page. Two entry points for the same wizard.

7. **Wizard count in the Studio badge:** Currently shows "39" for Trackers & Widgets. After Phase 1, each tracker card opens a wizard instead of the generic form. Should the badge still count individual cards, or should we consolidate duplicates (e.g., "Reading Log" and "Reading Log (Books)" are currently both shown)? **Recommendation:** Consolidate duplicates, but keep separate entry points for genuinely different use cases (e.g., "Reading Log" and "Family Reading Race" stay separate even though both are tally type).
